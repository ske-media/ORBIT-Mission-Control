import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
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
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const [formData, setFormData] = React.useState({
    name: '',
    status: 'prospect' as 'prospect' | 'active' | 'inactive' | 'archived',
    industry: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    company_address: '',
    company_website: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: 'prospect' | 'active' | 'inactive' | 'archived') => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClient(formData);
      toast.success('Client créé avec succès');
      onClientCreated();
      onClose();
      setFormData({
        name: '',
        status: 'prospect',
        industry: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        company_address: '',
        company_website: '',
      });
    } catch (error) {
      toast.error('Erreur lors de la création du client');
      console.error('Error creating client:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-deep-space border-white/10 text-star-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-deep-space z-10 pb-4">
          <DialogTitle className="font-orbitron text-star-white">Créer un nouveau client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-moon-gray">Nom de l'entreprise *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-moon-gray">Statut</Label>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-moon-gray">Industrie</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_name" className="text-moon-gray">Nom du contact</Label>
              <Input
                id="contact_person_name"
                name="contact_person_name"
                value={formData.contact_person_name}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_email" className="text-moon-gray">Email</Label>
              <Input
                id="contact_person_email"
                name="contact_person_email"
                type="email"
                value={formData.contact_person_email}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_phone" className="text-moon-gray">Téléphone</Label>
              <Input
                id="contact_person_phone"
                name="contact_person_phone"
                value={formData.contact_person_phone}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address" className="text-moon-gray">Adresse</Label>
              <Textarea
                id="company_address"
                name="company_address"
                value={formData.company_address}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website" className="text-moon-gray">Site web</Label>
              <Input
                id="company_website"
                name="company_website"
                value={formData.company_website}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 focus:border-nebula-purple text-star-white"
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-deep-space pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-star-white hover:bg-space-black"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white"
            >
              Créer le client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 