import Anthropic from '@anthropic-ai/sdk';

const ALL_SIGNAL_IDS = [
  'virtual_biotech', 'complex_modality', 'pipeline_depth', 'geographic_expansion',
  'platform_technology', 'post_acquisition',
  'phase1_transition', 'cmc_work', 'supply_timelines', 'regulatory_presub',
  'contract_renewal', 'recent_funding',
  'tech_transfer_roles', 'cmc_leadership_hired', 'conference_attendance',
  'competitor_cdmo_deal', 'linkedin_activity', 'earnings_mfg_mention',
];

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  virtual_biotech: 'Virtual Biotech Model — no manufacturing footprint, must outsource all production',
  complex_modality: 'Complex Modality — cell/gene therapy, ADCs, mRNA requiring specialized CDMO capabilities',
  pipeline_depth: 'Pipeline Depth Exceeding Capacity — multiple candidates advancing simultaneously',
  geographic_expansion: 'Geographic Expansion — EU/Asia expansion without regional manufacturing',
  platform_technology: 'Platform Technology — one platform spawning multiple assets creating capacity crunch',
  post_acquisition: 'Post-Acquisition Integration — M&A triggering manufacturing strategy re-evaluation',
  phase1_transition: 'Pre-Clinical to Phase 1 Transition — CDMO selection typically happens here',
  cmc_work: 'CMC Work Underway — process development/CMC activity signaling imminent manufacturing decisions',
  supply_timelines: 'Clinical Supply Timelines Announced — hard deadlines creating urgency for CDMO engagement',
  regulatory_presub: 'Regulatory Pre-Submission Activity — manufacturing plans being finalized for FDA/EMA',
  contract_renewal: 'CDMO Contract Approaching Renewal — existing contract expiry creating rebid opportunity',
  recent_funding: 'Recent Funding for Clinical Advancement — capital earmarked for manufacturing partnerships',
  tech_transfer_roles: 'Tech Transfer / External Mfg Roles — job postings for CDMO-related roles',
  cmc_leadership_hired: 'CMC / Supply Chain Leadership Hired — new decision-maker onboarded',
  conference_attendance: 'CDMO Event Attendance — registered for or attended CPhI, DCAT, Bio partnering events',
  competitor_cdmo_deal: 'Competitor Announced CDMO Deal — similar-profile company partnered with CDMO',
  linkedin_activity: 'Executive LinkedIn Activity on CDMO — key decision-makers engaging with CDMO content',
  earnings_mfg_mention: 'Earnings Call Mentions Mfg Strategy — manufacturing/outsourcing discussed in investor communications',
};

export type SignalState = 'absent' | 'inferred' | 'present';

export interface AnalysisResult {
  companyName: string;
  signals: Record<string, SignalState>;
  reasoning: Record<string, string>;
  summary: string;
  websiteUrl: string;
}

async function fetchWebContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CDMOAnalyzer/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const html = await res.text();
    // Strip HTML tags, scripts, styles — extract text content
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // Limit content size
  } finally {
    clearTimeout(timeout);
  }
}

async function searchForCompanyUrl(companyName: string): Promise<string | null> {
  // Try common patterns
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const candidates = [
    `https://www.${slug}.com`,
    `https://${slug}.com`,
    `https://www.${slug}bio.com`,
    `https://www.${slug}therapeutics.com`,
    `https://www.${slug}pharma.com`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CDMOAnalyzer/1.0)' },
      });
      if (res.ok) return url;
    } catch {
      // continue
    }
  }
  return null;
}

export async function analyzeCompany(
  input: { companyName: string; websiteUrl?: string }
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const anthropic = new Anthropic({ apiKey });

  let websiteContent = '';
  let resolvedUrl = input.websiteUrl || '';

  // Try to fetch website content
  if (input.websiteUrl) {
    try {
      websiteContent = await fetchWebContent(input.websiteUrl);
    } catch (err) {
      console.warn(`Failed to fetch ${input.websiteUrl}:`, err);
    }
  } else {
    // Try to find the company website
    const found = await searchForCompanyUrl(input.companyName);
    if (found) {
      resolvedUrl = found;
      try {
        websiteContent = await fetchWebContent(found);
      } catch (err) {
        console.warn(`Failed to fetch ${found}:`, err);
      }
    }
  }

  const signalList = ALL_SIGNAL_IDS.map(id => `- ${id}: ${SIGNAL_DESCRIPTIONS[id]}`).join('\n');

  const prompt = `You are an expert pharmaceutical industry analyst specializing in CDMO (Contract Development and Manufacturing Organization) outsourcing intelligence.

Analyze the following company and determine which CDMO outsourcing intent signals are present, inferred, or absent.

Company Name: ${input.companyName}
${websiteContent ? `\nWebsite Content (from ${resolvedUrl}):\n${websiteContent}` : '\nNo website content available — use your knowledge of this company.'}

The 18 signals to evaluate:
${signalList}

For each signal, determine:
- "present": Clear, direct evidence found
- "inferred": Indirect evidence or reasonable inference based on company profile
- "absent": No evidence found

Respond with a JSON object in this exact format (no markdown, no code fences):
{
  "companyName": "Official company name",
  "signals": { "signal_id": "present|inferred|absent", ... },
  "reasoning": { "signal_id": "Brief explanation for each non-absent signal", ... },
  "summary": "2-3 sentence summary of CDMO outsourcing intent assessment"
}

Be thorough but accurate. Only mark signals as "present" when there is clear evidence. Use "inferred" when the company profile strongly suggests it but direct evidence is not available. Evaluate ALL 18 signals.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('');

  // Parse JSON from response
  let parsed: { companyName: string; signals: Record<string, string>; reasoning: Record<string, string>; summary: string };
  try {
    // Try to extract JSON if wrapped in markdown code fences
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }

  // Normalize signals — ensure all 18 are present with valid states
  const signals: Record<string, SignalState> = {};
  for (const id of ALL_SIGNAL_IDS) {
    const val = parsed.signals[id];
    if (val === 'present' || val === 'inferred') {
      signals[id] = val;
    } else {
      signals[id] = 'absent';
    }
  }

  return {
    companyName: parsed.companyName || input.companyName,
    signals,
    reasoning: parsed.reasoning || {},
    summary: parsed.summary || 'Analysis complete.',
    websiteUrl: resolvedUrl,
  };
}
