import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Plus, Phone, Mail, Calendar, FileText, Linkedin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Textarea from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { ClientInteraction, createClientInteraction } from '@/lib/supabase';
import { toast } from 'sonner';

interface ClientInteractionsProps {
  clientId: string;
  interactions: ClientInteraction[];
  onInteractionCreated: () => void;
}

export const ClientInteractions: React.FC<ClientInteractionsProps> = ({
  clientId,
  interactions,
  onInteractionCreated,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    interaction_type: 'call' as const,
    summary: '',
    follow_up_needed: false,
    follow_up_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createClientInteraction({
        client_id: clientId,
        interaction_type: formData.interaction_type,
        summary: formData.summary,
        follow_up_needed: formData.follow_up_needed,
        follow_up_date: formData.follow_up_date || null,
      });
      toast.success('Interaction créée avec succès');
      onInteractionCreated();
      setIsCreateModalOpen(false);
      setFormData({
        interaction_type: 'call',
        summary: '',
        follow_up_needed: false,
        follow_up_date: '',
      });
    } catch (error) {
      toast.error('Erreur lors de la création de l\'interaction');
      console.error('Error creating interaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Interactions</CardTitle>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle interaction
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune interaction enregistrée
            </p>
          ) : (
            interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="flex items-start space-x-4 p-4 rounded-lg border border-white/10"
              >
                <div className="p-2 rounded-full bg-white/5">
                  {getInteractionIcon(interaction.interaction_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {interaction.interaction_type.charAt(0).toUpperCase() +
                        interaction.interaction_type.slice(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(interaction.interaction_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{interaction.summary}</p>
                  {interaction.follow_up_needed && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>Suivi nécessaire</span>
                      {interaction.follow_up_date && (
                        <span>
                          le {new Date(interaction.follow_up_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle interaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interaction_type">Type d'interaction</Label>
              <select
                id="interaction_type"
                value={formData.interaction_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    interaction_type: e.target.value as any,
                  }))
                }
                className="w-full bg-space-black border border-white/10 rounded-lg px-4 py-2.5 text-star-white focus:outline-none focus:ring-1 focus:border-nebula-purple focus:ring-nebula-purple"
              >
                <option value="call">Appel</option>
                <option value="email">Email</option>
                <option value="meeting">Réunion</option>
                <option value="note">Note</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Résumé</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, summary: e.target.value }))
                }
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_up_needed"
                checked={formData.follow_up_needed}
                onCheckedChange={(checked: boolean) =>
                  setFormData((prev) => ({ ...prev, follow_up_needed: checked }))
                }
              />
              <Label htmlFor="follow_up_needed">Suivi nécessaire</Label>
            </div>

            {formData.follow_up_needed && (
              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Date de suivi</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, follow_up_date: e.target.value }))
                  }
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer l\'interaction'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 