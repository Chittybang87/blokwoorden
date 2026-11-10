import type { TheorySection, Woordsoort, WordRow } from '@blokwoorden/shared';
import { getSupabase } from './supabase';

export interface AdminPlayer {
  id: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
  email: string | null;
  group_count: number;
}

export interface AdminGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  invite_code: string | null;
}

export interface AdminGroupMember {
  player_id: string;
  display_name: string;
  role: string;
  joined_at: string;
  email: string | null;
}

export interface AdminScore {
  id: string;
  score: number;
  lines: number;
  level: number;
  created_at: string;
  display_name: string;
}

export async function fetchWords(includeInactive = true): Promise<WordRow[]> {
  const sb = getSupabase();
  let q = sb
    .from('words')
    .select('id, woord, soort, zin, active')
    .order('woord', { ascending: true });
  if (!includeInactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    woord: row.woord as string,
    soort: row.soort as Woordsoort,
    zin: (row.zin as string | null) ?? undefined,
    active: Boolean(row.active),
  }));
}

export async function createWord(input: {
  woord: string;
  soort: Woordsoort;
  zin?: string;
  active?: boolean;
}): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('words').insert({
    woord: input.woord.trim(),
    soort: input.soort,
    zin: input.zin?.trim() || null,
    active: input.active ?? true,
  });
  if (error) throw new Error(error.message);
}

export async function updateWord(
  id: string,
  input: {
    woord: string;
    soort: Woordsoort;
    zin?: string;
    active: boolean;
  },
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('words')
    .update({
      woord: input.woord.trim(),
      soort: input.soort,
      zin: input.zin?.trim() || null,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteWord(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('words').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchTheorySections(): Promise<TheorySection[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('theory_sections')
    .select('id, sort_order, nr, title, abbr, in_game_soort, body_html, active')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TheorySection[];
}

export async function createTheorySection(input: {
  sort_order: number;
  nr: string;
  title: string;
  abbr: string;
  in_game_soort: Woordsoort | null;
  body_html: string;
  active?: boolean;
}): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('theory_sections').insert({
    sort_order: input.sort_order,
    nr: input.nr.trim(),
    title: input.title.trim(),
    abbr: input.abbr.trim(),
    in_game_soort: input.in_game_soort,
    body_html: input.body_html,
    active: input.active ?? true,
  });
  if (error) throw new Error(error.message);
}

export async function updateTheorySection(
  id: string,
  input: {
    sort_order: number;
    nr: string;
    title: string;
    abbr: string;
    in_game_soort: Woordsoort | null;
    body_html: string;
    active: boolean;
  },
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('theory_sections')
    .update({
      sort_order: input.sort_order,
      nr: input.nr.trim(),
      title: input.title.trim(),
      abbr: input.abbr.trim(),
      in_game_soort: input.in_game_soort,
      body_html: input.body_html,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteTheorySection(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('theory_sections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchAdminPlayers(): Promise<AdminPlayer[]> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('admin_list_players');
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminPlayer[];
}

export async function fetchAdminGroups(): Promise<AdminGroup[]> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('admin_list_groups');
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminGroup[];
}

export async function fetchAdminGroupMembers(
  groupId: string,
): Promise<AdminGroupMember[]> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('admin_list_group_members', {
    p_group_id: groupId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminGroupMember[];
}

export async function fetchAdminGroupScores(
  groupId: string,
): Promise<AdminScore[]> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('admin_list_group_scores', {
    p_group_id: groupId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminScore[];
}
