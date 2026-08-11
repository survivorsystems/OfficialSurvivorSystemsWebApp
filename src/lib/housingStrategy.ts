import type { HousingResource, TimeHorizon } from "../data/housing";

export type HousingUrgency = "immediate" | "seven_days" | "thirty_days" | "one_to_three_months" | "stable";
export type TriState = "yes" | "no" | "unsure" | "prefer_not";

export interface HousingAssessmentAnswers {
  statuses: string[];
  goals: string[];
  urgency: HousingUrgency | "";
  zipCode: string;
  county: string;
  state: string;
  assistance: string[];
  waitlist: "yes" | "no" | "unsure" | "";
  abuseAffectsHousing: TriState | "";
  abuseConnections: string[];
  circumstances: string[];
  householdSize: string;
  monthlyIncome: string;
  incomeSources: string[];
  barriers: string[];
  flexibility: string[];
  homeownership: "yes" | "maybe" | "no" | "";
}

export const emptyHousingAnswers: HousingAssessmentAnswers = {
  statuses: [], goals: [], urgency: "", zipCode: "", county: "", state: "", assistance: [], waitlist: "",
  abuseAffectsHousing: "", abuseConnections: [], circumstances: [], householdSize: "", monthlyIncome: "",
  incomeSources: [], barriers: [], flexibility: [], homeownership: "",
};

export type HousingMatchClassification = "strong" | "checking" | "long_term";
export type HousingResultSection = "best" | "checking" | "long_term" | "protections" | "search" | "reimbursement";

export interface HousingMatch {
  resource: HousingResource;
  score: number;
  classification: HousingMatchClassification;
  section: HousingResultSection;
  reasons: string[];
  missingPrerequisites: string[];
  matchedGoals: string[];
  matchedStatuses: string[];
  matchedBarriers: string[];
}

export interface HousingActionStep {
  horizon: "start" | "next" | "later";
  resourceId: string;
  action: string;
}

const urgencyHorizons: Record<HousingUrgency, TimeHorizon[]> = {
  immediate: ["immediate", "short_term"],
  seven_days: ["immediate", "short_term"],
  thirty_days: ["short_term", "medium_term"],
  one_to_three_months: ["medium_term", "long_term"],
  stable: ["long_term", "ongoing"],
};

function intersection(left: string[], right: string[]) {
  return left.filter((value) => right.includes(value));
}

function inferredPopulationTags(answers: HousingAssessmentAnswers): string[] {
  const tags = [...answers.circumstances];
  if (answers.abuseAffectsHousing === "yes") tags.push("domestic_violence", "dating_violence", "sexual_assault", "stalking");
  if (answers.monthlyIncome === "none") tags.push("extremely_low_income", "very_low_income", "low_income");
  return [...new Set(tags)];
}

function satisfiedPrerequisites(answers: HousingAssessmentAnswers): string[] {
  const tags: string[] = [];
  if (answers.assistance.includes("hcv")) tags.push("currently_has_hcv");
  if (answers.flexibility.includes("rural")) tags.push("rural_location_required", "willing_to_consider_rural_area");
  if (answers.circumstances.includes("child_welfare_involved") || answers.circumstances.includes("foster_youth")) {
    tags.push("child_welfare_referral_or_certification");
  }
  return tags;
}

function isUrgent(answers: HousingAssessmentAnswers) {
  return answers.urgency === "immediate" || answers.urgency === "seven_days" || answers.urgency === "thirty_days";
}

function actionFor(resource: HousingResource): string {
  const subject = resource.shortName ?? resource.name;
  switch (resource.nextStepType) {
    case "apply": return `Ask how to apply for ${subject} and whether applications or waitlists are open.`;
    case "contact": return `Contact the organization responsible for ${subject}.`;
    case "search": return `Search for the local properties, providers, or programs connected to ${subject}.`;
    case "ask": return resource.questionToAsk ?? `Ask whether ${subject} is available locally.`;
    case "request_right": return `Ask the current housing provider how to request the protections connected to ${subject}.`;
    case "check_eligibility": return `Contact the administering program to verify eligibility and current requirements for ${subject}.`;
  }
}

