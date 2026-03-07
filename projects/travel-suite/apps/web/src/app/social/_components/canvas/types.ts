import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";

export interface CanvasModeProps {
  template: SocialTemplate;
  templateData: TemplateDataForRender;
  backgrounds: string[];
  selectedBackground: string;
  connections: { instagram: boolean; facebook: boolean };
  onTemplateDataChange: (
    updater: (prev: TemplateDataForRender) => TemplateDataForRender
  ) => void;
  onBackgroundChange: (url: string) => void;
  onClose: () => void;
  aiPosterUrl?: string | null;
  onClearAiPoster?: () => void;
}
