# Upload System

The upload system allows users to add documents and websites to the RAG knowledge base for enhanced chat conversations.

## Overview

The upload system supports:
- **File Upload**: PDF and Markdown documents via drag-and-drop or file picker
- **Website Processing**: URL-based content extraction and indexing
- **Real-time Processing**: Live progress updates and error handling
- **Document Management**: View uploaded documents and processing status
- **Access Control**: Upload restricted to approved users only

## Supported Content Types

### File Formats

**PDF Documents**:
- Full text extraction using `pdf-parse`
- Automatic page detection and processing
- Metadata preservation (filename, upload date)
- Support for text-based PDFs (scanned PDFs not supported)

**Markdown Files**:
- Direct text processing with syntax normalization
- Link and image reference handling
- Code block preservation
- Table and list structure maintenance

### Website Processing

**URL Content Extraction**:
- Full webpage scraping using `cheerio`
- HTML tag removal and text extraction
- JavaScript-rendered content (static content only)
- Automatic content chunking and indexing

## Access Control

### User Permissions

Only approved users can upload content:
- **Required Status**: `active` 
- **Required Role**: `user` or `admin`
- **Blocked Status**: `pending_approval`, `suspended`

Access enforced at:
- **Route Level**: Middleware blocks unapproved users
- **Component Level**: Upload interface hidden for unauthorized users
- **API Level**: Server-side permission verification

## File Upload Interface

### Upload Page (`/upload`)

**Features**:
- Drag-and-drop file upload zone
- File picker integration
- Real-time upload progress
- Error handling and validation
- Processing status updates

**User Experience**:
```typescript
// Upload flow
1. User drags/selects files
2. Client validation (file type, size)
3. Upload to server with progress tracking
4. Server processing with status updates
5. Success confirmation with document count
```

### Document List

Shows uploaded documents with:
- **Filename**: Original document name
- **Upload Date**: When document was processed
- **Chunk Count**: Number of text segments created
- **Status**: Processing state (completed, error)
- **Actions**: View details, re-process (admin only)

## Website Upload Interface

### URL Processing

**Input Validation**:
- URL format verification (HTTP/HTTPS)
- Domain accessibility check
- Content-type validation
- Size limitations (to prevent abuse)

**Processing Flow**:
```typescript
const processWebsite = async (url: string) => {
  // 1. Validate URL format
  if (!isValidUrl(url)) throw new Error('Invalid URL')
  
  // 2. Fetch content with error handling
  const content = await fetchWebsiteContent(url)
  
  // 3. Extract text from HTML
  const text = extractTextFromHtml(content)
  
  // 4. Process like document upload
  return await processDocument(url, text)
}
```

## API Endpoints

### File Upload (`/api/upload`)

Handles document file uploads:

```typescript
export async function POST(request: NextRequest) {
  // 1. Authentication check
  const { user, profile } = await authenticateUser(request)
  if (!profile?.isApproved) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Parse form data
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // 3. Validate file type
  const fileType = getFileType(file)
  if (!['pdf', 'markdown'].includes(fileType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }
  
  // 4. Process document
  const result = await documentProcessor.processDocument(file.name, content)
  
  return NextResponse.json({
    success: true,
    filename: file.name,
    chunks: result.totalChunks
  })
}
```

### URL Upload (`/api/upload-url`)

Handles website URL processing:

```typescript
export async function POST(request: NextRequest) {
  // 1. Authentication and validation
  const { url } = await request.json()
  await validateUserAccess(request)
  
  // 2. URL validation
  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }
  
  // 3. Process website
  const result = await documentProcessor.processWebsite(url)
  
  return NextResponse.json({
    success: true,
    filename: result.filename,
    chunks: result.totalChunks,
    url: url
  })
}
```

### Document List (`/api/documents`)

Returns list of uploaded documents:

```typescript
export async function GET() {
  // Get documents from vector database
  const documents = await getUploadedDocuments()
  
  return NextResponse.json({
    documents: documents.map(doc => ({
      filename: doc.filename,
      uploadDate: doc.uploadDate,
      chunks: doc.totalChunks,
      source: doc.source // 'upload' or 'url'
    }))
  })
}
```

## Document Processing Pipeline

### Text Extraction

**PDF Processing**:
```typescript
const extractPdfText = async (buffer: ArrayBuffer): Promise<string> => {
  const pdfData = await pdf(buffer)
  return pdfData.text
}
```

**Markdown Processing**:
```typescript
const processMarkdown = (content: string): string => {
  // Remove markdown syntax while preserving content
  return content
    .replace(/#{1,6}\s/g, '')      // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
}
```

**Website Processing**:
```typescript
const extractWebsiteContent = async (url: string): Promise<string> => {
  const response = await fetch(url)
  const html = await response.text()
  
  const $ = cheerio.load(html)
  
  // Remove unwanted elements
  $('script, style, nav, footer, aside').remove()
  
  // Extract main content
  return $('body').text().replace(/\s+/g, ' ').trim()
}
```

### Chunking Strategy

Documents are split into manageable pieces:

