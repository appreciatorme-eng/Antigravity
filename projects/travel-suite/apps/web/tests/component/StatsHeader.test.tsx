// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsHeader } from "@/app/add-ons/_components/StatsHeader";

vi.mock("@/components/glass/GlassCard", () => ({
  GlassCard: ({
    children,
  }: {
    children: React.ReactNode;
    padding?: string;
    rounded?: string;
  }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("lucide-react", () => ({
  Package: () => <span data-testid="icon-package" />,
  DollarSign: () => <span data-testid="icon-dollar" />,
  TrendingUp: () => <span data-testid="icon-trending" />,
  Activity: () => <span data-testid="icon-activity" />,
}));

describe("StatsHeader", () => {
  const defaultStats = {
    totalAddOns: 25,
    activeAddOns: 18,
    totalRevenue: 45678.9,
    totalSales: 142,
    topAddOn: "Airport Transfer",
  };

  it("renders all four stat cards", () => {
    render(<StatsHeader stats={defaultStats} />);
    const cards = screen.getAllByTestId("glass-card");
    expect(cards).toHaveLength(4);
  });

  it("displays total add-ons count", () => {
    render(<StatsHeader stats={defaultStats} />);
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("displays active add-ons count", () => {
    render(<StatsHeader stats={defaultStats} />);
    expect(screen.getByText("18 active")).toBeInTheDocument();
  });

  it("displays formatted revenue", () => {
    render(<StatsHeader stats={defaultStats} />);
    expect(screen.getByText("$45678.90")).toBeInTheDocument();
  });

  it("displays total sales count with label", () => {
    render(<StatsHeader stats={defaultStats} />);
    expect(screen.getByText("From 142 sales")).toBeInTheDocument();
  });

  it("displays top add-on name", () => {
    render(<StatsHeader stats={defaultStats} />);
    expect(screen.getByText("Airport Transfer")).toBeInTheDocument();
  });

  it("renders section labels", () => {
    render(<StatsHeader stats={defaultStats} />);
    expect(screen.getByText("Total Add-ons")).toBeInTheDocument();
    expect(screen.getByText("Revenue (Month)")).toBeInTheDocument();
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
    expect(screen.getByText("Active Sales")).toBeInTheDocument();
  });

  it("renders icons", () => {
    render(<StatsHeader stats={defaultStats} />);
    expect(screen.getByTestId("icon-package")).toBeInTheDocument();
    expect(screen.getByTestId("icon-dollar")).toBeInTheDocument();
    expect(screen.getByTestId("icon-trending")).toBeInTheDocument();
    expect(screen.getByTestId("icon-activity")).toBeInTheDocument();
  });
});
