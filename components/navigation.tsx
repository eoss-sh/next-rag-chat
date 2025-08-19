'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { MessageSquare, Upload, Search, LogOut, User, Shield } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { user, profile, signOut, isAdmin, isApproved } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <h1 className="text-xl font-bold hover:text-blue-600 transition-colors">
                RAG Chat
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            {user ? (
              // Authenticated navigation
              <>
                {isApproved && (
                  <>
                    <Link href="/chat">
                      <Button
                        variant={pathname === '/chat' ? 'default' : 'ghost'}
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
                  </>
                )}
                {isAdmin && (
                  <Link href="/admin">
                    <Button
                      variant={pathname === '/admin' ? 'default' : 'ghost'}
                      className="flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2 pl-2 border-l">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <div className="text-right">
                      <div>{user.email}</div>
                      {profile && (
                        <div className="text-xs capitalize">
                          {profile.role} • {profile.status.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              // Unauthenticated navigation
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="flex items-center gap-2">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="flex items-center gap-2">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 