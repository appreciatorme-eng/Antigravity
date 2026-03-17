import SearchableCreatableMultiSelect from '@/components/forms/SearchableCreatableMultiSelect';
import {
  ITINERARY_TEMPLATE_OPTIONS,
  type ItineraryTemplateId,
} from '@/components/pdf/itinerary-types';

interface OnboardingDetailsStepsProps {
  currentStep: number;
  operatorName: string;
  companyName: string;
  phone: string;
  whatsappPhone: string;
  logoUrl: string;
  primaryColor: string;
  bio: string;
  marketplaceDescription: string;
  serviceRegions: string[];
  specialties: string[];
  serviceRegionOptions: string[];
  specialtyOptions: string[];
  itineraryTemplate: ItineraryTemplateId;
  selectedTemplateLabel: string;
  selectedTemplateDescription: string;
  setOperatorName: (value: string) => void;
  setCompanyName: (value: string) => void;
  setPhone: (value: string) => void;
  setWhatsappPhone: (value: string) => void;
  setLogoUrl: (value: string) => void;
  setPrimaryColor: (value: string) => void;
  setBio: (value: string) => void;
  setMarketplaceDescription: (value: string) => void;
  setServiceRegions: (value: string[]) => void;
  setSpecialties: (value: string[]) => void;
  setItineraryTemplate: (value: ItineraryTemplateId) => void;
}

export function OnboardingDetailsSteps({
  currentStep,
  operatorName,
  companyName,
  phone,
  whatsappPhone,
  logoUrl,
  primaryColor,
  bio,
  marketplaceDescription,
  serviceRegions,
  specialties,
  serviceRegionOptions,
  specialtyOptions,
  itineraryTemplate,
  selectedTemplateLabel,
  selectedTemplateDescription,
  setOperatorName,
  setCompanyName,
  setPhone,
  setWhatsappPhone,
  setLogoUrl,
  setPrimaryColor,
  setBio,
  setMarketplaceDescription,
  setServiceRegions,
  setSpecialties,
  setItineraryTemplate,
}: OnboardingDetailsStepsProps) {
  if (currentStep === 1) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Operator Name</label>
          <input
            value={operatorName}
            onChange={(event) => setOperatorName(event.target.value)}
            placeholder="e.g. Nidhi Salgame"
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Company Name *</label>
          <input
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="e.g. Wander Beyond Boundaries"
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Phone</label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+254..."
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">WhatsApp</label>
          <input
            value={whatsappPhone}
            onChange={(event) => setWhatsappPhone(event.target.value)}
            placeholder="+91..."
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Logo URL</label>
          <input
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Primary Color</label>
          <input
            type="color"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#eadfcd] bg-white p-1"
          />
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Operator Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Tell clients about your expertise and team."
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Marketplace Description</label>
          <textarea
            rows={4}
            value={marketplaceDescription}
            onChange={(event) => setMarketplaceDescription(event.target.value)}
            placeholder="What makes your tours unique?"
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          />
        </div>
        <SearchableCreatableMultiSelect
          label="Area of Operations"
          selectedValues={serviceRegions}
          onChange={setServiceRegions}
          options={serviceRegionOptions}
          placeholder="Search places (e.g. Kenya, Dubai, Bali) or add new..."
          helperText="Start typing to autofill from the global destination list. If missing, add custom."
        />
        <SearchableCreatableMultiSelect
          label="Specialties"
          selectedValues={specialties}
          onChange={setSpecialties}
          options={specialtyOptions}
          placeholder="Search specialties or add new..."
          helperText="Select from common tour specialties, or add your own niche offerings."
        />
      </div>
    );
  }

  if (currentStep === 5) {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">Default Itinerary PDF Template</label>
          <select
            value={itineraryTemplate}
            onChange={(event) => setItineraryTemplate(event.target.value as ItineraryTemplateId)}
            className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          >
            {ITINERARY_TEMPLATE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} — {option.description}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9c7c46]">Selected Template</p>
          <h3 className="mt-1 text-lg font-semibold text-[#1b140a]">{selectedTemplateLabel}</h3>
          <p className="mt-1 text-sm text-[#6f5b3e]">{selectedTemplateDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#eadfcd] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[#1b140a]">Business Profile</h3>
        <div className="grid grid-cols-1 gap-2 text-sm text-[#6f5b3e] md:grid-cols-2">
          <p><span className="font-medium text-[#1b140a]">Operator:</span> {operatorName || 'Not set'}</p>
          <p><span className="font-medium text-[#1b140a]">Company:</span> {companyName || 'Not set'}</p>
          <p><span className="font-medium text-[#1b140a]">Phone:</span> {phone || 'Not set'}</p>
          <p><span className="font-medium text-[#1b140a]">WhatsApp:</span> {whatsappPhone || 'Not set'}</p>
        </div>
      </div>
      <div className="rounded-xl border border-[#eadfcd] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[#1b140a]">Marketplace</h3>
        <p className="text-sm text-[#6f5b3e]">
          <span className="font-medium text-[#1b140a]">Regions:</span>{' '}
          {serviceRegions.length ? serviceRegions.join(', ') : 'Not set'}
        </p>
        <p className="mt-1 text-sm text-[#6f5b3e]">
          <span className="font-medium text-[#1b140a]">Specialties:</span>{' '}
          {specialties.length ? specialties.join(', ') : 'Not set'}
        </p>
      </div>
      <div className="rounded-xl border border-[#eadfcd] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[#1b140a]">Template & Branding</h3>
        <p className="text-sm text-[#6f5b3e]">
          <span className="font-medium text-[#1b140a]">Template:</span> {selectedTemplateLabel}
        </p>
        <p className="mt-1 text-sm text-[#6f5b3e]">
          <span className="font-medium text-[#1b140a]">Primary color:</span> {primaryColor}
        </p>
      </div>
    </div>
  );
}
