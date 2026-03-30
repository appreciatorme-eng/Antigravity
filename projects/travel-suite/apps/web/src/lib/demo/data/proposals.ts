// Demo Mode — proposal type + empty array.
// Returned by useProposals() when isDemoMode is true; zero DB reads required.

interface DemoProposal {
  id: string;
  organization_id: string;
  client_id: string;
  template_id: string | null;
  title: string;
  share_token: string;
  version: number | null;
  status: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  expires_at: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  client_name?: string;
  client_email?: string;
  template_name?: string;
  comments_count?: number;
}

export const DEMO_PROPOSALS: DemoProposal[] = [];
