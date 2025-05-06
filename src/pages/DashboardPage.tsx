// src/pages/DashboardPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Users,
  Activity as ActivityIcon, // Renommé pour éviter conflit
  Briefcase, // Pour projets actifs
  TrendingUp, // Pour activité générale
  AlertCircle as AlertCircleError, // Pour le message d'erreur
  RefreshCw // Pour le bouton rafraîchir
} from 'lucide-react';
import ProjectCard from '../components/projects/ProjectCard';
import Button from '../components/ui/Button';
import { supabase, getProjects } from '../lib/supabase'; // getProjects pour la liste des projets
import { Database } from '../types/supabase';
// import { useAuth } from '../contexts/AuthContext'; // Pas utilisé activement pour l'instant

type Project = Database['public']['Tables']['projects']['Row'];
// Pas besoin de Ticket ici si on compte via Supabase

// Interface pour les statistiques du dashboard
interface DashboardStats {
  activeProjects: number;
  urgentTasks: number;
  completedTasks: number;
  totalTasks: number;
  upcomingDeadlines: number;
  // teamMembersCount: number; // On peut réintroduire si besoin d'une logique spécifique
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    urgentTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    upcomingDeadlines: 0,
    // teamMembersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("DashboardPage: Starting fetchData...");

    try {
      // 1. Récupérer les projets (RLS appliquée)
      // On a besoin des projets pour la liste ET pour calculer les deadlines proches
      const fetchedProjects = await getProjects(); // Utilise le helper qui throw en cas d'erreur
      setProjects(fetchedProjects || []);

      // 2. Récupérer les statistiques des tickets en parallèle
      // Note: Ces requêtes comptent sur TOUS les tickets auxquels l'utilisateur a accès
      // via les RLS sur la table 'tickets'.
      const [
        urgentCountResponse,
        completedCountResponse,
        totalCountResponse
      ] = await Promise.all([
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'high')
          .neq('status', 'done'),
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'done'),
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true }),
      ]);

      // Vérifier les erreurs des requêtes de comptage
      if (urgentCountResponse.error) throw urgentCountResponse.error;
      if (completedCountResponse.error) throw completedCountResponse.error;
      if (totalCountResponse.error) throw totalCountResponse.error;

      // Calcul des deadlines proches basé sur les projets récupérés
      const now = new Date();
      const upcomingDeadlinesCount = (fetchedProjects || []).filter(project => {
        if (!project.deadline) return false;
        const deadlineDate = new Date(project.deadline);
        const diffTime = deadlineDate.getTime() - now.getTime();
        if (diffTime <= 0) return false; // Passée
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; // Dans les 7 prochains jours
      }).length;

      setStats({
        activeProjects: (fetchedProjects || []).length,
        urgentTasks: urgentCountResponse.count || 0,
        completedTasks: completedCountResponse.count || 0,
        totalTasks: totalCountResponse.count || 0,
        upcomingDeadlines: upcomingDeadlinesCount,
      });

      console.log("DashboardPage: Data fetched successfully", { projects: fetchedProjects, stats });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.';
      setError(`Échec du chargement des données du tableau de bord: ${errorMessage}`);
      setProjects([]);
      setStats({ activeProjects: 0, urgentTasks: 0, completedTasks: 0, totalTasks: 0, upcomingDeadlines: 0 });
    } finally {
      setLoading(false);
      console.log("DashboardPage: fetchData finished.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-16 h-16 rounded-full border-4 border-nebula-purple/30 border-t-nebula-purple animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="p-6 inline-flex flex-col items-center bg-red-alert/10 text-red-alert border border-red-alert/20 rounded-xl shadow-lg gap-4">
          <AlertCircleError size={40} />
          <h3 className="text-xl font-orbitron">Erreur de Chargement</h3>
          <p className="text-sm max-w-md">{error}</p>
          <Button variant="primary" size="md" onClick={fetchData} iconLeft={<RefreshCw size={16}/>}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-orbitron text-star-white mb-1">Tableau de Bord</h1>
          <p className="text-moon-gray">Votre centre de contrôle galactique.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} iconLeft={<RefreshCw size={16}/>} disabled={loading} className="self-start sm:self-center">
          {loading ? 'Actualisation...' : 'Rafraîchir'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Projets Actifs', value: stats.activeProjects, icon: <Briefcase size={24} className="text-nebula-purple" />, bgColor: 'bg-nebula-purple/10', iconBg: 'bg-nebula-purple/20' },
          { title: 'Tâches Urgentes', value: stats.urgentTasks, icon: <AlertTriangle size={24} className="text-red-alert" />, bgColor: 'bg-red-alert/10', iconBg: 'bg-red-alert/20' },
          { title: 'Tâches Terminées', value: `${stats.completedTasks} / ${stats.totalTasks}`, icon: <CheckCircle size={24} className="text-green-success" />, bgColor: 'bg-green-success/10', iconBg: 'bg-green-success/20' },
          { title: 'Deadlines Proches', value: stats.upcomingDeadlines, icon: <Calendar size={24} className="text-yellow-warning" />, bgColor: 'bg-yellow-warning/10', iconBg: 'bg-yellow-warning/20' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            className={`p-6 rounded-xl border border-white/10 flex items-center gap-4 shadow-lg hover:shadow-xl transition-shadow ${stat.bgColor}`}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div className={`w-12 h-12 rounded-full ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-moon-gray text-sm">{stat.title}</p>
              <h3 className="text-2xl lg:text-3xl font-orbitron text-star-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Section Activité de la Semaine / Placeholder Radar */}
      <motion.div
        className="bg-deep-space p-6 rounded-xl border border-white/10 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-orbitron text-star-white">Activité Récente</h2>
          {/* Placeholder pour stats équipe - à réactiver si besoin
          <div className="flex items-center mt-2 sm:mt-0">
            <div className="w-8 h-8 rounded-full bg-nebula-purple/20 flex items-center justify-center">
              <Users size={16} className="text-nebula-purple" />
            </div>
            <span className="ml-2 text-moon-gray text-sm">X membres actifs</span>
          </div>
          */}
        </div>
        <div className="h-60 bg-space-black/30 rounded-lg flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10">
          <TrendingUp size={48} className="text-moon-gray/50 mb-4" />
          <h4 className="font-medium text-star-white/80">Graphique d'Activité</h4>
          <p className="text-xs text-moon-gray/70 mt-1">
            Un graphique d'activité (ex: radar, barres) sera affiché ici pour visualiser les tâches créées, complétées, etc. (Fonctionnalité à venir)
          </p>
        </div>
      </motion.div>

      {/* Liste des Projets en Cours */}
      <div>
        <h2 className="text-2xl font-orbitron text-star-white mb-6">Vos Projets</h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                custom={index + 4} // Pour un délai d'animation décalé
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-deep-space rounded-xl border border-white/10"
          >
            <Rocket size={48} className="mx-auto text-moon-gray/50 mb-4" />
            <h3 className="text-lg font-medium text-star-white mb-1">Aucun projet à afficher</h3>
            <p className="text-sm text-moon-gray">Créez votre premier projet pour commencer !</p>
            <Button variant="primary" size="md" className="mt-6" onClick={() => navigate('/projects')}>
              Voir tous les projets
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;