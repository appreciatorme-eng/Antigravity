export interface ExtractedDay {
  day_number: number;
  title: string;
  description?: string;
  activities: ExtractedActivity[];
  accommodation?: ExtractedAccommodation;
}

export interface ExtractedActivity {
  time?: string;
  title: string;
  description?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  price?: number;
  is_optional?: boolean;
  is_premium?: boolean;
}

export interface ExtractedAccommodation {
  hotel_name: string;
  star_rating?: number;
  room_type?: string;
  price_per_night?: number;
  amenities?: string[];
}

export interface ExtractedTourData {
  name: string;
  destination: string;
  duration_days: number;
  description?: string;
  base_price?: number;
  days: ExtractedDay[];
  images?: string[]; // Image URLs if found in PDF
}

/**
 * Validate extracted tour data for import.
 */
export function validateExtractedTour(data: ExtractedTourData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.length < 3) {
    errors.push('Tour name is required and must be at least 3 characters');
  }

  if (!data.destination || data.destination.length < 3) {
    errors.push('Destination is required and must be at least 3 characters');
  }

  if (!data.duration_days || data.duration_days < 1 || data.duration_days > 365) {
    errors.push('Duration must be between 1 and 365 days');
  }

  if (!data.days || data.days.length === 0) {
    errors.push('At least one day is required');
  }

  if (data.days) {
    data.days.forEach((day, index) => {
      if (day.day_number !== index + 1) {
        errors.push(`Day ${index + 1} has incorrect day_number: ${day.day_number}`);
      }

      if (!day.title || day.title.length < 3) {
        errors.push(`Day ${day.day_number} title is required`);
      }

      if (!day.activities || day.activities.length === 0) {
        errors.push(`Day ${day.day_number} must have at least one activity`);
      }

      day.activities?.forEach((activity, actIndex) => {
        if (!activity.title || activity.title.length < 3) {
          errors.push(`Day ${day.day_number}, Activity ${actIndex + 1} title is required`);
        }
      });

      if (day.accommodation) {
        if (!day.accommodation.hotel_name || day.accommodation.hotel_name.length < 3) {
          errors.push(`Day ${day.day_number} accommodation name is required`);
        }

        if (day.accommodation.star_rating && (day.accommodation.star_rating < 1 || day.accommodation.star_rating > 5)) {
          errors.push(`Day ${day.day_number} star rating must be between 1 and 5`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

