/**
 * Helpers de dates relatives.
 * Toutes les données de démonstration sont exprimées par rapport à "maintenant"
 * afin que la plateforme reste cohérente quel que soit le jour de la présentation.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Date ISO (YYYY-MM-DD) décalée de `days` jours par rapport à aujourd'hui. */
export function d(days: number): string {
  const x = new Date();
  x.setDate(x.getDate() + days);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

/** Date-heure ISO décalée de `hours` heures par rapport à maintenant. */
export function dt(hours: number, minutes = 0): string {
  const x = new Date(Date.now() + hours * 3600_000 + minutes * 60_000);
  return x.toISOString();
}

/** Heure locale de Ouagadougou (UTC+0). */
export function ouagaTime(date = new Date()): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Ouagadougou' });
}

export function ouagaDate(date = new Date(), lang: 'fr' | 'en' = 'fr'): string {
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Ouagadougou',
  });
}

/** Heure décimale à Ouagadougou (ex: 14.5 = 14h30). */
export function ouagaHour(date = new Date()): number {
  // Burkina Faso est en UTC+0 toute l'année
  return date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
}

export function formatRelative(iso: string, lang: 'fr' | 'en'): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return lang === 'fr' ? "à l'instant" : 'just now';
  if (min < 60) return lang === 'fr' ? `il y a ${min} min` : `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return lang === 'fr' ? `il y a ${h} h` : `${h} h ago`;
  const days = Math.round(h / 24);
  return lang === 'fr' ? `il y a ${days} j` : `${days} d ago`;
}

export function formatDateTime(iso: string, lang: 'fr' | 'en'): string {
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Ouagadougou',
  });
}

export function formatDate(iso: string, lang: 'fr' | 'en'): string {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Ouagadougou',
  });
}
