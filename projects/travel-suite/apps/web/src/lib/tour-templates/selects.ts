export const TOUR_TEMPLATE_SELECT = [
  "base_price",
  "created_at",
  "description",
  "destination",
  "duration_days",
  "hero_image_url",
  "id",
  "is_public",
  "name",
  "organization_id",
  "status",
  "tags",
  "updated_at",
].join(", ");

export const TEMPLATE_DAY_SELECT = [
  "day_number",
  "description",
  "id",
  "template_id",
  "title",
].join(", ");

export const TEMPLATE_ACTIVITY_SELECT = [
  "description",
  "display_order",
  "id",
  "image_url",
  "is_optional",
  "is_premium",
  "location",
  "price",
  "template_day_id",
  "time",
  "title",
].join(", ");

export const TEMPLATE_ACCOMMODATION_SELECT = [
  "amenities",
  "hotel_name",
  "id",
  "image_url",
  "price_per_night",
  "room_type",
  "star_rating",
  "template_day_id",
].join(", ");

export const INSERTED_TEMPLATE_SELECT = "id";
export const INSERTED_TEMPLATE_DAY_SELECT = "id";
