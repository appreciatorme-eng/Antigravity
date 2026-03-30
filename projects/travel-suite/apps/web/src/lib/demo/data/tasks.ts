// Demo Mode — task/schedule types + empty arrays.
// Returned by useDashboardTasks() and useDashboardSchedule() when isDemoMode is true.

import type { TaskItem, ScheduleEvent } from "@/lib/queries/dashboard-tasks";

export const DEMO_TASKS: TaskItem[] = [];

export const DEMO_SCHEDULE: ScheduleEvent[] = [];
