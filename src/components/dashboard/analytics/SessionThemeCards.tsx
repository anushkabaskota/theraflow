'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Brain,
    ShieldAlert,
    Stethoscope,
    AlertTriangle,
    CheckCircle,
    Info,
} from 'lucide-react';

export type Theme = {
    title: string;
    description: string;
    clinicalCategory: string;
    severity: 'low' | 'moderate' | 'high';
};

export type ThemeAnalysis = {
    themes: Theme[];
    therapeuticApproaches: string[];
    riskIndicators: string[];
    overallAssessment: string;
};

const severityConfig = {
    low: {
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        badgeVariant: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        icon: CheckCircle,
        label: 'Low',
    },
    moderate: {
        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        badgeVariant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        icon: Info,
        label: 'Moderate',
    },
    high: {
        color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        badgeVariant: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        icon: AlertTriangle,
        label: 'High',
    },
};

export function SessionThemeCards({ analysis, loading }: { analysis: ThemeAnalysis | null; loading: boolean }) {
    if (loading) {
        return (
            <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-dashed">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="space-y-5 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Clinical Themes Grid */}
            <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Clinical Themes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.themes.map((theme, idx) => {
                        const config = severityConfig[theme.severity];
                        const SeverityIcon = config.icon;
                        return (
                            <Card
                                key={idx}
                                className={`border ${config.color} transition-all hover:shadow-md`}
                            >
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-sm font-semibold leading-tight">
                                            {theme.title}
                                        </CardTitle>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${config.badgeVariant}`}>
                                            <SeverityIcon className="h-3 w-3" />
                                            {config.label}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 pt-0">
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                        {theme.description}
                                    </p>
                                    <Badge variant="outline" className="text-[10px] font-medium">
                                        {theme.clinicalCategory}
                                    </Badge>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Therapeutic Approaches */}
            {analysis.therapeuticApproaches.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Therapeutic Approaches Observed
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.therapeuticApproaches.map((approach, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                            >
                                {approach}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Risk Indicators */}
            {analysis.riskIndicators.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        Risk Indicators
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.riskIndicators.map((risk, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs px-3 py-1 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                            >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {risk}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Overall Assessment */}
            <Card className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-500/20">
                <CardContent className="py-4 px-4">
                    <h4 className="text-sm font-semibold mb-2 text-violet-700 dark:text-violet-300">
                        Overall Assessment
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.overallAssessment}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
