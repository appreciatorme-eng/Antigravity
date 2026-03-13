// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import type {
  TemplateDay,
  TemplateActivity,
  TemplateAccommodation,
} from "@/app/admin/tour-templates/create/_components/types";

describe("Tour template types", () => {
  it("TemplateDay has correct shape", () => {
    const day: TemplateDay = {
      id: "day-1",
      day_number: 1,
      title: "Arrival Day",
      description: "Welcome and orientation",
      activities: [],
      accommodation: null,
    };
    expect(day.id).toBe("day-1");
    expect(day.day_number).toBe(1);
    expect(day.activities).toHaveLength(0);
    expect(day.accommodation).toBeNull();
  });

  it("TemplateActivity has correct shape", () => {
    const activity: TemplateActivity = {
      id: "act-1",
      time: "09:00",
      title: "City Tour",
      description: "Guided tour of old city",
      location: "Old Town",
      image_url: "",
      price: 2500,
      is_optional: false,
      is_premium: true,
      display_order: 1,
    };
    expect(activity.price).toBe(2500);
    expect(activity.is_premium).toBe(true);
    expect(activity.is_optional).toBe(false);
  });

  it("TemplateAccommodation has correct shape", () => {
    const accommodation: TemplateAccommodation = {
      id: "acc-1",
      hotel_name: "Grand Hotel",
      star_rating: 4,
      room_type: "Deluxe",
      price_per_night: 8000,
      amenities: ["WiFi", "Pool", "Spa"],
      image_url: "",
    };
    expect(accommodation.star_rating).toBe(4);
    expect(accommodation.amenities).toHaveLength(3);
    expect(accommodation.amenities).toContain("WiFi");
  });

  it("TemplateDay with activities and accommodation", () => {
    const day: TemplateDay = {
      id: "day-2",
      day_number: 2,
      title: "Adventure Day",
      description: "Full day of activities",
      activities: [
        {
          id: "act-1",
          time: "08:00",
          title: "Hiking",
          description: "Mountain hike",
          location: "Trail Head",
          image_url: "",
          price: 1500,
          is_optional: false,
          is_premium: false,
          display_order: 1,
        },
        {
          id: "act-2",
          time: "14:00",
          title: "Rafting",
          description: "White water rafting",
          location: "River Point",
          image_url: "",
          price: 3000,
          is_optional: true,
          is_premium: true,
          display_order: 2,
        },
      ],
      accommodation: {
        id: "acc-1",
        hotel_name: "Mountain Lodge",
        star_rating: 3,
        room_type: "Standard",
        price_per_night: 4500,
        amenities: ["WiFi"],
        image_url: "",
      },
    };
    expect(day.activities).toHaveLength(2);
    expect(day.accommodation?.hotel_name).toBe("Mountain Lodge");
    expect(day.activities[1].is_optional).toBe(true);
  });
});
