import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tag, Calendar, DollarSign } from 'lucide-react';
import { OrganizationProject } from '@/lib/supabase';

interface ProjectsListProps {
  projects: OrganizationProject[];
  onProjectClick?: (project: OrganizationProject) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ projects, onProjectClick }) => {
  const getStatusColor = (status: OrganizationProject['status']) => {
    switch (status) {
      case 'planned':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-500';
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status: OrganizationProject['status']) => {
    switch (status) {
      case 'planned':
        return 'En planification';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="bg-deep-space border-white/10 hover:border-nebula-purple/50 transition-colors cursor-pointer"
          onClick={() => onProjectClick?.(project)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-star-white">{project.title}</CardTitle>
              <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <p className="text-moon-gray line-clamp-2">{project.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-moon-gray">
                <Calendar size={14} />
                <span>
                  {new Date(project.start_date).toLocaleDateString()} - 
                  {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'En cours'}
                </span>
              </div>
              <div className="flex items-center text-moon-gray">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>
                  {project.amount} {project.currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 