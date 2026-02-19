-- PDF Import Pipeline Migration
-- Enables tour operators to upload PDF brochures for AI extraction

-- =====================================================
-- TABLE: pdf_imports
-- Tracks all PDF import attempts with extraction status
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pdf_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- PDF File Information
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_size_bytes BIGINT,
    file_hash TEXT, -- MD5/SHA256 for deduplication

    -- Import Status
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN (
        'uploaded',      -- PDF uploaded, waiting for extraction
        'extracting',    -- AI extraction in progress
        'extracted',     -- AI extraction complete, waiting for review
        'reviewing',     -- Operator is reviewing
        'approved',      -- Operator approved, ready to publish
        'published',     -- Published to tour_templates
        'rejected',      -- Operator rejected
        'failed'         -- Extraction failed
    )),

    -- Extracted Data (JSON from GPT-4o Vision)
    extracted_data JSONB, -- Raw extraction result
    extraction_confidence DECIMAL(3,2), -- 0-1 confidence score
    extraction_error TEXT, -- Error message if extraction failed

    -- Operator Review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Publishing
    published_template_id UUID REFERENCES public.tour_templates(id),
    published_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_pdf_imports_org_id ON public.pdf_imports(organization_id);
CREATE INDEX idx_pdf_imports_status ON public.pdf_imports(status);
CREATE INDEX idx_pdf_imports_created_at ON public.pdf_imports(created_at DESC);
CREATE INDEX idx_pdf_imports_file_hash ON public.pdf_imports(file_hash) WHERE file_hash IS NOT NULL;

-- RLS Policies
ALTER TABLE public.pdf_imports ENABLE ROW LEVEL SECURITY;

-- Users can view PDF imports from their organization
CREATE POLICY "Users can view own organization PDF imports"
    ON public.pdf_imports
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- Admins can insert PDF imports for their organization
CREATE POLICY "Admins can create PDF imports"
    ON public.pdf_imports
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update PDF imports (review, approve, reject)
CREATE POLICY "Admins can update own organization PDF imports"
    ON public.pdf_imports
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- TABLE: pdf_extraction_queue
-- Queue for processing PDF extractions asynchronously
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pdf_extraction_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_import_id UUID NOT NULL REFERENCES public.pdf_imports(id) ON DELETE CASCADE,

    -- Queue Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',    -- Waiting to be processed
        'processing', -- Currently being processed
        'completed',  -- Successfully processed
        'failed'      -- Processing failed
    )),

    -- Processing Info
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    last_error TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_extraction_queue_status ON public.pdf_extraction_queue(status);
CREATE INDEX idx_pdf_extraction_queue_created_at ON public.pdf_extraction_queue(created_at);

-- =====================================================
-- FUNCTION: Auto-update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_pdf_import_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pdf_imports_updated_at
    BEFORE UPDATE ON public.pdf_imports
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_import_updated_at();

CREATE TRIGGER trigger_pdf_extraction_queue_updated_at
    BEFORE UPDATE ON public.pdf_extraction_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_import_updated_at();

-- =====================================================
-- FUNCTION: Create extraction queue item on PDF upload
-- =====================================================

CREATE OR REPLACE FUNCTION create_extraction_queue_item()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new PDF is uploaded, add it to extraction queue
    IF NEW.status = 'uploaded' THEN
        INSERT INTO public.pdf_extraction_queue (pdf_import_id)
        VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_extraction_queue
    AFTER INSERT ON public.pdf_imports
    FOR EACH ROW
    EXECUTE FUNCTION create_extraction_queue_item();

