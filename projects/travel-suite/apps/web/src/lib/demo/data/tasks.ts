// Demo Mode — "Needs Your Attention" tasks and today's schedule for TripBuilt.
// Returned by useDashboardTasks() and useDashboardSchedule() when isDemoMode is true.

import type { TaskItem, ScheduleEvent } from "@/lib/queries/dashboard-tasks";

export const DEMO_TASKS: TaskItem[] = [
  {
    id: "dtask-001",
    priority: "high",
    type: "driver_unassigned",
    description: "Kashmir Houseboat & Meadows — no driver assigned yet (4 pax, Apr 1)",
    timestamp: "2026-03-05T08:00:00Z",
    entityId: "dt-007",
    entityData: {
      tripTitle: "Kashmir Houseboat & Meadows",
      startDate: "2026-04-01",
      passengerCount: 4,
      destination: "Srinagar, Pahalgam, Gulmarg",
    },
  },
  {
    id: "dtask-002",
    priority: "high",
    type: "payment_overdue",
    description: "Leh Ladakh Expedition — ₹48,000 balance pending from Vikram Joshi",
    timestamp: "2026-03-04T14:00:00Z",
    entityId: "dt-002",
    entityData: {
      tripTitle: "Leh Ladakh Bike Expedition",
      clientName: "Vikram Joshi",
      amountPending: 48000,
      startDate: "2026-04-10",
    },
  },
  {
    id: "dtask-003",
    priority: "medium",
    type: "new_whatsapp_lead",
    description: "3 new WhatsApp enquiries waiting in inbox",
    count: 3,
    timestamp: "2026-03-05T07:30:00Z",
    entityId: "inbox",
    entityData: {
      count: 3,
      latestMessage: "Bhai Rajasthan 5 din ka rate batao — Family of 4",
    },
  },
  {
    id: "dtask-004",
    priority: "medium",
    type: "proposal_not_viewed",
    description: "Himachal Adventure proposal not viewed in 3 days — Sanjay Malhotra",
    timestamp: "2026-03-02T09:00:00Z",
    entityId: "dp-004",
    entityData: {
      proposalTitle: "Himachal Adventure 7N",
      clientName: "Sanjay Malhotra",
      daysSinceSent: 3,
    },
  },
  {
    id: "dtask-005",
    priority: "info",
    type: "trips_departing",
    description: "2 trips departing this week — review drivers and documents",
    count: 2,
    timestamp: "2026-03-05T06:00:00Z",
    entityId: "schedule",
    entityData: {
      count: 2,
      trips: ["Kerala Backwaters Escape (Mar 15)", "Goa Beach Holiday (Mar 20)"],
    },
  },
];

export const DEMO_SCHEDULE: ScheduleEvent[] = [
  {
    id: "dsched-001",
    tripId: "dt-008",
    time: "06:00",
    title: "Golden Triangle Classic",
    location: "Delhi IGI Airport — Terminal 3",
    clientName: "Deepa Kapoor",
    clientPhone: "+91 90001 23456",
    driverName: "Raju Singh",
    driverPhone: "+91 87654 32109",
    driverVehicle: "Toyota Innova Crysta — DL 01 AB 1234",
    status: "completed",
    passengerCount: 4,
  },
  {
    id: "dsched-002",
    tripId: "dt-003",
    time: "09:30",
    title: "Kerala Backwaters Escape",
    location: "Kochi Airport — Arrivals Gate B",
    clientName: "Vikram Joshi",
    clientPhone: "+91 65432 10987",
    driverName: "Suresh Kumar",
    driverPhone: "+91 54321 09876",
    driverVehicle: "Maruti Ertiga — KL 07 CD 5678",
    status: "active",
    passengerCount: 2,
  },
  {
    id: "dsched-003",
    tripId: "dt-009",
    time: "14:00",
    title: "Goa Beach Holiday",
    location: "North Goa Resort — Hotel Check-In",
    clientName: "Sunita Patel",
    clientPhone: "+91 54321 09876",
    driverName: "Mohan Yadav",
    driverPhone: "+91 99887 76655",
    driverVehicle: "Toyota Innova Crysta — GA 01 EF 9012",
    status: "upcoming",
    passengerCount: 6,
  },
];
