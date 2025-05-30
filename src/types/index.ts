export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TicketStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done'
}

export const TicketStatusLabels: Record<TicketStatus, string> = {
  [TicketStatus.TODO]: 'À faire',
  [TicketStatus.IN_PROGRESS]: 'En cours',
  [TicketStatus.REVIEW]: 'En review',
  [TicketStatus.DONE]: 'Fait'
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'collaborator';
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  projectId: string;
  assigneeId: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
};

export type Project = {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
};

export type InboxItem = {
  id: string;
  content: string;
  projectId?: string;
  createdAt: string;
  createdBy: string;
};

export type DashboardStats = {
  activeProjects: number;
  completedProjects: number;
  urgentTasks: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  upcomingDeadlines: number;
};