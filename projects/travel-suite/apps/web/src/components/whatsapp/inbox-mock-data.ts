// WhatsApp + Email mock conversations for GoBuddy Adventures demo inbox.
// Names and trip references aligned with DEMO_CLIENTS and DEMO_TRIPS.

import type { Conversation } from './MessageThread';
import type { ChatbotSessionSummary } from './whatsapp.types';

export type ChannelType = 'whatsapp' | 'email';

export interface ChannelConversation extends Conversation {
  channel: ChannelType;
  chatbotSession?: ChatbotSessionSummary | null;
}

// ─── WHATSAPP CONVERSATIONS ──────────────────────────────────────────────────

const WHATSAPP_CONVERSATIONS: ChannelConversation[] = [
  {
    id: 'conv_1',
    channel: 'whatsapp',
    unreadCount: 2,
    contact: {
      id: 'c1',
      name: 'Priya Mehta',
      phone: '+91 98765 43210',
      type: 'client',
      avatarColor: '#6366f1',
      isOnline: true,
      trip: 'Andaman Island Break',
      label: 'confirmed',
      preferredLanguage: 'en',
    },
    messages: [
      { id: 'm1', type: 'system', direction: 'in', body: 'Conversation started', timestamp: '9:00 AM' },
      { id: 'm2', type: 'text', direction: 'out', body: 'Namaste Priya Ji! \u{1F64F} Aapki Andaman trip ka sara arrangement ho gaya hai. Driver Raju Singh kal subah 6 baje Port Blair airport pe milenge.', timestamp: '9:15 AM', status: 'read' },
      { id: 'm3', type: 'text', direction: 'in', body: 'Bahut shukriya! Ek kaam tha \u2014 hotel early check-in possible hai kya? Hum thake hue honge.', timestamp: '10:02 AM' },
      { id: 'm4', type: 'text', direction: 'in', body: 'Aur Havelock pe scuba diving included hai na package mein?', timestamp: '10:03 AM' },
      { id: 'm5', type: 'text', direction: 'out', body: 'Bilkul Priya Ji! Early check-in request bhej di. Scuba diving included hai \u2014 2 dives Radhanagar Beach pe. \u2705', timestamp: '10:18 AM', status: 'delivered' },
    ],
  },
  {
    id: 'conv_2',
    channel: 'whatsapp',
    unreadCount: 0,
    contact: {
      id: 'd1',
      name: 'Driver Raju Singh',
      phone: '+91 87654 32109',
      type: 'driver',
      avatarColor: '#f59e0b',
      isOnline: false,
      lastSeen: 'today at 8:45 AM',
      label: 'location',
      preferredLanguage: 'hi',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'out', body: 'Raju bhai, aaj Mehta ji ka pickup 6 AM pe hai Port Blair airport. Gaadi clean rakhna.', timestamp: '5:00 AM', status: 'read' },
      { id: 'm2', type: 'text', direction: 'in', body: 'Ji sir, ready hoon. Innova kal raat hi clean kar di thi.', timestamp: '5:45 AM' },
      { id: 'm3', type: 'location', direction: 'in', locationLabel: 'Raju is near Port Blair Airport', lat: 11.6411, lng: 92.7297, timestamp: '5:58 AM' },
    ],
  },
  {
    id: 'conv_3',
    channel: 'whatsapp',
    chatbotSession: {
      id: 'chatbot_demo_lead',
      state: 'qualifying',
      aiReplyCount: 2,
      updatedAt: new Date().toISOString(),
    },
    unreadCount: 1,
    contact: {
      id: 'l1',
      name: 'New Lead',
      phone: '+91 76543 21098',
      type: 'lead',
      avatarColor: '#ec4899',
      isOnline: true,
      label: 'lead',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'in', body: 'Bhai Rajasthan 5 din ka rate batao. Family of 4, 2 adult 2 kids. Budget mein best option chahiye.', timestamp: '11:30 AM' },
    ],
  },
  {
    id: 'conv_4',
    channel: 'whatsapp',
    unreadCount: 3,
    contact: {
      id: 'c2',
      name: 'Rajesh Sharma',
      phone: '+91 65432 10987',
      type: 'client',
      avatarColor: '#10b981',
      isOnline: false,
      lastSeen: 'today at 9:00 AM',
      trip: 'Rajasthan Royal Tour',
      label: 'payment',
      preferredLanguage: 'en',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'in', body: 'Namaste, GST invoice bhejiye company reimbursement ke liye.', timestamp: '8:00 AM' },
      { id: 'm2', type: 'text', direction: 'in', body: 'GSTIN hamare hai: 07AAGCS2108D1ZX', timestamp: '8:05 AM' },
      { id: 'm3', type: 'text', direction: 'out', body: 'Ji Rajesh Ji! GST invoice generate kar raha hoon. 10 minute mein email aur WhatsApp dono pe bhejta hoon.', timestamp: '9:35 AM', status: 'read' },
      { id: 'm4', type: 'text', direction: 'in', body: 'Abhi tak nahi aaya invoice. Please check karo.', timestamp: '11:00 AM' },
    ],
  },
  {
    id: 'conv_5',
    channel: 'whatsapp',
    unreadCount: 0,
    contact: {
      id: 'd2',
      name: 'Driver Suresh Kumar',
      phone: '+91 54321 09876',
      type: 'driver',
      avatarColor: '#f97316',
      isOnline: true,
      lastSeen: 'now',
      preferredLanguage: 'hi',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'in', body: 'Sir aaj Kochi highway pe traffic bahut hai. 20 minute late ho sakta hoon Kerala trip pickup ke liye. Client ko inform kar dein?', timestamp: '7:30 AM' },
      { id: 'm2', type: 'text', direction: 'out', body: 'Haan Suresh, main Vikram Ji ko inform karta hoon. Tu dhyan se aa.', timestamp: '7:32 AM', status: 'read' },
      { id: 'm3', type: 'location', direction: 'in', locationLabel: 'Suresh current location', lat: 9.9312, lng: 76.2673, timestamp: '7:45 AM' },
    ],
  },
  {
    id: 'conv_6',
    channel: 'whatsapp',
    unreadCount: 1,
    contact: {
      id: 'l2',
      name: 'Unknown Lead',
      phone: '+91 43210 98765',
      type: 'lead',
      avatarColor: '#8b5cf6',
      isOnline: false,
      lastSeen: '30 min ago',
      label: 'lead',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'in', body: 'Hello, Kerala honeymoon package ki inquiry thi. 5 star hotels chahiye. Budget flexible hai. April mein plan kar rahe hain.', timestamp: '10:00 AM' },
    ],
  },
  {
    id: 'conv_7',
    channel: 'whatsapp',
    unreadCount: 0,
    contact: {
      id: 'c3',
      name: 'Ananya Gupta',
      phone: '+91 76543 00111',
      type: 'client',
      avatarColor: '#3b82f6',
      isOnline: false,
      lastSeen: 'yesterday',
      trip: 'Andaman Island Package',
      preferredLanguage: 'en',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'out', body: 'Ananya Ji, Andaman package ka itinerary aur hotel vouchers bhej raha hoon.', timestamp: 'Yesterday 4:00 PM', status: 'read' },
      { id: 'm2', type: 'document', direction: 'out', docName: 'Andaman_Itinerary_Gupta.pdf', docSize: '1.4 MB', timestamp: 'Yesterday 4:01 PM', status: 'read' },
      { id: 'm3', type: 'text', direction: 'in', body: 'Thank you! Can we add one extra night in Udaipur?', timestamp: 'Yesterday 5:30 PM' },
    ],
  },
];

