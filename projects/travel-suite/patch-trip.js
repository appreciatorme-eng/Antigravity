const fs = require('fs');

let content = fs.readFileSync('apps/web/src/components/TripDetailClient.tsx', 'utf8');

// Add imports
const importsToAdd = `
import { SafariStoryView, UrbanBriefView, ProfessionalView, LuxuryResortView, VisualJourneyView, BentoJourneyView, TemplateSwitcher, ItineraryTemplateId } from "@/components/itinerary-templates";
import ItineraryTemplateClassic from "@/components/templates/ItineraryTemplateClassic";
import ItineraryTemplateModern from "@/components/templates/ItineraryTemplateModern";
`;

content = content.replace(
  'import ClientAssignmentBlock from "@/components/ClientAssignmentBlock";',
  'import ClientAssignmentBlock from "@/components/ClientAssignmentBlock";\n' + importsToAdd
);

// Add state for template
content = content.replace(
  'const tripData = itinerary.raw_data;',
  'const [selectedTemplate, setSelectedTemplate] = useState<ItineraryTemplateId>("safari_story");\n    const tripData = itinerary.raw_data;'
);

// Replace everything from {/* Trip Header */} down to </main>
const replacement = `
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <Card className="lg:col-span-2 bg-white/50 backdrop-blur-sm border-gray-200 shadow-sm print:hidden">
                            <CardContent className="pt-6">
                                <div className="mb-6 text-center md:text-left">
                                    <h1 className="text-4xl md:text-5xl font-serif text-secondary mb-4 tracking-tight leading-tight">
                                        {itinerary.trip_title}
                                    </h1>
            
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-600 mb-6">
                                        <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{itinerary.destination}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{itinerary.duration_days || 0} days</span>
                                        </div>
                                        {itinerary.budget && (
                                            <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">
                                                <Wallet className="w-4 h-4 text-primary" />
                                                <span className="font-medium">{itinerary.budget}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed font-light mb-6">
                                        {itinerary.summary}
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <WeatherWidget destination={itinerary.destination} days={itinerary.duration_days || 1} />
                                        <CurrencyConverter destination={itinerary.destination} compact />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-950 shadow-lg print:hidden">
                            <CardContent className="pt-6">
                                <TemplateSwitcher
                                    currentTemplate={selectedTemplate}
                                    onTemplateChange={setSelectedTemplate}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div id="itinerary-pdf-content" className="w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {/* Template-Based Itinerary Display */}
                        {selectedTemplate === 'safari_story' && (
                            <SafariStoryView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'urban_brief' && (
                            <UrbanBriefView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'professional' && (
                            <ProfessionalView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'luxury_resort' && (
                            <LuxuryResortView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'visual_journey' && (
                            <VisualJourneyView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'bento_journey' && (
                            <BentoJourneyView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'classic' && (
                            <ItineraryTemplateClassic itineraryData={tripData} organizationName="GoBuddy Adventures" />
                        )}
                        {selectedTemplate === 'modern' && (
                            <ItineraryTemplateModern itineraryData={tripData} organizationName="GoBuddy Adventures" />
                        )}
                    </div>
                </div>
            </main>
`;

const startIndex = content.indexOf('{/* Trip Header */}');
const endIndex = content.indexOf('</main>') + '</main>'.length;

const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);

fs.writeFileSync('apps/web/src/components/TripDetailClient.tsx', newContent);
console.log('patched');
