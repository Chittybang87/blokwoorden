import type { TheorySection, WordEntry, Woordsoort } from '@blokwoorden/shared';
import wordsData from '../data/words.json';
import { theorieHtml, theorieHtmlFromSections } from '../data/theorie';
import { getSupabase, isOnlineConfigured } from './supabase';

const FALLBACK_WORDS = wordsData as WordEntry[];

export interface GameContent {
  words: WordEntry[];
  theoryHtml: string;
  source: 'supabase' | 'fallback';
}

let cached: GameContent | null = null;
let inflight: Promise<GameContent> | null = null;

export function getFallbackContent(): GameContent {
  return {
    words: FALLBACK_WORDS,
    theoryHtml: theorieHtml(),
    source: 'fallback',
  };
}

export async function loadGameContent(force = false): Promise<GameContent> {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    if (!isOnlineConfigured) {
      cached = getFallbackContent();
      return cached;
    }

    try {
      const sb = getSupabase();
      const [wordsRes, theoryRes] = await Promise.all([
        sb
          .from('words')
          .select('woord, soort, zin')
          .eq('active', true)
          .order('woord', { ascending: true }),
        sb
          .from('theory_sections')
          .select('id, sort_order, nr, title, abbr, in_game_soort, body_html, active')
          .eq('active', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (wordsRes.error || theoryRes.error) {
        throw new Error(wordsRes.error?.message ?? theoryRes.error?.message);
      }

      const words = (wordsRes.data ?? []).map((row) => ({
        woord: row.woord as string,
        soort: row.soort as Woordsoort,
        zin: (row.zin as string | null) ?? undefined,
      }));

      const sections = (theoryRes.data ?? []) as TheorySection[];

      if (words.length === 0) {
        cached = getFallbackContent();
        return cached;
      }

      cached = {
        words,
        theoryHtml:
          sections.length > 0 ? theorieHtmlFromSections(sections) : theorieHtml(),
        source: 'supabase',
      };
      return cached;
    } catch {
      cached = getFallbackContent();
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function getCachedContent(): GameContent {
  return cached ?? getFallbackContent();
}
