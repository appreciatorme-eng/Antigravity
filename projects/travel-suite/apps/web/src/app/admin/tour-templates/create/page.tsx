'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Save,
  Image as ImageIcon,
  X,
  GripVertical,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

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

export default function CreateTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Template basic info
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(5);
  const [description, setDescription] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Days
  const [days, setDays] = useState<TemplateDay[]>([
    {
      id: crypto.randomUUID(),
      day_number: 1,
      title: '',
      description: '',
      activities: [],
      accommodation: null,
    },
  ]);

  // Current editing
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const addDay = () => {
    const newDay: TemplateDay = {
      id: crypto.randomUUID(),
      day_number: days.length + 1,
      title: '',
      description: '',
      activities: [],
      accommodation: null,
    };
    setDays([...days, newDay]);
    setExpandedDay(newDay.id);
  };

  const removeDay = (dayId: string) => {
    setDays(days.filter((d) => d.id !== dayId));
    // Renumber remaining days
    const updatedDays = days
      .filter((d) => d.id !== dayId)
      .map((day, index) => ({ ...day, day_number: index + 1 }));
    setDays(updatedDays);
  };

  const updateDay = (dayId: string, updates: Partial<TemplateDay>) => {
    setDays(days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)));
  };

  const addActivity = (dayId: string) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    const newActivity: TemplateActivity = {
      id: crypto.randomUUID(),
      time: '09:00 AM',
      title: '',
      description: '',
      location: '',
      image_url: '',
      price: 0,
      is_optional: false,
      is_premium: false,
      display_order: day.activities.length,
    };

    updateDay(dayId, {
      activities: [...day.activities, newActivity],
    });
  };

  const removeActivity = (dayId: string, activityId: string) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    updateDay(dayId, {
      activities: day.activities.filter((a) => a.id !== activityId),
    });
  };

  const updateActivity = (
    dayId: string,
    activityId: string,
    updates: Partial<TemplateActivity>
  ) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    updateDay(dayId, {
      activities: day.activities.map((a) =>
        a.id === activityId ? { ...a, ...updates } : a
      ),
    });
  };

  const setAccommodation = (dayId: string) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    const newAccommodation: TemplateAccommodation = {
      id: crypto.randomUUID(),
      hotel_name: '',
      star_rating: 3,
      room_type: '',
      price_per_night: 0,
      amenities: [],
      image_url: '',
    };

    updateDay(dayId, { accommodation: newAccommodation });
  };

  const updateAccommodation = (
    dayId: string,
    updates: Partial<TemplateAccommodation>
  ) => {
    const day = days.find((d) => d.id === dayId);
    if (!day || !day.accommodation) return;

    updateDay(dayId, {
      accommodation: { ...day.accommodation, ...updates },
    });
  };

  const removeAccommodation = (dayId: string) => {
    updateDay(dayId, { accommodation: null });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!name || !destination) {
      alert('Please fill in template name and destination');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        alert('Organization not found');
        return;
      }

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('tour_templates')
        .insert({
          organization_id: profile.organization_id,
          name,
          destination,
          duration_days: durationDays,
          description,
          hero_image_url: heroImageUrl || null,
          base_price: basePrice,
          status: 'active',
          is_public: isPublic,
          tags: tags.length > 0 ? tags : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (templateError) {
        console.error('Error creating template:', templateError);
        alert('Failed to create template');
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
          .select()
          .single();

        if (dayError) {
          console.error('Error creating day:', dayError);
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
            console.error('Error creating activities:', activitiesError);
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
            console.error('Error creating accommodation:', accommodationError);
          }
        }
      }

      alert('Template created successfully!');
      router.push('/admin/tour-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

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
              placeholder="e.g., Classic Dubai 5D/4N"
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
              placeholder="e.g., Dubai, UAE"
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
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this tour..."
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Hero Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
            <button className="px-4 py-2 border border-[#eadfcd] rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#f8f1e6] text-sm text-[#6f5b3e] rounded-full"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              className="flex-1 px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
            <button
              onClick={addTag}
              className="px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
            >
              Add
            </button>
          </div>
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
            Make this template public (visible to other organizations)
          </label>
        </div>
      </div>

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

        {days.map((day, index) => (
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

// Day Editor Component
function DayEditor({
  day,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity,
  onSetAccommodation,
  onUpdateAccommodation,
  onRemoveAccommodation,
}: {
  day: TemplateDay;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<TemplateDay>) => void;
  onRemove: () => void;
  onAddActivity: () => void;
  onRemoveActivity: (activityId: string) => void;
  onUpdateActivity: (activityId: string, updates: Partial<TemplateActivity>) => void;
  onSetAccommodation: () => void;
  onUpdateAccommodation: (updates: Partial<TemplateAccommodation>) => void;
  onRemoveAccommodation: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] overflow-hidden">
      {/* Day Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="font-semibold text-[#1b140a]">
              Day {day.day_number}: {day.title || 'Untitled Day'}
            </h3>
            <p className="text-sm text-[#bda87f]">
              {day.activities.length} activities
              {day.accommodation ? ' • Accommodation set' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Day Content */}
      {isExpanded && (
        <div className="p-6 border-t border-[#eadfcd] space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">Day Title</label>
            <input
              type="text"
              value={day.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g., Arrival & Burj Khalifa"
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Day Description
            </label>
            <textarea
              value={day.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              placeholder="Brief overview of this day..."
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[#1b140a]">Activities</h4>
              <button
                onClick={onAddActivity}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-[#9c7c46] text-white rounded hover:bg-[#8a6d3e] transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Activity
              </button>
            </div>

            <div className="space-y-3">
              {day.activities.map((activity) => (
                <ActivityEditor
                  key={activity.id}
                  activity={activity}
                  onUpdate={(updates) => onUpdateActivity(activity.id, updates)}
                  onRemove={() => onRemoveActivity(activity.id)}
                />
              ))}
            </div>
          </div>

          {/* Accommodation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[#1b140a]">Accommodation</h4>
              {!day.accommodation && (
                <button
                  onClick={onSetAccommodation}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-[#9c7c46] text-white rounded hover:bg-[#8a6d3e] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Hotel
                </button>
              )}
            </div>

            {day.accommodation && (
              <AccommodationEditor
                accommodation={day.accommodation}
                onUpdate={onUpdateAccommodation}
                onRemove={onRemoveAccommodation}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Activity Editor Component
function ActivityEditor({
  activity,
  onUpdate,
  onRemove,
}: {
  activity: TemplateActivity;
  onUpdate: (updates: Partial<TemplateActivity>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 bg-[#f8f1e6] rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-3 gap-3">
          <input
            type="time"
            value={activity.time}
            onChange={(e) => onUpdate({ time: e.target.value })}
            className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <input
            type="text"
            value={activity.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Activity title"
            className="col-span-2 px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <button
          onClick={onRemove}
          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={activity.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        rows={2}
        placeholder="Activity description..."
        className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
      />

      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          value={activity.location}
          onChange={(e) => onUpdate({ location: e.target.value })}
          placeholder="Location"
          className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        />
        <input
          type="number"
          value={activity.price}
          onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
          placeholder="Price"
          min="0"
          step="0.01"
          className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        />
        <input
          type="url"
          value={activity.image_url}
          onChange={(e) => onUpdate({ image_url: e.target.value })}
          placeholder="Image URL"
          className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-[#6f5b3e]">
          <input
            type="checkbox"
            checked={activity.is_optional}
            onChange={(e) => onUpdate({ is_optional: e.target.checked })}
            className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
          />
          Optional (client can toggle off)
        </label>
        <label className="flex items-center gap-2 text-sm text-[#6f5b3e]">
          <input
            type="checkbox"
            checked={activity.is_premium}
            onChange={(e) => onUpdate({ is_premium: e.target.checked })}
            className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
          />
          Premium upgrade
        </label>
      </div>
    </div>
  );
}

// Accommodation Editor Component
function AccommodationEditor({
  accommodation,
  onUpdate,
  onRemove,
}: {
  accommodation: TemplateAccommodation;
  onUpdate: (updates: Partial<TemplateAccommodation>) => void;
  onRemove: () => void;
}) {
  const [amenityInput, setAmenityInput] = useState('');

  const addAmenity = () => {
    if (amenityInput.trim() && !accommodation.amenities.includes(amenityInput.trim())) {
      onUpdate({ amenities: [...accommodation.amenities, amenityInput.trim()] });
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    onUpdate({ amenities: accommodation.amenities.filter((a) => a !== amenity) });
  };

  return (
    <div className="p-4 bg-[#f8f1e6] rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <input
            type="text"
            value={accommodation.hotel_name}
            onChange={(e) => onUpdate({ hotel_name: e.target.value })}
            placeholder="Hotel name"
            className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <input
            type="text"
            value={accommodation.room_type}
            onChange={(e) => onUpdate({ room_type: e.target.value })}
            placeholder="Room type"
            className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <button
          onClick={onRemove}
          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#6f5b3e] mb-1">Star Rating</label>
          <select
            value={accommodation.star_rating}
            onChange={(e) => onUpdate({ star_rating: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          >
            <option value={1}>1 Star</option>
            <option value={2}>2 Stars</option>
            <option value={3}>3 Stars</option>
            <option value={4}>4 Stars</option>
            <option value={5}>5 Stars</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#6f5b3e] mb-1">Price/Night ($)</label>
          <input
            type="number"
            value={accommodation.price_per_night}
            onChange={(e) => onUpdate({ price_per_night: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6f5b3e] mb-1">Image URL</label>
          <input
            type="url"
            value={accommodation.image_url}
            onChange={(e) => onUpdate({ image_url: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#6f5b3e] mb-1">Amenities</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {accommodation.amenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white text-xs text-[#6f5b3e] rounded"
            >
              {amenity}
              <button onClick={() => removeAmenity(amenity)} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            placeholder="Add amenity..."
            className="flex-1 px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <button
            onClick={addAmenity}
            className="px-3 py-2 bg-[#9c7c46] text-white text-sm rounded hover:bg-[#8a6d3e] transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
