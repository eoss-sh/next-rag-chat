import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';



export async function POST(req: Request) {
    const { message }: { message: string } = await req.json();
  
    const { embedding } = await embed({
        model: openai.textEmbeddingModel('text-embedding-3-small'),
        value: message,
      });

      return Response.json({ embedding });
  }


