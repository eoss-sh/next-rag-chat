# RAG (Retrieval-Augmented Generation) System

The application implements a sophisticated RAG system that enhances AI conversations with relevant context from uploaded documents and websites.

## Overview

The RAG system provides:
- **Document Upload**: PDF and Markdown file processing
- **Website Processing**: URL content extraction and indexing
- **Semantic Search**: Vector-based similarity matching
- **Context Integration**: Relevant sources injected into AI conversations
- **Source Attribution**: Real-time citation and relevance scoring

## Architecture

### Data Flow

1. **Document Ingestion**:
   ```
   File/URL → Text Extraction → Chunking → Embedding → Vector Storage
   ```

2. **Query Processing**:
   ```
   User Query → Embedding → Similarity Search → Context Retrieval → AI Response
   ```

3. **Response Generation**:
   ```
   Query + Context → GPT-4 → Enhanced Response + Sources
   ```

## Components

### Document Processing (`utils/langchain-processing.ts`)

Handles document extraction and chunking:

```typescript
const documentProcessor = {
  processDocument: async (filename: string, content: string) => {
    // Extract text and create chunks
    const chunks = await this.createChunks(content, filename)
    // Generate embeddings and store in Pinecone
    await this.storeChunks(chunks)
  },
  
  processWebsite: async (url: string) => {
    // Fetch website content
    const content = await this.extractWebsiteContent(url)
    // Process similar to documents
    return await this.processDocument(url, content)
  }
}
```

### Vector Storage (`utils/pinecone.ts`)

Manages Pinecone vector database operations:

```typescript
// Store document chunks with embeddings
export async function upsertToPinecone(vectors: any[]) {
  const index = await getPineconeIndex()
  await index.upsert(vectors)
}

// Search for relevant context
export async function searchSimilarChunks(embedding: number[], topK = 5) {
  const index = await getPineconeIndex()
  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true
  })
  return results.matches
}
```

### Embedding Generation (`utils/embedding.ts`)

Creates vector embeddings for text:

```typescript
export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  })
  return response.data[0].embedding
}
```

## Chat Integration

### Enhanced Chat API (`app/api/chat/route.ts`)

The chat endpoint integrates RAG context:

