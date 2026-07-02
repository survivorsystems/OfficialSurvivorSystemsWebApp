import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  Compass,
  Scale,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import denialSupportOne from "./assets/support/denial-support-1.png";
import denialSupportTwo from "./assets/support/denial-support-2.png";
import GoBagSimulator from "./GoBagSimulator";

type ModuleKey =
  | "home"
  | "am-i-crazy"
  | "go-bag-prep"
  | "planning"
  | "rebuilding"
  | "local-help"
  | "how-to"
  | "legal"
  | "library"
  | "access";

type AssessmentAnswer = {
  id: string;
  label: string;
  responseTitle: string;
  response: string;
  pattern?: string;
  safetyFocused?: boolean;
};

type AssessmentQuestion = {
  prompt: string;
  answers: AssessmentAnswer[];
};

type GaugeValue = {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  state: string;
  tone: "cyan" | "pink" | "purple" | "amber";
};

type ControlPanelState = {
  emphasis: string | null;
  gauges: GaugeValue[];
  notice: string;
};

type AssessmentGauges = {
  autonomy: number;
  danger: number;
  reality: number;
  dangerFloor: number;
};

type AssessmentGaugeEffect = {
  autonomy: number;
  danger: number;
  reality: number;
  emphasis: keyof Omit<AssessmentGauges, "dangerFloor">;
  notice: string;
  minDanger?: number;
};

type ExitGaugeState = {
  readiness: number;
  exposure: number;
  backup: number;
  exposureFloor: number;
};

type ExitGaugeEffect = {
  readiness: number;
  exposure: number;
  backup: number;
  emphasis: keyof Omit<ExitGaugeState, "exposureFloor">;
  notice: string;
  minExposure?: number;
};

type ExitAnswer = {
  id: string;
  label: string;
  responseTitle: string;
  response: string;
  effect: ExitGaugeEffect;
};

type ExitQuestion = {
  phase: string;
  prompt: string;
  answers: ExitAnswer[];
};

type LeavingLadderRung = {
  id: string;
  title: string;
  premise: string;
  systemResponse: string;
  contextSignal?: {
    title: string;
    body: string;
  };
  suggestedAction: string;
  effect: {
    clarity: number;
    preparedness: number;
    reality: number;
    options: number;
    emphasis: string;
    notice: string;
  };
};

type SafetyPlanSection = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  screenshotLines: string[];
  detailGroups: Array<{
    title: string;
    items: string[];
  }>;
};

type RebuildingGuideSection = {
  id: string;
  label: string;
  title: string;
  body: string[];
  items?: string[];
};

type LegalCategory = {
  id: string;
  label: string;
  title: string;
  description: string;
  status: string;
  available?: boolean;
};

type LegalGuideSection = {
  title: string;
  tag?: string;
  blocks: Array<{
    title: string;
    items: Array<{
      name?: string;
      text: string;
    }>;
  }>;
};

type LegalStep = {
  number: string;
  title: string;
  text: string;
};

type LegalGuidePageData = {
  title: string;
  eyebrow: string;
  terminalLabel: string;
  intro: string;
  warning: string;
  sections: LegalGuideSection[];
  notes?: Array<{
    title: string;
    body: string;
  }>;
  reminder?: {
    title: string;
    body: string;
  };
};

type LibraryCategory = {
  id: string;
  title: string;
  description: string;
  resourceCount: number;
};

type LibraryPass = {
  id: string;
  title: string;
  price: string;
  scope: string;
  viewing: string;
  unlocks: string;
  renewal: string;
  stripeStatus: string;
};

type LibraryResource = {
  id: string;
  title: string;
  category: string;
  format: string;
  preview: string;
  access: string;
};

type HowToGuide = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  description: string;
  action: "open" | "navigate";
  priority: "priority-1" | "priority-2" | "priority-3";
  target?: ModuleKey;
  path?: string;
};

type SnapTanfSection = {
  id: string;
  title: string;
  body: string[];
  items?: string[];
  phrases?: string[];
};

type PracticalGuide = {
  id: string;
  title: string;
  terminalLabel: string;
  intro: string;
  quickMap: string[];
  sections: SnapTanfSection[];
  systemNote?: {
    title: string;
    body: string[];
    primaryAction?: {
      label: string;
      target: ModuleKey;
      path: string;
    };
  };
};

const legalCategories: LegalCategory[] = [
  {
    id: "protective-orders",
    label: "01",
    title: "Protective Orders",
    description: "Emergency orders, civil protection orders, hearing types, filing help, and what courts may be able to grant.",
    status: "MODULE READY",
    available: true,
  },
  {
    id: "family-court",
    label: "02",
    title: "Family Court",
    description: "Custody, parenting time, support, temporary orders, motion drafting, and court prep.",
    status: "MODULE READY",
    available: true,
  },
  {
    id: "civil-court",
    label: "03",
    title: "Civil Court",
    description: "Civil filings, claims, responses, deadlines, and paperwork that is not family-court specific.",
    status: "QUEUE OPEN",
  },
  {
    id: "reporting",
    label: "04",
    title: "Reporting",
    description: "Police reports, incident documentation, advocate support, and what to ask before reporting.",
    status: "QUEUE OPEN",
  },
  {
    id: "immigration",
    label: "05",
    title: "Immigration",
    description: "Immigration-related survivor protections, documentation, referrals, and legal-aid pathways.",
    status: "QUEUE OPEN",
  },
];

const libraryCategories: LibraryCategory[] = [
  {
    id: "court-systems",
    title: "Court & Systems Navigation",
    description: "Court planners, filing trackers, protective-order prep, benefits, agencies, and appointment logs.",
    resourceCount: 8,
  },
  {
    id: "recovery",
    title: "Recovery",
    description: "Nervous-system repair, reflection tools, trauma recovery maps, relationship pattern guides, and support scripts.",
    resourceCount: 7,
  },
  {
    id: "survivor-university",
    title: "Survivor University / Economic Independence",
    description: "Work-from-home ideas, income maps, budget templates, equipment lists, digital skills, and system-building guides.",
    resourceCount: 9,
  },
  {
    id: "life-rebuilding",
    title: "Life Rebuilding",
    description: "Housing trackers, transportation logs, SNAP/contact trackers, routines, future planning, and practical rebuild tools.",
    resourceCount: 10,
  },
];

const libraryPasses: LibraryPass[] = [
  {
    id: "one-thing",
    title: "I Just Need One Thing",
    price: "Individual pricing",
    scope: "Buy one resource permanently.",
    viewing: "Preview before buying. Purchased resource remains viewable.",
    unlocks: "Includes permanent access to that one resource.",
    renewal: "No pass. No renewal.",
    stripeStatus: "Stripe product per resource",
  },
  {
    id: "focus-pass",
    title: "30-Day Focus Pass",
    price: "$4.99",
    scope: "Choose one category for 30 days.",
    viewing: "Unlimited in-browser viewing inside the selected category during the active pass.",
    unlocks: "Includes 2 Permanent Unlocks for downloads that remain available after the pass ends.",
    renewal: "Expires automatically. Renewal must be deliberately purchased again.",
    stripeStatus: "Stripe one-time product per category",
  },
  {
    id: "all-access",
    title: "30-Day All-Access Pass",
    price: "$9.99",
    scope: "Every paid library category for 30 days.",
    viewing: "Unlimited in-browser viewing across all paid categories during the active pass.",
    unlocks: "Includes 3 Permanent Unlocks for downloads that remain available after the pass ends.",
    renewal: "Expires automatically. No auto-renew subscription behavior.",
    stripeStatus: "Stripe one-time product",
  },
  {
    id: "extra-unlocks",
    title: "Add Permanent Unlocks",
    price: "$2.99 / $4.99",
    scope: "Add 1 or 2 extra download credits after checkout, when needed.",
    viewing: "Does not change pass viewing access.",
    unlocks: "Adds extra Permanent Unlock credits to the active library account.",
    renewal: "One-time credit purchase. No renewal.",
    stripeStatus: "Stripe one-time add-on products",
  },
];

const previewResources: LibraryResource[] = [
  {
    id: "court-planner",
    title: "Court Planner",
    category: "Court & Systems Navigation",
    format: "Bundle",
    preview: "Case numbers, court contacts, evidence logs, statement practice, logistics, and after-court notes.",
    access: "Included in Court Focus Pass or All-Access Pass. Permanent Unlock available.",
  },
  {
    id: "housing-tracker",
    title: "Housing Assistance Tracker",
    category: "Life Rebuilding",
    format: "Tracker",
    preview: "Applications, deadlines, caseworkers, follow-ups, waitlists, document requests, and next actions.",
    access: "Included in Life Rebuilding Focus Pass or All-Access Pass. Permanent Unlock available.",
  },
  {
    id: "snap-benefits-log",
    title: "SNAP & Benefits Contact Log",
    category: "Life Rebuilding",
    format: "Worksheet",
    preview: "Interview dates, office contacts, upload confirmations, missing documents, renewal deadlines, and notes.",
    access: "Included in Life Rebuilding Focus Pass or All-Access Pass. Permanent Unlock available.",
  },
  {
    id: "survivor-university-income-map",
    title: "Work-From-Home Income Map",
    category: "Survivor University / Economic Independence",
    format: "Guide",
    preview: "Business ideas, equipment needs, startup costs, skill ladders, scam filters, and first-offer planning.",
    access: "Included in Survivor University Focus Pass or All-Access Pass. Permanent Unlock available.",
  },
];

const howToGuides: HowToGuide[] = [
  {
    id: "snap-tanf",
    title: "How To Navigate SNAP & TANF",
    subtitle: "Food, cash assistance, interviews, documents, denials, and safe-contact planning.",
    status: "LIVE GUIDE",
    description:
      "A practical benefits-navigation guide for starting the application, asking for expedited SNAP, handling missing documents, and understanding TANF domestic violence protections.",
    action: "open",
    priority: "priority-2",
  },
  {
    id: "routine-chaos",
    title: "How To Create Routine While Life Is Chaotic",
    subtitle: "Small anchors, rest, self-care, space, creativity, and future-building when life keeps moving.",
    status: "LIVE GUIDE",
    description:
      "A stabilizing guide for creating routines that can survive disrupted days, low energy, temporary housing, grief, and rebuilding.",
    action: "open",
    priority: "priority-3",
  },
  {
    id: "live-in-your-car",
    title: "How To Live In Your Car",
    subtitle: "Vehicle readiness, storage, sleep, privacy, bathrooms, food, parking, pets, kids, and safety basics.",
    status: "LIVE GUIDE",
    description:
      "A practical harm-reduction guide for making vehicle living safer, calmer, more organized, and easier to manage.",
    action: "open",
    priority: "priority-1",
  },
  {
    id: "browser-trace-cleanup",
    title: "How To Clear Your Browser History",
    subtitle: "Reduce local history without pretending it defeats monitoring.",
    status: "PLANNING GUIDE",
    description:
      "Private browsing, browser cleanup, device caveats, and safer-device reminders for planning with fewer local traces.",
    action: "open",
    priority: "priority-1",
  },
  {
    id: "pet-safety-plan",
    title: "How To Make A Safety Plan For Your Pet",
    subtitle: "Pets, records, emergency fostering, proof of care, and pet go-bag basics.",
    status: "PLANNING GUIDE",
    description:
      "A practical guide for including pets in safety planning without pretending every option is simple or immediate.",
    action: "open",
    priority: "priority-1",
  },
  {
    id: "housing-navigation",
    title: "How To Navigate Housing",
    subtitle: "Coordinated Entry, shelters, waitlists, privacy, documents, and follow-up.",
    status: "REBUILDING GUIDE",
    description:
      "A live guide to housing systems and the many smaller doors that can sit inside the word housing.",
    action: "navigate",
    priority: "priority-2",
    target: "rebuilding",
    path: "/rebuilding",
  },
  {
    id: "go-bag-checklist",
    title: "How To Think Through A Go-Bag",
    subtitle: "A checklist-first path into the in-browser Go-Bag simulator.",
    status: "SIMULATOR GUIDE",
    description:
      "A lightweight prep guide before the simulator, built for thinking through urgent items without saving user data.",
    action: "navigate",
    priority: "priority-1",
    target: "go-bag-prep",
    path: "/go-bag-prep",
  },
];

const howToPriorities = [
  {
    id: "priority-1",
    label: "Priority 1",
    title: "Immediate Safety + First Moves",
    description:
      "Start here when the task is urgent, private, or close to the body: device traces, pets, go-bags, vehicle living, and first-step safety logistics.",
  },
  {
    id: "priority-2",
    label: "Priority 2",
    title: "Systems Navigation",
    description:
      "Use this folder for benefits, housing, coordinated entry, applications, follow-ups, and the bureaucracy that starts multiplying.",
  },
  {
    id: "priority-3",
    label: "Priority 3",
    title: "Stabilizing + Rebuilding",
    description:
      "Use this folder when the fire is a little lower and the next task is rhythm, routine, recovery, and building a life that belongs to the user again.",
  },
] satisfies Array<{
  id: HowToGuide["priority"];
  label: string;
  title: string;
  description: string;
}>;

const snapTanfSections: SnapTanfSection[] = [
  {
    id: "what-are-they",
    title: "What SNAP And TANF Are",
    body: [
      "SNAP helps eligible households buy groceries. Benefits are usually loaded onto an EBT card, which works like a debit card at approved stores.",
      "TANF may provide temporary cash assistance and support services for families with children. Each state runs its own program, so the name, rules, benefits, and requirements may be different where the user lives.",
      "SNAP and TANF can often be applied for at the same time.",
    ],
  },
  {
    id: "apply-fast",
    title: "Apply As Soon As Possible",
    body: [
      "The application can usually be started before every document is gathered. Submitting may protect the filing date, which can affect when benefits begin.",
      "Save the confirmation number, submission screenshot, application date, and copies of anything uploaded.",
      "Ask about expedited SNAP if food access is urgent or money available for food is very low.",
    ],
    phrases: ["Please screen this application for expedited SNAP."],
  },
  {
    id: "household",
    title: "Household Rules",
    body: [
      "SNAP household rules can depend on who lives together, who buys food together, who prepares meals together, marriage status, and whether children under 22 live with a parent.",
      "People at the same address may sometimes apply separately when they buy and prepare food separately. Answer honestly and let the worker apply the rules.",
    ],
    phrases: ["We live at the same address, but buy and prepare food separately."],
  },
  {
    id: "documents",
    title: "Information The Agency May Request",
    body: [
      "The agency may ask for identity, household member information, income, expenses, and TANF-specific information.",
      "Income can include pay stubs, employer statements, self-employment income, unemployment, disability benefits, Social Security, child support, or regular financial help from another person.",
      "Expenses can include rent or mortgage, utilities, childcare, dependent care, child support paid, and certain medical expenses for elderly or disabled household members.",
    ],
    items: [
      "Identity: driver's license, state ID, birth certificate, school/work ID, benefits card, or a statement from someone who knows the applicant.",
      "Household: names, dates of birth, relationships, Social Security numbers for people applying, and citizenship or immigration information when required.",
      "TANF: proof of pregnancy, proof a child lives with the applicant, school information, child-support information, work/training information, and vehicle or asset information.",
    ],
  },
  {
    id: "missing-documents",
    title: "When Documents Are Not Safely Accessible",
    body: [
      "The user may not have access to documents, accounts, mail, identification, or household records. That does not mean the application has to stop.",
      "Possible alternatives may include employer records, bank records, a landlord statement, a shelter worker, a caseworker, a school employee, a medical provider, a domestic violence advocate, or a written statement.",
      "Ask what the agency will accept and request a written list of anything still needed.",
    ],
    phrases: [
      "That document cannot be safely accessed. What else can be used to verify this?",
      "Another person controls that information, and contacting them may create risk.",
    ],
  },
  {
    id: "interview",
    title: "The Interview",
    body: [
      "Most SNAP applicants complete an interview by phone or in person. The worker may ask about household members, income, expenses, missing documents, recent changes, work requirements, or safety concerns.",
      "Keep paperwork nearby and take notes. If exact numbers are not available, estimates can be offered with verification later.",
    ],
    phrases: ["The exact amount is not available right now. An estimate can be provided, with verification afterward."],
  },
  {
    id: "dv-protections",
    title: "TANF And Domestic Violence Protections",
    body: [
      "Some TANF requirements can create safety concerns, including child-support cooperation, work requirements, appointments, address verification, residency rules, and program deadlines.",
      "Some states offer domestic violence waivers, good-cause exceptions, or modified requirements. Ask for private screening, a supervisor, a domestic violence specialist, confidential contact, alternative verification, or a modified participation plan.",
    ],
    phrases: [
      "This applicant is a domestic violence survivor and needs private screening for family violence protections and good-cause exceptions.",
      "Child-support enforcement may reveal location information or increase stalking or retaliation risk.",
      "Domestic violence is affecting safe completion of this requirement. What exemptions or modified requirements are available?",
    ],
  },
  {
    id: "safe-contact",
    title: "Create A Safe Contact Plan",
    body: [
      "Use contact information the abusive person cannot access. Ask the agency to use only the provided safe contact methods.",
      "Safety steps may include using a new password, logging out of shared devices, removing saved passwords, checking portal notifications, changing the EBT PIN, reviewing EBT transactions, and removing unsafe authorized representatives.",
    ],
    phrases: ["Please only use the contact information provided. Other contact methods may create risk."],
  },
  {
    id: "after-apply",
    title: "After Applying",
    body: [
      "Watch for interview calls, voicemails, portal messages, document requests, deadlines, and approval or denial notices.",
      "A request for more information does not mean the application was denied. If an interview is missed, call back, leave a message, send a portal message, write down the date and time, and ask to reschedule.",
    ],
  },
  {
    id: "denied-approved",
    title: "If Denied Or Approved",
    body: [
      "If denied, read the reason carefully. Common issues include missing documents, missed deadlines, incorrect income, an outdated address, the wrong household members, missing expenses, a missed interview, or a domestic violence exception that was not considered.",
      "Ask why the case was denied, what information was used, whether missing documents can still be submitted, whether the case can be reopened, the appeal deadline, how to request a hearing, and how to get a copy of the case record.",
      "After approval, review the benefit amount, issue date, reporting requirements, renewal date, TANF work requirements, and scheduled appointments. Add every deadline to a calendar.",
    ],
    phrases: ["This decision is disputed, and a hearing is requested."],
  },
];

const routineSections: SnapTanfSection[] = [
  {
    id: "daily-anchors",
    title: "Choose A Few Daily Anchors",
    body: [
      "When life feels unpredictable, routine can give the mind and body something steady to return to. It does not need to be impressive.",
      "Pick two or three things that can happen most days, wherever the user is. Keep the routine short and add more later only if it actually helps.",
    ],
    items: [
      "Drink water after waking.",
      "Take medication.",
      "Wash face or brush teeth.",
      "Eat something with protein.",
      "Check the calendar.",
      "Stretch before sleeping.",
    ],
  },
  {
    id: "rest-emotions",
    title: "Let Rest And Emotions Count",
    body: [
      "Rest is part of rebuilding. Tired can mean the system needs sleep, food, water, quiet, comfort, movement, or fewer decisions for a while.",
      "Chaos can bring grief, relief, fear, anger, numbness, confusion, or several emotions at the same time. The task is not to solve every feeling. The task is to notice what is there without turning it into a trial.",
    ],
    phrases: [
      "This makes sense after what happened.",
      "Not everything has to be understood today.",
    ],
  },
  {
    id: "morning-night",
    title: "Create Morning And Night Defaults",
    body: [
      "A morning routine can take five minutes: drink water, take medication or vitamins, open curtains or step outside, wash face, and choose one useful task.",
      "A nighttime routine tells the body the day is ending: keys in the same place, phone charging, water filled, tomorrow checked, worry list written down, and important items set out.",
    ],
    items: [
      "Useful task options: make one phone call, submit one application, gather one document, wash clothes, schedule one appointment, or rest without guilt.",
      "Keep nighttime gentle. Surviving the day already counts.",
    ],
  },
  {
    id: "self-care",
    title: "Keep Basic Self-Care Simple",
    body: [
      "Skincare and body care can create a quick moment of normalcy. A washcloth, cleanser, moisturizer, lip balm, and sunscreen can be enough.",
      "Small maintenance tasks can help create a sense of order when other parts of life feel out of control.",
    ],
    items: [
      "Trim or file nails.",
      "Brush or style hair.",
      "Wash bedding or change clothes.",
      "Clean glasses.",
      "Take care of teeth.",
      "Wash and refill a water bottle.",
    ],
  },
  {
    id: "mind-creative",
    title: "Read, Journal, Or Make Something",
    body: [
      "Reading can give the mind somewhere else to go. One page, five minutes, or one audiobook chapter counts.",
      "A journal does not have to be profound. It only needs to belong to the user. Creative routines can also help a person stay connected to themselves.",
    ],
    phrases: [
      "Today the system feels...",
      "Right now the next need is...",
      "One thing handled well was...",
      "One thing being built toward is...",
    ],
  },
  {
    id: "space-future",
    title: "Organize One Corner And One Future Step",
    body: [
      "The space matters, even when it is temporary: car, shelter, couch, hotel, one room, temporary housing, or a new apartment. One organized corner can make a space feel calmer.",
      "Planning can help remind the nervous system that the current situation is not the whole story. Start with housing, work, education, money, health, parenting, transportation, legal needs, friendships, creativity, or personal goals.",
    ],
    items: [
      "Fold clothes, organize a shelf, make a charging station, display one photo, keep books nearby, or arrange hobby supplies.",
      "Future-building can be one application, one saved document, one housing option researched, one skill learned, or one question asked.",
    ],
  },
  {
    id: "low-energy",
    title: "Build Low-Energy Versions",
    body: [
      "A routine should still work when the user is exhausted. Both the full version and low-energy version count.",
      "Missing a day does not erase the routine. Restart with the next available action without waiting for Monday, next month, or a calmer life.",
    ],
    items: [
      "Full version: shower, complete skincare, journal, clean the room, make calls, cook dinner.",
      "Low-energy version: use a washcloth, apply moisturizer, write one sentence, throw away three pieces of trash, send one email, eat something easy.",
    ],
  },
];

