import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Plus, Search, Users, ArrowUpDown } from 'lucide-react';
import { ClientCard } from '@/components/clients/ClientCard';
import { CreateClientModal } from '@/components/clients/CreateClientModal';
import { getClients } from '@/lib/supabase';
import { Client } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export const ClientsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    status: '',
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  const fetchClients = async () => {
    try {
      const data = await getClients(filters);
      setClients(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des clients');
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClients();
  }, [filters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === 'all' ? '' : value
    }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-orbitron text-star-white tracking-tight">Clients</h1>
          <p className="text-moon-gray">
            Gérez vos clients et leurs informations
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-nebula-purple hover:bg-nebula-purple/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </div>

      <Card className="bg-deep-space border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="font-orbitron text-star-white">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-moon-gray" />
              <Input
                placeholder="Rechercher un client..."
                value={filters.searchQuery}
                onChange={handleSearch}
                className="pl-9 bg-space-black border-white/10 focus:border-nebula-purple"
              />
            </div>
            <Select 
              value={filters.status} 
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[180px] bg-space-black border-white/10 focus:border-nebula-purple">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent className="bg-deep-space border-white/10">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="prospect">Prospects</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="archived">Archivés</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/10 hover:border-nebula-purple">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Trier par
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-deep-space border-white/10">
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  Nom {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('created_at')}>
                  Date de création {filters.sortBy === 'created_at' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('status')}>
                  Statut {filters.sortBy === 'status' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
        </div>
      ) : clients.length === 0 ? (
        <Card className="bg-deep-space border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-moon-gray mb-4" />
            <p className="text-lg font-orbitron text-star-white mb-2">
              Aucun client à l'horizon
            </p>
            <p className="text-moon-gray text-sm text-center">
              {filters.searchQuery || filters.status
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter votre premier client'}
            </p>
            {!filters.searchQuery && !filters.status && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 bg-nebula-purple hover:bg-nebula-purple/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter votre premier client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-moon-gray text-sm">
            {clients.length} client{clients.length > 1 ? 's' : ''} trouvé{clients.length > 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClientUpdated={fetchClients}
              />
            ))}
          </div>
        </>
      )}

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClientCreated={fetchClients}
      />
    </div>
  );
}; 