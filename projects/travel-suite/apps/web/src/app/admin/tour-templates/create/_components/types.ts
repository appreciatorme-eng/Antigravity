export interface TemplateDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  activities: TemplateActivity[];
  accommodation: TemplateAccommodation | null;
}

export interface TemplateActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  price: number;
  is_optional: boolean;
  is_premium: boolean;
  display_order: number;
}

export interface TemplateAccommodation {
  id: string;
  hotel_name: string;
  star_rating: number;
  room_type: string;
  price_per_night: number;
  amenities: string[];
  image_url: string;
}
