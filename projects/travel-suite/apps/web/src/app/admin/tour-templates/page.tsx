'use client';

import { useCallback, useEffect, useState } from 'react';
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
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';
import { GlassConfirmModal } from '@/components/glass/GlassModal';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassCardSkeleton } from '@/components/glass/GlassSkeleton';
import { useToast } from '@/components/ui/toast';

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<TourTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
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
            const { data: days, count: daysCount } = await supabase
              .from('template_days')
              .select('id', { count: 'exact' })
              .eq('template_id', template.id);

            let activitiesCount = 0;
            if (days && days.length > 0) {
              const dayIds = days.map((d) => d.id);
              const { count } = await supabase
                .from('template_activities')
                .select('*', { count: 'exact', head: true })
                .in('template_day_id', dayIds);
              activitiesCount = count || 0;
            }

            return {
              ...template,
              status: template.status || 'draft',
              is_public: template.is_public || false,
              created_at: template.created_at || new Date().toISOString(),
              updated_at: template.updated_at || new Date().toISOString(),
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
  }, [filterStatus]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function handleDeleteTemplate() {
    if (!deleteConfirm) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('tour_templates').delete().eq('id', deleteConfirm.id);

      if (error) {
        console.error('Error deleting template:', error);
        toast({
          title: 'Failed to delete template',
          description: error.message,
          variant: 'error',
        });
      } else {
        loadTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Failed to delete template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setDeleteConfirm(null);
    }
  }

  async function handleCloneTemplate(template: TourTemplate) {
    try {
      const supabase = createClient();

      // Use the clone_template_deep RPC function
      const { error } = await supabase.rpc('clone_template_deep', {
        p_template_id: template.id,
        p_new_name: `${template.name} (Copy)`,
      });

      if (error) {
        console.error('Error cloning template:', error);
        toast({
          title: 'Failed to clone template',
          description: error.message,
          variant: 'error',
        });
        return;
      }

      loadTemplates();
      toast({
        title: 'Template cloned',
        description: 'Template cloned successfully with all days and activities.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error cloning template:', error);
      toast({
        title: 'Failed to clone template',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              Tour Templates
            </span>
            <h1 className="text-2xl font-serif text-secondary dark:text-white mt-1">
              Reusable Itinerary Templates
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              Tour Templates
            </span>
            <h1 className="text-2xl font-serif text-secondary dark:text-white mt-1">
              Reusable Itinerary Templates
            </h1>
            <p className="text-sm text-text-secondary">
              Create templates to quickly build proposals for clients
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tour-templates/import">
            <GlassButton variant="outline">
              <Upload className="w-4 h-4" />
              Import Tour
            </GlassButton>
          </Link>
          <Link href="/admin/tour-templates/create">
            <GlassButton variant="primary">
              <Plus className="w-4 h-4" />
              Create Template
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <GlassInput
            icon={Search}
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <GlassButton
            variant={filterStatus === 'all' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setFilterStatus('all')}
          >
            All
          </GlassButton>
          <GlassButton
            variant={filterStatus === 'active' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setFilterStatus('active')}
          >
            Active
          </GlassButton>
          <GlassButton
            variant={filterStatus === 'archived' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setFilterStatus('archived')}
          >
            Archived
          </GlassButton>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <GlassCard padding="lg">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-secondary dark:text-white mb-2">
              No templates found
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first tour template'}
            </p>
            {!searchQuery && (
              <Link href="/admin/tour-templates/create">
                <GlassButton variant="primary">
                  <Plus className="w-4 h-4" />
                  Create Template
                </GlassButton>
              </Link>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <GlassCard key={template.id} padding="none" rounded="2xl" className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Hero Image */}
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10">
                {template.hero_image_url ? (
                  <Image
                    src={template.hero_image_url}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-primary/50" />
                  </div>
                )}
                {template.is_public && (
                  <div className="absolute top-3 right-3">
                    <GlassBadge variant="primary" icon={Star}>
                      Public
                    </GlassBadge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-secondary dark:text-white mb-2">
                  {template.name}
                </h3>

                <div className="space-y-2 mb-4">
                  {template.destination && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin className="w-4 h-4 text-primary" />
                      {template.destination}
                    </div>
                  )}
                  {template.duration_days && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Calendar className="w-4 h-4 text-primary" />
                      {template.duration_days} days
                    </div>
                  )}
                  {template.base_price && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <DollarSign className="w-4 h-4 text-primary" />
                      ${template.base_price.toFixed(2)} base price
                    </div>
                  )}
                </div>

                {template.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {template.description}
                  </p>
                )}

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <GlassBadge key={index} variant="default" size="sm">
                        {tag}
                      </GlassBadge>
                    ))}
                    {template.tags.length > 3 && (
                      <GlassBadge variant="default" size="sm">
                        +{template.tags.length - 3} more
                      </GlassBadge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary">
                  <span>{template.days_count || 0} days</span>
                  <span>•</span>
                  <span>{template.activities_count || 0} activities</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/admin/tour-templates/${template.id}`} className="flex-1">
                    <GlassButton variant="primary" size="md" fullWidth>
                      <Eye className="w-4 h-4" />
                      View
                    </GlassButton>
                  </Link>
                  <Link href={`/admin/tour-templates/${template.id}/edit`}>
                    <GlassButton variant="ghost" size="md">
                      <Pencil className="w-4 h-4" />
                    </GlassButton>
                  </Link>
                  <GlassButton
                    variant="ghost"
                    size="md"
                    onClick={() => handleCloneTemplate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="md"
                    onClick={() => setDeleteConfirm(template)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <GlassConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and will delete all associated days and activities.`}
        confirmText="Delete Template"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
