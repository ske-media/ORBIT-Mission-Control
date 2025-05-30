import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Textarea from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getClient, updateClient } from '@/lib/supabase';
import { Client } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = React.useState<Client | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Client>>({});

  const fetchClient = async () => {
    if (!id) return;
    try {
      const data = await getClient(id);
      setClient(data);
      setFormData(data);
    } catch (error) {
      toast.error('Erreur lors du chargement du client');
      console.error('Error fetching client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClient();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: 'prospect' | 'active' | 'inactive' | 'archived') => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await updateClient(id, formData);
      toast.success('Client mis à jour avec succès');
      setIsEditing(false);
      fetchClient();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du client');
      console.error('Error updating client:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-orbitron text-star-white mb-4">Client non trouvé</h1>
          <Button onClick={() => navigate('/clients')} className="bg-nebula-purple hover:bg-nebula-purple/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="hover:bg-space-black text-star-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-orbitron text-star-white">
              {isEditing ? 'Modifier le client' : client.name}
            </h1>
            <p className="text-moon-gray">
              {isEditing ? 'Modifiez les informations du client' : 'Détails du client'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(client);
                }}
                className="text-star-white hover:bg-space-black"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white"
              >
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white"
            >
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-deep-space border-white/10">
          <CardHeader>
            <CardTitle className="font-orbitron text-star-white">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-moon-gray">Nom de l'entreprise</Label>
              {isEditing ? (
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
                />
              ) : (
                <p className="text-star-white">{client.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-moon-gray">Statut</Label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent className="bg-deep-space border-white/10">
                    <SelectItem value="prospect" className="text-star-white">Prospect</SelectItem>
                    <SelectItem value="active" className="text-star-white">Actif</SelectItem>
                    <SelectItem value="inactive" className="text-star-white">Inactif</SelectItem>
                    <SelectItem value="archived" className="text-star-white">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getStatusColor(client.status)}>
                  {client.status === 'active' && 'Actif'}
                  {client.status === 'prospect' && 'Prospect'}
                  {client.status === 'inactive' && 'Inactif'}
                  {client.status === 'archived' && 'Archivé'}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-moon-gray">Industrie</Label>
              {isEditing ? (
                <Input
                  id="industry"
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleInputChange}
                  className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
                />
              ) : (
                <p className="text-star-white">{client.industry || 'Non spécifié'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-deep-space border-white/10">
          <CardHeader>
            <CardTitle className="font-orbitron text-star-white">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contact_person_name" className="text-moon-gray">Nom du contact</Label>
              {isEditing ? (
                <Input
                  id="contact_person_name"
                  name="contact_person_name"
                  value={formData.contact_person_name || ''}
                  onChange={handleInputChange}
                  className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
                />
              ) : (
                <p className="text-star-white">{client.contact_person_name || 'Non spécifié'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_email" className="text-moon-gray">Email</Label>
              {isEditing ? (
                <Input
                  id="contact_person_email"
                  name="contact_person_email"
                  type="email"
                  value={formData.contact_person_email || ''}
                  onChange={handleInputChange}
                  className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
                />
              ) : (
                <p className="text-star-white">{client.contact_person_email || 'Non spécifié'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_phone" className="text-moon-gray">Téléphone</Label>
              {isEditing ? (
                <Input
                  id="contact_person_phone"
                  name="contact_person_phone"
                  value={formData.contact_person_phone || ''}
                  onChange={handleInputChange}
                  className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
                />
              ) : (
                <p className="text-star-white">{client.contact_person_phone || 'Non spécifié'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-deep-space border-white/10">
          <CardHeader>
            <CardTitle className="font-orbitron text-star-white">Adresse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="company_address" className="text-moon-gray">Adresse</Label>
              {isEditing ? (
                <Textarea
                  id="company_address"
                  name="company_address"
                  value={formData.company_address || ''}
                  onChange={handleInputChange}
                  className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
                />
              ) : (
                <p className="text-star-white whitespace-pre-line">
                  {client.company_address || 'Non spécifiée'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-deep-space border-white/10">
          <CardHeader>
            <CardTitle className="font-orbitron text-star-white">Site web</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="company_website" className="text-moon-gray">URL</Label>
              {isEditing ? (
                <Input
                  id="company_website"
                  name="company_website"
                  value={formData.company_website || ''}
                  onChange={handleInputChange}
                  className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
                />
              ) : (
                <p className="text-star-white">
                  {client.company_website ? (
                    <a
                      href={client.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nebula-purple hover:underline"
                    >
                      {client.company_website}
                    </a>
                  ) : (
                    'Non spécifié'
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

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