const carLivingSections: SnapTanfSection[] = [
  {
    id: "ready-to-move",
    title: "Keep The Car Ready To Move",
    body: [
      "The vehicle is both shelter and transportation. The driver seat, pedals, doors, seat belts, windows, and emergency brake should stay usable.",
      "Park facing the easiest exit when possible. If something feels wrong, leave. No suspicious parking lot is owed a second chance.",
    ],
    items: [
      "Driver seat empty.",
      "Keys in the same place every night.",
      "Shoes within reach.",
      "Enough gas to relocate.",
      "Important items secured while driving.",
    ],
  },
  {
    id: "storage-sleep",
    title: "Start With Cheap Storage And A Sleep Setup",
    body: [
      "Expensive vehicle-storage equipment is not required. Discount-store bins, baskets, zip bags, laundry bags, hooks, clips, and drawer organizers can make the space workable.",
      "A basic sleep setup may include a camping mattress or foam pad, sleeping bag, blanket, small pillow, clean socks, and weather-appropriate clothing.",
    ],
    items: [
      "Separate containers for food, clothing, toiletries, documents, medication, pets, electronics, trash, and laundry.",
      "Keep daily-use items closest to doors and backup supplies underneath or behind them.",
      "Dry damp bedding during the day whenever possible.",
    ],
  },
  {
    id: "privacy-bathroom",
    title: "Create Privacy And A Bathroom Plan",
    body: [
      "Privacy covers help with sleep, changing clothes, organizing, and emergencies. Test covers at night with a light on inside the car and look for gaps from outside.",
      "A bathroom plan should include several restroom options. Do not depend on one location because hours, policies, and access can change.",
    ],
    items: [
      "Cheap privacy options: towels, dark fabric, black poster board, cardboard, sunshades, curtains, or pillowcases.",
      "Bathroom kit: toilet paper, wipes, sanitizer, gloves, towel, sealable bags, cleaning spray, and a secure container for urine if needed.",
      "Restroom options: libraries, grocery stores, truck stops, recreation centers, campgrounds, rest areas, 24-hour businesses, shelters, or day centers.",
    ],
  },
  {
    id: "within-reach",
    title: "Keep Critical Items Within Reach",
    body: [
      "Important items should not require digging through the whole car at night. Documents should stay together in a waterproof pouch when possible.",
      "Photos of documents can be saved somewhere secure when that is safe to do.",
    ],
    items: [
      "Keys, phone, charger, battery bank, wallet, ID, medication, flashlight, water, shoes, jacket, glasses, emergency contacts.",
      "Pet leash and waste bags, window breaker, and seat-belt cutter if available.",
    ],
  },
  {
    id: "food-temperature",
    title: "Plan Food, Water, Temperature, And Air Safety",
    body: [
      "Choose foods that are easy to store and require little preparation. Keep a manual can opener even if most cans have pull tabs.",
      "Cars can become dangerously hot or cold. Watch weather daily and plan where the hottest or coldest hours can be spent.",
      "Never use charcoal grills, camp stoves, propane stoves, generators, candles, or fuel-burning heaters inside the vehicle. Carbon monoxide has no color or smell.",
    ],
    items: [
      "Food options: peanut butter, crackers, tortillas, tuna/chicken pouches, pull-tab cans, protein bars, nuts, dried fruit, apples, oranges, oatmeal cups, and ready-to-eat meals.",
      "Indoor options during extreme temperatures: libraries, malls, recreation centers, cooling/warming centers, day shelters, pet-friendly businesses, or trusted spaces.",
    ],
  },
  {
    id: "parking-low-profile",
    title: "Find Safer Parking And Stay Low-Profile",
    body: [
      "Parking rules vary by city. Look for places where overnight parking is clearly allowed and avoid tow-away zones, private property without permission, school property, overnight-restricted roads, trapped areas, isolated locations, and places where people approach vehicles.",
      "Finish organizing, eating, and changing locations before parking for the night when possible. Keep noise low, lights covered, belongings inside, and trash cleaned up.",
    ],
    items: [
      "Possible options: official safe-parking programs, campgrounds, designated rest areas, approved church/nonprofit lots, trusted property, or businesses that gave permission.",
      "Call 211 and ask about safe-parking programs, Coordinated Entry, day shelters, vehicle-homelessness programs, gas vouchers, showers, laundry, pet-friendly shelters, and local housing resources.",
    ],
  },
  {
    id: "car-maintenance",
    title: "Keep Up With The Car",
    body: [
      "Small vehicle problems can become housing emergencies quickly. Keep a small amount reserved for gas whenever possible.",
      "Emergency supplies can reduce the chance that one car problem becomes a crisis.",
    ],
    items: [
      "Check gas, oil, coolant, tire pressure, battery, registration, insurance, inspection requirements, and warning lights.",
      "Useful supplies: jumper cables or jump pack, tire inflator, tire-pressure gauge, basic tool kit, spare tire, roadside-assistance information, emergency water, and flashlight.",
    ],
  },
  {
    id: "pets-kids",
    title: "Plan Differently With Pets Or Children",
    body: [
      "Pets add comfort, routine, security, and extra planning. Children require a more detailed plan for temperature safety, sleep, car seats, school, food, bathrooms, privacy, childcare, medical needs, parking, documents, and keeping the vehicle ready to drive.",
      "Never leave a pet or child alone in a parked car during hot or cold weather. Cracking windows does not prevent dangerous heat, and cold vehicles can also become unsafe.",
    ],
    items: [
      "Pet planning: food, water, bowls, bedding, leash, waste bags, medication, vaccination records, grooming supplies, cleaning supplies, carrier/restraint, pet food banks, foster programs, and low-cost vet clinics.",
      "Child planning: correctly installed car seats, clear seat belts, school access, medical needs, documents, and early help from advocates or local programs.",
    ],
  },
  {
    id: "personhood",
    title: "Build Routines And Bring Something That Belongs To You",
    body: [
      "Vehicle living can involve long stretches of waiting: housing applications, benefit decisions, callbacks, court dates, paychecks, shelter openings, and transportation help.",
      "Use waiting time to build small routines that support the user. Bring one small hobby or comfort item that fits the space. The day does not have to revolve only around applications and survival paperwork.",
    ],
    items: [
      "Daily anchors: brush teeth, take medication, fill water, eat protein, clean one section of the car, charge phone, check applications, move the body, rest, and plan tomorrow's first step.",
      "Small hobby bag: crochet, knitting, drawing, journaling, reading, guitar, puzzles, photography, language learning, hand sewing, or online classes.",
    ],
  },
];

const practicalGuides: Record<string, PracticalGuide> = {
  "routine-chaos": {
    id: "routine-chaos",
    title: "How To Create Routine While Life Is Chaotic",
    terminalLabel: "LOAD GUIDE // ROUTINE WHILE LIFE IS CHAOTIC",
    intro:
      "When everything keeps changing, routine can be small enough to survive the chaos. This guide focuses on anchors, low-energy defaults, self-care, space, creativity, and future-building.",
    quickMap: ["Daily Anchors", "Rest Counts", "Low Energy", "One Corner", "Begin Again"],
    sections: routineSections,
    systemNote: {
      title: "Start With Today",
      body: [
        "No perfect schedule required. Choose one thing that cares for the body, one thing that supports the future, and one thing that helps the user feel like themselves.",
        "Do those three things as often as possible. Let familiar become steady. Let steady become the beginning of the next life.",
      ],
      primaryAction: { label: "Explore Access Library", target: "library", path: "/resources" },
    },
  },
  "live-in-your-car": {
    id: "live-in-your-car",
    title: "How To Live In Your Car",
    terminalLabel: "LOAD GUIDE // VEHICLE LIVING",
    intro:
      "Living in a car takes planning, but the space can become safer, calmer, and easier to manage. Start with movement, sleep, privacy, water, food, and a bathroom plan.",
    quickMap: ["Ready To Move", "Privacy", "Bathroom Plan", "Safe Parking", "211"],
    sections: carLivingSections,
    systemNote: {
      title: "First Car-Living Checklist",
      body: [
        "Clear the driver seat and pedals. Choose two possible parking locations. Create basic window covers. Make a sleeping area. Pack water and easy food. Create a bathroom kit.",
        "Put important documents together. Charge phone and battery pack. Check gas and tire pressure. Pack medication. Make a plan for children or pets. Call 211 for local resources. Bring something enjoyable.",
        "Everything does not have to be solved tonight. Make the car safer. Get some sleep. Take the next step tomorrow.",
      ],
      primaryAction: { label: "Open Housing Navigation", target: "rebuilding", path: "/rebuilding" },
    },
  },
};

const motionDraftingSteps: LegalStep[] = [
  {
    number: "01",
    title: "Identify Your Court And Case Type",
    text:
      'Find out which court your case lives in, such as family court, district court, or county court. The name varies by state. Then pull up that court\'s local rules. Most counties post these online, searchable as "[county name] family court local rules."',
  },
  {
    number: "02",
    title: "Get Your Case Number And Existing Orders",
    text:
      "Any motion you file has to reference your case number and connect to what is already on record: the original petition, standing orders, custody agreements, protective orders, or other existing orders. Pull these before drafting.",
  },
  {
    number: "03",
    title: "Match The Problem To The Motion",
    text:
      'Do not start with "what motion sounds right." Start with "what specifically needs the court to change or decide?" Then work backward to the motion type that matches that exact ask.',
  },
  {
    number: "04",
    title: "Check For A Required Form",
    text:
      "Some courts require a specific fillable form for certain motions. Others accept a self-drafted motion if it follows formatting rules. Check before drafting from scratch because the wrong format can get a filing rejected on sight.",
  },
];

const familyCourtMotionSections: LegalGuideSection[] = [
  {
    title: "Custody & Parenting Time",
    tag: "General Reference",
    blocks: [
      {
        title: "Common Motions",
        items: [
          {
            name: "Motion to Modify Custody",
            text: 'Requests a change to an existing custody order, usually requiring a "material change in circumstances."',
          },
          {
            name: "Motion to Modify Visitation / Parenting Time",
            text: "Requests a change to the existing schedule without changing custody itself.",
          },
          {
            name: "Emergency Motion for Custody",
            text: "Used when a child is in immediate danger. This usually has a higher bar and faster timeline than a standard modification.",
          },
          {
            name: "Motion to Enforce Custody Order",
            text: "Filed when the other party is not following the existing order.",
          },
        ],
      },
    ],
  },
  {
    title: "Protection & Safety",
    blocks: [
      {
        title: "Protective Order Filings",
        items: [
          {
            name: "Petition for Protective Order",
            text: 'The initial request. It is not technically a "motion," but it starts this type of case.',
          },
          {
            name: "Motion to Extend Protective Order",
            text: "Requests more time on an order that is set to expire.",
          },
          {
            name: "Motion to Modify Protective Order",
            text: "Requests a change to the terms, such as distance, contact, or included parties.",
          },
        ],
      },
    ],
  },
  {
    title: "Financial & Support",
    blocks: [
      {
        title: "Support Motions",
        items: [
          {
            name: "Motion to Modify Child Support",
            text: "Requests a change based on income change, custody change, or another qualifying factor.",
          },
          {
            name: "Motion for Temporary Orders",
            text: "Requests short-term rulings on support, custody, or property while the larger case is still pending.",
          },
          {
            name: "Motion to Enforce Support Order",
            text: "Filed when court-ordered payments are not being made.",
          },
        ],
      },
    ],
  },
  {
    title: "Procedural",
    blocks: [
      {
        title: "Process Motions",
        items: [
          {
            name: "Motion for Continuance",
            text: "Requests more time before a hearing or deadline.",
          },
          {
            name: "Motion to Compel",
            text: "Requests that the court order the other party to comply with something they are refusing to do, such as turning over documents or answering discovery.",
          },
          {
            name: "Motion for Contempt",
            text: "Alleges the other party is violating a court order and asks for enforcement or penalties.",
          },
        ],
      },
    ],
  },
];

const civilProtectiveOrderGuideSections: LegalGuideSection[] = [
  {
    title: "What A Civil Protective Order Can Do",
    blocks: [
      {
        title: "Common Restrictions You May Request",
        items: [
          { text: "Stop abuse, threats, stalking, harassment, sexual violence, repeated unwanted contact, and third-party contact." },
          { text: "Block contact by phone, email, text, social media, apps, shared accounts, or other digital channels." },
          { text: "Require the other person to stay away from home, work, school, childcare, named locations, children, pets, or household members." },
          { text: "Require move-out from a shared home, return of keys or documents, surrender of firearms where state law allows, or law-enforcement help retrieving belongings." },
          { text: "Address temporary custody, supervised parenting time, safe exchanges, child or spousal support, use of a shared vehicle, and other safety terms when local law allows." },
        ],
      },
      {
        title: "System Note",
        items: [
          { text: "Ask for each protection directly. A general no-contact order may not automatically cover every location, device, child, pet, account, workplace, or communication method." },
        ],
      },
    ],
  },
  {
    title: "Types Of Orders And The Usual Process",
    blocks: [
      {
        title: "Order Types",
        items: [
          { name: "Emergency Order", text: "A short-term order for urgent situations, sometimes available through law enforcement, a magistrate, an after-hours court process, or a judge." },
          { name: "Temporary / Ex Parte Order", text: "A temporary order issued before the other person has participated in a full hearing. The court usually needs recent facts and a reason immediate protection is needed." },
          { name: "Final / Long-Term Order", text: "An order issued after notice and a hearing where both sides can participate. Length depends on state law and the judge's decision." },
          { name: "Criminal No-Contact Order", text: "An order attached to a criminal case, bond, probation, or sentencing. It is separate from a civil protective order." },
        ],
      },
      {
        title: "Process Map",
        items: [
          { text: "File the petition with specific facts, dates, threats, injuries, stalking, tracking, and the protections requested." },
          { text: "Ask whether emergency or temporary protection is available." },
          { text: "The judge may grant temporary relief, grant part of it, ask for more information, set a hearing, or deny the request." },
          { text: "The respondent must usually be served with the petition, temporary order, and hearing notice." },
          { text: "Attend the full hearing with evidence, notes, witnesses, and the exact protections being requested." },
          { text: "If granted, read the signed order before leaving and confirm who is protected, which addresses are covered, contact rules, custody terms, firearm terms, expiration date, and violation reporting steps." },
        ],
      },
    ],
  },
  {
    title: "Statement, Timeline, And Evidence",
    blocks: [
      {
        title: "What To Include",
        items: [
          { text: "Focus on conduct that shows violence, threats, stalking, harassment, sexual violence, property damage, strangulation, weapon access, tracking, surveillance, repeated contact, or threats involving children, pets, work, housing, or immigration." },
          { text: "Use exact words when remembered. Explain why the conduct caused fear or created a safety concern." },
          { text: "A short timeline is often easier to follow than one long paragraph." },
        ],
      },
      {
        title: "Evidence Examples",
        items: [
          { text: "Texts, emails, voicemails, call logs, social media messages, photos, videos, medical records, police reports, witness statements, property-damage records, location-sharing records, tracking alerts, account-login notices, hidden-camera evidence, prior court orders, incident logs, or records of unwanted gifts and appearances." },
          { text: "Save original files when possible. Do not crop screenshots in a way that removes dates, usernames, phone numbers, or surrounding context." },
          { text: "Check local rules for recordings, electronic evidence, exhibit labels, filing deadlines, and required copy counts." },
        ],
      },
    ],
  },
  {
    title: "Custody, Stalking, And Digital Safety",
    blocks: [
      {
        title: "If Custody Is Involved",
        items: [
          { text: "Existing custody orders usually remain active until a judge changes them." },
          { text: "Some protective-order courts can enter temporary custody or parenting-time terms. Others require custody changes in the existing family-court case." },
          { text: "Ask whether temporary custody can be included, whether an emergency family-court motion is needed, whether cases can be coordinated, and how exchanges and communication should happen safely." },
          { text: "Bring every current custody order and protective order to both courts." },
        ],
      },
      {
        title: "Stalking And Tech Abuse",
        items: [
          { text: "Stalking may include following, watching, showing up, repeated messages, fake accounts, third-party contact, unwanted gifts, hidden cameras, GPS tracking, stalkerware, social-media monitoring, or threats to expose information." },
          { text: "Track date, time, location, what happened, exact words, witnesses, screenshots, report numbers, and how the incident affected safety." },
          { text: "Changing passwords alone may not stop access. Review shared Apple or Google accounts, phone plans, location sharing, calendars, cloud photos, email forwarding, recovery contacts, saved passwords, logged-in devices, smart-home accounts, cameras, vehicle apps, trackers, children's devices, banking, shopping, and social media sessions." },
          { text: "Use a safer device when researching or changing accounts if monitoring is possible. Before removing a tracker or stalkerware, consider whether it will alert the person, preserve evidence, and speak with an advocate or technology-safety specialist when possible." },
        ],
      },
    ],
  },
  {
    title: "Hearing Prep And What Happens Next",
    blocks: [
      {
        title: "Bring To Court",
        items: [
          { text: "Petition, temporary order, proof of service, current custody orders, written statement, short timeline, labeled exhibits, witness information, requested protections, and a proposed order if required." },
          { text: "Be ready to explain what happened, when it happened, why protection is needed, what evidence supports the request, and what the judge is being asked to order." },
          { text: "Keep answers direct. Ask for clarification before agreeing to language that is unclear." },
        ],
      },
      {
        title: "If Granted, Violated, Or Denied",
        items: [
          { text: "If granted, ask about certified copies, system entry, service, violation reporting, school or childcare copies, secure digital backup, custody terms, and the expiration date." },
          { text: "If violated, call law enforcement when safe, show the order, save evidence, write down what happened, record the report number, notify an attorney or advocate, and ask whether enforcement or contempt is appropriate." },
          { text: "If denied, ask why, whether amendment or refiling is possible, whether another hearing or order type is available, whether family court is an option, and whether legal aid or an advocate can review the filing." },
        ],
      },
    ],
  },
  {
    title: "State Rules Control The Details",
    blocks: [
      {
        title: "Confirm Locally",
        items: [
          { text: "Protective-order laws are different in every state. State law controls who can file, what conduct qualifies, which court handles the case, available relief, temporary custody, service, evidence, hearing deadlines, firearm restrictions, length, renewal, changes, and enforcement." },
          { text: "Check your state judiciary website, local court rules, courthouse self-help center, domestic violence advocate, legal aid, or a qualified attorney before filing." },
        ],
      },
    ],
  },
];

const familyCourtGuideSections: LegalGuideSection[] = [
  {
    title: "What Family Court Handles",
    blocks: [
      {
        title: "Common Case Types",
        items: [
          { text: "Divorce, legal separation, custody, parenting time or visitation, child support, spousal support, parentage or paternity, property division, protective orders, guardianship, adoption, relocation with a child, enforcement, and modification." },
          { text: "The court may be called Family Court, Domestic Relations Court, District Court, Circuit Court, Superior Court, or Probate and Family Court depending on the state." },
          { text: "Local rules, forms, procedures, and deadlines can vary by county. Always check the specific court before filing." },
        ],
      },
      {
        title: "How A Case Usually Moves",
        items: [
          { text: "A case opens when one party files a petition or complaint." },
          { text: "The other party is served and usually files an answer or response by a deadline." },
          { text: "Temporary orders may address custody, parenting time, support, property, bills, communication, or use of the home while the case is pending." },
          { text: "Information may be exchanged through discovery, and mediation, parenting classes, custody evaluations, or settlement conferences may be required." },
          { text: "The court holds a hearing or trial, the judge signs an order, and the case may return later for enforcement, modification, clarification, reconsideration, or appeal." },
        ],
      },
    ],
  },
  {
    title: "Common Filings And Motions",
    blocks: [
      {
        title: "Core Filings",
        items: [
          { name: "Petition / Complaint", text: "Opens a case and explains what the filing party wants the court to order." },
          { name: "Answer / Response", text: "The responding party's written reply." },
          { name: "Counterpetition / Counterclaim", text: "A responding party's request for orders in the same case." },
          { name: "Motion", text: "A formal request asking the judge to make a decision in an existing case. Some states use names like request for order, application, petition, or motion." },
          { name: "Affidavit / Declaration", text: "A written statement of facts made under oath or penalty of perjury." },
          { name: "Parenting Plan", text: "A proposed plan for schedule, exchanges, communication, decision-making, holidays, travel, and parenting terms." },
          { name: "Proof / Certificate Of Service", text: "Shows court papers were delivered as required." },
        ],
      },
      {
        title: "Common Motions",
        items: [
          { text: "Temporary orders, emergency or ex parte relief, modification, enforcement, contempt, clarification, continuance, compel, discovery protective order, alternative service, transfer, consolidation, guardian ad litem, custody evaluation, attorney's fees, dismissal, default, reconsideration, new trial, and appeal." },
        ],
      },
    ],
  },
  {
    title: "Terms That Show Up Everywhere",
    blocks: [
      {
        title: "Court Language",
        items: [
          { name: "Petitioner / Plaintiff", text: "The person who opens the case." },
          { name: "Respondent / Defendant", text: "The person responding to the case." },
          { name: "Moving Party / Movant", text: "The person filing a motion." },
          { name: "Pro Se / Self-Represented", text: "Handling a case without an attorney." },
          { name: "Jurisdiction", text: "The court's authority to hear a case and make orders." },
          { name: "Venue", text: "The county or location where the case is heard." },
          { name: "Service", text: "Formal delivery of court papers." },
          { name: "Docket", text: "The official list of activity in the case." },
          { name: "Order", text: "A written direction signed by the judge." },
        ],
      },
      {
        title: "Evidence And Hearing Terms",
        items: [
          { name: "Discovery", text: "The formal process used to request information before hearing or trial, including requests for production, interrogatories, admissions, depositions, and subpoenas." },
          { name: "Exhibit", text: "A document, photo, message, recording, record, or other item offered as evidence." },
          { name: "Foundation", text: "Information showing what an exhibit is, where it came from, and why it is reliable." },
          { name: "Objection", text: "A request asking the judge not to allow certain evidence, testimony, or procedures." },
          { name: "Burden Of Proof", text: "The level of proof required to establish a claim." },
          { name: "Best Interests Of The Child", text: "The state-defined factors courts consider when deciding child-related issues." },
        ],
      },
    ],
  },
  {
    title: "Custody, Support, And Interstate Issues",
    blocks: [
      {
        title: "Child-Related Terms",
        items: [
          { name: "Legal Custody", text: "Authority to make major decisions for a child." },
          { name: "Physical Custody", text: "Where the child lives and who provides daily care." },
          { name: "Parenting Time / Visitation", text: "The schedule for when a child is with each parent or another approved person." },
          { name: "Guardian Ad Litem", text: "A court-appointed person whose role is defined by state law and the appointment order." },
          { name: "Custody Evaluator", text: "A professional appointed or approved to assess parenting and custody issues." },
          { name: "Arrears", text: "Past-due child support or spousal support." },
        ],
      },
      {
        title: "Across State Lines",
        items: [
          { text: "Interstate custody cases usually involve UCCJEA rules. These help determine which state can make the first custody order, which state keeps authority, when another state may enforce an order, when emergency jurisdiction may apply, and when a case may be transferred." },
          { text: "Tell the court about every state where the child has lived, other custody cases, protective-order cases, child welfare cases, and existing custody orders." },
          { text: "Interstate child support generally uses UIFSA-based rules to determine which order controls, where enforcement happens, which state may modify an order, and how support is collected across state lines." },
        ],
      },
    ],
  },
  {
    title: "Before Filing Or Going To Hearing",
    blocks: [
      {
        title: "Before You File",
        items: [
          { text: "Check whether the correct case is being used, whether the court has jurisdiction, the exact order requested, the correct state or local form, filing fees or fee-waiver forms, signature and notarization requirements, hearing-request procedures, notice rules, service rules, deadlines, page limits, required attachments, and whether a proposed order is needed." },
          { text: "Keep a stamped or electronically accepted copy of every filing." },
          { text: "Court self-help centers may provide forms, procedural information, and referrals for self-represented parties." },
        ],
      },
      {
        title: "Before A Hearing",
        items: [
          { text: "Prepare a short explanation of what is being requested, the exact order requested, a timeline, exhibits, witness information, notes about the current order, proof of service, required financial documents, and a proposed order if required." },
          { text: "Bring enough copies for yourself, the judge, the other party, and the witness stand or clerk if local rules require it." },
          { text: "Be ready to explain what order currently exists, what happened, when it happened, what evidence supports it, what order is being requested, and why it meets the legal standard." },
        ],
      },
    ],
  },
  {
    title: "Orders Remain In Effect",
    blocks: [
      {
        title: "Do Not Treat A Verbal Agreement Like A Signed Order",
        items: [
          { text: "Follow the current signed order until the court changes it, a higher court changes it, the order expires, or the order states that it ends after a specific event." },
          { text: "A verbal agreement usually does not replace a signed court order." },
          { text: "File for enforcement when the existing order is not being followed. File for modification when the order needs to change." },
        ],
      },
      {
        title: "Court Planner Connection",
        items: [
          { text: "Subscribers have access to the Court Planner for case information, court dates, filing deadlines, motions, service attempts, evidence, witnesses, requested orders, hearing preparation, and follow-up tasks." },
        ],
      },
    ],
  },
];

