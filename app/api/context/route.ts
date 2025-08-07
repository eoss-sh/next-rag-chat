import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/utils/langchain-processing';

export async function POST(request: NextRequest) {
  try {
    const { query, maxChunks = 3 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`Getting context for: "${query}"`);

    // Get relevant context using LangChain
    const context = await documentProcessor.getRelevantContext(query, maxChunks);

    return NextResponse.json({
      query,
      context,
      hasContext: context.length > 0,
    });

  } catch (error) {
    console.error('Context retrieval error:', error);
    return NextResponse.json(
      { error: `Context retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 