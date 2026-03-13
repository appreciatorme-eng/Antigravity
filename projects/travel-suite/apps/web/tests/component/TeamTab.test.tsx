// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamTab } from "@/app/settings/_components/TeamTab";

vi.mock("lucide-react", () => ({
  Users: () => <span data-testid="icon-users" />,
  ArrowRight: () => <span data-testid="icon-arrow" />,
}));

describe("TeamTab", () => {
  it("renders team management heading", () => {
    render(<TeamTab />);
    expect(screen.getByText("Team Management")).toBeInTheDocument();
  });

  it("renders team members section", () => {
    render(<TeamTab />);
    expect(screen.getByText("Team Members & Roles")).toBeInTheDocument();
  });

  it("mentions available roles", () => {
    render(<TeamTab />);
    expect(
      screen.getByText(/Owner, Manager, Agent, Driver/)
    ).toBeInTheDocument();
  });

  it("renders link to team settings", () => {
    render(<TeamTab />);
    const link = screen.getByText("Open Team Settings").closest("a");
    expect(link).toHaveAttribute("href", "/settings/team");
  });

  it("renders icons", () => {
    render(<TeamTab />);
    expect(screen.getByTestId("icon-users")).toBeInTheDocument();
    expect(screen.getByTestId("icon-arrow")).toBeInTheDocument();
  });
});
