import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'langchain',
    '@langchain/openai',
    '@langchain/pinecone',
    '@langchain/community'
  ],
  webpack: (config) => {
    // Handle native dependencies and node-specific modules
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Handle node-specific modules for LangChain
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Exclude server-only modules from client bundle
    if (!config.isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'langchain/document': 'commonjs langchain/document',
        'langchain/text_splitter': 'commonjs langchain/text_splitter',
        '@langchain/openai': 'commonjs @langchain/openai',
        '@langchain/pinecone': 'commonjs @langchain/pinecone',
      });
    }
    
    return config;
  },
};

export default nextConfig;
