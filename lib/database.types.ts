export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'pending' | 'user' | 'admin';
  status: 'pending_approval' | 'active' | 'suspended';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface CreateUserProfileRequest {
  email: string;
  full_name: string;
  user_id: string;
}

export interface UpdateUserProfileRequest {
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended';
}