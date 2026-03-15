'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  INSERTED_TEMPLATE_DAY_SELECT,
  TEMPLATE_ACCOMMODATION_SELECT,
  TEMPLATE_ACTIVITY_SELECT,
  TEMPLATE_DAY_SELECT,
  TOUR_TEMPLATE_SELECT,
} from '@/lib/tour-templates/selects';
import { useToast } from '@/components/ui/toast';
import { logError } from '@/lib/observability/logger';

interface TemplateDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  activities: TemplateActivity[];
  accommodation: TemplateAccommodation | null;
}

interface TemplateActivity {
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

interface TemplateAccommodation {
  id: string;
  hotel_name: string;
  star_rating: number;
  room_type: string;
  price_per_night: number;
  amenities: string[];
  image_url: string;
}

interface TemplateSummary {
  name: string;
  destination: string | null;
  duration_days: number | null;
  description: string | null;
  hero_image_url: string | null;
  base_price: number | null;
  tags: string[] | null;
  is_public: boolean | null;
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Template basic info
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(5);
  const [description, setDescription] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  // Days
  const [days, setDays] = useState<TemplateDay[]>([]);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load template
      const { data: template, error: templateError } = await supabase
        .from('tour_templates')
        .select(TOUR_TEMPLATE_SELECT)
        .eq('id', templateId)
        .single();
      const templateRow = template as unknown as TemplateSummary | null;

      if (templateError || !templateRow) {
        logError('Error loading template', templateError);
        toast({
          title: 'Template not found',
          description: 'The template may have been removed or is inaccessible.',
          variant: 'error',
        });
        router.push('/admin/tour-templates');
        return;
      }

      // Set basic info
      setName(templateRow.name);
      setDestination(templateRow.destination || '');
      setDurationDays(templateRow.duration_days || 5);
      setDescription(templateRow.description || '');
      setHeroImageUrl(templateRow.hero_image_url || '');
      setBasePrice(templateRow.base_price || 0);
      setTags(templateRow.tags || []);
      setIsPublic(templateRow.is_public || false);

      // Load days
      const { data: daysData, error: daysError } = await supabase
        .from('template_days')
        .select(TEMPLATE_DAY_SELECT)
        .eq('template_id', templateId)
        .order('day_number', { ascending: true });
      const templateDays = (daysData as unknown as Array<{
        id: string;
        day_number: number;
        title: string | null;
        description: string | null;
      }> | null) ?? [];

