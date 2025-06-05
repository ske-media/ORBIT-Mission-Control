import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Building2, Users, Calendar, Tag, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

import { getOrganizations, Organization } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CreateOrganizationModal } from '@/components/organizations/CreateOrganizationModal';

const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Organization['status'] | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowCreateModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizations();
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Erreur lors du chargement des organisations');
      setError(error instanceof Error ? error.message : 'Impossible de charger les organisations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrganizations = useMemo(() => {
    if (!Array.isArray(organizations)) return [];

    return organizations.filter((org) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = Boolean(
        (org.name && org.name.toLowerCase().includes(searchLower)) ||
        (org.industry && org.industry.toLowerCase().includes(searchLower))
      );

      const matchesStatus = statusFilter === 'all' || (org.status && org.status === statusFilter);
      const matchesIndustry = industryFilter === 'all' || (org.industry && org.industry === industryFilter);

      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [organizations, searchQuery, statusFilter, industryFilter]);

  const handleOrganizationClick = (organization: Organization) => {
    navigate(`/organizations/${organization.id}`);
  };

  const handleCreateClick = useCallback(() => {
    console.log('Create button clicked');
    setShowCreateModal(true);
  }, []);

  if (loading && organizations.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="p-4 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-lg gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchOrganizations}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Organisations</h1>
          <p className="text-moon-gray">Gérez vos clients et prospects</p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCreateClick}
            className="bg-nebula-purple text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-nebula-purple/90"
          >
            <Plus size={16} />
            Nouvelle organisation
          </button>
          <button
            type="button"
            onClick={() => alert('Test')}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Test
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-moon-gray" />
          <Input
            type="text"
            placeholder="Rechercher une organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-deep-space border-white/10 focus:border-nebula-purple text-star-white w-full"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-deep-space border-white/10 focus:border-nebula-purple text-star-white">
            <Filter className="h-4 w-4 mr-2 text-moon-gray" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="bg-deep-space border-white/10 text-star-white">
            <SelectItem value="all" className="hover:bg-white/5">Tous les statuts</SelectItem>
            <SelectItem value="prospect" className="hover:bg-white/5">Prospect</SelectItem>
            <SelectItem value="active" className="hover:bg-white/5">Client actif</SelectItem>
            <SelectItem value="inactive" className="hover:bg-white/5">Client inactif</SelectItem>
            <SelectItem value="lost" className="hover:bg-white/5">Perdu</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={industryFilter}
          onValueChange={setIndustryFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-deep-space border-white/10 focus:border-nebula-purple text-star-white">
            <Building2 className="h-4 w-4 mr-2 text-moon-gray" />
            <SelectValue placeholder="Secteur d'activité" />
          </SelectTrigger>
          <SelectContent className="bg-deep-space border-white/10 text-star-white">
            <SelectItem value="all" className="hover:bg-white/5">Tous les secteurs</SelectItem>
            <SelectItem value="tech" className="hover:bg-white/5">Technologie</SelectItem>
            <SelectItem value="retail" className="hover:bg-white/5">Commerce</SelectItem>
            <SelectItem value="services" className="hover:bg-white/5">Services</SelectItem>
            <SelectItem value="manufacturing" className="hover:bg-white/5">Industrie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organizations List */}
      {!loading && filteredOrganizations.length === 0 ? (
        <div className="text-center py-12 bg-deep-space rounded-xl border border-white/10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5 }}
          >
            <Building2 size={48} className="mx-auto text-moon-gray/50 mb-4" />
            <h3 className="text-lg font-orbitron text-star-white mb-1">
              {searchQuery || statusFilter !== 'all' || industryFilter !== 'all' 
                ? "Aucune organisation ne correspond à vos filtres." 
                : "Aucune organisation pour le moment."}
            </h3>
            <p className="text-sm text-moon-gray">
              {searchQuery || statusFilter !== 'all' || industryFilter !== 'all' 
                ? "Essayez d'ajuster vos critères de recherche ou de filtrage." 
                : "Créez une nouvelle organisation pour commencer !"}
            </p>
            {!(searchQuery || statusFilter !== 'all' || industryFilter !== 'all') && (
              <Button
                className="mt-6"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} className="mr-2" />
                Créer une Organisation
              </Button>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-deep-space rounded-xl border border-white/10 p-6 hover:border-nebula-purple/50 transition-colors cursor-pointer"
              onClick={() => handleOrganizationClick(org)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-orbitron text-star-white mb-1">{org.name}</h3>
                  <p className="text-sm text-moon-gray">{org.industry}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  org.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  org.status === 'prospect' ? 'bg-blue-500/20 text-blue-400' :
                  org.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {org.status === 'active' ? 'Client actif' :
                   org.status === 'prospect' ? 'Prospect' :
                   org.status === 'inactive' ? 'Inactif' : 'Perdu'}
                </div>
              </div>
              
              <div className="space-y-3">
                {org.company_website && (
                  <div className="flex items-center text-sm text-moon-gray">
                    <Globe size={14} className="mr-2" />
                    <a href={org.company_website} target="_blank" rel="noopener noreferrer" 
                       className="hover:text-nebula-purple transition-colors"
                       onClick={(e) => e.stopPropagation()}>
                      {org.company_website}
                    </a>
                  </div>
                )}
                
                {org.company_address && (
                  <div className="flex items-center text-sm text-moon-gray">
                    <Building2 size={14} className="mr-2" />
                    {org.company_address}
                  </div>
                )}

                {org.company_size && (
                  <div className="flex items-center text-sm text-moon-gray">
                    <Users size={14} className="mr-2" />
                    {org.company_size} employés
                  </div>
                )}
              </div>

              {org.tags && org.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {org.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/5 rounded text-xs text-moon-gray"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrganizationCreated={() => {
          setShowCreateModal(false);
          fetchOrganizations();
          toast.success('Organisation créée avec succès !');
        }}
      />
    </div>
  );
};

export default OrganizationsPage; 