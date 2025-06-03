import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Textarea from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from 'sonner';
import { createContact, Contact } from '@/lib/supabase';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onContactCreated: () => void;
}

interface ContactFormData {
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  preferred_channel: 'email' | 'phone' | 'whatsapp' | 'sms';
  language: 'FR' | 'EN';
  calendly_link: string;
  notes: string;
  is_primary: boolean;
}

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onContactCreated,
}) => {
  const [formData, setFormData] = React.useState<ContactFormData>({
    first_name: '',
    last_name: '',
    role: '',
    email: '',
    phone: '',
    preferred_channel: 'email',
    language: 'FR',
    calendly_link: '',
    notes: '',
    is_primary: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_primary: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const contact: Omit<Contact, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        preferred_channel: formData.preferred_channel,
        language: formData.language,
        calendly_link: formData.calendly_link,
        notes: formData.notes,
        is_primary: formData.is_primary,
      };

      await createContact(organizationId, contact);
      toast.success('Contact créé avec succès');
      onContactCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Erreur lors de la création du contact');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      role: '',
      email: '',
      phone: '',
      preferred_channel: 'email',
      language: 'FR',
      calendly_link: '',
      notes: '',
      is_primary: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-deep-space border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-deep-space z-10 pb-4">
          <DialogTitle className="text-star-white">Ajouter un contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-star-white">
                Prénom *
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-star-white">
                Nom *
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-star-white">
              Poste
            </Label>
            <Input
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="bg-space-black border-white/10 text-star-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-star-white">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-star-white">
                Téléphone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-space-black border-white/10 text-star-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_channel" className="text-star-white">
                Canal de communication préféré
              </Label>
              <Select
                value={formData.preferred_channel}
                onValueChange={(value) => handleSelectChange('preferred_channel', value)}
              >
                <SelectTrigger className="bg-space-black border-white/10 text-star-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-space border-white/10">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Téléphone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-star-white">
                Langue
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) => handleSelectChange('language', value)}
              >
                <SelectTrigger className="bg-space-black border-white/10 text-star-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-space border-white/10">
                  <SelectItem value="FR">Français</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendly_link" className="text-star-white">
              Lien Calendly
            </Label>
            <Input
              id="calendly_link"
              name="calendly_link"
              type="url"
              value={formData.calendly_link}
              onChange={handleInputChange}
              className="bg-space-black border-white/10 text-star-white"
            />
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={handleCheckboxChange}
              className="border-white/10"
            />
            <Label htmlFor="is_primary" className="text-star-white">
              Contact principal
            </Label>
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