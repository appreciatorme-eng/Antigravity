'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import Link from 'next/link';
import {
  INSERTED_TEMPLATE_DAY_SELECT,
  INSERTED_TEMPLATE_SELECT,
} from '@/lib/tour-templates/selects';
import { useToast } from '@/components/ui/toast';
import { logError } from '@/lib/observability/logger';
import {
  MetadataForm,
  DayEditor,
} from './_components';
import type {
  TemplateMetadata,
  TemplateDay,
  TemplateActivity,
  TemplateAccommodation,
} from './_components';

const DEFAULT_METADATA: TemplateMetadata = {
  name: '',
  destination: '',
  durationDays: 5,
  description: '',
  heroImageUrl: '',
  basePrice: 0,
  tags: [],
  isPublic: false,
};

function createDefaultDay(dayNumber: number): TemplateDay {
  return {
    id: crypto.randomUUID(),
    day_number: dayNumber,
    title: '',
    description: '',
    activities: [],
    accommodation: null,
  };
}

function createDefaultActivity(displayOrder: number): TemplateActivity {
  return {
    id: crypto.randomUUID(),
    time: '09:00 AM',
    title: '',
    description: '',
    location: '',
    image_url: '',
    price: 0,
    is_optional: false,
    is_premium: false,
    display_order: displayOrder,
  };
}

function createDefaultAccommodation(): TemplateAccommodation {
  return {
    id: crypto.randomUUID(),
    hotel_name: '',
    star_rating: 3,
    room_type: '',
    price_per_night: 0,
    amenities: [],
    image_url: '',
  };
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [metadata, setMetadata] = useState<TemplateMetadata>(DEFAULT_METADATA);
  const [days, setDays] = useState<TemplateDay[]>([createDefaultDay(1)]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const handleMetadataUpdate = useCallback(
    (updates: Partial<TemplateMetadata>) => {
      setMetadata((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const addDay = useCallback(() => {
    setDays((prev) => {
      const newDay = createDefaultDay(prev.length + 1);
      setExpandedDay(newDay.id);
      return [...prev, newDay];
    });
  }, []);

  const removeDay = useCallback((dayId: string) => {
    setDays((prev) =>
      prev
        .filter((d) => d.id !== dayId)
        .map((day, index) => ({ ...day, day_number: index + 1 }))
    );
  }, []);

  const updateDay = useCallback(
    (dayId: string, updates: Partial<TemplateDay>) => {
      setDays((prev) =>
        prev.map((d) => (d.id === dayId ? { ...d, ...updates } : d))
      );
    },
    []
  );

  const addActivity = useCallback(
    (dayId: string) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.id !== dayId) return d;
          const newActivity = createDefaultActivity(d.activities.length);
          return { ...d, activities: [...d.activities, newActivity] };
        })
      );
    },
    []
  );

  const removeActivity = useCallback(
    (dayId: string, activityId: string) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.id !== dayId) return d;
          return {
            ...d,
            activities: d.activities.filter((a) => a.id !== activityId),
          };
        })
      );
    },
    []
  );

  const updateActivity = useCallback(
    (dayId: string, activityId: string, updates: Partial<TemplateActivity>) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.id !== dayId) return d;
          return {
            ...d,
            activities: d.activities.map((a) =>
              a.id === activityId ? { ...a, ...updates } : a
            ),
          };
        })
      );
    },
    []
  );

  const setAccommodation = useCallback((dayId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return { ...d, accommodation: createDefaultAccommodation() };
      })
    );
  }, []);

  const updateAccommodation = useCallback(
    (dayId: string, updates: Partial<TemplateAccommodation>) => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.id !== dayId || !d.accommodation) return d;
          return {
            ...d,
            accommodation: { ...d.accommodation, ...updates },
          };
        })
      );
    },
    []
  );

  const removeAccommodation = useCallback((dayId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return { ...d, accommodation: null };
      })
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!metadata.name || !metadata.destination) {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Login required',
          description: 'Please log in to save a template.',
          variant: 'warning',
        });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        toast({
          title: 'Organization not found',
          description: 'Your profile is not linked to an organization.',
          variant: 'error',
        });
        return;
      }

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('tour_templates')
        .insert({
          organization_id: profile.organization_id,
          name: metadata.name,
          destination: metadata.destination,
          duration_days: metadata.durationDays,
          description: metadata.description,
          hero_image_url: metadata.heroImageUrl || null,
          base_price: metadata.basePrice,
          status: 'active',
          is_public: metadata.isPublic,
          tags: metadata.tags.length > 0 ? metadata.tags : null,
          created_by: user.id,
        })
        .select(INSERTED_TEMPLATE_SELECT)
        .single();

      if (templateError) {
        logError('Error creating template', templateError);
        toast({
          title: 'Failed to create template',
          description: templateError.message,
          variant: 'error',
        });
        return;
      }

      // Create days, activities, and accommodations
      for (const day of days) {
        const { data: createdDay, error: dayError } = await supabase
          .from('template_days')
          .insert({
            template_id: template.id,
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
        title: 'Template created',
        description: 'Your tour template has been saved successfully.',
        variant: 'success',
      });
      router.push('/admin/tour-templates');
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
  }, [metadata, days, toast, router]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
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
              Create Tour Template
            </h1>
            <p className="text-sm text-[#6f5b3e]">
              Build a reusable template for quick proposal creation
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Basic Info */}
      <MetadataForm metadata={metadata} onUpdate={handleMetadataUpdate} />

      {/* Days */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1b140a]">Itinerary Days</h2>
          <button
            onClick={addDay}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c7c46] text-white text-sm rounded-lg hover:bg-[#8a6d3e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Day
          </button>
        </div>

        {days.map((day) => (
          <DayEditor
            key={day.id}
            day={day}
            isExpanded={expandedDay === day.id}
            onToggle={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
            onUpdate={(updates) => updateDay(day.id, updates)}
            onRemove={() => removeDay(day.id)}
            onAddActivity={() => addActivity(day.id)}
            onRemoveActivity={(activityId) => removeActivity(day.id, activityId)}
            onUpdateActivity={(activityId, updates) =>
              updateActivity(day.id, activityId, updates)
            }
            onSetAccommodation={() => setAccommodation(day.id)}
            onUpdateAccommodation={(updates) => updateAccommodation(day.id, updates)}
            onRemoveAccommodation={() => removeAccommodation(day.id)}
          />
        ))}
      </div>
    </div>
  );
}
