// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ProfileTab } from "@/app/settings/_components/ProfileTab";

// Mock useLocale hook
vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  return {
    ...actual,
    useLocale: () => "en",
  };
});

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

const mockMessages = {
  settings: {
    profile: {
      title: "Personal Account",
      description: "Manage your operational identity and personal details.",
      avatar: {
        uploadButton: "Upload Avatar",
        fileRequirements: "JPG or PNG. Max size of 2MB.",
      },
      fields: {
        fullName: "Full Name",
        email: "Email Address",
      },
      timezone: {
        label: "Operational Timezone",
        description: "Used for bookings, proposal activity, and inbox timestamps.",
        save: "Save timezone",
        saving: "Saving timezone...",
      },
      actions: {
        save: "Save Configuration",
        saving: "Committing...",
      },
    },
  },
};

describe("ProfileTab", () => {
  const defaultProps = {
    fullName: "Avi Travels",
    email: "avi@example.com",
    avatarUrl: null,
    draftTimezone: "Asia/Kolkata",
    timezone: "Asia/Kolkata",
    timezoneOptions: ["Asia/Kolkata", "America/New_York", "Europe/London"],
    savingTimezone: false,
    loading: false,
    showSuccess: false,
    onFullNameChange: vi.fn(),
    onEmailChange: vi.fn(),
    onDraftTimezoneChange: vi.fn(),
    onSaveTimezone: vi.fn(),
    onSave: vi.fn(),
  };

  it("renders personal account heading", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Personal Account")).toBeInTheDocument();
  });

  it("renders upload avatar button", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Upload Avatar")).toBeInTheDocument();
  });

  it("renders name and email inputs", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  it("renders timezone select with options", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Operational Timezone")).toBeInTheDocument();
    expect(screen.getByText("Display: Asia/Kolkata")).toBeInTheDocument();
    expect(screen.getByText("Display: America/New_York")).toBeInTheDocument();
  });

  it("disables save timezone button when timezone unchanged", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} />
      </NextIntlClientProvider>
    );
    const saveBtn = screen.getByText("Save timezone");
    expect(saveBtn).toBeDisabled();
  });

  it("enables save timezone button when timezone changed", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} draftTimezone="America/New_York" />
      </NextIntlClientProvider>
    );
    const saveBtn = screen.getByText("Save timezone");
    expect(saveBtn).not.toBeDisabled();
  });

  it("shows saving state for timezone", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab
          {...defaultProps}
          savingTimezone={true}
          draftTimezone="America/New_York"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Saving timezone...")).toBeInTheDocument();
  });

  it("calls onSaveTimezone when save timezone clicked", async () => {
    const onSaveTimezone = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab
          {...defaultProps}
          draftTimezone="America/New_York"
          onSaveTimezone={onSaveTimezone}
        />
      </NextIntlClientProvider>
    );
    await userEvent.click(screen.getByText("Save timezone"));
    expect(onSaveTimezone).toHaveBeenCalledOnce();
  });

  it("renders save configuration button", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Save Configuration")).toBeInTheDocument();
  });

  it("shows committing state when loading", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} loading={true} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText("Committing...")).toBeInTheDocument();
  });

  it("calls onSave when save configuration clicked", async () => {
    const onSave = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <ProfileTab {...defaultProps} onSave={onSave} />
      </NextIntlClientProvider>
    );
    await userEvent.click(screen.getByText("Save Configuration"));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
