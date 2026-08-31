/** "68%" o "—" cuando no hay muestra. */
export function formatPercent(value: number | null): string {
  if (value == null) return '—';
  return `${Math.round(value)}%`;
}

/** Segundos a "MM:SS" (o "H:MM:SS" en sesiones largas). */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "Hoy, 18:30" / "Ayer, 09:15" / "12 oct, 17:00". */
export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const hora = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const hoy = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, hoy)) return `Hoy, ${hora}`;

  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (sameDay(date, ayer)) return `Ayer, ${hora}`;

  return `${date.getDate()} ${MESES[date.getMonth()]?.slice(0, 3)}, ${hora}`;
}

/** "24 de octubre, 2025". */
export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} de ${MESES[date.getMonth()]}, ${date.getFullYear()}`;
}

export { DIAS };
