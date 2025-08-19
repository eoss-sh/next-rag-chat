import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/utils/langchain-processing';

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.' },
        { status: 400 }
      );
    }

    console.log(`Processing website URL: ${url}`);

    // Process the website using LangChain
    const result = await documentProcessor.processWebsite(url);

    return NextResponse.json({
      success: true,
      filename: result.filename,
      chunks: result.totalChunks,
      url: url,
      message: `Successfully processed ${result.totalChunks} chunks from ${url}`,
    });

  } catch (error) {
    console.error('Website upload error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { error: `Failed to process website: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}