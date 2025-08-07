import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/utils/langchain-processing';

export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`Searching for: "${query}"`);

    // Search for similar documents with scores
    const results = await documentProcessor.searchWithScore(query, maxResults);

    // Format results for response
    const formattedResults = results.map(([document, score]) => ({
      content: document.pageContent,
      metadata: document.metadata,
      score,
    }));

    return NextResponse.json({
      query,
      results: formattedResults,
      totalResults: formattedResults.length,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('max') || '5');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    console.log(`GET search for: "${query}"`);

    const results = await documentProcessor.searchWithScore(query, maxResults);

    const formattedResults = results.map(([document, score]) => ({
      content: document.pageContent,
      metadata: document.metadata,
      score,
    }));

    return NextResponse.json({
      query,
      results: formattedResults,
      totalResults: formattedResults.length,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 