const DISPLAY_KEY = 'blokwoorden-display-name';
const ACTIVE_GROUP_KEY = 'blokwoorden-active-group';

export interface ActiveGroup {
  id: string;
  name: string;
  code: string;
}

export function getDisplayName(): string {
  try {
    return localStorage.getItem(DISPLAY_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_KEY, name.trim());
}

export function getActiveGroup(): ActiveGroup | null {
  try {
    const raw = localStorage.getItem(ACTIVE_GROUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveGroup;
    if (!parsed?.id || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setActiveGroup(group: ActiveGroup | null): void {
  if (!group) {
    localStorage.removeItem(ACTIVE_GROUP_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_GROUP_KEY, JSON.stringify(group));
}
