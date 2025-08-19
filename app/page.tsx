'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { embedMessage } from '../utils/embedding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface Source {
  filename: string;
  chunkIndex: number;
  score: number;
  content: string;
}

export default function Chat() {
  const [input, setInput] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const { messages, sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput('');

    // Fetch sources for the query
    setLoadingSources(true);
    try {
      const sourcesResponse = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentInput }),
      });

      if (sourcesResponse.ok) {
        const { sources: fetchedSources } = await sourcesResponse.json();
        setSources(fetchedSources || []);
      } else {
        setSources([]);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
      setSources([]);
    } finally {
      setLoadingSources(false);
    }

    // Optional: Generate embedding for logging (RAG is now handled in the chat API)
    await embedMessage(currentInput);
    
    // Send the message to the chat (RAG context will be automatically retrieved)
    sendMessage({ text: currentInput });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chat area */}
        <div className="lg:col-span-2">
          {/* Chat messages */}
          <div className="flex-1 space-y-4 mb-4 min-h-[400px]">
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

        {/* Sources sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sources
              </CardTitle>
              <CardDescription>
                {loadingSources 
                  ? 'Finding relevant sources...'
                  : sources.length === 0
                  ? 'No sources found for your query'
                  : `Found ${sources.length} relevant source${sources.length !== 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSources ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : sources.length > 0 ? (
                <div className="space-y-3">
                  {sources.map((source, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm truncate">
                          {source.filename}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Chunk {source.chunkIndex + 1} • Relevance: {(source.score * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {source.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ask a question to see relevant sources from your documents.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}