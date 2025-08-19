# RAG Chat Application

A secure, multi-tenant RAG (Retrieval-Augmented Generation) powered chat application built with Next.js, Supabase, Pinecone, and OpenAI.

## Features

- 🔐 **Authentication & Authorization**
  - Email/password and Google OAuth login
  - Role-based access control (Admin, User, Pending)
  - Admin approval workflow for new users
  - Secure route protection

- 🤖 **AI-Powered Chat**
  - RAG-enhanced conversations with document context
  - Real-time source citation and relevance scoring
  - Context-aware responses from uploaded documents

- 📄 **Document Management** 
  - PDF and Markdown file upload support
  - Website URL processing and content extraction
  - Automatic chunking and embedding generation
  - Document source tracking in chat responses

- 👨‍💼 **Admin Dashboard**
  - User management and approval workflow
  - Role assignment (User ↔ Admin)
  - User status control (Active, Suspended)
  - System usage statistics

- 🎨 **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Clean component architecture with shadcn/ui
  - Real-time loading states and error handling

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account and project
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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd next-rag-chat
   pnpm install
   ```

2. **Set up services:**
   - **Supabase**: Create project, copy URL and anon key to `.env.local`
   - **Pinecone**: Create index with dimension 1536, copy API key to `.env.local`
   - **OpenAI**: Copy API key to `.env.local`

3. **Initialize database:**
   ```bash
   # Run the SQL schema in your Supabase SQL editor
   cat supabase-schema.sql
   ```

4. **Start development:**
   ```bash
   pnpm dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Create first admin:**
   - Sign up with your email
   - Run the admin creation SQL in Supabase (see [docs/authentication.md](docs/authentication.md))

## User Guide

### Getting Started
- **New users**: Sign up → Wait for admin approval → Access chat/upload
- **Admins**: Access admin dashboard at `/admin` to manage users

### Features Overview
- **Chat**: RAG-powered conversations with document context at `/chat`
- **Upload**: Document/website upload and processing at `/upload` 
- **Admin**: User management and system overview at `/admin`

For detailed documentation, see the [docs/](docs/) folder.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Authentication**: Supabase Auth (email/password + Google OAuth)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Vector Database**: Pinecone for embeddings and semantic search
- **AI**: OpenAI GPT-4 for chat, text-embedding-3-small for embeddings
- **Styling**: Tailwind CSS + shadcn/ui components

### Key Components
- **`contexts/auth-context.tsx`**: Authentication state management
- **`middleware.ts`**: Route protection and role-based access control
- **`app/api/`**: Secure API endpoints with role verification
- **`lib/supabase.ts`**: Supabase client configuration
- **`utils/`**: Document processing, embedding, and Pinecone operations

### Security Model
- **Row Level Security (RLS)**: Database-level access control
- **Role-based Authorization**: Admin approval workflow
- **Route Protection**: Middleware-based access control
- **API Security**: Server-side role verification

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md)

## Contributing

See detailed development guides in the [docs/](docs/) folder:
- [Authentication Setup](docs/authentication.md)
- [Role System](docs/roles.md) 
- [RAG Implementation](docs/rag.md)
- [Admin Dashboard](docs/admin.md)

## Technologies Used

- **Framework**: Next.js 15
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL 
- **Vector DB**: Pinecone
- **AI**: OpenAI GPT-4, text-embedding-3-small
- **Styling**: Tailwind CSS + shadcn/ui
- **File Processing**: pdf-parse, marked, cheerio

## License

MIT
