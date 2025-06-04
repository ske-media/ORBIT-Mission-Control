// src/pages/ProjectsPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
import { motion } from 'framer-motion';
import { Plus, Search, X, AlertCircle, ArchiveRestore, Filter, Calendar, Rocket } from 'lucide-react';
// ProjectCard n'est pas directement utilisé si ProjectsList l'est, mais gardons l'import au cas où
// import ProjectCard from '../components/projects/ProjectCard';
import Button from '@/components/ui/Button'; // Assurez-vous que cet import est correct (défaut vs nommé)
import Input from '@/components/ui/Input';   // Assurez-vous que cet import est correct
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'; // Assurez-vous que ces imports sont corrects

// Vos imports spécifiques
import { getOrganizationProjects, OrganizationProject, createProject as supabaseCreateProject, getOrganizations, Organization } from '@/lib/supabase';
// ^ Renommé createProject en supabaseCreateProject pour éviter confusion potentielle avec un autre createProject si vous en aviez un local.
// Si vous êtes sûr qu'il n'y a pas d'autre 'createProject', vous pouvez garder le nom original.
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/supabase'; // Assurez-vous que le chemin est correct
import ArchivedProjectsModal from '@/components/projects/ArchivedProjectsModal';
import CreateProjectModal from '@/components/projects/CreateProjectModal'; // Votre composant modal externe
import { ProjectsList } from '@/components/projects/ProjectsList';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Le type Project de Database n'est pas utilisé si vous utilisez OrganizationProject partout.
// type Project = Database['public']['Tables']['projects']['Row'];

// Type for the new project form data - Adaptez-le aux champs attendus par votre CreateProjectModal et supabaseCreateProject
type NewProjectDataForModal = { // Renommé pour clarifier que c'est pour la modale
  name: string;
  description: string;
  client_name?: string | null; // ou client_id si vous avez fait la transition CRM
  deadline?: string | null;
  is_public?: boolean;
  organization_id?: string; // Si votre CreateProjectModal ou supabaseCreateProject le nécessite
  status?: OrganizationProject['status']; // Si pertinent pour la création
  // Ajoutez d'autres champs que votre CreateProjectModal pourrait gérer
};

const ProjectsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<OrganizationProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrganizationProject['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les organisations
      const orgs = await getOrganizations();
      setOrganizations(orgs);

      // Récupérer tous les projets avec leurs organisations
      const { data, error } = await supabase
        .from('organization_projects')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
      setError(error instanceof Error ? error.message : 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Grouper les projets par organisation
  const projectsByOrganization = useMemo(() => {
    const grouped = organizations.reduce((acc, org) => {
      acc[org.id] = {
        organization: org,
        projects: projects.filter(p => p.organization_id === org.id)
      };
      return acc;
    }, {} as Record<string, { organization: Organization; projects: OrganizationProject[] }>);

    return grouped;
  }, [organizations, projects]);

  // Filtrer les projets
  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    return projects.filter((project) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = Boolean(
        (project.title && project.title.toLowerCase().includes(searchLower)) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      );

      const matchesStatus = statusFilter === 'all' || (project.status && project.status === statusFilter);

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        now.setHours(0,0,0,0);

        if (dateFilter === 'planned') {
          matchesDate = Boolean(project.start_date && new Date(project.start_date) > now);
        } else if (dateFilter === 'in_progress') {
          matchesDate = Boolean(
            project.start_date && 
            new Date(project.start_date) <= now && 
            (!project.end_date || new Date(project.end_date) > now)
          );
        } else if (dateFilter === 'completed') {
          matchesDate = Boolean(project.end_date && new Date(project.end_date) <= now);
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [projects, searchQuery, statusFilter, dateFilter]);

  // Filtrer les organisations qui ont des projets correspondant aux filtres
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const orgProjects = projectsByOrganization[org.id]?.projects || [];
      return orgProjects.some(project => 
        filteredProjects.some(fp => fp.id === project.id)
      );
    });
  }, [organizations, projectsByOrganization, filteredProjects]);

  const handleProjectClick = (project: OrganizationProject) => {
    navigate(`/organizations/${project.organization_id}/projects/${project.id}`);
  };

  // Cette fonction est appelée par le composant CreateProjectModal externe une fois le projet créé.
  const handleProjectCreatedInModal = useCallback((newProject: OrganizationProject) => {
    setShowCreateModal(false); // Ferme la modale
    fetchData(); // Rafraîchit la liste des projets
    toast.success('Projet créé avec succès !');
  }, [fetchData]);

  const handleProjectArchivedOrUnarchived = useCallback(() => {
    fetchData();
  }, [fetchData]);

  if (loading && projects.length === 0) {
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
          <AlertCircle size={32} />
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchData}>
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
          <h1 className="text-3xl font-orbitron text-star-white mb-2">Projets</h1>
          <p className="text-moon-gray">Gérez et suivez tous vos projets par organisation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchivedModal(true)}
            className="text-moon-gray hover:text-star-white"
          >
            <ArchiveRestore size={18} className="mr-2" />
            Projets Archivés
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} className="mr-2" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-moon-gray" />
          <Input
            type="text"
            placeholder="Rechercher un projet..."
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
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent className="bg-deep-space border-white/10 text-star-white">
            <SelectItem value="all" className="hover:bg-white/5">Tous les statuts</SelectItem>
            <SelectItem value="planned" className="hover:bg-white/5">En planification</SelectItem>
            <SelectItem value="in_progress" className="hover:bg-white/5">En cours</SelectItem>
            <SelectItem value="completed" className="hover:bg-white/5">Terminés</SelectItem>
            <SelectItem value="cancelled" className="hover:bg-white/5">Annulés</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value as typeof dateFilter)}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-deep-space border-white/10 focus:border-nebula-purple text-star-white">
            <Calendar className="h-4 w-4 mr-2 text-moon-gray" />
            <SelectValue placeholder="Filtrer par date" />
          </SelectTrigger>
          <SelectContent className="bg-deep-space border-white/10 text-star-white">
            <SelectItem value="all" className="hover:bg-white/5">Toutes les dates</SelectItem>
            <SelectItem value="planned" className="hover:bg-white/5">À venir</SelectItem>
            <SelectItem value="in_progress" className="hover:bg-white/5">En cours</SelectItem>
            <SelectItem value="completed" className="hover:bg-white/5">Terminés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {!loading && filteredOrganizations.length === 0 ? (
        <div className="text-center py-12 bg-deep-space rounded-xl border border-white/10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5 }}
          >
            <Rocket size={48} className="mx-auto text-moon-gray/50 mb-4" />
            <h3 className="text-lg font-orbitron text-star-white mb-1">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                ? "Aucun projet ne correspond à vos filtres." 
                : "Aucun projet pour le moment."}
            </h3>
            <p className="text-sm text-moon-gray">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                ? "Essayez d'ajuster vos critères de recherche ou de filtrage." 
                : "Créez un nouveau projet pour commencer !"}
            </p>
            {!(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                className="mt-6"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} className="mr-2" />
                Créer un Projet
              </Button>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredOrganizations.map(org => {
            const orgProjects = projectsByOrganization[org.id]?.projects || [];
            const filteredOrgProjects = orgProjects.filter(project => 
              filteredProjects.some(fp => fp.id === project.id)
            );

            if (filteredOrgProjects.length === 0) return null;

            return (
              <div key={org.id} className="bg-deep-space rounded-xl border border-white/10 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-orbitron text-star-white">{org.name}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/organizations/${org.id}`)}
                  >
                    Voir l'organisation
                  </Button>
                </div>
                <ProjectsList
                  projects={filteredOrgProjects}
                  onProjectClick={handleProjectClick}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Archived Projects Modal */}
      <ArchivedProjectsModal
        isOpen={showArchivedModal}
        onClose={() => setShowArchivedModal(false)}
        onProjectUnarchived={handleProjectArchivedOrUnarchived}
      />

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreatedInModal}
          organizationId="current"
        />
      )}
    </div>
  );
};

export default ProjectsPage;