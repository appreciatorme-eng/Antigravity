'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validateExtractedTour, type ExtractedTourData } from '@/lib/import/types';
import ImportPreview from '@/components/import/ImportPreview';
import { Upload, Link as LinkIcon, Loader2, FileText, Globe, AlertCircle } from 'lucide-react';

type ImportMethod = 'pdf' | 'url' | null;
type ImportStatus = 'idle' | 'extracting' | 'previewing' | 'saving' | 'error';

export default function ImportTourPage() {
  const router = useRouter();
  const [importMethod, setImportMethod] = useState<ImportMethod>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedTourData | null>(null);

  // PDF import state
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // URL import state
  const [url, setUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState<{ title: string; destination: string; duration: string } | null>(null);

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setPdfFile(file);
    setError(null);
  };

  const handleExtractFromPDF = async () => {
    if (!pdfFile) return;

    setStatus('extracting');
    setError(null);

    try {
      const fd = new FormData();
      fd.set('method', 'pdf');
      fd.set('file', pdfFile);

      const res = await fetch('/api/admin/tour-templates/extract', {
        method: 'POST',
        body: fd,
      });
      const result = await res.json();

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to extract tour data from PDF');
        setStatus('error');
        return;
      }

      // Validate extracted data
      const validation = validateExtractedTour(result.data);
      if (!validation.valid) {
        setError(`Validation errors: ${validation.errors.join(', ')}`);
        setStatus('error');
        return;
      }

      setExtractedData(result.data);
      setStatus('previewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleGetURLPreview = async () => {
    if (!url) return;

    setError(null);

    try {
      const res = await fetch('/api/admin/tour-templates/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'preview', url }),
      });
      const result = await res.json();

      if (!result.success || !result.preview) {
        setError(result.error || 'Failed to fetch URL preview');
        return;
      }

      setUrlPreview(result.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleExtractFromURL = async () => {
    if (!url) return;

    setStatus('extracting');
    setError(null);

    try {
      const res = await fetch('/api/admin/tour-templates/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'url', url }),
      });
      const result = await res.json();

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to extract tour data from URL');
        setStatus('error');
        return;
      }

      // Validate extracted data
      const validation = validateExtractedTour(result.data);
      if (!validation.valid) {
        setError(`Validation errors: ${validation.errors.join(', ')}`);
        setStatus('error');
        return;
      }

      setExtractedData(result.data);
      setStatus('previewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleSaveTemplate = async () => {
    if (!extractedData) return;

    setStatus('saving');
    setError(null);

    try {
      const supabase = createClient();

      // Get current user and org
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // Insert template
      const { data: template, error: templateError } = await supabase
        .from('tour_templates')
        .insert({
          organization_id: profile.organization_id,
          name: extractedData.name,
          destination: extractedData.destination,
          duration_days: extractedData.duration_days,
          description: extractedData.description,
          base_price: extractedData.base_price,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Insert days, activities, and accommodations
      for (const day of extractedData.days) {
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

        if (dayError) throw dayError;

        // Insert activities
        if (day.activities && day.activities.length > 0) {
          const activitiesData = day.activities.map((activity, idx) => ({
            template_day_id: createdDay.id,
            time: activity.time,
            title: activity.title,
            description: activity.description,
            location: activity.location,
            price: activity.price || 0,
            is_optional: activity.is_optional || false,
            is_premium: activity.is_premium || false,
            display_order: idx,
          }));

          const { error: activitiesError } = await supabase.from('template_activities').insert(activitiesData);

          if (activitiesError) throw activitiesError;
        }

        // Insert accommodation
        if (day.accommodation) {
          const { error: accomError } = await supabase.from('template_accommodations').insert({
            template_day_id: createdDay.id,
            hotel_name: day.accommodation.hotel_name,
            star_rating: day.accommodation.star_rating,
            room_type: day.accommodation.room_type,
            price_per_night: day.accommodation.price_per_night || 0,
            amenities: day.accommodation.amenities,
          });

          if (accomError) throw accomError;
        }
      }

      // Success! Redirect to template view
      alert('Template imported successfully!');
      router.push(`/admin/tour-templates/${template.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setImportMethod(null);
    setStatus('idle');
    setError(null);
    setExtractedData(null);
    setPdfFile(null);
    setUrl('');
    setUrlPreview(null);
  };

  // Preview screen
  if ((status === 'previewing' || status === 'saving') && extractedData) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <ImportPreview
          extractedData={extractedData}
          onEdit={(data) => setExtractedData(data)}
          onSave={handleSaveTemplate}
          onCancel={handleReset}
          isSaving={status === 'saving'}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Tour Template</h1>
        <p className="text-gray-600">
          Import existing tours from PDF files or website URLs using AI extraction
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Method Selection */}
      {!importMethod && (
        <div className="grid grid-cols-2 gap-6">
          <button
            onClick={() => setImportMethod('pdf')}
            className="p-8 border-2 border-gray-200 rounded-lg hover:border-[#9c7c46] hover:bg-amber-50 transition-colors group"
          >
            <FileText className="w-12 h-12 text-gray-400 group-hover:text-[#9c7c46] mb-4 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Upload PDF</h3>
            <p className="text-sm text-gray-600">
              Extract tour information from PDF brochures and itineraries
            </p>
          </button>

          <button
            onClick={() => setImportMethod('url')}
            className="p-8 border-2 border-gray-200 rounded-lg hover:border-[#9c7c46] hover:bg-amber-50 transition-colors group"
          >
            <Globe className="w-12 h-12 text-gray-400 group-hover:text-[#9c7c46] mb-4 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Import from URL</h3>
            <p className="text-sm text-gray-600">Scrape tour details from your website or tour pages</p>
          </button>
        </div>
      )}

      {/* PDF Upload */}
      {importMethod === 'pdf' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              ← Back to method selection
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Upload PDF Tour Brochure</h2>

          <div className="mb-6">
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#9c7c46] hover:bg-amber-50 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {pdfFile ? pdfFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">PDF files only, up to 10MB</p>
              </div>
              <input type="file" accept=".pdf" onChange={handlePDFUpload} className="hidden" />
            </label>
          </div>

          {pdfFile && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPdfFile(null)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Remove
              </button>
              <button
                onClick={handleExtractFromPDF}
                disabled={status === 'extracting'}
                className="px-6 py-2 text-sm font-medium text-white bg-[#9c7c46] rounded-md hover:bg-[#8a6d3d] disabled:opacity-50 flex items-center gap-2"
              >
                {status === 'extracting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Extract Tour Data'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* URL Import */}
      {importMethod === 'url' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              ← Back to method selection
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Import from Website URL</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tour Page URL</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/tours/dubai-5-days"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9c7c46]"
                />
              </div>
              <button
                onClick={handleGetURLPreview}
                disabled={!url || status === 'extracting'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Preview
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Enter the URL of your tour page (e.g., from your website or tour operator platform)
            </p>
          </div>

          {/* URL Preview */}
          {urlPreview && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Preview:</h3>
              <p className="font-medium text-gray-900">{urlPreview.title}</p>
              <p className="text-sm text-gray-600">
                {urlPreview.destination} • {urlPreview.duration}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExtractFromURL}
              disabled={!url || status === 'extracting'}
              className="px-6 py-2 text-sm font-medium text-white bg-[#9c7c46] rounded-md hover:bg-[#8a6d3d] disabled:opacity-50 flex items-center gap-2"
            >
              {status === 'extracting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Full Tour Data'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-bold text-blue-900 mb-2">💡 How AI Import Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• AI extracts tour name, destination, duration, and pricing</li>
          <li>• Day-by-day itinerary with activities and hotels</li>
          <li>• Identifies optional and premium activities automatically</li>
          <li>• You can review and edit extracted data before saving</li>
          <li>• Saves hours compared to manual template creation</li>
        </ul>
      </div>
    </div>
  );
}
