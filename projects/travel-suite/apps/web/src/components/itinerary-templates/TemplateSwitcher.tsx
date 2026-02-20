import { Palette, Check } from 'lucide-react';
import { ItineraryTemplateId } from './types';

interface TemplateSwitcherProps {
  currentTemplate: ItineraryTemplateId;
  onTemplateChange: (templateId: ItineraryTemplateId) => void;
}

interface TemplateOption {
  id: ItineraryTemplateId;
  icon: string;
  label: string;
  description: string;
  brandColor: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'safari_story',
    icon: '🦁',
    label: 'Safari Story',
    description: 'Perfect for wildlife adventures and nature experiences',
    brandColor: '#18974e',
  },
  {
    id: 'urban_brief',
    icon: '🏙️',
    label: 'Urban Brief',
    description: 'Ideal for city exploration and urban discoveries',
    brandColor: '#124ea2',
  },
  {
    id: 'professional',
    icon: '⭐',
    label: 'Professional',
    description: 'Clean and elegant for any type of journey',
    brandColor: '#124ea2',
  },
];

export function TemplateSwitcher({
  currentTemplate,
  onTemplateChange,
}: TemplateSwitcherProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gray-700">
        <Palette className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Choose Your Template</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPLATE_OPTIONS.map((template) => {
          const isSelected = currentTemplate === template.id;

          return (
            <button
              key={template.id}
              onClick={() => onTemplateChange(template.id)}
              className={`
                relative p-6 rounded-lg border-2 transition-all duration-200
                hover:shadow-lg hover:scale-[1.02]
                ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-purple-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="text-4xl">{template.icon}</div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {template.label}
                    </h4>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.brandColor }}
                      title={`Brand color: ${template.brandColor}`}
                    />
                  </div>

                  <p className="text-sm text-gray-600">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500 pt-2">
        All templates are free
      </div>
    </div>
  );
}
