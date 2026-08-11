export type HousingResourceKind =
  | "assistance_program"
  | "housing_inventory"
  | "housing_protection"
  | "mobility_option"
  | "financing_program"
  | "homeownership_model"
  | "funding_stream"
  | "search_pathway"
  | "reimbursement_program";

export type AccessModel =
  | "apply_to_pha"
  | "apply_to_property"
  | "apply_to_local_program"
  | "apply_to_state_program"
  | "apply_to_nonprofit_provider"
  | "apply_to_usda"
  | "apply_through_lender_or_partner"
  | "request_from_current_housing_provider"
  | "claim_through_victim_compensation"
  | "search_inventory"
  | "local_implementation_required";

export type PaymentMethod =
  | "rental_subsidy"
  | "owner_payment"
  | "direct_assistance"
  | "grant"
  | "loan"
  | "forgivable_loan"
  | "mortgage_subsidy"
  | "reduced_purchase_price"
  | "reimbursement_only"
  | "not_applicable"
  | "varies_by_local_program";

export type TimeHorizon = "immediate" | "short_term" | "medium_term" | "long_term" | "ongoing";

export type AvailabilityModel =
  | "waitlist"
  | "property_specific"
  | "local_program_optional"
  | "provider_specific"
  | "state_specific"
  | "geography_specific"
  | "continuous_application"
  | "rights_based"
  | "inventory_search"
  | "unknown";

export type GeographicScope = "national" | "state" | "local" | "property" | "rural_eligible_area";

export type EligibilityDetermination =
  | "local_verification_required"
  | "property_verification_required"
  | "program_verification_required"
  | "rights_based"
  | "not_an_eligibility_program";

export type NextStepType = "apply" | "contact" | "search" | "ask" | "request_right" | "check_eligibility";

export interface HousingResource {
  id: string;
  name: string;
  shortName?: string;
  aliases?: string[];
  parentResourceId?: string;
  resourceKind: HousingResourceKind;
  accessModels: AccessModel[];
  paymentMethods: PaymentMethod[];
  availabilityModels: AvailabilityModel[];
  federalProgram: boolean;
  requiresLocalImplementation: boolean;
  housingGoals: string[];
  housingStatuses: string[];
  populationTags: string[];
  prerequisiteTags: string[];
  barrierTags: string[];
  assistanceTypes: string[];
  timeHorizons: TimeHorizon[];
  geographicScope: GeographicScope;
  eligibilityDetermination: EligibilityDetermination;
  userFacingSummary: string;
  nextStepType: NextStepType;
  questionToAsk?: string;
  warnings: string[];
  officialSourceName: string;
  sourceUrl: string;
  lastVerified: string;
}

export type HousingResourceCategory =
  | "rental"
  | "survivor"
  | "homelessness"
  | "mobility"
  | "homeownership"
  | "discovery";

