import { NextResponse } from 'next/server';
import { index } from '@/utils/pinecone';

interface DocumentInfo {
  id: string;
  filename: string;
  totalChunks: number;
  url?: string;
  source?: string;
}

export async function GET() {
  try {
    // Query Pinecone to get all vectors with their metadata from the knowledge-base namespace
    const queryResponse = await index.namespace('knowledge-base').query({
      topK: 10000, // Large number to get all documents
      includeMetadata: true,
      vector: new Array(1536).fill(0), // Dummy vector since we want all documents
    });

    // Group chunks by filename to get unique documents
    const documentsMap = new Map<string, DocumentInfo>();

    queryResponse.matches?.forEach((match) => {
      if (match.metadata) {
        const filename = match.metadata.filename as string;
        const totalChunks = match.metadata.totalChunks as number;
        const url = match.metadata.url as string | undefined;
        const source = match.metadata.source as string | undefined;
        
        if (!documentsMap.has(filename)) {
          documentsMap.set(filename, {
            id: match.id,
            filename,
            totalChunks,
            url,
            source,
          });
        }
      }
    });

    // Convert map to array
    const documents = Array.from(documentsMap.values());

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}