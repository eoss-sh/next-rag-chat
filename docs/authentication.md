# Authentication System

The RAG Chat application uses Supabase Auth for secure user authentication with support for email/password and Google OAuth.

## Overview

The authentication system provides:
- **Email/Password Authentication**: Traditional signup/login flow
- **Google OAuth**: Single sign-on with Google accounts  
- **Secure Session Management**: JWT tokens with automatic refresh
- **Protected Routes**: Middleware-based route protection
- **Profile Management**: Automatic user profile creation

## Setup

### 1. Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Google OAuth Setup (Optional)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 3. Database Schema

Run the provided `supabase-schema.sql` in your Supabase SQL editor to create:
- User profiles table with roles and status
- Row Level Security (RLS) policies  
- Automatic profile creation trigger
- Admin management functions

## Authentication Flow

### New User Registration

1. **Signup** (`/auth/signup`):
   - User enters email, password, and full name
   - OR clicks "Continue with Google"

2. **Profile Creation**:
   - Database trigger automatically creates user profile
   - Default role: `pending`
   - Default status: `pending_approval`

3. **Pending Approval**:
   - User redirected to `/pending-approval`
   - Must wait for admin approval to access main features

4. **Admin Approval**:
   - Admin reviews new users in `/admin` dashboard
   - Admin clicks "Approve" to grant access
   - User role changed to `user`, status to `active`

### Existing User Login

1. **Login** (`/auth/login`):
   - Enter credentials or use Google OAuth
   - Automatic session creation

2. **Route Protection**:
   - Middleware checks authentication status
   - Redirects based on user role/status:
     - `pending_approval` → `/pending-approval`
     - `active` users → `/chat`
     - `admin` users → full access

## API Endpoints

### Profile Management

- **GET** `/api/profile` - Get current user profile
- **POST** `/api/profile` - Create user profile (signup only)

### Admin User Management  

- **GET** `/api/admin/users` - List all users (admin only)
- **PATCH** `/api/admin/users` - Update user role/status (admin only)

## Components

### AuthContext

Central authentication state management:

```typescript
const { user, profile, loading, signIn, signUp, signOut } = useAuth()
```

**Key Properties:**
- `user`: Supabase auth user object
- `profile`: User profile with role/status
- `isAdmin`: Computed boolean for admin access
- `isApproved`: Computed boolean for active users

### Route Protection

The `middleware.ts` handles automatic redirects:

```typescript
// Public routes (no auth required)
['/auth/login', '/auth/signup', '/auth/callback', '/']

// Protected routes (require authentication)  
['/chat', '/upload', '/admin']
```

## Creating Your First Admin

After setting up the database, create your first admin user:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO user_profiles (id, email, full_name, role, status, approved_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    'admin' as role,
    'active' as status,
    NOW() as approved_at
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    status = 'active',
    approved_at = NOW();
```

## Security Features

### Row Level Security (RLS)

Database policies ensure:
- Users can only access their own profile data
- Admins have read access to all profiles
- Profile updates require proper authorization

### Session Management

- Automatic token refresh
- Secure cookie storage
- Server-side session validation

### CSRF Protection

- Built-in CSRF protection via Supabase
- Secure API route authentication
- Request validation on sensitive operations

## Troubleshooting

### Common Issues

1. **"User not found"**: Check if user profile was created automatically
2. **"Access denied"**: Verify user status is `active` not `pending_approval`
3. **Google OAuth errors**: Check redirect URLs and OAuth configuration
4. **Infinite recursion**: Ensure RLS policies don't create circular dependencies

### Debug Authentication

```typescript
// Check current auth state
const { user, profile } = useAuth()
console.log('User:', user)
console.log('Profile:', profile)
```

### Reset User Status

```sql
-- Reset user to pending approval
UPDATE user_profiles 
SET status = 'pending_approval', role = 'pending'
WHERE email = 'user@example.com';
```