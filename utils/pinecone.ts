import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('Missing Pinecone API key');
}

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name');
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    filename: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface EmbeddingRecord {
  id: string;
  values: number[];
  metadata: DocumentChunk['metadata'];
} 