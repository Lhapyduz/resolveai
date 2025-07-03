import { ReactNode } from 'react';

export enum UserType {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum Page {
  ONBOARDING = 'ONBOARDING', // Also acts as a Login/Signup entry
  CLIENT_HOME = 'CLIENT_HOME',
  PROFESSIONAL_DASHBOARD = 'PROFESSIONAL_DASHBOARD',
  PROFESSIONAL_PROFILE_VIEW = 'PROFESSIONAL_PROFILE_VIEW',
  SERVICE_DETAIL = 'SERVICE_DETAIL',
  CONTRACT_FLOW = 'CONTRACT_FLOW',
  PROFILE_EDIT = 'PROFILE_EDIT',
  HISTORY = 'HISTORY',
  NOTIFICATIONS = 'NOTIFICATIONS',
}

export interface UserProfile {
  id: string; // Typically UUID from Supabase
  user_id: string; // Links to auth.users.id
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  phone?: string;
  userType: UserType;
  created_at?: string; // Supabase adds this
  updated_at?: string; // Supabase might add this
}

export interface Category {
  id: string; // UUID
  name: string;
  icon_name?: string; // Store icon name, resolve to component in frontend
  icon?: ReactNode; // Resolved icon component
  created_at?: string;
}

export enum ServicePricingType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
}

export interface Service {
  id: string; // UUID
  professionalId: string; // FK to profiles.id
  title: string;
  description: string;
  categoryId: string; // FK to categories.id
  category?: Category; // For joining/display
  price: number;
  pricingType: ServicePricingType;
  tags: string[]; // Supabase array type
  images?: string[]; // URLs or Supabase storage paths
  durationEstimate?: string;
  created_at?: string;
}

export interface Professional extends UserProfile {
  userType: UserType.PROFESSIONAL; // Ensure type is correctly set
  specializations: string[]; // Supabase array type
  services?: Service[]; // Fetched separately or joined
  status: 'Available' | 'Busy' | 'Away';
  portfolio?: { title: string; imageUrl: string; description?: string }[]; // Could be JSONB or separate table
  avgRating?: number; // Calculated or stored
  reviews?: Review[]; // Fetched separately or joined
}

export interface Review {
  id: string; // UUID
  clientId: string; // FK to profiles.id (of client)
  clientName?: string; // Denormalized or fetched
  clientAvatar?: string; // Denormalized or fetched
  professionalId: string; // FK to profiles.id (of professional)
  serviceId: string; // FK to services.id
  rating: number; // 1-5
  comment: string;
  createdAt: string; // Supabase timestamp
  emojis?: string[]; // Supabase array type
}

export enum ContractStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

export interface Contract {
  id: string; // UUID
  clientId: string; // FK to profiles.id
  professionalId: string; // FK to profiles.id
  serviceId: string; // FK to services.id
  serviceTitle?: string; // Denormalized
  priceAgreed: number;
  status: ContractStatus;
  createdAt: string; // Supabase timestamp
  updatedAt: string; // Supabase timestamp
  chatMessages?: ChatMessage[]; // Could be JSONB or separate table
}

export interface ChatMessage {
  id: string; // UUID
  contractId?: string; // FK to contracts.id
  senderId: string; // FK to profiles.id
  text: string;
  timestamp: string; // Supabase timestamp
}

export interface AppNotification {
  id: string; // UUID
  userId: string; // FK to profiles.id
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // Supabase timestamp
  linkTo?: { page: Page; params?: Record<string, string> }; // JSONB for quick actions
}