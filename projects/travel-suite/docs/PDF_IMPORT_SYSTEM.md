# PDF Import Pipeline Documentation

## Overview

The PDF Import Pipeline enables tour operators to upload professional PDF brochures and have them automatically extracted into structured tour templates using GPT-4o Vision AI.

**Workflow:**
1. **Upload** → Operator uploads PDF brochure
2. **Extract** → AI automatically extracts structured data
3. **Review** → Operator reviews and edits extracted data
4. **Approve** → Operator approves for publishing
5. **Publish** → Template added to unified knowledge base

## Architecture

### Database Schema

#### `pdf_imports` Table
Tracks all PDF uploads and their extraction status.

**Key Fields:**
- `id` (UUID): Unique import ID
- `organization_id` (UUID): Which operator uploaded this
- `file_name`, `file_url`, `file_hash`: PDF file details
- `status`: Current workflow status
- `extracted_data` (JSONB): AI-extracted template data
- `extraction_confidence` (0-1): AI confidence score
- `reviewed_by`, `reviewed_at`: Review audit trail
- `published_template_id`: Link to published template

**Status Flow:**
```
uploaded → extracting → extracted → reviewing → approved → published
           ↓            ↓                        ↓
         failed       failed                 rejected
```

#### `pdf_extraction_queue` Table
Async processing queue with retry logic.

**Features:**
- Automatic retry on failures (max 3 attempts)
- Processing status tracking
- Error logging for debugging

### AI Extraction Process

**Technology:** GPT-4o with vision capabilities

**Extraction Logic:**
1. PDF uploaded to Supabase Storage
2. Queue item created automatically (database trigger)
3. Worker fetches pending extractions
4. GPT-4o Vision analyzes PDF pages
5. Structured JSON extracted matching template schema
6. Confidence score calculated (0-1)
7. Result saved for operator review

**Confidence Score Factors:**
- Required fields present (40%): name, destination, days, description
- Days & activities quality (30%): completeness, detail level
- Accommodations (10%): hotel details present
- Inclusions/Exclusions (10%): listed clearly
- Pricing (10%): base price available

**High confidence (>0.7):** Good quality, minimal editing needed
**Medium confidence (0.4-0.7):** Acceptable, some editing recommended
**Low confidence (<0.4):** Poor extraction, major editing required

## API Endpoints

### Upload PDF

**Endpoint:** `POST /api/admin/pdf-imports/upload`

**Request:**
```typescript
Content-Type: multipart/form-data

{
  file: File (PDF, max 10MB),
  organizationId: string (UUID)
}
```

**Response:**
```json
{
  "success": true,
  "pdf_import": {
    "id": "uuid",
    "file_name": "Kenya Safari 2026.pdf",
    "status": "uploaded",
    "created_at": "2026-02-19T15:30:00Z"
  },
  "message": "PDF uploaded successfully. AI extraction will begin shortly."
}
```

**Error Cases:**
- 400: Invalid file type (not PDF) or file too large (>10MB)
- 401: Not authenticated
- 409: Duplicate file (same hash already imported)

### List Imports

