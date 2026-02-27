import type { SignalDef, CategoryKey, ExampleScenario } from './types';

export const CATEGORY_META: Record<CategoryKey, { label: string; subtitle: string; color: string }> = {
  need:     { label: 'Need Signals',     subtitle: 'Do they have a reason to outsource?', color: '#3182ce' },
  timing:   { label: 'Timing Signals',   subtitle: 'Are they at a decision point now?',   color: '#d69e2e' },
  behavior: { label: 'Behavior Proxies', subtitle: 'Are they actively looking?',          color: '#805ad5' },
};

const need: Omit<SignalDef, 'category'>[] = [
  { id: 'virtual_biotech',      num: 1,  name: 'Virtual Biotech Model',              desc: 'No manufacturing footprint — must outsource all production',                    sources: 'Company websites, LinkedIn headcount, SEC filings' },
  { id: 'complex_modality',     num: 2,  name: 'Complex Modality',                   desc: 'Cell/gene therapy, ADCs, mRNA — requires specialized CDMO capabilities',        sources: 'Pipeline NLP, ClinicalTrials.gov, SEC filings' },
  { id: 'pipeline_depth',       num: 3,  name: 'Pipeline Depth Exceeding Capacity',  desc: 'Multiple candidates advancing simultaneously beyond internal capacity',          sources: 'ClinicalTrials.gov active trial count, facility data' },
  { id: 'geographic_expansion', num: 4,  name: 'Geographic Expansion',               desc: 'EU/Asia expansion without regional manufacturing presence',                     sources: 'EMA submissions, press releases, regional job postings' },
  { id: 'platform_technology',  num: 5,  name: 'Platform Technology',                desc: 'One platform spawning multiple assets — creates capacity crunch',               sources: 'SEC filings, investor presentations, company descriptions' },
  { id: 'post_acquisition',     num: 6,  name: 'Post-Acquisition Integration',       desc: 'M&A triggers manufacturing strategy re-evaluation',                             sources: 'News monitoring, SEC 8-K filings, LinkedIn integration roles' },
];

const timing: Omit<SignalDef, 'category'>[] = [
  { id: 'phase1_transition',    num: 7,  name: 'Pre-Clinical to Phase 1 Transition', desc: 'CDMO selection typically happens at this inflection point',                      sources: 'ClinicalTrials.gov Phase 1 registrations, IND filings' },
  { id: 'cmc_work',             num: 8,  name: 'CMC Work Underway',                  desc: 'Process development/CMC activity signals imminent manufacturing decisions',     sources: 'CMC job postings, process development press releases' },
  { id: 'supply_timelines',     num: 9,  name: 'Clinical Supply Timelines Announced', desc: 'Hard deadlines create urgency for CDMO engagement',                            sources: 'Earnings call NLP, press releases with trial start dates' },
  { id: 'regulatory_presub',    num: 10, name: 'Regulatory Pre-Submission Activity',  desc: 'Manufacturing plans being finalized for FDA/EMA submissions',                  sources: 'Press releases mentioning Type B meetings, pre-IND meetings' },
  { id: 'contract_renewal',     num: 11, name: 'CDMO Contract Approaching Renewal',   desc: 'Existing contract expiry creates rebid or expansion opportunity',              sources: 'Historical deal dates (3–5 yr cycles), contract news' },
  { id: 'recent_funding',       num: 12, name: 'Recent Funding for Clinical Advancement', desc: 'Capital earmarked for manufacturing partnerships or CMC work',             sources: 'Crunchbase/PitchBook alerts, use-of-proceeds NLP' },
];

