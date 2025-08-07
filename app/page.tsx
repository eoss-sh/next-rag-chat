'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { embedMessage } from '../utils/embedding';
import { Button } from '@/components/ui/button';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Optional: Generate embedding for logging (RAG is now handled in the chat API)
    await embedMessage(input);
    
    // Send the message to the chat (RAG context will be automatically retrieved)
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Chat messages */}
      <div className="flex-1 space-y-4 mb-4">
        {messages.map(message => (
          <div key={message.id} className="whitespace-pre-wrap p-4 rounded-lg border">
            <div className="font-semibold mb-2">
              {message.role === 'user' ? 'User' : 'AI'}
            </div>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return <div key={`${message.id}-${i}`}>{part.text}</div>;
              }
            })}
          </div>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            value={input}
            placeholder="Ask a question..."
            onChange={e => setInput(e.currentTarget.value)}
          />
          <Button type="submit" disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}