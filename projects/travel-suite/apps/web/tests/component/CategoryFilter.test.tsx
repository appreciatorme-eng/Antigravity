// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilter } from "@/app/add-ons/_components/CategoryFilter";

vi.mock("@/components/glass/GlassButton", () => ({
  GlassButton: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
  }) => (
    <button data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/glass/GlassInput", () => ({
  GlassInput: ({
    placeholder,
    value,
    onChange,
  }: {
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: React.ComponentType;
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data-testid="search-input"
    />
  ),
}));

vi.mock("lucide-react", () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Search: () => <span data-testid="icon-search" />,
}));

describe("CategoryFilter", () => {
  const defaultProps = {
    categories: ["All", "Activities", "Dining", "Transport"] as const,
    selectedCategory: "All",
    onSelectCategory: vi.fn(),
    searchQuery: "",
    onSearchChange: vi.fn(),
    onCreateClick: vi.fn(),
  };

  it("renders all category buttons", () => {
    render(<CategoryFilter {...defaultProps} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Activities")).toBeInTheDocument();
    expect(screen.getByText("Dining")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
  });

  it("marks selected category as primary variant", () => {
    render(<CategoryFilter {...defaultProps} selectedCategory="Dining" />);
    const diningButton = screen.getByText("Dining").closest("button");
    expect(diningButton).toHaveAttribute("data-variant", "primary");
  });

  it("marks non-selected categories as ghost variant", () => {
    render(<CategoryFilter {...defaultProps} selectedCategory="Dining" />);
    const allButton = screen.getByText("All").closest("button");
    expect(allButton).toHaveAttribute("data-variant", "ghost");
  });

  it("calls onSelectCategory when category clicked", async () => {
    const onSelectCategory = vi.fn();
    render(
      <CategoryFilter {...defaultProps} onSelectCategory={onSelectCategory} />
    );
    await userEvent.click(screen.getByText("Dining"));
    expect(onSelectCategory).toHaveBeenCalledWith("Dining");
  });

  it("renders create button", () => {
    render(<CategoryFilter {...defaultProps} />);
    expect(screen.getByText(/Add New Add-on/)).toBeInTheDocument();
  });

  it("calls onCreateClick when create button clicked", async () => {
    const onCreateClick = vi.fn();
    render(<CategoryFilter {...defaultProps} onCreateClick={onCreateClick} />);
    await userEvent.click(screen.getByText(/Add New Add-on/));
    expect(onCreateClick).toHaveBeenCalledOnce();
  });

  it("renders search input with placeholder", () => {
    render(<CategoryFilter {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Search add-ons...")
    ).toBeInTheDocument();
  });

  it("calls onSearchChange when typing in search", async () => {
    const onSearchChange = vi.fn();
    render(
      <CategoryFilter {...defaultProps} onSearchChange={onSearchChange} />
    );
    const input = screen.getByTestId("search-input");
    await userEvent.type(input, "a");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("displays current search query value", () => {
    render(<CategoryFilter {...defaultProps} searchQuery="airport" />);
    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.value).toBe("airport");
  });
});
