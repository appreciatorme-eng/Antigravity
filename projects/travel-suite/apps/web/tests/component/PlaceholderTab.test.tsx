// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceholderTab } from "@/app/settings/_components/PlaceholderTab";

vi.mock("lucide-react", () => ({
  Clock: () => <span data-testid="icon-clock" />,
}));

describe("PlaceholderTab", () => {
  it("renders coming soon heading", () => {
    render(<PlaceholderTab />);
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("renders under development message", () => {
    render(<PlaceholderTab />);
    expect(
      screen.getByText(/under development and will be available/)
    ).toBeInTheDocument();
  });

  it("renders clock icon", () => {
    render(<PlaceholderTab />);
    expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
  });
});
