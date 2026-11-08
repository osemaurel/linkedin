import { useQuery } from '@tanstack/react-query';
import {
  ActivityCard,
  NextActionCard,
  ProgressCard,
  ScoreCard,
} from '@/components/dashboard/DashboardCards';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useFullProfile } from '@/hooks/useFullProfile';
import { useProfile } from '@/hooks/useProfile';
import { computeCompleteness } from '@/lib/completeness';
import { buildActivity, buildSteps, fetchDashboard, pickNextAction } from '@/lib/dashboard';
import { objectiveLabel } from '@/lib/objectives';

export default function Dashboard() {
  const { user } = useAuth();
  const profile = useProfile();
  const fullProfile = useFullProfile();
  const dashboard = useQuery({
    queryKey: ['dashboard', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchDashboard(user?.id as string),
    staleTime: 0,
  });

  const firstName = profile.data?.full_name?.trim().split(/\s+/)[0] ?? '';
  const header = (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {firstName ? `Bonjour ${firstName}` : 'Bonjour'}
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
        {profile.data?.objective
          ? `Ton objectif : ${objectiveLabel(profile.data.objective).toLowerCase()}.`
          : 'Voici où tu en es.'}
      </p>
    </header>
  );

  if (dashboard.isPending || fullProfile.isPending) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {header}
        <div className="grid place-items-center py-16 text-sky-600" role="status">
          <Spinner className="h-6 w-6" />
          <span className="sr-only">Chargement…</span>
        </div>
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p>Impossible de charger ton tableau de bord.</p>
          <button
            type="button"
            onClick={() => void dashboard.refetch()}
            className="mt-2 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const completeness = fullProfile.data ? computeCompleteness(fullProfile.data) : null;
  const data = dashboard.data;
  const action = pickNextAction(
    data,
    completeness
      ? {
          percent: completeness.percent,
          hint: completeness.next?.hint ?? null,
          tab: completeness.next?.tab ?? null,
        }
      : null,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {header}
      <div className="grid gap-4 lg:grid-cols-3">
        <NextActionCard action={action} className="lg:col-span-2" />
        <ScoreCard audits={data.audits} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProgressCard steps={buildSteps(data, completeness?.percent ?? null)} />
        <ActivityCard items={buildActivity(data)} />
      </div>
    </div>
  );
}
