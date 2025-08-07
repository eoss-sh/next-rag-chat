'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  content: string;
  metadata: {
    filename: string;
    chunkIndex: number;
    totalChunks: number;
    chunkId: string;
    source: string;
    timestamp: string;
  };
  score: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(false);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, maxResults: 10 }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Search</h1>
        <p className="text-muted-foreground">
          Search through your uploaded documents using semantic similarity.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Documents
          </CardTitle>
          <CardDescription>
            Enter your question or keywords to find relevant content from uploaded documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to know?"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching || !query.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>
              Search Results {results.length > 0 && `(${results.length})`}
            </CardTitle>
            <CardDescription>
              {results.length > 0 
                ? `Found ${results.length} relevant document chunks`
                : 'No relevant documents found for your query'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {result.metadata.filename}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Chunk {result.metadata.chunkIndex + 1} of {result.metadata.totalChunks}
                        </span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
                        Score: {result.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {result.content}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Source: {result.metadata.source} • {new Date(result.metadata.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Try different keywords or make sure you have uploaded some documents first.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 