// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceholderTab } from "@/app/settings/_components/PlaceholderTab";

vi.mock("lucide-react", () => ({
  Clock: () => <span data-testid="icon-clock" />,
}));

describe("PlaceholderTab", () => {
  it("renders subsystem initializing heading", () => {
    render(<PlaceholderTab />);
    expect(screen.getByText("Subsystem Initializing")).toBeInTheDocument();
  });

  it("renders deployment message", () => {
    render(<PlaceholderTab />);
    expect(
      screen.getByText(/queued for standard deployment/)
    ).toBeInTheDocument();
  });

  it("renders clock icon", () => {
    render(<PlaceholderTab />);
    expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
  });
});
