'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, RefreshCw, LogOut, Mail } from 'lucide-react'

export default function PendingApprovalPage() {
  const { user, profile, loading, profileLoading, signOut, refreshProfile, isApproved } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!user) {
        router.push('/auth/login')
      } else if (isApproved) {
        router.push('/chat')
      }
    }
  }, [user, loading, profileLoading, isApproved, router])

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || isApproved) {
    return null // Will redirect
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleRefresh = () => {
    refreshProfile()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Account Pending Approval
            </CardTitle>
            <CardDescription>
              Your account is waiting for administrator approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    What happens next?
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    An administrator will review your account and approve access. 
                    You&apos;ll receive an email notification once approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Account: {user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Status: {profile?.status?.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleRefresh} 
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Status
              </Button>
              
              <Button 
                onClick={handleSignOut}
                variant="ghost"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}