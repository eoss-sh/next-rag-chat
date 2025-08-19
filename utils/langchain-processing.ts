import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { pinecone, index } from './pinecone';
import { marked } from 'marked';

const pdfParse = require('pdf-parse');

export interface ProcessedDocumentLangChain {
  filename: string;
  documents: Document[];
  vectorStore: PineconeStore;
  totalChunks: number;
}

export class DocumentProcessor {
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    });
  }

  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      console.log('Starting PDF extraction with LangChain approach, buffer size:', buffer.length);
      
      const data = await pdfParse(buffer, {
        max: 0, // parse all pages
      });
      
      console.log(`PDF parsing successful: ${data.numpages} pages, ${data.text.length} characters`);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractTextFromMarkdown(content: string): Promise<string> {
    // Convert markdown to plain text by removing markdown syntax
    const html = await marked(content);
    // Remove HTML tags to get plain text
    return html.replace(/<[^>]*>/g, '');
  }

  async extractTextFromWebsite(url: string): Promise<{ text: string; title: string }> {
    try {
      console.log('Starting website extraction for URL:', url);
      
      // Use CheerioWebBaseLoader from LangChain
      const loader = new CheerioWebBaseLoader(url, {
        selector: 'body', // Extract text from body
      });
      
      const docs = await loader.load();
      
      if (docs.length === 0) {
        throw new Error('No content found on the webpage');
      }
      
      const doc = docs[0];
      const text = doc.pageContent;
      const title = doc.metadata.title || new URL(url).hostname;
      
      console.log(`Website extraction successful: ${text.length} characters, title: "${title}"`);
      return { text, title };
    } catch (error) {
      console.error('Website extraction error:', error);
      throw new Error(`Failed to extract text from website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processWebsite(url: string): Promise<ProcessedDocumentLangChain> {
    // Extract text and title from website
    const { text, title } = await this.extractTextFromWebsite(url);

    // Create a LangChain Document
    const document = new Document({
      pageContent: text,
      metadata: {
        source: 'website',
        filename: title,
        url: url,
        timestamp: new Date().toISOString(),
      },
    });

    // Split the document into chunks
    const documents = await this.textSplitter.splitDocuments([document]);
    
    // Add chunk metadata
    documents.forEach((doc, index) => {
      doc.metadata = {
        ...doc.metadata,
        chunkIndex: index,
        totalChunks: documents.length,
        chunkId: `${title}-chunk-${index}`,
      };
    });

    console.log(`Website split into ${documents.length} chunks`);

    // Create vector store and add documents
    const vectorStore = await PineconeStore.fromDocuments(
      documents,
      this.embeddings,
      {
        pineconeIndex: index,
        namespace: 'knowledge-base', // Single namespace for all documents
      }
    );

    console.log(`Website documents stored in Pinecone vector store`);

    return {
      filename: title,
      documents,
      vectorStore,
      totalChunks: documents.length,
    };
  }

  async processDocument(
    filename: string,
    content: Buffer | string,
    fileType: 'pdf' | 'markdown'
  ): Promise<ProcessedDocumentLangChain> {
    // Extract text based on file type
    let text: string;
    if (fileType === 'pdf') {
      text = await this.extractTextFromPDF(content as Buffer);
    } else {
      text = await this.extractTextFromMarkdown(content as string);
    }

    // Create a LangChain Document
    const document = new Document({
      pageContent: text,
      metadata: {
        source: fileType,
        filename,
        timestamp: new Date().toISOString(),
      },
    });

    // Split the document into chunks
    const documents = await this.textSplitter.splitDocuments([document]);
    
    // Add chunk metadata
    documents.forEach((doc, index) => {
      doc.metadata = {
        ...doc.metadata,
        chunkIndex: index,
        totalChunks: documents.length,
        chunkId: `${filename}-chunk-${index}`,
      };
    });

    console.log(`Document split into ${documents.length} chunks`);

    // Create vector store and add documents
    const vectorStore = await PineconeStore.fromDocuments(
      documents,
      this.embeddings,
      {
        pineconeIndex: index,
        namespace: 'knowledge-base', // Single namespace for all documents
      }
    );

    console.log(`Documents stored in Pinecone vector store`);

    return {
      filename,
      documents,
      vectorStore,
      totalChunks: documents.length,
    };
  }

  async searchSimilarDocuments(
    query: string,
    k: number = 5,
    namespace: string = 'knowledge-base'
  ): Promise<Document[]> {
    try {
      const vectorStore = new PineconeStore(this.embeddings, {
        pineconeIndex: index,
        namespace,
      });

      const results = await vectorStore.similaritySearch(query, k);
      console.log(`Found ${results.length} similar documents for query: "${query}"`);
      
      return results;
    } catch (error) {
      console.error('Error searching similar documents:', error);
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchWithScore(
    query: string,
    k: number = 5,
    namespace: string = 'knowledge-base'
  ): Promise<[Document, number][]> {
    try {
      const vectorStore = new PineconeStore(this.embeddings, {
        pineconeIndex: index,
        namespace,
      });

      const results = await vectorStore.similaritySearchWithScore(query, k);
      console.log(`Found ${results.length} similar documents with scores for query: "${query}"`);
      
      return results;
    } catch (error) {
      console.error('Error searching similar documents with score:', error);
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRelevantContext(query: string, maxChunks: number = 3): Promise<string> {
    try {
      const results = await this.searchWithScore(query, maxChunks);
      
      // Filter results with good similarity scores (you can adjust this threshold)
      const relevantResults = results.filter(([, score]) => score > 0.4);
      
      if (relevantResults.length === 0) {
        console.log('No relevant context found for query');
        return '';
      }

      const context = relevantResults
        .map(([doc, score]) => {
          return `[Score: ${score.toFixed(3)}] ${doc.pageContent}`;
        })
        .join('\n\n---\n\n');

      console.log(`Retrieved ${relevantResults.length} relevant context chunks`);
      return context;
    } catch (error) {
      console.error('Error getting relevant context:', error);
      return '';
    }
  }

  async getRelevantContextWithSources(query: string, maxChunks: number = 3): Promise<{
    context: string;
    sources: Array<{
      filename: string;
      chunkIndex: number;
      score: number;
      content: string;
    }>;
  }> {
    try {
      const results = await this.searchWithScore(query, maxChunks);
      
      // Filter results with good similarity scores (you can adjust this threshold)
      const relevantResults = results.filter(([, score]) => score > 0.4);
      
      if (relevantResults.length === 0) {
        console.log('No relevant context found for query');
        return { context: '', sources: [] };
      }

      const context = relevantResults
        .map(([doc, score]) => {
          return `[Score: ${score.toFixed(3)}] ${doc.pageContent}`;
        })
        .join('\n\n---\n\n');

      const sources = relevantResults.map(([doc, score]) => ({
        filename: doc.metadata.filename as string,
        chunkIndex: doc.metadata.chunkIndex as number,
        score: score,
        content: doc.pageContent.substring(0, 150) + (doc.pageContent.length > 150 ? '...' : ''),
      }));

      console.log(`Retrieved ${relevantResults.length} relevant context chunks with sources`);
      return { context, sources };
    } catch (error) {
      console.error('Error getting relevant context with sources:', error);
      return { context: '', sources: [] };
    }
  }
}

// Export a singleton instance
export const documentProcessor = new DocumentProcessor(); 