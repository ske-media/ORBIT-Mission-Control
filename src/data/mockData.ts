import { Project, Ticket, User, TicketPriority, TicketStatus, InboxItem } from '../types';

export const users: User[] = [
  {
    id: '1',
    name: 'Océane Durand',
    email: 'oceane@orbitmission.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Thomas Bernard',
    email: 'thomas@orbitmission.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
    role: 'collaborator'
  },
  {
    id: '3',
    name: 'Julie Martin',
    email: 'julie@orbitmission.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop',
    role: 'collaborator'
  },
  {
    id: '4',
    name: 'Alexandre Petit',
    email: 'alexandre@orbitmission.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop',
    role: 'collaborator'
  }
];

export const projects: Project[] = [
  {
    id: '1',
    name: 'Refonte du site Stellar Tech',
    description: 'Modernisation complète du site web avec nouvelles sections produits et blog',
    deadline: '2025-04-15',
    clientName: 'Stellar Tech',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z'
  },
  {
    id: '2',
    name: 'Campagne Lunaire',
    description: 'Campagne marketing sur les réseaux sociaux pour le lancement du produit Lunaire',
    deadline: '2025-02-28',
    clientName: 'Cosmétiques Eclipse',
    createdAt: '2025-01-05T09:30:00Z',
    updatedAt: '2025-01-06T14:20:00Z'
  },
  {
    id: '3',
    name: 'Application mobile Nova',
    description: 'Développement de l\'application mobile pour la startup Nova',
    deadline: '2025-05-20',
    clientName: 'Nova Innovations',
    createdAt: '2025-01-02T11:45:00Z',
    updatedAt: '2025-01-08T16:30:00Z'
  },
  {
    id: '4',
    name: 'Refonte identité visuelle Agence',
    description: 'Mise à jour de notre charte graphique et des supports de communication',
    deadline: '2025-03-10',
    clientName: 'Interne',
    createdAt: '2024-12-20T08:15:00Z',
    updatedAt: '2025-01-04T13:10:00Z'
  }
];

export const tickets: Ticket[] = [
  // Project 1: Refonte du site Stellar Tech
  {
    id: '101',
    title: 'Maquette desktop homepage',
    description: 'Créer la maquette desktop de la page d\'accueil du site',
    priority: TicketPriority.HIGH,
    status: TicketStatus.DONE,
    projectId: '1',
    assigneeId: '3',
    deadline: '2025-01-20',
    createdAt: '2025-01-10T10:30:00Z',
    updatedAt: '2025-01-18T09:45:00Z'
  },
  {
    id: '102',
    title: 'Maquette mobile homepage',
    description: 'Adapter la maquette desktop pour les mobiles',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    projectId: '1',
    assigneeId: '3',
    deadline: '2025-01-25',
    createdAt: '2025-01-10T10:35:00Z',
    updatedAt: '2025-01-15T14:20:00Z'
  },
  {
    id: '103',
    title: 'Développement frontend homepage',
    description: 'Intégrer en HTML/CSS/JS la homepage',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.TODO,
    projectId: '1',
    assigneeId: '2',
    deadline: '2025-02-05',
    createdAt: '2025-01-10T10:40:00Z',
    updatedAt: '2025-01-10T10:40:00Z'
  },
  {
    id: '104',
    title: 'Rédaction contenu pages produits',
    description: 'Rédiger les descriptions des 5 produits phares',
    priority: TicketPriority.LOW,
    status: TicketStatus.BACKLOG,
    projectId: '1',
    assigneeId: null,
    deadline: '2025-02-15',
    createdAt: '2025-01-10T10:45:00Z',
    updatedAt: '2025-01-10T10:45:00Z'
  },
  {
    id: '105',
    title: 'SEO - Optimisation méta-données',
    description: 'Configurer les balises meta pour toutes les pages',
    priority: TicketPriority.HIGH,
    status: TicketStatus.BACKLOG,
    projectId: '1',
    assigneeId: null,
    deadline: '2025-03-10',
    createdAt: '2025-01-10T10:50:00Z',
    updatedAt: '2025-01-10T10:50:00Z'
  },
  
  // Project 2: Campagne Lunaire
  {
    id: '201',
    title: 'Moodboard campagne Lunaire',
    description: 'Créer un moodboard pour la direction artistique de la campagne',
    priority: TicketPriority.HIGH,
    status: TicketStatus.DONE,
    projectId: '2',
    assigneeId: '3',
    deadline: '2025-01-15',
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-14T11:30:00Z'
  },
  {
    id: '202',
    title: 'Shootings produits',
    description: 'Organiser et réaliser les photos produits en studio',
    priority: TicketPriority.HIGH,
    status: TicketStatus.IN_PROGRESS,
    projectId: '2',
    assigneeId: '4',
    deadline: '2025-01-30',
    createdAt: '2025-01-05T10:10:00Z',
    updatedAt: '2025-01-20T09:15:00Z'
  },
  {
    id: '203',
    title: 'Rédaction posts Instagram',
    description: 'Rédiger 10 posts pour le lancement sur Instagram',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.REVIEW,
    projectId: '2',
    assigneeId: '1',
    deadline: '2025-02-05',
    createdAt: '2025-01-05T10:20:00Z',
    updatedAt: '2025-01-22T14:45:00Z'
  },
  {
    id: '204',
    title: 'Montage vidéo teaser',
    description: 'Monter la vidéo teaser de 30 secondes',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.TODO,
    projectId: '2',
    assigneeId: '4',
    deadline: '2025-02-10',
    createdAt: '2025-01-05T10:30:00Z',
    updatedAt: '2025-01-05T10:30:00Z'
  },
  
  // Project 3: Application mobile Nova
  {
    id: '301',
    title: 'Wireframes principales fonctionnalités',
    description: 'Concevoir les wireframes des principales sections de l\'app',
    priority: TicketPriority.HIGH,
    status: TicketStatus.IN_PROGRESS,
    projectId: '3',
    assigneeId: '3',
    deadline: '2025-01-25',
    createdAt: '2025-01-02T12:00:00Z',
    updatedAt: '2025-01-15T11:20:00Z'
  },
  {
    id: '302',
    title: 'Design système app Nova',
    description: 'Créer le guide de style et les composants UI',
    priority: TicketPriority.HIGH,
    status: TicketStatus.TODO,
    projectId: '3',
    assigneeId: '3',
    deadline: '2025-02-15',
    createdAt: '2025-01-02T12:10:00Z',
    updatedAt: '2025-01-02T12:10:00Z'
  },
  {
    id: '303',
    title: 'Architecture technique',
    description: 'Définir l\'architecture technique de l\'application',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.TODO,
    projectId: '3',
    assigneeId: '2',
    deadline: '2025-02-05',
    createdAt: '2025-01-02T12:20:00Z',
    updatedAt: '2025-01-02T12:20:00Z'
  },
  
  // Project 4: Refonte identité visuelle Agence
  {
    id: '401',
    title: 'Benchmark agences inspirantes',
    description: 'Réaliser un benchmark des agences avec une identité forte',
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.DONE,
    projectId: '4',
    assigneeId: '1',
    deadline: '2025-01-10',
    createdAt: '2024-12-20T09:00:00Z',
    updatedAt: '2025-01-08T16:45:00Z'
  },
  {
    id: '402',
    title: 'Propositions de logos',
    description: 'Créer 3 propositions pour le nouveau logo',
    priority: TicketPriority.HIGH,
    status: TicketStatus.IN_PROGRESS,
    projectId: '4',
    assigneeId: '3',
    deadline: '2025-02-01',
    createdAt: '2024-12-20T09:10:00Z',
    updatedAt: '2025-01-15T10:30:00Z'
  },
  {
    id: '403',
    title: 'Mise à jour templates présentation',
    description: 'Actualiser les templates PowerPoint avec la nouvelle charte',
    priority: TicketPriority.LOW,
    status: TicketStatus.BACKLOG,
    projectId: '4',
    assigneeId: null,
    deadline: '2025-02-20',
    createdAt: '2024-12-20T09:20:00Z',
    updatedAt: '2024-12-20T09:20:00Z'
  }
];

