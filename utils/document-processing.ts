import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { index, DocumentChunk, EmbeddingRecord } from './pinecone';
import { marked } from 'marked';

// Import pdf-parse with proper typing
const pdfParse = require('pdf-parse');

export interface ProcessedDocument {
  filename: string;
  content: string;
  chunks: DocumentChunk[];
  embeddings: EmbeddingRecord[];
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF extraction with buffer size:', buffer.length);
    
    // Use pdf-parse directly with the buffer
    const data = await pdfParse(buffer, {
      // Specify options to avoid file system issues
      max: 0, // parse all pages
    });
    
    console.log(`PDF parsing successful: ${data.numpages} pages, ${data.text.length} characters`);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTextFromMarkdown(content: string): Promise<string> {
  // Convert markdown to plain text by removing markdown syntax
  const html = await marked(content);
  // Remove HTML tags to get plain text
  return html.replace(/<[^>]*>/g, '');
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + chunkSize * 0.7) {
        chunk = chunk.slice(0, breakPoint + 1);
        start = start + breakPoint + 1;
      } else {
        start = end;
      }
    } else {
      start = end;
    }
    
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (const text of texts) {
    const { embedding } = await embed({
      model: openai.textEmbeddingModel('text-embedding-3-small'),
      value: text,
    });
    embeddings.push(embedding);
  }
  
  return embeddings;
}

export async function processDocument(
  filename: string,
  content: Buffer | string,
  fileType: 'pdf' | 'markdown'
): Promise<ProcessedDocument> {
  // Extract text based on file type
  let text: string;
  if (fileType === 'pdf') {
    text = await extractTextFromPDF(content as Buffer);
  } else {
    text = await extractTextFromMarkdown(content as string);
  }
  
  // Chunk the text
  const textChunks = chunkText(text);
  const chunks: DocumentChunk[] = textChunks.map((chunk, index) => ({
    id: `${filename}-chunk-${index}`,
    text: chunk,
    metadata: {
      source: fileType,
      filename,
      chunkIndex: index,
      totalChunks: textChunks.length,
    },
  }));
  
  // Generate embeddings for chunks
  const embeddings = await generateEmbeddings(textChunks);
  const embeddingRecords: EmbeddingRecord[] = embeddings.map((embedding, index) => ({
    id: chunks[index].id,
    values: embedding,
    metadata: chunks[index].metadata,
  }));
  
  return {
    filename,
    content: text,
    chunks,
    embeddings: embeddingRecords,
  };
}

export async function storeEmbeddings(embeddings: EmbeddingRecord[]): Promise<void> {
  if (embeddings.length === 0) return;
  
  // Upsert embeddings to Pinecone
  await index.upsert(embeddings);
}

export async function processAndStoreDocument(
  filename: string,
  content: Buffer | string,
  fileType: 'pdf' | 'markdown'
): Promise<ProcessedDocument> {
  const processed = await processDocument(filename, content, fileType);
  await storeEmbeddings(processed.embeddings);
  return processed;
} 