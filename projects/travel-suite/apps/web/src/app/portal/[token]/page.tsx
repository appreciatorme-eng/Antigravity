'use client';

import { useParams } from 'next/navigation';
import { Phone, MessageCircle, MapPin, Car, CheckCircle, Calendar, Users, Navigation } from 'lucide-react';
import PortalItinerary, { type ItineraryDay } from '@/components/portal/PortalItinerary';
import PortalPayment from '@/components/portal/PortalPayment';
import PortalReview from '@/components/portal/PortalReview';

// ---------------------------------------------------------------------------
// Mock trip data (same for all tokens — in production resolved from DB)
// ---------------------------------------------------------------------------
const MOCK_TRIP = {
  clientName: 'Kavita Sharma',
  clientPhone: '+91 98100 12345',
  tripName: 'Royal Rajasthan Heritage 6N/7D',
  destination: 'Rajasthan, India',
  startDate: 'Mar 15, 2026',
  endDate: 'Mar 21, 2026',
  startDateISO: '2026-03-15',
  endDateISO: '2026-03-21',
  paxCount: 2,
  status: 'Confirmed',
  driver: {
    name: 'Ramesh Singh',
    phone: '+919876543210',
    phoneDisplay: '+91 98765 43210',
    vehicle: 'Toyota Innova Crysta',
    plate: 'MH-12-AB-1234',
    pickupTime: 'Mar 15, 6:00 AM',
    pickupLocation: 'IGI Airport Terminal 3, New Delhi',
  },
  payment: {
    total: 45000,
    paid: 22500,
    due: 22500,
    upiId: 'rajheritagetours@hdfcbank',
  },
  operatorPhone: '+911141234567',
  operatorName: 'Rajasthan Heritage Tours',
};

