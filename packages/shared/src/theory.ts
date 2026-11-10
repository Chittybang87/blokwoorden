import type { Woordsoort } from './woordsoorten';

export interface TheorySection {
  id: string;
  sort_order: number;
  nr: string;
  title: string;
  abbr: string;
  in_game_soort: Woordsoort | null;
  body_html: string;
  active: boolean;
}

export interface TheorySectionInput {
  sort_order: number;
  nr: string;
  title: string;
  abbr: string;
  in_game_soort: Woordsoort | null;
  body_html: string;
  active?: boolean;
}
