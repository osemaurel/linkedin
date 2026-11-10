import { useState, type DragEvent } from 'react';
import {
  FORMAT_LABELS,
  formatLongDay,
  formatMonth,
  pillarColor,
  saveSlot,
  toDate,
  todayIso,
  toIso,
  type PlanPillar,
  type PlanSlot,
} from '@/lib/plan';
import { SlotCard } from './SlotCard';

type Props = {
  slots: PlanSlot[];
  pillars: PlanPillar[];
  onChange: (id: string, patch: Partial<PlanSlot>) => void;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const monthKey = (iso: string) => iso.slice(0, 7);
function addMonths(key: string, delta: number): string {
  const d = toDate(`${key}-01`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return toIso(d).slice(0, 7);
}

/** Jours affichés : semaines complètes, du lundi au dimanche, couvrant le mois. */
function monthDays(key: string): (string | null)[] {
  const first = toDate(`${key}-01`);
  const lead = (first.getUTCDay() + 6) % 7;
  const days: (string | null)[] = Array(lead).fill(null);
  for (const d = new Date(first); toIso(d).startsWith(key); d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(toIso(d));
  }
  while (days.length % 7) days.push(null);
  return days;
}

export function PlanCalendar({ slots, pillars, onChange }: Props) {
  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date));
  const firstMonth = monthKey(sorted[0]?.date ?? todayIso());
  const lastMonth = monthKey(sorted.at(-1)?.date ?? todayIso());
  const [month, setMonth] = useState(firstMonth);
  const [selected, setSelected] = useState<string | null>(sorted[0]?.date ?? null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayIso();

  const byDay = new Map<string, PlanSlot[]>();
  for (const slot of sorted) byDay.set(slot.date, [...(byDay.get(slot.date) ?? []), slot]);

  async function moveTo(slotId: string, date: string) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || slot.date === date) return;
    setError(null);
    onChange(slotId, { date });
    setSelected(date);
    try {
      await saveSlot(slotId, { scheduled_date: date });
    } catch (e) {
      onChange(slotId, { date: slot.date });
      setError((e as Error).message);
    }
  }

  function drop(e: DragEvent, date: string) {
    e.preventDefault();
    setDragOver(null);
    const slotId = e.dataTransfer.getData('text/plain');
    if (slotId) void moveTo(slotId, date);
  }

  const selectedSlots = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            disabled={month <= firstMonth}
            aria-label="Mois précédent"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            ‹
          </button>
          <h3 className="inline-block text-sm font-semibold text-slate-900 first-letter:uppercase">
            {formatMonth(toDate(`${month}-01`))}
          </h3>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            disabled={month >= lastMonth}
            aria-label="Mois suivant"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthDays(month).map((day, i) => {
            if (!day) return <div key={`blank-${i}`} />;
            const daySlots = byDay.get(day) ?? [];
            const isSelected = day === selected;
            return (
              <div
                key={day}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(day);
                }}
                onDragLeave={() => setDragOver((d) => (d === day ? null : d))}
                onDrop={(e) => drop(e, day)}
                className={`flex min-h-14 flex-col rounded-lg border text-left sm:min-h-24 ${
                  dragOver === day
                    ? 'border-brand-400 bg-brand-50'
                    : isSelected
                      ? 'border-brand-300 bg-brand-50/60'
                      : 'border-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(day)}
                  aria-pressed={isSelected}
                  aria-label={`${formatLongDay(day)}${daySlots.length ? `, ${daySlots.length} publication${daySlots.length > 1 ? 's' : ''}` : ''}`}
                  className="flex w-full flex-1 flex-col items-stretch gap-1 p-1 text-left sm:flex-none"
                >
                  <span
                    className={`text-xs tabular-nums ${day === today ? 'font-bold text-brand-700' : 'text-slate-600'}`}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {/* Mobile : une pastille par publication */}
                  <span className="flex flex-wrap gap-1 sm:hidden">
                    {daySlots.map((s) => (
                      <span
                        key={s.id}
                        className={`h-2 w-2 rounded-full ${pillarColor(pillars, s.pillarId).dot}`}
                      />
                    ))}
                  </span>
                </button>
                {/* Ordinateur : étiquettes déplaçables */}
                <div className="hidden space-y-1 px-1 pb-1 sm:block">
                  {daySlots.map((s) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', s.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => setSelected(day)}
                      title={`${FORMAT_LABELS[s.format]} · ${s.angle}`}
                      className={`cursor-grab rounded px-1.5 py-1 text-[11px] leading-tight active:cursor-grabbing ${pillarColor(pillars, s.pillarId).chip}`}
                    >
                      <span className="line-clamp-2">{s.angle || FORMAT_LABELS[s.format]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 hidden text-xs text-slate-500 sm:block">
          Glisse une publication sur un autre jour pour la déplacer.
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {selected && (
        <section aria-label={`Publications du ${formatLongDay(selected)}`}>
          <h3 className="mb-2 text-sm font-semibold text-slate-500 first-letter:uppercase">
            {formatLongDay(selected)}
          </h3>
          {selectedSlots.length ? (
            <div className="space-y-3">
              {selectedSlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  pillars={pillars}
                  onChange={(patch) => onChange(slot.id, patch)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aucune publication ce jour-là.</p>
          )}
        </section>
      )}
    </div>
  );
}
