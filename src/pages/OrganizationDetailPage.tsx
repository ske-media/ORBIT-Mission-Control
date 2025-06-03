import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Plus, Mail, Phone, Globe, MapPin, Clock, Tag, Calendar } from 'lucide-react';
import {
  getOrganization,
  getContacts,
  getInteractions,
  getProposals,
  getOrganizationProjects,
  Organization,
  Contact,
  Interaction,
  Proposal,
  OrganizationProject,
} from '@/lib/supabase';

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [interactions, setInteractions] = React.useState<Interaction[]>([]);
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [projects, setProjects] = React.useState<OrganizationProject[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchOrganizationData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [orgData, contactsData, interactionsData, proposalsData, projectsData] = await Promise.all([
        getOrganization(id),
        getContacts(id),
        getInteractions(id),
        getProposals(id),
        getOrganizationProjects(id),
      ]);

      setOrganization(orgData);
      setContacts(contactsData);
      setInteractions(interactionsData);
      setProposals(proposalsData);
      setProjects(projectsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      console.error('Error fetching organization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrganizationData();
  }, [id]);

  const getStatusColor = (status: Organization['status']) => {
    switch (status) {
      case 'prospect':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'active':
        return 'bg-green-500/20 text-green-500';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-500';
      case 'archived':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status: Organization['status']) => {
    switch (status) {
      case 'prospect':
        return 'Prospect';
      case 'active':
        return 'Client actif';
      case 'inactive':
        return 'Client inactif';
      case 'archived':
        return 'Client archivé';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div className="text-center text-moon-gray">Chargement...</div>;
  }

  if (!organization) {
    return <div className="text-center text-moon-gray">Organisation non trouvée</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-orbitron text-star-white mb-2">{organization.name}</h1>
            <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(organization.status)}`}>
              {getStatusLabel(organization.status)}
            </span>
          </div>
          <Button
            onClick={() => navigate('/organizations')}
            variant="ghost"
            className="text-star-white hover:bg-space-black"
          >
            Retour à la liste
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-deep-space border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-moon-gray text-sm">Secteur d'activité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-star-white">{organization.industry}</p>
            </CardContent>
          </Card>

          {organization.company_size && (
            <Card className="bg-deep-space border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-moon-gray text-sm">Taille</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-star-white">{organization.company_size}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-deep-space border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-moon-gray text-sm">Langue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-star-white">{organization.primary_language === 'FR' ? 'Français' : 'English'}</p>
            </CardContent>
          </Card>

          <Card className="bg-deep-space border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-moon-gray text-sm">Fuseau horaire</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-star-white">{organization.timezone}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {organization.company_address && (
            <Card className="bg-deep-space border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-moon-gray text-sm flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-star-white">{organization.company_address}</p>
              </CardContent>
            </Card>
          )}

          {organization.company_website && (
            <Card className="bg-deep-space border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-moon-gray text-sm flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Site web
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={organization.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nebula-purple hover:underline"
                >
                  {organization.company_website}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {organization.notes && (
          <Card className="bg-deep-space border-white/10 mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-moon-gray text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-star-white whitespace-pre-wrap">{organization.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="bg-deep-space border-white/10">
          <TabsTrigger value="contacts" className="text-star-white data-[state=active]:bg-nebula-purple">
            Contacts
          </TabsTrigger>
          <TabsTrigger value="interactions" className="text-star-white data-[state=active]:bg-nebula-purple">
            Interactions
          </TabsTrigger>
          <TabsTrigger value="proposals" className="text-star-white data-[state=active]:bg-nebula-purple">
            Propositions
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-star-white data-[state=active]:bg-nebula-purple">
            Projets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {/* TODO: Ouvrir modal d'ajout de contact */}}
              className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un contact
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className="bg-deep-space border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-star-white">
                    {contact.first_name} {contact.last_name}
                    {contact.is_primary && (
                      <span className="ml-2 text-xs bg-nebula-purple/20 text-nebula-purple px-2 py-1 rounded-full">
                        Principal
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contact.role && <p className="text-moon-gray">{contact.role}</p>}
                  {contact.email && (
                    <div className="flex items-center text-moon-gray">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${contact.email}`} className="hover:text-nebula-purple">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center text-moon-gray">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${contact.phone}`} className="hover:text-nebula-purple">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.calendly_link && (
                    <div className="flex items-center text-moon-gray">
                      <Clock className="h-4 w-4 mr-2" />
                      <a
                        href={contact.calendly_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-nebula-purple"
                      >
                        Calendly
                      </a>
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-moon-gray text-sm mt-2">{contact.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {/* TODO: Ouvrir modal d'ajout d'interaction */}}
              className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une interaction
            </Button>
          </div>

          <div className="space-y-4">
            {interactions.map((interaction) => (
              <Card key={interaction.id} className="bg-deep-space border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-star-white">{interaction.title}</CardTitle>
                    <span className="text-sm text-moon-gray">
                      {new Date(interaction.date).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-moon-gray mb-2">
                    <Tag className="h-4 w-4 mr-2" />
                    {interaction.type}
                  </div>
                  {interaction.description && (
                    <p className="text-star-white">{interaction.description}</p>
                  )}
                  {interaction.location && (
                    <p className="text-moon-gray mt-2">{interaction.location}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {/* TODO: Ouvrir modal d'ajout de proposition */}}
              className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle proposition
            </Button>
          </div>

          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="bg-deep-space border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-star-white">{proposal.title}</CardTitle>
                    <span className="text-sm text-moon-gray">
                      {proposal.amount} {proposal.currency}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-moon-gray mb-2">
                    <Tag className="h-4 w-4 mr-2" />
                    {proposal.status}
                  </div>
                  {proposal.notes && (
                    <p className="text-star-white">{proposal.notes}</p>
                  )}
                  {proposal.sent_date && (
                    <p className="text-moon-gray mt-2">
                      Envoyée le {new Date(proposal.sent_date).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {/* TODO: Ouvrir modal d'ajout de projet */}}
              className="bg-nebula-purple hover:bg-nebula-purple/90 text-star-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>

          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="bg-deep-space border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-star-white">{project.title}</CardTitle>
                    <span className="text-sm text-moon-gray">
                      {project.amount} {project.currency}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-moon-gray mb-2">
                    <Tag className="h-4 w-4 mr-2" />
                    {project.status}
                  </div>
                  {project.description && (
                    <p className="text-star-white">{project.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-moon-gray">
                    <Calendar size={14} />
                    <span>
                      {new Date(project.start_date).toLocaleDateString()} - 
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'En cours'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 