export const inboxItems: InboxItem[] = [
  {
    id: '1001',
    content: 'Ajouter une page FAQ au site Stellar Tech',
    projectId: '1',
    createdAt: '2025-01-20T10:15:00Z',
    createdBy: '1'
  },
  {
    id: '1002',
    content: 'Prévoir séance photo supplémentaire pour la gamme Éclipse',
    projectId: '2',
    createdAt: '2025-01-19T14:30:00Z',
    createdBy: '1'
  },
  {
    id: '1003',
    content: 'Idée : développer une fonctionnalité de notifications push pour l\'app Nova',
    projectId: '3',
    createdAt: '2025-01-18T09:45:00Z',
    createdBy: '2'
  },
  {
    id: '1004',
    content: 'Contacter l\'imprimeur pour les nouvelles cartes de visite',
    projectId: '4',
    createdAt: '2025-01-17T16:20:00Z',
    createdBy: '1'
  },
  {
    id: '1005',
    content: 'Organiser workshop créatif pour brainstorming identité visuelle',
    projectId: '4',
    createdAt: '2025-01-16T11:10:00Z',
    createdBy: '3'
  },
  {
    id: '1006',
    content: 'Idée de fonctionnalité : système de commentaires sur les posts du blog',
    projectId: '1',
    createdAt: '2025-01-15T15:40:00Z',
    createdBy: '2'
  },
  {
    id: '1007',
    content: 'Nouveau client potentiel : Galaxie Cosmetics - prévoir proposition commerciale',
    createdAt: '2025-01-14T13:25:00Z',
    createdBy: '1'
  }
];

// Helper function to get current user (for demo purposes)
export const getCurrentUser = (): User => {
  return users[0]; // Return first user as current user
};

// Helper function to get tickets by project
export const getTicketsByProject = (projectId: string): Ticket[] => {
  return tickets.filter(ticket => ticket.projectId === projectId);
};

// Helper function to get user by ID
export const getUserById = (userId: string): User | undefined => {
  return users.find(user => user.id === userId);
};

// Helper function to get project by ID
export const getProjectById = (projectId: string): Project | undefined => {
  return projects.find(project => project.id === projectId);
};

// Helper to calculate project completion percentage
export const getProjectCompletion = (projectId: string): number => {
  const projectTickets = getTicketsByProject(projectId);
  if (projectTickets.length === 0) return 0;
  
  const completedTickets = projectTickets.filter(
    ticket => ticket.status === TicketStatus.DONE
  ).length;
  
  return Math.round((completedTickets / projectTickets.length) * 100);
};

// Helper to get urgent tickets count for a project
export const getUrgentTicketsCount = (projectId: string): number => {
  return getTicketsByProject(projectId).filter(
    ticket => ticket.priority === TicketPriority.HIGH && 
    ticket.status !== TicketStatus.DONE
  ).length;
};

// Helper to get inbox items by project
export const getInboxItemsByProject = (projectId: string): InboxItem[] => {
  return inboxItems.filter(item => item.projectId === projectId);
};