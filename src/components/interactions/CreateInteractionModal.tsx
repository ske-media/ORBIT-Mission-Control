import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Textarea from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { toast } from 'sonner';
import { createInteraction, Interaction } from '@/lib/supabase';

interface CreateInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  contactId?: string;
  onInteractionCreated: () => void;
}

interface InteractionFormData {
  type: Interaction['type'];
  date: string;
  title: string;
  description: string;
  location: string;
  status: Interaction['status'];
}

export const CreateInteractionModal: React.FC<CreateInteractionModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  contactId,
  onInteractionCreated,
}) => {
  const [formData, setFormData] = React.useState<InteractionFormData>({
    type: 'meeting',
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    location: '',
    status: 'scheduled',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const interaction: Omit<Interaction, 'id' | 'organization_id' | 'contact_id' | 'created_at' | 'updated_at'> = {
        type: formData.type,
        date: new Date(formData.date).toISOString(),
        title: formData.title,
        description: formData.description,
        location: formData.location,
        status: formData.status,
      };

      await createInteraction(organizationId, contactId, interaction);
      toast.success('Interaction créée avec succès');
      onInteractionCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating interaction:', error);
      toast.error('Erreur lors de la création de l\'interaction');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'meeting',
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      location: '',
      status: 'scheduled',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-deep-space border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-deep-space z-10 pb-4">
          <DialogTitle className="text-star-white">Ajouter une interaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-star-white">
                Type d'interaction
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger className="bg-space-black border-white/10 text-star-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-space border-white/10">
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="call">Appel</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-star-white">
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-star-white">
              Titre *
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="bg-space-black border-white/10 text-star-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-star-white">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="bg-space-black border-white/10 text-star-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-star-white">
              Lieu
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="bg-space-black border-white/10 text-star-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-star-white">
              Statut
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger className="bg-space-black border-white/10 text-star-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-deep-space border-white/10">
                <SelectItem value="scheduled">Planifiée</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
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
            <Button type="submit" className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white">
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 