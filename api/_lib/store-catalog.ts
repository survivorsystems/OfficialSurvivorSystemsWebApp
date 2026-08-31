export type StoreProduct = {
  slug: string;
  name: string;
  price: number;
  stripeProductId: string;
  paymentLink: string;
  bucket: string;
  folder: string;
  requiredFileStems: readonly string[];
  description: string;
};

export const storeProducts: readonly StoreProduct[] = [
  {
    slug: "blank-motions-family-court",
    name: "Blank Motions: Family Court",
    price: 5.99,
    stripeProductId: "prod_V7EFDCB62Xf1Fu",
    paymentLink: "https://buy.stripe.com/8x228takY9N10sU2nJfQI04",
    bucket: "Family Court Planning Kit",
    folder: "Blank Motion Kit",
    requiredFileStems: ["Blank Motion to Enforce", "Blank Motion to Modify", "Blank Notice Of Court Proceedings", "Blank Proposed Order In SAPCR"],
    description: "Blank fillable motions and court documents for family-court preparation.",
  },
  {
    slug: "family-court-guides-planner",
    name: "Family Court Guides & Planner",
    price: 30,
    stripeProductId: "prod_V7EFBbwLq7QnZD",
    paymentLink: "https://buy.stripe.com/9B6aEZ3WA7ET0sU9QbfQI05",
    bucket: "Family Court Planning Kit",
    folder: "Family Court Planning Kit",
    requiredFileStems: ["Common Family Court Motions", "Common Terms Family Court", "Courtroom Vernacular", "ProSe Filing Steps", "Decision Planning", "Detailed Incident Report", "Draft Statement Template", "Family Court Planning", "How To File A Motion", "Filing Steps", "Weekly to-do list"],
    description: "Guides, planning worksheets, incident documentation, and filing tools for preparing and organizing a family-court case.",
  },
  {
    slug: "dvro-planner",
    name: "DVRO Planner",
    price: 19.99,
    stripeProductId: "prod_V7ED8erqqSODYh",
    paymentLink: "https://buy.stripe.com/eVqdRbakY6AP4Ja8M7fQI06",
    bucket: "Civil Protection Order Bucket",
    folder: "",
    requiredFileStems: ["Chronological History Log", "Common Civil Court Terms", "Courtroom Vernacular", "Detailed Incident Report", "Draft Statement Template", "DVROPlanner", "FilingStepsProSe", "Incident Log"],
    description: "Planning, incident documentation, court-language, statement, and filing tools for preparing a domestic-violence restraining-order case.",
  },
  {
    slug: "pro-se-filing-guide",
    name: "Pro Se Filing Guide",
    price: 4.99,
    stripeProductId: "prod_V7EEztFtcn240O",
    paymentLink: "https://buy.stripe.com/dRmeVfdxagbpa3ugezfQI07",
    bucket: "Legal",
    folder: "Individual Products",
    requiredFileStems: ["How To File A Motion As a Pro Se Litigant", "Filing Steps ProSe"],
    description: "Practical filing guides for self-represented litigants navigating forms, court rules, service, deadlines, and hearing preparation.",
  },
  {
    slug: "documentation-bundle",
    name: "Documentation Bundle",
    price: 3.99,
    stripeProductId: "prod_V7ED2hwwryV5CN",
    paymentLink: "https://buy.stripe.com/bJe00l64I5wL6Ri1jFfQI08",
    bucket: "Legal",
    folder: "Individual Products",
    requiredFileStems: ["Detailed Incident Report", "ChronologicalHistoryLog"],
    description: "A chronological history log and detailed incident report for organizing patterns, individual events, and information that may matter later.",
  },
];

export const storeProductsByStripeProductId = new Map(
  storeProducts.map((product) => [product.stripeProductId, product]),
);

export const storeProductsBySlug = new Map(
  storeProducts.map((product) => [product.slug, product]),
);

export function stripeObjectId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function normalizeStoreFileName(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