**Endpoint:** `GET /api/admin/pdf-imports`

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `status` (optional): Filter by status
- `limit` (default: 50): Results per page
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "imports": [
    {
      "id": "uuid",
      "file_name": "Kenya Safari.pdf",
      "status": "extracted",
      "extraction_confidence": 0.85,
      "created_at": "2026-02-19T15:30:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### Get Import Details

**Endpoint:** `GET /api/admin/pdf-imports/{id}`

**Response:**
```json
{
  "success": true,
  "pdf_import": {
    "id": "uuid",
    "file_name": "Kenya Safari.pdf",
    "status": "extracted",
    "extracted_data": {
      "name": "Kenya Safari Adventure 7 Days",
      "destination": "Kenya",
      "duration_days": 7,
      "description": "Comprehensive overview...",
      "days": [...]
    },
    "extraction_confidence": 0.85
  }
}
```

### Review Actions

**Endpoint:** `PATCH /api/admin/pdf-imports/{id}`

**Actions:**

#### 1. Approve for Publishing
```json
{
  "action": "approve",
  "notes": "Extraction looks good, ready to publish"
}
```

#### 2. Reject Extraction
```json
{
  "action": "reject",
  "notes": "Poor quality extraction, will upload better PDF"
}
```

#### 3. Re-Extract
```json
{
  "action": "re-extract"
}
```

Triggers AI extraction again (useful if first attempt failed or for testing).

#### 4. Publish to Templates
```json
{
  "action": "publish",
  "organizationId": "uuid"
}
```

Creates `tour_template` record and marks import as published.

### Delete Import

**Endpoint:** `DELETE /api/admin/pdf-imports/{id}`

Deletes import record and cleans up storage file.

## Usage Examples

### Upload PDF via curl

```bash
curl -X POST http://localhost:3000/api/admin/pdf-imports/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@kenya-safari.pdf" \
  -F "organizationId=org-uuid-here"
```

### Upload PDF via JavaScript

```typescript
const uploadPDF = async (file: File, organizationId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('organizationId', organizationId);

  const response = await fetch('/api/admin/pdf-imports/upload', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};
```

### Approve and Publish

```typescript
const approveAndPublish = async (importId: string, orgId: string) => {
  // Step 1: Approve
  await fetch(`/api/admin/pdf-imports/${importId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approve',
      notes: 'Looks good!'
    })
  });

  // Step 2: Publish
  const response = await fetch(`/api/admin/pdf-imports/${importId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'publish',
      organizationId: orgId
    })
  });

  const result = await response.json();
  console.log('Template ID:', result.template_id);
};
```

## Integration with RAG System

Once published, PDF imports become part of the unified template sharing system:

1. **Extraction** → Structured template data saved
2. **Publishing** → `tour_template` record created
3. **Embedding** → Auto-generate vector embeddings (if embeddings system configured)
4. **Sharing** → Template marked `is_public = true` by default
5. **Discovery** → Other operators can now find and use this template via RAG search

**Example Flow:**

```
Operator A uploads "Kenya Safari 7D.pdf"
  ↓
AI extracts: 7 days, 42 activities, 3 hotels
  ↓
Operator A reviews & approves
  ↓
Template published to database
  ↓
Embeddings generated automatically
  ↓
Operator B's customer requests "Kenya 5 days"
  ↓
RAG finds Operator A's 7-day template (similarity: 0.89)
  ↓
AI adapts 7 days → 5 days
  ↓
Operator B gets result with their branding
  ↓
Attribution tracked: Operator A contributed 85%
```

## Monitoring & Maintenance

### Check Extraction Queue

```sql
-- See what's waiting for extraction
SELECT
  i.file_name,
  i.status,
  q.attempts,
  q.last_error
FROM pdf_extraction_queue q
JOIN pdf_imports i ON i.id = q.pdf_import_id
WHERE q.status = 'pending'
ORDER BY q.created_at ASC;
```

### Check Import Statistics

```sql
-- Get stats for organization
SELECT * FROM get_pdf_import_stats('org-uuid-here');
```

Returns:
```
total_imports: 50
uploaded: 2
extracting: 1
extracted: 15
approved: 8
published: 24
rejected: 0
failed: 0
avg_confidence: 0.78
```

### Find Failed Extractions

```sql
SELECT
  file_name,
  extraction_error,
  created_at
FROM pdf_imports
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Re-process Failed Extractions

```typescript
// Get failed imports
const { data: failed } = await supabase
  .from('pdf_imports')
  .select('id')
  .eq('status', 'failed');

// Re-trigger extraction
for (const imp of failed) {
  await fetch(`/api/admin/pdf-imports/${imp.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 're-extract' })
  });
}
```

## Storage Configuration

### Supabase Storage Bucket

**Bucket Name:** `pdf-imports`

**Configuration:**
- Public: Yes (read-only for file serving)
- File Size Limit: 10MB
- Allowed MIME Types: `application/pdf`

**Create bucket (if not exists):**

```sql
-- Via Supabase Dashboard > Storage > Create bucket
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-imports', 'pdf-imports', true);
```

**Set RLS policies:**

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdf-imports');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pdf-imports');
```

## Cost Estimation

**OpenAI GPT-4o Costs:**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens

**Per PDF Extraction:**
- Average PDF: ~2,000 input tokens (pages as images)
- Average output: ~1,500 tokens (structured JSON)
- **Cost per extraction: ~$0.02**

**Monthly Costs (Example):**
- 100 PDFs/month × $0.02 = **$2.00/month**
- 500 PDFs/month × $0.02 = **$10.00/month**

**Storage Costs (Supabase):**
- Free tier: 1GB storage
- Paid: $0.021 per GB/month
- Average PDF: 2MB
- 500 PDFs: ~1GB = **$0.02/month**

**Total monthly cost for 500 PDFs:** ~$10.02

Compare to:
- Manual data entry: 30 min/template × $20/hr = **$10/template**
- 500 templates manually: **$5,000**

**ROI: 99.8% cost savings!**

## Troubleshooting

### PDF Upload Fails

**Error:** "Only PDF files are supported"
- **Cause:** Wrong file type
- **Fix:** Ensure file extension is `.pdf` and MIME type is `application/pdf`

**Error:** "File size exceeds 10MB limit"
- **Cause:** PDF too large
- **Fix:** Compress PDF or split into smaller files

### Extraction Fails

**Error:** "Failed to parse extraction result as JSON"
- **Cause:** GPT-4o returned malformed JSON
- **Fix:** Trigger re-extraction with `action: 're-extract'`

**Low Confidence (<0.4)**
- **Cause:** PDF has poor structure, scanned images, or complex layout
- **Fix:**
  1. Try re-extraction
  2. Manually edit extracted data before publishing
  3. Upload cleaner PDF version

### Storage Issues

**Error:** "Failed to upload file to storage"
- **Cause:** Storage bucket doesn't exist or permissions issue
- **Fix:**
  1. Check bucket exists: `SELECT * FROM storage.buckets WHERE id = 'pdf-imports'`
  2. Verify RLS policies allow uploads
  3. Check Supabase project quota

## Security Considerations

### File Upload Security

- ✅ File type validation (PDF only)
- ✅ File size limits (10MB max)
- ✅ MD5 hash deduplication
- ✅ Organization-scoped access (RLS)
- ✅ Authenticated uploads only

### Data Privacy

- Uploaded PDFs stored in organization-scoped folders
- RLS ensures operators only see their own imports
- Published templates can be public (operator choice)
- Extraction data stored as JSONB (easy to redact if needed)

### Rate Limiting

Consider adding rate limits:
- Max 10 uploads per hour per organization
- Max 100 extractions per day per organization

Implementation:
```typescript
// Add to upload endpoint
const recentUploads = await supabase
  .from('pdf_imports')
  .select('id')
  .eq('organization_id', orgId)
  .gte('created_at', new Date(Date.now() - 3600000).toISOString());

if (recentUploads.data && recentUploads.data.length >= 10) {
  return NextResponse.json({
    error: 'Rate limit exceeded. Max 10 uploads per hour.'
  }, { status: 429 });
}
```

## Future Enhancements

### Phase 5.1: Advanced PDF Processing
- **PDF-to-Image Conversion**: Use actual PDF pages as images for GPT-4o Vision
- **OCR for Scanned PDFs**: Tesseract.js integration for scanned documents
- **Multi-Language Support**: Extract PDFs in multiple languages

### Phase 5.2: Enhanced Review UI
- **Side-by-side View**: Original PDF next to extracted data
- **Inline Editing**: Edit extracted fields directly in UI
- **Image Extraction**: Pull images from PDF for activity photos
- **Bulk Approve**: Approve multiple extractions at once

### Phase 5.3: Template Matching
- **Duplicate Detection**: AI finds similar existing templates before publishing
- **Auto-merge**: Suggest merging with existing template
- **Version Control**: Track template versions over time

### Phase 5.4: Quality Improvements
- **Feedback Loop**: Learn from operator edits to improve extraction
- **Custom Prompts**: Per-organization extraction prompt templates
- **Structured Output**: Use GPT-4o structured output mode for reliability

## Support

**Issues?**
- Check console logs for detailed error messages
- Review `pdf_imports` status: `SELECT * FROM pdf_imports WHERE id = 'uuid'`
- Check extraction queue: `SELECT * FROM pdf_extraction_queue WHERE pdf_import_id = 'uuid'`

**Questions?**
- See RAG system docs: `/docs/rag-system-implementation.md`
- See migration guide: `/docs/MIGRATION_GUIDE.md`

---

**Last Updated**: 2026-02-19
**Version**: 1.0.0 (Phase 5)
**Status**: ✅ API Complete - UI Pending