const MOCK_ITINERARY: ItineraryDay[] = [
  {
    dayNumber: 1,
    date: '15 Mar',
    dateISO: '2026-03-15',
    location: 'Delhi → Jaipur',
    activities: [
      {
        time: '6:00 AM',
        name: 'Airport Pickup',
        location: 'IGI Airport Terminal 3, Delhi',
        notes: 'Driver will be waiting at Arrival Gate with name board.',
      },
      {
        time: '7:30 AM',
        name: 'Breakfast En Route',
        location: 'Haldiram\'s, NH-48 Gurugram',
        notes: 'Traditional Rajasthani breakfast.',
      },
      {
        time: '12:00 PM',
        name: 'Check-in & Lunch',
        location: 'Jaipur',
        notes: 'Freshen up and enjoy a welcome thali.',
      },
      {
        time: '4:00 PM',
        name: 'Hawa Mahal Visit',
        location: 'Badi Choupad, Pink City',
        notes: 'Iconic Palace of Winds. Sunset photos are stunning here.',
      },
      {
        time: '7:00 PM',
        name: 'Welcome Dinner',
        location: '1135 AD Restaurant, Amer',
        notes: 'Royal Rajasthani cuisine inside a heritage haveli.',
      },
    ],
    accommodation: {
      hotelName: 'Samode Haveli Heritage Hotel',
      checkIn: '2:00 PM',
      address: 'Gangapole, Jaipur — 302002',
      phone: '+91 141 263 2407',
    },
  },
  {
    dayNumber: 2,
    date: '16 Mar',
    dateISO: '2026-03-16',
    location: 'Jaipur',
    activities: [
      {
        time: '7:00 AM',
        name: 'Sunrise at Nahargarh Fort',
        location: 'Nahargarh Fort, Jaipur',
        notes: 'Panoramic views of the Pink City.',
      },
      {
        time: '10:00 AM',
        name: 'Amber Fort & Elephant Ride',
        location: 'Amer, Jaipur',
        notes: 'UNESCO heritage site. Elephant ride pre-booked. Wear comfortable footwear.',
      },
      {
        time: '1:00 PM',
        name: 'Jal Mahal Lunch Stop',
        location: 'Man Sagar Lake Road, Jaipur',
        notes: 'Photography at the floating palace.',
      },
      {
        time: '3:00 PM',
        name: 'City Palace & Jantar Mantar',
        location: 'Jaleb Chowk, Jaipur',
        notes: 'Royal museum and astronomical observatory.',
      },
      {
        time: '6:00 PM',
        name: 'Johari Bazaar Shopping',
        location: 'Johari Bazaar, Pink City',
        notes: 'Famous for gems, jewellery and textiles.',
      },
    ],
    accommodation: {
      hotelName: 'Samode Haveli Heritage Hotel',
      checkIn: '(Same hotel)',
      address: 'Gangapole, Jaipur — 302002',
      phone: '+91 141 263 2407',
    },
  },
  {
    dayNumber: 3,
    date: '17 Mar',
    dateISO: '2026-03-17',
    location: 'Jaipur → Jodhpur',
    activities: [
      {
        time: '8:00 AM',
        name: 'Checkout & Departure',
        location: 'Samode Haveli, Jaipur',
        notes: 'Packed breakfast provided.',
      },
      {
        time: '11:00 AM',
        name: 'Stepwell Visit — Abhaneri',
        location: 'Chand Baori, Abhaneri Village',
        notes: 'One of India\'s deepest and largest stepwells. 1-hour stop.',
      },
      {
        time: '4:00 PM',
        name: 'Arrive Blue City',
        location: 'Jodhpur',
        notes: 'Check in and explore the old market.',
      },
      {
        time: '7:00 PM',
        name: 'Dinner at Rooftop Café',
        location: 'Shri Mishrilal Café, Clock Tower',
        notes: 'Famous for Makhania Lassi and views of Mehrangarh.',
      },
    ],
    accommodation: {
      hotelName: 'Raas Jodhpur Boutique Hotel',
      checkIn: '2:00 PM',
      address: 'Tunwarji Ka Jhalra, Makrana Mohalla, Jodhpur',
      phone: '+91 291 263 6455',
    },
  },
  {
    dayNumber: 4,
    date: '18 Mar',
    dateISO: '2026-03-18',
    location: 'Jodhpur',
    activities: [
      {
        time: '7:30 AM',
        name: 'Mehrangarh Fort',
        location: 'Mehrangarh, Jodhpur',
        notes: 'One of India\'s largest forts. Museum included in tour package.',
      },
      {
        time: '11:30 AM',
        name: 'Jaswant Thada Memorial',
        location: 'Near Mehrangarh, Jodhpur',
        notes: 'Marble cenotaph with beautiful lake views.',
      },
      {
        time: '1:00 PM',
        name: 'Lunch at Hotel',
        location: 'Raas Jodhpur',
      },
      {
        time: '3:30 PM',
        name: 'Umaid Bhawan Palace Tour',
        location: 'Circuit House Road, Jodhpur',
        notes: 'Still a royal residence — museum section open to visitors.',
      },
      {
        time: '6:30 PM',
        name: 'Sunset at Chamunda Mata Devi Temple',
        location: 'Mehrangarh Fort complex',
        notes: 'Spiritual experience with panoramic sunset view.',
      },
    ],
    accommodation: {
      hotelName: 'Raas Jodhpur Boutique Hotel',
      checkIn: '(Same hotel)',
      address: 'Tunwarji Ka Jhalra, Makrana Mohalla, Jodhpur',
      phone: '+91 291 263 6455',
    },
  },
  {
    dayNumber: 5,
    date: '19 Mar',
    dateISO: '2026-03-19',
    location: 'Jodhpur → Jaisalmer',
    activities: [
      {
        time: '8:30 AM',
        name: 'Departure to Jaisalmer',
        location: 'Jodhpur',
        notes: 'Scenic drive through Thar Desert (~5 hours).',
      },
      {
        time: '11:30 AM',
        name: 'Osian Temple Stop',
        location: 'Osian, Jodhpur District',
        notes: '8th-century sun temple cluster. 45-minute stop.',
      },
      {
        time: '2:30 PM',
        name: 'Arrive Golden City',
        location: 'Jaisalmer',
        notes: 'Check in to desert camp.',
      },
      {
        time: '5:00 PM',
        name: 'Sam Sand Dunes & Camel Safari',
        location: 'Sam Sand Dunes, 42km from Jaisalmer',
        notes: 'Sunset camel ride. Jeep safari available as upgrade.',
      },
      {
        time: '8:00 PM',
        name: 'Desert Cultural Evening',
        location: 'Sam Sand Dunes Camp',
        notes: 'Folk music, Ghoomar dance, bonfire dinner under the stars.',
      },
    ],
    accommodation: {
      hotelName: 'Suryagarh Jaisalmer',
      checkIn: '2:00 PM',
      address: 'Kahala Phata, Sam Road, Jaisalmer — 345001',
      phone: '+91 2992 269 269',
    },
  },
  {
    dayNumber: 6,
    date: '20 Mar',
    dateISO: '2026-03-20',
    location: 'Jaisalmer → Delhi',
    activities: [
      {
        time: '7:00 AM',
        name: 'Sunrise at Sand Dunes',
        location: 'Sam Sand Dunes',
        notes: 'Optional sunrise camel ride.',
      },
      {
        time: '9:00 AM',
        name: 'Jaisalmer Fort Walk',
        location: 'Sonar Qila, Jaisalmer',
        notes: 'Living fort — still inhabited. Patwon ki Haveli included.',
      },
      {
        time: '12:00 PM',
        name: 'Lunch & Departure',
        location: 'Jaisalmer',
        notes: 'Fly back to Delhi from Jaisalmer Airport (flight not included).',
      },
    ],
  },
];

