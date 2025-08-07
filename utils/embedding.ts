export interface EmbeddingResponse {
  embedding: number[];
}

export async function embedMessage(message: string): Promise<number[] | null> {
  try {
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to embed message');
    }

    const { embedding }: EmbeddingResponse = await response.json();
    console.log('Generated embedding:', embedding);
    return embedding;
  } catch (error) {
    console.error('Error embedding message:', error);
    return null;
  }
}

export async function searchRelevantContext(query: string): Promise<string> {
  try {
    console.log('Searching for relevant context...');
    
    const response = await fetch('/api/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, maxChunks: 3 }),
    });

    if (!response.ok) {
      throw new Error('Failed to search context');
    }

    const data = await response.json();
    
    if (data.hasContext) {
      console.log('Retrieved relevant context');
      return data.context;
    } else {
      console.log('No relevant context found');
      return '';
    }
  } catch (error) {
    console.error('Error searching relevant context:', error);
    return '';
  }
} 