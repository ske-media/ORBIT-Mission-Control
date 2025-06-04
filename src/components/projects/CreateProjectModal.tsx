import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Textarea from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { toast } from 'sonner';
import { createOrganizationProject, OrganizationProject } from '@/lib/supabase';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onProjectCreated: (project: OrganizationProject) => void;
}

interface ProjectFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  amount: string;
  currency: 'EUR' | 'USD';
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onProjectCreated,
}) => {
  const [formData, setFormData] = React.useState<ProjectFormData>({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'planned',
    amount: '',
    currency: 'EUR',
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
      const project: Omit<OrganizationProject, 'id' | 'created_at' | 'updated_at'> = {
        organization_id: organizationId,
        title: formData.title,
        description: formData.description,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
        status: formData.status,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
      };

      const newProject = await createOrganizationProject(project);
      toast.success('Projet créé avec succès');
      onProjectCreated(newProject);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erreur lors de la création du projet');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'planned',
      amount: '',
      currency: 'EUR',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-deep-space border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-deep-space z-10 pb-4">
          <DialogTitle className="text-star-white">Nouveau projet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-star-white">
                Date de début *
              </Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-star-white">
                Date de fin
              </Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>
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
                <SelectItem value="planned">En planification</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-star-white">
                Montant *
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                required
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-star-white">
                Devise
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange('currency', value)}
              >
                <SelectTrigger className="bg-space-black border-white/10 text-star-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-space border-white/10">
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white">
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal; 