export default function PortalPage() {
  const params = useParams();
  const _token = params.token as string;

  const trip = MOCK_TRIP;

  // Check if trip has ended (show review section)
  const tripEnded = new Date() > new Date(trip.endDateISO);

  function handleWhatsAppDriver() {
    const msg = encodeURIComponent(
      `Namaste ${trip.driver.name} ji! I am *${trip.clientName}*. ` +
        `I will be travelling with you for the *${trip.tripName}* starting ${trip.startDate}. ` +
        `My pickup is at ${trip.driver.pickupTime} from ${trip.driver.pickupLocation}. ` +
        `Please confirm. Dhanyawad! 🙏`
    );
    window.open(`https://wa.me/${trip.driver.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
  }

  function handleShareLocation() {
    // Open WhatsApp with a pre-filled message containing a Google Maps live location link
    const msg = encodeURIComponent(
      `Hi ${trip.driver.name} ji! Here is my live location for pickup:\n` +
        `https://maps.google.com/?q=my+location\n\n` +
        `I will share my live GPS pin when I am ready. See you at ${trip.driver.pickupTime}! 🙏`
    );
    window.open(`https://wa.me/${trip.driver.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
  }

  function handleReviewSubmit(rating: number, comment: string) {
    // In production: POST to API
    console.log('Review submitted:', { rating, comment, tripToken: _token });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* ---------------------------------------------------------------- */}
      {/* SECTION 1: HERO                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-6 py-8 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <p className="text-emerald-100 text-sm font-medium mb-1">Your Trip Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Namaste, {trip.clientName.split(' ')[0]} Ji! 🙏
          </h1>
          <p className="text-emerald-100 text-base mt-2 font-medium">
            {trip.tripName}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{trip.startDate} – {trip.endDate}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{trip.destination}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-emerald-200 mb-1">Need help? Contact your operator</p>
            <a
              href={`tel:${trip.operatorPhone}`}
              className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm rounded-xl px-4 py-2 hover:bg-emerald-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call {trip.operatorName}
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 2: TRIP SUMMARY CARD                                     */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Trip Summary</h2>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 rounded-full px-3 py-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Confirmed
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Destination', value: trip.destination, icon: MapPin },
              { label: 'Duration', value: '6 Nights / 7 Days', icon: Calendar },
              { label: 'Travellers', value: `${trip.paxCount} Adults`, icon: Users },
              { label: 'Trip Starts', value: trip.startDate, icon: Calendar },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 3: ITINERARY                                             */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Your Itinerary</h2>
        <PortalItinerary days={MOCK_ITINERARY} />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 4: YOUR DRIVER                                           */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Your Driver</h2>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Car className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-800">{trip.driver.name}</p>
              <p className="text-sm text-gray-500">{trip.driver.phoneDisplay}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Vehicle
              </p>
              <p className="text-sm font-semibold text-gray-700">{trip.driver.vehicle}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{trip.driver.plate}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                Pickup
              </p>
              <p className="text-sm font-semibold text-gray-700">{trip.driver.pickupTime}</p>
              <p className="text-xs text-gray-500 mt-0.5">{trip.driver.pickupLocation}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={`tel:${trip.driver.phone.replace(/\s/g, '')}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-4 h-4 text-gray-500" />
              Call Driver
            </a>
            <button
              type="button"
              onClick={handleWhatsAppDriver}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5a] transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Driver
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 5: PAYMENT                                               */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Payment</h2>
        <PortalPayment
          totalAmount={trip.payment.total}
          paidAmount={trip.payment.paid}
          dueAmount={trip.payment.due}
          upiId={trip.payment.upiId}
          tripName={trip.tripName}
        />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 6: SHARE LIVE LOCATION                                   */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Navigation className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-800 mb-0.5">
                Share Your Live Location
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Send your real-time Google Maps location to your driver on WhatsApp so they can find you easily.
              </p>
              <button
                type="button"
                onClick={handleShareLocation}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
              >
                <Navigation className="w-4 h-4" />
                Share Location with Driver via WhatsApp
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Opens WhatsApp with your location link pre-filled
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 7: RATE YOUR TRIP (only after trip end)                  */}
      {/* ---------------------------------------------------------------- */}
      {tripEnded && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Rate Your Trip</h2>
          <PortalReview
            tripName={trip.tripName}
            operatorName={trip.operatorName}
            googleReviewLink="https://g.page/r/review"
            onSubmit={handleReviewSubmit}
          />
        </section>
      )}

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