```typescript
interface ChunkingConfig {
  chunkSize: 1000        // Target characters per chunk
  chunkOverlap: 200      // Overlap between adjacent chunks
  minChunkSize: 100      // Minimum viable chunk size
  maxChunks: 1000        // Limit per document
}

const createChunks = (text: string, config: ChunkingConfig) => {
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + config.chunkSize, text.length)
    const chunk = text.substring(start, end)
    
    if (chunk.length >= config.minChunkSize) {
      chunks.push({
        content: chunk,
        chunkIndex: chunks.length,
        start,
        end
      })
    }
    
    start = end - config.chunkOverlap
  }
  
  return chunks
}
```

### Vector Storage

Processed chunks are stored in Pinecone:

```typescript
const storeChunks = async (chunks: Chunk[], metadata: DocumentMetadata) => {
  const vectors = await Promise.all(chunks.map(async (chunk, index) => {
    const embedding = await embedText(chunk.content)
    
    return {
      id: `${metadata.filename}-chunk-${index}`,
      values: embedding,
      metadata: {
        filename: metadata.filename,
        chunkIndex: index,
        content: chunk.content,
        totalChunks: chunks.length,
        uploadDate: new Date().toISOString(),
        source: metadata.source
      }
    }
  }))
  
  await upsertToPinecone(vectors)
}
```

## Error Handling

### Client-Side Validation

```typescript
// File type validation
const validateFile = (file: File): string | null => {
  const allowedTypes = ['application/pdf', 'text/markdown']
  if (!allowedTypes.includes(file.type)) {
    return 'Only PDF and Markdown files are supported'
  }
  
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return 'File size must be less than 50MB'
  }
  
  return null
}

// URL validation
const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}
```

### Server-Side Error Handling

```typescript
export async function POST(request: NextRequest) {
  try {
    // Process upload
    const result = await processDocument(file)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Upload error:', error)
    
    // Categorize errors
    if (error.message.includes('parsing')) {
      return NextResponse.json(
        { error: 'Failed to parse document. Please ensure it\'s a valid file.' },
        { status: 400 }
      )
    }
    
    if (error.message.includes('network')) {
      return NextResponse.json(
        { error: 'Network error. Please try again.' },
        { status: 503 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
```

## Frontend Components

### Upload Zone Component

```typescript
const UploadZone = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const handleDrop = async (files: File[]) => {
    setUploading(true)
    
    try {
      for (const file of files) {
        await uploadFile(file)
      }
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div 
      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
    >
      {uploading ? <UploadProgress /> : <DropMessage />}
    </div>
  )
}
```

### Progress Tracking

```typescript
const UploadProgress = ({ filename }: { filename: string }) => {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'uploading' | 'processing' | 'complete'>('uploading')
  
  useEffect(() => {
    // Track upload progress via WebSocket or polling
    const tracker = new UploadTracker(filename)
    tracker.onProgress = setProgress
    tracker.onStageChange = setStage
    
    return () => tracker.cleanup()
  }, [filename])
  
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p>{getStageMessage(stage)}</p>
    </div>
  )
}
```

## Configuration

### File Upload Limits

```typescript
const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024,     // 50MB per file
  maxFiles: 10,                      // Max files per upload
  allowedTypes: ['pdf', 'markdown'], // Supported formats
  maxChunksPerDocument: 1000         // Prevent overly large documents
}
```

### URL Processing Limits

```typescript
const URL_CONFIG = {
  timeout: 30000,           // 30 second fetch timeout
  maxContentSize: 10 * 1024 * 1024, // 10MB max content
  allowedDomains: [],       // Empty = allow all domains
  blockedDomains: [         // Block problematic domains
    'localhost',
    '127.0.0.1'
  ]
}
```

## Monitoring and Analytics

### Upload Metrics

Track upload performance:

```typescript
// Log upload statistics
const logUploadMetrics = (filename: string, chunks: number, duration: number) => {
  console.log({
    action: 'document_upload',
    filename,
    chunks,
    duration,
    timestamp: new Date().toISOString()
  })
}
```

### Storage Usage

Monitor vector database usage:

```typescript
// Track document count and storage
const getStorageStats = async () => {
  const stats = await pinecone.describeIndex()
  return {
    totalDocuments: stats.totalVectorCount,
    storageUsed: stats.indexSize,
    lastUpdate: new Date()
  }
}
```

## Troubleshooting

### Common Issues

**Upload fails silently**:
- Check file size limits
- Verify user permissions
- Review server logs for errors

**PDF processing errors**:
- Ensure PDF contains extractable text
- Check PDF isn't corrupted or password-protected
- Try re-saving PDF in compatible format

**Website processing fails**:
- Verify URL is accessible
- Check for JavaScript-heavy sites (not supported)
- Review content-type headers

### Debug Tools

```typescript
// Debug document processing
const debugDocumentProcessing = async (filename: string, content: string) => {
  console.log(`Processing: ${filename}`)
  console.log(`Content length: ${content.length}`)
  
  const chunks = createChunks(content)
  console.log(`Generated chunks: ${chunks.length}`)
  
  chunks.slice(0, 3).forEach((chunk, i) => {
    console.log(`Chunk ${i}: ${chunk.content.substring(0, 100)}...`)
  })
}
```