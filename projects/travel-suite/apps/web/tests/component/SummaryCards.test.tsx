// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryCards } from "@/app/admin/cost/_components/SummaryCards";

vi.mock("@/components/glass/GlassCard", () => ({
  GlassCard: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
    padding?: string;
  }) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

describe("SummaryCards", () => {
  const defaultProps = {
    totalSpend: 1234.56,
    allowedRequests: 50000,
    deniedRequests: 150,
    organizationCount: 12,
    windowDays: 7,
  };

  it("renders all four cards", () => {
    render(<SummaryCards {...defaultProps} />);
    const cards = screen.getAllByTestId("glass-card");
    expect(cards).toHaveLength(4);
  });

  it("displays formatted total spend", () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText("$1234.56")).toBeInTheDocument();
  });

  it("displays allowed requests count", () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText("50,000")).toBeInTheDocument();
  });

  it("displays denied requests count", () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("displays organization count", () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows window days in spend card", () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText("Window: last 7 days")).toBeInTheDocument();
  });

  it("shows card labels", () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText("Estimated spend")).toBeInTheDocument();
    expect(screen.getByText("Allowed requests")).toBeInTheDocument();
    expect(screen.getByText("Denied requests")).toBeInTheDocument();
    expect(screen.getByText("Tracked organizations")).toBeInTheDocument();
  });

  it("handles zero values", () => {
    render(
      <SummaryCards
        totalSpend={0}
        allowedRequests={0}
        deniedRequests={0}
        organizationCount={0}
        windowDays={30}
      />
    );
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("Window: last 30 days")).toBeInTheDocument();
  });
});
