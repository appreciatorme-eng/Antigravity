-- M-14: Prevent unbounded text storage that causes query slowness and DB bloat
--
-- Only adding constraints for columns that actually exist:
--   proposal_comments.comment  — exists (TEXT NOT NULL, defined in 20260214150000)
--
-- Skipped (columns do not exist on the table):
--   notification_logs.message  — table has 'body' and 'title', not 'message'
--   shared_itineraries.title   — table has no title column
--   shared_itineraries.description — table has no description column

ALTER TABLE public.proposal_comments
  ADD CONSTRAINT proposal_comments_comment_length CHECK (char_length(comment) <= 5000);
