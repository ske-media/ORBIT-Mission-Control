import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tag, Calendar, DollarSign, Star } from 'lucide-react';
import { OrganizationProject } from '@/lib/supabase';

interface ProjectDetailProps {
  project: OrganizationProject;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project }) => {
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
    <div className="space-y-6">
      <Card className="bg-deep-space border-white/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-orbitron text-star-white">{project.title}</CardTitle>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.description && (
            <div>
              <h3 className="text-moon-gray text-sm mb-2">Description</h3>
              <p className="text-star-white whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-space-black border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-moon-gray text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-moon-gray">
                    <Calendar size={14} />
                    <span>
                      {new Date(project.start_date).toLocaleDateString()} - 
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'En cours'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-moon-gray">
                    <DollarSign size={14} />
                    <span>{project.amount} {project.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-space-black border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-moon-gray text-sm flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Montant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-star-white text-xl">
                  {project.amount} {project.currency}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 