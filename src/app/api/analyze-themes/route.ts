import { analyzeSessionThemes } from '@/ai/flows/analyze-session-themes';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { supervisorSummary } = body;

        if (!supervisorSummary || typeof supervisorSummary !== 'string') {
            return NextResponse.json(
                { error: 'supervisorSummary is required and must be a string.' },
                { status: 400 }
            );
        }

        const analysis = await analyzeSessionThemes({ supervisorSummary });
        return NextResponse.json(analysis);
    } catch (error: any) {
        console.error('Error analyzing session themes:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze session themes.' },
            { status: 500 }
        );
    }
}
