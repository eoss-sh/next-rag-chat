# Admin Dashboard

The admin dashboard provides comprehensive user management and system oversight capabilities for administrators.

## Overview

The admin dashboard (`/admin`) allows administrators to:
- **User Management**: View, approve, suspend, and manage all users
- **Role Assignment**: Promote users to admin or demote to regular users
- **System Statistics**: View user counts and system usage metrics
- **Access Control**: Manage user permissions and status
- **Audit Trail**: Track user approval and role change history

## Access Requirements

### Admin Access

Only users with admin privileges can access the dashboard:
- **Required Role**: `admin`
- **Required Status**: `active`
- **Route Protection**: Enforced by middleware and component-level checks

### Security Measures

- **Server-side Verification**: API endpoints verify admin status
- **Self-modification Protection**: Admins cannot modify their own role/status
- **Audit Logging**: All admin actions are logged with timestamps

## Dashboard Features

### User Statistics

Real-time overview cards showing:

```typescript
interface SystemStats {
  totalUsers: number      // All registered users
  pendingUsers: number    // Users awaiting approval
  activeUsers: number     // Approved and active users
  suspendedUsers: number  // Suspended/blocked users
}
```

### User Management Table

Comprehensive user list with:
- **User Details**: Full name, email, registration date
- **Role & Status**: Current role and account status
- **Action Buttons**: Contextual actions based on user state
- **Status Icons**: Visual indicators for quick status identification

## User Management Actions

### User Approval Workflow

**For Pending Users**:
1. **View Details**: Review user information and registration date
2. **Approve User**: 
   - Changes status from `pending_approval` → `active`
   - Changes role from `pending` → `user`
   - Records approval timestamp and approving admin

```typescript
const approveUser = async (userId: string) => {
  await updateUser(userId, {
    status: 'active',
    role: 'user'
  })
  // System automatically adds approved_by and approved_at
}
```

### Role Management

**Promote to Admin**:
- Available for active users with `user` role
- Grants full admin privileges
- Cannot be undone through UI (requires database access)

**Role Change Effects**:
```typescript
// User → Admin promotion
{
  role: 'user' → 'admin',
  // Status remains 'active'
  // Gains access to /admin dashboard
}
```

### User Status Control

**Suspend User**:
- Changes status from `active` → `suspended`
- User loses access to main features
- Redirected to pending approval page

**Reactivate User**:
- Changes status from `suspended` → `active`
- Restores full access to approved features

```typescript
// Suspension effects
const suspendUser = async (userId: string) => {
  await updateUser(userId, { status: 'suspended' })
  // User immediately loses access on next request
}
```

## API Endpoints

### User List (`GET /api/admin/users`)

Returns all users for admin management:

```typescript
export async function GET() {
  // Verify admin access
  const { user, profile } = await authenticateAdmin(request)
  
  // Fetch all users
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  return NextResponse.json({ users })
}
```

### User Updates (`PATCH /api/admin/users`)

Handles user role and status changes:

```typescript
export async function PATCH(request: NextRequest) {
  const { userId, role, status } = await request.json()
  
  // Verify admin access
  await authenticateAdmin(request)
  
  // Prevent self-modification
  if (userId === adminUser.id) {
    return NextResponse.json({ error: 'Cannot modify own role/status' }, { status: 403 })
  }
  
  // Build update data
  const updateData = { role, status }
  if (status === 'active') {
    updateData.approved_by = adminUser.id
    updateData.approved_at = new Date().toISOString()
  }
  
  // Update user
  const { data: updatedUser } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()
  
  return NextResponse.json({ user: updatedUser })
}
```

## Dashboard Components

### Statistics Cards

```typescript
const StatsCards = ({ users }: { users: UserProfile[] }) => {
  const pendingCount = users.filter(u => u.status === 'pending_approval').length
  const activeCount = users.filter(u => u.status === 'active').length
  const suspendedCount = users.filter(u => u.status === 'suspended').length
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard title="Total Users" value={users.length} icon={Users} />
      <StatCard title="Pending Approval" value={pendingCount} icon={Clock} color="yellow" />
      <StatCard title="Active Users" value={activeCount} icon={CheckCircle} color="green" />
      <StatCard title="Suspended" value={suspendedCount} icon={XCircle} color="red" />
    </div>
  )
}
```

### User Management Table

```typescript
const UserTable = ({ users, onUpdate }: UserTableProps) => {
  return (
    <div className="space-y-4">
      {users.map(user => (
        <UserRow 
          key={user.id}
          user={user}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}

const UserRow = ({ user, onUpdate }: UserRowProps) => {
  const isCurrentUser = user.id === currentUser?.id
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <UserDetails user={user} />
      <UserActions 
        user={user}
        disabled={isCurrentUser}
        onUpdate={onUpdate}
      />
    </div>
  )
}
```

### Action Buttons

Contextual buttons based on user state:

```typescript
const UserActions = ({ user, onUpdate }: UserActionsProps) => {
  if (user.status === 'pending_approval') {
    return (
      <Button onClick={() => onUpdate(user.id, { status: 'active', role: 'user' })}>
        <UserCheck className="h-4 w-4 mr-2" />
        Approve
      </Button>
    )
  }
  
  if (user.status === 'active') {
    return (
      <div className="flex gap-2">
        {user.role !== 'admin' && (
          <Button 
            onClick={() => onUpdate(user.id, { role: 'admin' })}
            variant="outline"
          >
            <Crown className="h-4 w-4 mr-2" />
            Make Admin
          </Button>
        )}
        <Button 
          onClick={() => onUpdate(user.id, { status: 'suspended' })}
          variant="destructive"
        >
          <UserX className="h-4 w-4 mr-2" />
          Suspend
        </Button>
      </div>
    )
  }
  
  if (user.status === 'suspended') {
    return (
      <Button onClick={() => onUpdate(user.id, { status: 'active' })}>
        <UserCheck className="h-4 w-4 mr-2" />
        Reactivate
      </Button>
    )
  }
}
```

## Security Considerations

### Authorization Checks

Multiple layers of security:

```typescript
// 1. Route-level protection (middleware)
if (pathname.startsWith('/admin') && !isAdmin) {
  return NextResponse.redirect(new URL('/pending-approval', request.url))
}

// 2. Component-level protection
const { isAdmin } = useAuth()
if (!isAdmin) return <AccessDenied />

// 3. API-level protection
const adminCheck = async (request: NextRequest) => {
  const { user, profile } = await getAuthenticatedUser(request)
  
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    throw new Error('Admin access required')
  }
}
```

### Self-Modification Prevention

Admins cannot modify their own account:

```typescript
// Frontend prevention
const isCurrentUser = user.id === currentAdmin.id
if (isCurrentUser) {
  return <span className="text-muted-foreground">You</span>
}

// Backend prevention
if (userId === adminUserId) {
  return NextResponse.json(
    { error: 'Cannot modify your own role or status' }, 
    { status: 403 }
  )
}
```

### Audit Trail

All admin actions are logged:

```typescript
const logAdminAction = async (action: string, targetUserId: string, changes: any) => {
  await supabase.from('admin_audit_log').insert({
    admin_id: adminUser.id,
    action,
    target_user_id: targetUserId,
    changes: JSON.stringify(changes),
    timestamp: new Date().toISOString()
  })
}
```

## Dashboard States

### Loading States

```typescript
const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  
  if (loading) {
    return <LoadingSkeleton />
  }
  
  return (
    <Dashboard 
      users={users}
      updating={updatingUser}
      onUpdate={handleUserUpdate}
    />
  )
}
```

### Error Handling

```typescript
const handleUserUpdate = async (userId: string, updates: UserUpdates) => {
  setUpdatingUser(userId)
  
  try {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
    
    // Refresh user list
    await fetchUsers()
    
  } catch (error) {
    console.error('Update failed:', error)
    showErrorMessage(error.message)
    
  } finally {
    setUpdatingUser(null)
  }
}
```

### Real-time Updates

Optional real-time user status updates:

```typescript
// WebSocket or Server-Sent Events for real-time updates
const useRealtimeUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  
  useEffect(() => {
    const subscription = supabase
      .channel('user_profiles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          // Update local state with real-time changes
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])
  
  return users
}
```

## Usage Analytics

### User Activity Tracking

Monitor user engagement:

```typescript
interface UserAnalytics {
  lastLogin: Date
  chatMessageCount: number
  documentsUploaded: number
  accountAge: number // days since registration
}
```

### System Health Metrics

Track system performance:

```typescript
const getSystemMetrics = async () => {
  return {
    activeUsers: await getActiveUserCount(),
    dailySignups: await getDailySignupCount(),
    chatActivity: await getChatMessageCount(),
    uploadActivity: await getUploadCount(),
    errorRate: await getErrorRate()
  }
}
```

## Best Practices

### User Management Guidelines

1. **Regular Review**: Periodically review pending users
2. **Prompt Approval**: Don't leave users waiting unnecessarily  
3. **Clear Communication**: Inform users of approval status
4. **Role Assignment**: Only promote trusted users to admin
5. **Documentation**: Keep notes on user approval decisions

### Security Best Practices

1. **Minimal Privilege**: Grant least necessary permissions
2. **Regular Audits**: Review admin actions periodically
3. **Secure Sessions**: Implement proper session management
4. **Backup Access**: Ensure multiple admin accounts exist
5. **Change Monitoring**: Log all administrative changes

### Performance Optimization

1. **Pagination**: Implement pagination for large user lists
2. **Caching**: Cache user data for better performance  
3. **Lazy Loading**: Load user details on demand
4. **Batch Operations**: Support bulk user operations
5. **Real-time Limits**: Rate limit real-time updates

## Troubleshooting

### Common Issues

**Admin cannot access dashboard**:
- Verify user role is `admin` and status is `active`
- Check middleware and route protection logic
- Review API authentication flow

**User updates not working**:
- Check admin permissions on API endpoints
- Verify user ID and update payload format
- Review server logs for detailed errors

**Statistics not updating**:
- Check if user list refresh is working
- Verify statistics calculation logic
- Consider caching issues

### Debug Tools

```typescript
// Debug admin access
const debugAdminAccess = (user: User, profile: UserProfile) => {
  console.log('Admin Access Check:', {
    userId: user.id,
    role: profile?.role,
    status: profile?.status,
    isAdmin: profile?.role === 'admin' && profile?.status === 'active'
  })
}

// Debug user updates
const debugUserUpdate = async (userId: string, updates: any) => {
  console.log('User Update:', { userId, updates })
  
  const result = await updateUser(userId, updates)
  console.log('Update Result:', result)
}
```