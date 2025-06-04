export interface Organization {
  id: string;
  name: string;
  sector: string;
  size: string;
  address?: string;
  website?: string;
  mainLanguage: 'FR' | 'EN';
  timezone: string;
  status: 'prospect' | 'active' | 'inactive' | 'lost';
  acquisitionSource?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  email: string;
  phone?: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp';
  language?: string;
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
} 