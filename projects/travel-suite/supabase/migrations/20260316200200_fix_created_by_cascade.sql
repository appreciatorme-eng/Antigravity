-- M-13: Preserve content when creator account is deleted
-- Change created_by foreign keys from NO ACTION (default) to SET NULL so that
-- deleting a user account does not block deletion or lose attribution silently.
-- Instead the row is preserved with created_by set to NULL.

-- pdf_imports: inline REFERENCES generates constraint name pdf_imports_created_by_fkey
ALTER TABLE public.pdf_imports
  DROP CONSTRAINT IF EXISTS pdf_imports_created_by_fkey,
  ADD CONSTRAINT pdf_imports_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- tour_templates: inline REFERENCES generates constraint name tour_templates_created_by_fkey
ALTER TABLE public.tour_templates
  DROP CONSTRAINT IF EXISTS tour_templates_created_by_fkey,
  ADD CONSTRAINT tour_templates_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
