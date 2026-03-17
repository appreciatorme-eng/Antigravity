// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationTab } from "@/app/settings/_components/OrganizationTab";

vi.mock("@/components/glass/GlassButton", () => ({
  GlassButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/lib/date/tz", () => ({
  getTimezoneDisplayName: (tz: string) => `Display: ${tz}`,
}));

describe("OrganizationTab", () => {
  const defaultProps = {
    draftTimezone: "Asia/Kolkata",
    loading: false,
    onSave: vi.fn(),
  };

  it("renders organization profile heading", () => {
    render(<OrganizationTab {...defaultProps} />);
    expect(screen.getByText("Organization Profile")).toBeInTheDocument();
  });

  it("renders official name input", () => {
    render(<OrganizationTab {...defaultProps} />);
    expect(screen.getByText("Official Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TripBuilt Elite")).toBeInTheDocument();
  });

  it("renders website domain input", () => {
    render(<OrganizationTab {...defaultProps} />);
    expect(screen.getByText("Website Domain")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("www.travelsuite.app")
    ).toBeInTheDocument();
  });

  it("renders base currency select", () => {
    render(<OrganizationTab {...defaultProps} />);
    expect(screen.getByText("Base Currency")).toBeInTheDocument();
  });

  it("renders timezone with display name", () => {
    render(<OrganizationTab {...defaultProps} />);
    expect(screen.getByText("Display: Asia/Kolkata")).toBeInTheDocument();
  });

  it("renders save button", () => {
    render(<OrganizationTab {...defaultProps} />);
    expect(screen.getByText("Save Configuration")).toBeInTheDocument();
  });

  it("disables save button when loading", () => {
    render(<OrganizationTab {...defaultProps} loading={true} />);
    expect(screen.getByText("Committing...")).toBeDisabled();
  });

  it("calls onSave when save clicked", async () => {
    const onSave = vi.fn();
    render(<OrganizationTab {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByText("Save Configuration"));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
