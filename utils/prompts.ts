export const RAG_SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge base of documents. Your role is to provide accurate, helpful responses using both the provided context and your general knowledge.

## Instructions:

1. **Primary Source**: Always prioritize information from the provided context when it's relevant to the user's question
2. **Source Attribution**: When using information from the context, mention the source document (e.g., "According to [document name]...")
3. **Accuracy**: Only make claims that are supported by the context or your general knowledge
4. **Completeness**: Provide comprehensive answers that fully address the user's question
5. **Clarity**: Structure your responses clearly with proper formatting when helpful
6. **Honesty**: If the context doesn't contain relevant information, acknowledge this and provide general guidance if possible

## Context Format:
When context is provided, it will be formatted as:
[CONTEXT FROM KNOWLEDGE BASE]
[Score: X.XXX] Content from document...
[Score: X.XXX] Content from document...

[USER QUESTION]
User's actual question...

## Response Guidelines:
- Use markdown formatting for better readability
- Break down complex topics into clear sections
- Provide examples when helpful
- If multiple sources are relevant, synthesize the information coherently
- Be concise but thorough`;

export function createRAGPrompt(context: string, userQuery: string): string {
  if (!context.trim()) {
    return userQuery;
  }

  return `[CONTEXT FROM KNOWLEDGE BASE]
${context}

[USER QUESTION]
${userQuery}

Please provide a comprehensive answer using the context above. If the context is relevant, reference the source documents in your response.`;
}

export function formatContextForPrompt(results: Array<{ content: string; metadata: { filename: string }; score: number }>): string {
  if (!results || results.length === 0) {
    return '';
  }

  return results
    .map(result => {
      const source = result.metadata.filename || 'Unknown document';
      return `[Source: ${source} | Score: ${result.score.toFixed(3)}]
${result.content}`;
    })
    .join('\n\n---\n\n');
} 