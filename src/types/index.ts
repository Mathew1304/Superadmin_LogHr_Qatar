export interface Company {
  id: string;
  company_name: string; // Changed from 'name' to match DB
  email: string;
  phone: string | null;
  subscription_plan: string | null; // This might be a join result, actual DB has organization_subscriptions
  subscription_status: string | null;
  created_at: string;
  status: 'active' | 'suspended' | 'pending'; // Added this based on usage
  employee_count?: number; // Added for display
  subscription_details?: {
    plan_name: string;
    status: string;
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string | null;
  key: string;
  category: string;
  is_active: boolean;
}

export interface CompanyFeature {
  id: string;
  organization_id: string;
  feature_id: string;
  is_enabled: boolean;
  feature?: Feature;
}

export interface UserProfile {
  user_id: string; // Changed from 'id' to match DB typical structure or usage
  email: string;
  full_name: string | null;
  role: string;
  organization_id: string | null;
}

export interface ErrorLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  organization_name: string | null;
  error_message: string;
  error_stack: string | null;
  error_type: string;
  page_url: string | null;
  user_agent: string | null;
  severity: 'error' | 'warning' | 'critical';
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string | null;
  created_at: string;
  metadata: any;
}

export interface SupportTicket {
  id: string;
  organization_id: string;
  ticket_number: string;
  title: string;
  description: string;
  category_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  created_by: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  organization?: {
    company_name: string;
  };
  creator?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
  };
}
