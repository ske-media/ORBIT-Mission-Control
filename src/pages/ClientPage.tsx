import { useState } from 'react';
import { Search, Plus, Building2, Users, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/DropdownMenu';
import { getUnreadNotificationsCount } from '../lib/supabase-helpers';

interface Organization {
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

interface Contact {
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

export default function ClientPage() {
  const [activeTab, setActiveTab] = useState<'organizations' | 'contacts'>('organizations');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // TODO: Implement data fetching with Supabase
  const organizations: Organization[] = [];
  const contacts: Contact[] = [];

  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === 'all' || org.status === statusFilter)
  );

  const filteredContacts = contacts.filter(contact =>
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-star-white">Gestion des Clients</h1>
        <Button 
          onClick={() => {/* TODO: Implement add new */}}
          className="bg-nebula-purple hover:bg-nebula-purple/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'organizations' ? 'Nouvelle Organisation' : 'Nouveau Contact'}
        </Button>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('organizations')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === 'organizations'
              ? 'bg-deep-space text-star-white'
              : 'text-moon-gray hover:bg-deep-space/50'
          }`}
        >
          <Building2 className="w-5 h-5 mr-2" />
          Organisations
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeTab === 'contacts'
              ? 'bg-deep-space text-star-white'
              : 'text-moon-gray hover:bg-deep-space/50'
          }`}
        >
          <Users className="w-5 h-5 mr-2" />
          Contacts
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-moon-gray" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 bg-deep-space border-nebula-purple text-star-white"
            />
          </div>
        </div>
        {activeTab === 'organizations' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-deep-space border-nebula-purple text-star-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="lost">Perdu</SelectItem>
            </SelectContent>
          </Select>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-deep-space border-nebula-purple text-star-white">
              <Filter className="w-4 h-4 mr-2" />
              Trier par
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('name')}>Nom</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('created_at')}>Date de création</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('status')}>Statut</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'organizations' ? (
          filteredOrganizations.map((org) => (
            <Card key={org.id} className="bg-deep-space border-nebula-purple">
              <CardHeader>
                <CardTitle className="text-star-white">{org.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-moon-gray">Secteur: {org.sector}</p>
                <p className="text-moon-gray">Taille: {org.size}</p>
                <p className="text-moon-gray">Statut: {org.status}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredContacts.map((contact) => (
            <Card key={contact.id} className="bg-deep-space border-nebula-purple">
              <CardHeader>
                <CardTitle className="text-star-white">
                  {contact.firstName} {contact.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-moon-gray">Rôle: {contact.role}</p>
                <p className="text-moon-gray">Email: {contact.email}</p>
                <p className="text-moon-gray">Téléphone: {contact.phone}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 