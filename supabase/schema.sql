-- Blokwoorden: groepen, invites, scores
-- Voer dit uit in Supabase → SQL Editor.
--
-- Auth (dashboard, niet in deze SQL):
-- - Authentication → Providers → Email: AAN
-- - Confirm email: AAN (gebruiker moet bevestigingsmail klikken)
-- - Anonymous: UIT (niet nodig)
-- - URL Configuration: Site URL + Redirect URLs = je app-URL (lokaal + Vercel)
--
-- GDPR: wachtwoorden horen NOOIT in public.players — alleen gehasht in Auth (auth.users).
-- Onze tabellen bevatten hoogstens display_name + scores.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 24),
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_by uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, player_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  code text not null unique check (code ~ '^[2-9A-HJ-NP-Z]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  score integer not null check (score >= 0),
  lines integer not null default 0 check (lines >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now()
);

create index if not exists scores_group_score_idx
  on public.scores (group_id, score desc, created_at asc);

create index if not exists group_members_player_idx
  on public.group_members (player_id);

alter table public.players enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invites enable row level security;
alter table public.scores enable row level security;

-- Helpers
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.player_id = auth.uid()
  );
$$;

create or replace function public.normalize_invite_code(p_code text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Za-z]', '', 'g'));
$$;

-- Policies
drop policy if exists players_select on public.players;
create policy players_select on public.players
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.group_members me
      join public.group_members them on them.group_id = me.group_id
      where me.player_id = auth.uid()
        and them.player_id = players.id
    )
  );

drop policy if exists players_insert on public.players;
create policy players_insert on public.players
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists players_update on public.players;
create policy players_update on public.players
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated
  using (public.is_group_member(id));

drop policy if exists groups_insert on public.groups;
create policy groups_insert on public.groups
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members
  for insert to authenticated
  with check (
    player_id = auth.uid()
    and (
      role = 'owner'
      or public.is_group_member(group_id)
    )
  );

drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites
  for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists invites_insert on public.invites;
create policy invites_insert on public.invites
  for insert to authenticated
  with check (public.is_group_member(group_id));

drop policy if exists scores_select on public.scores;
create policy scores_select on public.scores
  for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists scores_insert on public.scores;
create policy scores_insert on public.scores
  for insert to authenticated
  with check (
    player_id = auth.uid()
    and public.is_group_member(group_id)
  );

-- RPCs
create or replace function public.ensure_player(p_display_name text)
returns public.players
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_display_name);
  v_row public.players;
begin
  if v_uid is null then
    raise exception 'Niet ingelogd';
  end if;
  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 24 then
    raise exception 'Ongeldige naam';
  end if;

  insert into public.players (id, display_name)
  values (v_uid, v_name)
  on conflict (id) do update
    set display_name = excluded.display_name
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.create_group_with_invite(p_name text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_name);
  v_code text := public.normalize_invite_code(p_code);
  v_group public.groups;
begin
  if v_uid is null then
    raise exception 'Niet ingelogd';
  end if;
  if not exists (select 1 from public.players where id = v_uid) then
    raise exception 'Maak eerst een spelersnaam';
  end if;
  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'Ongeldige groepsnaam';
  end if;
  if v_code !~ '^[2-9A-HJ-NP-Z]{6}$' then
    raise exception 'Ongeldige code';
  end if;

  insert into public.groups (name, created_by)
  values (v_name, v_uid)
  returning * into v_group;

  insert into public.group_members (group_id, player_id, role)
  values (v_group.id, v_uid, 'owner');

  insert into public.invites (group_id, code)
  values (v_group.id, v_code);

  return jsonb_build_object(
    'group_id', v_group.id,
    'name', v_group.name,
    'code', v_code
  );
end;
$$;

create or replace function public.join_group_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := public.normalize_invite_code(p_code);
  v_group_id uuid;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Niet ingelogd';
  end if;
  if not exists (select 1 from public.players where id = v_uid) then
    raise exception 'Maak eerst een spelersnaam';
  end if;

  select i.group_id, g.name
    into v_group_id, v_name
  from public.invites i
  join public.groups g on g.id = i.group_id
  where i.code = v_code;

  if v_group_id is null then
    raise exception 'Code niet gevonden';
  end if;

  insert into public.group_members (group_id, player_id, role)
  values (v_group_id, v_uid, 'member')
  on conflict do nothing;

  return jsonb_build_object(
    'group_id', v_group_id,
    'name', v_name,
    'code', v_code
  );
end;
$$;

grant usage on schema public to authenticated;
grant select, insert, update on public.players to authenticated;
grant select, insert on public.groups to authenticated;
grant select, insert on public.group_members to authenticated;
grant select, insert on public.invites to authenticated;
grant select, insert on public.scores to authenticated;

grant execute on function public.ensure_player(text) to authenticated;
grant execute on function public.create_group_with_invite(text, text) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.normalize_invite_code(text) to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
