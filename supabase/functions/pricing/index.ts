import { serve } from '../_shared/http.ts';
import { ACTIONS, PACKS } from '../_shared/pricing.ts';

serve(() => Promise.resolve({ actions: ACTIONS, packs: PACKS }));
