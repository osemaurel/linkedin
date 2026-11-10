// Ressources de la page, extraites de l'original et rangées sous des noms lisibles.

import heroDashboard from './assets/img/hero-dashboard.webp';
import heroIcon1 from './assets/img/hero-icon-1.webp';
import heroIcon2 from './assets/img/hero-icon-2.webp';
import heroIcon3 from './assets/img/hero-icon-3.webp';
import heroIcon4 from './assets/img/hero-icon-4.webp';
import avatarTag1 from './assets/img/avatar-tag-1.webp';
import avatarTag2 from './assets/img/avatar-tag-2.webp';
import avatarTag3 from './assets/img/avatar-tag-3.webp';
import featureUnifiedMetrics from './assets/img/feature-unified-metrics.webp';
import featureAiInsights from './assets/img/feature-ai-insights.webp';
import featureUsageTracking from './assets/img/feature-usage-tracking.webp';
import featureImpactAnalysis from './assets/img/feature-impact-analysis.webp';
import stepConnect from './assets/img/step-connect.webp';
import stepAnalyze from './assets/img/step-analyze.webp';
import stepOptimize from './assets/img/step-optimize.webp';
import avatarCarterJune from './assets/img/avatar-carter-june.webp';
import avatarElenaPark from './assets/img/avatar-elena-park.webp';
import avatarJamesNair from './assets/img/avatar-james-nair.webp';
import avatarSarahBond from './assets/img/avatar-sarah-bond.webp';
import avatarMarcusLee from './assets/img/avatar-marcus-lee.webp';
import blogStreamlining from './assets/img/blog-streamlining.webp';
import blogGrowing from './assets/img/blog-growing.webp';
import blogWorkflows from './assets/img/blog-workflows.webp';
import blogManualWork from './assets/img/blog-manual-work.webp';
import newsletterRibbon from './assets/img/newsletter-ribbon.webp';
import newsletterEnvelope from './assets/img/newsletter-envelope.webp';
import favicon from './assets/img/favicon.png';

import integrationWise from './assets/svg/integration-wise.svg';
import integrationSlack from './assets/svg/integration-slack.svg';
import integrationNotion from './assets/svg/integration-notion.svg';
import integrationGoogleSheets from './assets/svg/integration-google-sheets.svg';
import integrationGithub from './assets/svg/integration-github.svg';
import integrationAirtable from './assets/svg/integration-airtable.svg';
import integrationAws from './assets/svg/integration-aws.svg';
import integrationSupabase from './assets/svg/integration-supabase.svg';
import integrationFramer from './assets/svg/integration-framer.svg';
import stars from './assets/svg/stars.svg';

// Icônes et logos posés en ligne : ils prennent la couleur du texte autour d'eux.
import logo from './assets/svg/logo.svg?raw';
import creditCard from './assets/svg/credit-card.svg?raw';
import check from './assets/svg/check.svg?raw';
import cross from './assets/svg/cross.svg?raw';
import arrowRight from './assets/svg/arrow-right.svg?raw';
import benefitRealtime from './assets/svg/benefit-realtime.svg?raw';
import benefitAllInOne from './assets/svg/benefit-allinone.svg?raw';
import benefitActionable from './assets/svg/benefit-actionable.svg?raw';
import benefitSecure from './assets/svg/benefit-secure.svg?raw';
import benefitReports from './assets/svg/benefit-reports.svg?raw';
import benefitSimple from './assets/svg/benefit-simple.svg?raw';
import client45Degrees from './assets/svg/client-45degrees.svg?raw';
import clientCodecraft from './assets/svg/client-codecraft.svg?raw';
import clientFrequencii from './assets/svg/client-frequencii.svg?raw';
import clientKintsugi from './assets/svg/client-kintsugi.svg?raw';
import clientCoreos from './assets/svg/client-coreos.svg?raw';
import clientLuminary from './assets/svg/client-luminary.svg?raw';

export const img = {
  heroDashboard,
  heroIcons: [heroIcon1, heroIcon2, heroIcon3, heroIcon4],
  avatarTag: [avatarTag1, avatarTag2, avatarTag3],
  featureUnifiedMetrics,
  featureAiInsights,
  featureUsageTracking,
  featureImpactAnalysis,
  stepConnect,
  stepAnalyze,
  stepOptimize,
  avatarCarterJune,
  avatarElenaPark,
  avatarJamesNair,
  avatarSarahBond,
  avatarMarcusLee,
  blogStreamlining,
  blogGrowing,
  blogWorkflows,
  blogManualWork,
  newsletterRibbon,
  newsletterEnvelope,
  favicon,
  stars,
};

/** Logos d'intégration, dans l'ordre de la spirale de l'original. */
export const integrationLogos = [
  { src: integrationWise, name: 'Wise' },
  { src: integrationSlack, name: 'Slack' },
  { src: integrationNotion, name: 'Notion' },
  { src: integrationGoogleSheets, name: 'Google Sheets' },
  { src: integrationGithub, name: 'GitHub' },
  { src: integrationAirtable, name: 'Airtable' },
  { src: integrationAws, name: 'AWS' },
  { src: integrationSupabase, name: 'Supabase' },
  { src: integrationFramer, name: 'Framer' },
];

export const svg = {
  logo,
  creditCard,
  check,
  cross,
  arrowRight,
  benefitRealtime,
  benefitAllInOne,
  benefitActionable,
  benefitSecure,
  benefitReports,
  benefitSimple,
};

/** Logos clients du bandeau, avec leur taille d'origine. */
export const clientLogos = [
  { svg: client45Degrees, name: '45 Degrees', width: 137 },
  { svg: clientCodecraft, name: 'Codecraft', width: 147 },
  { svg: clientFrequencii, name: 'Frequencii', width: 129 },
  { svg: clientKintsugi, name: 'Kintsugi', width: 107 },
  { svg: clientCoreos, name: 'CoreOS', width: 106 },
  { svg: clientLuminary, name: 'Luminary', width: 129 },
];