-- =====================================================
-- FUNCTION: Get pending PDF extractions (for worker)
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_pdf_extractions(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    queue_id UUID,
    pdf_import_id UUID,
    file_url TEXT,
    file_name TEXT,
    organization_id UUID,
    attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id as queue_id,
        q.pdf_import_id,
        p.file_url,
        p.file_name,
        p.organization_id,
        q.attempts
    FROM public.pdf_extraction_queue q
    JOIN public.pdf_imports p ON p.id = q.pdf_import_id
    WHERE q.status = 'pending'
    AND q.attempts < q.max_attempts
    ORDER BY q.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Mark extraction as processing
-- =====================================================

CREATE OR REPLACE FUNCTION start_pdf_extraction(p_queue_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    -- Update queue status to processing
    UPDATE public.pdf_extraction_queue
    SET
        status = 'processing',
        last_attempt_at = NOW(),
        attempts = attempts + 1
    WHERE id = p_queue_id
    AND status = 'pending';

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    -- Update PDF import status
    IF v_updated THEN
        UPDATE public.pdf_imports
        SET status = 'extracting'
        WHERE id = (
            SELECT pdf_import_id FROM public.pdf_extraction_queue
            WHERE id = p_queue_id
        );
    END IF;

    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Complete extraction (success)
-- =====================================================

CREATE OR REPLACE FUNCTION complete_pdf_extraction(
    p_queue_id UUID,
    p_extracted_data JSONB,
    p_confidence DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pdf_import_id UUID;
BEGIN
    -- Get PDF import ID
    SELECT pdf_import_id INTO v_pdf_import_id
    FROM public.pdf_extraction_queue
    WHERE id = p_queue_id;

    -- Update queue status
    UPDATE public.pdf_extraction_queue
    SET status = 'completed'
    WHERE id = p_queue_id;

    -- Update PDF import with extracted data
    UPDATE public.pdf_imports
    SET
        status = 'extracted',
        extracted_data = p_extracted_data,
        extraction_confidence = p_confidence
    WHERE id = v_pdf_import_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Fail extraction (error)
-- =====================================================

CREATE OR REPLACE FUNCTION fail_pdf_extraction(
    p_queue_id UUID,
    p_error TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pdf_import_id UUID;
    v_attempts INTEGER;
    v_max_attempts INTEGER;
BEGIN
    -- Get queue info
    SELECT pdf_import_id, attempts, max_attempts
    INTO v_pdf_import_id, v_attempts, v_max_attempts
    FROM public.pdf_extraction_queue
    WHERE id = p_queue_id;

    -- Update queue with error
    UPDATE public.pdf_extraction_queue
    SET
        status = CASE
            WHEN attempts >= max_attempts THEN 'failed'
            ELSE 'pending' -- Retry
        END,
        last_error = p_error
    WHERE id = p_queue_id;

    -- Update PDF import if max attempts reached
    IF v_attempts >= v_max_attempts THEN
        UPDATE public.pdf_imports
        SET
            status = 'failed',
            extraction_error = p_error
        WHERE id = v_pdf_import_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get PDF import statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_pdf_import_stats(p_organization_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_imports BIGINT,
    uploaded_count BIGINT,
    extracting_count BIGINT,
    extracted_count BIGINT,
    reviewing_count BIGINT,
    approved_count BIGINT,
    published_count BIGINT,
    rejected_count BIGINT,
    failed_count BIGINT,
    avg_confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_imports,
        COUNT(*) FILTER (WHERE status = 'uploaded') as uploaded_count,
        COUNT(*) FILTER (WHERE status = 'extracting') as extracting_count,
        COUNT(*) FILTER (WHERE status = 'extracted') as extracted_count,
        COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        AVG(extraction_confidence) as avg_confidence
    FROM public.pdf_imports
    WHERE (p_organization_id IS NULL OR organization_id = p_organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Add comments for documentation
-- =====================================================

COMMENT ON TABLE public.pdf_imports IS 'Tracks PDF brochure imports for AI extraction into tour templates';
COMMENT ON TABLE public.pdf_extraction_queue IS 'Asynchronous queue for processing PDF extractions with retry logic';
COMMENT ON COLUMN public.pdf_imports.extracted_data IS 'JSONB containing structured tour template data extracted by GPT-4o Vision';
COMMENT ON COLUMN public.pdf_imports.extraction_confidence IS 'AI confidence score 0-1 for extraction quality';
COMMENT ON FUNCTION get_pending_pdf_extractions IS 'Returns PDFs waiting for AI extraction processing';
COMMENT ON FUNCTION start_pdf_extraction IS 'Marks a PDF extraction as in-progress to prevent duplicate processing';
COMMENT ON FUNCTION complete_pdf_extraction IS 'Saves successful extraction results and marks for operator review';
COMMENT ON FUNCTION fail_pdf_extraction IS 'Handles extraction failures with automatic retry logic';
