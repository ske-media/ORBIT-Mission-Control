import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, Globe, Clock, Tag, Users } from 'lucide-react';
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

import { createOrganization, Organization } from '@/lib/supabase';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationCreated: () => void;
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onOrganizationCreated,
}) => {
  console.log('Modal props:', { isOpen, onClose, onOrganizationCreated });
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    company_size: '',
    company_address: '',
    company_website: '',
    primary_language: 'FR' as 'FR' | 'EN',
    timezone: 'Europe/Paris',
    status: 'prospect' as Organization['status'],
    acquisition_source: '',
    tags: [] as string[],
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form:', formData);
    setLoading(true);

    try {
      const result = await createOrganization(formData);
      console.log('Organization created:', result);
      onOrganizationCreated();
      toast.success('Organisation créée avec succès !');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Erreur lors de la création de l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Rendering modal');
  return (
    <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-deep-space rounded-xl w-full max-w-2xl border border-white/10 shadow-xl my-8"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-orbitron text-star-white">Nouvelle Organisation</h2>
          <p className="text-sm text-moon-gray mt-1">Créez une nouvelle organisation dans votre CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron text-star-white mb-4">Informations de base</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Nom de l'organisation
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Acme Corp"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Secteur d'activité
                </label>
                <Input
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="ex: Technologie"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Nombre d'employés
                </label>
                <Input
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleInputChange}
                  placeholder="ex: 50"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-star-white focus:outline-none focus:border-nebula-purple disabled:opacity-50"
                >
                  <option value="prospect">Prospect</option>
                  <option value="active">Client actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="lost">Perdu</option>
                </select>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron text-star-white mb-4">Localisation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Adresse
                </label>
                <Input
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleInputChange}
                  placeholder="ex: 123 rue de la Paix"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Site web
                </label>
                <Input
                  name="company_website"
                  type="url"
                  value={formData.company_website}
                  onChange={handleInputChange}
                  placeholder="ex: https://www.example.com"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Paramètres */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron text-star-white mb-4">Paramètres</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Langue principale
                </label>
                <Select
                  value={formData.primary_language}
                  onValueChange={(value: 'FR' | 'EN') => setFormData(prev => ({ ...prev, primary_language: value }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">Français</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Fuseau horaire
                </label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fuseau horaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                    <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Source d'acquisition
                </label>
                <Input
                  name="acquisition_source"
                  value={formData.acquisition_source}
                  onChange={handleInputChange}
                  placeholder="ex: LinkedIn, Bouche à oreille..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron text-star-white mb-4">Informations supplémentaires</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Tags
                </label>
                <Input
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                    setFormData(prev => ({ ...prev, tags }));
                  }}
                  placeholder="ex: tech, startup, finance (séparés par des virgules)"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-moon-gray mb-1.5">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Informations complémentaires..."
                disabled={loading}
                className="w-full h-32 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-star-white placeholder-moon-gray/50 focus:outline-none focus:border-nebula-purple disabled:opacity-50"
              />
            </div>
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
              'Créer l\'organisation'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}; 