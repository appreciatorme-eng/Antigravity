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
  language: 'en' | 'hi' | 'hinglish' | 'te' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu' | 'pa';
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
  {
    id: 'itinerary_share_english',
    name: 'Itinerary Share (English)',
    category: 'ITINERARY_SHARE',
    language: 'en',
    body: `Hi {{client_name}}! 🗺️

Your *{{destination}}* itinerary is ready!

*Trip: {{trip_name}}*
📅 {{start_date}} — {{end_date}} ({{duration}})
👥 {{pax_count}} persons

📋 *Day-by-Day Plan:*
{{itinerary_summary}}

🔗 Full interactive itinerary:
{{itinerary_link}}

Need any changes to this itinerary? Let us know and we'll customise it for you! ✏️

— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'Your Kerala 6-day itinerary is ready! View the full plan: tripbuilt.com/trip/KL2024',
    emoji: '🗺️',
  },

  // ─── ITINERARY SHARE (REGIONAL LANGUAGES) ──────────────────────────────────
  {
    id: 'itinerary_share_telugu',
    name: 'Itinerary Share (Telugu)',
    category: 'ITINERARY_SHARE',
    language: 'te',
    body: `నమస్కారం {{client_name}} గారు! 🗺️\n\nమీ *{{destination}}* ప్రయాణ ప్రణాళిక సిద్ధంగా ఉంది!\n\n*ట్రిప్: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} మంది\n\n📋 *రోజువారీ ప్రణాళిక:*\n{{itinerary_summary}}\n\n🔗 పూర్తి ప్రయాణ ప్రణాళిక:\n{{itinerary_link}}\n\nఏవైనా మార్పులు కావాలా? చెప్పండి, మేము మీ కోసం కస్టమైజ్ చేస్తాము! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'మీ Kerala ప్రయాణ ప్రణాళిక సిద్ధంగా ఉంది!',
    emoji: '🗺️',
  },
  {
    id: 'itinerary_share_tamil',
    name: 'Itinerary Share (Tamil)',
    category: 'ITINERARY_SHARE',
    language: 'ta',
    body: `வணக்கம் {{client_name}}! 🗺️\n\nஉங்கள் *{{destination}}* பயண திட்டம் தயாராக உள்ளது!\n\n*பயணம்: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} பேர்\n\n📋 *நாள்வாரி திட்டம்:*\n{{itinerary_summary}}\n\n🔗 முழு பயண திட்டம்:\n{{itinerary_link}}\n\nஏதேனும் மாற்றங்கள் வேண்டுமா? சொல்லுங்கள், நாங்கள் தனிப்பயனாக்குவோம்! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'உங்கள் Kerala பயண திட்டம் தயாராக உள்ளது!',
    emoji: '🗺️',
  },
  {
    id: 'itinerary_share_kannada',
    name: 'Itinerary Share (Kannada)',
    category: 'ITINERARY_SHARE',
    language: 'kn',
    body: `ನಮಸ್ಕಾರ {{client_name}} ಅವರೇ! 🗺️\n\nನಿಮ್ಮ *{{destination}}* ಪ್ರವಾಸ ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ!\n\n*ಪ್ರವಾಸ: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} ಜನರು\n\n📋 *ದಿನವಾರ ಯೋಜನೆ:*\n{{itinerary_summary}}\n\n🔗 ಸಂಪೂರ್ಣ ಪ್ರವಾಸ ಯೋಜನೆ:\n{{itinerary_link}}\n\nಯಾವುದೇ ಬದಲಾವಣೆಗಳು ಬೇಕಾ? ಹೇಳಿ, ನಾವು ನಿಮಗಾಗಿ ಕಸ್ಟಮೈಜ್ ಮಾಡುತ್ತೇವೆ! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'ನಿಮ್ಮ Kerala ಪ್ರವಾಸ ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ!',
    emoji: '🗺️',
  },
  {
    id: 'itinerary_share_malayalam',
    name: 'Itinerary Share (Malayalam)',
    category: 'ITINERARY_SHARE',
    language: 'ml',
    body: `നമസ്കാരം {{client_name}}! 🗺️\n\nനിങ്ങളുടെ *{{destination}}* യാത്രാ പദ്ധതി തയ്യാറാണ്!\n\n*ട്രിപ്പ്: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} പേർ\n\n📋 *ദിവസം തിരിച്ചുള്ള പദ്ധതി:*\n{{itinerary_summary}}\n\n🔗 പൂർണ്ണ യാത്രാ പദ്ധതി:\n{{itinerary_link}}\n\nഎന്തെങ്കിലും മാറ്റങ്ങൾ വേണോ? പറയൂ, ഞങ്ങൾ നിങ്ങൾക്കായി ക്രമീകരിക്കാം! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'നിങ്ങളുടെ Kerala യാത്രാ പദ്ധതി തയ്യാറാണ്!',
    emoji: '🗺️',
  },
  {
    id: 'itinerary_share_bengali',
    name: 'Itinerary Share (Bengali)',
    category: 'ITINERARY_SHARE',
    language: 'bn',
    body: `নমস্কার {{client_name}}! 🗺️\n\nআপনার *{{destination}}* ভ্রমণ পরিকল্পনা প্রস্তুত!\n\n*ট্রিপ: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} জন\n\n📋 *দিনভিত্তিক পরিকল্পনা:*\n{{itinerary_summary}}\n\n🔗 সম্পূর্ণ ভ্রমণ পরিকল্পনা:\n{{itinerary_link}}\n\nকোনো পরিবর্তন দরকার? জানান, আমরা আপনার জন্য কাস্টমাইজ করব! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'আপনার Kerala ভ্রমণ পরিকল্পনা প্রস্তুত!',
    emoji: '🗺️',
  },
  {
    id: 'itinerary_share_marathi',
    name: 'Itinerary Share (Marathi)',
    category: 'ITINERARY_SHARE',
    language: 'mr',
    body: `नमस्कार {{client_name}}! 🗺️\n\nतुमचा *{{destination}}* प्रवास कार्यक्रम तयार आहे!\n\n*ट्रिप: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} जण\n\n📋 *दिवसनिहाय कार्यक्रम:*\n{{itinerary_summary}}\n\n🔗 संपूर्ण प्रवास कार्यक्रम:\n{{itinerary_link}}\n\nकाही बदल हवेत का? सांगा, आम्ही तुमच्यासाठी कस्टमाइझ करू! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'तुमचा Kerala प्रवास कार्यक्रम तयार आहे!',
    emoji: '🗺️',
  },
  {
    id: 'itinerary_share_gujarati',
    name: 'Itinerary Share (Gujarati)',
    category: 'ITINERARY_SHARE',
    language: 'gu',
    body: `નમસ્તે {{client_name}}! 🗺️\n\nતમારો *{{destination}}* પ્રવાસ કાર્યક્રમ તૈયાર છે!\n\n*ટ્રિપ: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} વ્યક્તિ\n\n📋 *દિવસ પ્રમાણે કાર્યક્રમ:*\n{{itinerary_summary}}\n\n🔗 સંપૂર્ણ પ્રવાસ કાર્યક્રમ:\n{{itinerary_link}}\n\nકોઈ ફેરફાર જોઈએ? જણાવો, અમે તમારા માટે કસ્ટમાઈઝ કરીશું! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'તમારો Kerala પ્રવાસ કાર્યક્રમ તૈયાર છે!',
    emoji: '🗺️',
  },
  {
    id: 'itinerary_share_punjabi',
    name: 'Itinerary Share (Punjabi)',
    category: 'ITINERARY_SHARE',
    language: 'pa',
    body: `ਸਤ ਸ੍ਰੀ ਅਕਾਲ {{client_name}} ਜੀ! 🗺️\n\nਤੁਹਾਡਾ *{{destination}}* ਯਾਤਰਾ ਪ੍ਰੋਗਰਾਮ ਤਿਆਰ ਹੈ!\n\n*ਟ੍ਰਿਪ: {{trip_name}}*\n📅 {{start_date}} — {{end_date}} ({{duration}})\n👥 {{pax_count}} ਵਿਅਕਤੀ\n\n📋 *ਦਿਨ ਅਨੁਸਾਰ ਪ੍ਰੋਗਰਾਮ:*\n{{itinerary_summary}}\n\n🔗 ਪੂਰਾ ਯਾਤਰਾ ਪ੍ਰੋਗਰਾਮ:\n{{itinerary_link}}\n\nਕੋਈ ਬਦਲਾਅ ਚਾਹੀਦੇ ਹਨ? ਦੱਸੋ, ਅਸੀਂ ਤੁਹਾਡੇ ਲਈ ਕਸਟਮਾਈਜ਼ ਕਰਾਂਗੇ! ✏️\n\n— {{company_name}}`,
    variables: ['client_name', 'destination', 'trip_name', 'start_date', 'end_date', 'duration', 'pax_count', 'itinerary_summary', 'itinerary_link', 'company_name'],
    preview: 'ਤੁਹਾਡਾ Kerala ਯਾਤਰਾ ਪ੍ਰੋਗਰਾਮ ਤਿਆਰ ਹੈ!',
    emoji: '🗺️',
  },

  // ─── PAYMENT REQUEST (REGIONAL LANGUAGES) ────────────────────────────────
  {
    id: 'payment_request_telugu',
    name: 'Payment Request (Telugu)',
    category: 'PAYMENT_REQUEST',
    language: 'te',
    body: `నమస్కారం {{client_name}} గారు! 🙏\n\n*{{trip_name}}* కోసం చెల్లింపు అభ్యర్థన:\n\n💰 మొత్తం: *₹{{amount}}*\n📅 చెల్లింపు తేదీ: {{due_date}}\n🆔 బుకింగ్ ID: {{booking_id}}\n\n*చెల్లింపు ఎంపికలు:*\n📱 UPI: {{upi_id}}\n🔗 ఆన్‌లైన్ చెల్లింపు: {{payment_link}}\n🏦 బ్యాంక్ ట్రాన్స్‌ఫర్:\n   ఖాతా: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   పేరు: {{company_name}}\n\nచెల్లింపు తర్వాత స్క్రీన్‌షాట్ పంపండి. GST ఇన్‌వాయిస్ ఈమెయిల్‌కు వెళ్తుంది. ✅\n\nఏవైనా ప్రశ్నలు? రిప్లై చేయండి! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 చెల్లింపు Rajasthan Tour కోసం. UPI ద్వారా చెల్లించండి.',
    emoji: '💰',
  },
  {
    id: 'payment_request_tamil',
    name: 'Payment Request (Tamil)',
    category: 'PAYMENT_REQUEST',
    language: 'ta',
    body: `வணக்கம் {{client_name}}! 🙏\n\n*{{trip_name}}* க்கான பணம் செலுத்துதல் கோரிக்கை:\n\n💰 தொகை: *₹{{amount}}*\n📅 கெடு தேதி: {{due_date}}\n🆔 புக்கிங் ID: {{booking_id}}\n\n*பணம் செலுத்தும் வழிகள்:*\n📱 UPI: {{upi_id}}\n🔗 ஆன்லைன் பணம்: {{payment_link}}\n🏦 வங்கி பரிமாற்றம்:\n   கணக்கு: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   பெயர்: {{company_name}}\n\nபணம் செலுத்திய பின் ஸ்கிரீன்ஷாட் அனுப்புங்கள். GST பில் ஈமெயிலுக்கு அனுப்பப்படும். ✅\n\nகேள்விகள் உள்ளதா? பதிலளியுங்கள்! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 பணம் Rajasthan Tour க்கு. UPI வழியாக செலுத்துங்கள்.',
    emoji: '💰',
  },
  {
    id: 'payment_request_kannada',
    name: 'Payment Request (Kannada)',
    category: 'PAYMENT_REQUEST',
    language: 'kn',
    body: `ನಮಸ್ಕಾರ {{client_name}} ಅವರೇ! 🙏\n\n*{{trip_name}}* ಗಾಗಿ ಪಾವತಿ ವಿನಂತಿ:\n\n💰 ಮೊತ್ತ: *₹{{amount}}*\n📅 ಕೊನೆಯ ದಿನಾಂಕ: {{due_date}}\n🆔 ಬುಕ್ಕಿಂಗ್ ID: {{booking_id}}\n\n*ಪಾವತಿ ಆಯ್ಕೆಗಳು:*\n📱 UPI: {{upi_id}}\n🔗 ಆನ್‌ಲೈನ್ ಪಾವತಿ: {{payment_link}}\n🏦 ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ:\n   ಖಾತೆ: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   ಹೆಸರು: {{company_name}}\n\nಪಾವತಿ ನಂತರ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಕಳುಹಿಸಿ. GST ಇನ್‌ವಾಯ್ಸ್ ಈಮೇಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗುವುದು. ✅\n\nಏನಾದರೂ ಪ್ರಶ್ನೆಗಳು? ಉತ್ತರಿಸಿ! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 ಪಾವತಿ Rajasthan Tour ಗಾಗಿ. UPI ಮೂಲಕ ಪಾವತಿಸಿ.',
    emoji: '💰',
  },
  {
    id: 'payment_request_malayalam',
    name: 'Payment Request (Malayalam)',
    category: 'PAYMENT_REQUEST',
    language: 'ml',
    body: `നമസ്കാരം {{client_name}}! 🙏\n\n*{{trip_name}}* നുള്ള പേയ്‌മെന്റ് അഭ്യർത്ഥന:\n\n💰 തുക: *₹{{amount}}*\n📅 അവസാന തീയതി: {{due_date}}\n🆔 ബുക്കിംഗ് ID: {{booking_id}}\n\n*പേയ്‌മെന്റ് ഓപ്ഷനുകൾ:*\n📱 UPI: {{upi_id}}\n🔗 ഓൺലൈൻ പേയ്‌മെന്റ്: {{payment_link}}\n🏦 ബാങ്ക് ട്രാൻസ്ഫർ:\n   അക്കൗണ്ട്: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   പേര്: {{company_name}}\n\nപേയ്‌മെന്റിന് ശേഷം സ്ക്രീൻഷോട്ട് അയക്കുക. GST ഇൻവോയ്സ് ഇമെയിലിലേക്ക് അയക്കും. ✅\n\nചോദ്യങ്ങൾ ഉണ്ടോ? മറുപടി അയക്കൂ! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 പേയ്‌മെന്റ് Rajasthan Tour നുള്ളത്. UPI വഴി അടയ്ക്കുക.',
    emoji: '💰',
  },
  {
    id: 'payment_request_bengali',
    name: 'Payment Request (Bengali)',
    category: 'PAYMENT_REQUEST',
    language: 'bn',
    body: `নমস্কার {{client_name}}! 🙏\n\n*{{trip_name}}* এর জন্য পেমেন্ট অনুরোধ:\n\n💰 পরিমাণ: *₹{{amount}}*\n📅 শেষ তারিখ: {{due_date}}\n🆔 বুকিং ID: {{booking_id}}\n\n*পেমেন্টের উপায়:*\n📱 UPI: {{upi_id}}\n🔗 অনলাইন পেমেন্ট: {{payment_link}}\n🏦 ব্যাংক ট্রান্সফার:\n   অ্যাকাউন্ট: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   নাম: {{company_name}}\n\nপেমেন্টের পর স্ক্রিনশট পাঠান। GST ইনভয়েস ইমেইলে পাঠানো হবে। ✅\n\nকোনো প্রশ্ন? রিপ্লাই করুন! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 পেমেন্ট Rajasthan Tour এর জন্য। UPI দিয়ে পেমেন্ট করুন।',
    emoji: '💰',
  },
  {
    id: 'payment_request_marathi',
    name: 'Payment Request (Marathi)',
    category: 'PAYMENT_REQUEST',
    language: 'mr',
    body: `नमस्कार {{client_name}}! 🙏\n\n*{{trip_name}}* साठी पेमेंट विनंती:\n\n💰 रक्कम: *₹{{amount}}*\n📅 देय तारीख: {{due_date}}\n🆔 बुकिंग ID: {{booking_id}}\n\n*पेमेंट पर्याय:*\n📱 UPI: {{upi_id}}\n🔗 ऑनलाइन पेमेंट: {{payment_link}}\n🏦 बँक ट्रान्सफर:\n   खाते: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   नाव: {{company_name}}\n\nपेमेंट केल्यानंतर स्क्रीनशॉट पाठवा. GST इन्व्हॉइस ईमेलवर पाठवले जाईल. ✅\n\nकाही प्रश्न? रिप्लाय करा! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 पेमेंट Rajasthan Tour साठी. UPI ने पेमेंट करा.',
    emoji: '💰',
  },
  {
    id: 'payment_request_gujarati',
    name: 'Payment Request (Gujarati)',
    category: 'PAYMENT_REQUEST',
    language: 'gu',
    body: `નમસ્તે {{client_name}}! 🙏\n\n*{{trip_name}}* માટે ચુકવણી વિનંતી:\n\n💰 રકમ: *₹{{amount}}*\n📅 અંતિમ તારીખ: {{due_date}}\n🆔 બુકિંગ ID: {{booking_id}}\n\n*ચુકવણી વિકલ્પો:*\n📱 UPI: {{upi_id}}\n🔗 ઓનલાઈન ચુકવણી: {{payment_link}}\n🏦 બેંક ટ્રાન્સફર:\n   ખાતું: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   નામ: {{company_name}}\n\nચુકવણી પછી સ્ક્રીનશોટ મોકલો. GST ઈન્વોઈસ ઈમેલ પર મોકલવામાં આવશે. ✅\n\nકોઈ પ્રશ્ન? જવાબ આપો! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 ચુકવણી Rajasthan Tour માટે. UPI દ્વારા ચુકવણી કરો.',
    emoji: '💰',
  },
  {
    id: 'payment_request_punjabi',
    name: 'Payment Request (Punjabi)',
    category: 'PAYMENT_REQUEST',
    language: 'pa',
    body: `ਸਤ ਸ੍ਰੀ ਅਕਾਲ {{client_name}} ਜੀ! 🙏\n\n*{{trip_name}}* ਲਈ ਭੁਗਤਾਨ ਬੇਨਤੀ:\n\n💰 ਰਕਮ: *₹{{amount}}*\n📅 ਅੰਤਿਮ ਤਾਰੀਖ: {{due_date}}\n🆔 ਬੁਕਿੰਗ ID: {{booking_id}}\n\n*ਭੁਗਤਾਨ ਵਿਕਲਪ:*\n📱 UPI: {{upi_id}}\n🔗 ਔਨਲਾਈਨ ਭੁਗਤਾਨ: {{payment_link}}\n🏦 ਬੈਂਕ ਟ੍ਰਾਂਸਫਰ:\n   ਖਾਤਾ: {{bank_account}}\n   IFSC: {{bank_ifsc}}\n   ਨਾਮ: {{company_name}}\n\nਭੁਗਤਾਨ ਤੋਂ ਬਾਅਦ ਸਕ੍ਰੀਨਸ਼ਾਟ ਭੇਜੋ। GST ਇਨਵੌਇਸ ਈਮੇਲ ਤੇ ਭੇਜਿਆ ਜਾਵੇਗਾ। ✅\n\nਕੋਈ ਸਵਾਲ? ਜਵਾਬ ਦਿਓ! 😊`,
    variables: ['client_name', 'trip_name', 'amount', 'due_date', 'booking_id', 'upi_id', 'payment_link', 'bank_account', 'bank_ifsc', 'company_name'],
    preview: '₹45,000 ਭੁਗਤਾਨ Rajasthan Tour ਲਈ। UPI ਰਾਹੀਂ ਭੁਗਤਾਨ ਕਰੋ।',
    emoji: '💰',
  },

  // ─── DRIVER ASSIGNMENT (REGIONAL LANGUAGES) ──────────────────────────────
  {
    id: 'driver_assign_telugu',
    name: 'Driver Assignment (Telugu)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'te',
    body: `నమస్కారం {{client_name}} గారు! 🚗\n\nమీ {{destination}} ట్రిప్ కోసం డ్రైవర్ వివరాలు:\n\n👤 డ్రైవర్: *{{driver_name}}*\n📞 మొబైల్: {{driver_phone}}\n🚙 వాహనం: {{vehicle_type}} ({{vehicle_number}})\n⏰ పికప్ సమయం: {{pickup_time}}\n📍 పికప్ ప్రదేశం: {{pickup_location}}\n\nడ్రైవర్ నంబర్ సేవ్ చేసుకోండి. పికప్ కు 30 నిమిషాల ముందు కాల్ చేస్తారు.\n\nసురక్షితమైన ప్రయాణం! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'నమస్కారం! మీ Jaipur ట్రిప్ డ్రైవర్ Ramesh పికప్ కు వస్తారు.',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_tamil',
    name: 'Driver Assignment (Tamil)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'ta',
    body: `வணக்கம் {{client_name}}! 🚗\n\nஉங்கள் {{destination}} பயணத்திற்கான ஓட்டுநர் விவரங்கள்:\n\n👤 ஓட்டுநர்: *{{driver_name}}*\n📞 மொபைல்: {{driver_phone}}\n🚙 வாகனம்: {{vehicle_type}} ({{vehicle_number}})\n⏰ பிக்அப் நேரம்: {{pickup_time}}\n📍 பிக்அப் இடம்: {{pickup_location}}\n\nஓட்டுநர் எண்ணை சேமித்துக் கொள்ளுங்கள். பிக்அப்புக்கு 30 நிமிடங்களுக்கு முன் அழைப்பார்.\n\nநல்ல பயணம்! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'வணக்கம்! உங்கள் Jaipur பயண ஓட்டுநர் Ramesh வருவார்.',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_kannada',
    name: 'Driver Assignment (Kannada)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'kn',
    body: `ನಮಸ್ಕಾರ {{client_name}} ಅವರೇ! 🚗\n\nನಿಮ್ಮ {{destination}} ಪ್ರವಾಸಕ್ಕಾಗಿ ಚಾಲಕ ವಿವರಗಳು:\n\n👤 ಚಾಲಕ: *{{driver_name}}*\n📞 ಮೊಬೈಲ್: {{driver_phone}}\n🚙 ವಾಹನ: {{vehicle_type}} ({{vehicle_number}})\n⏰ ಪಿಕಪ್ ಸಮಯ: {{pickup_time}}\n📍 ಪಿಕಪ್ ಸ್ಥಳ: {{pickup_location}}\n\nಚಾಲಕರ ನಂಬರ್ ಉಳಿಸಿಕೊಳ್ಳಿ. ಪಿಕಪ್‌ಗೆ 30 ನಿಮಿಷ ಮೊದಲು ಕರೆ ಮಾಡುತ್ತಾರೆ.\n\nಶುಭ ಪ್ರಯಾಣ! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ Jaipur ಪ್ರವಾಸದ ಚಾಲಕ Ramesh ಬರುತ್ತಾರೆ.',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_malayalam',
    name: 'Driver Assignment (Malayalam)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'ml',
    body: `നമസ്കാരം {{client_name}}! 🚗\n\nനിങ്ങളുടെ {{destination}} യാത്രയ്ക്കുള്ള ഡ്രൈവർ വിശദാംശങ്ങൾ:\n\n👤 ഡ്രൈവർ: *{{driver_name}}*\n📞 മൊബൈൽ: {{driver_phone}}\n🚙 വാഹനം: {{vehicle_type}} ({{vehicle_number}})\n⏰ പിക്കപ്പ് സമയം: {{pickup_time}}\n📍 പിക്കപ്പ് സ്ഥലം: {{pickup_location}}\n\nഡ്രൈവറുടെ നമ്പർ സേവ് ചെയ്യുക. പിക്കപ്പിന് 30 മിനിറ്റ് മുമ്പ് വിളിക്കും.\n\nസുരക്ഷിതമായ യാത്ര! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'നമസ്കാരം! നിങ്ങളുടെ Jaipur യാത്രയ്ക്ക് ഡ്രൈവർ Ramesh വരും.',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_bengali',
    name: 'Driver Assignment (Bengali)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'bn',
    body: `নমস্কার {{client_name}}! 🚗\n\nআপনার {{destination}} ট্রিপের জন্য ড্রাইভারের বিবরণ:\n\n👤 ড্রাইভার: *{{driver_name}}*\n📞 মোবাইল: {{driver_phone}}\n🚙 গাড়ি: {{vehicle_type}} ({{vehicle_number}})\n⏰ পিকআপ সময়: {{pickup_time}}\n📍 পিকআপ স্থান: {{pickup_location}}\n\nড্রাইভারের নম্বর সেভ করে রাখুন। পিকআপের 30 মিনিট আগে কল করবেন।\n\nশুভ যাত্রা! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'নমস্কার! আপনার Jaipur ট্রিপের ড্রাইভার Ramesh আসবেন।',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_marathi',
    name: 'Driver Assignment (Marathi)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'mr',
    body: `नमस्कार {{client_name}}! 🚗\n\nतुमच्या {{destination}} ट्रिपसाठी ड्रायव्हर तपशील:\n\n👤 ड्रायव्हर: *{{driver_name}}*\n📞 मोबाईल: {{driver_phone}}\n🚙 वाहन: {{vehicle_type}} ({{vehicle_number}})\n⏰ पिकअप वेळ: {{pickup_time}}\n📍 पिकअप ठिकाण: {{pickup_location}}\n\nड्रायव्हरचा नंबर सेव्ह करा. पिकअपच्या 30 मिनिटे आधी कॉल करतील.\n\nशुभ प्रवास! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'नमस्कार! तुमच्या Jaipur ट्रिपचे ड्रायव्हर Ramesh येतील.',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_gujarati',
    name: 'Driver Assignment (Gujarati)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'gu',
    body: `નમસ્તે {{client_name}}! 🚗\n\nતમારી {{destination}} ટ્રિપ માટે ડ્રાઈવર વિગતો:\n\n👤 ડ્રાઈવર: *{{driver_name}}*\n📞 મોબાઈલ: {{driver_phone}}\n🚙 વાહન: {{vehicle_type}} ({{vehicle_number}})\n⏰ પિકઅપ સમય: {{pickup_time}}\n📍 પિકઅપ સ્થળ: {{pickup_location}}\n\nડ્રાઈવરનો નંબર સેવ કરો. પિકઅપના 30 મિનિટ પહેલાં કૉલ કરશે.\n\nશુભ યાત્રા! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'નમસ્તે! તમારી Jaipur ટ્રિપના ડ્રાઈવર Ramesh આવશે.',
    emoji: '🚗',
  },
  {
    id: 'driver_assign_punjabi',
    name: 'Driver Assignment (Punjabi)',
    category: 'DRIVER_ASSIGNMENT',
    language: 'pa',
    body: `ਸਤ ਸ੍ਰੀ ਅਕਾਲ {{client_name}} ਜੀ! 🚗\n\nਤੁਹਾਡੀ {{destination}} ਟ੍ਰਿਪ ਲਈ ਡਰਾਈਵਰ ਵੇਰਵੇ:\n\n👤 ਡਰਾਈਵਰ: *{{driver_name}}*\n📞 ਮੋਬਾਈਲ: {{driver_phone}}\n🚙 ਵਾਹਨ: {{vehicle_type}} ({{vehicle_number}})\n⏰ ਪਿਕਅੱਪ ਸਮਾਂ: {{pickup_time}}\n📍 ਪਿਕਅੱਪ ਥਾਂ: {{pickup_location}}\n\nਡਰਾਈਵਰ ਦਾ ਨੰਬਰ ਸੇਵ ਕਰੋ। ਪਿਕਅੱਪ ਤੋਂ 30 ਮਿੰਟ ਪਹਿਲਾਂ ਕਾਲ ਕਰੇਗਾ।\n\nਸ਼ੁਭ ਯਾਤਰਾ! 🙏\n{{company_name}}`,
    variables: ['client_name', 'destination', 'driver_name', 'driver_phone', 'vehicle_type', 'vehicle_number', 'pickup_time', 'pickup_location', 'company_name'],
    preview: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੀ Jaipur ਟ੍ਰਿਪ ਦਾ ਡਰਾਈਵਰ Ramesh ਆਵੇਗਾ।',
    emoji: '🚗',
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
    categoryTemplates.find((t) => t.language === 'en') ??
    categoryTemplates.find((t) => t.language === 'hinglish') ??
    categoryTemplates[0]
  );
}

