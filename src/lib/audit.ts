import type { Json } from './database.types';
import { invokeFunction } from './edgeFunctions';

// Doit rester égal à AUDIT_COST dans supabase/functions/run-audit/index.ts.
export const AUDIT_COST = 5;

export const BLOCKS = [
  'photo',
  'banner',
  'headline',
  'about',
  'experience',
  'skills',
  'featured',
] as const;
export type Block = (typeof BLOCKS)[number];
export type Impact = 'high' | 'medium' | 'low';

export const BLOCK_LABELS: Record<Block, string> = {
  photo: 'Photo de profil',
  banner: 'Bannière',
  headline: 'Titre',
  about: 'Infos',
  experience: 'Expérience',
  skills: 'Compétences',
  featured: 'Sélection',
};

export const IMPACT_LABELS: Record<Impact, string> = {
  high: 'Impact fort',
  medium: 'Impact moyen',
  low: 'Impact faible',
};

export type BlockResult = { score: number | null; impact: Impact; diagnostic: string };
export type QuickWin = { block: Block; action: string; impact: Impact };
export type Suggestion = { id: string; block: Block; content: string };

export type Audit = {
  id: string;
  createdAt: string;
  scoreGlobal: number;
  blocks: Record<Block, BlockResult>;
  quickWins: QuickWin[];
};

type AuditRow = {
  id: string;
  created_at: string;
  score_global: number | null;
  scores: Json;
  quick_wins: Json;
};

function isBlock(value: unknown): value is Block {
  return BLOCKS.includes(value as Block);
}

const IMPACT_RANK: Record<Impact, number> = { high: 0, medium: 1, low: 2 };

function asImpact(value: unknown): Impact {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

export function parseAudit(row: AuditRow): Audit {
  const scores = (row.scores && typeof row.scores === 'object' ? row.scores : {}) as Record<
    string,
    { score?: unknown; impact?: unknown; diagnostic?: unknown } | undefined
  >;
  const blocks = Object.fromEntries(
    BLOCKS.map((block) => {
      const b = scores[block] ?? {};
      return [
        block,
        {
          score: typeof b.score === 'number' ? b.score : null,
          impact: asImpact(b.impact),
          diagnostic: typeof b.diagnostic === 'string' ? b.diagnostic : '',
        },
      ];
    }),
  ) as Record<Block, BlockResult>;

  const quickWins = (Array.isArray(row.quick_wins) ? row.quick_wins : [])
    .map((q) => q as { block?: unknown; action?: unknown; impact?: unknown })
    .filter((q) => isBlock(q.block) && typeof q.action === 'string' && q.action)
    .map((q) => ({
      block: q.block as Block,
      action: q.action as string,
      impact: asImpact(q.impact),
    }))
    .sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact]);

  return {
    id: row.id,
    createdAt: row.created_at,
    scoreGlobal: row.score_global ?? 0,
    blocks,
    quickWins,
  };
}

const MESSAGES: Record<string, string> = {
  insufficient_credits: `Il te faut ${AUDIT_COST} crédits pour lancer un audit.`,
  audit_running: 'Un audit est déjà en cours. Patiente une minute avant de relancer.',
  profile_missing: 'Commence par présenter ton profil pour lancer ton audit.',
  llm_not_configured: 'L’audit est momentanément indisponible. Réessaie un peu plus tard.',
  llm_failed: 'L’audit n’a pas abouti. Aucun crédit n’a été débité : tu peux relancer.',
};

export type RunAuditResult = {
  audit_id: string;
  score_global: number;
  credits_balance: number;
};

export function runAudit(): Promise<RunAuditResult> {
  return invokeFunction<RunAuditResult>('run-audit', {}, MESSAGES);
}

export type AuditQuestion = { id: string; block: Block; question: string };

/** Codes pour lesquels la réponse est enregistrée mais les propositions n'ont pas bougé. */
export const ANSWER_SAVED_CODES = ['llm_failed', 'llm_not_configured'];

const QUESTION_MESSAGES: Record<string, string> = {
  question_closed: 'Cette question a déjà une réponse.',
  too_long: 'Une ligne suffit : raccourcis ta réponse.',
  llm_failed:
    'Ta réponse est enregistrée dans tes preuves, mais la mise à jour des propositions a échoué. Elle comptera au prochain audit.',
  llm_not_configured:
    'Ta réponse est enregistrée dans tes preuves. La mise à jour des propositions est momentanément indisponible.',
};

export function answerQuestion(questionId: string, answer: string) {
  return invokeFunction<{ block: Block; rewrites: number }>(
    'answer-question',
    { question_id: questionId, answer },
    QUESTION_MESSAGES,
  );
}
