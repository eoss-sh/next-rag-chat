'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, File, Loader2, CheckCircle, AlertCircle, Database, Link, Globe } from 'lucide-react';

interface UploadResult {
  filename: string;
  success: boolean;
  message: string;
  chunks?: number;
  url?: string;
}

interface ExistingDocument {
  id: string;
  filename: string;
  totalChunks: number;
  url?: string;
  source?: string;
}

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    fetchExistingDocuments();
  }, []);

  const fetchExistingDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setExistingDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const newResults: UploadResult[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        newResults.push({
          filename: file.name,
          success: true,
          message: `Successfully processed ${result.chunks} chunks`,
          chunks: result.chunks,
        });
      } catch (error) {
        newResults.push({
          filename: file.name,
          success: false,
          message: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    setResults(prev => [...prev, ...newResults]);
    setIsUploading(false);
    
    // Refresh existing documents if any uploads were successful
    if (newResults.some(result => result.success)) {
      fetchExistingDocuments();
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsUploading(true);

    try {
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const newResult: UploadResult = {
        filename: result.filename,
        success: true,
        message: `Successfully processed ${result.chunks} chunks`,
        chunks: result.chunks,
        url: urlInput.trim(),
      };

      setResults(prev => [newResult, ...prev]);
      setUrlInput('');
      
      // Refresh existing documents
      fetchExistingDocuments();
      
    } catch (error) {
      const newResult: UploadResult = {
        filename: urlInput.trim(),
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
        url: urlInput.trim(),
      };
      setResults(prev => [newResult, ...prev]);
    }

    setIsUploading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
        <p className="text-muted-foreground">
          Upload PDF and Markdown files or add websites to your knowledge base.
        </p>
      </div>

      {/* Existing Documents Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Documents in Knowledge Base
          </CardTitle>
          <CardDescription>
            {loadingDocuments 
              ? 'Loading existing documents...' 
              : `${existingDocuments.length} document${existingDocuments.length !== 1 ? 's' : ''} currently in your knowledge base`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading documents...</span>
            </div>
          ) : existingDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found in your knowledge base.</p>
              <p className="text-sm">Upload some documents below to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {existingDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  {doc.source === 'website' ? (
                    <Globe className="h-5 w-5 text-green-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{doc.filename}</p>
                    {doc.url && (
                      <p className="text-xs text-green-600 truncate">{doc.url}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {doc.totalChunks} chunk{doc.totalChunks !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add Website
          </CardTitle>
          <CardDescription>
            Enter a URL to scrape and add the website content to your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUrlSubmit}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  className="flex-1 pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 w-full"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  disabled={isUploading}
                />
              </div>
              <Button type="submit" disabled={!urlInput.trim() || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Add Website'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
          <CardDescription>
            Drag and drop files here or click to select. Supported formats: PDF, Markdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <File className="h-6 w-6" />
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {dragActive ? 'Drop files here' : 'Drag files here or click to select'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF and Markdown files
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Select Files'
                )}
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.md,.markdown"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    result.success
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{result.filename}</p>
                    {result.url && (
                      <p className="text-xs text-blue-600 truncate">{result.url}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                  {result.chunks && (
                    <span className="text-sm text-muted-foreground">
                      {result.chunks} chunks
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 