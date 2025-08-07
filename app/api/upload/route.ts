import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/utils/langchain-processing';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const fileType = getFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and Markdown files are supported.' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = fileType === 'markdown' ? buffer.toString('utf-8') : buffer;

    console.log(`Processing ${fileType} file: ${file.name} (${buffer.length} bytes)`);

    // Process and store the document using LangChain
    const result = await documentProcessor.processDocument(file.name, content, fileType);

    return NextResponse.json({
      success: true,
      filename: result.filename,
      chunks: result.totalChunks,
      message: `Successfully processed ${result.totalChunks} chunks from ${file.name}`,
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function getFileType(filename: string): 'pdf' | 'markdown' | null {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return null;
  }
} 