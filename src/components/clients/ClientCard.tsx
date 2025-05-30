import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { MoreVertical, Building2, Mail, Phone, Calendar, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Client } from '@/lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { updateClient } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface ClientCardProps {
  client: Client;
  onClientUpdated: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-success/20 text-green-success border-green-success';
    case 'prospect':
      return 'bg-yellow-warning/20 text-yellow-warning border-yellow-warning';
    case 'inactive':
      return 'bg-moon-gray/20 text-moon-gray border-moon-gray';
    case 'archived':
      return 'bg-red-alert/20 text-red-alert border-red-alert';
    default:
      return 'bg-moon-gray/20 text-moon-gray border-moon-gray';
  }
};

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClientUpdated }) => {
  const navigate = useNavigate();

  const handleStatusChange = async (newStatus: 'prospect' | 'active' | 'inactive' | 'archived') => {
    try {
      await updateClient(client.id, { status: newStatus });
      toast.success(`Statut du client mis à jour`);
      onClientUpdated();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
      console.error('Error updating client status:', error);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Empêcher la navigation si on clique sur le menu déroulant
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) {
      return;
    }
    navigate(`/clients/${client.id}`);
  };

  return (
    <Card 
      className="bg-deep-space border-white/10 hover:border-nebula-purple/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-orbitron text-star-white text-lg">
          {client.name}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-space-black"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-moon-gray" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-deep-space border-white/10">
            <DropdownMenuItem onClick={() => handleStatusChange('active')}>
              Marquer comme actif
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('inactive')}>
              Marquer comme inactif
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
              Archiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge className={getStatusColor(client.status)}>
            {client.status === 'active' && 'Actif'}
            {client.status === 'prospect' && 'Prospect'}
            {client.status === 'inactive' && 'Inactif'}
            {client.status === 'archived' && 'Archivé'}
          </Badge>
          {client.industry && (
            <Badge variant="outline" className="border-white/10 text-moon-gray">
              {client.industry}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {client.contact_person_email && (
            <div className="flex items-center text-moon-gray">
              <Mail className="mr-2 h-4 w-4" />
              {client.contact_person_email}
            </div>
          )}
          {client.contact_person_phone && (
            <div className="flex items-center text-moon-gray">
              <Phone className="mr-2 h-4 w-4" />
              {client.contact_person_phone}
            </div>
          )}
          {client.company_address && (
            <div className="flex items-center text-moon-gray">
              <Building2 className="mr-2 h-4 w-4" />
              {client.company_address}
            </div>
          )}
          {client.assigned_to_user_id && (
            <div className="flex items-center text-moon-gray">
              <User className="mr-2 h-4 w-4" />
              {client.assigned_to_user_id}
            </div>
          )}
          <div className="flex items-center text-moon-gray">
            <Calendar className="mr-2 h-4 w-4" />
            Créé le {format(new Date(client.created_at), 'dd MMMM yyyy', { locale: fr })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 