/**
 * Map display language names (from LANGUAGES array) to template language codes.
 * Regional Indian languages fall back to 'hinglish' since templates aren't available
 * in every regional language yet.
 */
export function mapDisplayLangToTemplateCode(
  displayLang: string,
): WhatsAppTemplate['language'] {
  const lower = displayLang.toLowerCase();
  if (lower.startsWith('हिंदी') || lower.startsWith('hindi')) return 'hi';
  // English and all regional languages (Telugu, Tamil, etc.) use English templates
  return 'en';
}

export const LANGUAGE_LABELS: Record<WhatsAppTemplate['language'] | 'all', string> = {
  all: '🌐 All',
  en: '🇬🇧 English',
  hi: '🇮🇳 Hindi',
  hinglish: '🤝 Hinglish',
  te: 'తెలుగు Telugu',
  ta: 'தமிழ் Tamil',
  kn: 'ಕನ್ನಡ Kannada',
  ml: 'മലയാളം Malayalam',
  bn: 'বাংলা Bengali',
  mr: 'मराठी Marathi',
  gu: 'ગુજરાતી Gujarati',
  pa: 'ਪੰਜਾਬੀ Punjabi',
};

/**
 * Map a display language name (native script or English) to a template language code.
 */
export function mapDisplayLangToTemplateCode(displayLang: string): WhatsAppTemplate['language'] {
  const lower = displayLang.toLowerCase();
  if (lower.startsWith('हिंदी') || lower === 'hindi') return 'hi';
  if (lower.startsWith('తెలుగు') || lower === 'telugu') return 'te';
  if (lower.startsWith('தமிழ்') || lower === 'tamil') return 'ta';
  if (lower.startsWith('ಕನ್ನಡ') || lower === 'kannada') return 'kn';
  if (lower.startsWith('മലയാളം') || lower === 'malayalam') return 'ml';
  if (lower.startsWith('বাংলা') || lower === 'bengali') return 'bn';
  if (lower.startsWith('मराठी') || lower === 'marathi') return 'mr';
  if (lower.startsWith('ગુજરાતી') || lower === 'gujarati') return 'gu';
  if (lower.startsWith('ਪੰਜਾਬੀ') || lower === 'punjabi') return 'pa';
  return 'en';
}

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
