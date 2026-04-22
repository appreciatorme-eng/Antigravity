// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SecurityTab } from "@/app/settings/_components/SecurityTab";

const { authedFetchMock } = vi.hoisted(() => ({
  authedFetchMock: vi.fn(),
}));

vi.mock("@/lib/api/authed-fetch", () => ({
  authedFetch: authedFetchMock,
}));

vi.mock("@/components/glass/GlassButton", () => ({
  GlassButton: ({
    children,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => <button>{children}</button>,
}));

vi.mock("@/components/glass/GlassBadge", () => ({
  GlassBadge: ({
    children,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-testid="badge">{children}</span>,
}));

vi.mock("lucide-react", () => ({
  Shield: () => <span data-testid="icon-shield" />,
  Smartphone: () => <span data-testid="icon-smartphone" />,
  Monitor: () => <span data-testid="icon-monitor" />,
  Tablet: () => <span data-testid="icon-tablet" />,
  LogOut: () => <span data-testid="icon-logout" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
}));

const sessionsPayload = {
  data: {
    sessions: [
      {
        id: "session-1",
        supabase_session_id: "supabase-session-1",
        ip_address: "127.0.0.1",
        device_name: "iPhone 14 Pro Max",
        browser: "Safari",
        os: "iOS",
        city: "Hyderabad",
        country: "India",
        created_at: "2026-04-20T00:00:00.000Z",
        last_seen_at: "2099-04-20T00:00:00.000Z",
      },
    ],
  },
};

describe("SecurityTab", () => {
  beforeEach(() => {
    authedFetchMock.mockResolvedValue({
      ok: true,
      json: async () => sessionsPayload,
    });
  });

  it("renders security posture heading", () => {
    render(<SecurityTab />);
    expect(screen.getByText("Security Posture")).toBeInTheDocument();
  });

  it("renders 2FA section", () => {
    render(<SecurityTab />);
    expect(
      screen.getByText("Two-Factor Authentication Pipeline")
    ).toBeInTheDocument();
  });

  it("renders enforce policy button", () => {
    render(<SecurityTab />);
    expect(screen.getByText("Enforce Policy")).toBeInTheDocument();
  });

  it("renders active sessions section", () => {
    render(<SecurityTab />);
    expect(screen.getByText("Active Sessions")).toBeInTheDocument();
    expect(screen.findByText(/iPhone 14 Pro Max/)).resolves.toBeInTheDocument();
  });

  it("shows current session badge", () => {
    render(<SecurityTab />);
    expect(screen.findByText("Current")).resolves.toBeInTheDocument();
  });

  it("renders shield and smartphone icons", () => {
    render(<SecurityTab />);
    expect(screen.getByTestId("icon-shield")).toBeInTheDocument();
    expect(screen.findByTestId("icon-smartphone")).resolves.toBeInTheDocument();
  });
});
