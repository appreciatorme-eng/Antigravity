"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useDemoMode } from "@/lib/demo/demo-mode-context";
import { DEMO_TASKS, DEMO_SCHEDULE } from "@/lib/demo/data";

// ---------------------------------------------------------------------------
// Types matching the API responses
// ---------------------------------------------------------------------------

export interface TaskItem {
  id: string;
  priority: "high" | "medium" | "info";
  type: string;
  description: string;
  count?: number;
  timestamp: string;
  entityId: string;
  entityData: Record<string, unknown>;
}

export interface DashboardTasksResponse {
  tasks: TaskItem[];
  completedTasks: TaskItem[];
}

export interface ScheduleEvent {
  id: string;
  tripId: string;
  time: string;
  title: string;
  location: string;
  clientName: string;
  clientPhone: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverVehicle: string | null;
  status: "completed" | "active" | "upcoming" | "alert";
  passengerCount: number | null;
}

export interface DashboardScheduleResponse {
  events: ScheduleEvent[];
  completedCount: number;
}

export interface DriverSearchResult {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: string | null;
  vehiclePlate: string | null;
  photoUrl: string | null;
  todayTripCount: number;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const dashboardTasksKeys = {
  all: ["dashboard-tasks"] as const,
  schedule: ["dashboard-schedule"] as const,
  driverSearch: (query: string) => ["driver-search", query] as const,
};

// ---------------------------------------------------------------------------
// Local dismiss persistence (localStorage fallback)
// ---------------------------------------------------------------------------

const LOCAL_DISMISSED_KEY = "dashboard-dismissed-tasks";

function getLocalDismissedIds(): Set<string> {
  try {
    if (typeof window === "undefined") return new Set();
    const raw = localStorage.getItem(LOCAL_DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function addLocalDismissedId(taskId: string): void {
  try {
    if (typeof window === "undefined") return;
    const ids = getLocalDismissedIds();
    ids.add(taskId);
    localStorage.setItem(LOCAL_DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    /* silently ignore storage errors */
  }
}

function removeLocalDismissedIds(taskIds: string[]): void {
  try {
    if (typeof window === "undefined") return;
    const ids = getLocalDismissedIds();
    for (const id of taskIds) {
      ids.delete(id);
    }
    localStorage.setItem(LOCAL_DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    /* silently ignore storage errors */
  }
}

/** Filter server data against locally dismissed IDs */
function applyLocalDismissals(
  data: DashboardTasksResponse,
): DashboardTasksResponse {
  const dismissed = getLocalDismissedIds();
  if (dismissed.size === 0) return data;

  const stillActive = data.tasks.filter((t) => !dismissed.has(t.id));
  const locallyDismissed = data.tasks.filter((t) => dismissed.has(t.id));

  // Clean up stale localStorage entries for tasks no longer in server response
  const allServerIds = new Set([
    ...data.tasks.map((t) => t.id),
    ...data.completedTasks.map((t) => t.id),
  ]);
  const staleIds = [...dismissed].filter((id) => !allServerIds.has(id));
  if (staleIds.length > 0) {
    removeLocalDismissedIds(staleIds);
  }

  return {
    tasks: stillActive,
    completedTasks: [...data.completedTasks, ...locallyDismissed],
  };
}

// ---------------------------------------------------------------------------
// Helper: get auth headers
// ---------------------------------------------------------------------------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

// ---------------------------------------------------------------------------
// 1. useDashboardTasks
// ---------------------------------------------------------------------------

export function useDashboardTasks() {
  const { isDemoMode } = useDemoMode();

  return useQuery<DashboardTasksResponse, Error, DashboardTasksResponse>({
    queryKey: [...dashboardTasksKeys.all, isDemoMode ? "demo" : "live"],
    queryFn: async () => {
      if (isDemoMode) {
        return { tasks: DEMO_TASKS, completedTasks: [] };
      }

      const headers = await getAuthHeaders();
      const response = await fetch("/api/dashboard/tasks", { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard tasks");
      }

      return response.json() as Promise<DashboardTasksResponse>;
    },
    select: applyLocalDismissals,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ---------------------------------------------------------------------------
// 2. useDashboardSchedule
// ---------------------------------------------------------------------------

export function useDashboardSchedule() {
  const { isDemoMode } = useDemoMode();

  return useQuery<DashboardScheduleResponse>({
    queryKey: [...dashboardTasksKeys.schedule, isDemoMode ? "demo" : "live"],
    queryFn: async () => {
      if (isDemoMode) {
        return { events: DEMO_SCHEDULE, completedCount: 1 };
      }

      const headers = await getAuthHeaders();
      const response = await fetch("/api/dashboard/schedule", { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard schedule");
      }

      return response.json() as Promise<DashboardScheduleResponse>;
    },
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// 3. useDriverSearch
// ---------------------------------------------------------------------------

export function useDriverSearch(query: string) {
  return useQuery<DriverSearchResult[]>({
    queryKey: dashboardTasksKeys.driverSearch(query),
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const url = `/api/drivers/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error("Failed to search drivers");
      }

      const payload = await response.json();
      return payload.drivers as DriverSearchResult[];
    },
    enabled: true,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// 4. useDismissTask
// ---------------------------------------------------------------------------

export interface DismissTaskInput {
  taskId: string;
  taskType: string;
  entityId: string;
}

export function useDismissTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DismissTaskInput) => {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/dashboard/tasks/dismiss", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: input.taskId,
          taskType: input.taskType,
          entityId: input.entityId,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(
          (errorPayload as { error?: string }).error || "Failed to dismiss task",
        );
      }

      return response.json() as Promise<{ success: boolean }>;
    },

    onMutate: async (input: DismissTaskInput) => {
      // Persist dismiss locally so it survives re-fetches and page reloads
      addLocalDismissedId(input.taskId);

      await queryClient.cancelQueries({ queryKey: dashboardTasksKeys.all });

      const previous = queryClient.getQueryData<DashboardTasksResponse>(
        dashboardTasksKeys.all,
      );

      if (previous) {
        const dismissedTask = previous.tasks.find((t) => t.id === input.taskId);
        const updatedData: DashboardTasksResponse = {
          tasks: previous.tasks.filter((t) => t.id !== input.taskId),
          completedTasks: dismissedTask
            ? [...previous.completedTasks, dismissedTask]
            : previous.completedTasks,
        };
        queryClient.setQueryData<DashboardTasksResponse>(
          dashboardTasksKeys.all,
          updatedData,
        );
      }

      return { previous };
    },

    onSuccess: () => {
      // Server confirmed the dismiss — refetch to get clean server state
      queryClient.invalidateQueries({ queryKey: dashboardTasksKeys.all });
    },

    // No onError rollback — localStorage keeps the task dismissed in the UI
    // even if the API call fails. The select transform in useDashboardTasks
    // filters out locally-dismissed tasks from any server re-fetch.
  });
}
