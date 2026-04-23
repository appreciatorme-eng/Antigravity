"use client";

import { Skeleton } from "boneyard-js/react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassSkeleton } from "@/components/glass/GlassSkeleton";

function OperationsShellFallback() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <GlassSkeleton className="h-7 w-40 rounded-full" />
          <GlassSkeleton className="h-12 w-80 rounded-2xl" />
          <GlassSkeleton className="h-4 w-[34rem] max-w-full rounded-full" />
        </div>
        <GlassSkeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>

      <GlassSkeleton className="h-48 rounded-2xl" />

      <div className="rounded-2xl border border-gray-200 bg-white p-2 grid grid-cols-1 gap-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-10 rounded-xl" />
        ))}
      </div>

      <div className="space-y-4">
        <GlassSkeleton className="h-44 rounded-2xl" />
        <GlassSkeleton className="h-52 rounded-2xl" />
        <GlassSkeleton className="h-56 rounded-2xl" />
      </div>

      <GlassSkeleton className="h-24 rounded-2xl" />
    </div>
  );
}

function OperationsShellFixture() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <div className="h-3.5 w-3.5 rounded-full bg-emerald-300" />
            <div className="h-2.5 w-28 rounded-full bg-emerald-200" />
          </div>
          <div className="h-12 w-80 rounded-2xl bg-slate-200" />
          <div className="h-4 w-[34rem] max-w-full rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-slate-200" />
          <div className="h-3 w-16 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <GlassCard key={index} padding="md" className="border-gray-100">
            <div className="h-3 w-28 rounded-full bg-slate-100" />
            <div className="mt-3 h-9 w-16 rounded-xl bg-slate-200" />
          </GlassCard>
        ))}
      </div>

      <GlassCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-200" />
          <div className="h-5 w-36 rounded-full bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="h-3 w-24 rounded-full bg-slate-100" />
              <div className="mt-2 h-8 w-12 rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 grid grid-cols-1 gap-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-10 rounded-xl bg-slate-100" />
        ))}
      </div>

      <GlassCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-200" />
          <div className="h-5 w-32 rounded-full bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="h-3 w-24 rounded-full bg-slate-100" />
              <div className="mt-2 h-8 w-12 rounded-xl bg-slate-200" />
              <div className="mt-2 h-3 w-full rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-200" />
          <div className="h-5 w-40 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="h-4 w-40 rounded-full bg-slate-200" />
              <div className="mt-2 h-3 w-72 max-w-full rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-4 w-4 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-52 rounded-full bg-slate-200" />
            <div className="h-3 w-[32rem] max-w-full rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OperationsShellBone({ loading = true }: { loading?: boolean }) {
  return (
    <Skeleton
      name="admin-operations-shell"
      loading={loading}
      animate="shimmer"
      transition
      stagger
      fallback={<OperationsShellFallback />}
      fixture={<OperationsShellFixture />}
      className="h-full"
    >
      <OperationsShellFixture />
    </Skeleton>
  );
}
