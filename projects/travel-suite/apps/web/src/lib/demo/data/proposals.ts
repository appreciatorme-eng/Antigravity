// Demo Mode — 6 hardcoded GoBuddy Adventures proposals at different lifecycle stages.
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

export const DEMO_PROPOSALS: DemoProposal[] = [
  {
    id: "dp-001",
    organization_id: "d0000000-0000-4000-8000-000000000001",
    client_id: "dc-001",
    template_id: "tpl-001",
    title: "Kerala Backwaters Escape 7N",
    share_token: "demo-share-001",
    version: 2,
    status: "approved",
    total_price: 120000,
    client_selected_price: 120000,
    expires_at: "2026-04-01T00:00:00Z",
    viewed_at: "2026-02-15T10:30:00Z",
    approved_at: "2026-02-16T14:00:00Z",
    approved_by: "Priya Mehta",
    created_at: "2026-02-10T09:00:00Z",
    updated_at: "2026-02-16T14:00:00Z",
    client_name: "Priya Mehta",
    client_email: "priya.mehta@gmail.com",
    template_name: "Kerala Backwaters Package",
    comments_count: 0,
  },
  {
    id: "dp-002",
    organization_id: "d0000000-0000-4000-8000-000000000001",
    client_id: "dc-002",
    template_id: "tpl-002",
    title: "Rajasthan Royal Tour 8N",
    share_token: "demo-share-002",
    version: 1,
    status: "approved",
    total_price: 240000,
    client_selected_price: 240000,
    expires_at: "2026-04-15T00:00:00Z",
    viewed_at: "2026-01-25T11:00:00Z",
    approved_at: "2026-01-26T09:30:00Z",
    approved_by: "Rajesh Sharma",
    created_at: "2026-01-22T10:00:00Z",
    updated_at: "2026-01-26T09:30:00Z",
    client_name: "Rajesh Sharma",
    client_email: "rajesh.sharma@infosys.com",
    template_name: "Rajasthan Heritage Circuit",
    comments_count: 0,
  },
  {
    id: "dp-003",
    organization_id: "d0000000-0000-4000-8000-000000000001",
    client_id: "dc-003",
    template_id: "tpl-003",
    title: "Andaman Island Package 6N",
    share_token: "demo-share-003",
    version: 1,
    status: "viewed",
    total_price: 85000,
    client_selected_price: null,
    expires_at: "2026-04-01T00:00:00Z",
    viewed_at: "2026-02-26T16:45:00Z",
    approved_at: null,
    approved_by: null,
    created_at: "2026-02-24T11:00:00Z",
    updated_at: "2026-02-26T16:45:00Z",
    client_name: "Ananya Gupta",
    client_email: "ananya.gupta@outlook.com",
    template_name: "Andaman Beach Escape",
    comments_count: 2,
  },
  {
    id: "dp-004",
    organization_id: "d0000000-0000-4000-8000-000000000001",
    client_id: "dc-008",
    template_id: null,
    title: "Himachal Adventure 7N",
    share_token: "demo-share-004",
    version: 1,
    status: "sent",
    total_price: 95000,
    client_selected_price: null,
    expires_at: "2026-04-10T00:00:00Z",
    viewed_at: null,
    approved_at: null,
    approved_by: null,
    created_at: "2026-02-25T09:00:00Z",
    updated_at: "2026-02-25T09:00:00Z",
    client_name: "Sanjay Malhotra",
    client_email: "sanjay.malhotra@wipro.com",
    template_name: undefined,
    comments_count: 0,
  },
  {
    id: "dp-005",
    organization_id: "d0000000-0000-4000-8000-000000000001",
    client_id: "dc-005",
    template_id: "tpl-004",
    title: "Golden Triangle Classic 6N",
    share_token: "demo-share-005",
    version: 1,
    status: "commented",
    total_price: 68000,
    client_selected_price: null,
    expires_at: "2026-03-30T00:00:00Z",
    viewed_at: "2026-02-20T14:00:00Z",
    approved_at: null,
    approved_by: null,
    created_at: "2026-02-18T10:00:00Z",
    updated_at: "2026-02-22T11:30:00Z",
    client_name: "Sunita Patel",
    client_email: "sunita.patel@gmail.com",
    template_name: "Golden Triangle Classic",
    comments_count: 3,
  },
  {
    id: "dp-006",
    organization_id: "d0000000-0000-4000-8000-000000000001",
    client_id: "dc-011",
    template_id: "tpl-005",
    title: "Bali Honeymoon 6N",
    share_token: "demo-share-006",
    version: 1,
    status: "draft",
    total_price: 180000,
    client_selected_price: null,
    expires_at: null,
    viewed_at: null,
    approved_at: null,
    approved_by: null,
    created_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-03-01T08:00:00Z",
    client_name: "Meera Iyer",
    client_email: "meera.iyer@gmail.com",
    template_name: "Bali Romantic Escape",
    comments_count: 0,
  },
];
