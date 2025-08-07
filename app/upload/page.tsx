'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadResult {
  filename: string;
  success: boolean;
  message: string;
  chunks?: number;
}

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);

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
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
        <p className="text-muted-foreground">
          Upload PDF and Markdown files to add them to your knowledge base.
        </p>
      </div>

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