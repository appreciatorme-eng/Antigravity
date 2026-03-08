"use client";

import Link from "next/link";
import { GlassButton } from "@/components/glass/GlassButton";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const button = action ? (
    action.href ? (
      <Link href={action.href}>
        <GlassButton>{action.label}</GlassButton>
      </Link>
    ) : (
      <GlassButton onClick={action.onClick}>{action.label}</GlassButton>
    )
  ) : null;

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-4 text-5xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white/85">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-white/45">{description}</p>
      {button}
    </div>
  );
}
