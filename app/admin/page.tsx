'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Shield, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle
} from 'lucide-react'
import { UserProfile } from '@/lib/database.types'

export default function AdminDashboard() {
  const { user, loading, profileLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!user) {
        router.push('/auth/login')
      } else if (!isAdmin) {
        router.push('/pending-approval')
      }
    }
  }, [user, loading, profileLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const { users } = await response.json()
        setUsers(users)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const updateUser = async (userId: string, updates: { role?: string, status?: string }) => {
    setUpdatingUser(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ...updates }),
      })

      if (response.ok) {
        await fetchUsers() // Refresh the list
      } else {
        console.error('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setUpdatingUser(null)
    }
  }

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

  if (!user || !isAdmin) {
    return null // Will redirect
  }

  const pendingUsers = users.filter(u => u.status === 'pending_approval')
  const activeUsers = users.filter(u => u.status === 'active')
  const suspendedUsers = users.filter(u => u.status === 'suspended')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-purple-600" />
      case 'user':
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{suspendedUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Approve, suspend, or promote users
              </CardDescription>
            </div>
            <Button onClick={fetchUsers} variant="outline" disabled={loadingUsers}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((userProfile) => (
                <div
                  key={userProfile.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(userProfile.status)}
                      {getRoleIcon(userProfile.role)}
                    </div>
                    <div>
                      <p className="font-medium">{userProfile.full_name}</p>
                      <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="capitalize">{userProfile.role}</span>
                        <span>•</span>
                        <span className="capitalize">{userProfile.status.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{new Date(userProfile.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {userProfile.id === user.id ? (
                      <span className="text-sm text-muted-foreground">You</span>
                    ) : (
                      <>
                        {userProfile.status === 'pending_approval' && (
                          <Button
                            onClick={() => updateUser(userProfile.id, { status: 'active', role: 'user' })}
                            disabled={updatingUser === userProfile.id}
                            size="sm"
                            className="text-xs"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}

                        {userProfile.status === 'active' && userProfile.role !== 'admin' && (
                          <Button
                            onClick={() => updateUser(userProfile.id, { role: 'admin' })}
                            disabled={updatingUser === userProfile.id}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            Make Admin
                          </Button>
                        )}

                        {userProfile.status === 'active' && (
                          <Button
                            onClick={() => updateUser(userProfile.id, { status: 'suspended' })}
                            disabled={updatingUser === userProfile.id}
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Suspend
                          </Button>
                        )}

                        {userProfile.status === 'suspended' && (
                          <Button
                            onClick={() => updateUser(userProfile.id, { status: 'active' })}
                            disabled={updatingUser === userProfile.id}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}