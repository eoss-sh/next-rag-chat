import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { documentProcessor } from '@/utils/langchain-processing';
import { RAG_SYSTEM_PROMPT, createRAGPrompt } from '@/utils/prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Get the last user message for context retrieval
    const lastMessage = messages[messages.length - 1];
    
    // Extract text content from the message parts
    let userQuery = '';
    if (lastMessage && lastMessage.parts) {
      const textParts = lastMessage.parts.filter(part => part.type === 'text');
      userQuery = textParts.map(part => part.text).join(' ');
    }

    let contextualMessages = [...messages];
    
    if (userQuery && userQuery.trim()) {
      try {
        // Retrieve relevant context from the knowledge base
        console.log('Retrieving context for:', userQuery);
        const context = await documentProcessor.getRelevantContext(userQuery, 3);
        
        if (context) {
          console.log('Found relevant context, enhancing prompt');
          
          // Create an enhanced version of the last message with context using proper prompt template
          const enhancedContent = createRAGPrompt(context, userQuery);

          // Replace the last message with the enhanced version
          const enhancedMessage = {
            ...lastMessage,
            parts: [{ type: 'text' as const, text: enhancedContent }]
          };

          contextualMessages = [
            ...messages.slice(0, -1),
            enhancedMessage
          ];
        } else {
          console.log('No relevant context found, proceeding with regular chat');
        }
      } catch (error) {
        console.error('Error retrieving context:', error);
        // Continue with regular chat if context retrieval fails
      }
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: RAG_SYSTEM_PROMPT,
      messages: convertToModelMessages(contextualMessages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}