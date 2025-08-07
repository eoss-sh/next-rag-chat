'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare, Upload, Search } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">RAG Chat</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button
                variant={pathname === '/' ? 'default' : 'ghost'}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
            </Link>
            <Link href="/upload">
              <Button
                variant={pathname === '/upload' ? 'default' : 'ghost'}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </Link>
            <Link href="/search">
              <Button
                variant={pathname === '/search' ? 'default' : 'ghost'}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 