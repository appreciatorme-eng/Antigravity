// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SecurityTab } from "@/app/settings/_components/SecurityTab";

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
}));

describe("SecurityTab", () => {
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
    expect(screen.getByText("iPhone 14 Pro Max")).toBeInTheDocument();
  });

  it("shows current session badge", () => {
    render(<SecurityTab />);
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("renders shield and smartphone icons", () => {
    render(<SecurityTab />);
    expect(screen.getByTestId("icon-shield")).toBeInTheDocument();
    expect(screen.getByTestId("icon-smartphone")).toBeInTheDocument();
  });
});
