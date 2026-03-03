import type { Conversation } from './MessageThread';

export type ChannelType = 'whatsapp' | 'email';

export interface ChannelConversation extends Conversation {
  channel: ChannelType;
}

// ─── WHATSAPP CONVERSATIONS ──────────────────────────────────────────────────

const WHATSAPP_CONVERSATIONS: ChannelConversation[] = [
  {
    id: 'conv_1',
    channel: 'whatsapp',
    unreadCount: 2,
    contact: {
      id: 'c1',
      name: 'Mrs. Kavita Sharma',
      phone: '+91 98765 43210',
      type: 'client',
      avatarColor: '#6366f1',
      isOnline: true,
      trip: 'Kerala Honeymoon 6N/7D',
      label: 'confirmed',
    },
    messages: [
      { id: 'm1', type: 'system', direction: 'in', body: 'Conversation started', timestamp: '9:00 AM' },
      { id: 'm2', type: 'text', direction: 'out', body: 'Namaste Kavita Ji! \u{1F64F} Aapki Kerala trip ka sara arrangement ho gaya hai. Driver Suresh kal subah 6 baje aayenge.', timestamp: '9:15 AM', status: 'read' },
      { id: 'm3', type: 'text', direction: 'in', body: 'Bahut shukriya! Ek kaam tha \u2014 kal pickup 6 baje ki jagah 6:30 baje kar do please. Husband thoda late ready hoga.', timestamp: '10:02 AM' },
      { id: 'm4', type: 'text', direction: 'in', body: 'Aur hotel mein early check-in possible hai kya?', timestamp: '10:03 AM' },
      { id: 'm5', type: 'text', direction: 'out', body: 'Bilkul Kavita Ji! Pickup time 6:30 AM kar diya. Hotel early check-in ke liye request bhej raha hoon. \u2705', timestamp: '10:18 AM', status: 'delivered' },
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
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'out', body: 'Raju bhai, aaj Sharma ji ka pickup 6 AM pe hai. Gaadi clean rakhna.', timestamp: '5:00 AM', status: 'read' },
      { id: 'm2', type: 'text', direction: 'in', body: 'Ji sir, ready hoon. Gaadi kal raat hi clean kar di thi.', timestamp: '5:45 AM' },
      { id: 'm3', type: 'location', direction: 'in', locationLabel: 'Raju is near Connaught Place', lat: 28.6315, lng: 77.2167, timestamp: '5:58 AM' },
    ],
  },
  {
    id: 'conv_3',
    channel: 'whatsapp',
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
      { id: 'm1', type: 'text', direction: 'in', body: 'Bhai Goa 4 din ka tour kya rate hai? Family trip hai, 2 adult 2 kids. Budget mein best option chahiye.', timestamp: '11:30 AM' },
    ],
  },
  {
    id: 'conv_4',
    channel: 'whatsapp',
    unreadCount: 3,
    contact: {
      id: 'c2',
      name: 'Rajesh Gupta',
      phone: '+91 65432 10987',
      type: 'client',
      avatarColor: '#10b981',
      isOnline: false,
      lastSeen: 'today at 9:00 AM',
      trip: 'Rajasthan Royal Tour',
      label: 'payment',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'in', body: 'Namaste, invoice bhejiye GST wala. Company reimbursement ke liye chahiye.', timestamp: '8:00 AM' },
      { id: 'm2', type: 'text', direction: 'in', body: 'GSTIN hamare hai: 07AAGCS2108D1ZX', timestamp: '8:05 AM' },
      { id: 'm3', type: 'text', direction: 'out', body: 'Ji Rajesh Ji! GST invoice generate kar raha hoon. 10 minute mein email aur WhatsApp dono pe bhejta hoon.', timestamp: '9:35 AM', status: 'read' },
      { id: 'm4', type: 'text', direction: 'in', body: 'Abhi tak nahi aaya. Please check karo.', timestamp: '11:00 AM' },
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
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'in', body: 'Sir aaj traffic bahut hai Expressway pe. 20 minute late ho sakta hoon. Client ko inform kar dein?', timestamp: '7:30 AM' },
      { id: 'm2', type: 'text', direction: 'out', body: 'Haan Suresh, main client ko inform karta hoon. Tu dhyan se aa.', timestamp: '7:32 AM', status: 'read' },
      { id: 'm3', type: 'location', direction: 'in', locationLabel: 'Suresh current location', lat: 28.4595, lng: 77.0266, timestamp: '7:45 AM' },
    ],
  },
  {
    id: 'conv_6',
    channel: 'whatsapp',
    unreadCount: 1,
    contact: {
      id: 'l2',
      name: 'MakeMyTrip Lead',
      phone: '+91 43210 98765',
      type: 'lead',
      avatarColor: '#8b5cf6',
      isOnline: false,
      lastSeen: '30 min ago',
      label: 'lead',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'in', body: 'Hello, Kerala honeymoon package ki inquiry thi. 5 star hotels chahiye. Budget flexible hai. January mein plan kar rahe hain.', timestamp: '10:00 AM' },
    ],
  },
  {
    id: 'conv_7',
    channel: 'whatsapp',
    unreadCount: 0,
    contact: {
      id: 'c3',
      name: 'Amit Mehta',
      phone: '+91 90000 12345',
      type: 'client',
      avatarColor: '#3b82f6',
      isOnline: false,
      lastSeen: 'yesterday',
      trip: 'Manali Snow Trip',
    },
    messages: [
      { id: 'm1', type: 'text', direction: 'out', body: 'Amit Ji, Manali trip ka itinerary aur hotel vouchers bhej raha hoon.', timestamp: 'Yesterday 4:00 PM', status: 'read' },
      { id: 'm2', type: 'document', direction: 'out', docName: 'Manali_Itinerary_Mehta.pdf', docSize: '1.2 MB', timestamp: 'Yesterday 4:01 PM', status: 'read' },
      { id: 'm3', type: 'text', direction: 'in', body: 'Thank you so much! Bahut achi planning ki hai. Family excited hai!', timestamp: 'Yesterday 5:30 PM' },
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
      name: 'Priya Patel',
      phone: '',
      email: 'priya.patel@outlook.com',
      type: 'client',
      avatarColor: '#8b5cf6',
      isOnline: false,
      trip: 'Andaman Beach Getaway',
    },
    messages: [
      {
        id: 'em1',
        type: 'text',
        direction: 'in',
        subject: 'Andaman Trip Itinerary Query',
        body: 'Hi Team,\n\nI wanted to follow up on the Andaman itinerary we discussed last week. Could you share the final day-wise plan along with the hotel confirmations?\n\nAlso, is scuba diving included in the package or is it extra?\n\nThanks,\nPriya',
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
      name: 'Vikram Singh',
      phone: '+91 99887 76655',
      email: 'vikram.singh@tcs.com',
      type: 'client',
      avatarColor: '#0ea5e9',
      isOnline: false,
      trip: 'Corporate Offsite Jaipur',
      label: 'payment',
    },
    messages: [
      {
        id: 'em1',
        type: 'text',
        direction: 'out',
        subject: 'Re: Corporate Offsite Proposal - 50 pax Jaipur',
        body: 'Dear Vikram,\n\nPlease find attached the revised proposal for the 3-day corporate offsite in Jaipur for 50 participants.\n\nHighlights:\n- Rambagh Palace for gala dinner\n- Team building at Amer Fort\n- Desert safari with cultural evening\n\nTotal: \u20B918,50,000 + GST\n\nLooking forward to your confirmation.\n\nBest regards,\nGoBuddy Adventures',
        timestamp: 'Yesterday 3:00 PM',
        status: 'read',
      },
      {
        id: 'em2',
        type: 'text',
        direction: 'in',
        subject: 'Re: Corporate Offsite Proposal - 50 pax Jaipur',
        body: 'Hi,\n\nThe proposal looks good. Two changes:\n1. Can we replace the desert safari with a heritage walk?\n2. Need GST invoice for advance payment of 50%.\n\nPlease share revised quote and proforma invoice.\n\nRegards,\nVikram Singh\nTCS - Events Team',
        timestamp: '8:30 AM',
      },
      {
        id: 'em3',
        type: 'text',
        direction: 'in',
        subject: 'Re: Corporate Offsite Proposal - 50 pax Jaipur',
        body: 'Also, please add vegetarian meal options for 15 participants. Finance team needs the invoice by EOD today for the PO.\n\nThanks,\nVikram',
        timestamp: '8:45 AM',
      },
    ],
  },
  {
    id: 'email_3',
    channel: 'email',
    unreadCount: 0,
    contact: {
      id: 'ec3',
      name: 'Anita Desai',
      phone: '+91 88776 65544',
      email: 'anita.desai@gmail.com',
      type: 'client',
      avatarColor: '#f43f5e',
      isOnline: false,
      lastSeen: 'yesterday',
      trip: 'Shimla Family Package',
    },
    messages: [
      {
        id: 'em1',
        type: 'text',
        direction: 'in',
        subject: 'Invoice Request - Shimla Trip',
        body: 'Hello,\n\nCould you email me the final invoice for our Shimla family trip? We need it for reimbursement.\n\nBooking ID: GB-SH2024-089\n\nThanks,\nAnita',
        timestamp: 'Yesterday 11:00 AM',
      },
      {
        id: 'em2',
        type: 'text',
        direction: 'out',
        subject: 'Re: Invoice Request - Shimla Trip',
        body: 'Hi Anita,\n\nPlease find the invoice attached.\n\nBooking: GB-SH2024-089\nAmount: \u20B967,500 (inclusive of all taxes)\nStatus: Paid in full\n\nThank you for choosing GoBuddy Adventures!\n\nBest,\nAccounts Team',
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
        subject: 'New Booking Request - Website Form',
        body: 'New booking enquiry received:\n\nName: Deepak Verma\nEmail: deepak.verma@yahoo.com\nPhone: +91 70001 23456\nDestination: Leh Ladakh\nDuration: 7 nights\nPax: 4 adults\nBudget: \u20B92,00,000\nPreferred dates: April 15-22\n\nNotes: "Want bike trip from Manali to Leh. Need Royal Enfield bikes and support vehicle."',
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
    email: 'kavita.sharma@gmail.com',
    ltv: '\u20B91,24,000',
    trips: 4,
    stage: 'Repeat Client',
    recentTrips: ['Kerala Honeymoon 6N/7D', 'Goa Beach 4N/5D', 'Manali Winter 3N/4D'],
  },
  c2: {
    email: 'rajesh.gupta@infosys.com',
    ltv: '\u20B978,500',
    trips: 2,
    stage: 'Active',
    recentTrips: ['Rajasthan Royal Tour', 'Jim Corbett Safari'],
  },
  c3: {
    email: 'amit.mehta@tata.com',
    ltv: '\u20B942,000',
    trips: 1,
    stage: 'New Client',
    recentTrips: ['Manali Snow Trip'],
  },
  ec1: {
    email: 'priya.patel@outlook.com',
    ltv: '\u20B985,000',
    trips: 2,
    stage: 'Active',
    recentTrips: ['Andaman Beach Getaway', 'Goa New Year 2024'],
  },
  ec2: {
    email: 'vikram.singh@tcs.com',
    ltv: '\u20B94,50,000',
    trips: 3,
    stage: 'Corporate',
    recentTrips: ['Corporate Offsite Jaipur', 'TCS Goa Retreat', 'Team Building Udaipur'],
  },
  ec3: {
    email: 'anita.desai@gmail.com',
    ltv: '\u20B967,500',
    trips: 1,
    stage: 'New Client',
    recentTrips: ['Shimla Family Package'],
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
    vehicleNumber: 'DL 01 AB 1234',
    currentTrip: 'Sharma Family \u2014 Kerala',
    rating: 4.8,
  },
  d2: {
    vehicle: 'Maruti Ertiga',
    vehicleNumber: 'HR 26 CD 5678',
    currentTrip: 'Patel Group \u2014 Agra',
    rating: 4.6,
  },
};

// ─── COMBINED EXPORT ─────────────────────────────────────────────────────────

export const ALL_MOCK_CONVERSATIONS: ChannelConversation[] = [
  ...WHATSAPP_CONVERSATIONS,
  ...EMAIL_CONVERSATIONS,
];
