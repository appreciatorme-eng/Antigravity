// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationTab } from "@/app/settings/_components/OrganizationTab";
import type { Organization } from "@/app/settings/shared";

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
  const organization: Organization = {
    id: "org-1",
    name: "TripBuilt Elite",
    legal_name: "TripBuilt Elite Private Limited",
    slug: "tripbuilt-elite",
    gstin: null,
    base_currency: "INR",
    billing_state: "Telangana",
    billing_address: {
      line1: "22 Jubilee Hills",
      line2: "",
      city: "Hyderabad",
      state: "Telangana",
      postal_code: "500033",
      country: "India",
    },
    branch_offices: [],
    logo_url: null,
  };

  const defaultProps = {
    organization,
    setOrganization: vi.fn(),
    draftTimezone: "Asia/Kolkata",
    timezoneOptions: ["Asia/Kolkata", "America/New_York"],
    onDraftTimezoneChange: vi.fn(),
    loading: false,
    showSuccess: false,
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
    expect(screen.getByText("Workspace Slug")).toBeInTheDocument();
    expect(screen.getByDisplayValue("tripbuilt-elite")).toBeInTheDocument();
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
    const savingButtons = screen.getAllByRole("button", { name: "Saving..." });
    expect(savingButtons).toHaveLength(2);
    expect(savingButtons[1]).toBeDisabled();
  });

  it("calls onSave when save clicked", async () => {
    const onSave = vi.fn();
    render(<OrganizationTab {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByText("Save Configuration"));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