const civilProtectiveOrderGuide: LegalGuidePageData = {
  title: "Civil Protective Order Guide",
  eyebrow: "Legal // Protective Orders",
  terminalLabel: "user@survivor-os:~$ LOAD GUIDE // CIVIL PROTECTIVE ORDER",
  intro:
    "A civil protective order is a court order that can place restrictions on someone who has abused, threatened, stalked, harassed, or sexually assaulted another person. The exact name, eligibility rules, forms, evidence rules, and available protections depend on state law.",
  warning:
    "This is general education, not legal advice. Protective-order rules are different in every state and sometimes every county. Confirm local rules with the court, legal aid, a domestic violence advocate, or a licensed attorney before filing.",
  sections: civilProtectiveOrderGuideSections,
  notes: [
    {
      title: "Names Change By State",
      body:
        "You may see protective order, order of protection, restraining order, domestic violence restraining order, protection from abuse order, civil harassment order, stalking protection order, or injunction for protection.",
    },
    {
      title: "Use The Court Planner",
      body:
        "Subscribers have access to court-planning resources for case overview, dates, deadlines, evidence, witnesses, requested protections, pre-court prep, after-court notes, follow-up tasks, and expiration-date tracking.",
    },
  ],
  reminder: {
    title: "Permission Protocol",
    body:
      "Wanting protection and feeling afraid of the process can both be true. Court can be intimidating. Preparation is not overreacting. It is the system choosing not to walk in blind.",
  },
};

const familyCourtGuide: LegalGuidePageData = {
  title: "Family Court Guide",
  eyebrow: "Legal // Family Court",
  terminalLabel: "user@survivor-os:~$ LOAD GUIDE // FAMILY COURT",
  intro:
    "Family court is a system with rules, deadlines, forms, vocabulary, power, and paperwork. This guide is a general map of what family court may handle, how cases usually move, what filings and motions mean, and how to prepare before asking the court for something.",
  warning:
    "This is general education, not legal advice. Family court rules are different in every state and may vary by county. Review your state judiciary website, local rules, court forms, filing procedures, and deadlines before submitting anything.",
  sections: familyCourtGuideSections,
  notes: [
    {
      title: "Local Names Matter",
      body:
        "Custody, parenting time, motions, petitions, requests for order, conservatorship, and other terms may change by state. Use this guide to understand the category, then confirm the exact local label.",
    },
    {
      title: "Self-Represented Does Not Mean Unprepared",
      body:
        "Courts see self-represented filers every day. The goal is not to sound like a lawyer. The goal is to be clear about the current order, what happened, what is being requested, and what evidence supports the request.",
    },
  ],
  reminder: {
    title: "System Rule",
    body:
      "The signed order is the operating rule until the court changes it. If the order is not being followed, think enforcement. If the order needs to change, think modification.",
  },
};

const housingGuideSections: RebuildingGuideSection[] = [
  {
    id: "coordinated-entry",
    label: "START HERE",
    title: "Coordinated Entry",
    body: [
      "Housing is the hardest part of rebuilding. It can feel impossible because everything else seems to depend on it. The good news: there are more options than most people know about, and there is a system designed specifically to connect people in crisis to housing resources.",
      "Coordinated Entry is a federally mandated system that exists in every county in the United States. It was created by HUD to help people experiencing housing crises connect to the right resources without having to call twenty different places and tell their story twenty times.",
    ],
    items: [
      "It screens for available housing resources in your area at once.",
      "It connects people to emergency shelter, transitional housing, rapid rehousing programs, and permanent supportive housing depending on the situation.",
      "DV survivors may receive priority status in some Coordinated Entry systems. Ask specifically about this.",
      "A shelter advocate may be able to submit the Coordinated Entry assessment on your behalf. Ask about this early.",
    ],
  },
  {
    id: "access",
    label: "ACCESS POINTS",
    title: "How To Access Coordinated Entry",
    body: [
      "The access point varies by county, but the first few doors are usually the same. The point is to get into the system early, even if you are not ready to move today.",
      "Waitlists are real. Getting assessed sooner matters because the clock on your waitlist position usually starts when you apply, not when you suddenly need housing.",
    ],
    items: [
      "Call 211. This is often the fastest route to your local Coordinated Entry access point.",
      'Search "Coordinated Entry" plus your county name to find the local system directly.',
      "Ask a DV shelter advocate. They often work with Coordinated Entry and can help you navigate it faster.",
      "Expect a standardized assessment such as VI-SPDAT or a similar local tool. Answer honestly because it affects priority level.",
      "Follow up regularly after assessment. Do not assume silence means no movement.",
    ],
  },
  {
    id: "hud-rights",
    label: "HUD / RIGHTS",
    title: "Federal Housing Programs And Protections",
    body: [
      "Some housing options are connected to HUD programs. Availability changes by area, but knowing the language can help you ask clearer questions.",
      "Legal protections can also matter. Under VAWA, survivors have specific housing rights in federally assisted housing. A legal advocate can help translate what those rights mean in your state and situation.",
    ],
    items: [
      "Rapid Rehousing may cover move-in costs, security deposits, and short-term rent assistance, often with case management.",
      "Emergency Housing Vouchers may cover a portion of private-market rent for survivors of domestic violence, dating violence, sexual assault, and stalking, depending on availability.",
      "Landlords in federally assisted housing cannot evict you because of DV-related incidents alone.",
      "You may be able to break a lease early without penalty when fleeing DV. Ask a legal advocate.",
      "In some cases, the abusive person can be removed from a shared lease without you losing housing.",
    ],
  },
  {
    id: "community",
    label: "CAST A WIDE NET",
    title: "Community Resources",
    body: [
      "Housing help is not only one door. It can be churches, community action agencies, transitional programs, 211 navigators, and local nonprofits that know the hidden resource map better than Google does.",
      "Some options will not be a fit. Some will have requirements. That does not mean you failed. It means you are gathering doors.",
    ],
    items: [
      "Faith communities may have emergency funds, housing ministries, or connections to affordable rentals. Most do not require you to share their beliefs to receive help.",
      "Catholic Charities, Lutheran Social Services, Jewish Family Services, YWCA programs, and local missions may offer housing support or referrals.",
      "Ask about requirements upfront, including religious programming, children, pets, accessibility, and length of stay.",
      "Community Action Agencies can sometimes help with deposits, first month's rent, utilities, and referrals.",
      "Call or text 211, or visit 211.org, for local housing, utility, food, and financial assistance listings.",
    ],
  },
  {
    id: "organized",
    label: "TRACK EVERYTHING",
    title: "The Part Nobody Talks About",
    body: [
      "Navigating housing assistance means tracking applications, deadlines, callback numbers, caseworker names, document requirements, and follow-up dates across multiple programs while also rebuilding your life. It is a lot.",
      "Staying organized is not a personality trait. It is a survival skill. Write everything down when it is safe to do so.",
    ],
    items: [
      "Program name and contact information for every application.",
      "Date applied, confirmation numbers, and case numbers.",
      "Caseworker or contact person names.",
      "Required documents and whether each one has been submitted.",
      "Follow-up dates and deadlines for recertification or renewal.",
      "Utility assistance, SNAP, Medicaid, TANF, transportation, and other benefits applications.",
    ],
  },
  {
    id: "subscriber-tools",
    label: "SUBSCRIBER TOOLS",
    title: "When You Are Ready To Go Deeper",
    body: [
      "Once you have some privacy back and a space to plan from, staying on top of housing applications, utility assistance, and benefits can feel overwhelming.",
      "Subscribers have access to dedicated trackers built specifically for this stage of the process, designed to keep everything in one place so nothing falls through the cracks.",
    ],
    items: [
      "Housing Assistance Tracker for applications, deadlines, caseworkers, and follow-up.",
      "Utility Assistance Tracker for LIHEAP, local programs, and utility account status.",
      "Benefits Assistance Tracker for SNAP, Medicaid, TANF, and other benefits.",
      "Local resource category pages for the programs, offices, and organizations worth tracking.",
    ],
  },
];

const moduleRoutes: Record<ModuleKey, { label: string; path: string }> = {
  home: { label: "Home", path: "/" },
  "am-i-crazy": { label: "Am I Crazy", path: "/am-i-crazy" },
  "go-bag-prep": { label: "Go-Bag Prep", path: "/go-bag-prep" },
  planning: { label: "Prep / First Steps", path: "/planning" },
  rebuilding: { label: "Rebuilding", path: "/rebuilding" },
  "local-help": { label: "Resources", path: "/resources" },
  "how-to": { label: "Resources", path: "/resources" },
  legal: { label: "Resources", path: "/resources" },
  library: { label: "Resources", path: "/resources" },
  access: { label: "Resources", path: "/resources/access" },
};

const allNavTargets: Array<{ key: ModuleKey; label: string; path: string }> = [
  { key: "home", ...moduleRoutes.home },
  { key: "am-i-crazy", label: "Am I Crazy", path: "/am-i-crazy" },
  { key: "go-bag-prep", label: "Go-Bag Prep", path: "/go-bag-prep" },
  { key: "planning", ...moduleRoutes.planning },
  { key: "rebuilding", ...moduleRoutes.rebuilding },
  { key: "local-help", ...moduleRoutes["local-help"] },
  { key: "how-to", ...moduleRoutes["how-to"] },
  { key: "legal", ...moduleRoutes.legal },
  { key: "library", ...moduleRoutes.library },
  { key: "access", ...moduleRoutes.access },
];

const navItems: Array<{ key: ModuleKey; label: string; path: string; decoded: string }> = [
  { key: "planning", label: "Ctrl+Esc", path: "/planning", decoded: "Prep / First Steps" },
  { key: "rebuilding", label: "Ctrl+Shift", path: "/rebuilding", decoded: "Rebuilding" },
  { key: "local-help", label: "Ctrl+Fn", path: "/resources", decoded: "Resources" },
];

