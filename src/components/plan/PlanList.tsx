import { formatLongDay, mondayOf, type PlanPillar, type PlanSlot } from '@/lib/plan';
import { SlotCard } from './SlotCard';

type Props = {
  slots: PlanSlot[];
  pillars: PlanPillar[];
  onChange: (id: string, patch: Partial<PlanSlot>) => void;
};

/** Créneaux regroupés par semaine, dans l'ordre des dates. */
export function PlanList({ slots, pillars, onChange }: Props) {
  const weeks = new Map<string, PlanSlot[]>();
  for (const slot of [...slots].sort((a, b) => a.date.localeCompare(b.date))) {
    const week = mondayOf(slot.date);
    weeks.set(week, [...(weeks.get(week) ?? []), slot]);
  }

  return (
    <div className="space-y-6">
      {[...weeks].map(([monday, weekSlots]) => (
        <section key={monday} aria-label={`Semaine du ${formatLongDay(monday)}`}>
          <h3 className="mb-2 text-sm font-semibold text-slate-500">
            Semaine du {formatLongDay(monday)}
          </h3>
          <div className="space-y-3">
            {weekSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                pillars={pillars}
                onChange={(patch) => onChange(slot.id, patch)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
