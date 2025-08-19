import { NextResponse } from 'next/server';
import { documentProcessor } from '@/utils/langchain-processing';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get relevant context with sources
    const { sources } = await documentProcessor.getRelevantContextWithSources(query, 3);

    return NextResponse.json({
      success: true,
      sources,
    });

  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}