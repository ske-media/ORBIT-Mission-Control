import { useState } from 'react';
import { Organization } from '../lib/supabase';

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export default function OrganizationForm({ organization, onSubmit, onCancel }: OrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    sector: organization?.sector || '',
    size: organization?.size || '',
    address: organization?.address || '',
    website: organization?.website || '',
    mainLanguage: organization?.mainLanguage || 'FR',
    timezone: organization?.timezone || '',
    status: organization?.status || 'prospect',
    acquisitionSource: organization?.acquisitionSource || '',
    tags: organization?.tags || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nom de l'organisation
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
          Secteur d'activité
        </label>
        <input
          type="text"
          id="sector"
          value={formData.sector}
          onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="size" className="block text-sm font-medium text-gray-700">
          Taille
        </label>
        <select
          id="size"
          value={formData.size}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="">Sélectionner...</option>
          <option value="1-10">1-10 employés</option>
          <option value="11-50">11-50 employés</option>
          <option value="51-200">51-200 employés</option>
          <option value="201-500">201-500 employés</option>
          <option value="501+">501+ employés</option>
        </select>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Adresse
        </label>
        <input
          type="text"
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Site web
        </label>
        <input
          type="url"
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="mainLanguage" className="block text-sm font-medium text-gray-700">
          Langue principale
        </label>
        <select
          id="mainLanguage"
          value={formData.mainLanguage}
          onChange={(e) => setFormData({ ...formData, mainLanguage: e.target.value as 'FR' | 'EN' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="FR">Français</option>
          <option value="EN">Anglais</option>
        </select>
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
          Fuseau horaire
        </label>
        <input
          type="text"
          id="timezone"
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Statut
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as Organization['status'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="prospect">Prospect</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="lost">Perdu</option>
        </select>
      </div>

      <div>
        <label htmlFor="acquisitionSource" className="block text-sm font-medium text-gray-700">
          Source d'acquisition
        </label>
        <input
          type="text"
          id="acquisitionSource"
          value={formData.acquisitionSource}
          onChange={(e) => setFormData({ ...formData, acquisitionSource: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {organization ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
} 