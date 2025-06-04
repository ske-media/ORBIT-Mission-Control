-- Create organizations table
create table if not exists organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sector text not null,
  size text not null,
  address text,
  website text,
  mainLanguage text not null check (mainLanguage in ('FR', 'EN')),
  timezone text not null,
  status text not null check (status in ('prospect', 'active', 'inactive', 'lost')),
  acquisitionSource text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create contacts table
create table if not exists contacts (
  id uuid default uuid_generate_v4() primary key,
  firstName text not null,
  lastName text not null,
  role text,
  email text not null,
  phone text,
  preferredChannel text not null check (preferredChannel in ('email', 'phone', 'whatsapp')),
  language text,
  notes text,
  organization_id uuid references organizations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create updated_at trigger function if it doesn't exist
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
drop trigger if exists update_organizations_updated_at on organizations;
create trigger update_organizations_updated_at
  before update on organizations
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_contacts_updated_at on contacts;
create trigger update_contacts_updated_at
  before update on contacts
  for each row
  execute function update_updated_at_column();

-- Add indexes for better performance
create index if not exists idx_organizations_name on organizations(name);
create index if not exists idx_organizations_status on organizations(status);
create index if not exists idx_contacts_email on contacts(email);
create index if not exists idx_contacts_organization_id on contacts(organization_id);

-- Add RLS (Row Level Security) policies
alter table organizations enable row level security;
alter table contacts enable row level security;

-- Create policies for organizations
create policy "Enable read access for all users" on organizations
  for select using (true);

create policy "Enable insert for authenticated users only" on organizations
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on organizations
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on organizations
  for delete using (auth.role() = 'authenticated');

-- Create policies for contacts
create policy "Enable read access for all users" on contacts
  for select using (true);

create policy "Enable insert for authenticated users only" on contacts
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on contacts
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on contacts
  for delete using (auth.role() = 'authenticated'); 