import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated: () => void;
  organizationId?: string;
}

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  onContactCreated,
  organizationId,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    organization_id: organizationId || '',
    preferred_language: 'FR' as 'FR' | 'EN',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement contact creation with Supabase
      onContactCreated();
      toast.success('Contact créé avec succès !');
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Erreur lors de la création du contact');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-deep-space rounded-xl w-full max-w-2xl border border-white/10 shadow-xl my-8"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-orbitron text-star-white">Nouveau Contact</h2>
          <p className="text-sm text-moon-gray mt-1">Ajoutez un nouveau contact à votre CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-star-white mb-1">
                Prénom *
              </label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full bg-deep-space border-white/10 focus:border-nebula-purple text-star-white"
                placeholder="Ex: Jean"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-star-white mb-1">
                Nom *
              </label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full bg-deep-space border-white/10 focus:border-nebula-purple text-star-white"
                placeholder="Ex: Dupont"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-star-white mb-1">
                Email *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-deep-space border-white/10 focus:border-nebula-purple text-star-white"
                placeholder="Ex: jean.dupont@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-star-white mb-1">
                Téléphone
              </label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-deep-space border-white/10 focus:border-nebula-purple text-star-white"
                placeholder="Ex: +33 6 12 34 56 78"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-star-white mb-1">
                Rôle
              </label>
              <Input
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full bg-deep-space border-white/10 focus:border-nebula-purple text-star-white"
                placeholder="Ex: Directeur Commercial"
              />
            </div>

            <div>
              <label htmlFor="preferred_language" className="block text-sm font-medium text-star-white mb-1">
                Langue préférée
              </label>
              <Select
                name="preferred_language"
                value={formData.preferred_language}
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_language: value as 'FR' | 'EN' }))}
              >
                <SelectTrigger className="w-full bg-deep-space border-white/10 focus:border-nebula-purple text-star-white">
                  <SelectValue placeholder="Sélectionnez une langue" />
                </SelectTrigger>
                <SelectContent className="bg-deep-space border-white/10 text-star-white">
                  <SelectItem value="FR" className="hover:bg-white/5">Français</SelectItem>
                  <SelectItem value="EN" className="hover:bg-white/5">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-star-white mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full h-24 bg-deep-space border border-white/10 rounded-lg p-3 text-star-white focus:border-nebula-purple focus:outline-none resize-none"
              placeholder="Ajoutez des notes sur ce contact..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 hover:bg-white/5"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-nebula-purple hover:bg-nebula-purple/90"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Créer le contact'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}; 