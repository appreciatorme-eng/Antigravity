"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Star, Heart, X } from "lucide-react";

const itineraryCards = [
  {
    id: 1,
    title: "Romantic Bali Escape",
    location: "Ubud & Seminyak, Bali",
    days: "7 Days / 6 Nights",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop",
    price: "₹1,25,000",
    tags: ["Couples", "Luxury", "Spa"],
    gradient: "from-[#A259FF]/80 to-[#00F0FF]/60",
  },
  {
    id: 2,
    title: "Dubai Extravaganza",
    location: "Dubai, UAE",
    days: "5 Days / 4 Nights",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600&auto=format&fit=crop",
    price: "₹1,50,000",
    tags: ["Family", "Shopping", "Adventure"],
    gradient: "from-[#FF9933]/80 to-[#FF3366]/60",
  },
  {
    id: 3,
    title: "Swiss Alpine Adventure",
    location: "Zurich & Interlaken",
    days: "8 Days / 7 Nights",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=600&auto=format&fit=crop",
    price: "₹2,10,000",
    tags: ["Adventure", "Snow", "Scenic"],
    gradient: "from-[#00F0FF]/80 to-[#A259FF]/60",
  },
  {
    id: 4,
    title: "Maldives Paradise",
    location: "Malé & North Atoll",
    days: "5 Days / 4 Nights",
    rating: 5.0,
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=600&auto=format&fit=crop",
    price: "₹1,80,000",
    tags: ["Honeymoon", "Beach", "Overwater"],
    gradient: "from-[#00F0FF]/80 to-[#00FF88]/60",
  },
  {
    id: 5,
    title: "Thailand Explorer",
    location: "Bangkok & Phuket",
    days: "6 Days / 5 Nights",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=600&auto=format&fit=crop",
    price: "₹85,000",
    tags: ["Budget", "Beach", "Nightlife"],
    gradient: "from-[#FF3366]/80 to-[#FF9933]/60",
  },
];

/* Individual swipeable card */
function SwipeCard({
  card,
  isTop,
  onSwipe,
}: {
  card: (typeof itineraryCards)[0];
  isTop: boolean;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Show like/nope indicators based on drag direction
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipe("right");
    } else if (info.offset.x < -120) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20, opacity: isTop ? 1 : 0.7 }}
      animate={{
        scale: isTop ? 1 : 0.95,
        y: isTop ? 0 : 20,
        opacity: isTop ? 1 : 0.7,
      }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.3 },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        {/* Background Image */}
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(max-width: 768px) 80vw, 380px"
          className="object-cover"
        />

        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient} opacity-40`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Like / Nope indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-8 right-8 px-6 py-2 rounded-xl border-4 border-[#00FF88] text-[#00FF88] font-black text-2xl uppercase rotate-12 z-10"
              style={{ opacity: likeOpacity }}
            >
              LIKE
            </motion.div>
            <motion.div
              className="absolute top-8 left-8 px-6 py-2 rounded-xl border-4 border-[#FF3366] text-[#FF3366] font-black text-2xl uppercase -rotate-12 z-10"
              style={{ opacity: nopeOpacity }}
            >
              NOPE
            </motion.div>
          </>
        )}

        {/* Card content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          {/* Rating */}
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white mb-3">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            {card.rating}
          </div>

          <h3 className="text-2xl font-bold text-white mb-1">{card.title}</h3>

          <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
            <MapPin size={14} />
            <span>{card.location}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
            <Clock size={12} />
            <span>{card.days}</span>
            <span className="ml-auto text-lg font-bold text-white">
              {card.price}
            </span>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-[10px] bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SwipeCardStack() {
  const [cards, setCards] = useState(itineraryCards);
  const [liked, setLiked] = useState<string[]>([]);

  const handleSwipe = useCallback(
    (dir: "left" | "right") => {
      if (cards.length === 0) return;
      const topCard = cards[0];

      if (dir === "right") {
        setLiked((prev) => [...prev, topCard.title]);
      }

      setCards((prev) => prev.slice(1));
    },
    [cards]
  );

  const resetCards = () => {
    setCards(itineraryCards);
    setLiked([]);
  };

  return (
    <section className="relative z-30 bg-transparent py-16 md:py-24 px-6 md:px-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF3366]/30 text-[#FF3366] text-sm font-semibold tracking-widest uppercase mb-4">
            <Heart size={14} /> Swipe to Explore
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            Discover <span className="text-[#FF3366]">Dream Itineraries</span>
          </h2>
          <p className="text-xl text-gray-400 mt-4 max-w-xl mx-auto">
            Swipe right on the packages you love, left to skip. Your clients will
            feel the same magic.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center gap-12 justify-center">
          {/* Card Stack */}
          <div className="relative w-[320px] h-[460px] md:w-[380px] md:h-[520px]">
            <AnimatePresence>
              {cards.length > 0 ? (
                cards
                  .slice(0, 3) // Only render top 3 for performance
                  .map((card, i) => (
                    <SwipeCard
                      key={card.id}
                      card={card}
                      isTop={i === 0}
                      onSwipe={handleSwipe}
                    />
                  ))
                  .reverse() // Reverse so index 0 is on top
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center glass-card rounded-3xl border border-white/10"
                >
                  <Heart
                    size={48}
                    className="text-[#FF3366] mb-4"
                    fill="currentColor"
                  />
                  <p className="text-white font-bold text-lg">
                    You liked {liked.length} itineraries!
                  </p>
                  <p className="text-gray-400 text-sm mt-2 mb-6">
                    Your clients will love swiping too.
                  </p>
                  <button
                    onClick={resetCards}
                    className="px-6 py-3 rounded-full bg-[#FF3366] text-white font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,51,102,0.4)]"
                  >
                    Start Over
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Swipe Instructions */}
          <div className="flex flex-col items-center md:items-start gap-6 text-center md:text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF3366]/10 border border-[#FF3366]/30 flex items-center justify-center">
                <X size={20} className="text-[#FF3366]" />
              </div>
              <div>
                <p className="text-white font-semibold">Swipe Left</p>
                <p className="text-gray-500 text-sm">Skip this itinerary</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center">
                <Heart size={20} className="text-[#00FF88]" />
              </div>
              <div>
                <p className="text-white font-semibold">Swipe Right</p>
                <p className="text-gray-500 text-sm">Add to your wishlist</p>
              </div>
            </div>

            {liked.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl glass-card border border-white/10"
              >
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
                  Liked
                </p>
                <div className="space-y-1">
                  {liked.map((name) => (
                    <p
                      key={name}
                      className="text-sm text-white flex items-center gap-2"
                    >
                      <Heart
                        size={12}
                        className="text-[#FF3366]"
                        fill="currentColor"
                      />{" "}
                      {name}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
