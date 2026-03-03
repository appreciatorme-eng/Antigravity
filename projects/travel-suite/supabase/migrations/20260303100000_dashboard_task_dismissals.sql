-- Dashboard task dismissals: tracks which attention items operators have marked as done
CREATE TABLE IF NOT EXISTS public.dashboard_task_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  task_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  entity_id TEXT,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, task_id)
);

ALTER TABLE public.dashboard_task_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dismissals"
  ON public.dashboard_task_dismissals
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_dismissals_org_user
  ON public.dashboard_task_dismissals(organization_id, user_id, dismissed_at);
