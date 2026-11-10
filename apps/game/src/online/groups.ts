import QRCode from 'qrcode';
import {
  formatInviteCode,
  generateInviteCode,
  normalizeInviteCode,
} from './codes';
import { requireAuthSession } from './auth';
import { getSupabase, isOnlineConfigured } from './supabase';
import {
  getActiveGroup,
  getDisplayName,
  setActiveGroup,
  setDisplayName,
  type ActiveGroup,
} from './session';

export type { ActiveGroup };

export interface LeaderboardRow {
  playerId: string;
  displayName: string;
  score: number;
  lines: number;
  level: number;
  createdAt: string;
}

async function ensurePlayer(displayName: string): Promise<void> {
  const name = displayName.trim();
  if (name.length < 1 || name.length > 24) {
    throw new Error('Kies een naam van 1–24 tekens.');
  }
  await requireAuthSession();
  const sb = getSupabase();
  const { error } = await sb.rpc('ensure_player', { p_display_name: name });
  if (error) throw new Error(error.message);
  setDisplayName(name);
}

export async function savePlayerName(displayName: string): Promise<void> {
  if (!isOnlineConfigured) {
    setDisplayName(displayName);
    return;
  }
  await ensurePlayer(displayName);
}

export async function createGroup(name: string): Promise<ActiveGroup> {
  if (!isOnlineConfigured) throw new Error('Online spelen is niet geconfigureerd.');
  const display = getDisplayName();
  if (!display) throw new Error('Vul eerst je naam in.');
  await ensurePlayer(display);

  const groupName = name.trim() || `${display}'s groep`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateInviteCode();
    const sb = getSupabase();
    const { data, error } = await sb.rpc('create_group_with_invite', {
      p_name: groupName,
      p_code: code,
    });
    if (error) {
      lastError = new Error(error.message);
      if (/unique|duplicate|invites_code/i.test(error.message)) continue;
      throw lastError;
    }
    const row = data as { group_id: string; name: string; code: string };
    const group: ActiveGroup = {
      id: row.group_id,
      name: row.name,
      code: row.code,
    };
    setActiveGroup(group);
    return group;
  }

  throw lastError ?? new Error('Kon geen unieke code maken.');
}

export async function joinGroupByCode(rawCode: string): Promise<ActiveGroup> {
  if (!isOnlineConfigured) throw new Error('Online spelen is niet geconfigureerd.');
  const display = getDisplayName();
  if (!display) throw new Error('Vul eerst je naam in.');
  await ensurePlayer(display);

  const code = normalizeInviteCode(rawCode);
  if (code.length !== 6) throw new Error('Voer de code van 6 tekens in (bijv. K7P-2M9).');

  const sb = getSupabase();
  const { data, error } = await sb.rpc('join_group_by_code', { p_code: code });
  if (error) throw new Error(error.message);

  const row = data as { group_id: string; name: string; code: string };
  const group: ActiveGroup = {
    id: row.group_id,
    name: row.name,
    code: row.code,
  };
  setActiveGroup(group);
  return group;
}

export async function submitGroupScore(
  score: number,
  lines: number,
  level: number,
): Promise<boolean> {
  if (!isOnlineConfigured || score <= 0) return false;
  const group = getActiveGroup();
  if (!group) return false;

  try {
    const user = await requireAuthSession();
    const sb = getSupabase();

    const { error } = await sb.from('scores').insert({
      group_id: group.id,
      player_id: user.id,
      score,
      lines,
      level,
    });
    if (error) {
      console.warn('Score upload mislukt:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Score upload mislukt:', e);
    return false;
  }
}

export async function fetchGroupLeaderboard(
  groupId: string,
  limit = 20,
): Promise<LeaderboardRow[]> {
  if (!isOnlineConfigured) return [];
  await requireAuthSession();
  const sb = getSupabase();

  const { data, error } = await sb
    .from('scores')
    .select('player_id, score, lines, level, created_at')
    .eq('group_id', groupId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const playerIds = [...new Set(data.map((r) => r.player_id as string))];
  const { data: players, error: pErr } = await sb
    .from('players')
    .select('id, display_name')
    .in('id', playerIds);
  if (pErr) throw new Error(pErr.message);

  const names = new Map(
    (players ?? []).map((p) => [p.id as string, p.display_name as string]),
  );

  return data.map((r) => ({
    playerId: r.player_id as string,
    displayName: names.get(r.player_id as string) ?? 'Speler',
    score: r.score as number,
    lines: r.lines as number,
    level: r.level as number,
    createdAt: r.created_at as string,
  }));
}

export async function qrDataUrlForCode(code: string): Promise<string> {
  const joinUrl = buildJoinUrl(code);
  return QRCode.toDataURL(joinUrl, {
    width: 240,
    margin: 1,
    color: { dark: '#1e3a34', light: '#f3f7f5' },
  });
}

export function buildJoinUrl(code: string): string {
  const n = normalizeInviteCode(code);
  const url = new URL(window.location.href);
  url.hash = `/join/${n}`;
  return url.toString();
}

export function parseJoinCodeFromLocation(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  const m = hash.match(/^\/?join\/([0-9A-Za-z-]{6,8})/i);
  if (m?.[1]) return normalizeInviteCode(m[1]);

  const path = window.location.pathname;
  const pm = path.match(/\/join\/([0-9A-Za-z-]{6,8})\/?$/i);
  if (pm?.[1]) return normalizeInviteCode(pm[1]);

  return null;
}

export function clearJoinHash(): void {
  if (window.location.hash.toLowerCase().includes('join/')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

export { formatInviteCode, getActiveGroup, getDisplayName, setActiveGroup };
