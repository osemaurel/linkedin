const numberFormat = new Intl.NumberFormat('fr-FR');

export function formatCredits(n: number): string {
  return `${numberFormat.format(n)} ${n > 1 ? 'crédits' : 'crédit'}`;
}
