// WhatsApp Message Templates for Indian Tour Operators
// Organized by category with Hindi/English mix

export type TemplateCategory =
  | 'BOOKING_CONFIRMATION'
  | 'DRIVER_ASSIGNMENT'
  | 'PRE_TRIP_REMINDER_48H'
  | 'PRE_TRIP_REMINDER_24H'
  | 'PRE_TRIP_REMINDER_2H'
  | 'PAYMENT_REQUEST'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_CONFIRMED'
  | 'ITINERARY_SHARE'
  | 'REVIEW_REQUEST'
  | 'NEW_LEAD_WELCOME'
  | 'QUOTE_SENT'
  | 'DRIVER_MORNING_BRIEF'
  | 'GROUP_TOUR_BROADCAST';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  language: 'en' | 'hi' | 'hinglish';
  body: string;
  variables: string[];
  preview: string;
  emoji?: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  // ─── BOOKING CONFIRMATION ───────────────────────────────────────────────────
  {
    id: 'booking_confirm_hinglish',
    name: 'Booking Confirmation (Hinglish)',
    category: 'BOOKING_CONFIRMATION',
    language: 'hinglish',
    body: `Namaste {{client_name}}! 🙏

Aapki *{{destination}}* trip confirm ho gayi hai! ✅

📅 Travel Dates: {{start_date}} - {{end_date}}
👥 Travellers: {{pax_count}} persons
🏨 Hotel: {{hotel_name}}
💰 Total Amount: ₹{{total_amount}}
🆔 Booking ID: {{booking_id}}

Aapka full itinerary neeche link pe available hai:
{{itinerary_link}}

Koi bhi sawaal ho toh seedha message karein. We are here to help! 😊

Warm Regards,
{{company_name}}`,
    variables: ['client_name', 'destination', 'start_date', 'end_date', 'pax_count', 'hotel_name', 'total_amount', 'booking_id', 'itinerary_link', 'company_name'],
    preview: 'Namaste Kavita Ji! Aapki Goa trip confirm ho gayi hai! ✅',
    emoji: '✅',
  },
  {
    id: 'booking_confirm_english',
    name: 'Booking Confirmation (English)',
    category: 'BOOKING_CONFIRMATION',
    language: 'en',
    body: `Dear {{client_name}},

Your trip to *{{destination}}* is officially confirmed! 🎉

📅 Dates: {{start_date}} to {{end_date}}
👥 Guests: {{pax_count}} persons
🏨 Accommodation: {{hotel_name}}
💰 Package Amount: ₹{{total_amount}}
🆔 Reference: {{booking_id}}

Your detailed itinerary: {{itinerary_link}}

For any assistance, reply to this message or call us.

Best regards,
{{company_name}} Team`,
    variables: ['client_name', 'destination', 'start_date', 'end_date', 'pax_count', 'hotel_name', 'total_amount', 'booking_id', 'itinerary_link', 'company_name'],
    preview: 'Dear Rajesh Ji, Your trip to Kerala is officially confirmed! 🎉',
    emoji: '🎉',
  },

  // ─── DRIVER ASSIGNMENT ──────────────────────────────────────────────────────
  {
    id: 'driver_assign_en',
    name: 'Driver Assignment (English)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'en',
    body: `Hello {{client_name}}! 🚗

Your driver details for {{destination}} trip:

👤 Driver: *{{driver_name}}*
📞 Mobile: {{driver_phone}}
🚙 Vehicle: {{vehicle_type}} ({{vehicle_number}})
⏰ Pickup Time: {{pickup_time}}
📍 Pickup Location: {{pickup_location}}

Please save the driver's number. He will call you 30 minutes before pickup.

Have a safe and wonderful journey! 🙏
{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'Hello Sharma Ji! Your driver Raju Singh (+91 87654 32109) will pick you up at 6:00 AM.',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_hindi',
    name: 'Driver Assignment (Hindi)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'hi',
    body: `Namaste {{client_name}} ji! 🙏

Aapki {{destination}} trip ke liye driver details:

👤 Driver ka naam: *{{driver_name}}*
📞 Mobile: {{driver_phone}}
🚙 Gaadi: {{vehicle_type}} ({{vehicle_number}})
⏰ Pickup time: {{pickup_time}}
📍 Pickup jagah: {{pickup_location}}

Driver aapko pickup se 30 minute pehle call karega.

Achi yatra ho! 🌟
{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'Namaste Mehta Ji! Aapki Jaipur trip ke liye driver Ramesh (+91 76543 21098) aayenge.',
    emoji: '🚗',
  },

  // ─── PRE-TRIP REMINDERS ─────────────────────────────────────────────────────
  {
    id: 'reminder_48h',
    name: 'Pre-Trip Reminder - 48 Hours',
    category: 'PRE_TRIP_REMINDER_48H',
    language: 'hinglish',
    body: `Namaste {{client_name}}! 🌟

Sirf 2 din baaki hai aapki *{{destination}}* trip mein! 🎒

📋 *Packing Checklist:*
✅ Valid ID proof (Aadhaar/Passport)
✅ Travel documents & hotel vouchers
✅ Medications & first aid
✅ Comfortable walking shoes
✅ Weather appropriate clothes

🌤 *{{destination}} Weather:* {{weather_info}}

📌 Trip starts: {{start_date}} at {{pickup_time}}

Koi preparation related sawaal ho? Reply karein! 😊

— {{company_name}}`,
    variables: ['client_name', 'destination', 'weather_info', 'start_date', 'pickup_time', 'company_name'],
    preview: 'Namaste Patel Ji! Sirf 2 din baaki hai aapki Manali trip mein! 🎒',
    emoji: '🎒',
  },
  {
    id: 'reminder_24h',
    name: 'Pre-Trip Reminder - 24 Hours',
    category: 'PRE_TRIP_REMINDER_24H',
    language: 'hinglish',
    body: `Namaste {{client_name}}! 🌅

Kal hai aapki *{{destination}}* trip! Ek baar check kar lein:

🚗 *Driver Details:*
👤 {{driver_name}} — {{driver_phone}}
🚙 {{vehicle_type}} ({{vehicle_number}})
⏰ Pickup: Kal *{{pickup_time}}* baje
📍 {{pickup_location}}

📄 Documents ready rakhein:
• Aadhaar Card
• Booking confirmation (Booking ID: {{booking_id}})

🆘 Emergency helpline: {{emergency_number}}

Kal subah pickup se 1 ghanta pehle driver call karega. Sweet dreams! 🌙

— {{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'booking_id', 'emergency_number', 'company_name'],
    preview: 'Namaste Kavita Ji! Kal hai aapki Kerala trip! Driver Suresh kal 6 AM pe aayenge.',
    emoji: '🌅',
  },
  {
    id: 'reminder_2h',
    name: 'Pre-Trip Reminder - 2 Hours',
    category: 'PRE_TRIP_REMINDER_2H',
    language: 'hinglish',
    body: `{{client_name}} Ji, aapka driver *2 ghante mein* aa raha hai! 🚗💨

👤 Driver: *{{driver_name}}*
📞 {{driver_phone}}

📍 *Driver ki Live Location:*
{{driver_live_location_link}}

⏰ ETA: {{pickup_time}}

Taiyaar ho jaiye! Bags pack kar lein. 😄

Koi problem ho toh turant call karein: {{emergency_number}}

— {{company_name}}`,
    variables: ['client_name', 'driver_name', 'driver_phone', 'driver_live_location_link', 'pickup_time', 'emergency_number', 'company_name'],
    preview: 'Sharma Ji, aapka driver 2 ghante mein aa raha hai! 🚗💨',
    emoji: '🚗',
  },

  // ─── PAYMENT TEMPLATES ───────────────────────────────────────────────────────
  {
    id: 'payment_request_upi',
    name: 'Payment Request (UPI)',
    category: 'PAYMENT_REQUEST',
    language: 'hinglish',
    body: `Namaste {{client_name}} Ji! 🙏

*{{trip_name}}* ke liye payment request:

💰 Amount: *₹{{amount}}*
📅 Due Date: {{due_date}}
🆔 Booking ID: {{booking_id}}

*Payment Options:*
📱 UPI: {{upi_id}}
🔗 Online Payment: {{payment_link}}
🏦 Bank Transfer:
   Account: {{bank_account}}
   IFSC: {{bank_ifsc}}
   Name: {{company_name}}

Payment ke baad screenshot bhejiye confirm ke liye. GST invoice automatically email ho jaayega. ✅

Koi sawaal? Reply karein! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 payment due for Rajasthan Royal Tour. Pay via UPI: tripbuilt@paytm',
    emoji: '💰',
  },
  {
    id: 'payment_reminder_gentle',
    name: 'Payment Reminder (Gentle)',
    category: 'PAYMENT_REMINDER',
    language: 'hinglish',
    body: `Namaste {{client_name}} Ji! 🙏

Friendly reminder ki *{{trip_name}}* ka ₹{{pending_amount}} payment abhi bhi pending hai.

📅 Original due date: {{due_date}}
🔗 Payment link: {{payment_link}}

Koi problem ho (jaise installment chahiye ya queries hain) toh batayein — hum solution nikaalenge! 😊

Seat confirm rakhne ke liye jaldi pay karein.

— {{company_name}}`,
    variables: ['client_name', 'trip_name', 'pending_amount', 'due_date', 'payment_link', 'company_name'],
    preview: 'Friendly reminder ki Goa Beach Trip ka ₹12,000 payment pending hai.',
    emoji: '🔔',
  },
  {
    id: 'payment_confirmed',
    name: 'Payment Confirmation',
    category: 'PAYMENT_CONFIRMED',
    language: 'hinglish',
    body: `🎉 Payment Received! ✅

Namaste {{client_name}} Ji!

*₹{{amount}}* successfully receive hua! 🙏

📋 Details:
• Trip: {{trip_name}}
• Amount: ₹{{amount}}
• Transaction ID: {{transaction_id}}
• Date: {{payment_date}}

📧 GST Invoice aapke email {{email}} pe bhej diya gaya hai.

Booking Status: *FULLY CONFIRMED* ✅

Koi bhi sawaal ho toh reply karein!

— {{company_name}}`,
    variables: ['client_name', 'amount', 'trip_name', 'transaction_id', 'payment_date', 'email', 'company_name'],
    preview: '₹45,000 received! GST invoice sent to kavita.sharma@gmail.com ✅',
    emoji: '✅',
  },

  // ─── ITINERARY SHARE ─────────────────────────────────────────────────────────
  {
    id: 'itinerary_share',
    name: 'Itinerary Share',
    category: 'ITINERARY_SHARE',
    language: 'hinglish',
    body: `Namaste {{client_name}} Ji! 🗺️

Aapka *{{destination}}* itinerary ready hai!

*Trip: {{trip_name}}*
📅 {{start_date}} — {{end_date}} ({{duration}})
👥 {{pax_count}} persons

📋 *Day-by-Day Plan:*
{{itinerary_summary}}

🔗 Full interactive itinerary:
{{itinerary_link}}

Is itinerary mein koi changes chahiye? Batayein, hum customize kar denge! ✏️

— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'Aapka Kerala 6-day itinerary ready hai! Full plan dekho: tripbuilt.com/trip/KL2024',
    emoji: '🗺️',
  },

  // ─── REVIEW REQUEST ──────────────────────────────────────────────────────────
  {
    id: 'review_request',
    name: 'Post-Trip Review Request',
    category: 'REVIEW_REQUEST',
    language: 'hinglish',
    body: `Namaste {{client_name}} Ji! 🙏

Umeed hai *{{destination}}* trip aapko bahut pasand aayi! 😊

Aapka feedback humke liye bahut important hai. Kya aap 2 minute mein Google review likh sakte hain?

⭐ Google Review: {{google_review_link}}

Aapke ek review se hum aur families ki help kar sakte hain unka dream vacation plan karne mein!

Agar trip mein koi bhi issue tha toh please directly batayein — hum improve karna chahte hain.

Thank you for choosing {{company_name}}! 🌟

Aapka dost,
{{agent_name}}`,
    variables: ['client_name', 'destination', 'google_review_link', 'company_name', 'agent_name'],
    preview: 'Namaste Sharma Ji! Umeed hai Rajasthan trip bahut pasand aayi! Please review dein ⭐',
    emoji: '⭐',
  },

  // ─── NEW LEAD WELCOME ────────────────────────────────────────────────────────
  {
    id: 'new_lead_welcome',
    name: 'New Lead Welcome',
    category: 'NEW_LEAD_WELCOME',
    language: 'hinglish',
    body: `Namaste! 🙏 

*{{company_name}}* mein aapka swagat hai!

Aapne {{destination}} ke liye inquiry ki, hum aapko iska *best package* denge! ✈️

Humse ye expect karein:
✅ Custom itinerary as per your budget
✅ Best hotel deals & transport
✅ 24/7 support during your trip
✅ GST compliant invoices

📞 Quick call ke liye: {{agent_phone}}
🕐 Office hours: Mon-Sat, 9 AM - 8 PM

Aapki kuch basic details chahiye:
• Kitne log travel karenge?
• Preferred dates?
• Budget range?

Reply karein aur apna dream trip plan karein! 😊`,
    variables: ['company_name', 'destination', 'agent_phone'],
    preview: 'Namaste! TripBuilt mein swagat hai! Goa ke liye best package denge! ✈️',
    emoji: '🙏',
  },

  // ─── QUOTE SENT ──────────────────────────────────────────────────────────────
  {
    id: 'quote_sent',
    name: 'Quote Sent',
    category: 'QUOTE_SENT',
    language: 'hinglish',
    body: `Namaste {{client_name}} Ji! 🎁

Aapka quote ready hai!

✈️ *{{trip_name}}*
💰 ₹{{price}} per person
📅 Valid till: {{expiry_date}}

*Kya included hai:*
{{inclusions}}

*Kya excluded hai:*
{{exclusions}}

🔗 Full quote dekho: {{quote_link}}

Agar koi changes chahiye (dates, hotel grade, add-ons) toh batayein!

Book karne ke liye: ₹{{advance_amount}} advance pay karein.

— {{agent_name}}, {{company_name}}`,
    variables: ['client_name', 'trip_name', 'price', 'expiry_date', 'inclusions', 'exclusions', 'quote_link', 'advance_amount', 'agent_name', 'company_name'],
    preview: 'Aapka Manali 5N/6D quote ready! ₹18,500 per person. Valid till 5 March.',
    emoji: '🎁',
  },

  // ─── DRIVER MORNING BRIEF ────────────────────────────────────────────────────
  {
    id: 'driver_morning_brief',
    name: "Driver's Morning Brief (Hindi)",
    category: 'DRIVER_MORNING_BRIEF',
    language: 'hi',
    body: `Good morning {{driver_name}} bhai! 🌅

Aaj {{date}} ka assignment:

🚗 *Trip 1:*
• Client: {{client1_name}} ({{client1_phone}})
• Pickup: {{pickup1_time}} baje — {{pickup1_location}}
• Drop: {{drop1_location}}
• Notes: {{notes1}}

{{trip2_section}}

📋 *Important:*
• Gaadi clean rakhein
• Time pe pahuncho
• Client ko call karo pickup se 30 min pehle
• Koi problem ho toh turant office ko call karo: {{office_number}}

Achi duty karo! 💪
— {{company_name}}`,
    variables: ['driver_name', 'date', 'client1_name', 'client1_phone', 'pickup1_time', 'pickup1_location', 'drop1_location', 'notes1', 'trip2_section', 'office_number', 'company_name'],
    preview: 'Good morning Raju bhai! Aaj 3 assignments hain. Pehla pickup 6 AM pe...',
    emoji: '🌅',
  },

  // ─── GROUP TOUR BROADCAST ────────────────────────────────────────────────────
  {
    id: 'group_tour_broadcast',
    name: 'Group Tour Broadcast',
    category: 'GROUP_TOUR_BROADCAST',
    language: 'hinglish',
    body: `Namaste sabhi! 🙏

*{{tour_name}}* group ke saath update:

📢 *Important Information:*
{{announcement}}

📅 Meeting point: *{{meeting_point}}*
⏰ Time: *{{meeting_time}}*
👥 Total group: {{group_size}} persons

📞 Group leader: {{leader_name}} — {{leader_phone}}

Agar koi sawaal ho, is message pe reply karein.

See you all soon! 😊
— {{company_name}}`,
    variables: ['tour_name', 'announcement', 'meeting_point', 'meeting_time', 'group_size', 'leader_name', 'leader_phone', 'company_name'],
    preview: 'Namaste sabhi Rajasthan group wale! Meeting point: Jaipur Airport Gate 2, kal 5 AM.',
    emoji: '📢',
  },

  // ─── PRE-TRIP REMINDERS (ENGLISH) ───────────────────────────────────────────
  {
    id: 'reminder_48h_en',
    name: 'Pre-Trip Reminder - 48 Hours (English)',
    category: 'PRE_TRIP_REMINDER_48H',
    language: 'en',
    body: `Hi {{client_name}}! 🌟

Just 2 days until your *{{destination}}* trip! Here's your pre-travel checklist: 🎒

📋 *Packing Essentials:*
✅ Valid photo ID (Aadhaar / Passport)
✅ Travel documents & hotel vouchers
✅ Medications & first-aid kit
✅ Comfortable walking shoes
✅ Weather-appropriate clothing

🌤 *{{destination}} Weather Forecast:* {{weather_info}}

📌 Your trip begins: {{start_date}} at {{pickup_time}}

Any questions? Just reply and we'll help! 😊

— {{company_name}}`,
    variables: ['client_name', 'destination', 'weather_info', 'start_date', 'pickup_time', 'company_name'],
    preview: 'Hi Sharma! Just 2 days until your Manali trip! Here\'s your checklist 🎒',
    emoji: '🎒',
  },
  {
    id: 'reminder_24h_en',
    name: 'Pre-Trip Reminder - 24 Hours (English)',
    category: 'PRE_TRIP_REMINDER_24H',
    language: 'en',
    body: `Hi {{client_name}}! 🌅

Your *{{destination}}* trip is tomorrow! Quick final check:

🚗 *Your Driver Details:*
👤 {{driver_name}} — {{driver_phone}}
🚙 {{vehicle_type}} ({{vehicle_number}})
⏰ Pickup: Tomorrow at *{{pickup_time}}*
📍 {{pickup_location}}

📄 Please keep these handy:
• Photo ID (Aadhaar / Passport)
• Booking confirmation (Ref: {{booking_id}})

🆘 Emergency helpline: {{emergency_number}}

Your driver will call 1 hour before pickup. Have a great trip! 🌙

— {{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'booking_id', 'emergency_number', 'company_name'],
    preview: 'Hi Kavita! Your Kerala trip is tomorrow. Driver Suresh will arrive at 6 AM 🌅',
    emoji: '🌅',
  },
  {
    id: 'reminder_2h_en',
    name: 'Pre-Trip Reminder - 2 Hours (English)',
    category: 'PRE_TRIP_REMINDER_2H',
    language: 'en',
    body: `Hi {{client_name}}! Your driver is *2 hours away*! 🚗💨

👤 Driver: *{{driver_name}}*
📞 {{driver_phone}}

📍 *Live Driver Location:*
{{driver_live_location_link}}

⏰ ETA: {{pickup_time}}

Please have your bags ready! 😄

For urgent help, call: {{emergency_number}}

— {{company_name}}`,
    variables: ['client_name', 'driver_name', 'driver_phone', 'driver_live_location_link', 'pickup_time', 'emergency_number', 'company_name'],
    preview: 'Hi Sharma! Your driver is 2 hours away! 🚗💨',
    emoji: '🚗',
  },

  // ─── PAYMENT REQUEST (ENGLISH) ───────────────────────────────────────────────
  {
    id: 'payment_request_en',
    name: 'Payment Request (English)',
    category: 'PAYMENT_REQUEST',
    language: 'en',
    body: `Dear {{client_name}},

Payment request for *{{trip_name}}*:

💰 Amount Due: *₹{{amount}}*
📅 Due Date: {{due_date}}
🆔 Booking ID: {{booking_id}}

*Payment Options:*
📱 UPI: {{upi_id}}
🔗 Online Payment: {{payment_link}}
🏦 Bank Transfer:
   Account: {{bank_account}}
   IFSC: {{bank_ifsc}}
   Name: {{company_name}}

Please share the payment screenshot for confirmation. GST invoice will be sent to your email automatically. ✅

Any questions? Reply to this message!

Regards,
{{company_name}}`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 payment due for Rajasthan Tour. Pay via UPI: tripbuilt@paytm',
    emoji: '💰',
  },

  // ─── REVIEW REQUEST (ENGLISH) ────────────────────────────────────────────────
  {
    id: 'review_request_en',
    name: 'Post-Trip Review Request (English)',
    category: 'REVIEW_REQUEST',
    language: 'en',
    body: `Hi {{client_name}}! 🙏

We hope you had an amazing trip to *{{destination}}*! 😊

Your feedback means the world to us. Could you spare 2 minutes to leave us a Google Review?

⭐ Leave a Review: {{google_review_link}}

Your review helps other families plan their dream holidays with us!

If you had any issues during the trip, please let us know directly — we're always looking to improve.

Thank you for choosing {{company_name}}! 🌟

Warmly,
{{agent_name}}`,
    variables: ['client_name', 'destination', 'google_review_link', 'company_name', 'agent_name'],
    preview: 'Hi Sharma! We hope you loved Rajasthan! Could you leave us a Google review? ⭐',
    emoji: '⭐',
  },

  // ─── NEW LEAD WELCOME (ENGLISH) ──────────────────────────────────────────────
  {
    id: 'new_lead_welcome_en',
    name: 'New Lead Welcome (English)',
    category: 'NEW_LEAD_WELCOME',
    language: 'en',
    body: `Hello! 👋

Welcome to *{{company_name}}*!

Thank you for your enquiry about *{{destination}}*. We'd love to create the perfect trip for you! ✈️

Here's what you can expect from us:
✅ Custom itinerary tailored to your budget
✅ Best hotel deals and transport arrangements
✅ 24/7 support throughout your journey
✅ GST-compliant invoices

📞 For a quick call: {{agent_phone}}
🕐 Office hours: Mon–Sat, 9 AM – 8 PM

To help us build your ideal trip, could you share:
• Number of travellers?
• Preferred travel dates?
• Budget range?

Reply now and let's plan your dream holiday! 😊`,
    variables: ['company_name', 'destination', 'agent_phone'],
    preview: 'Hello! Welcome to TripBuilt! Enquiry for Goa received. Let\'s plan! ✈️',
    emoji: '🙏',
  },

  // ─── QUOTE SENT (ENGLISH) ────────────────────────────────────────────────────
  {
    id: 'quote_sent_en',
    name: 'Quote Sent (English)',
    category: 'QUOTE_SENT',
    language: 'en',
    body: `Dear {{client_name}}, 🎁

Your personalised quote is ready!

✈️ *{{trip_name}}*
💰 ₹{{price}} per person
📅 Valid until: {{expiry_date}}

*What's Included:*
{{inclusions}}

*What's Excluded:*
{{exclusions}}

🔗 View Full Quote: {{quote_link}}

Need any modifications (dates, hotel grade, add-ons)? Just let us know!

To confirm your booking, a ₹{{advance_amount}} advance payment is required.

— {{agent_name}}, {{company_name}}`,
    variables: ['client_name', 'trip_name', 'price', 'expiry_date', 'inclusions', 'exclusions', 'quote_link', 'advance_amount', 'agent_name', 'company_name'],
    preview: 'Dear Sharma, your Manali 5N/6D quote is ready! ₹18,500 per person. Valid till 5 March.',
    emoji: '🎁',
  },
];

// ─── TEMPLATE UTILITIES ─────────────────────────────────────────────────────

/**
 * Fill a template body with actual variable values.
 * Variables not provided will be left as {{variable_name}}.
 */
export function fillTemplate(
  template: WhatsAppTemplate,
  variables: Record<string, string>
): string {
  let result = template.body;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

/**
 * Extract variable names from a template body string.
 */
export function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
}

/**
 * Get templates filtered by category.
 */
export function getTemplatesByCategory(category: TemplateCategory): WhatsAppTemplate[] {
  return WHATSAPP_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get templates by language.
 */
export function getTemplatesByLanguage(lang: WhatsAppTemplate['language']): WhatsAppTemplate[] {
  return WHATSAPP_TEMPLATES.filter((t) => t.language === lang);
}

/**
 * For a given category, return the best template matching the preferred language.
 * Falls back to 'hinglish' then any available template if no exact match.
 */
export function getPreferredTemplate(
  category: TemplateCategory,
  preferredLanguage: WhatsAppTemplate['language'] = 'hinglish',
): WhatsAppTemplate | undefined {
  const categoryTemplates = WHATSAPP_TEMPLATES.filter((t) => t.category === category);
  return (
    categoryTemplates.find((t) => t.language === preferredLanguage) ??
    categoryTemplates.find((t) => t.language === 'hinglish') ??
    categoryTemplates[0]
  );
}

export const LANGUAGE_LABELS: Record<WhatsAppTemplate['language'] | 'all', string> = {
  all: '🌐 All',
  en: '🇬🇧 English',
  hi: '🇮🇳 Hindi',
  hinglish: '🤝 Hinglish',
};

// ─── QUICK REPLIES ───────────────────────────────────────────────────────────

export const QUICK_REPLIES: string[] = [
  'Confirmed! ✅',
  'Will call you back shortly',
  'Sending itinerary now 📋',
  'Please share passport copy',
  'Payment link sent 💰',
  'Driver details sent 🚗',
  'Booking is confirmed ✅',
  'On my way!',
  'Please hold, checking details',
  'Documents received, thank you!',
  'Let me check and revert',
  'Happy to help! 😊',
];

export const HINDI_QUICK_REPLIES: string[] = [
  'Haan bilkul! ✅',
  'Abhi call karta hoon',
  'Itinerary bhej raha hoon 📋',
  'Passport copy bhejiye please',
  'Payment link bheja hai 💰',
  'Driver details bhej diye 🚗',
  'Booking confirm ho gayi ✅',
  'Thoda wait karo, check karta hoon',
  'Documents mil gaye, shukriya!',
  'Kal subah baat karte hain',
  'Bilkul theek hai',
  'Aapki madad karne ke liye hum hain! 🙏',
];

export const TEMPLATE_CATEGORIES_DISPLAY: Record<TemplateCategory, string> = {
  BOOKING_CONFIRMATION: 'Booking Confirmation',
  DRIVER_ASSIGNMENT: 'Driver Assignment',
  PRE_TRIP_REMINDER_48H: 'Reminder — 48 Hours',
  PRE_TRIP_REMINDER_24H: 'Reminder — 24 Hours',
  PRE_TRIP_REMINDER_2H: 'Reminder — 2 Hours',
  PAYMENT_REQUEST: 'Payment Request',
  PAYMENT_REMINDER: 'Payment Reminder',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  ITINERARY_SHARE: 'Itinerary Share',
  REVIEW_REQUEST: 'Review Request',
  NEW_LEAD_WELCOME: 'New Lead Welcome',
  QUOTE_SENT: 'Quote Sent',
  DRIVER_MORNING_BRIEF: "Driver's Brief",
  GROUP_TOUR_BROADCAST: 'Group Broadcast',
};