```typescript
export async function POST(request: NextRequest) {
  const { messages } = await request.json()
  const lastMessage = messages[messages.length - 1].content
  
  // Generate embedding for user query
  const queryEmbedding = await embedText(lastMessage)
  
  // Search for relevant context
  const relevantChunks = await searchSimilarChunks(queryEmbedding, 5)
  
  // Build context from retrieved chunks
  const context = relevantChunks
    .map(chunk => chunk.metadata.content)
    .join('\n\n')
  
  // Enhance system prompt with context
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are a helpful assistant. Use the following context to answer questions:

${context}

If the context doesn't contain relevant information, say so clearly.`
    },
    ...messages
  ]
  
  // Generate response with GPT-4
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: enhancedMessages,
    stream: true
  })
  
  return new StreamingTextResponse(response)
}
```

### Source Retrieval (`app/api/sources/route.ts`)

Separate endpoint for showing sources:

```typescript
export async function POST(request: NextRequest) {
  const { query } = await request.json()
  
  // Generate embedding
  const embedding = await embedText(query)
  
  // Search for sources
  const matches = await searchSimilarChunks(embedding, 5)
  
  // Format sources for frontend
  const sources = matches.map(match => ({
    filename: match.metadata.filename,
    chunkIndex: match.metadata.chunkIndex,
    score: match.score,
    content: match.metadata.content
  }))
  
  return NextResponse.json({ sources })
}
```

## Document Processing

### Supported Formats

**PDF Files**:
- Text extraction using `pdf-parse`
- Automatic page detection
- Metadata preservation

**Markdown Files**:
- Direct text processing
- Markdown syntax normalization
- Link and image reference handling

**Websites**:
- Content scraping with `cheerio`
- HTML tag removal
- Text content extraction

### Chunking Strategy

Documents are split into manageable chunks:

```typescript
const chunkSize = 1000        // Target characters per chunk
const chunkOverlap = 200      // Overlap between chunks
const minChunkSize = 100      // Minimum viable chunk size
```

**Benefits**:
- **Manageable Context**: Chunks fit within token limits
- **Semantic Coherence**: Overlap maintains context
- **Precise Retrieval**: Smaller chunks enable focused searches

### Metadata Storage

Each chunk includes rich metadata:

```typescript
interface ChunkMetadata {
  filename: string      // Source document name
  chunkIndex: number    // Position within document  
  content: string       // Actual text content
  totalChunks: number   // Total chunks in document
  uploadDate: string    // Processing timestamp
  source: 'upload' | 'url'  // Content source type
}
```

## Search and Retrieval

### Similarity Search

Uses cosine similarity for vector matching:

1. **Query Embedding**: Convert user question to vector
2. **Vector Search**: Find most similar document chunks
3. **Score Filtering**: Only include highly relevant results (score > 0.7)
4. **Result Ranking**: Order by relevance score

### Context Assembly

Retrieved chunks are assembled into context:

```typescript
const buildContext = (chunks: any[]) => {
  return chunks
    .sort((a, b) => b.score - a.score)  // Highest relevance first
    .slice(0, 5)                        // Top 5 chunks max
    .map(chunk => `
Source: ${chunk.metadata.filename}
Content: ${chunk.metadata.content}
    `.trim())
    .join('\n\n---\n\n')
}
```

## Frontend Integration

### Chat Interface (`app/chat/page.tsx`)

Real-time source display:

```typescript
const handleSubmit = async (query: string) => {
  // Fetch relevant sources
  const sourcesResponse = await fetch('/api/sources', {
    method: 'POST',
    body: JSON.stringify({ query })
  })
  const { sources } = await sourcesResponse.json()
  setSources(sources)
  
  // Send chat message (RAG handled server-side)
  sendMessage({ text: query })
}
```

### Sources Sidebar

Shows relevant documents with:
- **Source Attribution**: Document filename and chunk position
- **Relevance Score**: Percentage match (score × 100)
- **Content Preview**: Snippet of relevant text
- **Real-time Updates**: Refreshes with each query

## Configuration

### Vector Database Setup

**Pinecone Configuration**:
- **Dimension**: 1536 (text-embedding-3-small)
- **Metric**: Cosine similarity
- **Index Type**: Serverless (recommended)

### Embedding Model

**OpenAI text-embedding-3-small**:
- **Dimension**: 1536
- **Cost**: Lower than ada-002  
- **Performance**: High quality semantic matching
- **Speed**: Fast inference

### AI Model

**GPT-4 for Chat**:
- **Context Window**: Large enough for retrieved context
- **Instruction Following**: Excellent for RAG prompts
- **Quality**: High-quality responses with context

## Performance Optimization

### Caching Strategy

- **Embedding Cache**: Store embeddings to avoid recomputation
- **Query Cache**: Cache frequent searches
- **Context Cache**: Reuse assembled contexts

### Batch Processing

```typescript
// Process multiple documents efficiently
const processBatch = async (documents: Document[]) => {
  const chunks = documents.flatMap(doc => createChunks(doc))
  const embeddings = await Promise.all(
    chunks.map(chunk => embedText(chunk.content))
  )
  await upsertToPinecone(embeddings)
}
```

### Search Optimization

- **Top-K Limitation**: Retrieve only necessary chunks (5-10)
- **Score Filtering**: Skip low-relevance results
- **Parallel Processing**: Concurrent embedding generation

## Monitoring and Analytics

### Search Analytics

Track search performance:

```typescript
// Log search queries and results
console.log({
  query: userQuery,
  resultsCount: sources.length,
  topScore: Math.max(...sources.map(s => s.score)),
  avgScore: sources.reduce((sum, s) => sum + s.score, 0) / sources.length
})
```

### Document Usage

Monitor document effectiveness:
- **Hit Rate**: How often documents are retrieved
- **Source Distribution**: Which documents are most valuable
- **Query Patterns**: Common user questions

## Troubleshooting

### Common Issues

**No relevant sources found**:
- Check if documents were processed correctly
- Verify Pinecone index configuration
- Review embedding model consistency

**Poor search quality**:
- Increase chunk overlap for better context
- Adjust similarity threshold
- Review document chunking strategy

**Performance issues**:
- Implement embedding caching
- Reduce chunk size or search scope
- Optimize Pinecone index settings

### Debug Tools

```typescript
// Debug embedding generation
const debugEmbedding = async (text: string) => {
  const embedding = await embedText(text)
  console.log(`Text: ${text}`)
  console.log(`Embedding dimension: ${embedding.length}`)
  console.log(`First 5 values: ${embedding.slice(0, 5)}`)
}

// Debug search results
const debugSearch = async (query: string) => {
  const embedding = await embedText(query)
  const results = await searchSimilarChunks(embedding)
  console.log(`Query: ${query}`)
  console.log(`Results: ${results.length}`)
  results.forEach((r, i) => {
    console.log(`${i + 1}. Score: ${r.score}, Source: ${r.metadata.filename}`)
  })
}
```