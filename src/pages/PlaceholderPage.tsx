type Props = {
  title: string;
};

export function PlaceholderPage({ title }: Props) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      <p className="text-sm text-slate-600 sm:text-base">
        Cette section n'est pas encore disponible. Elle arrivera au fil du développement.
      </p>
    </section>
  );
}