const behavior: Omit<SignalDef, 'category'>[] = [
  { id: 'tech_transfer_roles',  num: 13, name: 'Tech Transfer / External Mfg Roles', desc: 'Job postings for tech transfer or external manufacturing — active CDMO engagement', sources: 'LinkedIn/Indeed scraping for CDMO-related titles' },
  { id: 'cmc_leadership_hired', num: 14, name: 'CMC / Supply Chain Leadership Hired', desc: 'New decision-maker onboarded — open to new conversations',                       sources: 'LinkedIn job change monitoring for CMC/Supply Chain VP+' },
  { id: 'conference_attendance', num: 15, name: 'CDMO Event Attendance',               desc: 'Registered for or attended CPhI, DCAT, Bio partnering events',                   sources: 'Conference attendee lists, speaker agendas, partnering tools' },
  { id: 'competitor_cdmo_deal', num: 16, name: 'Competitor Announced CDMO Deal',       desc: 'Similar-profile company partnered with CDMO — creates urgency',                  sources: 'News monitoring filtered by modality and stage' },
  { id: 'linkedin_activity',    num: 17, name: 'Executive LinkedIn Activity on CDMO',  desc: 'Key decision-makers engaging with CDMO-related content',                         sources: 'LinkedIn API / manual monitoring for likes, comments, shares' },
  { id: 'earnings_mfg_mention', num: 18, name: 'Earnings Call Mentions Mfg Strategy',  desc: 'Manufacturing, outsourcing, or capacity discussed in investor communications',  sources: 'Earnings call transcript NLP for manufacturing keywords' },
];

function tag(category: CategoryKey, signals: Omit<SignalDef, 'category'>[]): SignalDef[] {
  return signals.map(s => ({ ...s, category }));
}

export const SIGNALS: Record<CategoryKey, SignalDef[]> = {
  need: tag('need', need),
  timing: tag('timing', timing),
  behavior: tag('behavior', behavior),
};

export const ALL_SIGNALS: SignalDef[] = [...SIGNALS.need, ...SIGNALS.timing, ...SIGNALS.behavior];

export const EXAMPLES: ExampleScenario[] = [
  {
    title: 'Virtual Biotech — Phase 1 Filing',
    description: 'Virtual biotech + Phase 1 filing + tech transfer role posted',
    result: 'high',
    company: 'NovaCure Therapeutics',
    signals: {
      virtual_biotech: 'present', complex_modality: 'present', platform_technology: 'inferred',
      phase1_transition: 'present', cmc_work: 'inferred',
      tech_transfer_roles: 'present', conference_attendance: 'inferred',
    },
  },
  {
    title: 'Gene Therapy — Series B Funded',
    description: 'Gene therapy company + Series B + CMC VP hired',
    result: 'high',
    company: 'GenVec Biologics',
    signals: {
      complex_modality: 'present', virtual_biotech: 'present', pipeline_depth: 'inferred',
      recent_funding: 'present', phase1_transition: 'inferred', cmc_work: 'present',
      cmc_leadership_hired: 'present', conference_attendance: 'present',
    },
  },
  {
    title: 'Mid-Size Biotech — Competitor Deal',
    description: 'Mid-size biotech + competitor CDMO deal + supply chain role open',
    result: 'medium-high',
    company: 'Meridian Bio',
    signals: {
      pipeline_depth: 'present', complex_modality: 'inferred',
      supply_timelines: 'inferred',
      competitor_cdmo_deal: 'present', tech_transfer_roles: 'present',
    },
  },
  {
    title: 'Large Pharma — Late Stage',
    description: 'Large pharma + late-stage + no job postings + existing CDMO',
    result: 'low',
    company: 'GlobalPharm Inc.',
    signals: { contract_renewal: 'inferred' },
  },
];

export const AI_METHODS = [
  { name: 'Web Scraping + NLP',           desc: 'Company websites, press releases, SEC filings → Need 1–6, Timing 7–12' },
  { name: 'ClinicalTrials.gov API',       desc: 'Trial registrations, phase transitions → Need 2–3, Timing 7, 9' },
  { name: 'SEC EDGAR API',                desc: '10-K, S-1, 8-K filings for manufacturing mentions → Need 1, 5, 6, Timing 12' },
  { name: 'Job Board Scraping',           desc: 'LinkedIn/Indeed hiring patterns → Timing 8, Behavior 13–14' },
  { name: 'News Monitoring',              desc: 'Funding, M&A, partnerships, regulatory → Need 6, Timing 10–12, Behavior 16' },
  { name: 'Earnings Call NLP',            desc: 'Manufacturing-related commentary extraction → Timing 9, Behavior 18' },
  { name: 'LinkedIn Activity Monitor',    desc: 'Decision-maker engagement patterns → Behavior 14, 17' },
  { name: 'Conference Data Aggregation',  desc: 'Attendee lists, speaker agendas, partnering → Behavior 15' },
];
