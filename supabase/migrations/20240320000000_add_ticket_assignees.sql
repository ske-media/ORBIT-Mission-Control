-- Create ticket_assignees table
create table if not exists public.ticket_assignees (
  ticket_id uuid references public.tickets(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (ticket_id, user_id)
);

-- Enable RLS
alter table public.ticket_assignees enable row level security;

-- Create policies
create policy "Les membres du projet peuvent voir les assignations"
on public.ticket_assignees for select
using (
  exists (
    select 1 from public.project_members
    where project_members.project_id = (
      select project_id from public.tickets where id = ticket_assignees.ticket_id
    )
    and project_members.user_id = auth.uid()
  )
);

create policy "Les membres du projet peuvent ajouter des assignations"
on public.ticket_assignees for insert
with check (
  exists (
    select 1 from public.project_members
    where project_members.project_id = (
      select project_id from public.tickets where id = ticket_assignees.ticket_id
    )
    and project_members.user_id = auth.uid()
  )
);

create policy "Les membres du projet peuvent supprimer des assignations"
on public.ticket_assignees for delete
using (
  exists (
    select 1 from public.project_members
    where project_members.project_id = (
      select project_id from public.tickets where id = ticket_assignees.ticket_id
    )
    and project_members.user_id = auth.uid()
  )
);

-- Add comment
comment on table public.ticket_assignees is 'Table de liaison entre les tickets et leurs assignés'; 