# Role System

The application implements a comprehensive role-based access control (RBAC) system with three distinct roles and status levels.

## Role Types

### 1. Pending (`pending`)
- **Default role** for new user signups
- **Status**: `pending_approval` 
- **Access**: Only `/pending-approval` page
- **Purpose**: New users awaiting admin approval

### 2. User (`user`) 
- **Standard role** for approved users
- **Status**: `active`
- **Access**: Chat, upload, and general features
- **Restrictions**: Cannot access admin dashboard

### 3. Admin (`admin`)
- **Elevated role** for administrators  
- **Status**: `active`
- **Access**: Full system access including admin dashboard
- **Capabilities**: User management, role assignment, system oversight

## Status Types

### 1. Pending Approval (`pending_approval`)
- New users waiting for admin approval
- Redirected to `/pending-approval` page
- Cannot access main application features

### 2. Active (`active`) 
- Approved users with full access to assigned features
- Can use chat, upload, and role-appropriate features

### 3. Suspended (`suspended`)
- Users temporarily blocked by admin
- Treated same as `pending_approval` 
- Redirected to `/pending-approval` with suspended status message

## Access Control Matrix

| Role/Status | Home | Auth | Chat | Upload | Admin | Pending |
|-------------|------|------|------|--------|--------|---------|
| `pending/pending_approval` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `user/active` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `admin/active` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `*/suspended` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

## Implementation

### Route Protection

The `middleware.ts` enforces access control:

```typescript
// Check user status and redirect accordingly
if (!isApproved && !pendingRoutes.includes(pathname)) {
  return NextResponse.redirect(new URL('/pending-approval', request.url))
}

// Admin-only routes
if (pathname.startsWith('/admin') && !isAdmin) {
  return NextResponse.redirect(new URL('/pending-approval', request.url))
}
```

### API Authorization

All API endpoints verify user permissions:

```typescript
// Check if user is admin
const { data: adminProfile } = await supabase
  .from('user_profiles')
  .select('role, status')
  .eq('id', user.id)
  .single()

if (!adminProfile || adminProfile.role !== 'admin' || adminProfile.status !== 'active') {
  return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
}
```

### Frontend Components

Components use role-based rendering:

```typescript
const { isAdmin, isApproved } = useAuth()

// Show admin features only to admins
{isAdmin && (
  <Button onClick={() => router.push('/admin')}>
    Admin Dashboard
  </Button>
)}

// Show upload only to approved users
{isApproved && (
  <UploadComponent />
)}
```

## User Management Workflow

### New User Approval

1. **User signs up** → Role: `pending`, Status: `pending_approval`
2. **User waits** → Shown `/pending-approval` page with instructions
3. **Admin reviews** → Views user in `/admin` dashboard
4. **Admin approves** → Clicks "Approve" button
5. **System updates** → Role: `user`, Status: `active`, approved_at: timestamp
6. **User gains access** → Can now use chat and upload features

### Role Promotion

Admins can promote users to admin:

```typescript
// API call to promote user
await updateUser(userId, { role: 'admin' })
```

**Effects:**
- User gains access to `/admin` dashboard
- Can approve/manage other users
- Can suspend/reactivate users
- Cannot modify their own role (safety measure)

### User Suspension

Admins can suspend problematic users:

```typescript
// API call to suspend user  
await updateUser(userId, { status: 'suspended' })
```

**Effects:**
- User loses access to main features
- Redirected to `/pending-approval` 
- Status shows as "SUSPENDED"
- Can be reactivated by admin

## Database Schema

### User Profiles Table

```sql
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('pending', 'user', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);
```

### Row Level Security

```sql
-- Allow authenticated users to read profiles (authorization in API)
CREATE POLICY "Authenticated read access" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to update profiles (authorization in API)
CREATE POLICY "Authenticated update access" ON user_profiles
    FOR UPDATE USING (auth.uid() IS NOT NULL);
```

## Testing Role System

### Test Scenarios

Create test users with different roles:

```sql
-- Create pending user
UPDATE user_profiles 
SET role = 'pending', status = 'pending_approval' 
WHERE email = 'pending@example.com';

-- Create active user  
UPDATE user_profiles 
SET role = 'user', status = 'active'
WHERE email = 'user@example.com';

-- Create suspended user
UPDATE user_profiles 
SET role = 'user', status = 'suspended'
WHERE email = 'suspended@example.com';

-- Create admin user
UPDATE user_profiles 
SET role = 'admin', status = 'active', approved_at = NOW()
WHERE email = 'admin@example.com';
```

### Expected Behaviors

1. **Pending user**: 
   - Login → Redirect to `/pending-approval`
   - Cannot access `/chat` or `/upload`

2. **Active user**:
   - Login → Redirect to `/chat`
   - Can access chat and upload features
   - Cannot access `/admin`

3. **Suspended user**:
   - Login → Redirect to `/pending-approval` 
   - Status shows "SUSPENDED"
   - No access to main features

4. **Admin user**:
   - Login → Full access to all features
   - Can access `/admin` dashboard
   - Can manage other users

## Security Considerations

### Role Assignment Protection

- Users cannot modify their own roles
- Only admins can change user roles/status
- API endpoints verify admin status server-side
- Database constraints prevent invalid role values

### Audit Trail

The system tracks approval actions:

```sql
-- Approval metadata
approved_by UUID REFERENCES auth.users(id),
approved_at TIMESTAMP WITH TIME ZONE
```

### Session Management

- Role changes require new login to take effect
- Middleware re-evaluates permissions on each request
- Context provider refreshes profile data automatically

## Extending the Role System

### Adding New Roles

1. **Update database constraints**:
   ```sql
   ALTER TABLE user_profiles 
   DROP CONSTRAINT user_profiles_role_check;
   
   ALTER TABLE user_profiles 
   ADD CONSTRAINT user_profiles_role_check 
   CHECK (role IN ('pending', 'user', 'admin', 'moderator'));
   ```

2. **Update TypeScript types**:
   ```typescript
   role: 'pending' | 'user' | 'admin' | 'moderator'
   ```

3. **Extend middleware logic**:
   ```typescript
   const isModerator = profile?.role === 'moderator' && profile?.status === 'active'
   ```

### Custom Permissions

Consider implementing granular permissions:

```sql
CREATE TABLE role_permissions (
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    PRIMARY KEY (role, permission)
);

INSERT INTO role_permissions VALUES 
    ('admin', 'user_management'),
    ('admin', 'system_settings'),
    ('moderator', 'content_moderation'),
    ('user', 'chat_access'),
    ('user', 'upload_access');
```