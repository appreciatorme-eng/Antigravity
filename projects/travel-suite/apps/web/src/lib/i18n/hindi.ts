export type LangKey =
  | 'dashboard' | 'trips' | 'clients' | 'inbox' | 'revenue' | 'settings'
  | 'new_trip' | 'quick_quote' | 'send_invoice' | 'today' | 'namaste'
  | 'good_morning' | 'good_afternoon' | 'good_evening'
  | 'active_trips' | 'revenue_today' | 'pending_quotes' | 'new_leads'
  | 'action_required' | 'view_all' | 'save' | 'cancel' | 'close'
  | 'send' | 'create' | 'edit' | 'delete' | 'search' | 'filter'
  | 'payment_received' | 'payment_pending' | 'invoice_sent'
  | 'driver_assigned' | 'trip_started' | 'trip_completed'
  | 'proposal_sent' | 'proposal_signed' | 'client_portal'
  | 'total_amount' | 'per_person' | 'nights' | 'days' | 'travelers'
  | 'destination' | 'package' | 'itinerary' | 'booking_confirmed'
  | 'gst_included' | 'billing' | 'team' | 'logout' | 'profile'

export type Language = 'en' | 'hi'

export const EN: Record<LangKey, string> = {
  dashboard: 'Dashboard',
  trips: 'Trips',
  clients: 'Clients',
  inbox: 'Inbox',
  revenue: 'Revenue',
  settings: 'Settings',
  new_trip: 'New Trip',
  quick_quote: 'Quick Quote',
  send_invoice: 'Send Invoice',
  today: 'Today',
  namaste: 'Good day',
  good_morning: 'Good Morning',
  good_afternoon: 'Good Afternoon',
  good_evening: 'Good Evening',
  active_trips: 'Active Trips',
  revenue_today: "Today's Revenue",
  pending_quotes: 'Pending Quotes',
  new_leads: 'New Leads',
  action_required: 'Action Required',
  view_all: 'View All',
  save: 'Save',
  cancel: 'Cancel',
  close: 'Close',
  send: 'Send',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  search: 'Search',
  filter: 'Filter',
  payment_received: 'Payment Received',
  payment_pending: 'Payment Pending',
  invoice_sent: 'Invoice Sent',
  driver_assigned: 'Driver Assigned',
  trip_started: 'Trip Started',
  trip_completed: 'Trip Completed',
  proposal_sent: 'Proposal Sent',
  proposal_signed: 'Proposal Signed',
  client_portal: 'Client Portal',
  total_amount: 'Total Amount',
  per_person: 'Per Person',
  nights: 'Nights',
  days: 'Days',
  travelers: 'Travelers',
  destination: 'Destination',
  package: 'Package',
  itinerary: 'Itinerary',
  booking_confirmed: 'Booking Confirmed',
  gst_included: 'GST Included',
  billing: 'Billing',
  team: 'Team',
  logout: 'Logout',
  profile: 'Profile',
}

export const HI: Record<LangKey, string> = {
  dashboard: 'डैशबोर्ड',
  trips: 'यात्राएं',
  clients: 'ग्राहक',
  inbox: 'इनबॉक्स',
  revenue: 'आमदनी',
  settings: 'सेटिंग्स',
  new_trip: 'नई यात्रा',
  quick_quote: 'जल्दी कोटेशन',
  send_invoice: 'इनवॉइस भेजें',
  today: 'आज',
  namaste: 'नमस्ते',
  good_morning: 'सुप्रभात',
  good_afternoon: 'शुभ दोपहर',
  good_evening: 'शुभ संध्या',
  active_trips: 'चल रही यात्राएं',
  revenue_today: 'आज की कमाई',
  pending_quotes: 'लंबित कोटेशन',
  new_leads: 'नए लीड',
  action_required: 'कार्रवाई जरूरी',
  view_all: 'सब देखें',
  save: 'सेव करें',
  cancel: 'रद्द करें',
  close: 'बंद करें',
  send: 'भेजें',
  create: 'बनाएं',
  edit: 'बदलें',
  delete: 'हटाएं',
  search: 'खोजें',
  filter: 'फ़िल्टर',
  payment_received: 'भुगतान मिला',
  payment_pending: 'भुगतान बाकी',
  invoice_sent: 'इनवॉइस भेजा',
  driver_assigned: 'ड्राइवर सौंपा',
  trip_started: 'यात्रा शुरू',
  trip_completed: 'यात्रा पूरी',
  proposal_sent: 'प्रस्ताव भेजा',
  proposal_signed: 'प्रस्ताव हस्ताक्षरित',
  client_portal: 'क्लाइंट पोर्टल',
  total_amount: 'कुल रकम',
  per_person: 'प्रति व्यक्ति',
  nights: 'रातें',
  days: 'दिन',
  travelers: 'यात्री',
  destination: 'गंतव्य',
  package: 'पैकेज',
  itinerary: 'यात्रा कार्यक्रम',
  booking_confirmed: 'बुकिंग पक्की',
  gst_included: 'GST शामिल',
  billing: 'बिलिंग',
  team: 'टीम',
  logout: 'लॉग आउट',
  profile: 'प्रोफ़ाइल',
}

export function t(key: LangKey, lang: Language = 'en'): string {
  return lang === 'hi' ? HI[key] : EN[key]
}

export function useTranslation(lang: Language) {
  return {
    t: (key: LangKey) => t(key, lang),
    lang,
  }
}
