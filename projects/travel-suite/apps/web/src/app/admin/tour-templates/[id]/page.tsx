'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Copy,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TourTemplate {
  id: string;
  organization_id: string;
  name: string;
  destination: string | null;
  duration_days: number | null;
  description: string | null;
  hero_image_url: string | null;
  base_price: number | null;
  status: string;
  is_public: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface TemplateDay {
  id: string;
  template_id: string;
  day_number: number;
  title: string | null;
  description: string | null;
}

interface TemplateActivity {
  id: string;
  template_day_id: string;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  price: number;
  is_optional: boolean;
  is_premium: boolean;
  display_order: number;
}

interface TemplateAccommodation {
  id: string;
  template_day_id: string;
  hotel_name: string;
  star_rating: number;
  room_type: string | null;
  price_per_night: number;
  amenities: string[] | null;
  image_url: string | null;
}

export default function ViewTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<TourTemplate | null>(null);
  const [days, setDays] = useState<TemplateDay[]>([]);
  const [activities, setActivities] = useState<Record<string, TemplateActivity[]>>({});
  const [accommodations, setAccommodations] = useState<
    Record<string, TemplateAccommodation>
  >({});

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load template
      const { data: templateData, error: templateError } = await supabase
        .from('tour_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !templateData) {
        console.error('Error loading template:', templateError);
        setLoading(false);
        return;
      }

      setTemplate(templateData);

      // Load days
      const { data: daysData, error: daysError } = await supabase
        .from('template_days')
        .select('*')
        .eq('template_id', templateId)
        .order('day_number', { ascending: true });

      if (daysError) {
        console.error('Error loading days:', daysError);
      } else {
        setDays(daysData || []);

        // Load activities for each day
        const dayIds = (daysData || []).map((d) => d.id);
        if (dayIds.length > 0) {
          const { data: activitiesData } = await supabase
            .from('template_activities')
            .select('*')
            .in('template_day_id', dayIds)
            .order('display_order', { ascending: true });

          // Group activities by day
          const activitiesByDay: Record<string, TemplateActivity[]> = {};
          (activitiesData || []).forEach((activity) => {
            if (!activitiesByDay[activity.template_day_id]) {
              activitiesByDay[activity.template_day_id] = [];
            }
            activitiesByDay[activity.template_day_id].push(activity);
          });
          setActivities(activitiesByDay);

          // Load accommodations
          const { data: accommodationsData } = await supabase
            .from('template_accommodations')
            .select('*')
            .in('template_day_id', dayIds);

          // Map accommodations by day
          const accommodationsByDay: Record<string, TemplateAccommodation> = {};
          (accommodationsData || []).forEach((acc) => {
            accommodationsByDay[acc.template_day_id] = acc;
          });
          setAccommodations(accommodationsByDay);
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('tour_templates').delete().eq('id', templateId);

      if (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      } else {
        router.push('/admin/tour-templates');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Template not found</div>
      </div>
    );
  }

  // Calculate total price
  const totalActivitiesPrice = Object.values(activities)
    .flat()
    .reduce((sum, activity) => sum + (activity.price || 0), 0);
  const totalAccommodationPrice = Object.values(accommodations).reduce(
    (sum, acc) => sum + (acc.price_per_night || 0) * (template.duration_days || 1),
    0
  );
  const totalPrice = (template.base_price || 0) + totalActivitiesPrice + totalAccommodationPrice;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tour-templates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-[var(--font-display)] text-[#1b140a]">
              {template.name}
            </h1>
            <p className="text-sm text-[#6f5b3e]">Tour Template Preview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/tour-templates/${template.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="rounded-2xl overflow-hidden border border-[#eadfcd]">
        <div className="relative h-80 bg-gradient-to-br from-[#f6efe4] to-[#eadfcd]">
          {template.hero_image_url ? (
            <Image
              src={template.hero_image_url}
              alt={template.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="w-24 h-24 text-[#bda87f]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h2 className="text-4xl font-[var(--font-display)] mb-2">{template.name}</h2>
            <div className="flex items-center gap-6 text-sm">
              {template.destination && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {template.destination}
                </div>
              )}
              {template.duration_days && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {template.duration_days} days
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ${totalPrice.toFixed(2)} total
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {template.description && (
          <div className="p-6 bg-white">
            <p className="text-[#6f5b3e]">{template.description}</p>
          </div>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="px-6 pb-6 bg-white">
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-[#f8f1e6] text-sm text-[#6f5b3e] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Day-by-Day Itinerary */}
      <div className="space-y-6">
        <h2 className="text-2xl font-[var(--font-display)] text-[#1b140a]">
          Day-by-Day Itinerary
        </h2>

        {days.map((day) => (
          <div key={day.id} className="bg-white rounded-2xl border border-[#eadfcd] overflow-hidden">
            {/* Day Header */}
            <div className="p-6 bg-gradient-to-r from-[#f6efe4] to-white border-b border-[#eadfcd]">
              <h3 className="text-xl font-semibold text-[#1b140a] mb-1">
                Day {day.day_number}: {day.title || 'Untitled'}
              </h3>
              {day.description && <p className="text-sm text-[#6f5b3e]">{day.description}</p>}
            </div>

            {/* Activities */}
            {activities[day.id] && activities[day.id].length > 0 && (
              <div className="p-6 space-y-4">
                <h4 className="font-semibold text-[#1b140a]">Activities</h4>
                {activities[day.id].map((activity) => (
                  <div key={activity.id} className="flex gap-4 p-4 bg-[#f8f1e6] rounded-lg">
                    {activity.image_url && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={activity.image_url}
                          alt={activity.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {activity.time && (
                              <span className="text-xs text-[#bda87f] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.time}
                              </span>
                            )}
                            {activity.is_optional && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                Optional
                              </span>
                            )}
                            {activity.is_premium && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                Premium
                              </span>
                            )}
                          </div>
                          <h5 className="font-semibold text-[#1b140a]">{activity.title}</h5>
                          {activity.location && (
                            <p className="text-xs text-[#bda87f] flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {activity.location}
                            </p>
                          )}
                        </div>
                        {activity.price > 0 && (
                          <div className="text-right">
                            <div className="text-lg font-semibold text-[#9c7c46]">
                              ${activity.price.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-[#6f5b3e]">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Accommodation */}
            {accommodations[day.id] && (
              <div className="p-6 border-t border-[#eadfcd] bg-gradient-to-br from-white to-[#f8f1e6]">
                <h4 className="font-semibold text-[#1b140a] mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Accommodation
                </h4>
                <div className="flex gap-4 p-4 bg-white rounded-lg border border-[#eadfcd]">
                  {accommodations[day.id].image_url && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={accommodations[day.id].image_url || ''}
                        alt={accommodations[day.id].hotel_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-[#1b140a] mb-1">
                          {accommodations[day.id].hotel_name}
                        </h5>
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: accommodations[day.id].star_rating }).map(
                            (_, i) => (
                              <Star key={i} className="w-3 h-3 fill-[#9c7c46] text-[#9c7c46]" />
                            )
                          )}
                        </div>
                        {accommodations[day.id].room_type && (
                          <p className="text-sm text-[#6f5b3e]">
                            {accommodations[day.id].room_type}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-[#9c7c46]">
                          ${accommodations[day.id].price_per_night.toFixed(2)}
                        </div>
                        <div className="text-xs text-[#bda87f]">per night</div>
                      </div>
                    </div>
                    {accommodations[day.id].amenities &&
                      accommodations[day.id].amenities!.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {accommodations[day.id].amenities!.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-[#f8f1e6] text-xs text-[#6f5b3e] rounded"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {days.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No days added yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Edit this template to add days and activities
            </p>
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
        <h3 className="text-lg font-semibold text-[#1b140a] mb-4">Price Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6f5b3e]">Base Price</span>
            <span className="font-medium text-[#1b140a]">
              ${(template.base_price || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6f5b3e]">Activities Total</span>
            <span className="font-medium text-[#1b140a]">
              ${totalActivitiesPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6f5b3e]">
              Accommodation Total ({template.duration_days || 0} nights)
            </span>
            <span className="font-medium text-[#1b140a]">
              ${totalAccommodationPrice.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-[#eadfcd] pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-[#1b140a]">Total Price</span>
              <span className="text-2xl font-bold text-[#9c7c46]">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