function navItemFor(key: ModuleKey) {
  const route = moduleRoutes[key] ?? moduleRoutes.home;
  return { key, ...route };
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    prompt:
      "When you tell this person that something they did hurt, frightened, or upset you, what usually happens?",
    answers: [
      {
        id: "1a",
        label: "They listen, take me seriously, and try to understand.",
        responseTitle: "ALL SYSTEMS CLEAR",
        response:
          "Concern submitted. Concern acknowledged. No reality rewrite, punishment sequence, or personality trial detected. Healthy conflict protocol appears functional.",
      },
      {
        id: "1b",
        label: "They say it never happened or that I misunderstood.",
        responseTitle: "GASLIGHTING DETECTED",
        response:
          "Your lived experience has been submitted for unauthorized deletion. They do not receive administrator privileges over your memory simply because the facts are inconvenient.",
        pattern: "Gaslighting or reality rewriting",
      },
      {
        id: "1c",
        label: "They say I am too sensitive, dramatic, or crazy.",
        responseTitle: "REACTION DEFLECTION DETECTED",
        response:
          "Your response has been placed on trial while their behavior quietly exits through a side door. Too sensitive is not troubleshooting. It is avoidance wearing a cheap disguise.",
        pattern: "Reaction deflection",
      },
      {
        id: "1d",
        label: "The conversation becomes an investigation into everything I have ever done wrong.",
        responseTitle: "BLAME REDIRECTION ACTIVE",
        response:
          "One concern entered. Your entire personality archive was returned. Accountability has been rerouted away from the source.",
        pattern: "Blame redirection",
      },
      {
        id: "1e",
        label: "They become angry, threatening, or punish me later.",
        responseTitle: "RETALIATION PROTOCOL DETECTED",
        response:
          "Humor suspended. When honesty triggers threats, punishment, or fear, safe communication conditions are unavailable.",
        pattern: "Retaliation or threat response",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "Do you change your behavior because you are trying to prevent their reaction?",
    answers: [
      {
        id: "2a",
        label: "Rarely. I generally feel free to make ordinary choices.",
        responseTitle: "AUTONOMY ONLINE",
        response:
          "Ordinary decisions do not require permission, advance warning, or consultation with the Threat Forecasting Department. Personal choice appears operational.",
      },
      {
        id: "2b",
        label: "Sometimes, mainly during specific disagreements.",
        responseTitle: "NORMAL CONFLICT LOAD",
        response:
          "Some adjustment detected. Current level may be ordinary compromise, provided it does not begin consuming the rest of your operating system.",
      },
      {
        id: "2c",
        label: "Often. I calculate how they might react before I do ordinary things.",
        responseTitle: "REACTION-PREDICTION SOFTWARE RUNNING",
        response:
          "Your brain is calculating another person's response before ordinary actions. That may be a survival adaptation, not evidence that you are overthinking.",
        pattern: "Reaction prediction",
      },
      {
        id: "2d",
        label: "Almost constantly. I feel like I am navigating an emotional minefield.",
        responseTitle: "BACKGROUND THREAT SCAN: CONSTANT",
        response:
          "System resources are being redirected toward preventing another person's reaction. Walking on eggshells is continuous threat management, not a quirky relationship dynamic.",
        pattern: "Constant threat management",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "When something goes wrong, who usually ends up taking responsibility?",
    answers: [
      {
        id: "3a",
        label: "We both take responsibility when appropriate.",
        responseTitle: "ACCOUNTABILITY MODULE ONLINE",
        response:
          "Both parties can acknowledge impact without crashing, retaliating, or launching counterclaims. Repair capacity detected.",
      },
      {
        id: "3b",
        label: "Usually me, even when I raised the original concern.",
        responseTitle: "BLAME REVERSAL DETECTED",
        response: "You reported the malfunction. You were assigned responsibility for causing the malfunction. Logic failure confirmed.",
        pattern: "Blame reversal",
      },
      {
        id: "3c",
        label: "They apologize, but the same behavior keeps happening.",
        responseTitle: "APOLOGY RECEIVED - UPDATE NOT INSTALLED",
        response:
          "Correct words detected. Behavioral patch missing. System will not classify repeated apologies as change without performance updates.",
        pattern: "Repeated apology without change",
      },
      {
        id: "3d",
        label: "The conversation becomes so confusing that the original issue disappears.",
        responseTitle: "CHAOS INJECTION DETECTED",
        response:
          "Original concern entered. Conversation expanded, fragmented, looped, and expired without resolution. Accountability escaped through excessive confusion.",
        pattern: "Confusion blocking accountability",
      },
    ],
  },
  {
    prompt: "How safe do you feel disagreeing with them or saying no?",
    answers: [
      {
        id: "4a",
        label: "Safe. They may disagree, but they respect my answer.",
        responseTitle: "BOUNDARY SYSTEM FUNCTIONING",
        response: "Disagreement detected. Override attempt not detected. Your right to make a decision remains intact.",
      },
      {
        id: "4b",
        label: "Uncomfortable, but not afraid.",
        responseTitle: "MINOR CONFLICT LOAD",
        response:
          "Discomfort is not automatically danger. System recommends checking whether the tension comes from disagreement or anticipation of consequences.",
      },
      {
        id: "4c",
        label: "I carefully manage my words, tone, timing, and expression.",
        responseTitle: "MESSAGE DELIVERY REQUIRES 47 SAFETY CHECKS",
        response:
          "Tone calibrated. Timing optimized. Face neutralized. Vocabulary softened beyond recognition. Receiving system appears unstable.",
        pattern: "Careful self-editing for safety",
      },
      {
        id: "4d",
        label: "They pressure, guilt, punish, or wear me down until I give in.",
        responseTitle: "BATTERY-DRAIN OVERRIDE ATTEMPT",
        response: "Pressure continues until resistance shuts down. Exhaustion is not consent. Surrender is not mutual agreement.",
        pattern: "Pressure or coercive override",
      },
      {
        id: "4e",
        label: "I am afraid of what they might do.",
        responseTitle: "FEAR RESPONSE ACTIVATED",
        response:
          "Humor suspended. Fear changes whether silence, agreement, cooperation, and consent are genuinely voluntary. Signal is valid.",
        pattern: "Fear response",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "Has your world become smaller since this relationship began?",
    answers: [
      {
        id: "5a",
        label: "No. I still have access to my people, interests, privacy, and choices.",
        responseTitle: "EXTERNAL CONNECTIONS ONLINE",
        response:
          "Friends, interests, identity, and independent choices remain available. Relationship has not consumed the full operating system.",
      },
      {
        id: "5b",
        label: "Some parts of my life faded, but I am not sure how.",
        responseTitle: "LIFE CONTRACTION DETECTED",
        response:
          "No dramatic shutdown found. Loss appears gradual: one cancelled plan, abandoned interest, or exhausting argument at a time.",
        pattern: "Gradual life contraction",
      },
      {
        id: "5c",
        label: "They create conflict around friends, family, work, or hobbies.",
        responseTitle: "ISOLATION SEQUENCE RUNNING",
        response: "Outside connection detected. Conflict automatically generated. Independence is being made expensive.",
        pattern: "Isolation sequence",
      },
      {
        id: "5d",
        label: "I feel isolated and increasingly dependent on them.",
        responseTitle: "SUPPORT NETWORK SEVERELY RESTRICTED",
        response:
          "Perspective, resources, and alternatives are increasingly offline. One person's version of reality now holds elevated permissions. Convenient for them. Catastrophic for user clarity.",
        pattern: "Restricted support network",
      },
    ],
  },
  {
    prompt: "How much control do you have over money, transportation, communication, and everyday resources?",
    answers: [
      {
        id: "6a",
        label: "I have meaningful access and can make ordinary decisions.",
        responseTitle: "RESOURCE ACCESS ONLINE",
        response:
          "User can meet ordinary needs without requesting authorization from the Department of Absolutely Not Their Business.",
      },
      {
        id: "6b",
        label: "Access is shared fairly.",
        responseTitle: "SHARED ACCESS VERIFIED",
        response: "Information, resources, and decision-making appear mutually available. Shared system functioning as advertised.",
      },
      {
        id: "6c",
        label: "They question, monitor, or criticize how I use resources.",
        responseTitle: "RESOURCE SURVEILLANCE DETECTED",
        response:
          "Routine action submitted. Budget hearing and character evaluation unexpectedly attached. Control may be masquerading as responsibility.",
        pattern: "Resource surveillance",
      },
      {
        id: "6d",
        label: "They control access to money, keys, transportation, phones, medication, or necessities.",
        responseTitle: "RESOURCE CONTROL ACTIVE",
        response:
          "Food, transportation, healthcare, communication, housing, or exit options may depend on another person's permission. This is control with real-world hardware.",
        pattern: "Resource control",
        safetyFocused: true,
      },
      {
        id: "6e",
        label: "They have used my identity, credit, accounts, or property without meaningful agreement.",
        responseTitle: "IDENTITY MISUSE DETECTED",
        response: "Your name, credit, accounts, and property are not complimentary system resources. Potential financial abuse flagged.",
        pattern: "Identity or financial misuse",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "How much privacy do you have?",
    answers: [
      {
        id: "7a",
        label: "We respect each other's messages, belongings, location, and accounts.",
        responseTitle: "PRIVACY SETTINGS FUNCTIONING",
        response: "Trust does not require permanent administrator access to another adult. System functioning normally.",
      },
      {
        id: "7b",
        label: "They expect passwords or unrestricted access.",
        responseTitle: "UNAUTHORIZED ADMIN ACCESS REQUESTED",
        response: "Surveillance request detected wearing an intimacy costume. Total access is not proof of trust.",
        pattern: "Unauthorized access pressure",
      },
      {
        id: "7c",
        label: "They check my messages, location, call history, or belongings.",
        responseTitle: "MONITORING MODE ACTIVE",
        response:
          "The expectation of being watched can restrict behavior even when no rule is spoken aloud. Surveillance becomes the rule.",
        pattern: "Monitoring behavior",
        safetyFocused: true,
      },
      {
        id: "7d",
        label: "I believe they may be tracking, recording, or monitoring me.",
        responseTitle: "POSSIBLE DEVICE EXPOSURE",
        response:
          "Use caution. Consider using a safer device or account before researching plans, changing passwords, downloading files, or contacting support.",
        pattern: "Possible device exposure",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "Do the relationship rules apply equally?",
    answers: [
      {
        id: "8a",
        label: "Yes. Expectations are generally mutual.",
        responseTitle: "MUTUAL STANDARDS VERIFIED",
        response: "Nobody appears to have secretly upgraded themselves to premium relationship permissions.",
      },
      {
        id: "8b",
        label: "Not always, but we can discuss and correct the mismatch.",
        responseTitle: "MINOR STANDARD MISMATCH",
        response: "Uneven expectation detected. Correction remains possible if discussion produces an actual update.",
      },
      {
        id: "8c",
        label: "They can do things I would be punished for doing.",
        responseTitle: "DOUBLE-STANDARD PROTOCOL RUNNING",
        response: "One user receives unrestricted access. The other receives penalties for identical behavior. Hierarchy confirmed.",
        pattern: "Double standards",
      },
      {
        id: "8d",
        label: "The rules change depending on what benefits them.",
        responseTitle: "GOALPOST LOCATION: UNKNOWN",
        response: "Rules change according to current advantage. Stable compliance is impossible under standards designed to move.",
        pattern: "Moving goalposts",
      },
    ],
  },
  {
    prompt: "What happens after a serious incident?",
    answers: [
      {
        id: "9a",
        label: "Harm is acknowledged, responsibility is accepted, and behavior changes.",
        responseTitle: "REPAIR PROTOCOL COMPLETE",
        response: "Harm acknowledged. Responsibility accepted. Behavior changed. No loophole or smoke machine required.",
      },
      {
        id: "9b",
        label: "They apologize and become intensely loving.",
        responseTitle: "LOVE-BOMBING LEVELS SUSPICIOUSLY HIGH",
        response: "Post-incident affection spike detected. System requests long-term performance data before classifying this as repair.",
        pattern: "Post-incident affection spike",
      },
      {
        id: "9c",
        label: "They blame stress, alcohol, trauma, work, or someone else.",
        responseTitle: "EXCUSE DATABASE FULL",
        response: "Stress. Alcohol. Trauma. Work. Childhood. Weather. Mercury retrograde. Explanation capacity exceeded. Responsibility remains pending.",
        pattern: "Excuse shifting",
      },
      {
        id: "9d",
        label: "They act like nothing happened.",
        responseTitle: "INCIDENT DELETED FROM THEIR SYSTEM ONLY",
        response: "Event appears erased from their active memory. Event remains fully installed in your nervous system. Reality sync failed.",
        pattern: "Incident erasure",
      },
      {
        id: "9e",
        label: "The same cycle keeps repeating.",
        responseTitle: "REPEATING LOOP DETECTED",
        response: "Harm. Apology. Calm. Hope. Repeat. Same program. New loading screen.",
        pattern: "Repeating harm cycle",
      },
    ],
  },
  {
    prompt: "If nothing changed and the relationship stayed exactly like this for another year, how would you feel?",
    answers: [
      {
        id: "10a",
        label: "Generally okay. The problems feel workable.",
        responseTitle: "FUTURE SYSTEM STATUS: WORKABLE",
        response:
          "Repair may be possible when both users acknowledge harm, accept responsibility, and install lasting behavioral updates.",
      },
      {
        id: "10b",
        label: "Sad, depleted, or trapped.",
        responseTitle: "FUTURE PROJECTION: DEPLETION",
        response:
          "Forecast returned exhaustion, sadness, and restricted movement. Future user may be reporting what present survival mode has not had capacity to process.",
        pattern: "Future depletion",
      },
      {
        id: "10c",
        label: "Afraid things would become worse.",
        responseTitle: "ESCALATION FORECAST DETECTED",
        response: "Fear of worsening conditions may be based on patterns already running. System recommends taking this forecast seriously.",
        pattern: "Escalation forecast",
        safetyFocused: true,
      },
      {
        id: "10d",
        label: "I cannot imagine surviving another year like this.",
        responseTitle: "DISTRESS LEVEL: CRITICAL",
        response:
          "Humor suspended. You do not have to solve your entire future tonight. This level of suffering deserves support and real options.",
        pattern: "Critical distress",
        safetyFocused: true,
      },
      {
        id: "10e",
        label: "I still genuinely do not know.",
        responseTitle: "FUTURE DATA UNAVAILABLE",
        response: "Forecasting capacity may currently be occupied by surviving today. No forced conclusion required.",
      },
    ],
  },
];

const assessmentGaugeEffects: Record<string, AssessmentGaugeEffect> = {
  "1a": { autonomy: 4, danger: -2, reality: 6, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "1b": { autonomy: -3, danger: 2, reality: -14, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "1c": { autonomy: -4, danger: 3, reality: -12, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "1d": { autonomy: -5, danger: 4, reality: -10, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "1e": { autonomy: -10, danger: 18, reality: -8, emphasis: "danger", notice: "PREPAREDNESS CHECK REQUIRED.", minDanger: 21 },
  "2a": { autonomy: 5, danger: -2, reality: 3, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "2b": { autonomy: -1, danger: 2, reality: 0, emphasis: "danger", notice: "CONFLICT LOAD REGISTERED." },
  "2c": { autonomy: -10, danger: 9, reality: -3, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "2d": { autonomy: -16, danger: 16, reality: -5, emphasis: "danger", notice: "PREPAREDNESS CHECK REQUIRED.", minDanger: 21 },
  "3a": { autonomy: 3, danger: -2, reality: 6, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "3b": { autonomy: -7, danger: 3, reality: -10, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "3c": { autonomy: -5, danger: 5, reality: -5, emphasis: "danger", notice: "REPEATING CYCLE PRESSURE DETECTED." },
  "3d": { autonomy: -4, danger: 3, reality: -13, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "4a": { autonomy: 8, danger: -4, reality: 3, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "4b": { autonomy: -2, danger: 3, reality: 0, emphasis: "danger", notice: "CONFLICT LOAD REGISTERED." },
  "4c": { autonomy: -10, danger: 10, reality: -2, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "4d": { autonomy: -15, danger: 15, reality: -4, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "4e": { autonomy: -18, danger: 24, reality: -5, emphasis: "danger", notice: "PREPAREDNESS SIGNAL LOW.", minDanger: 46 },
  "5a": { autonomy: 6, danger: -2, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "5b": { autonomy: -5, danger: 2, reality: -3, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "5c": { autonomy: -12, danger: 8, reality: -4, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "5d": { autonomy: -18, danger: 12, reality: -7, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "6a": { autonomy: 8, danger: -3, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "6b": { autonomy: 5, danger: -2, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "6c": { autonomy: -10, danger: 8, reality: -4, emphasis: "autonomy", notice: "RESOURCE CONTROL SIGNAL DETECTED." },
  "6d": { autonomy: -20, danger: 18, reality: -5, emphasis: "danger", notice: "PREPAREDNESS SIGNAL LOW.", minDanger: 46 },
  "6e": { autonomy: -16, danger: 14, reality: -7, emphasis: "danger", notice: "PREPAREDNESS SIGNAL LOW.", minDanger: 46 },
  "7a": { autonomy: 7, danger: -3, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "7b": { autonomy: -8, danger: 7, reality: -3, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "7c": { autonomy: -14, danger: 13, reality: -4, emphasis: "autonomy", notice: "MONITORING SIGNAL DETECTED.", minDanger: 21 },
  "7d": { autonomy: -18, danger: 24, reality: -5, emphasis: "danger", notice: "POSSIBLE DEVICE EXPOSURE.", minDanger: 46 },
  "8a": { autonomy: 4, danger: -2, reality: 5, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "8b": { autonomy: 0, danger: 0, reality: 1, emphasis: "reality", notice: "STANDARD MISMATCH LOGGED." },
  "8c": { autonomy: -9, danger: 5, reality: -8, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "8d": { autonomy: -8, danger: 5, reality: -12, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9a": { autonomy: 5, danger: -5, reality: 6, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "9b": { autonomy: -4, danger: 7, reality: -5, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9c": { autonomy: -3, danger: 5, reality: -7, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9d": { autonomy: -4, danger: 6, reality: -10, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9e": { autonomy: -8, danger: 13, reality: -8, emphasis: "danger", notice: "PREPAREDNESS CHECK REQUIRED.", minDanger: 21 },
  "10a": { autonomy: 3, danger: -3, reality: 3, emphasis: "autonomy", notice: "FUTURE STATUS WORKABLE." },
  "10b": { autonomy: -10, danger: 8, reality: 2, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "10c": { autonomy: -8, danger: 16, reality: 3, emphasis: "danger", notice: "ESCALATION FORECAST DETECTED.", minDanger: 21 },
  "10d": { autonomy: -12, danger: 24, reality: 2, emphasis: "danger", notice: "DISTRESS LEVEL CRITICAL.", minDanger: 71 },
  "10e": { autonomy: -2, danger: 2, reality: -2, emphasis: "reality", notice: "FUTURE DATA UNAVAILABLE." },
};

const exitPlanningQuestions: ExitQuestion[] = [
  {
    phase: "PHASE 1 - IMMEDIATE CONDITIONS",
    prompt: "Are you currently in immediate danger, or do you believe something may happen very soon?",
    answers: [
      {
        id: "ep1a",
        label: "No. I have time to think and plan.",
        responseTitle: "PLANNING WINDOW DETECTED",
        response: "Time appears available. System will focus on preparation, reducing exposure, and creating backup options before conditions change.",
        effect: { readiness: 8, exposure: -4, backup: 4, emphasis: "readiness", notice: "PLANNING WINDOW DETECTED." },
      },
      {
        id: "ep1b",
        label: "I am not sure.",
        responseTitle: "CONDITIONS UNCLEAR",
        response: "Uncertainty may mean the environment is unpredictable. System will continue cautiously and include an emergency backup plan.",
        effect: { readiness: 2, exposure: 8, backup: 6, emphasis: "exposure", notice: "EXPOSURE LEVEL ELEVATED." },
      },
      {
        id: "ep1c",
        label: "Things are escalating, but I am not in immediate danger right now.",
        responseTitle: "ESCALATION DETECTED",
        response: "Humor suspended. System will prioritize speed, safer communication, transportation, and emergency alternatives.",
        effect: { readiness: 4, exposure: 18, backup: 8, emphasis: "exposure", notice: "EXPOSURE LEVEL HIGH.", minExposure: 46 },
      },
      {
        id: "ep1d",
        label: "Yes. I may need to leave very soon.",
        responseTitle: "EXIT WINDOW MAY BE LIMITED",
        response: "Humor suspended. System will skip nonessential planning and identify the fastest available route to a safer location.",
        effect: { readiness: 5, exposure: 24, backup: 12, emphasis: "exposure", notice: "URGENT EXIT CONDITIONS LOGGED.", minExposure: 46 },
      },
      {
        id: "ep1e",
        label: "Yes. I need emergency help now.",
        responseTitle: "IMMEDIATE SAFETY MODE ACTIVATED",
        response: "Humor suspended. If contacting emergency services is safe and appropriate, use local emergency services. If calling is not safe, consider moving toward a public or populated location, contacting a trusted person, or using a safer device.",
        effect: { readiness: 0, exposure: 35, backup: 14, emphasis: "exposure", notice: "IMMEDIATE SAFETY MODE ACTIVE.", minExposure: 71 },
      },
    ],
  },
  {
    phase: "PHASE 1 - RETALIATION FORECAST",
    prompt: "What do you believe this person may do if they realize you are preparing to leave?",
    answers: [
      {
        id: "ep2a",
        label: "They may be upset, but I do not expect retaliation.",
        responseTitle: "LOW RETALIATION EXPECTATION",
        response: "Preparation may still be useful. System will continue without assuming cooperation.",
        effect: { readiness: 5, exposure: -4, backup: 3, emphasis: "readiness", notice: "RETALIATION EXPECTATION LOW." },
      },
      {
        id: "ep2b",
        label: "They may pressure, guilt, manipulate, or promise to change.",
        responseTitle: "EMOTIONAL OVERRIDE ATTEMPT ANTICIPATED",
        response: "Possible incoming commands include promises to change, guilt, blame, or one more chance. Promises made after loss of control is detected are not automatically software updates.",
        effect: { readiness: 2, exposure: 10, backup: 4, emphasis: "exposure", notice: "EXPOSURE LEVEL ELEVATED." },
      },
      {
        id: "ep2c",
        label: "They may interfere with money, transportation, housing, work, or communication.",
        responseTitle: "RESOURCE INTERFERENCE POSSIBLE",
        response: "Access may become restricted. System will prioritize independent access and backup routes.",
        effect: { readiness: -4, exposure: 18, backup: 8, emphasis: "exposure", notice: "RESOURCE INTERFERENCE POSSIBLE.", minExposure: 46 },
      },
      {
        id: "ep2d",
        label: "They may monitor, follow, threaten, expose, or punish me.",
        responseTitle: "HIGH-RISK RETALIATION PATTERN",
        response: "Humor suspended. Planning may need to occur through a safer device, safer account, trusted person, or location outside the other person's access.",
        effect: { readiness: -5, exposure: 26, backup: 10, emphasis: "exposure", notice: "HIGH-RISK RETALIATION PATTERN.", minExposure: 46 },
      },
      {
        id: "ep2e",
        label: "They may harm me, themselves, children, pets, family members, or property.",
        responseTitle: "SEVERE RETALIATION RISK",
        response: "Humor suspended. Threats involving harm, weapons, stalking, forced confinement, children, pets, or self-harm require a more cautious plan. System will build an emergency route before continuing.",
        effect: { readiness: -6, exposure: 35, backup: 16, emphasis: "exposure", notice: "SEVERE RETALIATION RISK.", minExposure: 71 },
      },
      {
        id: "ep2f",
        label: "I genuinely do not know what they may do.",
        responseTitle: "BEHAVIORAL FORECAST UNAVAILABLE",
        response: "Unpredictability is itself relevant data. System will not assume a calm response.",
        effect: { readiness: 0, exposure: 14, backup: 8, emphasis: "exposure", notice: "UNPREDICTABILITY LOGGED." },
      },
    ],
  },
  {
    phase: "PHASE 1 - DEVICE AND ACCOUNT SAFETY",
    prompt: "Are you confident that this device, browser, email, phone plan, and connected accounts are private?",
    answers: [
      {
        id: "ep3a",
        label: "Yes, as far as I know.",
        responseTitle: "DEVICE APPEARS USABLE",
        response: "No device is guaranteed safe. Continue with awareness of browser history, downloads, email alerts, shared accounts, backups, and billing notifications.",
        effect: { readiness: 5, exposure: -3, backup: 2, emphasis: "readiness", notice: "DEVICE APPEARS USABLE." },
      },
      {
        id: "ep3b",
        label: "I am not sure.",
        responseTitle: "DEVICE PRIVACY UNKNOWN",
        response: "System recommends avoiding saved plans, obvious filenames, password changes, or sensitive downloads until a safer device is available.",
        effect: { readiness: -3, exposure: 10, backup: 5, emphasis: "exposure", notice: "DEVICE PRIVACY UNKNOWN." },
      },
      {
        id: "ep3c",
        label: "They know my passwords or have access to my accounts.",
        responseTitle: "ACCOUNT ACCESS COMPROMISED",
        response: "Changing passwords from a monitored device may alert the person or expose the new password. Consider using a safer device and an account they do not know exists.",
        effect: { readiness: -7, exposure: 18, backup: 6, emphasis: "exposure", notice: "ACCOUNT ACCESS COMPROMISED.", minExposure: 46 },
      },
      {
        id: "ep3d",
        label: "They check my phone, location, messages, or browser activity.",
        responseTitle: "ACTIVE MONITORING POSSIBLE",
        response: "System recommends minimizing visible searches and downloads. Use Quick Exit whenever needed.",
        effect: { readiness: -8, exposure: 22, backup: 8, emphasis: "exposure", notice: "ACTIVE MONITORING POSSIBLE.", minExposure: 46 },
      },
      {
        id: "ep3e",
        label: "I believe the device may be tracked, monitored, or recorded.",
        responseTitle: "POSSIBLE DEVICE EXPOSURE",
        response: "Humor suspended. A safer device may be a library computer, trusted person's phone, workplace device where permitted, advocacy office, or device the other person has never accessed.",
        effect: { readiness: -10, exposure: 28, backup: 10, emphasis: "exposure", notice: "POSSIBLE DEVICE EXPOSURE.", minExposure: 46 },
      },
    ],
  },
  {
    phase: "PHASE 3 - PLAN A",
    prompt: "Where is the safest realistic place you could go first? No address needed.",
    answers: [
      {
        id: "ep4a",
        label: "Trusted person, shelter, hotel, hospital, or public location.",
        responseTitle: "PLAN A DESTINATION TYPE LOGGED",
        response: "Destination category identified. System will keep backup options online.",
        effect: { readiness: 16, exposure: -2, backup: 5, emphasis: "readiness", notice: "EXIT READINESS INCREASED." },
      },
      {
        id: "ep4b",
        label: "I have nowhere yet or cannot safely contact anyone.",
        responseTitle: "DESTINATION NOT YET IDENTIFIED",
        response: "This is a planning problem, not a moral failure. Relevant housing resources can be routed here later.",
        effect: { readiness: 4, exposure: 6, backup: 8, emphasis: "backup", notice: "BACKUP STATUS UPDATED." },
      },
    ],
  },
  {
    phase: "PHASE 3 - PLAN A",
    prompt: "How would you get there?",
    answers: [
      {
        id: "ep5a",
        label: "My vehicle, someone can drive me, rideshare, taxi, or public transportation.",
        responseTitle: "PRIMARY TRANSPORT IDENTIFIED",
        response: "Primary route logged. Backup route remains useful if timing changes.",
        effect: { readiness: 15, exposure: -2, backup: 5, emphasis: "readiness", notice: "EXIT READINESS INCREASED." },
      },
      {
        id: "ep5b",
        label: "I could walk to a safer location or I have no transportation option yet.",
        responseTitle: "TRANSPORTATION GAP LOGGED",
        response: "System will treat transportation as a primary blocker and keep emergency alternatives in view.",
        effect: { readiness: -4, exposure: 8, backup: 8, emphasis: "backup", notice: "BACKUP STATUS UPDATED." },
      },
    ],
  },
  {
    phase: "PHASE 3 - PLAN A",
    prompt: "When would leaving be least likely to trigger interference?",
    answers: [
      {
        id: "ep6a",
        label: "When they are away, while I am already out, during work, or with another person present.",
        responseTitle: "TIMING WINDOW IDENTIFIED",
        response: "Timing is a safety variable. No date is required today.",
        effect: { readiness: 14, exposure: -4, backup: 3, emphasis: "readiness", notice: "TIMING WINDOW IDENTIFIED." },
      },
      {
        id: "ep6b",
        label: "There is no predictable safe window or I am not ready to choose a time.",
        responseTitle: "TIMING WINDOW NOT YET IDENTIFIED",
        response: "No date required today. System will keep emergency and lower-visibility options available.",
        effect: { readiness: -3, exposure: 8, backup: 8, emphasis: "backup", notice: "BACKUP STATUS UPDATED." },
      },
    ],
  },
  {
    phase: "PLAN B - EMERGENCY EXIT",
    prompt: "If you had to leave within ten minutes, what could you do?",
    answers: [
      {
        id: "ep7a",
        label: "Leave to a known location, contact pickup, move to public place, or contact emergency services.",
        responseTitle: "EMERGENCY ROUTE IDENTIFIED",
        response: "Emergency plan does not need to be elegant. It needs to create distance and time.",
        effect: { readiness: 8, exposure: -2, backup: 24, emphasis: "backup", notice: "BACKUP STATUS AVAILABLE." },
      },
      {
        id: "ep7b",
        label: "I would have to leave without belongings or I do not have an emergency route yet.",
        responseTitle: "EMERGENCY ROUTE INCOMPLETE",
        response: "System will recommend one small next step instead of a giant checklist.",
        effect: { readiness: 0, exposure: 8, backup: 6, emphasis: "backup", notice: "BACKUP STATUS INCOMPLETE." },
      },
    ],
  },
];

const denialImages = [denialSupportOne, denialSupportTwo];

const checkpointMessage =
  "Survivor Operating System cannot tell whether your device, browser, accounts, or connection are being monitored.\n\nPrivate or Incognito browsing may reduce some local history, but it does not hide activity from monitoring software, shared accounts, phone plans, networks, connected devices, or someone with access to this device.\n\nIf you think someone may be monitoring you, consider using a device and account they have never accessed before.\n\nContinuing is your choice.";

const privateBrowsingHelp = [
  "Private or Incognito windows can reduce some local browser history on this device.",
  "They do not hide activity from monitoring software, shared accounts, phone plans, networks, routers, backups, or someone with device access.",
  "If it is safe, open a private window from your browser menu before continuing.",
];

const leavingLadderRungs: LeavingLadderRung[] = [
  {
    id: "name-it",
    title: "Name What Is Happening",
    premise: "You do not have to call it abuse to notice it is costing you.",
    systemResponse:
      "SYSTEM:\nNaming the pattern is not betrayal. It is inventory. If your peace, sleep, money, movement, friendships, body, or sense of reality keeps shrinking around one person's reactions, something is asking to be taken seriously.",
    contextSignal: {
      title: "CONTEXT WITHOUT EXCUSE",
      body: "Two things can be true: someone can feel like everything you ever wanted and still cause irreparable harm to you.\n\nMaladaptive behaviors can develop from many different kinds of trauma, and they do not look the same in everyone. Some may overlap with traits associated with personality disorders without meeting the criteria for a diagnosis. Understanding where someone's behavior comes from may provide context, but it does not erase the impact that behavior has had on your life.\n\nA diagnosis is not an excuse, and the absence of one does not make the harm less real. Whether that person recognizes their behavior, seeks help, or changes is not your responsibility. Your responsibility is to protect yourself, honor what you experienced, and make the choices that are safest for you.",
    },
    suggestedAction: "Complete one private prompt: This relationship is costing ______.",
    effect: {
      clarity: 16,
      preparedness: 4,
      reality: 10,
      options: 4,
      emphasis: "CLARITY",
      notice: "PATTERN NAMED. CLARITY SIGNAL INCREASED.",
    },
  },
  {
    id: "safe-hour",
    title: "Imagine One Safe Hour",
    premise: "Before you picture a whole new life, picture one hour with less control in it.",
    systemResponse:
      "SYSTEM:\nA safer future does not have to arrive fully furnished. Start smaller. One hour at a library. One phone call from a parking lot. One walk where nobody is interrogating your face. Your nervous system may need proof that quiet still exists.",
    suggestedAction: "Name one place, person, or time of day where control is lower.",
    effect: {
      clarity: 8,
      preparedness: 6,
      reality: 8,
      options: 18,
      emphasis: "OPTIONS",
      notice: "SAFE-HOUR POSSIBILITY FOUND. OPTIONS SIGNAL INCREASED.",
    },
  },
  {
    id: "dependency",
    title: "Reduce One Dependency",
    premise: "Control gets louder when one person holds too many switches.",
    systemResponse:
      "SYSTEM:\nYou do not have to solve money, transportation, documents, phone access, medication, housing, and support all at once. Pick one switch. Make it slightly less theirs. Slightly counts. Quiet preparation is still preparation.",
    suggestedAction: "Choose one dependency to reduce first: money, transportation, documents, phone, medication, housing, or support.",
    effect: {
      clarity: 8,
      preparedness: 18,
      reality: 8,
      options: 8,
      emphasis: "PREPAREDNESS",
      notice: "DEPENDENCY TARGET SELECTED. PREPAREDNESS SIGNAL INCREASED.",
    },
  },
  {
    id: "housing",
    title: "Housing Is Not One Thing",
    premise: "Housing does not mean finding a perfect new home immediately.",
    systemResponse:
      "SYSTEM:\nHousing can mean a first night, a couch, a shelter, a hotel, a car-safety plan, family, a friend, a motel voucher, transitional housing, or a waitlist. It also means documents, transportation, privacy, pets or kids, money, location safety, and whether they can find you. No perfect choice required. We are mapping possible doors.",
    suggestedAction: "List two first-night possibilities, even if both are imperfect.",
    effect: {
      clarity: 8,
      preparedness: 16,
      reality: 18,
      options: 12,
      emphasis: "REALITY",
      notice: "HOUSING DECODED AS A SET OF OPTIONS. REALITY SIGNAL INCREASED.",
    },
  },
  {
    id: "tiny-move",
    title: "Choose One Tiny Move",
    premise: "You do not need a dramatic announcement. You need one next move that belongs to you.",
    systemResponse:
      "SYSTEM:\nDecision pressure rejected. You can prepare without promising yourself you will leave today. Pack one thing. Learn one right. Identify one safe contact. Find one local resource. One move is not everything, but it is no longer nothing.",
    suggestedAction: "Pick one next module: Go-Bag Prep, Exit Planning, Local Help, or Legal.",
    effect: {
      clarity: 10,
      preparedness: 14,
      reality: 8,
      options: 18,
      emphasis: "OPTIONS",
      notice: "TINY MOVE AVAILABLE. OPTIONS SIGNAL INCREASED.",
    },
  },
];

const planningResourcePages: SafetyPlanSection[] = [
  {
    id: "digital-traces",
    title: "Browser Trace Cleanup",
    subtitle: "Reduce local history without pretending it defeats monitoring software.",
    status: "DIGITAL SAFETY // REDUCE TRACES",
    screenshotLines: [
      "Private or Incognito mode may reduce browser history on this device.",
      "It does not hide activity from monitoring software, shared accounts, phone plans, routers, backups, or someone with device access.",
      "If someone may be actively monitoring this device, use a library computer or a trusted person's device instead.",
      "Clearing history can remove clues, but it can also look suspicious if someone checks often.",
      "Safest option: plan from a device and account they have never accessed.",
    ],
    detailGroups: [
      {
        title: "iPhone / Safari",
        items: [
          "Settings > Safari > Clear History and Website Data.",
          "To delete one site: Safari > book icon > clock icon > swipe left on the entry > Delete.",
          "Private mode: Safari > tabs icon > Private.",
        ],
      },
      {
        title: "Android / Chrome",
        items: [
          "Chrome > three dots > History > Clear Browsing Data.",
          "Use All Time if you need a broad cleanup.",
          "Incognito mode: Chrome > three dots > New Incognito Tab.",
        ],
      },
      {
        title: "Desktop",
        items: [
          "Chrome, Edge, Brave: Ctrl + Shift + Delete on Windows, Cmd + Shift + Delete on Mac.",
          "Firefox: Ctrl + Shift + Delete on Windows, Cmd + Shift + Delete on Mac.",
          "Private windows: Ctrl + Shift + N for Chrome/Edge/Brave, Ctrl + Shift + P for Firefox.",
        ],
      },
    ],
  },
  {
    id: "pet-plan",
    title: "Pet Safety Plan",
    subtitle: "Pets are family. They deserve an exit plan too.",
    status: "PET SAFETY // FAMILY INCLUDED",
    screenshotLines: [
      "Threatening or harming pets can be a control tactic.",
      "Survivor safety and pet safety can both be explored before choosing an option.",
      "Gather photos, vet records, microchip info, medication labels, and proof of care.",
      "Ask safe people, DV shelters, animal shelters, vets, and rescues about emergency fostering or boarding.",
      "If a pet cannot leave today, tell an advocate and document everything.",
    ],
    detailGroups: [
      {
        title: "Gather Proof",
        items: [
          "Recent photos of your pet and one photo of you with your pet.",
          "Vet records, vaccination proof, microchip number, license, adoption records, or purchase receipts.",
          "Screenshots, photos, or dated notes about threats or harm to your pet.",
        ],
      },
      {
        title: "Ask The Right People",
        items: [
          "Trusted friends or family who can keep your pet's location private.",
          "DV shelters: ask if they accept pets or partner with pet-safe housing programs.",
          "Animal shelters, humane societies, vets, SafePlace for Pets, RedRover Relief, PetFinder rescues, and breed-specific rescues.",
        ],
      },
      {
        title: "Pet Go-Bag",
        items: [
          "Food for at least one week, medications, carrier, leash, crate, blanket, toy, records, and vet contact info.",
          "Keep prescription labels intact when possible.",
          "If the safest exit is without your pet, that does not make you a bad pet owner.",
        ],
      },
    ],
  },
  {
    id: "resource-map",
    title: "Who To Call For What",
    subtitle: "Know the difference between national, state, and local help.",
    status: "RESOURCE MAP // LESS BOUNCING AROUND",
    screenshotLines: [
      "National coalitions usually make policy, publish guidance, and fund the system.",
      "State coalitions often maintain directories and support local organizations.",
      "Local DV organizations and shelters are where direct help usually lives.",
      "If you need shelter, legal advocacy, safety planning, benefits help, or court support, start local.",
      "If you do not know where to start, the National Domestic Violence Hotline can route you.",
    ],
    detailGroups: [
      {
        title: "National Help",
        items: [
          "National DV Hotline: 1-800-799-7233.",
          "Text START to 88788 if speaking is not safe.",
          "Use thehotline.org chat if calling is not safe.",
        ],
      },
      {
        title: "State Coalitions",
        items: [
          "Search: your state + domestic violence coalition.",
          "Look for statewide shelter directories and legal/resource links.",
          "Most state coalitions support local programs rather than offering direct services themselves.",
        ],
      },
      {
        title: "Local Organizations",
        items: [
          "Ask about emergency shelter, transportation, legal advocacy, benefits, counseling, children's support, and transitional housing.",
          "If you enter shelter, ask what happens at day 30 or 60 on the first day, not the last day.",
          "Shelter can feel like a finish line, but it is usually planning time with safer walls.",
        ],
      },
    ],
  },
];

const safetyPlanSections: SafetyPlanSection[] = [
  {
    id: "people",
    title: "People",
    subtitle: "Who knows, who can help, and who should not know yet.",
    status: "SAFETY PLANNING // PEOPLE",
    screenshotLines: [
      "Who is one trusted contact who would take you seriously?",
      "Who could call police or emergency services if you used a code word?",
      "Who could help you reach a DV advocate, shelter, or crisis center?",
      "Who might accidentally tell the abusive person where you are?",
      "Who should not know details until you are safer?",
    ],
    detailGroups: [
      {
        title: "Consider",
        items: [
          "A trusted contact may be safer when they know exactly what kind of help you want from them.",
          "An advocate at a DV shelter or crisis center can help think through options without requiring one specific decision.",
          "If you are in immediate danger, contacting police or emergency services may be the fastest outside intervention available.",
        ],
      },
    ],
  },
  {
    id: "places",
    title: "Places",
    subtitle: "Where control is lower, even temporarily.",
    status: "SAFETY PLANNING // PLACES",
    screenshotLines: [
      "Where could you be around other people if things escalate?",
      "What places are open late near you?",
      "Where could an advocate, trusted contact, or police meet you if needed?",
      "What locations would the abusive person check first?",
      "What places feel safer but may still need privacy planning?",
    ],
    detailGroups: [
      {
        title: "Consider",
        items: [
          "A safe place is not a promise of total safety. It is a place where isolation may be lower.",
          "Shelters, crisis centers, and advocates may know local options that are not obvious from a search engine.",
          "Location privacy matters if the abusive person tracks devices, vehicles, accounts, or shared contacts.",
        ],
      },
    ],
  },
  {
    id: "traces",
    title: "Traces",
    subtitle: "Devices, accounts, browser history, shared bills, and screenshots.",
    status: "SAFETY PLANNING // DIGITAL TRACES",
    screenshotLines: [
      "Could this device, browser, account, or phone plan be monitored?",
      "Could a screenshot in your camera roll be found later?",
      "Are backups, shared albums, cloud accounts, or synced devices connected?",
      "Would clearing history create suspicion?",
      "Is there a safer device or account you can use to contact an advocate, police, or trusted person?",
    ],
    detailGroups: [
      {
        title: "Consider",
        items: [
          "Private browsing can reduce some local traces, but it does not defeat monitoring software or shared account access.",
          "A hidden folder may still sync, back up, or appear in device activity depending on settings.",
          "If device monitoring is possible, a DV advocate or crisis center can help talk through tech-safety options.",
        ],
      },
    ],
  },
  {
    id: "dependents",
    title: "Dependents",
    subtitle: "Kids, pets, medication, transportation, and documents.",
    status: "SAFETY PLANNING // DEPENDENTS",
    screenshotLines: [
      "Who or what depends on you if you leave quickly?",
      "Are there kids, pets, medications, mobility needs, or documents to consider?",
      "Could a trusted contact, advocate, shelter, vet, school, or crisis center help coordinate support?",
      "What information would a helper need to know without exposing your plan?",
      "What would be difficult to replace if left behind?",
    ],
    detailGroups: [
      {
        title: "Consider",
        items: [
          "Pets, kids, medications, IDs, and transportation can all affect what leaving realistically requires.",
          "An advocate may know local shelter policies, pet-safe programs, transportation help, and document replacement options.",
          "Not having every piece handled does not mean you failed. It means the plan has constraints.",
        ],
      },
    ],
  },
];

const defaultControlPanel: ControlPanelState = {
  emphasis: null,
  gauges: [
    {
      label: "CLARITY",
      value: 58,
      lowLabel: "FOG",
      highLabel: "CLEAR",
      state: "STANDBY",
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: 28,
      lowLabel: "LOW",
      highLabel: "READY",
      state: "RULES PENDING",
      tone: "pink",
    },
    {
      label: "REALITY",
      value: 62,
      lowLabel: "LOCKED",
      highLabel: "ONLINE",
      state: "STANDBY",
      tone: "amber",
    },
    {
      label: "OPTIONS",
      value: 64,
      lowLabel: "LOCKED",
      highLabel: "OPEN",
      state: "AVAILABLE",
      tone: "purple",
    },
  ],
  notice: "COMMAND CENTER ONLINE. MODULE READINGS STANDBY.",
};

function leaveSite() {
  window.location.replace("https://iluvrocks.rocks");
}

const checkpointSessionKey = "survivorSystemsCheckpointCleared";

function getCheckpointCleared() {
  try {
    return window.sessionStorage.getItem(checkpointSessionKey) === "true";
  } catch {
    return false;
  }
}

function markCheckpointCleared() {
  try {
    window.sessionStorage.setItem(checkpointSessionKey, "true");
  } catch {
    // If sessionStorage is unavailable, the in-memory state still lets this visit continue.
  }
}

function getInitialModule(): ModuleKey {
  const path = window.location.pathname;
  if (path === "/local-help") return "local-help";
  if (path === "/how-to") return "how-to";
  if (path === "/legal") return "legal";
  if (path === "/library") return "library";
  if (path === "/resources/access") return "access";

  const match = allNavTargets.find((item) => item.path === path);
  return match?.key ?? "home";
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function clampGauge(value: number) {
  return Math.max(0, Math.min(100, value));
}

function gaugeState(value: number, strong = "READY", mid = "BUILDING", low = "LOW") {
  if (value >= 76) return strong;
  if (value >= 51) return mid;
  if (value >= 26) return low;
  return "NEEDS INPUT";
}

function gaugeByLabel(gauges: GaugeValue[], labels: string[], fallbackIndex: number) {
  const match = gauges.find((gauge) => labels.some((label) => gauge.label.toLowerCase().includes(label)));
  return match ?? gauges[fallbackIndex] ?? defaultControlPanel.gauges[fallbackIndex] ?? defaultControlPanel.gauges[0];
}

function commandCenterBars(gauges: GaugeValue[]): GaugeValue[] {
  const clarity = gaugeByLabel(gauges, ["clarity", "autonomy"], 0);
  const preparedness = gaugeByLabel(gauges, ["preparedness", "readiness", "bag", "core", "backup"], 1);
  const reality = gaugeByLabel(gauges, ["reality"], 2);
  const options = gaugeByLabel(gauges, ["options"], 3);
  const optionValue =
    options.label.toLowerCase().includes("options") && options.value
      ? options.value
      : Math.round((clarity.value + preparedness.value + reality.value) / 3);

  return [
    {
      label: "CLARITY",
      value: clarity.value,
      lowLabel: "FOG",
      highLabel: "CLEAR",
      state: clarity.state || gaugeState(clarity.value, "CLEAR", "ONLINE", "FUZZY"),
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: preparedness.value,
      lowLabel: "LOW",
      highLabel: "READY",
      state: preparedness.state || gaugeState(preparedness.value),
      tone: "pink",
    },
    {
      label: "REALITY",
      value: reality.value,
      lowLabel: "DISTORTED",
      highLabel: "STABLE",
      state: reality.state || gaugeState(reality.value, "STABLE", "CLEARING", "STATIC"),
      tone: "amber",
    },
    {
      label: "OPTIONS",
      value: optionValue,
      lowLabel: "LIMITED",
      highLabel: "OPEN",
      state: gaugeState(optionValue, "AVAILABLE", "OPENING", "LIMITED"),
      tone: "purple",
    },
  ];
}

function assessmentGaugeValues(gauges: AssessmentGauges): GaugeValue[] {
  const autonomyState =
    gauges.autonomy >= 76
      ? "AVAILABLE"
      : gauges.autonomy >= 51
        ? "PARTIAL"
        : gauges.autonomy >= 26
          ? "RESTRICTED"
          : "SEVERELY RESTRICTED";
  const preparedness = clampGauge(100 - gauges.danger);
  const preparednessState =
    preparedness >= 76 ? "READY" : preparedness >= 51 ? "BUILDING" : preparedness >= 26 ? "LOW" : "NEEDS SUPPORT";
  const realityState =
    gauges.reality >= 76 ? "STABLE" : gauges.reality >= 51 ? "CLEARING" : gauges.reality >= 26 ? "UNSTABLE" : "DISTORTED";

  return [
    {
      label: "AUTONOMY METER",
      value: gauges.autonomy,
      lowLabel: "RESTRICTED",
      highLabel: "AVAILABLE",
      state: autonomyState,
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: preparedness,
      lowLabel: "LOW",
      highLabel: "READY",
      state: preparednessState,
      tone: "pink",
    },
    {
      label: "REALITY SIGNAL",
      value: gauges.reality,
      lowLabel: "DISTORTED",
      highLabel: "STABLE",
      state: realityState,
      tone: "purple",
    },
  ];
}

function exitGaugeValues(gauges: ExitGaugeState): GaugeValue[] {
  const readinessState = gauges.readiness >= 76 ? "ROUTE IDENTIFIED" : gauges.readiness >= 41 ? "PARTIAL" : "BLOCKED";
  const exposureState = gauges.exposure >= 66 ? "HIGH" : gauges.exposure >= 31 ? "ELEVATED" : "LOW";
  const backupState = gauges.backup >= 76 ? "AVAILABLE" : gauges.backup >= 36 ? "INCOMPLETE" : "OFFLINE";

  return [
    {
      label: "EXIT READINESS",
      value: gauges.readiness,
      lowLabel: "BLOCKED",
      highLabel: "ROUTE IDENTIFIED",
      state: readinessState,
      tone: "cyan",
    },
    {
      label: "EXPOSURE LEVEL",
      value: gauges.exposure,
      lowLabel: "LOW",
      highLabel: "HIGH",
      state: exposureState,
      tone: "pink",
    },
    {
      label: "BACKUP STATUS",
      value: gauges.backup,
      lowLabel: "OFFLINE",
      highLabel: "AVAILABLE",
      state: backupState,
      tone: "purple",
    },
  ];
}

function GaugeDeck({
  compact = false,
  emphasis,
  gauges,
  notice,
}: {
  compact?: boolean;
  emphasis?: string | null;
  gauges: GaugeValue[];
  notice?: string;
}) {
  if (compact) {
    const bars = commandCenterBars(gauges);

    return (
      <section className="gauge-deck compact-gauges" aria-label="Command center status bars">
        <div className="gauge-row">
          {bars.map((gauge) => {
            const filledBlocks = Math.round(clampGauge(gauge.value) / 10);

            return (
              <article className={`status-bar ${gauge.tone} ${emphasis === gauge.label ? "pulse-gauge" : ""}`} key={gauge.label}>
                <h3>{gauge.label}</h3>
                <div className="status-blocks" aria-label={`${gauge.label} ${filledBlocks} out of 10`}>
                  {Array.from({ length: 10 }, (_, index) => (
                    <span className={index < filledBlocks ? "status-block filled" : "status-block"} key={index} />
                  ))}
                </div>
                <p>{gauge.state}</p>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={compact ? "gauge-deck compact-gauges" : "gauge-deck"} aria-label="Temporary system readings">
      <div className="gauge-row">
        {gauges.map((gauge) => (
          <article
            className={`analog-gauge ${gauge.tone} ${emphasis === gauge.label ? "pulse-gauge" : ""}`}
            key={gauge.label}
            style={{ "--gauge-value": gauge.value } as CSSProperties}
          >
            <div className="gauge-window">
              <div className="gauge-arc" />
              <div className="gauge-needle" />
              <div className="gauge-hub" />
              <div className="gauge-scale">
                <span>{gauge.lowLabel}</span>
                <span>{gauge.highLabel}</span>
              </div>
            </div>
            <h3>{gauge.label}</h3>
            <p>{compact ? gauge.state : `CURRENT STATE: ${gauge.state}`}</p>
          </article>
        ))}
      </div>
      <p className="gauge-notice">{notice || "GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO CONCLUSIONS LOADED."}</p>
    </section>
  );
}

function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-logo ${className}`} aria-label="Survivor Operating System">
      <span className="brand-logo-survivor">Survivor</span>
      <span className="brand-logo-systems">Systems</span>
    </span>
  );
}

function CommandCenter({
  onNavigate,
  panel,
}: {
  onNavigate: (module: ModuleKey, path: string) => void;
  panel: ControlPanelState;
}) {
  return (
    <section className="command-center" aria-label="Command center">
      <div className="command-center-status">
        <span className="terminal-label">COMMAND CENTER</span>
        <p>{panel.notice}</p>
      </div>
      <GaugeDeck compact emphasis={panel.emphasis} gauges={panel.gauges} notice={panel.notice} />
      <TerminalCommand onNavigate={onNavigate} />
    </section>
  );
}

function TypedText({
  className = "typed-text",
  onDone,
  skipLabel = "Skip Typing",
  text,
}: {
  className?: string;
  onDone?: () => void;
  skipLabel?: string;
  text: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleLength, setVisibleLength] = useState(prefersReducedMotion ? text.length : 0);
  const onDoneRef = useRef(onDone);
  const completedRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const finishTyping = useCallback(() => {
    setVisibleLength(text.length);
    if (!completedRef.current) {
      completedRef.current = true;
      onDoneRef.current?.();
    }
  }, [text]);

  useEffect(() => {
    completedRef.current = false;

    if (prefersReducedMotion) {
      finishTyping();
      return;
    }

    setVisibleLength(0);
    const charsPerTick = text.length > 420 ? 2 : 1;
    const interval = window.setInterval(() => {
      setVisibleLength((current) => {
        const next = Math.min(text.length, current + charsPerTick);
        if (next >= text.length) {
          window.clearInterval(interval);
          if (!completedRef.current) {
            completedRef.current = true;
            onDoneRef.current?.();
          }
        }
        return next;
      });
    }, 42);

    return () => window.clearInterval(interval);
  }, [finishTyping, prefersReducedMotion, text]);

  const finished = visibleLength >= text.length;

  return (
    <>
      <pre className={className}>
        {text.slice(0, visibleLength)}
        <span className="terminal-cursor" aria-hidden="true" />
      </pre>
      {!finished && (
        <button className="text-button" type="button" onClick={finishTyping}>
          {skipLabel}
        </button>
      )}
    </>
  );
}

function WelcomeCheckpoint({ onComplete }: { onComplete: () => void }) {
  const [typingComplete, setTypingComplete] = useState(false);
  const [mode, setMode] = useState<"options" | "instructions" | "ack" | "safer-device">("options");
  const [acknowledged, setAcknowledged] = useState(false);

  const typedIntro = useMemo(
    () => `Welcome To Survivor Operating System.\n\n${checkpointMessage}`,
    [],
  );

  return (
    <main className="terminal-frame checkpoint-frame">
      <button className="quick-exit global-exit" type="button" onClick={leaveSite}>
        <ShieldAlert aria-hidden="true" />
        Quick Exit
      </button>
      <section className="checkpoint-panel" aria-labelledby="checkpoint-title">
        <div className="terminal-label">SYSTEM CHECKPOINT</div>
        <h1 id="checkpoint-title">
          <BrandLogo className="checkpoint-logo" />
        </h1>
        <TypedText text={typedIntro} onDone={() => setTypingComplete(true)} />

        {typingComplete && mode === "options" && (
          <div className="terminal-actions" aria-label="Welcome checkpoint options">
            <button type="button" onClick={() => setMode("instructions")}>
              Open Private Browsing Instructions
            </button>
            <button type="button" onClick={onComplete}>
              Private Browsing Active
            </button>
            <button type="button" onClick={() => setMode("ack")}>
              Continue Without Private Browsing
            </button>
            <button type="button" onClick={() => setMode("safer-device")}>
              Use a Safer Device Instead
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        )}

        {typingComplete && mode === "instructions" && (
          <div className="sub-terminal">
            <h2>Private Browsing Instructions</h2>
            <ul>
              {privateBrowsingHelp.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="terminal-actions compact-actions">
              <button type="button" onClick={onComplete}>
                Private Browsing Active
              </button>
              <button type="button" onClick={() => setMode("ack")}>
                Continue Without Private Browsing
              </button>
              <button type="button" onClick={() => setMode("options")}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {typingComplete && mode === "safer-device" && (
          <div className="sub-terminal">
            <h2>Use a Safer Device Instead</h2>
            <p>
              If you think this device, browser, account, network, or phone plan may be monitored,
              consider leaving now and using a device and account the other person has never
              accessed before.
            </p>
            <div className="terminal-actions compact-actions">
              <button type="button" onClick={leaveSite}>
                Quick Exit
              </button>
              <button type="button" onClick={() => setMode("options")}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {typingComplete && mode === "ack" && (
          <div className="sub-terminal">
            <p>
              Continuing may leave visible traces on this device, browser, connected accounts,
              network, bills, backups, or monitoring tools.
            </p>
            <label className="ack-check">
              <input
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                type="checkbox"
              />
              <span>Risk protocol acknowledged</span>
            </label>
            <div className="terminal-actions compact-actions">
              <button disabled={!acknowledged} type="button" onClick={onComplete}>
                Acknowledge Risk - Continue
              </button>
              <button type="button" onClick={() => setMode("options")}>
                Go Back
              </button>
              <button type="button" onClick={leaveSite}>
                Quick Exit
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function ModuleLoading({ label }: { label: string }) {
  return (
    <div className="module-loading" role="status" aria-live="polite">
      <p>ACCESSING MODULE...</p>
      <p>LOADING {label.toUpperCase()}...</p>
      <p>CONNECTION ESTABLISHED</p>
    </div>
  );
}

function resolveCommand(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return { message: "NO QUERY ENTERED. TYPE A MODULE NAME OR A NEED.", target: null };
  }

  if (
    normalized === "exit" ||
    normalized === "escape" ||
    normalized.includes("quick exit") ||
    normalized.includes("iluvrocks")
  ) {
    return { message: "QUICK EXIT COMMAND ACCEPTED.", target: "quick-exit" as const };
  }

  if (/\b(help|menu|options|commands|where)\b/.test(normalized)) {
    return {
      message:
        "AVAILABLE COMMANDS: PREP, REBUILDING, RESOURCES, AM I CRAZY, GO-BAG PREP, QUICK EXIT.",
      target: null,
    };
  }

  const match = allNavTargets.find((item) => {
    const label = item.label.toLowerCase();
    return normalized.includes(label) || label.includes(normalized);
  });

  if (match) {
    return { message: `QUERY ACCEPTED. ROUTING TO ${match.label.toUpperCase()}...`, target: match };
  }

  if (/ctrl\s*\+\s*esc|\bfirst steps?\b|\bprep\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO PREP / FIRST STEPS...", target: navItemFor("planning") };
  }

  if (/ctrl\s*\+\s*shift/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO REBUILDING...", target: navItemFor("rebuilding") };
  }

  if (/ctrl\s*\+\s*fn|\bresources?\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO RESOURCES...", target: navItemFor("local-help") };
  }

  if (/ctrl\s*\+\s*c\b|\bhow to\b|\b(guides?|snap|tanf|benefits)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO RESOURCES...", target: navItemFor("how-to") };
  }

  if (/ctrl\s*\+\s*a\b|\b(access pass|access information|access info|passes|pass options)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO RESOURCES...", target: navItemFor("access") };
  }

  if (/ctrl\s*\+\s*l\b|\b(library|download|downloads|subscription|subscribe|paid|stripe)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO RESOURCES...", target: navItemFor("library") };
  }

  if (/\b(crazy|abused|abuse|assessment|gaslight|gaslighting|reality)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO AM I CRAZY...", target: navItemFor("am-i-crazy") };
  }

  if (/\b(go.?bag|bag|simulator|arcade|prep|pack)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO GO-BAG PREP...", target: navItemFor("go-bag-prep") };
  }

  if (/\b(plan|safety|prepare|documents|checklist)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO PLANNING...", target: navItemFor("planning") };
  }

  if (/\b(leave|leaving|go bag|escape|exit plan)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO PREP / FIRST STEPS...", target: navItemFor("planning") };
  }

  if (/\b(rebuild|money|housing|future|after)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO REBUILDING...", target: navItemFor("rebuilding") };
  }

  if (/\b(local|hotline|shelter|support|near)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO RESOURCES...", target: navItemFor("local-help") };
  }

  if (/\b(legal|rights|court|order|documents)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO RESOURCES...", target: navItemFor("legal") };
  }

  return {
    message:
      "QUERY NOT RECOGNIZED. TRY: PREP, LEAVING, REBUILDING, RESOURCES, LIBRARY, LEGAL, OR QUICK EXIT.",
    target: null,
  };
}

function TerminalCommand({
  onNavigate,
}: {
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [systemReply, setSystemReply] = useState("SYSTEM READY. TYPE A MODULE NAME OR WHAT YOU NEED.");

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = resolveCommand(query);
    setSystemReply(result.message);
    setQuery("");

    if (result.target === "quick-exit") {
      window.setTimeout(leaveSite, 240);
      return;
    }

    if (result.target) {
      window.setTimeout(() => onNavigate(result.target.key, result.target.path), 420);
    }
  }

  return (
    <form className="command-terminal" onSubmit={submitCommand}>
      <label htmlFor="terminal-command">NAV QUERY</label>
      <div className="command-input-row">
        <span aria-hidden="true">user@survivor-os:~$</span>
        <input
          autoComplete="off"
          id="terminal-command"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="type: prep, resources, rebuilding, go-bag prep, quick exit..."
          spellCheck={false}
          type="search"
          value={query}
        />
      </div>
      <p aria-live="polite">{systemReply}</p>
    </form>
  );
}

function TerminalChrome({
  activeModule,
  children,
  controlPanel,
  onNavigate,
}: {
  activeModule: ModuleKey;
  children: React.ReactNode;
  controlPanel: ControlPanelState;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return (
    <main className="terminal-frame app-frame">
      <aside className="terminal-sidebar" aria-label="Survivor Operating System navigation">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("home", "/");
          }}
        >
          <BrandLogo />
        </a>
        <p className="sidebar-tagline">TOOLS FOR CLARITY. POWER FOR YOUR FUTURE.</p>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              className={activeModule === item.key ? "active" : ""}
              href={item.path}
              key={item.key}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.key, item.path);
              }}
            >
              <span>{item.label}</span>
              <small>{item.decoded}</small>
            </a>
          ))}
        </nav>
        <button className="quick-exit" type="button" onClick={leaveSite}>
          <ShieldAlert aria-hidden="true" />
          Quick Exit
        </button>
      </aside>
      <section className="terminal-screen">
        <header className="terminal-topbar">
          <div className="terminal-topbar-title">
            <span className="terminal-label">MODULE</span>
            <h1>{moduleRoutes[activeModule]?.label ?? "Home"}</h1>
          </div>
          <div className="system-status">
            <span>SYSTEM STATUS</span>
            <strong>ONLINE</strong>
            <small>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
        </header>
        <div className="terminal-content">{children}</div>
        <CommandCenter panel={controlPanel} onNavigate={onNavigate} />
      </section>
    </main>
  );
}

function HomeModule() {
  const navLegend = [
    ["Ctrl+Esc", "Prep / First Steps"],
    ["Ctrl+Shift", "Rebuilding"],
    ["Ctrl+Fn", "Resources"],
  ];

  return (
    <section className="home-terminal" aria-labelledby="home-title">
      <div className="home-terminal-command">
        <span aria-hidden="true">user@survivor-os:~$</span>
        <strong>USER TERMINAL</strong>
      </div>
      <div className="home-grid">
        <article className="home-message">
          <div className="mission-prompt">user@survivor-os:~$ LOAD MODULE // MISSION</div>
          <h1 id="home-title">&lt;You Are Not Alone Here&gt;</h1>
          <p className="home-tagline">// And it's okay if this is complicated</p>
          <p>
            Leaving a partner is one of the hardest things a person can do. Leaving one who has hurt
            you is even harder, because the hurt and the love do not cancel each other out. They
            exist at the same time, in the same body, pulling in opposite directions. If you have
            ever felt confused about why you still miss them, still defend them, still reach for your
            phone to call them, that is not weakness. That is what this actually feels like.
          </p>
          <p>
            Research suggests that trauma bonding is a neurological process, not a character flaw.
            When a relationship cycles between fear and comfort, tension and relief, your nervous
            system learns to attach to the person who provides both. The moments of warmth feel more
            intense against the backdrop of pain. The relief of making up can feel like love because,
            to your body, it registers as safety returning.
          </p>
          <div className="home-pull-quote">
            <p>
              You love parts of them. You are used to them. They feel safe sometimes. You remember
              who they were at the beginning, or who you believed they could be. Grieving all of that
              is real grief.
            </p>
          </div>
          <p>
            Research also tells us that women in particular tend to respond to threat by moving
            toward connection: tending to the people around them, keeping the peace, making
            themselves smaller or more agreeable to reduce tension. This is not a flaw in your
            wiring. It is a deeply human response to an unsafe situation. The problem is that it can
            look, from the inside, exactly like love.
          </p>
          <p>
            You may leave and go back. You may go back more than once. You may remember things
            differently as time passes. Moments that felt normal at the time may later land
            differently in the light of what you now understand. That is not you being dramatic. That
            is clarity arriving on its own timeline, which it always does.
          </p>
          <p className="mission-emphasis">
            No one here is pretending this is simple. This system was built for the reality of what
            it actually is: complicated, painful, nonlinear, and survivable.
          </p>
          <p>
            You get to move through it at your own pace. Your autonomy, your right to choose when,
            how, and in what direction, belongs to you. It always has. Someone else just convinced
            you otherwise for a while.
          </p>
          <div className="founder-note">
            <div className="terminal-label">&gt;&gt; A Note From The Founder</div>
            <p>
              Survivor Operating System was built by a researcher, advocate, somatic trauma
              specialist, and survivor. After escaping a situation that led to trafficking and
              homelessness, the founder found that the resources available to her were clinical,
              complicated, and clearly not built by anyone who had actually needed them. So she
              built something different. Something that talks to you like a person. Every tool in
              this system exists because someone needed it and it was not there. It is here now.
            </p>
          </div>
        </article>
        <aside className="nav-legend" aria-label="Navigation legend">
          <div className="terminal-label">NAV LEGEND</div>
          {navLegend.map(([shortcut, decoded]) => (
            <div className="legend-row" key={shortcut}>
              <kbd>{shortcut}</kbd>
              <span>{decoded}</span>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

function AmICrazyModule({
  onControlPanelChange,
  onNavigate,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [activeResponse, setActiveResponse] = useState<AssessmentAnswer | null>(null);
  const [mode, setMode] = useState<"intro" | "question" | "response" | "denial" | "complete">("intro");
  const [denialImage, setDenialImage] = useState(denialImages[0]);
  const [responseDone, setResponseDone] = useState(false);
  const [gauges, setGauges] = useState<AssessmentGauges>({
    autonomy: 65,
    danger: 10,
    reality: 55,
    dangerFloor: 10,
  });
  const [gaugeNotice, setGaugeNotice] = useState("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO CONCLUSIONS LOADED.");
  const [gaugeEmphasis, setGaugeEmphasis] = useState<string | null>(null);

  const currentQuestion = assessmentQuestions[questionIndex];
  const patterns = Array.from(new Set(answers.map((answer) => answer.pattern).filter(Boolean)));

  useEffect(() => {
    onControlPanelChange({
      emphasis: gaugeEmphasis,
      gauges: assessmentGaugeValues(gauges),
      notice: gaugeNotice,
    });
  }, [gaugeEmphasis, gaugeNotice, gauges, onControlPanelChange]);

  function beginAssessment() {
    setStarted(true);
    setMode("question");
  }

  function selectAnswer(answer: AssessmentAnswer) {
    setAnswers((current) => [...current, answer]);
    setActiveResponse(answer);
    setResponseDone(false);
    setGaugeEmphasis(null);
    setMode("response");
  }

  function loadNextQuestion() {
    setActiveResponse(null);
    if (questionIndex >= assessmentQuestions.length - 1) {
      setMode("complete");
      return;
    }
    setQuestionIndex((current) => current + 1);
    setMode("question");
  }

  function showDenial() {
    setDenialImage(denialImages[Math.floor(Math.random() * denialImages.length)]);
    setMode("denial");
  }

  function clearAssessment() {
    setStarted(false);
    setQuestionIndex(0);
    setAnswers([]);
    setActiveResponse(null);
    setMode("intro");
    setGauges({ autonomy: 65, danger: 10, reality: 55, dangerFloor: 10 });
    setGaugeNotice("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO CONCLUSIONS LOADED.");
    setGaugeEmphasis(null);
  }

  function clearAndExit() {
    clearAssessment();
    leaveSite();
  }

  function startPlanning() {
    onNavigate("planning", "/planning");
  }

  const completeSystemTyping = useCallback(() => {
    if (!activeResponse) {
      setResponseDone(true);
      return;
    }

    const effect = assessmentGaugeEffects[activeResponse.id];
    if (effect) {
      setGauges((current) => {
        const dangerFloor = Math.max(current.dangerFloor, effect.minDanger ?? current.dangerFloor);
        return {
          autonomy: clampGauge(current.autonomy + effect.autonomy),
          danger: Math.max(dangerFloor, clampGauge(current.danger + effect.danger)),
          reality: clampGauge(current.reality + effect.reality),
          dangerFloor,
        };
      });
      setGaugeNotice(`UPDATING SYSTEM READINGS... ${effect.notice}`);
      setGaugeEmphasis(
        effect.emphasis === "autonomy"
          ? "AUTONOMY METER"
          : effect.emphasis === "danger"
            ? "PREPAREDNESS"
            : "REALITY SIGNAL",
      );
    }
    setResponseDone(true);
  }, [activeResponse]);

  return (
    <section className="assessment-shell" aria-labelledby="assessment-title">
      {mode === "intro" && (
        <div className="assessment-panel">
          <div className="terminal-label">INITIALIZING REALITY CHECK...</div>
          <h1 id="assessment-title">AM I CRAZY?</h1>
          <p>
            Confusion is one of the telltale signs of abuse. People who want control benefit when
            you are too busy questioning yourself to question them.
          </p>
          <p className="neon-punch">Clarity is kryptonite.</p>
          <div className="terminal-actions compact-actions">
            <button type="button" onClick={beginAssessment}>
              Begin
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Back To Homepage
            </button>
            <button type="button" onClick={clearAndExit}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "question" && currentQuestion && (
        <div className="assessment-panel">
          <div className="question-status">
            <span>QUESTION {questionIndex + 1} OF {assessmentQuestions.length}</span>
            <span>{started ? "TEMP MEMORY ONLY" : "OFFLINE"}</span>
          </div>
          <h2>{currentQuestion.prompt}</h2>
          <div className="answer-grid">
            {currentQuestion.answers.map((answer, index) => (
              <button key={answer.id} type="button" onClick={() => selectAnswer(answer)}>
                <span>{String.fromCharCode(65 + index)}</span>
                {answer.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "response" && activeResponse && (
        <div className={activeResponse.safetyFocused ? "assessment-panel direct-panel" : "assessment-panel"}>
          <div className="terminal-label">SYSTEM RESPONSE</div>
          <h2>{activeResponse.responseTitle}</h2>
          <TypedText
            className="system-typed-text"
            onDone={completeSystemTyping}
            skipLabel="Print Response"
            text={`SYSTEM:\n${activeResponse.response}`}
          />
          {responseDone && (
            <ProceedControls
              onDeny={showDenial}
              onExit={clearAndExit}
              onNext={loadNextQuestion}
              onPlanning={startPlanning}
            />
          )}
        </div>
      )}

      {mode === "denial" && (
        <div className="denial-panel">
          <div className="denial-copy">
            <div className="terminal-label">DENIAL MODE SELECTED.</div>
            <h2>DEPLOYING EMOTIONAL SUPPORT</h2>
            <p>PLEASE WAIT. CUTENESS.EXE LOADING...</p>
          </div>
          <img src={denialImage} alt="Bright support image for a denial break" />
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={loadNextQuestion}>
              Rude. Keep Asking Questions
            </button>
            <button type="button" onClick={startPlanning}>
              Start Exit Planning
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/resources")}>
              Understand Choices
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Return To Homepage
            </button>
            <button type="button" onClick={clearAndExit}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "complete" && (
        <div className="assessment-panel">
          <div className="terminal-label">ASSESSMENT COMPLETE.</div>
          <h2>REALITY CHECKS PROCESSED. FINAL DECISION NOT REQUIRED.</h2>
          <div className="pattern-panel">
            <h3>Patterns Identified</h3>
            {patterns.length > 0 ? (
              <ul>
                {patterns.map((pattern) => (
                  <li key={pattern}>{pattern}</li>
                ))}
              </ul>
            ) : (
              <p>No high-friction patterns were selected in this pass.</p>
            )}
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={startPlanning}>
              Start Exit Planning
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/resources")}>
              Understand Choices
            </button>
            <button type="button" onClick={() => onNavigate("go-bag-prep", "/go-bag-prep")}>
              Go-Bag Prep
            </button>
            <button type="button" onClick={() => setMode("complete")}>
              Review Patterns
            </button>
            <button type="button" onClick={showDenial}>
              Choose Denial
            </button>
            <button type="button" onClick={clearAndExit}>
              Clear And Exit
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ProceedControls({
  onDeny,
  onExit,
  onNext,
  onPlanning,
}: {
  onDeny: () => void;
  onExit: () => void;
  onNext: () => void;
  onPlanning: () => void;
}) {
  return (
    <div className="proceed-terminal">
      <div className="terminal-label">HOW WOULD YOU LIKE TO PROCEED?</div>
      <div className="terminal-actions denial-actions">
        <button type="button" onClick={onPlanning}>
          Start Exit Planning
        </button>
        <button type="button" onClick={onNext}>
          Still Not Sure
        </button>
        <button type="button" onClick={onDeny}>
          Choose Denial
        </button>
        <button type="button" onClick={onExit}>
          Quick Exit
        </button>
      </div>
    </div>
  );
}

function ladderGaugeValues(progress: { clarity: number; preparedness: number; reality: number; options: number }): GaugeValue[] {
  return [
    {
      label: "CLARITY",
      value: progress.clarity,
      lowLabel: "FOG",
      highLabel: "CLEAR",
      state: gaugeState(progress.clarity, "CLEARER", "ONLINE", "WARMING"),
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: progress.preparedness,
      lowLabel: "LOW",
      highLabel: "READY",
      state: gaugeState(progress.preparedness, "BUILDING", "STARTED", "SPARK"),
      tone: "pink",
    },
    {
      label: "REALITY",
      value: progress.reality,
      lowLabel: "DISTORTED",
      highLabel: "STABLE",
      state: gaugeState(progress.reality, "STABLE", "CLEARING", "STATIC"),
      tone: "amber",
    },
    {
      label: "OPTIONS",
      value: progress.options,
      lowLabel: "LIMITED",
      highLabel: "OPEN",
      state: gaugeState(progress.options, "AVAILABLE", "OPENING", "LIMITED"),
      tone: "purple",
    },
  ];
}

function SafetyPlanningModule({
  onControlPanelChange,
  onNavigate,
  onBack,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
  onBack: () => void;
}) {
  const [activeSectionId, setActiveSectionId] = useState(safetyPlanSections[0].id);
  const activeSection = safetyPlanSections.find((section) => section.id === activeSectionId) ?? safetyPlanSections[0];
  const activeIndex = safetyPlanSections.findIndex((section) => section.id === activeSection.id);

  useEffect(() => {
    onControlPanelChange({
      emphasis: activeSection.id === "traces" ? "REALITY" : "PREPAREDNESS",
      gauges: ladderGaugeValues({
        clarity: activeSection.id === "people" ? 74 : 62,
        preparedness: activeSection.id === "dependents" ? 78 : 68,
        reality: activeSection.id === "traces" ? 84 : 70,
        options: activeSection.id === "places" ? 78 : 62,
      }),
      notice: `${activeSection.status}. NO ANSWERS SAVED.`,
    });
  }, [activeSection, onControlPanelChange]);

  return (
    <section className="assessment-shell safety-planning-module" aria-labelledby="safety-plan-title">
      <div className="assessment-panel safety-plan-panel">
        <div className="terminal-label">MODULE: SAFETY PLANNING</div>
        <h1 id="safety-plan-title">CONSIDERATION MAP.</h1>
        <p>
          This module cannot guarantee safety or tell you what to do. It helps name what may need to
          be considered before, during, or after leaving. If action is needed, the safest next human
          contact is usually a trusted person, police or emergency services, or an advocate at a DV
          shelter or crisis center.
        </p>
        <div className="safety-section-grid" aria-label="Safety planning sections">
          {safetyPlanSections.map((section, index) => (
            <button
              className={section.id === activeSection.id ? "safety-section-key active" : "safety-section-key"}
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{section.title}</strong>
              <small>{section.subtitle}</small>
            </button>
          ))}
        </div>

        <article className="screenshot-plan-card" aria-labelledby="active-safety-section">
          <div className="screenshot-card-header">
            <span>{activeSection.status}</span>
            <span>SCREENSHOT {String(activeIndex + 1).padStart(2, "0")}/{String(safetyPlanSections.length).padStart(2, "0")}</span>
          </div>
          <h2 id="active-safety-section">&lt;{activeSection.title}&gt;</h2>
          <p>{activeSection.subtitle}</p>
          <ul>
            {activeSection.screenshotLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>

        <div className="safety-detail-grid">
          {activeSection.detailGroups.map((group) => (
            <section className="pattern-panel safety-detail-card" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="terminal-actions denial-actions">
          <button type="button" onClick={() => onNavigate("local-help", "/resources")}>
            Find Advocate Or Crisis Help
          </button>
          <button type="button" onClick={() => onNavigate("legal", "/resources")}>
            Understand Reporting Options
          </button>
          <button type="button" onClick={onBack}>
            Back To Planning
          </button>
          <button type="button" onClick={leaveSite}>
            Quick Exit
          </button>
        </div>
      </div>
      <p className="session-note">Nothing entered here is saved. Screenshot only if storing images is safe on this device.</p>
    </section>
  );
}

function PlanningLanding({
  onOpenLadder,
  onOpenSafety,
  onOpenExitPlanning,
  onNavigate,
}: {
  onOpenLadder: () => void;
  onOpenSafety: () => void;
  onOpenExitPlanning: () => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return (
    <section className="assessment-shell planning-landing" aria-labelledby="planning-landing-title">
      <div className="assessment-panel planning-landing-panel">
        <div className="terminal-label">MOTHER PAGE: PLANNING</div>
        <h1 id="planning-landing-title">CHOOSE THE PLANNING TOOL.</h1>
        <p>
          Planning does not mean deciding today. It means understanding the moving parts: people,
          places, devices, pets, documents, shelter systems, and what kind of help exists.
        </p>

        <div className="planning-module-grid">
          <button className="planning-module-key primary" type="button" onClick={() => onNavigate("am-i-crazy", "/am-i-crazy")}>
            <span>FIRST TOOL</span>
            <strong>Am I Crazy?</strong>
            <small>A reality-check assessment for confusion, gaslighting, control, and self-doubt.</small>
          </button>
          <button className="planning-module-key primary" type="button" onClick={onOpenLadder}>
            <span>START HERE</span>
            <strong>Leaving Ladder</strong>
            <small>For not-ready, unsure, or still-sorting-it-out mode.</small>
          </button>
          <button className="planning-module-key" type="button" onClick={onOpenSafety}>
            <span>LIVE TOOL</span>
            <strong>Safety Considerations</strong>
            <small>Names what to think through without guaranteeing safety or prescribing a plan.</small>
          </button>
          <button className="planning-module-key" type="button" onClick={onOpenExitPlanning}>
            <span>DEEPER TOOL</span>
            <strong>Exit Planning</strong>
            <small>For when the user wants to map barriers and possible next supports.</small>
          </button>
          <button className="planning-module-key" type="button" onClick={() => onNavigate("go-bag-prep", "/go-bag-prep")}>
            <span>SIMULATOR</span>
            <strong>Go-Bag Prep</strong>
            <small>A no-save, in-browser simulator for thinking through urgent items.</small>
          </button>
        </div>
      </div>
    </section>
  );
}

function PlanningResourcePage({
  backLabel = "Back To How To Guides",
  onBack,
  resourceId,
}: {
  backLabel?: string;
  onBack: () => void;
  resourceId: string;
}) {
  const resource = planningResourcePages.find((page) => page.id === resourceId) ?? planningResourcePages[0];

  return (
    <section className="assessment-shell planning-resource-page" aria-labelledby="planning-resource-title">
      <div className="assessment-panel safety-plan-panel">
        <div className="terminal-label">PLANNING RESOURCE</div>
        <article className="screenshot-plan-card" aria-labelledby="planning-resource-title">
          <div className="screenshot-card-header">
            <span>{resource.status}</span>
            <span>LIVE PAGE // NO PDF EMBED</span>
          </div>
          <h1 id="planning-resource-title">&lt;{resource.title}&gt;</h1>
          <p>{resource.subtitle}</p>
          <ul>
            {resource.screenshotLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
        <div className="safety-detail-grid">
          {resource.detailGroups.map((group) => (
            <section className="pattern-panel safety-detail-card" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="terminal-actions denial-actions">
          <button type="button" onClick={onBack}>
            {backLabel}
          </button>
          <button type="button" onClick={leaveSite}>
            Quick Exit
          </button>
        </div>
      </div>
    </section>
  );
}

function PlanningModule({
  onControlPanelChange,
  onNavigate,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [mode, setMode] = useState<"landing" | "ladder" | "response" | "complete" | "exit-planning" | "safety-planning">("landing");
  const [activeRung, setActiveRung] = useState<LeavingLadderRung | null>(null);
  const [visitedRungIds, setVisitedRungIds] = useState<string[]>([]);
  const [responseDone, setResponseDone] = useState(false);
  const [progress, setProgress] = useState({
    clarity: 32,
    preparedness: 18,
    reality: 34,
    options: 24,
  });
  const [gaugeNotice, setGaugeNotice] = useState("LEAVING LADDER ONLINE. NO DECISION REQUIRED.");
  const [gaugeEmphasis, setGaugeEmphasis] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "exit-planning" || mode === "safety-planning") return;

    onControlPanelChange({
      emphasis: gaugeEmphasis,
      gauges: ladderGaugeValues(progress),
      notice: gaugeNotice,
    });
  }, [gaugeEmphasis, gaugeNotice, mode, onControlPanelChange, progress]);

  function openRung(rung: LeavingLadderRung) {
    setActiveRung(rung);
    setResponseDone(false);
    setMode("response");
  }

  function completeRungTyping() {
    if (!activeRung) {
      setResponseDone(true);
      return;
    }

    setVisitedRungIds((current) => (current.includes(activeRung.id) ? current : [...current, activeRung.id]));
    setProgress((current) => ({
      clarity: clampGauge(current.clarity + activeRung.effect.clarity),
      preparedness: clampGauge(current.preparedness + activeRung.effect.preparedness),
      reality: clampGauge(current.reality + activeRung.effect.reality),
      options: clampGauge(current.options + activeRung.effect.options),
    }));
    setGaugeNotice(activeRung.effect.notice);
    setGaugeEmphasis(activeRung.effect.emphasis);
    setResponseDone(true);
  }

  function resetLadder() {
    setMode("landing");
    setActiveRung(null);
    setVisitedRungIds([]);
    setResponseDone(false);
    setProgress({ clarity: 32, preparedness: 18, reality: 34, options: 24 });
    setGaugeNotice("LEAVING LADDER ONLINE. NO DECISION REQUIRED.");
    setGaugeEmphasis(null);
  }

  if (mode === "exit-planning") {
    return <ExitPlanningModule onControlPanelChange={onControlPanelChange} onNavigate={onNavigate} />;
  }

  if (mode === "safety-planning") {
    return (
      <SafetyPlanningModule
        onBack={() => setMode("landing")}
        onControlPanelChange={onControlPanelChange}
        onNavigate={onNavigate}
      />
    );
  }

  if (mode === "landing") {
    return (
      <PlanningLanding
        onNavigate={onNavigate}
        onOpenExitPlanning={() => setMode("exit-planning")}
        onOpenLadder={() => setMode("ladder")}
        onOpenSafety={() => setMode("safety-planning")}
      />
    );
  }

  return (
    <section className="assessment-shell leaving-ladder" aria-labelledby="ladder-title">
      {mode === "ladder" && (
        <div className="assessment-panel ladder-panel">
          <div className="terminal-label">MODULE: LEAVING LADDER</div>
          <h1 id="ladder-title">NOT READY DOES NOT MEAN STUCK.</h1>
          <p>
            You do not have to decide today. You can look at the ladder, touch one rung, and still
            keep your choices private.
          </p>
          <div className="ladder-rung-grid">
            {leavingLadderRungs.map((rung, index) => (
              <button
                className={visitedRungIds.includes(rung.id) ? "ladder-rung visited" : "ladder-rung"}
                key={rung.id}
                type="button"
                onClick={() => openRung(rung)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{rung.title}</strong>
                <small>{rung.premise}</small>
              </button>
            ))}
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={() => setMode("safety-planning")}>
              Safety Considerations
            </button>
            <button type="button" onClick={() => setMode("exit-planning")}>
              Start Exit Planning
            </button>
            <button type="button" onClick={() => onNavigate("go-bag-prep", "/go-bag-prep")}>
              Go-Bag Prep
            </button>
            <button type="button" onClick={() => setMode("complete")}>
              Not Ready // Understanding Increased
            </button>
            <button type="button" onClick={() => setMode("landing")}>
              Back To Planning
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "response" && activeRung && (
        <div className={activeRung.id === "housing" ? "assessment-panel direct-panel ladder-panel" : "assessment-panel ladder-panel"}>
          <div className="terminal-label">SYSTEM RESPONSE</div>
          <h2>{activeRung.title}</h2>
          <TypedText
            className="system-typed-text"
            onDone={completeRungTyping}
            skipLabel="Print Response"
            text={activeRung.systemResponse}
          />
          {responseDone && (
            <>
              <div className="pattern-panel">
                <h3>ONE SMALL ACTION</h3>
                <p>{activeRung.suggestedAction}</p>
              </div>
              {activeRung.contextSignal && (
                <div className="pattern-panel context-signal-panel">
                  <h3>{activeRung.contextSignal.title}</h3>
                  {activeRung.contextSignal.body.split("\n\n").map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              )}
              <div className="terminal-actions denial-actions">
                <button type="button" onClick={() => setMode("ladder")}>
                  Choose Another Rung
                </button>
                <button type="button" onClick={() => setMode("safety-planning")}>
                  Build Safety Plan
                </button>
                <button type="button" onClick={() => setMode("exit-planning")}>
                  Start Exit Planning
                </button>
                <button type="button" onClick={() => onNavigate("go-bag-prep", "/go-bag-prep")}>
                  Go-Bag Prep
                </button>
                <button type="button" onClick={() => onNavigate("local-help", "/resources")}>
                  Resources
                </button>
                <button type="button" onClick={() => onNavigate("legal", "/resources")}>
                  Legal
                </button>
                <button type="button" onClick={() => setMode("complete")}>
                  Not Ready // Understanding Increased
                </button>
                <button type="button" onClick={() => setMode("landing")}>
                  Back To Planning
                </button>
                <button type="button" onClick={leaveSite}>
                  Quick Exit
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {mode === "complete" && (
        <div className="assessment-panel ladder-panel">
          <div className="terminal-label">LADDER PAUSED</div>
          <h2>YOU DID NOT FAIL THE MODULE.</h2>
          <p>
            Not being ready is information, not a character flaw. Your system noticed more than it
            did before. That counts.
          </p>
          <div className="pattern-panel">
            <h3>WHAT CHANGED</h3>
            <p>
              {visitedRungIds.length > 0
                ? `${visitedRungIds.length} rung${visitedRungIds.length === 1 ? "" : "s"} reviewed. No answers saved.`
                : "No rungs selected yet. No answers saved."}
            </p>
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={() => setMode("ladder")}>
              Return To The Ladder
            </button>
            <button type="button" onClick={() => setMode("safety-planning")}>
              Build Safety Plan
            </button>
            <button type="button" onClick={() => setMode("exit-planning")}>
              Start Exit Planning
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Back To Terminal
            </button>
            <button type="button" onClick={() => setMode("landing")}>
              Back To Planning
            </button>
            <button type="button" onClick={resetLadder}>
              Clear This Session
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {visitedRungIds.length > 0 && (
        <p className="session-note">Temporary ladder signals are erased when this session clears, refreshes, or exits.</p>
      )}
    </section>
  );
}

function SnapTanfGuide({ onBack, onNavigate }: { onBack: () => void; onNavigate: (module: ModuleKey, path: string) => void }) {
  return (
    <section className="page-shell how-to-guide-page snap-tanf-guide" aria-labelledby="snap-tanf-title">
      <div className="page-kicker">
        <BookOpenCheck aria-hidden="true" />
        <p className="eyebrow">Resources // How To Guides</p>
      </div>

      <div className="how-to-hero">
        <div>
          <p className="terminal-label">LOAD GUIDE // SNAP + TANF</p>
          <h1 id="snap-tanf-title">&lt;How To Navigate SNAP &amp; TANF&gt;</h1>
          <p>
            Applying for benefits can feel overwhelming, especially when housing, money, safety,
            childcare, or transportation are already in motion. This guide breaks the system into
            steps: apply, document, interview, protect contact information, and follow up.
          </p>
        </div>
        <aside className="how-to-status-panel" aria-label="SNAP and TANF guide status">
          <span>GUIDE STATUS</span>
          <strong>LIVE PAGE</strong>
          <small>NO PDF EMBED // SCREENSHOT-FRIENDLY</small>
        </aside>
      </div>

      <div className="how-to-command-strip" aria-label="Guide quick map">
        <span>Apply First</span>
        <span>Ask Expedited</span>
        <span>Safe Contact</span>
        <span>DV Protections</span>
        <span>Appeal Deadline</span>
      </div>

      <div className="snap-guide-grid">
        {snapTanfSections.map((section, index) => (
          <article className="snap-guide-card" key={section.id}>
            <div className="snap-guide-card-header">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{section.id.replaceAll("-", " ")}</small>
            </div>
            <h2>&lt;{section.title}&gt;</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.phrases ? (
              <div className="phrase-bank">
                <div className="terminal-label">PHRASES TO USE</div>
                {section.phrases.map((phrase) => (
                  <code key={phrase}>{phrase}</code>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <section className="how-to-system-note" aria-labelledby="snap-navigation-system-title">
        <h2 id="snap-navigation-system-title">&lt;When One Application Turns Into Six&gt;</h2>
        <p>
          SNAP and TANF may only cover part of what is needed. Childcare, transportation, housing,
          utility assistance, emergency financial help, and local services can each bring their own
          forms, deadlines, calls, and document requests.
        </p>
        <p>
          The access library holds the deeper Resource Navigation System: trackers for
          applications, case numbers, worker information, documents, deadlines, phone-call notes,
          local resources, and what to work on next.
        </p>
        <div className="terminal-actions denial-actions">
          <button type="button" onClick={() => onNavigate("library", "/resources")}>
            View Access Options
          </button>
          <button type="button" onClick={onBack}>
            Back To How To Guides
          </button>
          <button type="button" onClick={leaveSite}>
            Quick Exit
          </button>
        </div>
      </section>
    </section>
  );
}

function PracticalHowToGuide({
  guide,
  onBack,
  onNavigate,
}: {
  guide: PracticalGuide;
  onBack: () => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return (
    <section className="page-shell how-to-guide-page" aria-labelledby={`${guide.id}-title`}>
      <div className="page-kicker">
        <BookOpenCheck aria-hidden="true" />
        <p className="eyebrow">Resources // How To Guides</p>
      </div>

      <div className="how-to-hero">
        <div>
          <p className="terminal-label">{guide.terminalLabel}</p>
          <h1 id={`${guide.id}-title`}>&lt;{guide.title}&gt;</h1>
          <p>{guide.intro}</p>
        </div>
        <aside className="how-to-status-panel" aria-label={`${guide.title} status`}>
          <span>GUIDE STATUS</span>
          <strong>LIVE PAGE</strong>
          <small>NO PDF EMBED // SCREENSHOT-FRIENDLY</small>
        </aside>
      </div>

      <div className="how-to-command-strip" aria-label="Guide quick map">
        {guide.quickMap.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <div className="snap-guide-grid">
        {guide.sections.map((section, index) => (
          <article className="snap-guide-card" key={section.id}>
            <div className="snap-guide-card-header">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{section.id.replaceAll("-", " ")}</small>
            </div>
            <h2>&lt;{section.title}&gt;</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.phrases ? (
              <div className="phrase-bank">
                <div className="terminal-label">PHRASES / PROMPTS</div>
                {section.phrases.map((phrase) => (
                  <code key={phrase}>{phrase}</code>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {guide.systemNote ? (
        <section className="how-to-system-note" aria-labelledby={`${guide.id}-system-note`}>
          <h2 id={`${guide.id}-system-note`}>&lt;{guide.systemNote.title}&gt;</h2>
          {guide.systemNote.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="terminal-actions denial-actions">
            {guide.systemNote.primaryAction ? (
              <button
                type="button"
                onClick={() =>
                  guide.systemNote?.primaryAction
                    ? onNavigate(guide.systemNote.primaryAction.target, guide.systemNote.primaryAction.path)
                    : undefined
                }
              >
                {guide.systemNote.primaryAction.label}
              </button>
            ) : null}
            <button type="button" onClick={onBack}>
              Back To How To Guides
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function HowToModule({
  initialPriority = null,
  onBackToResources,
  onNavigate,
}: {
  initialPriority?: HowToGuide["priority"] | null;
  onBackToResources?: () => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [activePriorityId, setActivePriorityId] = useState<HowToGuide["priority"] | null>(initialPriority);
  const planningResourceMap: Record<string, string> = {
    "browser-trace-cleanup": "digital-traces",
    "pet-safety-plan": "pet-plan",
  };
  const activeResourceId = activeGuideId ? planningResourceMap[activeGuideId] : null;
  const activePriority = activePriorityId ? howToPriorities.find((priority) => priority.id === activePriorityId) : null;
  const visibleGuides = activePriorityId ? howToGuides.filter((guide) => guide.priority === activePriorityId) : [];

  useEffect(() => {
    setActiveGuideId(null);
    setActivePriorityId(initialPriority);
  }, [initialPriority]);

  if (activeGuideId === "snap-tanf") {
    return <SnapTanfGuide onBack={() => setActiveGuideId(null)} onNavigate={onNavigate} />;
  }

  if (activeGuideId && practicalGuides[activeGuideId]) {
    return (
      <PracticalHowToGuide
        guide={practicalGuides[activeGuideId]}
        onBack={() => setActiveGuideId(null)}
        onNavigate={onNavigate}
      />
    );
  }

  if (activeResourceId) {
    return <PlanningResourcePage onBack={() => setActiveGuideId(null)} resourceId={activeResourceId} />;
  }

  return (
    <section className="page-shell how-to-module" aria-labelledby="how-to-title">
      <div className="page-kicker">
        <BookOpenCheck aria-hidden="true" />
        <p className="eyebrow">Resources // How To Guides</p>
      </div>

      <div className="how-to-hero">
        <div>
          <p className="terminal-label">LOAD RESOURCES // HOW TO GUIDES</p>
          <h1 id="how-to-title">&lt;Resource Priorities&gt;</h1>
          <p className="how-to-subtitle">HOW TO GUIDES</p>
          <p>
            Practical guides are sorted by priority so the screen does not throw the whole system at
            the user at once. Open a folder first, then choose the guide that matches the next move.
          </p>
        </div>
        <aside className="how-to-status-panel" aria-label="How to guide status">
          <span>{activePriority ? activePriority.label : "GUIDE INDEX"}</span>
          <strong>ONLINE</strong>
          <small>{activePriority ? "FOLDER OPEN // LIVE GUIDES" : "PRIORITY FOLDERS // NO STATIC PDF EMBEDS"}</small>
        </aside>
      </div>

      {!activePriority ? (
        <div className="how-to-priority-grid">
          {howToPriorities.map((priority) => {
            const count = howToGuides.filter((guide) => guide.priority === priority.id).length;
            return (
              <article className="how-to-priority-card" key={priority.id}>
                <div className="how-to-guide-card-header">
                  <span>{priority.label}</span>
                  <small>{count} GUIDES</small>
                </div>
                <h2>&lt;{priority.title}&gt;</h2>
                <p>{priority.description}</p>
                <button type="button" onClick={() => setActivePriorityId(priority.id)}>
                  Open Folder
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <>
          <div className="how-to-folder-bar">
            <div>
              <p className="terminal-label">FOLDER OPEN</p>
              <h2>&lt;{activePriority.title}&gt;</h2>
            </div>
            <button type="button" onClick={onBackToResources ?? (() => setActivePriorityId(null))}>
              {onBackToResources ? "Back To Resource Folders" : "Back To Priority Folders"}
            </button>
          </div>

          <div className="how-to-guide-grid">
            {visibleGuides.map((guide, index) => (
              <article className="how-to-guide-card" key={guide.id}>
                <div className="how-to-guide-card-header">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{guide.status}</small>
                </div>
                <h2>&lt;{guide.title}&gt;</h2>
                <p className="how-to-guide-subtitle">{guide.subtitle}</p>
                <p>{guide.description}</p>
                {guide.action === "navigate" ? (
                  <button type="button" onClick={() => onNavigate(guide.target ?? "home", guide.path ?? "/")}>
                    Open Guide
                  </button>
                ) : (
                  <button type="button" onClick={() => setActiveGuideId(guide.id)}>
                    Open Guide
                  </button>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ExitPlanningModule({
  onControlPanelChange,
  onNavigate,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [mode, setMode] = useState<"intro" | "question" | "response" | "complete">("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<ExitAnswer | null>(null);
  const [responseDone, setResponseDone] = useState(false);
  const [answered, setAnswered] = useState<ExitAnswer[]>([]);
  const [gauges, setGauges] = useState<ExitGaugeState>({
    readiness: 25,
    exposure: 12,
    backup: 18,
    exposureFloor: 12,
  });
  const [gaugeNotice, setGaugeNotice] = useState("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO PLAN LOADED.");
  const [gaugeEmphasis, setGaugeEmphasis] = useState<string | null>(null);

  const currentQuestion = exitPlanningQuestions[questionIndex];

  useEffect(() => {
    onControlPanelChange({
      emphasis: gaugeEmphasis,
      gauges: exitGaugeValues(gauges),
      notice: gaugeNotice,
    });
  }, [gaugeEmphasis, gaugeNotice, gauges, onControlPanelChange]);

  function beginPlanning() {
    setMode("question");
  }

  function showEmergencyOptions() {
    setActiveAnswer(null);
    setResponseDone(false);
    setQuestionIndex(0);
    setMode("question");
  }

  function selectExitAnswer(answer: ExitAnswer) {
    setAnswered((current) => [...current, answer]);
    setActiveAnswer(answer);
    setResponseDone(false);
    setGaugeEmphasis(null);
    setMode("response");
  }

  function continuePlan() {
    setActiveAnswer(null);
    if (questionIndex >= exitPlanningQuestions.length - 1) {
      setMode("complete");
      return;
    }
    setQuestionIndex((current) => current + 1);
    setMode("question");
  }

  function clearPlanning() {
    setMode("intro");
    setQuestionIndex(0);
    setActiveAnswer(null);
    setResponseDone(false);
    setAnswered([]);
    setGauges({ readiness: 25, exposure: 12, backup: 18, exposureFloor: 12 });
    setGaugeNotice("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO PLAN LOADED.");
    setGaugeEmphasis(null);
  }

  function quickExitPlanning() {
    clearPlanning();
    leaveSite();
  }

  const completeExitTyping = useCallback(() => {
    if (!activeAnswer) {
      setResponseDone(true);
      return;
    }

    const effect = activeAnswer.effect;
    setGauges((current) => {
      const exposureFloor = Math.max(current.exposureFloor, effect.minExposure ?? current.exposureFloor);
      return {
        readiness: clampGauge(current.readiness + effect.readiness),
        exposure: Math.max(exposureFloor, clampGauge(current.exposure + effect.exposure)),
        backup: clampGauge(current.backup + effect.backup),
        exposureFloor,
      };
    });
    setGaugeNotice(`UPDATING EXIT READINGS... ${effect.notice}`);
    setGaugeEmphasis(
      effect.emphasis === "readiness"
        ? "EXIT READINESS"
        : effect.emphasis === "exposure"
          ? "EXPOSURE LEVEL"
          : "BACKUP STATUS",
    );
    setResponseDone(true);
  }, [activeAnswer]);

  const highExposure = gauges.exposure >= 66;
  const backupAvailable = gauges.backup >= 76;
  const recommendedStep = highExposure
    ? "review device safety before making further plans"
    : backupAvailable
      ? "identify one possible first-night destination"
      : "identify one public place reachable without transportation";

  return (
    <section className="assessment-shell" aria-labelledby="exit-title">
      {mode === "intro" && (
        <div className="assessment-panel">
          <div className="terminal-label">MODULE: EXIT PLANNING</div>
          <h1 id="exit-title">EXIT PLANNING PROTOCOL // NOW WHAT?</h1>
          <TypedText
            className="system-typed-text"
            skipLabel="Print Module Brief"
            text={
              "SYSTEM:\nEXIT REQUEST RECEIVED.\n\nKnowing you need to leave and being able to leave are not the same thing.\n\nThis module will not tell you to just leave. It will help identify what must happen first, what could go wrong, what options are available, and what you can do next.\n\nYour answers will not be saved."
            }
          />
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={beginPlanning}>
              Begin Exit Planning
            </button>
            <button type="button" onClick={showEmergencyOptions}>
              Emergency Options
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/resources")}>
              Understand Choices First
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Back To Homepage
            </button>
            <button type="button" onClick={quickExitPlanning}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "question" && currentQuestion && (
        <div className="assessment-panel">
          <div className="question-status">
            <span>{currentQuestion.phase}</span>
            <span>TEMP MEMORY ONLY</span>
          </div>
          <h2>{currentQuestion.prompt}</h2>
          <div className="answer-grid">
            {currentQuestion.answers.map((answer, index) => (
              <button key={answer.id} type="button" onClick={() => selectExitAnswer(answer)}>
                <span>{String.fromCharCode(65 + index)}</span>
                {answer.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "response" && activeAnswer && (
        <div className={activeAnswer.effect.minExposure && activeAnswer.effect.minExposure >= 46 ? "assessment-panel direct-panel" : "assessment-panel"}>
          <div className="terminal-label">SYSTEM RESPONSE</div>
          <h2>{activeAnswer.responseTitle}</h2>
          <TypedText
            className="system-typed-text"
            onDone={completeExitTyping}
            skipLabel="Print Response"
            text={`SYSTEM:\n${activeAnswer.response}`}
          />
          {responseDone && (
            <div className="proceed-terminal">
              <div className="terminal-label">HOW WOULD YOU LIKE TO PROCEED?</div>
              <div className="terminal-actions denial-actions">
                <button type="button" onClick={continuePlan}>
                  Continue Building Plan
                </button>
                <button type="button" onClick={showEmergencyOptions}>
                  Show Emergency Options
                </button>
                <button type="button" onClick={() => onNavigate("home", "/")}>
                  Pause And Think
                </button>
                <button type="button" onClick={quickExitPlanning}>
                  Quick Exit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "complete" && (
        <div className="assessment-panel">
          <div className="terminal-label">EXIT SYSTEM STATUS</div>
          <h2>EXIT PLAN INITIALIZED.</h2>
          <p>You do not have to complete every task today. You do not have to announce your plan.</p>
          <div className="pattern-panel">
            <h3>NEXT RECOMMENDED STEP</h3>
            <p>{recommendedStep.toUpperCase()}.</p>
            <p>ONE ACTION IS STILL ACTION. CONTROL RETURNS IN INCREMENTS.</p>
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={() => onNavigate("local-help", "/resources")}>
              Show Relevant Free Resources
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/resources")}>
              Understand Choices
            </button>
            <button type="button" onClick={clearPlanning}>
              Restart With A Different Barrier
            </button>
            <button type="button" onClick={clearPlanning}>
              Clear This Session
            </button>
            <button type="button" onClick={quickExitPlanning}>
              Quick Exit
            </button>
          </div>
        </div>
      )}
      {answered.length > 0 && <p className="session-note">Temporary planning signals are erased when this session clears, refreshes, or exits.</p>}
    </section>
  );
}

type ResourceFolder = "landing" | HowToGuide["priority"] | "legal" | "library" | "access";

function getInitialResourceFolder(moduleKey: Exclude<ModuleKey, "home" | "am-i-crazy" | "go-bag-prep">): ResourceFolder {
  if (moduleKey === "how-to") return "landing";
  if (moduleKey === "legal") return "legal";
  if (moduleKey === "library") return "library";
  if (moduleKey === "access") return "access";
  return "landing";
}

function AccessInformationModule() {
  return (
    <section className="page-shell library-module access-module" aria-labelledby="access-title">
      <div className="page-kicker">
        <BookOpenCheck aria-hidden="true" />
        <p className="eyebrow">Ctrl+A // Access Information</p>
      </div>

      <div className="library-hero-panel">
        <div>
          <p className="terminal-label">LOAD MODULE // ACCESS PASS INFORMATION</p>
          <h1 id="access-title">&lt;Access Pass Information&gt;</h1>
          <p>
            Access passes are designed to keep resources flexible: preview what is available, choose
            a short access window, and use permanent unlocks only for downloads that matter most.
          </p>
        </div>
        <aside className="library-status-panel" aria-label="Access pass status">
          <span>CTRL+A</span>
          <strong>ACCESS INFO</strong>
          <small>VIEWING + UNLOCK RULES</small>
        </aside>
      </div>

      <div className="library-rule-strip" aria-label="Access pass basics">
        <span>Short Access Windows</span>
        <span>Unlimited Viewing During Active Pass</span>
        <span>Limited Permanent Unlocks</span>
        <span>No Forced Subscription</span>
      </div>

      <section className="library-section" aria-labelledby="access-options-title">
        <div className="terminal-label">ACCESS OPTIONS</div>
        <h2 id="access-options-title">&lt;Choose The Amount Of Help Needed&gt;</h2>
        <div className="library-pass-grid">
          {libraryPasses.map((pass) => (
            <article className="library-pass-card" key={pass.id}>
              <div className="library-card-header">
                <span>{pass.price}</span>
                <small>{pass.stripeStatus}</small>
              </div>
              <h3>{pass.title}</h3>
              <p>{pass.scope}</p>
              <ul>
                <li>{pass.viewing}</li>
                <li>{pass.unlocks}</li>
                <li>{pass.renewal}</li>
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ResourceModule({
  moduleKey,
  onNavigate,
}: {
  moduleKey: Exclude<ModuleKey, "home" | "am-i-crazy" | "go-bag-prep">;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [activeFolder, setActiveFolder] = useState<ResourceFolder>(() => getInitialResourceFolder(moduleKey));

  useEffect(() => {
    setActiveFolder(getInitialResourceFolder(moduleKey));
  }, [moduleKey]);

  if (activeFolder === "legal") {
    return (
      <section className="resources-nested-shell">
        <button className="resource-back-button" type="button" onClick={() => setActiveFolder("landing")}>
          Back To Resource Folders
        </button>
        <LegalModule />
      </section>
    );
  }

  if (activeFolder === "library") {
    return (
      <section className="resources-nested-shell">
        <button className="resource-back-button" type="button" onClick={() => setActiveFolder("landing")}>
          Back To Resource Folders
        </button>
        <LibraryModule />
      </section>
    );
  }

  if (activeFolder === "access") {
    return (
      <section className="resources-nested-shell">
        <button className="resource-back-button" type="button" onClick={() => setActiveFolder("landing")}>
          Back To Resource Folders
        </button>
        <AccessInformationModule />
      </section>
    );
  }

  if (activeFolder === "priority-1" || activeFolder === "priority-2" || activeFolder === "priority-3") {
    return (
      <HowToModule
        initialPriority={activeFolder}
        onBackToResources={() => setActiveFolder("landing")}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <section className="page-shell resources-module" aria-labelledby="resources-title">
      <div className="page-kicker">
        <Compass aria-hidden="true" />
        <p className="eyebrow">Ctrl+Fn // Resources</p>
      </div>

      <div className="resources-hero">
        <div>
          <p className="terminal-label">LOAD MODULE // RESOURCE FOLDERS</p>
          <h1 id="resources-title">&lt;Resources&gt;</h1>
          <p>
            Resources are grouped by urgency so the user can open one folder at a time. Priority 1
            holds first moves. Priority 2 holds systems navigation. Priority 3 holds stabilizing and
            rebuilding. Legal and Library live here too.
          </p>
        </div>
        <aside className="how-to-status-panel" aria-label="Resources status">
          <span>RESOURCE INDEX</span>
          <strong>ONLINE</strong>
          <small>FOLDER MODE // NO INFORMATION DUMP</small>
        </aside>
      </div>

      <div className="resource-folder-grid">
        {howToPriorities.map((priority) => {
          const count = howToGuides.filter((guide) => guide.priority === priority.id).length;
          return (
            <article className="resource-folder-card priority-folder-card" key={priority.id}>
              <div className="folder-icon" aria-hidden="true">
                <span />
              </div>
              <div className="how-to-guide-card-header">
                <span>{priority.label}</span>
                <small>{count} GUIDES</small>
              </div>
              <h2>&lt;Resources {priority.label.replace("Priority ", "Priority ")}&gt;</h2>
              <h3>{priority.title}</h3>
              <p>{priority.description}</p>
              <button type="button" onClick={() => setActiveFolder(priority.id)}>
                Open Folder
              </button>
            </article>
          );
        })}

        <article className="resource-folder-card">
          <div className="how-to-guide-card-header">
            <span>LEGAL</span>
            <small>2 GUIDES</small>
          </div>
          <h2>&lt;Legal Resources&gt;</h2>
          <h3>Family Court + Protective Orders</h3>
          <p>
            Legal orientation lives here: Family Court Guide and Civil Protective Order Guide. No
            legal advice, just language, structure, and what to ask before filing.
          </p>
          <button type="button" onClick={() => setActiveFolder("legal")}>
            Open Folder
          </button>
        </article>

        <article className="resource-folder-card">
          <div className="how-to-guide-card-header">
            <span>LIBRARY</span>
            <small>ACCESS</small>
          </div>
          <h2>&lt;Resource Library&gt;</h2>
          <h3>Paid Guides + Deeper Systems</h3>
          <p>
            The access library holds resources such as planners, trackers and more in depth guides.
            See "Ctrl+A for Access Pass Information."
          </p>
          <button type="button" onClick={() => setActiveFolder("library")}>
            Open Folder
          </button>
        </article>

        <article className="resource-folder-card">
          <div className="how-to-guide-card-header">
            <span>CTRL+A</span>
            <small>ACCESS INFO</small>
          </div>
          <h2>&lt;Access Information&gt;</h2>
          <h3>Pass Options + Unlock Rules</h3>
          <p>
            Review access windows, viewing rules, permanent unlocks, and how downloads will work
            before choosing a pass.
          </p>
          <button type="button" onClick={() => setActiveFolder("access")}>
            Open Folder
          </button>
        </article>
      </div>
    </section>
  );
}

function LibraryModule() {
  return (
    <section className="page-shell library-module" aria-labelledby="library-title">
      <div className="page-kicker">
        <BookOpenCheck aria-hidden="true" />
        <p className="eyebrow">Resources // Library</p>
      </div>

      <div className="library-hero-panel">
        <div>
          <p className="terminal-label">LOAD MODULE // PAID RESOURCE LIBRARY</p>
          <h1 id="library-title">&lt;Survivor Operating System Library&gt;</h1>
          <p>
            Free crisis tools stay live in the app. The paid library holds deeper templates,
            trackers, guides, and long-form systems for people who want more structure without a
            forced subscription.
          </p>
        </div>
        <aside className="library-status-panel" aria-label="Library access status">
          <span>ACCESS MODEL</span>
          <strong>FLEXIBLE PASSES</strong>
          <small>STRIPE + SUPABASE WIRING PENDING</small>
        </aside>
      </div>

      <div className="library-rule-strip" aria-label="Library rules">
        <span>Unlimited Viewing During Active Pass</span>
        <span>Permanent Unlocks Stay Available</span>
        <span>Signed Download Links</span>
        <span>No Forced Renewal</span>
      </div>

      <section className="library-section" aria-labelledby="library-options-title">
        <div className="terminal-label">PURCHASE PATHS</div>
        <h2 id="library-options-title">&lt;Choose Access Mode&gt;</h2>
        <div className="library-pass-grid">
          {libraryPasses.map((pass) => (
            <article className="library-pass-card" key={pass.id}>
              <div className="library-card-header">
                <span>{pass.price}</span>
                <small>{pass.stripeStatus}</small>
              </div>
              <h3>{pass.title}</h3>
              <p>{pass.scope}</p>
              <ul>
                <li>{pass.viewing}</li>
                <li>{pass.unlocks}</li>
                <li>{pass.renewal}</li>
              </ul>
              <button type="button" disabled>
                Stripe Checkout Pending
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="library-section" aria-labelledby="library-categories-title">
        <div className="terminal-label">FOCUS PASS CATEGORIES</div>
        <h2 id="library-categories-title">&lt;Choose One Area&gt;</h2>
        <div className="library-category-grid">
          {libraryCategories.map((category) => (
            <article className="library-category-card" key={category.id}>
              <span>{String(category.resourceCount).padStart(2, "0")} RESOURCES</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="library-section" aria-labelledby="library-preview-title">
        <div className="terminal-label">RESOURCE PREVIEWS</div>
        <h2 id="library-preview-title">&lt;Look Inside Before Unlocking&gt;</h2>
        <div className="library-preview-grid">
          {previewResources.map((resource) => (
            <article className="library-preview-card" key={resource.id}>
              <div className="library-preview-frame" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div>
                <span className="library-resource-format">{resource.format}</span>
                <h3>{resource.title}</h3>
                <p>{resource.preview}</p>
                <small>{resource.category}</small>
                <p className="library-access-note">{resource.access}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="library-system-grid" aria-label="Library implementation notes">
        <article className="library-system-card">
          <h2>&lt;Founder Access Bonus&gt;</h2>
          <p>
            First 100 unique paying library customers receive one extra Permanent Unlock. This is
            granted after payment by the webhook, without public discount codes or pricing changes.
          </p>
        </article>
        <article className="library-system-card">
          <h2>&lt;Access Enforcement&gt;</h2>
          <p>
            Stripe confirms payment. Supabase records access, pass expiration, unlock credits, and
            permanent unlocks. Private files are served with short-lived signed links only.
          </p>
        </article>
      </section>
    </section>
  );
}

function RebuildingModule({
  onNavigate,
}: {
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return (
    <section className="page-shell rebuilding-module" aria-labelledby="rebuilding-title">
      <div className="page-kicker">
        <Sprout aria-hidden="true" />
        <p className="eyebrow">Ctrl+Shift // Rebuilding</p>
      </div>

      <div className="rebuilding-hero">
        <div>
          <p className="terminal-label">LOAD MODULE // HOUSING NAVIGATION</p>
          <h1 id="rebuilding-title">&lt;How To Navigate Housing&gt;</h1>
          <p>
            Housing can feel like one giant locked door. It is usually a set of smaller doors:
            first night, waitlists, documents, transportation, privacy, benefits, advocates, and
            follow-up. This page helps name the system so it gets less impossible to approach.
          </p>
        </div>
        <aside className="rebuilding-status" aria-label="Housing navigation status">
          <span>SYSTEMS ONLINE</span>
          <strong>REBUILDING MODE</strong>
          <small>LIVE PAGE // NO PDF EMBED</small>
        </aside>
      </div>

      <div className="housing-command-strip" aria-label="Housing quick signals">
        <span>211</span>
        <span>Coordinated Entry</span>
        <span>DV Advocate</span>
        <span>Waitlists</span>
        <span>VAWA</span>
        <span>Track Everything</span>
      </div>

      <div className="rebuilding-section-grid">
        {housingGuideSections.map((section, index) => (
          <article className="rebuilding-guide-card" key={section.id}>
            <div className="rebuilding-guide-card-header">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{section.label}</small>
            </div>
            <h2>&lt;{section.title}&gt;</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <section className="rebuilding-bottom-line" aria-labelledby="housing-bottom-line">
        <p className="terminal-label">BOTTOM LINE</p>
        <h2 id="housing-bottom-line">&lt;One Mountain, Smaller Steps&gt;</h2>
        <p>
          Housing feels like one mountain, but it is actually a series of smaller steps, each one
          unlocking the next. Coordinated Entry gets you into the system. Community resources bridge
          gaps. Tracking helps you avoid losing ground you already gained. You do not have to figure
          all of this out at once. Start with the next step.
        </p>
        <div className="terminal-actions denial-actions">
          <button type="button" onClick={() => onNavigate("planning", "/planning")}>
            Prep / First Steps
          </button>
          <button type="button" onClick={() => onNavigate("local-help", "/resources")}>
            Find Resources
          </button>
          <button type="button" onClick={() => onNavigate("legal", "/resources")}>
            Legal Basics
          </button>
          <button type="button" onClick={leaveSite}>
            Quick Exit
          </button>
        </div>
      </section>
    </section>
  );
}

function LegalGuidePage({
  guide,
  onBack,
}: {
  guide: LegalGuidePageData;
  onBack: () => void;
}) {
  return (
    <section className="page-shell legal-module" aria-labelledby={`${guide.title.replaceAll(" ", "-").toLowerCase()}-title`}>
      <div className="page-kicker">
        <Scale aria-hidden="true" />
        <p className="eyebrow">{guide.eyebrow}</p>
      </div>

      <div className="legal-guide-shell">
        <div className="terminal-label">{guide.terminalLabel}</div>
        <h1 id={`${guide.title.replaceAll(" ", "-").toLowerCase()}-title`}>&lt;{guide.title}&gt;</h1>
        <p className="legal-tagline">// Legal orientation. No shame. No blindfold.</p>

        <div className="legal-intro">&lt;{guide.intro}&gt;</div>

        <div className="legal-warning">
          <strong>&gt;&gt; Not Legal Advice</strong>
          <p>{guide.warning}</p>
        </div>

        <section className="legal-motion-section" aria-label={`${guide.title} sections`}>
          <div className="legal-motion-grid">
            {guide.sections.map((section) => (
              <article className="legal-motion-card" key={section.title}>
                <h3>
                  {section.title}
                  {section.tag ? <span>{section.tag}</span> : null}
                </h3>
                {section.blocks.map((block) => (
                  <div className="legal-motion-block" key={block.title}>
                    <strong>&gt;&gt; {block.title}</strong>
                    <ul>
                      {block.items.map((item) => (
                        <li key={item.name ?? item.text}>
                          {item.name ? <span>{item.name}</span> : null}
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        {guide.notes ? (
          <div className="legal-note-grid">
            {guide.notes.map((note) => (
              <div className="legal-note" key={note.title}>
                <strong>&gt;&gt; {note.title}</strong>
                <p>{note.body}</p>
              </div>
            ))}
          </div>
        ) : null}

        {guide.reminder ? (
          <div className="legal-reminder">
            <strong>&gt;&gt; {guide.reminder.title}</strong>
            <p>{guide.reminder.body}</p>
          </div>
        ) : null}

        <div className="terminal-actions denial-actions">
          <button type="button" onClick={onBack}>
            Back To Legal
          </button>
          <button type="button" onClick={leaveSite}>
            Quick Exit
          </button>
        </div>
      </div>
    </section>
  );
}

function LegalModule() {
  const [activeView, setActiveView] = useState<"landing" | "motion-drafting" | "protective-orders" | "family-court-guide">(
    "landing",
  );

  if (activeView === "motion-drafting") {
    return (
      <section className="page-shell legal-module" aria-labelledby="motion-drafting-title">
        <div className="page-kicker">
          <Scale aria-hidden="true" />
          <p className="eyebrow">Legal // Family Court</p>
        </div>

        <div className="legal-guide-shell">
          <div className="terminal-label">user@survivor-os:~$ LOAD MODULE // MOTION DRAFTING</div>
          <h1 id="motion-drafting-title">&lt;Motion Drafting Basics&gt;</h1>
          <p className="legal-tagline">// Tools for clarity. Power for your future.</p>

          <div className="legal-intro">
            &lt;A motion is just a written request asking the court to do something. Before you write
            one word, you need to know which one you are actually filing. The wrong motion can get
            you a denial or delay instead of a hearing. This module starts where every filing
            should: research.&gt;
          </div>

          <div className="legal-warning">
            <strong>&gt;&gt; Read This First</strong>
            <p>
              This is general orientation, not legal advice. Motion names, formats, and filing rules
              are different in every state and sometimes every county. Nothing here replaces your
              local court's rules, your county clerk, or a legal aid attorney. Always confirm with
              your specific court before you file.
            </p>
          </div>

          <section className="legal-step-section" aria-labelledby="motion-step-title">
            <h2 id="motion-step-title">&gt;&gt; Step One: Research Before You Write</h2>
            <div className="legal-step-grid">
              {motionDraftingSteps.map((step) => (
                <article className="legal-step-card" key={step.number}>
                  <span>// {step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="legal-motion-section" aria-labelledby="family-motion-title">
            <h2 id="family-motion-title">&gt;&gt; Common Family Court Motions</h2>
            <div className="legal-motion-grid">
              {familyCourtMotionSections.map((section) => (
                <article className="legal-motion-card" key={section.title}>
                  <h3>
                    {section.title}
                    {section.tag ? <span>{section.tag}</span> : null}
                  </h3>
                  {section.blocks.map((block) => (
                    <div className="legal-motion-block" key={block.title}>
                      <strong>&gt;&gt; {block.title}</strong>
                      <ul>
                        {block.items.map((item) => (
                          <li key={item.name ?? item.text}>
                            {item.name ? <span>{item.name}</span> : null}
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </section>

          <div className="legal-note-grid">
            <div className="legal-note">
              <strong>&gt;&gt; Note</strong>
              <p>
                Not every state uses these exact names. Some call a Motion to Modify a Petition to
                Modify. Some fold temporary orders and emergency relief into one filing. The category
                matters more than the exact label. Use this list to identify what you need, then
                confirm the correct name and form in your jurisdiction.
              </p>
            </div>
            <div className="legal-note">
              <strong>&gt;&gt; Subscriber Library Connection</strong>
              <p>
                Subscribers have access to the Court Planner, which is built for everything that
                happens around the filing, not the motion itself: case numbers, court contacts, local
                resources, evidence logs, statement practice, court vocabulary, logistics, and
                after-court notes.
              </p>
            </div>
          </div>

          <div className="legal-reminder">
            <strong>&gt;&gt; Remember</strong>
            <p>
              You do not have to get the legal language perfect on the first try. Courts see
              self-represented filers regularly. What matters most: the right motion type, the right
              case number, a clear statement of what you are asking for, and why.
            </p>
          </div>

          <div className="terminal-actions denial-actions">
            <button type="button" onClick={() => setActiveView("landing")}>
              Back To Legal
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (activeView === "family-court-guide") {
    return <LegalGuidePage guide={familyCourtGuide} onBack={() => setActiveView("landing")} />;
  }

  if (activeView === "protective-orders") {
    return <LegalGuidePage guide={civilProtectiveOrderGuide} onBack={() => setActiveView("landing")} />;
  }

  return (
    <section className="page-shell legal-module" aria-labelledby="legal-title">
      <div className="page-kicker">
        <Scale aria-hidden="true" />
        <p className="eyebrow">Legal</p>
      </div>

      <div className="legal-header">
        <div>
          <p className="terminal-label">SURVIVOR OPERATING SYSTEM // LEGAL</p>
          <h1 id="legal-title">&lt;Legal Resources&gt;</h1>
          <p className="legal-command-subtitle">LEGAL RESOURCES</p>
          <p>
            Legal systems can be intimidating because they are systems with rules, deadlines,
            vocabulary, and power. This section is for orientation, language, and preparation before
            you ask a court, agency, advocate, or attorney for the next step.
          </p>
        </div>
        <aside className="legal-status" aria-label="Legal module status">
          <span>SYSTEM STATUS</span>
          <strong>LEGAL MODE ONLINE</strong>
          <small>GENERAL INFO // NOT LEGAL ADVICE</small>
        </aside>
      </div>

      <div className="legal-category-grid">
        {legalCategories
          .filter((category) => category.id === "protective-orders" || category.id === "family-court")
          .map((category) => (
            <article className="legal-category-card ready" key={category.id}>
              <div className="legal-category-card-header">
                <span>{category.label}</span>
                <small>LIVE GUIDE</small>
              </div>
              <h2>&lt;{category.title}&gt;</h2>
              <p>{category.description}</p>
              {category.id === "protective-orders" ? (
                <button type="button" onClick={() => setActiveView("protective-orders")}>
                  Civil Protective Order Guide
                </button>
              ) : category.id === "family-court" ? (
                <button type="button" onClick={() => setActiveView("family-court-guide")}>
                  Family Court Guide
                </button>
              ) : null}
            </article>
          ))}
      </div>
    </section>
  );
}

export function App() {
  const [checkpointPassed, setCheckpointPassed] = useState(() => getCheckpointCleared());
  const [activeModule, setActiveModule] = useState<ModuleKey>(() => getInitialModule());
  const [controlPanel, setControlPanel] = useState<ControlPanelState>(defaultControlPanel);
  const [loadingModule, setLoadingModule] = useState<ModuleKey | null>(null);

  useEffect(() => {
    const syncRoute = () => setActiveModule(getInitialModule());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (activeModule !== "am-i-crazy" && activeModule !== "planning" && activeModule !== "go-bag-prep") {
      setControlPanel(defaultControlPanel);
    }
  }, [activeModule]);

  const updateControlPanel = useCallback((panel: ControlPanelState) => {
    setControlPanel(panel);
  }, []);

  function navigate(module: ModuleKey, path: string) {
    if (module === activeModule && !loadingModule) {
      return;
    }

    window.history.pushState({}, "", path);
    setLoadingModule(module);
    window.setTimeout(() => {
      setActiveModule(module);
      setLoadingModule(null);
    }, 520);
  }

  function completeCheckpoint() {
    markCheckpointCleared();
    setCheckpointPassed(true);
  }

  if (!checkpointPassed) {
    return <WelcomeCheckpoint onComplete={completeCheckpoint} />;
  }

  const loadingLabel = loadingModule ? moduleRoutes[loadingModule]?.label : null;

  return (
    <TerminalChrome activeModule={loadingModule ?? activeModule} controlPanel={controlPanel} onNavigate={navigate}>
      {loadingModule && loadingLabel ? (
        <ModuleLoading label={loadingLabel} />
      ) : activeModule === "home" ? (
        <HomeModule />
      ) : activeModule === "am-i-crazy" ? (
        <AmICrazyModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
      ) : activeModule === "go-bag-prep" ? (
        <GoBagSimulator onControlPanelChange={updateControlPanel} onNavigate={navigate} onQuickExit={leaveSite} />
      ) : activeModule === "planning" ? (
        <PlanningModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
      ) : activeModule === "rebuilding" ? (
        <RebuildingModule onNavigate={navigate} />
      ) : activeModule === "local-help" || activeModule === "how-to" || activeModule === "legal" || activeModule === "library" ? (
        <ResourceModule moduleKey={activeModule} onNavigate={navigate} />
      ) : (
        <ResourceModule moduleKey={activeModule} onNavigate={navigate} />
      )}
    </TerminalChrome>
  );
}
