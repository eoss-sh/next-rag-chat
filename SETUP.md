# User Role System Setup Guide

## Overview

This application implements a comprehensive user role system with admin approval. Users must be approved by an administrator before they can access chat and upload features.

## User Roles

- **Pending**: New users waiting for approval (cannot access app features)
- **User**: Approved users with chat access
- **Admin**: Full access including user management and upload permissions

## Setup Instructions

### 1. Database Setup

Run the SQL commands in `supabase-schema.sql` in your Supabase SQL editor to create:
- `user_profiles` table with role and status management
- Row Level Security (RLS) policies
- Automatic profile creation trigger
- Admin management policies

### 2. Create Your First Admin

After creating your account, run this SQL command in Supabase (replace with your email):

```sql
INSERT INTO user_profiles (id, email, full_name, role, status, approved_at)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'admin', 'active', NOW()
FROM auth.users 
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  status = 'active',
  approved_at = NOW();
```

### 3. User Flow

1. **New User Signup**: 
   - User signs up → Profile created with `role: 'pending'` and `status: 'pending_approval'`
   - User redirected to `/pending-approval` page

2. **Admin Approval**:
   - Admin visits `/admin` dashboard
   - Reviews pending users and approves/rejects
   - Approved users get `status: 'active'` and `role: 'user'`

3. **User Access**:
   - Approved users can access `/chat`, `/upload`, `/search`
   - Pending users see approval waiting page
   - Admins have full access + user management

## API Endpoints

- `GET /api/profile` - Get current user's profile
- `POST /api/profile` - Create user profile (auto-called on signup)
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users` - Update user role/status (admin only)

## Route Protection

The middleware (`middleware.ts`) handles automatic redirects:
- Unauthenticated → `/auth/login`
- Pending approval → `/pending-approval`
- Approved users → `/chat`
- Admin only routes → `/admin`

## Features

- ✅ Automatic profile creation on signup
- ✅ Admin approval workflow
- ✅ Role-based navigation
- ✅ Route protection with redirects
- ✅ User status management (active/suspended)
- ✅ Admin dashboard for user management
- ✅ Real-time profile updates