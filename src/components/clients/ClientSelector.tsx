import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getClients } from '@/lib/supabase';
import { Client } from '@/lib/supabase';
import { toast } from 'sonner';

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string | null) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ value, onChange }) => {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients({ status: 'active' });
        setClients(data);
      } catch (error) {
        toast.error('Erreur lors du chargement des clients');
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Chargement des clients..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value || ''} onValueChange={(newValue) => onChange(newValue || null)}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner un client" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Aucun client</SelectItem>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 