// ─── EMAIL CONVERSATIONS ─────────────────────────────────────────────────────

const EMAIL_CONVERSATIONS: ChannelConversation[] = [
  {
    id: 'email_1',
    channel: 'email',
    unreadCount: 1,
    contact: {
      id: 'ec1',
      name: 'Sunita Patel',
      phone: '+91 54321 09876',
      email: 'sunita.patel@gmail.com',
      type: 'client',
      avatarColor: '#8b5cf6',
      isOnline: false,
      trip: 'Kerala Backwaters Escape',
      preferredLanguage: 'en',
    },
    messages: [
      {
        id: 'em1',
        type: 'text',
        direction: 'in',
        subject: 'Kerala Group Trip — Final Itinerary Query',
        body: 'Hi Team,\n\nWanted to follow up on the Kerala group itinerary. Could you share the final day-wise plan with hotel confirmations for all 8 members?\n\nAlso, is ayurveda massage session included in the package or extra?\n\nThanks,\nSunita',
        timestamp: '9:45 AM',
      },
    ],
  },
  {
    id: 'email_2',
    channel: 'email',
    unreadCount: 2,
    contact: {
      id: 'ec2',
      name: 'Vikram Joshi',
      phone: '+91 65432 10987',
      email: 'vikram.joshi@gmail.com',
      type: 'client',
      avatarColor: '#0ea5e9',
      isOnline: false,
      trip: 'Leh Ladakh Bike Expedition',
      label: 'payment',
      preferredLanguage: 'en',
    },
    messages: [
      {
        id: 'em1',
        type: 'text',
        direction: 'out',
        subject: 'Re: Leh Ladakh Expedition — Balance Payment',
        body: 'Dear Vikram,\n\nYour Leh Ladakh Bike Expedition starts April 10. A balance of ₹48,000 is pending.\n\nPayment details:\n- UPI: gobuddyadventures@icici\n- NEFT: HDFC Bank, A/C: 50100123456789\n\nPlease pay by April 5 to confirm your slot.\n\nBest,\nGoBuddy Adventures',
        timestamp: 'Yesterday 3:00 PM',
        status: 'read',
      },
      {
        id: 'em2',
        type: 'text',
        direction: 'in',
        subject: 'Re: Leh Ladakh Expedition — Balance Payment',
        body: 'Hi,\n\nWill pay by April 3. Also need clarification:\n1. Is Royal Enfield Himalayan available for all 4 riders?\n2. What happens if Khardung La is closed due to weather?\n\nThanks,\nVikram',
        timestamp: '8:30 AM',
      },
    ],
  },
  {
    id: 'email_3',
    channel: 'email',
    unreadCount: 0,
    contact: {
      id: 'ec3',
      name: 'Deepa Kapoor',
      phone: '+91 90001 23456',
      email: 'deepa.kapoor@hotmail.com',
      type: 'client',
      avatarColor: '#f43f5e',
      isOnline: false,
      lastSeen: 'yesterday',
      trip: 'Golden Triangle Classic',
      preferredLanguage: 'en',
    },
    messages: [
      {
        id: 'em1',
        type: 'text',
        direction: 'in',
        subject: 'Invoice Request — Dubai Trip',
        body: 'Hello,\n\nCould you email me the final invoice for our Dubai family trip? We need it for corporate reimbursement.\n\nBooking ID: GB-DX2026-041\n\nThanks,\nDeepa Kapoor',
        timestamp: 'Yesterday 11:00 AM',
      },
      {
        id: 'em2',
        type: 'text',
        direction: 'out',
        subject: 'Re: Invoice Request — Dubai Trip',
        body: 'Hi Deepa,\n\nPlease find the invoice attached.\n\nBooking: GB-DX2026-041\nAmount: ₹2,40,000 (inclusive of all taxes)\nStatus: Paid in full\n\nThank you for choosing GoBuddy Adventures!\n\nBest,\nAccounts Team',
        timestamp: 'Yesterday 2:30 PM',
        status: 'read',
      },
    ],
  },
  {
    id: 'email_4',
    channel: 'email',
    unreadCount: 1,
    contact: {
      id: 'el1',
      name: 'GoBuddy Bookings',
      phone: '',
      email: 'bookings@gobuddy.in',
      type: 'lead',
      avatarColor: '#25D366',
      isOnline: false,
      label: 'confirmed',
    },
    messages: [
      {
        id: 'em1',
        type: 'text',
        direction: 'in',
        subject: 'New Booking Request — Website Form',
        body: 'New booking enquiry received:\n\nName: Rohit Verma\nEmail: rohit.verma@gmail.com\nPhone: +91 40006 78901\nDestination: Rajasthan\nDuration: 8 nights\nPax: 12 adults\nBudget: ₹1,50,000\nPreferred dates: October 15-23\n\nNotes: "Annual alumni group trip. Same as last year. Golden Triangle + Desert Safari."',
        timestamp: '10:15 AM',
      },
    ],
  },
];

