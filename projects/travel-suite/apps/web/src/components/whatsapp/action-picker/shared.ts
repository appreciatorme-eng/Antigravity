import type { ConversationContact } from "../whatsapp.types";

export type ActionPickerChannel = "whatsapp" | "email";

export type ActionPickerSendHandler = (
  message: string,
  subject?: string
) => boolean | void | Promise<boolean | void>;

export interface ActionPickerProps {
  contact: ConversationContact;
  channel: ActionPickerChannel;
  onSend: ActionPickerSendHandler;
}

export interface MockTrip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  pax: number;
  hotel: string;
  amount: number;
  bookingId: string;
  itinerarySummary: string;
}

export interface MockDriver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleNumber: string;
  rating: number;
  currentTrip?: string;
  available: boolean;
}

export const MOCK_TRIPS: MockTrip[] = [
  {
    id: "trip_1",
    name: "Kerala Honeymoon 6N/7D",
    destination: "Kerala",
    startDate: "Mar 15",
    endDate: "Mar 21",
    duration: "6N/7D",
    pax: 2,
    hotel: "Kumarakom Lake Resort",
    amount: 85000,
    bookingId: "GB-KL2024-089",
    itinerarySummary:
      "Day 1 → Cochin Arrival & Fort Kochi\nDay 2 → Munnar Tea Gardens\nDay 3 → Thekkady Wildlife\nDay 4-5 → Alleppey Houseboat\nDay 6 → Kovalam Beach\nDay 7 → Trivandrum Departure",
  },
  {
    id: "trip_2",
    name: "Rajasthan Royal Tour 7N/8D",
    destination: "Rajasthan",
    startDate: "Apr 2",
    endDate: "Apr 9",
    duration: "7N/8D",
    pax: 4,
    hotel: "Umaid Bhawan Palace",
    amount: 150000,
    bookingId: "GB-RJ2024-045",
    itinerarySummary:
      "Day 1 → Jaipur City Palace\nDay 2 → Amer Fort & Jaipur\nDay 3 → Pushkar Camel Fair\nDay 4-5 → Jodhpur Mehrangarh\nDay 6-7 → Udaipur Lakes\nDay 8 → Ahmedabad Departure",
  },
  {
    id: "trip_3",
    name: "Manali Snow Adventure 4N/5D",
    destination: "Manali",
    startDate: "Mar 28",
    endDate: "Apr 1",
    duration: "4N/5D",
    pax: 3,
    hotel: "Snow Valley Resorts",
    amount: 42000,
    bookingId: "GB-MN2024-112",
    itinerarySummary:
      "Day 1 → Delhi → Manali Drive\nDay 2 → Solang Valley Snow Activities\nDay 3 → Rohtang Pass (conditional)\nDay 4 → Old Manali & Hadimba Temple\nDay 5 → Return to Delhi",
  },
  {
    id: "trip_4",
    name: "Andaman Beach Getaway 5N/6D",
    destination: "Andaman",
    startDate: "Apr 10",
    endDate: "Apr 15",
    duration: "5N/6D",
    pax: 2,
    hotel: "Coral Reef Resort, Havelock",
    amount: 95000,
    bookingId: "GB-AN2024-067",
    itinerarySummary:
      "Day 1 → Port Blair Arrival & Cellular Jail\nDay 2 → Neil Island\nDay 3-4 → Havelock Radhanagar Beach\nDay 5 → Scuba Diving & Snorkeling\nDay 6 → Port Blair Departure",
  },
  {
    id: "trip_5",
    name: "Ladakh Bike Expedition 8N/9D",
    destination: "Ladakh",
    startDate: "Jun 1",
    endDate: "Jun 9",
    duration: "8N/9D",
    pax: 6,
    hotel: "The Grand Dragon, Leh",
    amount: 65000,
    bookingId: "GB-LD2024-023",
    itinerarySummary:
      "Day 1-2 → Manali Acclimatization\nDay 3 → Rohtang → Jispa\nDay 4 → Sarchu → Leh\nDay 5 → Leh Local Sightseeing\nDay 6 → Nubra Valley\nDay 7 → Pangong Tso\nDay 8 → Tso Moriri\nDay 9 → Leh Departure",
  },
  {
    id: "trip_6",
    name: "Goa Beach Holiday 3N/4D",
    destination: "Goa",
    startDate: "Mar 20",
    endDate: "Mar 23",
    duration: "3N/4D",
    pax: 4,
    hotel: "Grand Hyatt Goa",
    amount: 55000,
    bookingId: "GB-GA2024-201",
    itinerarySummary:
      "Day 1 → Goa Arrival, Baga & Calangute Beach\nDay 2 → North Goa Forts & Churches\nDay 3 → South Goa — Palolem & Butterfly Beach\nDay 4 → Departure",
  },
];

export const MOCK_DRIVERS: MockDriver[] = [
  {
    id: "d1",
    name: "Raju Singh",
    phone: "+91 87654 32109",
    vehicle: "Toyota Innova Crysta",
    vehicleNumber: "DL 01 AB 1234",
    rating: 4.8,
    currentTrip: "Sharma Family — Kerala",
    available: false,
  },
  {
    id: "d2",
    name: "Suresh Kumar",
    phone: "+91 54321 09876",
    vehicle: "Maruti Ertiga",
    vehicleNumber: "HR 26 CD 5678",
    rating: 4.6,
    currentTrip: "Patel Group — Agra",
    available: false,
  },
  {
    id: "d3",
    name: "Anil Verma",
    phone: "+91 99887 11223",
    vehicle: "Force Traveller (9-seater)",
    vehicleNumber: "MH 04 EF 9012",
    rating: 4.9,
    available: true,
  },
  {
    id: "d4",
    name: "Ramesh Gupta",
    phone: "+91 77665 44332",
    vehicle: "Toyota Fortuner",
    vehicleNumber: "RJ 14 GH 3456",
    rating: 4.7,
    available: true,
  },
  {
    id: "d5",
    name: "Deepak Yadav",
    phone: "+91 98765 11111",
    vehicle: "Maruti Swift Dzire",
    vehicleNumber: "UP 32 KL 7890",
    rating: 4.5,
    available: true,
  },
];

export type LocationType = "hotel" | "airport" | "railway" | "home" | "custom";

export function formatCurrency(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}
