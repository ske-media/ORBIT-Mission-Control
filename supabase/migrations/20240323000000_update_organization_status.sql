-- Mise à jour de la table organizations pour inclure le statut 'archived'
ALTER TABLE public.organizations 
  DROP CONSTRAINT IF EXISTS organizations_status_check,
  ADD CONSTRAINT organizations_status_check 
  CHECK (status IN ('prospect', 'active', 'inactive', 'lost', 'archived'));

-- Mise à jour des organisations existantes
UPDATE public.organizations 
SET status = 'archived' 
WHERE status = 'lost'; 