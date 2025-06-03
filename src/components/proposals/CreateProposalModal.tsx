import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Textarea from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { toast } from 'sonner';
import { createProposal, Proposal } from '@/lib/supabase';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onProposalCreated: () => void;
}

interface ProposalFormData {
  title: string;
  amount: string;
  currency: 'EUR' | 'USD';
  status: Proposal['status'];
  sent_date: string;
  response_date: string;
  notes: string;
}

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onProposalCreated,
}) => {
  const [formData, setFormData] = React.useState<ProposalFormData>({
    title: '',
    amount: '',
    currency: 'EUR',
    status: 'draft',
    sent_date: '',
    response_date: '',
    notes: '',
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
      const proposal: Omit<Proposal, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        status: formData.status,
        sent_date: formData.sent_date ? new Date(formData.sent_date).toISOString() : null,
        response_date: formData.response_date ? new Date(formData.response_date).toISOString() : null,
        notes: formData.notes,
      };

      await createProposal(proposal);
      toast.success('Proposition créée avec succès');
      onProposalCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Erreur lors de la création de la proposition');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      currency: 'EUR',
      status: 'draft',
      sent_date: '',
      response_date: '',
      notes: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-deep-space border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-deep-space z-10 pb-4">
          <DialogTitle className="text-star-white">Nouvelle proposition</DialogTitle>
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
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="accepted">Acceptée</SelectItem>
                <SelectItem value="rejected">Refusée</SelectItem>
                <SelectItem value="expired">Expirée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sent_date" className="text-star-white">
                Date d'envoi
              </Label>
              <Input
                id="sent_date"
                name="sent_date"
                type="date"
                value={formData.sent_date}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="response_date" className="text-star-white">
                Date de réponse
              </Label>
              <Input
                id="response_date"
                name="response_date"
                type="date"
                value={formData.response_date}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-star-white">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="bg-space-black border-white/10 text-star-white"
            />
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