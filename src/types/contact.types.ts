export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed';


export interface Contact {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export interface CreateContactDTO {
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
}

export interface UpdateContactDTO {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  status?: ContactStatus;
}

export interface ContactStats {
  total: number;
  new: number;
  in_progress: number;
  resolved: number;
  this_week: number;
}

export interface CreateDevisBody {
  company_name: string;
  email: string;
  telephone?: string;
  message: string;
}
