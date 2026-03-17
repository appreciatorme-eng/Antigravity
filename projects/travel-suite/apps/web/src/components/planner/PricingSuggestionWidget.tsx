"use client";

import React from 'react';
import { Sparkles, TrendingUp, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ComparableTrip {
    destination: string;
    durationDays: number;
    pricePerPerson: number;
    packageTier?: string;
    matchScore: number;
    organizationHash: string;
}

interface PricingSuggestion {
    min: number;
    median: number;
    max: number;
    confidence: 'high' | 'medium' | 'low' | 'ai_estimate';
    sampleSize: number;
    comparableTrips?: ComparableTrip[];
}

interface PricingSuggestionWidgetProps {
    suggestion: PricingSuggestion;
    loading?: boolean;
    onAccept: (price: number) => void;
    onAdjust: (price: number) => void;
    onDismiss: () => void;
}

export function PricingSuggestionWidget({
    suggestion,
    loading = false,
    onAccept,
    onAdjust,
    onDismiss,
}: PricingSuggestionWidgetProps) {
    const formatIndianNumber = (num: number) => {
        return num.toLocaleString('en-IN');
    };

    const getConfidenceBadge = () => {
        const confidenceConfig = {
            high: { label: 'High Confidence', variant: 'default' as const, color: 'text-emerald-600 dark:text-emerald-400' },
            medium: { label: 'Medium Confidence', variant: 'secondary' as const, color: 'text-amber-600 dark:text-amber-400' },
            low: { label: 'Low Confidence', variant: 'outline' as const, color: 'text-orange-600 dark:text-orange-400' },
            ai_estimate: { label: 'AI Estimate', variant: 'outline' as const, color: 'text-blue-600 dark:text-blue-400' },
        };

        const config = confidenceConfig[suggestion.confidence];
        return (
            <Badge variant={config.variant} className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const getConfidenceDescription = () => {
        const descriptions = {
            high: `Based on ${suggestion.sampleSize} similar trips with strong matches`,
            medium: `Based on ${suggestion.sampleSize} similar trips with moderate matches`,
            low: `Based on ${suggestion.sampleSize} similar trip(s) with limited data`,
            ai_estimate: 'AI-generated estimate (limited historical data available)',
        };
        return descriptions[suggestion.confidence];
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                        AI Pricing Suggestion
                    </CardTitle>
                    <CardDescription>Loading pricing intelligence...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-500" />
                            AI Pricing Suggestion
                        </CardTitle>
                        <CardDescription>{getConfidenceDescription()}</CardDescription>
                    </div>
                    {getConfidenceBadge()}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Pricing Range Display */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center space-y-1 p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-white/5">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Minimum</div>
                        <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                            ₹{formatIndianNumber(suggestion.min)}
                        </div>
                    </div>
                    <div className="text-center space-y-1 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-900/50">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Suggested
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            ₹{formatIndianNumber(suggestion.median)}
                        </div>
                    </div>
                    <div className="text-center space-y-1 p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-white/5">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Maximum</div>
                        <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                            ₹{formatIndianNumber(suggestion.max)}
                        </div>
                    </div>
                </div>

                {/* Comparable Trips */}
                {suggestion.comparableTrips && suggestion.comparableTrips.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Comparable Trips
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({suggestion.comparableTrips.length} reference{suggestion.comparableTrips.length > 1 ? 's' : ''})
                            </span>
                        </div>
                        <div className="space-y-2">
                            {suggestion.comparableTrips.map((trip, idx) => (
                                <div
                                    key={`${trip.organizationHash}-${idx}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-white/5"
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {trip.destination}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                • {trip.durationDays} day{trip.durationDays > 1 ? 's' : ''}
                                            </span>
                                            {trip.packageTier && (
                                                <Badge variant="outline" className="text-xs">
                                                    {trip.packageTier}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>Match: {trip.matchScore}%</span>
                                            <span>•</span>
                                            <span className="font-mono opacity-50">
                                                Org: {trip.organizationHash.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            ₹{formatIndianNumber(trip.pricePerPerson)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">per person</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex gap-2 justify-end border-t border-gray-100 dark:border-white/5">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="text-gray-600 dark:text-gray-400"
                >
                    <XCircle className="w-4 h-4 mr-1" />
                    Dismiss
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAdjust(suggestion.median)}
                    className="border-emerald-200 dark:border-emerald-900/50"
                >
                    <Edit className="w-4 h-4 mr-1" />
                    Adjust
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAccept(suggestion.median)}
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accept ₹{formatIndianNumber(suggestion.median)}
                </Button>
            </CardFooter>
        </Card>
    );
}
