# RAG Chat Application

A RAG (Retrieval-Augmented Generation) powered chat application built with Next.js, Pinecone, and OpenAI.

## Features

- 🤖 AI-powered chat with RAG capabilities
- 📄 Document upload support (PDF and Markdown)
- 🔍 Semantic search using embeddings
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 📊 Real-time document processing and chunking

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Pinecone account and API key
- OpenAI API key

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here
```

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Pinecone:**
   - Create a Pinecone account at [pinecone.io](https://pinecone.io)
   - Create a new index with dimension 1536 (for text-embedding-3-small)
   - Copy your API key and index name to `.env.local`

3. **Run the development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Chat Interface
- Navigate to the main page to start chatting
- The AI will use RAG to provide context-aware responses
- User inputs are automatically embedded for semantic search

### Document Upload
- Click "Upload" in the navigation or visit `/upload`
- Drag and drop or select PDF and Markdown files
- Documents are automatically:
  - Chunked into smaller pieces
  - Embedded using OpenAI's text-embedding-3-small
  - Stored in Pinecone for semantic search

### Supported File Types
- **PDF**: Full text extraction and processing
- **Markdown**: Direct text processing with markdown syntax removal

## Architecture

### Key Components

- **`utils/pinecone.ts`**: Pinecone client and database operations
- **`utils/embedding.ts`**: Embedding generation utilities
- **`utils/document-processing.ts`**: Document chunking and processing
- **`app/api/upload/route.ts`**: File upload and processing API
- **`app/upload/page.tsx`**: Document upload interface
- **`components/`**: Reusable UI components (shadcn/ui)

### Data Flow

1. **Document Upload:**
   ```
   File → Text Extraction → Chunking → Embedding → Pinecone Storage
   ```

2. **Chat Process:**
   ```
   User Input → Embedding → Semantic Search → Context Retrieval → AI Response
   ```

## Development

### Project Structure
```
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API endpoints
│   │   ├── embed/         # Embedding API
│   │   └── upload/        # File upload API
│   ├── upload/            # Upload page
│   └── page.tsx           # Main chat page
├── components/
│   ├── ui/                # shadcn/ui components
│   └── navigation.tsx     # Navigation component
├── utils/
│   ├── pinecone.ts        # Pinecone client
│   ├── embedding.ts       # Embedding utilities
│   └── document-processing.ts # Document processing
└── lib/
    └── utils.ts           # Utility functions
```

### Adding New File Types

To extend support for new file types:

1. Add the file type to `getFileType()` in `app/api/upload/route.ts`
2. Create an extraction function in `utils/document-processing.ts`
3. Update the processing logic in `processDocument()`

## Technologies Used

- **Framework**: Next.js 15
- **AI**: OpenAI GPT-4, text-embedding-3-small
- **Vector Database**: Pinecone
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **File Processing**: pdf-parse, marked
- **Icons**: Lucide React

## License

MIT
