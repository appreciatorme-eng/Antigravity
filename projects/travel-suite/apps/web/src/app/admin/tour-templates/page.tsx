'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Globe,
  Calendar,
  DollarSign,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Star,
  MapPin,
  Users,
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
  // Computed
  days_count?: number;
  activities_count?: number;
}

export default function TourTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      // Load templates
      let query = supabase
        .from('tour_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading templates:', error);
      } else {
        // Load counts for each template
        const templatesWithCounts = await Promise.all(
          (data || []).map(async (template) => {
            const { count: daysCount } = await supabase
              .from('template_days')
              .select('*', { count: 'exact', head: true })
              .eq('template_id', template.id);

            const { count: activitiesCount } = await supabase
              .from('template_activities')
              .select('*', { count: 'exact', head: true })
              .eq('template_day_id', { in: [] }); // We'll need to join properly

            return {
              ...template,
              days_count: daysCount || 0,
              activities_count: activitiesCount || 0,
            };
          })
        );

        setTemplates(templatesWithCounts);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
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
        loadTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }

  async function handleCloneTemplate(template: TourTemplate) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Clone the template
      const { data: newTemplate, error } = await supabase
        .from('tour_templates')
        .insert({
          organization_id: profile.organization_id,
          name: `${template.name} (Copy)`,
          destination: template.destination,
          duration_days: template.duration_days,
          description: template.description,
          hero_image_url: template.hero_image_url,
          base_price: template.base_price,
          status: 'active',
          is_public: false,
          tags: template.tags,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error cloning template:', error);
        alert('Failed to clone template');
        return;
      }

      // TODO: Clone template days, activities, and accommodations
      // This would need to be a database function for efficiency

      loadTemplates();
      alert('Template cloned successfully!');
    } catch (error) {
      console.error('Error cloning template:', error);
    }
  }

  const filteredTemplates = templates.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.destination?.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading tour templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f6efe4] flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#9c7c46]" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#bda87f]">
              Tour Templates
            </span>
            <h1 className="text-2xl font-[var(--font-display)] text-[#1b140a] mt-1">
              Reusable Itinerary Templates
            </h1>
            <p className="text-sm text-[#6f5b3e]">
              Create templates to quickly build proposals for clients
            </p>
          </div>
        </div>
        <Link
          href="/admin/tour-templates/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#9c7c46] text-white'
                : 'bg-white text-gray-700 border border-[#eadfcd]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'active'
                ? 'bg-[#9c7c46] text-white'
                : 'bg-white text-gray-700 border border-[#eadfcd]'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'archived'
                ? 'bg-[#9c7c46] text-white'
                : 'bg-white text-gray-700 border border-[#eadfcd]'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first tour template'}
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <Link
                href="/admin/tour-templates/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#9c7c46] hover:bg-[#8a6d3e]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-[#eadfcd] bg-white/90 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Hero Image */}
              <div className="relative h-48 bg-gradient-to-br from-[#f6efe4] to-[#eadfcd]">
                {template.hero_image_url ? (
                  <Image
                    src={template.hero_image_url}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-[#bda87f]" />
                  </div>
                )}
                {template.is_public && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-[#9c7c46] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Public
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[#1b140a] mb-2">
                  {template.name}
                </h3>

                <div className="space-y-2 mb-4">
                  {template.destination && (
                    <div className="flex items-center gap-2 text-sm text-[#6f5b3e]">
                      <MapPin className="w-4 h-4 text-[#bda87f]" />
                      {template.destination}
                    </div>
                  )}
                  {template.duration_days && (
                    <div className="flex items-center gap-2 text-sm text-[#6f5b3e]">
                      <Calendar className="w-4 h-4 text-[#bda87f]" />
                      {template.duration_days} days
                    </div>
                  )}
                  {template.base_price && (
                    <div className="flex items-center gap-2 text-sm text-[#6f5b3e]">
                      <DollarSign className="w-4 h-4 text-[#bda87f]" />
                      ${template.base_price.toFixed(2)} base price
                    </div>
                  )}
                </div>

                {template.description && (
                  <p className="text-sm text-[#6f5b3e] line-clamp-2 mb-4">
                    {template.description}
                  </p>
                )}

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#f8f1e6] text-xs text-[#6f5b3e] rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-2 py-1 bg-[#f8f1e6] text-xs text-[#6f5b3e] rounded">
                        +{template.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-[#bda87f]">
                  <span>{template.days_count || 0} days</span>
                  <span>•</span>
                  <span>{template.activities_count || 0} activities</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/tour-templates/${template.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#9c7c46] text-white text-sm rounded-lg hover:bg-[#8a6d3e] transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    href={`/admin/tour-templates/${template.id}/edit`}
                    className="inline-flex items-center justify-center p-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-[#f8f1e6] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleCloneTemplate(template)}
                    className="inline-flex items-center justify-center p-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-[#f8f1e6] transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="inline-flex items-center justify-center p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