// ─── MOCK DETAILS ────────────────────────────────────────────────────────────

export const MOCK_CLIENT_DETAILS: Record<string, {
  email: string;
  ltv: string;
  trips: number;
  stage: string;
  recentTrips: string[];
}> = {
  c1: {
    email: 'priya.mehta@gmail.com',
    ltv: '₹3,60,000',
    trips: 3,
    stage: 'VIP Client',
    recentTrips: ['Andaman Island Break', 'Maldives Water Villa 5N', 'Rajasthan Luxury 7N'],
  },
  c2: {
    email: 'rajesh.sharma@infosys.com',
    ltv: '₹3,20,000',
    trips: 1,
    stage: 'Active',
    recentTrips: ['Rajasthan Royal Tour'],
  },
  c3: {
    email: 'ananya.gupta@outlook.com',
    ltv: '₹85,000',
    trips: 0,
    stage: 'Proposal Sent',
    recentTrips: [],
  },
  ec1: {
    email: 'sunita.patel@gmail.com',
    ltv: '₹3,00,000',
    trips: 2,
    stage: 'Active',
    recentTrips: ['Kerala Backwaters Escape', 'Goa Beach Holiday'],
  },
  ec2: {
    email: 'vikram.joshi@gmail.com',
    ltv: '₹60,000',
    trips: 1,
    stage: 'Payment Pending',
    recentTrips: ['Leh Ladakh Bike Expedition'],
  },
  ec3: {
    email: 'deepa.kapoor@hotmail.com',
    ltv: '₹2,40,000',
    trips: 1,
    stage: 'VIP Client',
    recentTrips: ['Golden Triangle Classic'],
  },
};

export const MOCK_DRIVER_DETAILS: Record<string, {
  vehicle: string;
  vehicleNumber: string;
  currentTrip: string;
  rating: number;
}> = {
  d1: {
    vehicle: 'Toyota Innova Crysta',
    vehicleNumber: 'AN 01 AB 1234',
    currentTrip: 'Priya Mehta — Andaman Island Break',
    rating: 4.9,
  },
  d2: {
    vehicle: 'Maruti Ertiga',
    vehicleNumber: 'KL 07 CD 5678',
    currentTrip: 'Vikram Joshi — Kerala Backwaters',
    rating: 4.7,
  },
};

// ─── COMBINED EXPORT ─────────────────────────────────────────────────────────

export const ALL_MOCK_CONVERSATIONS: ChannelConversation[] = [
  ...WHATSAPP_CONVERSATIONS,
  ...EMAIL_CONVERSATIONS,
];
