"use client";

import { Skeleton } from "boneyard-js/react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassSkeleton } from "@/components/glass/GlassSkeleton";

function TripRequestsShellFallback() {
  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <GlassSkeleton className="h-7 w-40 rounded-full" />
            <GlassSkeleton className="h-12 w-96 max-w-full rounded-2xl" />
            <GlassSkeleton className="h-4 w-[32rem] max-w-full rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <GlassSkeleton key={index} className="h-24 w-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <GlassSkeleton key={index} className="h-10 w-28 rounded-full" />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <GlassSkeleton className="h-12 flex-1 rounded-2xl" />
          <GlassSkeleton className="h-12 w-56 rounded-2xl" />
          <GlassSkeleton className="h-12 w-36 rounded-2xl" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <GlassSkeleton className="h-11 w-36 rounded-2xl" />
          <GlassSkeleton className="h-11 w-44 rounded-2xl" />
          <GlassSkeleton className="h-11 w-44 rounded-2xl" />
          <GlassSkeleton className="h-11 w-40 rounded-2xl" />
        </div>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-[30rem] rounded-[26px]" />
        ))}
      </div>
    </section>
  );
}

function RequestCardFixture() {
  return (
    <article className="rounded-[26px] border border-border bg-background p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="h-9 w-28 rounded-xl bg-slate-100" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-7 w-24 rounded-full bg-emerald-100" />
              <div className="h-7 w-28 rounded-full bg-sky-100" />
              <div className="h-7 w-32 rounded-full bg-amber-100" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-72 rounded-full bg-slate-200" />
              <div className="h-4 w-80 max-w-full rounded-full bg-slate-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border bg-muted/30 p-3 md:min-w-[320px]">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="h-3 w-20 rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-24 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="h-3 w-28 rounded-full bg-slate-100" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-40 rounded-full bg-slate-200" />
                <div className="h-4 w-36 rounded-full bg-slate-100" />
                <div className="h-4 w-44 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="h-3 w-32 rounded-full bg-slate-100" />
          <div className="mt-4 flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="min-w-[160px] flex-1 rounded-2xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <div className="h-4 w-28 rounded-full bg-slate-200" />
                </div>
                <div className="mt-3 h-4 w-32 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-28 rounded-2xl bg-slate-100" />
            <div className="h-10 w-40 rounded-2xl bg-emerald-100" />
            <div className="h-10 w-32 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </article>
  );
}

function TripRequestsShellFixture() {
  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <div className="h-3.5 w-3.5 rounded-full bg-emerald-300" />
              <div className="h-2.5 w-28 rounded-full bg-emerald-200" />
            </div>
            <div className="h-12 w-96 max-w-full rounded-2xl bg-slate-200" />
            <div className="h-4 w-[32rem] max-w-full rounded-full bg-slate-100" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <GlassCard key={index} padding="md" className="w-28">
                <div className="h-3 w-16 rounded-full bg-slate-100" />
                <div className="mt-3 h-8 w-10 rounded-xl bg-slate-200" />
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-10 w-28 rounded-full bg-slate-100" />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <div className="h-12 flex-1 rounded-2xl bg-slate-100" />
          <div className="h-12 w-56 rounded-2xl bg-slate-100" />
          <div className="h-12 w-36 rounded-2xl bg-slate-100" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="h-11 w-36 rounded-2xl bg-slate-100" />
          <div className="h-11 w-44 rounded-2xl bg-amber-100" />
          <div className="h-11 w-44 rounded-2xl bg-sky-100" />
          <div className="h-11 w-40 rounded-2xl bg-emerald-100" />
        </div>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <RequestCardFixture key={index} />
        ))}
      </div>
    </section>
  );
}

export function TripRequestsShellBone({ loading = true }: { loading?: boolean }) {
  return (
    <Skeleton
      name="trip-requests-shell"
      loading={loading}
      animate="shimmer"
      transition
      stagger
      fallback={<TripRequestsShellFallback />}
      fixture={<TripRequestsShellFixture />}
      className="h-full"
    >
      <TripRequestsShellFixture />
    </Skeleton>
  );
}
