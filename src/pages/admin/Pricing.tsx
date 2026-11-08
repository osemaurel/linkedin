import { useId, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import {
  Badge,
  LoadError,
  Loading,
  PageHeader,
  panel,
  TableWrap,
  td,
  th,
} from '@/components/admin/ui';
import {
  adminCall,
  fmtDateTime,
  fmtNumber,
  type AdminCost,
  type AdminPack,
  type AdminPricing,
  type PackInput,
} from '@/lib/admin';
import { formatCost, formatPrice } from '@/lib/credits';
import { inputClass } from '@/lib/ui';

const MAX_PACKS = 12;

/** Entier dans [min, max], ou null si la saisie n'en est pas un. */
function toInt(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

const plural = (n: number, one: string, many: string) => `${fmtNumber(n)} ${n > 1 ? many : one}`;

function useRefreshPricing() {
  const queryClient = useQueryClient();
  // L'administration et l'application relisent les tarifs : ce qui vient d'être enregistré
  // s'affiche partout, y compris dans la barre latérale de l'administrateur.
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin'] }),
      queryClient.invalidateQueries({ queryKey: ['pricing'] }),
    ]);
}

function Notice({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <p
      role="status"
      className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200"
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Coût des actions
// ---------------------------------------------------------------------------

function CostsEditor({
  actions,
  onSaved,
}: {
  actions: AdminCost[];
  onSaved: (message: string) => void;
}) {
  const refresh = useRefreshPricing();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(actions.map((a) => [a.kind, String(a.cost)])),
  );

  const changed = actions.filter((a) => drafts[a.kind].trim() !== String(a.cost));
  const invalid = actions.filter((a) => toInt(drafts[a.kind], 0, 1000) === null);

  const save = useMutation({
    mutationFn: (costs: Record<string, number>) =>
      adminCall<{ changed: number }>('set_costs', { costs }),
    onSuccess: async ({ changed: n }) => {
      onSaved(n ? `${plural(n, 'coût mis', 'coûts mis')} à jour.` : 'Aucun coût n’a changé.');
      await refresh();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!changed.length || invalid.length) return;
    const lines = changed.map(
      (a) => `• ${a.label} : ${formatCost(a.cost)} → ${formatCost(Number(drafts[a.kind]))}`,
    );
    const message = `Appliquer ces nouveaux coûts ?\n\n${lines.join('\n')}\n\nIls valent tout de suite pour les actions suivantes de tous les utilisateurs.`;
    if (!window.confirm(message)) return;
    save.mutate(Object.fromEntries(changed.map((a) => [a.kind, Number(drafts[a.kind])])));
  }

  return (
    <form onSubmit={submit}>
      <TableWrap>
        <table className="w-full">
          <thead className="border-y border-slate-100">
            <tr>
              <th className={th}>Action</th>
              <th className={th}>Coût en crédits</th>
              <th className={`${th} hidden sm:table-cell`}>Affiché aux utilisateurs</th>
              <th className={`${th} hidden md:table-cell`}>Dernière modification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {actions.map((a) => {
              const draft = drafts[a.kind];
              const value = toInt(draft, 0, 1000);
              const isChanged = draft.trim() !== String(a.cost);
              return (
                <tr key={a.kind} className={isChanged ? 'bg-sky-50/70' : undefined}>
                  <td className={`${td} font-medium text-slate-900`}>{a.label}</td>
                  <td className={td}>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      step={1}
                      inputMode="numeric"
                      aria-label={`Coût : ${a.label}`}
                      aria-invalid={value === null}
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [a.kind]: e.target.value }))}
                      className={`${inputClass} w-24 tabular-nums ${
                        value === null ? 'border-red-400 focus:border-red-500' : ''
                      }`}
                    />
                    {value === null ? (
                      <span className="mt-1 block text-xs text-red-700">
                        Entier de 0 à 1&nbsp;000
                      </span>
                    ) : (
                      isChanged && (
                        <span className="mt-1 block text-xs text-slate-500">
                          avant : {formatCost(a.cost)}
                        </span>
                      )
                    )}
                  </td>
                  <td className={`${td} hidden sm:table-cell`}>
                    {value === null ? '—' : formatCost(value)}
                  </td>
                  <td className={`${td} hidden text-slate-500 md:table-cell`}>
                    {a.updated_at ? fmtDateTime(a.updated_at) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {changed.length
            ? `${plural(changed.length, 'modification', 'modifications')} en attente`
            : 'Modifie un coût puis enregistre.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {save.isError && (
            <p role="alert" className="w-full text-sm text-red-700 sm:w-auto">
              {save.error.message}
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              setDrafts(Object.fromEntries(actions.map((a) => [a.kind, String(a.cost)])))
            }
            disabled={!changed.length || save.isPending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!changed.length || invalid.length > 0 || save.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {save.isPending && <Spinner />}
            Enregistrer les coûts
          </button>
        </div>
      </div>
    </form>
  );
}

function CostsSection({ actions }: { actions: AdminCost[] }) {
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <section aria-labelledby="couts" className={panel}>
      <div className="space-y-3 p-5">
        <div>
          <h2 id="couts" className="font-semibold text-slate-900">
            Coût des actions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Le nombre de crédits débité pour chaque action de l’IA. À 0, l’action est gratuite. Un
            nouveau coût vaut pour les actions suivantes ; celles déjà faites ne changent pas.
          </p>
        </div>
        <Notice>{notice}</Notice>
      </div>
      {/* Les saisies repartent des valeurs enregistrées chaque fois que celles-ci changent. */}
      <CostsEditor
        key={actions.map((a) => `${a.kind}:${a.cost}`).join(',')}
        actions={actions}
        onSaved={setNotice}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Packs de crédits
// ---------------------------------------------------------------------------

function perCredit(price: number, credits: number) {
  return formatPrice(Math.round(price / credits), 'XOF');
}

function PackForm({
  pack,
  onCancel,
  onSaved,
}: {
  pack?: AdminPack;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const id = useId();
  const refresh = useRefreshPricing();
  const [name, setName] = useState(pack?.name ?? '');
  const [credits, setCredits] = useState(pack ? String(pack.credits) : '');
  const [price, setPrice] = useState(pack ? String(pack.price) : '');
  const [active, setActive] = useState(pack?.active ?? true);

  const nCredits = toInt(credits, 1, 100_000);
  const nPrice = toInt(price, 100, 10_000_000);
  const nameOk = name.trim().length >= 2 && name.trim().length <= 40;
  const valid = nameOk && nCredits !== null && nPrice !== null;

  const save = useMutation({
    mutationFn: (input: PackInput) => adminCall<{ pack: AdminPack }>('save_pack', { pack: input }),
    onSuccess: async ({ pack: saved }) => {
      onSaved(pack ? `Pack « ${saved.name} » enregistré.` : `Pack « ${saved.name} » créé.`);
      await refresh();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    save.mutate({ id: pack?.id, name: name.trim(), credits: nCredits, price: nPrice, active });
  }

  const label = 'mb-1.5 block text-sm font-medium text-slate-700';
  return (
    <form
      onSubmit={submit}
      aria-label={pack ? `Modifier le pack ${pack.name}` : 'Nouveau pack'}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <p className="font-medium text-slate-900">
        {pack ? `Modifier « ${pack.name} »` : 'Nouveau pack'}
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_180px]">
        <div>
          <label htmlFor={`${id}-name`} className={label}>
            Nom du pack
          </label>
          <input
            id={`${id}-name`}
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Étudiant"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${id}-credits`} className={label}>
            Crédits
          </label>
          <input
            id={`${id}-credits`}
            type="number"
            min={1}
            max={100000}
            step={1}
            inputMode="numeric"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-price`} className={label}>
            Prix (FCFA)
          </label>
          <input
            id={`${id}-price`}
            type="number"
            min={100}
            max={10000000}
            step={1}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600"
        />
        En vente (proposé aux utilisateurs)
      </label>

      <p className="text-sm text-slate-600">
        {valid ? (
          <>
            Aperçu : <span className="font-medium text-slate-900">{name.trim()}</span> ·{' '}
            {plural(nCredits, 'crédit', 'crédits')} ·{' '}
            <span className="font-medium text-slate-900">{formatPrice(nPrice, 'XOF')}</span>, soit{' '}
            {perCredit(nPrice, nCredits)} le crédit.
          </>
        ) : (
          'Nom de 2 à 40 caractères, de 1 à 100 000 crédits, prix de 100 à 10 000 000 FCFA.'
        )}
      </p>

      {save.isError && (
        <p role="alert" className="text-sm text-red-700">
          {save.error.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!valid || save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {save.isPending && <Spinner />}
          {pack ? 'Enregistrer' : 'Créer le pack'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={save.isPending}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

const actionButton =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50';

/** « Modifier » et « Retirer de la vente » / « Remettre en vente », avec l'erreur éventuelle. */
function PackActions({
  pack,
  editing,
  onEdit,
  onSaved,
}: {
  pack: AdminPack;
  editing: boolean;
  onEdit: () => void;
  onSaved: (message: string) => void;
}) {
  const refresh = useRefreshPricing();
  const toggle = useMutation({
    mutationFn: () =>
      adminCall<{ pack: AdminPack }>('save_pack', {
        pack: { ...pack, active: !pack.active },
      }),
    onSuccess: async ({ pack: saved }) => {
      onSaved(
        saved.active
          ? `Pack « ${saved.name} » remis en vente.`
          : `Pack « ${saved.name} » retiré de la vente.`,
      );
      await refresh();
    },
  });

  function run() {
    const question = pack.active
      ? `Retirer « ${pack.name} » de la vente ? Les utilisateurs ne pourront plus l’acheter. Les paiements déjà lancés ne changent pas.`
      : `Remettre « ${pack.name} » en vente ?`;
    if (window.confirm(question)) toggle.mutate();
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onEdit}
          disabled={editing}
          aria-label={`Modifier le pack ${pack.name}`}
          className={actionButton}
        >
          Modifier
        </button>
        <button type="button" onClick={run} disabled={toggle.isPending} className={actionButton}>
          {toggle.isPending && <Spinner />}
          {pack.active ? 'Retirer de la vente' : 'Remettre en vente'}
        </button>
      </div>
      {toggle.isError && (
        <p role="alert" className="text-xs text-red-700 sm:ml-auto sm:max-w-[16rem]">
          {toggle.error.message}
        </p>
      )}
    </div>
  );
}

function SaleBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge tone="bg-emerald-50 text-emerald-800 ring-emerald-200">En vente</Badge>
  ) : (
    <Badge tone="bg-slate-100 text-slate-700 ring-slate-200">Retiré</Badge>
  );
}

function PacksSection({ packs }: { packs: AdminPack[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const saved = (message: string) => {
    setNotice(message);
    setEditing(null);
  };
  const edit = (id: string) => () => {
    setNotice(null);
    setEditing(id);
  };
  const full = packs.length >= MAX_PACKS;

  return (
    <section aria-labelledby="packs" className={panel}>
      <div className="space-y-3 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="packs" className="font-semibold text-slate-900">
              Packs de crédits
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Les packs en vente sont proposés du moins cher au plus cher. Un paiement déjà lancé
              garde le prix et les crédits du moment où il a été lancé.
            </p>
          </div>
          <button
            type="button"
            onClick={edit('new')}
            disabled={full || editing === 'new'}
            title={full ? `${MAX_PACKS} packs au plus` : undefined}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouveau pack
          </button>
        </div>
        <Notice>{notice}</Notice>
        {editing && (
          <PackForm
            key={editing}
            pack={packs.find((p) => p.id === editing)}
            onCancel={() => setEditing(null)}
            onSaved={saved}
          />
        )}
      </div>

      {/* Téléphone : une fiche par pack. */}
      <ul
        aria-label="Packs"
        className="divide-y divide-slate-100 border-t border-slate-100 sm:hidden"
      >
        {packs.map((p) => (
          <li
            key={p.id}
            className={`space-y-2 px-5 py-4 ${editing === p.id ? 'bg-sky-50/70' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-900">{p.name}</span>
              <SaleBadge active={p.active} />
            </div>
            <p className="text-sm text-slate-600">
              {plural(p.credits, 'crédit', 'crédits')} ·{' '}
              <span className="font-medium text-slate-900">{formatPrice(p.price, p.currency)}</span>{' '}
              · {perCredit(p.price, p.credits)} le crédit
            </p>
            <PackActions pack={p} editing={editing === p.id} onEdit={edit(p.id)} onSaved={saved} />
          </li>
        ))}
      </ul>

      {/* Ordinateur et tablette : un tableau. */}
      <div className="hidden sm:block">
        <TableWrap>
          <table className="w-full min-w-[720px]">
            <thead className="border-y border-slate-100">
              <tr>
                <th className={th}>Pack</th>
                <th className={`${th} text-right`}>Crédits</th>
                <th className={`${th} text-right`}>Prix</th>
                <th className={`${th} text-right`}>Prix du crédit</th>
                <th className={th}>Statut</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packs.map((p) => (
                <tr
                  key={p.id}
                  className={
                    editing === p.id ? 'bg-sky-50/70' : p.active ? undefined : 'text-slate-500'
                  }
                >
                  <td className={`${td} font-medium text-slate-900`}>{p.name}</td>
                  <td className={`${td} text-right tabular-nums`}>{fmtNumber(p.credits)}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {formatPrice(p.price, p.currency)}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {perCredit(p.price, p.credits)}
                  </td>
                  <td className={td}>
                    <SaleBadge active={p.active} />
                  </td>
                  <td className={td}>
                    <PackActions
                      pack={p}
                      editing={editing === p.id}
                      onEdit={edit(p.id)}
                      onSaved={saved}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </section>
  );
}

export default function AdminPricing() {
  const pricing = useQuery({
    queryKey: ['admin', 'pricing'],
    queryFn: () => adminCall<AdminPricing>('pricing'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarifs"
        subtitle="Le coût de chaque action et les packs de crédits. Chaque changement est inscrit au journal."
      />
      {pricing.isPending ? (
        <Loading />
      ) : pricing.isError ? (
        <LoadError message={pricing.error.message} onRetry={() => void pricing.refetch()} />
      ) : (
        <>
          <PacksSection packs={pricing.data.packs} />
          <CostsSection actions={pricing.data.actions} />
        </>
      )}
    </div>
  );
}
