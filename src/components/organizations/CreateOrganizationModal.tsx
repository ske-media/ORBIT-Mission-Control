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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: {
      employee_count: '',
      revenue: '',
    },
    location: {
      address: '',
      city: '',
      country: '',
    },
    website: '',
    primary_language: 'FR' as 'FR' | 'EN',
    timezone: 'Europe/Paris',
    status: 'prospect' as Organization['status'],
    acquisition_source: '',
    tags: [] as string[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentObj = prev[parent as keyof typeof prev] as Record<string, string>;
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value,
          },
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertir les champs numériques
      const dataToSubmit = {
        ...formData,
        size: {
          employee_count: formData.size.employee_count ? parseInt(formData.size.employee_count) : undefined,
          revenue: formData.size.revenue ? parseInt(formData.size.revenue) : undefined,
        },
      };

      await createOrganization(dataToSubmit);
      onOrganizationCreated();
      toast.success('Organisation créée avec succès !');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Erreur lors de la création de l\'organisation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-space-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-deep-space rounded-xl w-full max-w-2xl border border-white/10 shadow-xl"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-orbitron text-star-white">Nouvelle organisation</h2>
            <button
              onClick={onClose}
              className="text-moon-gray hover:text-star-white transition-colors"
              disabled={loading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-orbitron text-star-white mb-4">Informations générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Nom de l'organisation <span className="text-red-alert">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Acme Corp"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Secteur d'activité <span className="text-red-alert">*</span>
                </label>
                <Input
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="ex: Technologie"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Nombre d'employés
                </label>
                <Input
                  name="size.employee_count"
                  type="number"
                  value={formData.size.employee_count}
                  onChange={handleInputChange}
                  placeholder="ex: 50"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Chiffre d'affaires (€)
                </label>
                <Input
                  name="size.revenue"
                  type="number"
                  value={formData.size.revenue}
                  onChange={handleInputChange}
                  placeholder="ex: 1000000"
                  disabled={loading}
                />
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
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="ex: 123 rue de la Paix"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Ville
                </label>
                <Input
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleInputChange}
                  placeholder="ex: Paris"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Pays
                </label>
                <Input
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleInputChange}
                  placeholder="ex: France"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-moon-gray mb-1.5">
                  Site web
                </label>
                <Input
                  name="website"
                  type="url"
                  value={formData.website}
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
                  Statut
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Organization['status'] }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Client actif</SelectItem>
                    <SelectItem value="inactive">Client inactif</SelectItem>
                    <SelectItem value="lost">Perdu</SelectItem>
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
                  placeholder="ex: Réseaux sociaux"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.industry}
            >
              {loading ? 'Création...' : 'Créer l\'organisation'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}; 