// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IntegrationCard } from "@/app/settings/_components/IntegrationCard";

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

vi.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | boolean)[]) =>
    args.filter(Boolean).join(" "),
}));

describe("IntegrationCard", () => {
  const defaultProps = {
    icon: <span data-testid="mock-icon">🔌</span>,
    iconBg: "bg-blue-100",
    title: "WhatsApp",
    description: "Connect WhatsApp for messaging",
    isConnected: false,
    buttonLabel: "Connect",
    onConnect: vi.fn(),
  };

  it("renders title and description", () => {
    render(<IntegrationCard {...defaultProps} />);
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(
      screen.getByText("Connect WhatsApp for messaging")
    ).toBeInTheDocument();
  });

  it("renders icon", () => {
    render(<IntegrationCard {...defaultProps} />);
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("renders connect button when not connected", () => {
    render(<IntegrationCard {...defaultProps} />);
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("renders button with checkmark when connected", () => {
    render(<IntegrationCard {...defaultProps} isConnected={true} />);
    expect(screen.getByText("Connect ✓")).toBeInTheDocument();
  });

  it("shows connected label when connected", () => {
    render(
      <IntegrationCard
        {...defaultProps}
        isConnected={true}
        connectedLabel="Active"
      />
    );
    expect(screen.getByText(/Active/)).toBeInTheDocument();
  });

  it("does not show connected label when not connected", () => {
    render(
      <IntegrationCard {...defaultProps} connectedLabel="Active" />
    );
    expect(screen.queryByText(/● Active/)).not.toBeInTheDocument();
  });

  it("calls onConnect when button clicked", async () => {
    const onConnect = vi.fn();
    render(<IntegrationCard {...defaultProps} onConnect={onConnect} />);
    await userEvent.click(screen.getByText("Connect"));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it("renders large variant", () => {
    render(<IntegrationCard {...defaultProps} large={true} />);
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("renders large variant with connected label", () => {
    render(
      <IntegrationCard
        {...defaultProps}
        large={true}
        isConnected={true}
        connectedLabel="Connected"
      />
    );
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });
});