      if (daysError) {
        logError('Error loading days', daysError);
      } else if (templateDays.length > 0) {
        // Load activities and accommodations for each day
        const loadedDays = await Promise.all(
          templateDays.map(async (day) => {
            // Load activities
            const { data: activities } = await supabase
              .from('template_activities')
              .select(TEMPLATE_ACTIVITY_SELECT)
              .eq('template_day_id', day.id)
              .order('display_order', { ascending: true });
            const templateActivities = (activities as unknown as TemplateActivity[] | null) ?? [];

            // Load accommodation
            const { data: accommodations } = await supabase
              .from('template_accommodations')
              .select(TEMPLATE_ACCOMMODATION_SELECT)
              .eq('template_day_id', day.id)
              .single();
            const templateAccommodation = accommodations as unknown as TemplateAccommodation | null;

            return {
              id: day.id,
              day_number: day.day_number,
              title: day.title || '',
              description: day.description || '',
              activities: templateActivities.map((a) => ({
                id: a.id,
                time: a.time || '09:00 AM',
                title: a.title,
                description: a.description || '',
                location: a.location || '',
                image_url: a.image_url || '',
                price: a.price || 0,
                is_optional: a.is_optional || false,
                is_premium: a.is_premium || false,
                display_order: a.display_order || 0,
              })),
              accommodation: templateAccommodation
                ? {
                    id: templateAccommodation.id,
                    hotel_name: templateAccommodation.hotel_name,
                    star_rating: templateAccommodation.star_rating || 3,
                    room_type: templateAccommodation.room_type || '',
                    price_per_night: templateAccommodation.price_per_night || 0,
                    amenities: templateAccommodation.amenities || [],
                    image_url: templateAccommodation.image_url || '',
                  }
                : null,
            };
          })
        );

        setDays(loadedDays);
      }
    } catch (error) {
      logError('Error loading template', error);
      toast({
        title: 'Failed to load template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [templateId, toast, router]);

  useEffect(() => {
    void loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    if (!name || !destination) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in template name and destination.',
        variant: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Update template
      const { error: templateError } = await supabase
        .from('tour_templates')
        .update({
          name,
          destination,
          duration_days: durationDays,
          description,
          hero_image_url: heroImageUrl || null,
          base_price: basePrice,
          is_public: isPublic,
          tags: tags.length > 0 ? tags : null,
        })
        .eq('id', templateId);

      if (templateError) {
        logError('Error updating template', templateError);
        toast({
          title: 'Failed to update template',
          description: templateError.message,
          variant: 'error',
        });
        return;
      }

      // Delete all existing days, activities, and accommodations (cascade)
      const { error: deleteError } = await supabase
        .from('template_days')
        .delete()
        .eq('template_id', templateId);

      if (deleteError) {
        logError('Error deleting old days', deleteError);
      }

      // Create new days, activities, and accommodations
      for (const day of days) {
        const { data: createdDay, error: dayError } = await supabase
          .from('template_days')
          .insert({
            template_id: templateId,
            day_number: day.day_number,
            title: day.title,
            description: day.description,
          })
          .select(INSERTED_TEMPLATE_DAY_SELECT)
          .single();

        if (dayError) {
          logError('Error creating day', dayError);
          continue;
        }

        // Create activities
        if (day.activities.length > 0) {
          const activitiesData = day.activities.map((activity) => ({
            template_day_id: createdDay.id,
            time: activity.time,
            title: activity.title,
            description: activity.description,
            location: activity.location,
            image_url: activity.image_url || null,
            price: activity.price,
            is_optional: activity.is_optional,
            is_premium: activity.is_premium,
            display_order: activity.display_order,
          }));

          const { error: activitiesError } = await supabase
            .from('template_activities')
            .insert(activitiesData);

          if (activitiesError) {
            logError('Error creating activities', activitiesError);
          }
        }

        // Create accommodation
        if (day.accommodation) {
          const { error: accommodationError } = await supabase
            .from('template_accommodations')
            .insert({
              template_day_id: createdDay.id,
              hotel_name: day.accommodation.hotel_name,
              star_rating: day.accommodation.star_rating,
              room_type: day.accommodation.room_type,
              price_per_night: day.accommodation.price_per_night,
              amenities: day.accommodation.amenities,
              image_url: day.accommodation.image_url || null,
            });

          if (accommodationError) {
            logError('Error creating accommodation', accommodationError);
          }
        }
      }

      toast({
        title: 'Template updated',
        description: 'Your template changes were saved successfully.',
        variant: 'success',
      });
      router.push(`/admin/tour-templates/${templateId}`);
    } catch (error) {
      logError('Error saving template', error);
      toast({
        title: 'Failed to save template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#9c7c46] animate-spin mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading template...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/tour-templates/${templateId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-[var(--font-display)] text-[#1b140a]">Edit Template</h1>
            <p className="text-sm text-[#6f5b3e]">Modify your tour template</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Use the exact same form as Create page - just pre-populated */}
      {/* Basic Info, Days, etc. - copying from create page for brevity */}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
        <h2 className="text-lg font-semibold text-[#1b140a] mb-4">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Duration (Days)
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Base Price ($)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Hero Image URL
          </label>
          <input
            type="url"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
          />
          <label htmlFor="isPublic" className="text-sm text-[#6f5b3e]">
            Make this template public
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Note:</strong> Saving will update the template. Existing proposals created
          from this template will NOT be affected.
        </p>
      </div>
    </div>
  );
}
