// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileTab } from "@/app/settings/_components/ProfileTab";

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
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  User: () => <span data-testid="icon-user" />,
}));

vi.mock("@/lib/date/tz", () => ({
  getTimezoneDisplayName: (tz: string) => `Display: ${tz}`,
}));

describe("ProfileTab", () => {
  const defaultProps = {
    draftTimezone: "Asia/Kolkata",
    timezone: "Asia/Kolkata",
    timezoneOptions: ["Asia/Kolkata", "America/New_York", "Europe/London"],
    savingTimezone: false,
    loading: false,
    onDraftTimezoneChange: vi.fn(),
    onSaveTimezone: vi.fn(),
    onSave: vi.fn(),
  };

  it("renders personal account heading", () => {
    render(<ProfileTab {...defaultProps} />);
    expect(screen.getByText("Personal Account")).toBeInTheDocument();
  });

  it("renders upload avatar button", () => {
    render(<ProfileTab {...defaultProps} />);
    expect(screen.getByText("Upload Avatar")).toBeInTheDocument();
  });

  it("renders name and email inputs", () => {
    render(<ProfileTab {...defaultProps} />);
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  it("renders timezone select with options", () => {
    render(<ProfileTab {...defaultProps} />);
    expect(screen.getByText("Operational Timezone")).toBeInTheDocument();
    expect(screen.getByText("Display: Asia/Kolkata")).toBeInTheDocument();
    expect(screen.getByText("Display: America/New_York")).toBeInTheDocument();
  });

  it("disables save timezone button when timezone unchanged", () => {
    render(<ProfileTab {...defaultProps} />);
    const saveBtn = screen.getByText("Save timezone");
    expect(saveBtn).toBeDisabled();
  });

  it("enables save timezone button when timezone changed", () => {
    render(
      <ProfileTab {...defaultProps} draftTimezone="America/New_York" />
    );
    const saveBtn = screen.getByText("Save timezone");
    expect(saveBtn).not.toBeDisabled();
  });

  it("shows saving state for timezone", () => {
    render(
      <ProfileTab
        {...defaultProps}
        savingTimezone={true}
        draftTimezone="America/New_York"
      />
    );
    expect(screen.getByText("Saving timezone...")).toBeInTheDocument();
  });

  it("calls onSaveTimezone when save timezone clicked", async () => {
    const onSaveTimezone = vi.fn();
    render(
      <ProfileTab
        {...defaultProps}
        draftTimezone="America/New_York"
        onSaveTimezone={onSaveTimezone}
      />
    );
    await userEvent.click(screen.getByText("Save timezone"));
    expect(onSaveTimezone).toHaveBeenCalledOnce();
  });

  it("renders save configuration button", () => {
    render(<ProfileTab {...defaultProps} />);
    expect(screen.getByText("Save Configuration")).toBeInTheDocument();
  });

  it("shows committing state when loading", () => {
    render(<ProfileTab {...defaultProps} loading={true} />);
    expect(screen.getByText("Committing...")).toBeInTheDocument();
  });

  it("calls onSave when save configuration clicked", async () => {
    const onSave = vi.fn();
    render(<ProfileTab {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByText("Save Configuration"));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