export function matchHousingResources(resources: HousingResource[], answers: HousingAssessmentAnswers): HousingMatch[] {
  const populations = inferredPopulationTags(answers);
  const satisfied = satisfiedPrerequisites(answers);
  const horizons = answers.urgency ? urgencyHorizons[answers.urgency] : [];

  return resources.map((resource) => {
    const matchedGoals = intersection(resource.housingGoals, answers.goals);
    const matchedStatuses = intersection(resource.housingStatuses, answers.statuses);
    const matchedBarriers = intersection(resource.barrierTags, answers.barriers);
    const populationMatches = intersection(resource.populationTags, populations);
    const missingPrerequisites = resource.prerequisiteTags.filter((tag) =>
      ["currently_has_hcv", "rural_location_required", "child_welfare_referral_or_certification"].includes(tag) && !satisfied.includes(tag)
    );
    let score = matchedGoals.length * 7 + matchedStatuses.length * 6 + matchedBarriers.length * 5 + populationMatches.length * 4;
    score += intersection(resource.timeHorizons, horizons).length * 3;
    if (resource.resourceKind === "search_pathway" && (answers.goals.includes("housing_search") || answers.barriers.includes("housing_search"))) score += 5;
    if (resource.id === "hcv_portability" && answers.assistance.includes("hcv") && (answers.goals.includes("relocate") || answers.goals.includes("relocate_safely"))) score += 14;
    if (resource.id === "hcv_homeownership" && answers.assistance.includes("hcv") && answers.homeownership !== "no") score += 12;
    if (resource.resourceKind === "housing_protection" && answers.abuseAffectsHousing === "yes") score += 14;
    if (resource.id === "esg_homelessness_prevention" && answers.statuses.some((status) => ["currently_housed", "at_risk_of_homelessness", "behind_on_housing_costs"].includes(status))) score += 9;
    if (resource.id === "esg_rapid_rehousing" && answers.statuses.some((status) => ["experiencing_homelessness", "vehicle_motel_unsheltered", "shelter_or_transitional_housing"].includes(status))) score += 12;
    if (resource.id === "usda_rural_rental" && answers.flexibility.includes("rural")) score += 8;
    if (resource.id === "usda_502_direct" && answers.flexibility.includes("rural") && answers.homeownership !== "no") score += 10;
    if (resource.housingGoals.includes("homeownership") && answers.homeownership === "no") score -= 20;
    if (resource.housingGoals.includes("homeownership") && answers.homeownership === "maybe") score += 4;
    if (resource.housingGoals.includes("homeownership") && answers.homeownership === "yes") score += 8;
    score -= missingPrerequisites.length * 12;

    const reasons = [
      ...matchedGoals.slice(0, 2).map((goal) => `Matches your goal: ${humanizeHousingTag(goal)}`),
      ...matchedStatuses.slice(0, 1).map((status) => `Matches your situation: ${humanizeHousingTag(status)}`),
      ...matchedBarriers.slice(0, 2).map((barrier) => `Helps with: ${humanizeHousingTag(barrier)}`),
      ...populationMatches.slice(0, 1).map((tag) => `Designed for: ${humanizeHousingTag(tag)}`),
    ];
    if (!reasons.length && resource.resourceKind === "search_pathway") reasons.push("Provides another place to search for housing or local programs");
    if (resource.requiresLocalImplementation) reasons.push("Availability must be confirmed locally");

    let classification: HousingMatchClassification = score >= 18 && !missingPrerequisites.length ? "strong" : "checking";
    if (resource.housingGoals.includes("homeownership") && isUrgent(answers)) classification = "long_term";
    if (resource.timeHorizons.every((horizon) => horizon === "long_term" || horizon === "ongoing") && isUrgent(answers) && classification !== "strong") classification = "long_term";

    let section: HousingResultSection = classification === "strong" ? "best" : classification === "long_term" ? "long_term" : "checking";
    if (resource.resourceKind === "housing_protection") section = "protections";
    if (resource.resourceKind === "search_pathway") section = "search";
    if (resource.paymentMethods.includes("reimbursement_only")) section = "reimbursement";

    return { resource, score, classification, section, reasons, missingPrerequisites, matchedGoals, matchedStatuses, matchedBarriers };
  }).filter((match) => match.score > 0 || match.resource.resourceKind === "search_pathway")
    .sort((a, b) => b.score - a.score);
}

export function buildHousingActionPlan(matches: HousingMatch[]): HousingActionStep[] {
  return matches.slice(0, 12).map((match) => ({
    horizon: match.section === "best" || match.section === "protections" ? "start" : match.section === "long_term" ? "later" : "next",
    resourceId: match.resource.id,
    action: actionFor(match.resource),
  }));
}

export function humanizeHousingTag(tag: string): string {
  const overrides: Record<string, string> = { hcv: "Housing Choice Voucher", pha: "Public Housing Authority", pbra: "Project-Based Rental Assistance", pbv: "Project-Based Voucher" };
  return overrides[tag] ?? tag.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
