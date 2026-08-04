import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  Scale,
} from "lucide-react";
import { FolkHero } from "./components/FolkHero";
import denialSupportOne from "./assets/support/denial-support-1.png";
import denialSupportTwo from "./assets/support/denial-support-2.png";

const denialImages = [denialSupportOne, denialSupportTwo];

type ModuleKey =
  | "home"
  | "assessments"
  | "guides"
  | "planners"
  | "toolkits"
  | "education"
  | "about"
  | "advocacy"
  | "government"
  | "support"
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
    id: "just-looking",
    title: "I'm Just Looking",
    price: "$1.99",
    scope: "One week of view-only access to the paid library.",
    viewing: "View the library for 7 days.",
    unlocks: "No permanent file unlocks included.",
    renewal: "One-time access pass. No subscription or auto-renewal.",
  },
  {
    id: "unlock-resource",
    title: "Unlock A Resource",
    price: "$2.99",
    scope: "Two weeks of library viewing plus one permanent file unlock.",
    viewing: "View the library for 14 days.",
    unlocks: "Includes 1 Permanent Unlock.",
    renewal: "One-time access pass. No subscription or auto-renewal.",
  },
  {
    id: "two-week-access",
    title: "Two Week Access Pass",
    price: "$3.99",
    scope: "Two weeks of library viewing plus two permanent file unlocks.",
    viewing: "View the library for 14 days.",
    unlocks: "Includes 2 Permanent Unlocks.",
    renewal: "One-time access pass. No subscription or auto-renewal.",
  },
  {
    id: "all-access",
    title: "30 Days All Access Pass",
    price: "$4.99",
    scope: "Thirty days of library viewing plus three permanent file unlocks.",
    viewing: "View the library for 30 days.",
    unlocks: "Includes 3 Permanent Unlocks.",
    renewal: "One-time access pass. No subscription or auto-renewal.",
  },
  {
    id: "one-more-resource",
    title: "I Need One More Resource",
    price: "$1.99",
    scope: "Add one more permanent file unlock.",
    viewing: "Does not change pass viewing access.",
    unlocks: "Adds 1 Permanent Unlock.",
    renewal: "One-time add-on. No subscription or auto-renewal.",
  },
  {
    id: "two-more-resources",
    title: "I Need Two More Resources",
    price: "$2.99",
    scope: "Add two more permanent file unlocks.",
    viewing: "Does not change pass viewing access.",
    unlocks: "Adds 2 Permanent Unlocks.",
    renewal: "One-time add-on. No subscription or auto-renewal.",
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
    id: "crime-victim-compensation",
    title: "Understanding Crime Victim Compensation",
    subtitle: "What it may pay, what controls a claim, and why it is rarely immediate cash.",
    status: "LEGAL & MONEY GUIDE",
    description:
      "A nationwide guide to reimbursement, eligibility clauses, covered losses, documentation, delays, denials, and appeals.",
    action: "open",
    priority: "priority-2",
  },
  {
    id: "housing-options",
    title: "Housing Options",
    subtitle: "Less-obvious housing resources for survivors rebuilding after domestic violence.",
    status: "HOUSING RESOURCE",
    description:
      "A nationwide map of housing pathways beyond emergency shelter, with practical questions and call scripts for finding the door that is actually open.",
    action: "open",
    priority: "priority-2",
  },
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
    subtitle: "Pets, records, emergency fostering, proof of care, and backup care basics.",
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
    action: "open",
    priority: "priority-2",
  },
];

const howToPriorities = [
  {
    id: "priority-1",
    label: "triage.exe",
    title: "Triage",
    description:
      "Start here when the task is urgent, private, or close to the body: device traces, pets, vehicle living, and immediate stabilization logistics.",
  },
  {
    id: "priority-2",
    label: "stabilize.exe",
    title: "Stabilize",
    description:
      "Use this folder for benefits, housing, coordinated entry, applications, follow-ups, and the bureaucracy that starts multiplying.",
  },
  {
    id: "priority-3",
    label: "rebuild.exe",
    title: "Rebuild",
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
  assessments: { label: "Assessments", path: "/assessments" },
  guides: { label: "Guides", path: "/guides" },
  planners: { label: "Resources", path: "/resources" },
  toolkits: { label: "Resources", path: "/resources" },
  education: { label: "Education & Awareness", path: "/education-awareness" },
  about: { label: "About", path: "/about" },
  advocacy: { label: "Advocacy", path: "/advocacy" },
  government: { label: "Government", path: "/government" },
  support: { label: "Support", path: "/support" },
  "am-i-crazy": { label: "Was I Crazy?", path: "/am-i-crazy" },
  "go-bag-prep": { label: "Immediate Support", path: "/crisis-support" },
  planning: { label: "Immediate Support", path: "/crisis-support" },
  rebuilding: { label: "Rebuilding", path: "/rebuilding" },
  "local-help": { label: "Resources", path: "/resources" },
  "how-to": { label: "Resources", path: "/resources" },
  legal: { label: "Resources", path: "/resources" },
  library: { label: "Database", path: "/resources/access" },
  access: { label: "Database", path: "/resources/access" },
};

const allNavTargets: Array<{ key: ModuleKey; label: string; path: string }> = [
  { key: "home", ...moduleRoutes.home },
  { key: "assessments", ...moduleRoutes.assessments },
  { key: "guides", ...moduleRoutes.guides },
  { key: "planners", ...moduleRoutes.planners },
  { key: "toolkits", ...moduleRoutes.toolkits },
  { key: "education", ...moduleRoutes.education },
  { key: "about", ...moduleRoutes.about },
  { key: "advocacy", ...moduleRoutes.advocacy },
  { key: "government", ...moduleRoutes.government },
  { key: "support", ...moduleRoutes.support },
  { key: "am-i-crazy", label: "Was I Crazy", path: "/am-i-crazy" },
  { key: "planning", label: "Immediate Support", path: "/crisis-support" },
  { key: "local-help", ...moduleRoutes["local-help"] },
  { key: "how-to", ...moduleRoutes["how-to"] },
  { key: "legal", ...moduleRoutes.legal },
  { key: "library", ...moduleRoutes.library },
  { key: "access", ...moduleRoutes.access },
];

type SidebarIconKey =
  | "about"
  | "advocacy"
  | "assessments"
  | "education"
  | "government"
  | "guides"
  | "planners"
  | "toolkits";

const navItems: Array<{ key: ModuleKey; label: string; path: string; code: SidebarIconKey }> = [
  { key: "assessments", label: "Assessments", path: "/assessments", code: "assessments" },
  { key: "guides", label: "Guides", path: "/guides", code: "guides" },
  { key: "local-help", label: "Resources", path: "/resources", code: "toolkits" },
  { key: "education", label: "Education", path: "/education-awareness", code: "education" },
  { key: "advocacy", label: "Advocacy", path: "/advocacy", code: "advocacy" },
  { key: "government", label: "Government", path: "/government", code: "government" },
  { key: "about", label: "About", path: "/about", code: "about" },
];

function SidebarIcon({ icon }: { icon: SidebarIconKey }) {
  const commonProps = {
    "aria-hidden": true,
    className: "sidebar-svg-icon",
    focusable: "false",
    viewBox: "0 0 64 64",
  } as const;

  switch (icon) {
    case "about":
      return (
        <svg {...commonProps}>
          <circle cx="32" cy="21" r="11" fill="var(--folk-coral, #D9785F)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" />
          <path d="M12 55c1-13 9-21 20-21s19 8 20 21H12Z" fill="var(--folk-sage, #A8B89A)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 38v10" fill="none" stroke="var(--folk-cream, #F6E8D0)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="53" r="2.3" fill="var(--folk-mustard, #D6A536)" />
          <path d="M27 19c2-3 4-3 5 0 1-3 3-3 5 0 0 4-5 7-5 7s-5-3-5-7Z" fill="var(--folk-cream, #F6E8D0)" stroke="var(--folk-ink, #26302C)" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "advocacy":
      return (
        <svg {...commonProps}>
          <path d="M11 27h11l23-12v34L22 37H11a5 5 0 0 1 0-10Z" fill="var(--folk-coral, #D9785F)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 37v10a6 6 0 0 0 6 6h4l-4-16" fill="var(--folk-mustard, #D6A536)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M45 24c4 1 7 4 7 8s-3 7-7 8M51 18c7 3 10 8 10 14s-3 11-10 14" fill="none" stroke="var(--folk-teal, #347D7B)" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 31h6" fill="none" stroke="var(--folk-cream, #F6E8D0)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "assessments":
      return (
        <svg {...commonProps}>
          <rect x="14" y="12" width="36" height="42" rx="6" fill="var(--folk-cream, #F6E8D0)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" />
          <path d="M25 12v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="var(--folk-mustard, #D6A536)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="23" cy="25" r="4" fill="var(--folk-coral, #D9785F)" />
          <path d="m20.5 25 1.7 1.8 3.4-4" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="23" cy="38" r="4" fill="var(--folk-sage, #A8B89A)" />
          <path d="m20.5 38 1.7 1.8 3.4-4" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 24h11M32 29h8M32 37h11M32 42h8" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "education":
      return (
        <svg {...commonProps}>
          <path d="m7 22 25-12 25 12-25 12L7 22Z" fill="var(--folk-mustard, #D6A536)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 28v12c0 6 7 10 14 10s14-4 14-10V28" fill="var(--folk-sage, #A8B89A)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M57 22v18" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="57" cy="44" r="3" fill="var(--folk-coral, #D9785F)" stroke="var(--folk-ink, #26302C)" strokeWidth="2" />
          <path d="M25 39c4 2 10 2 14 0" fill="none" stroke="var(--folk-cream, #F6E8D0)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "government":
      return (
        <svg {...commonProps}>
          <path d="m32 7 25 12H7L32 7Z" fill="var(--folk-mustard, #D6A536)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M10 19h44v7H10z" fill="var(--folk-cream, #F6E8D0)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" />
          <path d="M14 26v22M26 26v22M38 26v22M50 26v22" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="4" />
          <path d="M8 48h48v7H8z" fill="var(--folk-sage, #A8B89A)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" />
          <circle cx="32" cy="15" r="3" fill="var(--folk-rust, #A8523B)" />
        </svg>
      );
    case "guides":
      return (
        <svg {...commonProps}>
          <path d="M8 15c8-3 16-1 24 4v36c-8-5-16-7-24-4V15Z" fill="var(--folk-cream, #F6E8D0)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M56 15c-8-3-16-1-24 4v36c8-5 16-7 24-4V15Z" fill="var(--folk-sage, #A8B89A)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 19v36" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 25h9M16 32h11M39 25h9M39 32h7" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M43 40c3-4 8-2 8 2 0 4-4 7-4 7s-4-3-4-7c0-1 .2-1.4 0-2Z" fill="var(--folk-coral, #D9785F)" stroke="var(--folk-ink, #26302C)" strokeWidth="2" />
        </svg>
      );
    case "planners":
      return (
        <svg {...commonProps}>
          <rect x="8" y="12" width="48" height="44" rx="7" fill="var(--folk-cream, #F6E8D0)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" />
          <path d="M8 24h48M20 8v9M44 8v9" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 35h8M16 44h8M39 35h9M39 44h9" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="31" cy="34" r="3.5" fill="var(--folk-rust, #A8523B)" />
          <circle cx="31" cy="44" r="3.5" fill="var(--folk-teal, #347D7B)" />
          <path d="m28.7 44 1.5 1.5 3-3.3" fill="none" stroke="var(--folk-cream, #F6E8D0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "toolkits":
      return (
        <svg {...commonProps}>
          <path d="M10 24h44a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V28a4 4 0 0 1 4-4Z" fill="var(--folk-rust, #A8523B)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" />
          <path d="M23 24v-6a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v6M6 35h52" fill="none" stroke="var(--folk-ink, #26302C)" strokeWidth="3" strokeLinecap="round" />
          <rect x="26" y="31" width="12" height="9" rx="2" fill="var(--folk-mustard, #D6A536)" stroke="var(--folk-ink, #26302C)" strokeWidth="2.5" />
          <path d="M18 47h10M36 47h10" fill="none" stroke="var(--folk-cream, #F6E8D0)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="18" cy="47" r="3" fill="var(--folk-sage, #A8B89A)" stroke="var(--folk-ink, #26302C)" strokeWidth="2" />
          <circle cx="46" cy="47" r="3" fill="var(--folk-coral, #D9785F)" stroke="var(--folk-ink, #26302C)" strokeWidth="2" />
        </svg>
      );
  }
}

function navItemFor(key: ModuleKey) {
  const route = moduleRoutes[key] ?? moduleRoutes.home;
  return { key, ...route };
}

function isPrimaryNavActive(activeModule: ModuleKey, navKey: ModuleKey) {
  if (navKey === "assessments") {
    return activeModule === "assessments" || activeModule === "am-i-crazy";
  }

  if (navKey === "guides") {
    return activeModule === "guides" || activeModule === "how-to";
  }

  if (navKey === "local-help") {
    return activeModule === "local-help" || activeModule === "how-to" || activeModule === "legal" || activeModule === "planners" || activeModule === "toolkits" || activeModule === "access" || activeModule === "library";
  }

  if (navKey === "access") {
    return activeModule === "access" || activeModule === "library";
  }

  return activeModule === navKey;
}

type CategoryFile = {
  title: string;
  description: string;
  status: string;
  categoryId?: ResourceCategoryId;
  guideId?: string;
  target?: ModuleKey;
  path?: string;
  modal?: "love-or-fear" | "freedom-test" | "coercive-control-map" | "financial-captivity";
};

type ResourceCategoryId =
  | "housing"
  | "legal-family"
  | "legal-civil"
  | "legal-criminal"
  | "food"
  | "money"
  | "homelessness"
  | "digital-safety"
  | "daily-stability";

const resourceCategoryDefinitions: Array<{ id: ResourceCategoryId; label: string; description: string }> = [
  { id: "housing", label: "Housing", description: "Housing systems, applications, Coordinated Entry, waitlists, utilities, and follow-up." },
  { id: "legal-family", label: "Legal // Family", description: "Family court, custody, caregiving, hearings, deadlines, and documentation." },
  { id: "legal-civil", label: "Legal // Civil", description: "Protective orders, civil filings, motions, evidence, and hearing preparation." },
  { id: "legal-criminal", label: "Legal // Criminal", description: "Reporting, criminal-system contact, victim services, incidents, and follow-up." },
  { id: "food", label: "Food", description: "SNAP, food access, interviews, documents, pantries, and benefit follow-up." },
  { id: "money", label: "Money", description: "Financial control, benefits, debt, credit, budgeting, records, and economic rebuilding." },
  { id: "homelessness", label: "Homelessness", description: "Shelter systems, temporary housing, vehicle living, daily logistics, and contact tracking." },
  { id: "digital-safety", label: "Digital Safety", description: "Browser traces, account access, device monitoring, safer browsing, and documentation." },
  { id: "daily-stability", label: "Daily Stability", description: "Routines, pets, appointments, caregiving, and practical systems for disrupted days." },
];

type LoveFearScoredItem = {
  id: number;
  part: number;
  title: string;
  left: string;
  right: string;
};

type LoveFearFlagItem = {
  id: number;
  text: string;
};

type LoveFearFlagAnswer = "yes" | "no" | "unsure";

const loveFearParts = [
  "Speak, disagree and tell the truth",
  "Autonomy and boundaries",
  "Trust, reality and equal voice",
  "Support, resources and isolation",
  "Repair, accountability and equality",
  "What your body already knows",
];

const loveFearScoredItems: LoveFearScoredItem[] = [
  {
    id: 1,
    part: 1,
    title: "Bringing up a problem",
    left: "I can speak plainly and expect a real conversation.",
    right: "I plan every word, wait for the right mood or stay quiet to avoid fallout.",
  },
  {
    id: 2,
    part: 1,
    title: "Saying no",
    left: "My no is accepted even when they are disappointed.",
    right: "My no triggers pressure, guilt, anger, punishment or repeated demands.",
  },
  {
    id: 3,
    part: 1,
    title: "Making a mistake",
    left: "Mistakes are handled without humiliation or threats.",
    right: "Mistakes become evidence that I am stupid, selfish, unstable or cannot be trusted.",
  },
  {
    id: 4,
    part: 1,
    title: "Their emotions",
    left: "They manage their feelings without making me responsible for restoring peace.",
    right: "I have to soothe, agree, apologize or perform closeness so things do not get worse.",
  },
  {
    id: 5,
    part: 2,
    title: "Time and relationships",
    left: "I can spend time alone or with other people without proving my loyalty.",
    right: "My friendships, family contact or time away causes jealousy, interrogation or consequences.",
  },
  {
    id: 6,
    part: 2,
    title: "Body and appearance",
    left: "My clothes, food, body, hair and presentation remain my decisions.",
    right: "They criticize, pressure, monitor or dictate how I look and care for my body.",
  },
  {
    id: 7,
    part: 2,
    title: "Work, money and movement",
    left: "I can pursue work, school, money, transportation and practical independence.",
    right: "My access to money, work, school, transportation or documents is restricted or sabotaged.",
  },
  {
    id: 8,
    part: 2,
    title: "Privacy and technology",
    left: "Privacy is normal; passwords, devices and location access are voluntary.",
    right: "I am expected to surrender passwords, location, devices or constant proof of where I am.",
  },
  {
    id: 9,
    part: 3,
    title: "My memory and perception",
    left: "My account of events can be discussed without attacking my sanity or character.",
    right: "They deny obvious events, rewrite agreements or insist my perception cannot be trusted.",
  },
  {
    id: 10,
    part: 3,
    title: "Trust and accusations",
    left: "Trust does not require constant proof of innocence.",
    right: "I am accused, tested, monitored or made to prove I am not cheating, lying or disloyal.",
  },
  {
    id: 11,
    part: 3,
    title: "Decision-making",
    left: "Major decisions include my informed and meaningful agreement.",
    right: "They decide first, announce later or punish me until I agree.",
  },
  {
    id: 12,
    part: 3,
    title: "Standards and rules",
    left: "The same basic standards and freedoms apply to both of us.",
    right: "They claim freedoms for themselves that are forbidden, dangerous or punishable for me.",
  },
  {
    id: 13,
    part: 4,
    title: "Support network",
    left: "My relationships with safe people are respected and encouraged.",
    right: "They discredit, compete with, monitor or distance me from people who support me.",
  },
  {
    id: 14,
    part: 4,
    title: "Growth and independence",
    left: "My success and confidence are welcomed.",
    right: "My work, healing, education, friendships or independence are mocked, interrupted or sabotaged.",
  },
  {
    id: 15,
    part: 4,
    title: "Help, gifts and resources",
    left: "Help is offered without creating ownership or permanent debt.",
    right: "Money, housing, rides, gifts or favors are later used to demand access, obedience or gratitude.",
  },
  {
    id: 16,
    part: 4,
    title: "People and animals I love",
    left: "Children, pets, family and friends are never used as leverage.",
    right: "They threaten access, custody, safety, affection or contact to control what I do.",
  },
  {
    id: 17,
    part: 5,
    title: "Apologies",
    left: "Apologies name the behavior, center the harm and lead to sustained change.",
    right: "Apologies become excuses, self-pity, gifts, tears or pressure to forgive without change.",
  },
  {
    id: 18,
    part: 5,
    title: "Boundaries after conflict",
    left: "My boundaries remain valid even when they dislike them.",
    right: "They bargain, punish, threaten, stalk, overwhelm or wait me out until the boundary disappears.",
  },
  {
    id: 19,
    part: 5,
    title: "How conflict ends",
    left: "Conflict ends through resolution, accountability or respectful pause.",
    right: "Conflict ends because I submit, shut down, apologize or become too exhausted to continue.",
  },
  {
    id: 20,
    part: 5,
    title: "The good periods",
    left: "Affection and safety are reasonably steady.",
    right: "Intense closeness follows harm, restores hope, and then the same pattern returns.",
  },
  {
    id: 21,
    part: 6,
    title: "My body around them",
    left: "I can usually breathe, rest, think and move naturally around them.",
    right: "My body braces, freezes, fawns, goes numb or stays alert to their mood and movements.",
  },
  {
    id: 22,
    part: 6,
    title: "Sounds and signals",
    left: "Calls, footsteps, facial expressions and changes in tone are ordinary information.",
    right: "A notification, car door, footstep, silence or tone change can make my body drop or race.",
  },
  {
    id: 23,
    part: 6,
    title: "Preventing reactions",
    left: "I choose my behavior from my values and preferences.",
    right: "I change ordinary behavior mainly to prevent their anger, suspicion, withdrawal or retaliation.",
  },
  {
    id: 24,
    part: 6,
    title: "Imagining separation or a firm boundary",
    left: "I may feel grief, but I do not fear punishment for choosing myself.",
    right: "I fear what they might do to me, themselves, children, pets, money, housing or my reputation.",
  },
];

const loveFearFlagItems: LoveFearFlagItem[] = [
  { id: 1, text: "Physical violence, restraint, blocking exits or preventing me from leaving." },
  { id: 2, text: "Choking, strangulation, pressure to my neck or interference with breathing." },
  { id: 3, text: "Weapons displayed, handled, mentioned or used to frighten or control me." },
  {
    id: 4,
    text: "Sex, sexual acts or sexual contact obtained through force, pressure, fear, intoxication or exhaustion.",
  },
  {
    id: 5,
    text: "Birth control sabotage, forced pregnancy, pressure about pregnancy outcomes or control of reproductive care.",
  },
  { id: 6, text: "Threats to kill or seriously harm me, themselves, another person or an animal." },
  { id: 7, text: "Harming, threatening, taking or withholding children, pets or people I love." },
  { id: 8, text: "Stalking, hidden surveillance, repeated unwanted contact, tracking or appearing where I am." },
  {
    id: 9,
    text: "Withholding or controlling money, identification, medication, medical care, food, housing or transportation.",
  },
  {
    id: 10,
    text: "Threatening police, immigration, CPS/DFPS, courts, employers, family or public humiliation to force compliance.",
  },
  {
    id: 11,
    text: "Destroying property, punching walls, reckless driving or violent acts meant to show what could happen to me.",
  },
  {
    id: 12,
    text: "Escalation when I become more independent, disclose the abuse, set boundaries or try to leave.",
  },
];

const loveFearHighPartText = [
  "High Part 1: Voice - You may be silencing, editing or overexplaining yourself to manage their reactions.",
  "High Part 2: Autonomy - Your choices, body, privacy, resources or movement may be treated as something they are entitled to manage.",
  "High Part 3: Reality - Accusations, double standards or reality distortion may be weakening your confidence in your own judgment.",
  "High Part 4: Isolation - Your support, practical options and independence may be shrinking, increasing their leverage.",
  "High Part 5: Repair - Apologies or good periods may be resetting hope without changing the underlying behavior.",
  "High Part 6: Body - Your nervous system may be tracking danger, instability or retaliation even when your mind is still debating the label.",
];

function getLoveFearBand(total: number) {
  if (total <= 18) {
    return {
      label: "0-18 MOSTLY FREEDOM",
      text:
        "Your answers mostly reflect room for honesty, boundaries, privacy and independent choice. Review any isolated 3 or 4, any red-flag behavior and any part of the relationship where you feel smaller or less free.",
    };
  }

  if (total <= 38) {
    return {
      label: "19-38 MIXED SIGNALS / ERODING FREEDOM",
      text:
        "The relationship may contain meaningful connection alongside pressure, double standards, punishment or instability. Pay attention to repeated patterns and whether your freedom shrinks when the other person is upset.",
    };
  }

  if (total <= 62) {
    return {
      label: "39-62 FEAR IS SHAPING THE RELATIONSHIP",
      text:
        "A substantial amount of your behavior appears organized around preventing reactions, maintaining peace or avoiding consequences. This suggests a serious power imbalance and warrants support, documentation and closer pattern review.",
    };
  }

  return {
    label: "63-96 CONTROL IS ORGANIZING THE RELATIONSHIP",
    text:
      "Fear and control appear to affect multiple parts of your life and decision-making. This pattern is consistent with significant coercive control concerns. Consider confidential support and individualized safety planning from a safer device.",
  };
}

type FreedomScore = 0 | 1 | 2 | 3 | 4;
type FreedomPriorityAnswer = "yes" | "no" | "unsure";
type FreedomPhase = "intro" | "scored" | "priorityIntro" | "priority" | "results";

type FreedomScoredItem = {
  id: number;
  partId: number;
  resultLabel: string;
  prompt: string;
};

type FreedomPriorityItem = {
  id: number;
  text: string;
};

const freedomScaleOptions: Array<{ value: FreedomScore; label: string; meaning: string }> = [
  { value: 0, label: "Never", meaning: "I remain free; this does not occur." },
  { value: 1, label: "Rarely", meaning: "It occurs occasionally but does not usually organize my choices." },
  {
    value: 2,
    label: "Sometimes / depends / unsure",
    meaning: "The answer changes, depends on their mood, or I do not trust my read yet.",
  },
  { value: 3, label: "Often", meaning: "This repeatedly narrows my choices or creates consequences." },
  {
    value: 4,
    label: "Nearly always / not free safely",
    meaning: "I am generally not free to do this without pressure, punishment, fear, or retaliation.",
  },
];

const freedomPartLabels = [
  "Voice and refusal",
  "People, movement and space",
  "Body, privacy and intimacy",
  "Money, work and resources",
  "Reality, rules and equal power",
  "Fear, retaliation and separation",
];

const freedomPartInterpretations = [
  "Your voice and your no may carry consequences. You may be editing, appeasing, overexplaining, or giving in to manage the other person's reactions.",
  "Isolation, monitoring, or interference with movement may be narrowing your world and making ordinary independence feel dangerous.",
  "Your body, privacy, devices, sexuality, or reproductive choices may be treated as access this person is entitled to rather than choices that remain yours.",
  "Control of money, work, documents, health care, transportation, or practical help may be increasing dependence and reducing your options.",
  "Reality distortion, double standards, or unilateral decisions may be undermining your confidence and meaningful power in the relationship.",
  "Your choices and nervous system may be organized around anticipating punishment, escalation, or what could happen if you become more independent or leave.",
];

const freedomScoredItems: FreedomScoredItem[] = [
  {
    id: 1,
    partId: 1,
    resultLabel: "Managing their reaction",
    prompt:
      "When I disagree, raise a concern, or tell the truth, I have to carefully manage this person's mood or reaction.",
  },
  {
    id: 2,
    partId: 1,
    resultLabel: "Saying no",
    prompt: "When I say no, they pressure, guilt, argue, punish, or keep asking until my answer changes.",
  },
  {
    id: 3,
    partId: 1,
    resultLabel: "Ordinary choices",
    prompt: "Ordinary personal choices become arguments, tests of loyalty, or reasons for consequences.",
  },
  {
    id: 4,
    partId: 1,
    resultLabel: "Mistakes",
    prompt: "Mistakes are used to humiliate me, threaten me, or prove I cannot be trusted.",
  },
  {
    id: 5,
    partId: 2,
    resultLabel: "Time with other people",
    prompt: "Time alone or with other people leads to jealousy, interrogation, monitoring, or consequences.",
  },
  {
    id: 6,
    partId: 2,
    resultLabel: "Where I go",
    prompt: "I am expected to explain, prove, or get permission for where I go and when I return.",
  },
  {
    id: 7,
    partId: 2,
    resultLabel: "Support network",
    prompt: "This person interferes with, discredits, or limits contact with people who support me.",
  },
  {
    id: 8,
    partId: 2,
    resultLabel: "Taking space",
    prompt: "I cannot safely end a conversation, leave a room, take space, or change plans.",
  },
  {
    id: 9,
    partId: 3,
    resultLabel: "Body choices",
    prompt: "My clothes, appearance, food, sleep, health care, or body choices are criticized, monitored, or controlled.",
  },
  {
    id: 10,
    partId: 3,
    resultLabel: "Devices and location",
    prompt: "I am expected to surrender passwords, devices, messages, accounts, or location access.",
  },
  {
    id: 11,
    partId: 3,
    resultLabel: "Sex and reproduction",
    prompt:
      "Sex, touch, affection, contraception, pregnancy, or reproductive decisions are pressured or treated as something I owe.",
  },
  {
    id: 12,
    partId: 3,
    resultLabel: "Privacy",
    prompt: "My privacy is treated as suspicious, disloyal, or proof that I am hiding something.",
  },
  {
    id: 13,
    partId: 4,
    resultLabel: "Money access",
    prompt: "My access to money, income, bank information, credit, or necessary spending is restricted or monitored.",
  },
  {
    id: 14,
    partId: 4,
    resultLabel: "Work and goals",
    prompt: "Work, school, training, healing, or goals are interrupted, mocked, or sabotaged.",
  },
  {
    id: 15,
    partId: 4,
    resultLabel: "Essential resources",
    prompt:
      "Access to identification, medication, medical care, food, housing, transportation, or communication can be withheld.",
  },
  {
    id: 16,
    partId: 4,
    resultLabel: "Help with strings",
    prompt:
      "Help, gifts, rides, housing, or money are later used to demand access, obedience, gratitude, or repayment I did not agree to.",
  },
  {
    id: 17,
    partId: 5,
    resultLabel: "Reality distortion",
    prompt: "This person denies events, rewrites agreements, or attacks my memory when my account threatens their version.",
  },
  {
    id: 18,
    partId: 5,
    resultLabel: "Double standards",
    prompt: "They claim freedoms for themselves that are forbidden, dangerous, or punishable for me.",
  },
  {
    id: 19,
    partId: 5,
    resultLabel: "Major decisions",
    prompt: "Major decisions are made without my meaningful agreement, or pressure continues until I give in.",
  },
  {
    id: 20,
    partId: 5,
    resultLabel: "Seeking help",
    prompt: "Seeking advice, telling someone what happened, or asking for help feels likely to trigger retaliation.",
  },
  {
    id: 21,
    partId: 6,
    resultLabel: "Preventing reactions",
    prompt:
      "I change ordinary behavior mainly to prevent anger, suspicion, withdrawal, punishment, or escalation.",
  },
  {
    id: 22,
    partId: 6,
    resultLabel: "Body alarm",
    prompt:
      "My body braces, freezes, fawns, goes numb, or tracks their tone, footsteps, calls, silence, or movements.",
  },
  {
    id: 23,
    partId: 6,
    resultLabel: "Freedom under pressure",
    prompt: "When this person is angry, jealous, challenged, or told no, my freedom becomes smaller.",
  },
  {
    id: 24,
    partId: 6,
    resultLabel: "Boundary or separation fear",
    prompt:
      "Setting a firm boundary or leaving makes me fear what they might do to me, themselves, children, pets, money, housing, work, or my reputation.",
  },
];

const freedomPriorityItems: FreedomPriorityItem[] = [
  { id: 1, text: "Physical violence, restraint, blocking exits, or preventing me from leaving." },
  { id: 2, text: "Choking, strangulation, pressure to my neck, or interference with breathing." },
  { id: 3, text: "Weapons displayed, handled, mentioned, or used to frighten or control me." },
  {
    id: 4,
    text: "Sex, sexual acts, or sexual contact obtained through force, pressure, fear, intoxication, or exhaustion.",
  },
  {
    id: 5,
    text: "Birth control sabotage, forced pregnancy, pressure about pregnancy outcomes, or control of reproductive care.",
  },
  { id: 6, text: "Threats to kill or seriously harm me, themselves, another person, or an animal." },
  { id: 7, text: "Harming, threatening, taking, or withholding children, pets, or people I love." },
  { id: 8, text: "Stalking, hidden surveillance, repeated unwanted contact, tracking, or appearing where I am." },
  {
    id: 9,
    text: "Withholding or controlling money, identification, medication, medical care, food, housing, or transportation.",
  },
  {
    id: 10,
    text: "Threatening police, immigration, CPS/DFPS, courts, employers, family, or public humiliation to force compliance.",
  },
  {
    id: 11,
    text: "Destroying property, punching walls, reckless driving, or violent acts meant to show what could happen to me.",
  },
  {
    id: 12,
    text: "Escalation when I become more independent, disclose the abuse, set boundaries, or try to leave.",
  },
];

const freedomBandText = getLoveFearBand;

type PatternMapScore = 0 | 1 | 2 | 3 | 4;
type PatternMapPriorityAnswer = "yes" | "no" | "unsure";
type PatternMapDomainId = "AUT" | "ISO" | "RES" | "TECH" | "INT" | "BODY" | "LEV" | "SYS";
type PatternMapPhase = "intro" | "scored" | "priorityIntro" | "priority" | "results";

type PatternMapScoredItem = { id: string; domainId: PatternMapDomainId; prompt: string };
type PatternMapPriorityItem = { id: string; prompt: string };

const patternMapDomainOrder: PatternMapDomainId[] = ["AUT", "ISO", "RES", "TECH", "INT", "BODY", "LEV", "SYS"];
const patternMapDomains: Record<PatternMapDomainId, { label: string; highText: string }> = {
  AUT: { label: "Autonomy and permission", highText: "Your ordinary choices may be treated as subject to permission, unequal rules, or consequences. You may be adapting before you act because independence itself creates fallout." },
  ISO: { label: "Isolation and shrinking life", highText: "Your support, identity, community, or independent time may be getting harder to maintain. Isolation can be produced through punishment and exhaustion, not only direct bans." },
  RES: { label: "Money, resources and practical access", highText: "Control of money, transportation, documents, housing, work, medication, or basic resources may be creating dependency and limiting your practical options." },
  TECH: { label: "Privacy, surveillance and technology", highText: "Your devices, accounts, location, communication, or movements may be treated as available for monitoring. Changing normal behavior to avoid detection is part of the pattern." },
  INT: { label: "Intimidation, punishment and unpredictability", highText: "Compliance may be produced through fear of consequences, mood tracking, chaos, humiliation, or demonstrations of what could happen - even when rules are never stated aloud." },
  BODY: { label: "Body, sex, reproduction and health", highText: "Your consent, reproductive decisions, medical care, rest, food, medication, or bodily needs may be overridden, pressured, obstructed, or used as access points for control." },
  LEV: { label: "Children, pets, relationships and identity as leverage", highText: "People, animals, caregiving roles, identity, immigration status, disability, reputation, or community ties may be used as pressure points to shape your behavior." },
  SYS: { label: "Reality, institutions and post-separation control", highText: "Control may be continuing through reality distortion, threats involving institutions, legal or system abuse, unwanted contact, or fear of what they may do after access is reduced." },
};

const patternMapScale: Array<{ value: PatternMapScore; label: string; meaning: string }> = [
  { value: 0, label: "NOT PRESENT", meaning: "This is not part of the relationship pattern I am assessing." },
  { value: 1, label: "OCCASIONAL / LOW IMPACT", meaning: "It has happened or been implied, but it does not usually change my choices or access." },
  { value: 2, label: "MIXED / UNSURE", meaning: "It happens sometimes, depends on circumstances, or I do not yet trust my read." },
  { value: 3, label: "REPEATED / CHANGES WHAT I DO", meaning: "I regularly adapt, comply, hide, explain, or plan around it." },
  { value: 4, label: "PERVASIVE / ORGANIZES MY CHOICES", meaning: "It strongly controls my behavior, access, safety, or ability to act freely." },
];

const patternMapScoredItems: PatternMapScoredItem[] = [
  { id: "AUT-1", domainId: "AUT", prompt: "I change ordinary plans because I expect anger, interrogation, punishment, or fallout." },
  { id: "ISO-1", domainId: "ISO", prompt: "Contact with family, friends, or other supportive people is criticized, monitored, interrupted, or made costly." },
  { id: "RES-1", domainId: "RES", prompt: "They control or restrict access to money, accounts, credit, benefits, documents, or financial information." },
  { id: "TECH-1", domainId: "TECH", prompt: "They demand passwords, location sharing, device access, photos, or immediate replies as proof." },
  { id: "INT-1", domainId: "INT", prompt: "Their looks, tone, silence, gestures, driving, property damage, or physical presence are used to frighten or control me." },
  { id: "BODY-1", domainId: "BODY", prompt: "Sexual contact or affection is pressured, demanded, bargained for, or treated as something I owe." },
  { id: "LEV-1", domainId: "LEV", prompt: "Children, pets, family, or friends are threatened, harmed, withheld, interrogated, or used to influence what I do." },
  { id: "SYS-1", domainId: "SYS", prompt: "They deny documented events, rewrite agreements, or attack my memory or sanity when I name what happened." },
  { id: "AUT-2", domainId: "AUT", prompt: "They act entitled to approve where I go, what I wear, how I spend time, or how I manage my body." },
  { id: "ISO-2", domainId: "ISO", prompt: "They create conflict before or after I spend time away, then make me pay for having gone." },
  { id: "RES-2", domainId: "RES", prompt: "They interfere with work, school, appointments, transportation, or my ability to earn and support myself." },
  { id: "TECH-2", domainId: "TECH", prompt: "I suspect or know they monitor devices, accounts, vehicles, cameras, cloud services, or people around me." },
  { id: "INT-2", domainId: "INT", prompt: "They punish through withdrawal, sleep disruption, humiliation, destruction, abandonment, public scenes, or deliberate chaos." },
  { id: "BODY-2", domainId: "BODY", prompt: "They interfere with contraception, pregnancy decisions, reproductive care, or my ability to consent freely." },
  { id: "LEV-2", domainId: "LEV", prompt: "They undermine my parenting or caregiving and threaten custody, reports, abandonment, or loss of contact." },
  { id: "SYS-2", domainId: "SYS", prompt: "They threaten or use police, courts, CPS/DFPS, immigration, employers, landlords, medical providers, or other institutions to force compliance." },
  { id: "AUT-3", domainId: "AUT", prompt: "Saying no, disagreeing, or making an independent decision brings pressure, guilt, threats, withdrawal, or retaliation." },
  { id: "ISO-3", domainId: "ISO", prompt: "They discredit people who support me and push me to rely on them instead." },
  { id: "RES-3", domainId: "RES", prompt: "Help, housing, rides, gifts, or shared resources are used to create debt, ownership, access, or obedience." },
  { id: "TECH-3", domainId: "TECH", prompt: "They impersonate me, access accounts, use private information, or threaten to expose messages, images, or records." },
  { id: "INT-3", domainId: "INT", prompt: "Consequences intensify when I assert independence, ask questions, disclose behavior, or set a boundary." },
  { id: "BODY-3", domainId: "BODY", prompt: "They control or obstruct food, sleep, medication, medical care, substance use, exercise, or other bodily choices." },
  { id: "LEV-3", domainId: "LEV", prompt: "They use secrets, identity, immigration status, sexuality, disability, religion, reputation, or community standing as leverage." },
  { id: "SYS-3", domainId: "SYS", prompt: "Contact, monitoring, harassment, or control continues after separation, blocking, a firm boundary, or a legal order." },
  { id: "AUT-4", domainId: "AUT", prompt: "Rules and freedoms are unequal: behavior that is allowed for them is dangerous or punishable for me." },
  { id: "ISO-4", domainId: "ISO", prompt: "My world has become smaller because relationships, work, school, community, faith, hobbies, or time alone feel unsafe or exhausting to maintain." },
  { id: "RES-4", domainId: "RES", prompt: "They create or threaten instability around food, medication, housing, utilities, transportation, identification, or property to control me." },
  { id: "TECH-4", domainId: "TECH", prompt: "I alter my device use, routes, contacts, searches, or communication because I expect monitoring or retaliation." },
  { id: "INT-4", domainId: "INT", prompt: "I scan their mood and adjust myself because I cannot predict which version of them I will get." },
  { id: "BODY-4", domainId: "BODY", prompt: "My pain, illness, injury, exhaustion, pregnancy, or disability is minimized, exploited, or used to gain access or control." },
  { id: "LEV-4", domainId: "LEV", prompt: "They recruit relatives, friends, coworkers, professionals, or children to pressure, monitor, discredit, or isolate me." },
  { id: "SYS-4", domainId: "SYS", prompt: "I spend significant energy anticipating what they might do next to my safety, finances, children, housing, work, reputation, or legal position." },
];

const patternMapPriorityItems: PatternMapPriorityItem[] = [
  { id: "P-01", prompt: "Physical violence, restraint, blocking exits, confinement, kidnapping, forced movement, or preventing me from leaving." },
  { id: "P-02", prompt: "Choking, strangulation, pressure to my neck, smothering, or any interference with breathing." },
  { id: "P-03", prompt: "A weapon displayed, handled, mentioned, accessed, or used to frighten, threaten, or control me." },
  { id: "P-04", prompt: "Threats to kill or seriously harm me, themselves, another person, or an animal." },
  { id: "P-05", prompt: "Sex, sexual acts, images, or sexual contact obtained through force, pressure, fear, intoxication, sleep, or exhaustion." },
  { id: "P-06", prompt: "Birth control sabotage, forced pregnancy, pressure about pregnancy outcomes, or control of reproductive care." },
  { id: "P-07", prompt: "Stalking, hidden surveillance, repeated unwanted contact, tracking, impersonation, or appearing where I am." },
  { id: "P-08", prompt: "Harming, threatening, taking, hiding, or withholding children, pets, or people I love." },
  { id: "P-09", prompt: "Withholding or controlling food, sleep, identification, medication, medical care, housing, transportation, communication, or emergency help." },
  { id: "P-10", prompt: "Reckless driving, property destruction, punching walls, fire-setting, dangerous abandonment, or violent acts meant to show what could happen to me." },
  { id: "P-11", prompt: "Escalation when I become more independent, disclose the abuse, set boundaries, seek help, separate, or take legal action." },
  { id: "P-12", prompt: "Threats or actions involving police, courts, CPS/DFPS, immigration, hospitalization, employers, landlords, schools, family, or public humiliation to force compliance." },
];

function getPatternMapDomainState(score: number) {
  if (score <= 3) return "LITTLE OR NO PATTERN IDENTIFIED";
  if (score <= 7) return "EMERGING OR CONCENTRATED RESTRICTION";
  if (score <= 11) return "ESTABLISHED PATTERN OF CONTROL";
  return "PERVASIVE CONTROL";
}

function getPatternMapBand(total: number) {
  if (total <= 24) return { label: "FEW INDICATORS IDENTIFIED", text: "Your answers show few indicators of coercive control across the map. Review any item scored 3 or 4 and any Priority Pattern flag. A concentrated pattern in one area can matter even when the overall score is low." };
  if (total <= 55) return { label: "CONCENTRATED OR EMERGING CONTROL", text: "Your answers suggest control may be emerging or concentrated in specific parts of your life. Notice whether your choices change when the other person is upset, jealous, challenged, or told no. Consider support if the pattern is repeated, escalating, or difficult to name alone." };
  if (total <= 88) return { label: "ESTABLISHED COERCIVE CONTROL PATTERN", text: "Your answers suggest an established pattern in which pressure, surveillance, punishment, isolation, or resource control is narrowing your freedom. This warrants support, careful documentation, and closer review of escalation and separation-related risk." };
  return { label: "PERVASIVE SYSTEM OF CONTROL", text: "Control appears to organize multiple parts of your life, access, and decision-making. This is consistent with serious coercive control concerns. Consider confidential support and individualized safety planning from a safer device." };
}

type FinancialScore = 0 | 1 | 2 | 3 | "not-sure";
type FinancialDomainId = "access" | "permission" | "earning" | "debt" | "needs" | "resistance";
type FinancialPhase = "intro" | "questions" | "results";
type FinancialItem = { id: number; domainId: FinancialDomainId; prompt: string };

const financialDomains: Array<{ id: FinancialDomainId; label: string }> = [
  { id: "access", label: "Access to money and information" },
  { id: "permission", label: "Permission, punishment, and surveillance" },
  { id: "earning", label: "Work, education, and earning power" },
  { id: "debt", label: "Debt, credit, taxes, and legal exposure" },
  { id: "needs", label: "Basic needs, property, and forced dependence" },
  { id: "resistance", label: "Leaving, resistance, and the larger pattern" },
];

const financialScale: Array<{ value: FinancialScore; label: string; meaning: string }> = [
  { value: 0, label: "NO", meaning: "This has not happened." },
  { value: 1, label: "OCCASIONALLY", meaning: "It happened once, rarely, or the situation is unclear." },
  { value: 2, label: "REPEATEDLY", meaning: "It has happened more than once or affects my choices." },
  { value: 3, label: "REGULARLY OR SEVERELY", meaning: "It is ongoing, threatening, or has caused serious harm." },
  { value: "not-sure", label: "NOT SURE", meaning: "I do not know or cannot safely find out." },
];

const financialItems: FinancialItem[] = [
  { id: 1, domainId: "access", prompt: "Someone controls household money without genuinely including me in decisions." },
  { id: 2, domainId: "access", prompt: "I cannot freely view bank accounts, balances, bills, debts, tax records, insurance, benefits, or other financial information that affects me." },
  { id: 3, domainId: "access", prompt: "My income, benefits, refunds, gifts, inheritance, or other money is taken, redirected, withheld, or deposited somewhere I cannot access." },
  { id: 4, domainId: "access", prompt: "I am given an allowance or must ask for money while the other person can spend without the same limits." },
  { id: 5, domainId: "access", prompt: "I must explain purchases, show receipts, or account for small amounts of money in a way the other person does not." },
  { id: 6, domainId: "permission", prompt: "I am punished, shamed, interrogated, threatened, or frightened for spending money - even on agreed expenses or basic needs." },
  { id: 7, domainId: "permission", prompt: "Financial rules change without my agreement, especially after I disagree, set a boundary, or try to gain independence." },
  { id: 8, domainId: "permission", prompt: "Money, cards, account access, transportation, housing, phone service, or other resources are withdrawn to punish or control me." },
  { id: 9, domainId: "permission", prompt: "Someone monitors my purchases, accounts, location, mail, pay, or financial communications beyond what I freely agreed to." },
  { id: 10, domainId: "permission", prompt: "I avoid asking questions or making reasonable purchases because I am afraid of the reaction." },
  { id: 11, domainId: "earning", prompt: "Someone discourages, forbids, or prevents me from working, studying, training, or applying for opportunities." },
  { id: 12, domainId: "earning", prompt: "Someone interferes with my job or education - for example, causing scenes, hiding keys, withholding childcare or transportation, repeatedly interrupting me, making me late, or getting me fired." },
  { id: 13, domainId: "earning", prompt: "I am pressured or forced to work where, when, or how someone else chooses." },
  { id: 14, domainId: "earning", prompt: "I perform substantial work for a person, household, family business, or project without fair access to the income or any meaningful say in how it is used." },
  { id: 15, domainId: "earning", prompt: "My skills, health, disability, immigration status, caregiving duties, or employment gaps are used to convince me I cannot survive without this person." },
  { id: 16, domainId: "debt", prompt: "Accounts, loans, leases, utilities, contracts, or purchases have been opened or placed in my name without my fully informed and freely given consent." },
  { id: 17, domainId: "debt", prompt: "I have been pressured, deceived, threatened, or forced into signing financial documents, borrowing money, transferring property, or taking on debt." },
  { id: 18, domainId: "debt", prompt: "Someone uses my cards or accounts, runs up balances, misses payments, drains funds, or otherwise damages my credit or financial standing." },
  { id: 19, domainId: "debt", prompt: "Someone hides debts, assets, income, taxes, legal obligations, or major purchases that affect me." },
  { id: 20, domainId: "debt", prompt: "I have been pressured or forced to lie on financial, benefits, tax, insurance, court, employment, or government documents." },
  { id: 21, domainId: "needs", prompt: "Money is withheld for food, medication, medical care, clothing, hygiene, housing, childcare, pet care, transportation, or other necessary expenses when resources exist." },
  { id: 22, domainId: "needs", prompt: "Someone controls whether I can use a vehicle, phone, identification, bank card, medication, mobility aid, work equipment, or other resource I need to function independently." },
  { id: 23, domainId: "needs", prompt: "My belongings, money, identification, records, devices, property, or sentimental items have been taken, hidden, sold, destroyed, or held hostage." },
  { id: 24, domainId: "needs", prompt: "Someone refuses to contribute an agreed or reasonable share while demanding access to my labor, money, credit, home, or resources." },
  { id: 25, domainId: "needs", prompt: "Financial emergencies are repeatedly created or allowed to worsen so that I must depend on, repay, obey, or remain with this person." },
  { id: 26, domainId: "resistance", prompt: "I do not have access to enough money, transportation, identification, credit, housing options, or private communication to leave safely if I choose." },
  { id: 27, domainId: "resistance", prompt: "Someone has threatened homelessness, poverty, loss of children or pets, deportation, exposure, arrest, ruined credit, or loss of support if I leave or disobey." },
  { id: 28, domainId: "resistance", prompt: "Attempts to save money, open an account, secure documents, work, seek help, or plan for independence have been blocked, discovered, punished, or sabotaged." },
  { id: 29, domainId: "resistance", prompt: "Financial control becomes worse when I set boundaries, question decisions, reconnect with support, or prepare to leave." },
  { id: 30, domainId: "resistance", prompt: "Taken together, the financial arrangement makes the other person more powerful and leaves me with fewer realistic choices." },
];

const financialHighConcernIds = new Set([12, 16, 17, 18, 19, 20, 21, 22, 23, 27, 28, 29]);

function getFinancialDomainState(score: number) {
  if (score <= 2) return "FEW INDICATORS IN THIS DOMAIN";
  if (score <= 6) return "EMERGING OR OCCASIONAL CONTROL";
  if (score <= 10) return "REPEATED CONTROL WITH MEANINGFUL IMPACT";
  return "SEVERE OR PERVASIVE CONTROL IN THIS DOMAIN";
}

function getFinancialBand(score: number) {
  if (score <= 9) return { label: "FEW INDICATORS IDENTIFIED", text: "Your answers show few clear indicators of financial captivity. That does not automatically mean the arrangement is fair or safe. Pay attention to any item that made you hesitate, any information you are prevented from seeing, and what happens when you disagree.", reflection: "Can both people ask questions, access relevant information, make ordinary choices, and renegotiate the arrangement without fear or punishment?" };
  if (score <= 24) return { label: "CONCERNING IMBALANCE", text: "There are signs that money or resources may be limiting your voice, access, or independence. Some arrangements begin as convenience, generosity, caretaking, or a response to hardship and gradually become one-sided.", reflection: "Which choices have become harder for you to make? Who benefits from the arrangement staying exactly as it is?" };
  if (score <= 44) return { label: "SIGNIFICANT FINANCIAL CONTROL", text: "Your answers suggest a repeated pattern of financial control. The issue is bigger than budgeting conflict: your access, earning power, information, credit, basic needs, or ability to make decisions may be deliberately restricted.", reflection: "What happens when you question the rules or take a step toward independence? A retaliatory response is important evidence of the power structure." };
  if (score <= 64) return { label: "SEVERE FINANCIAL CAPTIVITY", text: "Money and resources appear to be functioning as a system of dominance. The pattern may substantially restrict your ability to make choices, meet basic needs, work, seek help, or leave.", reflection: "Focus first on safe access to support and information. Sudden financial moves or confrontation may trigger retaliation." };
  return { label: "ENTRAPMENT THROUGH FINANCIAL CONTROL", text: "Your answers indicate pervasive financial captivity with a high likelihood that multiple systems - money, work, debt, housing, transportation, documents, or basic needs - are being used together to keep you dependent or compliant.", reflection: "You do not have to solve the entire situation at once. The safest next step may be a confidential conversation with a survivor advocate using a device or account the controlling person cannot access." };
}

type PageFlourishVariant =
  | "assessments"
  | "guides"
  | "planners"
  | "toolkits"
  | "education"
  | "about"
  | "advocacy"
  | "government"
  | "resources"
  | "database"
  | "legal"
  | "rebuilding";

function PageFlourishHeader({
  children,
  eyebrow,
  title,
  titleId,
  variant,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  titleId: string;
  variant: PageFlourishVariant;
}) {
  return (
    <header className={`page-flourish-header page-flourish-${variant}`}>
      <div className="page-flourish-copy">
        <p className="folk-kicker">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        <div className="page-flourish-intro">{children}</div>
      </div>
    </header>
  );
}

const categoryFiles: Record<
  Extract<ModuleKey, "assessments" | "guides" | "planners" | "toolkits" | "education" | "about" | "advocacy" | "government">,
  {
    title: string;
    intro: string;
    files: CategoryFile[];
  }
> = {
  assessments: {
    title: "Assessments",
    intro:
      "Interactive browser-only tools that help a user name patterns, reality-check old stories, and decide what kind of support file to open next.",
    files: [
      {
        title: "Was I Crazy?",
        description: "Reality-check assessment for gaslighting, blame shifting, fear, control, and memory fog.",
        status: "LIVE",
        target: "am-i-crazy",
        path: "/am-i-crazy",
      },
      {
        title: "Is It Love or Fear?",
        description: "A 24-item relationship reality assessment with a separate priority pattern check.",
        status: "LIVE",
        modal: "love-or-fear",
      },
      {
        title: "The Freedom Test",
        description: "How much freedom do you actually have without retaliation?",
        status: "LIVE",
        modal: "freedom-test",
      },
      {
        title: "Coercive Control Pattern Map",
        description: "Map where control is operating, how concentrated it is, and which behaviors matter on their own.",
        status: "LIVE",
        modal: "coercive-control-map",
      },
      {
        title: "Financial Captivity Assessment",
        description: "Is money being used to reduce your choices and establish control over you?",
        status: "LIVE",
        modal: "financial-captivity",
      },
      {
        title: "Rebuilding Readiness Check",
        description: "Future assessment for housing, benefits, paperwork, emotional bandwidth, and next-step capacity.",
        status: "QUEUED",
      },
    ],
  },
  guides: {
    title: "Guides",
    intro:
      "Live walkthroughs for the practical parts of rebuilding: housing, benefits, routines, digital traces, pets, and temporary survival logistics.",
    files: [
      {
        title: "Housing Options",
        description: "Fifteen housing pathways beyond emergency shelter, plus call scripts, privacy questions, and national starting points.",
        status: "LIVE",
        categoryId: "housing",
        guideId: "housing-options",
      },
      {
        title: "How To Navigate Housing",
        description: "Coordinated Entry, waitlists, documents, privacy, shelter systems, and follow-up.",
        status: "LIVE",
        categoryId: "housing",
        guideId: "housing-navigation",
        target: "rebuilding",
        path: "/rebuilding",
      },
      {
        title: "How To Navigate SNAP & TANF",
        description: "Food benefits, cash assistance, interviews, documents, expedited SNAP, and safe contact.",
        status: "LIVE",
        categoryId: "food",
        guideId: "snap-tanf",
        target: "how-to",
        path: "/guides",
      },
      {
        title: "How To Live In Your Car",
        description: "Vehicle living basics, privacy, food, bathrooms, pets, kids, sleep, and movement.",
        status: "LIVE",
        categoryId: "homelessness",
        guideId: "live-in-your-car",
        target: "how-to",
        path: "/guides",
      },
      {
        title: "Digital Trace Cleanup",
        description: "Browser history, private browsing limits, safer-device reminders, and screenshots.",
        status: "LIVE",
        categoryId: "digital-safety",
        guideId: "browser-trace-cleanup",
        target: "how-to",
        path: "/guides",
      },
      {
        title: "Family Court Guide",
        description: "Family court orientation, custody, hearings, evidence, deadlines, and practical preparation.",
        status: "LIVE",
        categoryId: "legal-family",
        target: "legal",
        path: "/resources/legal-family",
      },
      {
        title: "Civil Protective Order Guide",
        description: "What civil protective orders can involve, what to expect, and how to organize court information.",
        status: "LIVE",
        categoryId: "legal-civil",
        target: "legal",
        path: "/resources/legal-civil",
      },
      {
        title: "Motion Drafting Basics",
        description: "Plain-language orientation for organizing a request, facts, relief, and supporting information.",
        status: "LIVE",
        categoryId: "legal-civil",
        target: "legal",
        path: "/resources/legal-civil",
      },
      {
        title: "Reporting & Criminal-System Navigation",
        description: "A future guide to reports, incident numbers, victim services, follow-up, and criminal-system terminology.",
        status: "QUEUED",
        categoryId: "legal-criminal",
      },
      {
        title: "Understanding Crime Victim Compensation",
        description: "Reimbursement, eligibility clauses, covered expenses, documentation, caps, delays, denials, and appeals.",
        status: "LIVE",
        categoryId: "legal-criminal",
        guideId: "crime-victim-compensation",
      },
      {
        title: "Understanding Financial Captivity",
        description: "A future guide to coerced debt, restricted access, financial surveillance, benefits, and economic control.",
        status: "QUEUED",
        categoryId: "money",
      },
      {
        title: "How To Create Routine While Life Is Chaotic",
        description: "Small anchors, rest, self-care, appointments, and routines that can survive disrupted days.",
        status: "LIVE",
        categoryId: "daily-stability",
        guideId: "routine-chaos",
        target: "how-to",
        path: "/guides",
      },
      {
        title: "How To Make A Safety Plan For Your Pet",
        description: "Records, emergency fostering, proof of care, supplies, and backup-care considerations.",
        status: "LIVE",
        categoryId: "daily-stability",
        guideId: "pet-safety-plan",
        target: "how-to",
        path: "/guides",
      },
    ],
  },
  planners: {
    title: "Planners & Trackers",
    intro:
      "Reusable systems for tracking the chaos: documents, calls, benefits, housing, court dates, appointments, deadlines, and resource contact logs.",
    files: [
      {
        title: "Database Access Information",
        description: "Access paths, library previews, permanent unlocks, and deeper planner/tracker rules.",
        status: "LIVE",
        target: "access",
        path: "/resources/access",
      },
      {
        title: "Housing Assistance Tracker",
        description: "Applications, waitlists, caseworkers, document requests, and follow-up dates.",
        status: "LIBRARY",
        target: "access",
        path: "/resources/access",
      },
      {
        title: "Benefits Assistance Tracker",
        description: "SNAP, TANF, Medicaid, interview notes, upload confirmations, and renewal deadlines.",
        status: "LIBRARY",
        target: "access",
        path: "/resources/access",
      },
      {
        title: "Court Date Tracker",
        description: "Hearings, filing deadlines, evidence notes, requested protections, and follow-up tasks.",
        status: "LIBRARY",
        target: "access",
        path: "/resources/access",
      },
    ],
  },
  toolkits: {
    title: "Toolkits",
    intro:
      "Editable resources for taking action: checklists, worksheets, templates, examples, planners, trackers, and practical support files.",
    files: [
      {
        title: "Resource Library",
        description: "The deeper toolkit library with previews, access paths, and permanent unlocks.",
        status: "LIVE",
        target: "access",
        path: "/resources/access",
      },
      {
        title: "Court Toolkit",
        description: "Protective order, family court, evidence, hearing prep, and follow-up support.",
        status: "LIBRARY",
        target: "access",
        path: "/resources/access",
      },
      {
        title: "Housing Toolkit",
        description: "Housing applications, contacts, documents, coordinated entry, and follow-up.",
        status: "LIBRARY",
        target: "access",
        path: "/resources/access",
      },
    ],
  },
  education: {
    title: "Education & Awareness",
    intro:
      "Pattern language, abuse dynamics, rebuilding concepts, and plain-English explanations that help the user stop arguing with the fog.",
    files: [
      {
        title: "Gaslighting & Reality Rewriting",
        description: "Why confusion can become evidence instead of a personal failure.",
        status: "QUEUED",
      },
      {
        title: "Gray Rocking For Survival",
        description: "Not about being right. About getting out of the interaction with less fuel on the fire.",
        status: "QUEUED",
      },
      {
        title: "Be So For Real",
        description: "A future statistics-and-reality section with the sassy system voice intact.",
        status: "QUEUED",
      },
      {
        title: "Was I Crazy?",
        description: "The current live assessment also functions as pattern education.",
        status: "LIVE",
        target: "am-i-crazy",
        path: "/am-i-crazy",
      },
    ],
  },
  about: {
    title: "About",
    intro:
      "Survivor Systems is a survivor-built resource platform for clarity, documentation, practical support, and rebuilding after control.",
    files: [
      {
        title: "Mission",
        description: "Tools that treat survivors as capable people, not fragile paperwork problems.",
        status: "LIVE",
      },
      {
        title: "Privacy Position",
        description: "No accounts for free tools, no answer storage for assessments, and no unnecessary data collection.",
        status: "LIVE",
      },
      {
        title: "What This Is Not",
        description: "Not emergency services, not legal advice, not therapy, and not another place that takes control away.",
        status: "LIVE",
      },
    ],
  },
  advocacy: {
    title: "Advocacy",
    intro:
      "Support-facing resources: what to ask for, who might help, how to explain the situation, and how to keep power dynamics visible.",
    files: [
      {
        title: "Local Support Starting Points",
        description: "Advocates, shelters, crisis centers, 211, legal aid, and community resource routing.",
        status: "LIVE",
        target: "local-help",
        path: "/resources",
      },
      {
        title: "How To Talk To An Advocate",
        description: "Future script support for asking for help without over-explaining or apologizing.",
        status: "QUEUED",
      },
      {
        title: "Humiliation Is Part Of The System",
        description: "Future rebuilding piece about intakes, approvals, gatekeeping, and surviving bureaucracy.",
        status: "QUEUED",
      },
    ],
  },
  government: {
    title: "Government",
    intro:
      "Public systems, benefits, courts, housing pathways, documentation, and government-adjacent processes in one place.",
    files: [
      {
        title: "SNAP & TANF",
        description: "Application basics, interviews, missing documents, expedited SNAP, and DV-related exemptions.",
        status: "LIVE",
        target: "how-to",
        path: "/guides",
      },
      {
        title: "Housing Navigation",
        description: "Coordinated Entry, shelters, waitlists, VAWA, privacy, and follow-up.",
        status: "LIVE",
        target: "rebuilding",
        path: "/rebuilding",
      },
      {
        title: "Protective Orders",
        description: "Civil protective order basics, what to expect, evidence, violations, and court overlap.",
        status: "LIVE",
        target: "legal",
        path: "/resources",
      },
      {
        title: "Family Court",
        description: "Custody, support, exchanges, court prep, and safety-aware legal-system notes.",
        status: "LIVE",
        target: "legal",
        path: "/resources",
      },
    ],
  },
};

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
        title: "Pet Backup Kit",
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

function getInitialModule(): ModuleKey {
  const path = window.location.pathname;
  if (path === "/assessments") return "assessments";
  if (path === "/guides") return "guides";
  if (path.startsWith("/guides/")) return "how-to";
  if (path === "/planners-trackers" || path === "/toolkits") return "local-help";
  if (path === "/education-awareness") return "education";
  if (path === "/about") return "about";
  if (path === "/advocacy") return "advocacy";
  if (path === "/government") return "government";
  if (path === "/support") return "support";
  if (path === "/rebuilding") return "rebuilding";
  if (path === "/planning" || path === "/go-bag-prep" || path === "/crisis-support") return "planning";
  if (path === "/local-help") return "local-help";
  if (path === "/how-to") return "how-to";
  if (path === "/legal") return "legal";
  if (path === "/library") return "access";
  if (path === "/resources/access") return "access";
  if (path.startsWith("/resources/")) return "local-help";
  if (path === "/resources") return "local-help";

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

function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-logo ${className}`} aria-label="Survivor Systems">
      <span className="brand-logo-survivor">Survivor</span>
      <span className="brand-logo-systems">Systems</span>
    </span>
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
        "AVAILABLE COMMANDS: ASSESSMENTS, GUIDES, PLANNERS, TOOLKITS, EDUCATION, ABOUT, QUICK EXIT.",
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

  if (/\b(assessments?|quiz|scan|was i crazy|crazy|abused|abuse|gaslight|gaslighting|reality)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO ASSESSMENTS...", target: navItemFor("assessments") };
  }

  if (/\b(guides?|how to|housing|routine|pet|browser|car)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO GUIDES...", target: navItemFor("guides") };
  }

  if (/\b(planners?|trackers?)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO PLANNERS & TRACKERS...", target: navItemFor("planners") };
  }

  if (/\b(toolkits?|database|access pass|access information|access info|passes|pass options|download|downloads|library|paid|stripe)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO TOOLKITS...", target: navItemFor("toolkits") };
  }

  if (/\b(education|awareness|learn|dynamics|gray rock|statistics|be so for real)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO EDUCATION & AWARENESS...", target: navItemFor("education") };
  }

  if (/\b(about|mission|privacy|founder|who built)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO ABOUT...", target: navItemFor("about") };
  }

  if (/\b(advocacy|advocate|hotline|shelter|support|near|local)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO ADVOCACY...", target: navItemFor("advocacy") };
  }

  if (/\b(government|snap|tanf|benefits|court|legal|rights|order|documents|public assistance)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO GOVERNMENT...", target: navItemFor("government") };
  }

  if (/ctrl\s*\+\s*esc|\bfirst steps?\b|\bprep\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO ASSESSMENTS...", target: navItemFor("assessments") };
  }

  if (/\b(go.?bag|bag|simulator|arcade|prep|pack)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO GUIDES...", target: navItemFor("guides") };
  }

  if (/\b(plan|safety|prepare|documents|checklist)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO PLANNERS & TRACKERS...", target: navItemFor("planners") };
  }

  if (/\b(leave|leaving|go bag|escape|exit plan)\b/.test(normalized)) {
    return { message: "ESCAPE QUERY DETECTED. ROUTING TO DIRECT SUPPORT OPTIONS...", target: navItemFor("planning") };
  }

  if (/\b(rebuild|money|housing|future|after)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO GUIDES...", target: navItemFor("guides") };
  }

  return {
    message:
      "QUERY NOT RECOGNIZED. TRY: ASSESSMENTS, GUIDES, PLANNERS, TOOLKITS, EDUCATION, ABOUT, OR QUICK EXIT.",
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
          placeholder="type: assessments, guides, planners, education, advocacy, government..."
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
  onNavigate,
}: {
  activeModule: ModuleKey;
  children: ReactNode;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const activeLabel = moduleRoutes[activeModule]?.label ?? "Home";

  return (
    <main className={`terminal-frame app-frame win95-frame hud-frame module-${activeModule}`}>
      <section className="win95-desktop" aria-label="Survivor Systems">
        <aside className="folk-sidebar">
          <button className="desktop-brand-panel" type="button" onClick={() => onNavigate("home", "/")}>
            <BrandLogo />
          </button>
          <nav className="desktop-icon-grid" aria-label="Site navigation">
            {navItems.map((item) => (
              <button
                className={`desktop-icon desktop-icon-${item.code}${isPrimaryNavActive(activeModule, item.key) ? " active" : ""}`}
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key, item.path)}
              >
                <span className="desktop-icon-code" aria-hidden="true">
                  <SidebarIcon icon={item.code} />
                </span>
                <span className="desktop-icon-title">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-actions">
            <button className="sidebar-support" type="button" onClick={() => onNavigate("advocacy", "/advocacy")}>
              You're Not Alone
            </button>
          </div>
        </aside>

        <button className="floating-quick-escape" type="button" onClick={leaveSite} aria-label="Quick Escape">
          Quick Escape
        </button>

        <section className="folk-main-shell">
          <section className={`terminal-screen win95-window hud-window hud-window-${activeModule}`} aria-label={`${activeLabel} window`}>
          <div className="win95-titlebar">
            <div className="win95-titlebar-label">
              <span>{activeLabel}</span>
            </div>
            <div className="win95-window-controls">
              <span aria-hidden="true">SYS</span>
              <span aria-hidden="true">MAP</span>
              <button
                aria-label="Close window and return to desktop"
                type="button"
                onClick={() => onNavigate("home", "/")}
              >
                x
              </button>
            </div>
          </div>

          <header className="terminal-topbar">
            <div className="terminal-heading-row">
              <div className="terminal-topbar-title">
                <span className="terminal-label">USER TERMINAL</span>
                <h1>{activeLabel}</h1>
              </div>
              <div className="system-status">
                <span>DATE {new Date().toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" })}</span>
                <span>TIME {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <strong>SYSTEM ONLINE</strong>
              </div>
            </div>
            <TerminalCommand onNavigate={onNavigate} />
          </header>
          <div className="terminal-content">{children}</div>
          </section>
        </section>

        <footer className="win95-taskbar">
          <button className="win95-start" type="button" onClick={() => onNavigate("home", "/")}>
            Start
          </button>
          <div className="win95-taskbar-slot">
            <span aria-hidden="true" />
            {activeLabel}
          </div>
        </footer>
      </section>
    </main>
  );
}

function HomeModule({ onNavigate }: { onNavigate: (module: ModuleKey, path: string) => void }) {
  const homeCards: Array<{
    code: string;
    classification: string;
    title: string;
    copy: string;
    action: string;
    module: ModuleKey;
    path: string;
  }> = [
    {
      code: "01",
      classification: "PRIVATE EVALUATION",
      title: "Assessments",
      copy: "Understand your experiences, identify patterns, and create a clearer path forward.",
      action: "Take an Assessment",
      module: "assessments",
      path: "/assessments",
    },
    {
      code: "02",
      classification: "FIELD MANUALS",
      title: "Guides",
      copy: "Plain-language support for court, housing, benefits, safety planning, and rebuilding.",
      action: "Browse Guides",
      module: "guides",
      path: "/guides",
    },
    {
      code: "03",
      classification: "WORKING FILES",
      title: "Resources",
      copy: "Find planners, trackers, toolkits, and practical files organized by housing, legal, food, money, homelessness, and more.",
      action: "Browse Resources",
      module: "local-help",
      path: "/resources",
    },
    {
      code: "04",
      classification: "INTELLIGENCE LIBRARY",
      title: "Education",
      copy: "Learn about coercive control, trauma, stalking, manipulation, and post-separation abuse.",
      action: "Start Learning",
      module: "education",
      path: "/education-awareness",
    },
  ];

  return (
    <section className="home-terminal" aria-labelledby="home-title">
      <header className="home-briefing-bar">
        <div>
          <span>THE SURVIVOR SYSTEMS ARCHIVE</span>
          <strong>REFERENCE DESK // COLLECTION 001</strong>
        </div>
        <p>CLARITY&nbsp;&nbsp;&middot;&nbsp;&nbsp;PROTECTION&nbsp;&nbsp;&middot;&nbsp;&nbsp;POWER</p>
      </header>

      <div className="home-hero-composition">
        <article className="home-message refined-home-message">
          <p className="folk-kicker">Private reference file for the life that belongs to you.</p>
          <h1 id="home-title">Welcome to<br /><em>Survivor Systems.</em></h1>
          <p>
            Domestic violence is deadly. About 1 in 5 homicide victims in the United States is
            killed by an intimate partner. More than half of female homicide victims are killed by
            a current or former male partner. Leaving can be one of the most dangerous points in an
            abusive relationship, but the systems survivors are told to rely on are fragmented,
            difficult to navigate, and often unprepared for the realities of coercive control.
          </p>
          <p>
            Survivor Systems exists because the systems currently in place aren't enough. No one
            should have to become an expert in safety planning, housing, public benefits, financial
            recovery, family court, documentation, and trauma just to get free.
          </p>
          <p className="mission-emphasis">You do not have to solve your entire life before dinner.</p>
          <div className="home-hero-actions" aria-label="Start options">
            <button type="button" onClick={() => onNavigate("guides", "/guides")}>
              Explore Tools & Guides
            </button>
            <button type="button" onClick={() => onNavigate("assessments", "/assessments")}>
              Start with an Assessment
            </button>
          </div>
        </article>
        <aside className="home-hero-visual" aria-label="Botanical field-system artwork">
          <div className="home-dossier-art">
            <FolkHero className="folk-hero-art" />
            <p>CASE STATUS <strong>OPEN</strong></p>
          </div>
        </aside>
      </div>

      <div className="home-index-heading">
        <div><span>READING ROOM INDEX</span><h2>Choose a starting file.</h2></div>
        <p>Consult in any order. Return whenever you need.</p>
      </div>
      <div className="home-category-grid" aria-label="Resource categories">
        {homeCards.map((card) => (
          <article className={`home-category-card home-category-card-${card.code}`} key={card.title}>
            <div className="home-file-tab"><span>{card.code}</span><small>{card.classification}</small></div>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
            <button type="button" onClick={() => onNavigate(card.module, card.path)}>
              {card.action}
            </button>
          </article>
        ))}
      </div>

      <div className="home-support-grid">
        <section className="start-where-you-are" aria-labelledby="home-start-where">
          <div>
            <p className="folk-kicker">FIELD NOTE // PERMISSION GRANTED</p>
            <h2 id="home-start-where">Start where you are.</h2>
            <p>
              You do not have to have it all figured out. Whether you need information, a plan, or
              just a place to breathe, you can begin with one manageable next step.
            </p>
          </div>
          <div className="home-choice-list" aria-label="Common starting points">
            <button type="button" onClick={() => onNavigate("assessments", "/assessments")}>I need clarity</button>
            <button type="button" onClick={() => onNavigate("local-help", "/resources")}>I need a plan</button>
            <button type="button" onClick={() => onNavigate("advocacy", "/advocacy")}>I need support</button>
            <button type="button" onClick={() => onNavigate("education", "/education-awareness")}>I am here to learn</button>
          </div>
        </section>

        <section className="home-privacy-panel" aria-labelledby="home-privacy">
          <div>
            <p className="folk-kicker">SECURITY BRIEFING</p>
            <h2 id="home-privacy">Your privacy. Your power.</h2>
            <p>
              Your internet activity, downloads, accounts, and browsing history may be monitored.
              Use a safer device whenever possible, clear history only when it is safe, and be careful
              about saving documents or passwords on shared devices.
            </p>
            <button type="button" onClick={() => onNavigate("guides", "/guides")}>Online Safety Tips</button>
          </div>
        </section>
      </div>
    </section>
  );
}
function CategoryModule({
  category,
  onNavigate,
}: {
  category: Extract<ModuleKey, "assessments" | "guides" | "planners" | "toolkits" | "education" | "about" | "advocacy" | "government">;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const content = categoryFiles[category];
  const [activeModal, setActiveModal] = useState<CategoryFile["modal"] | null>(null);
  const guideCategories = category === "guides"
    ? resourceCategoryDefinitions
        .map((definition) => ({ ...definition, files: content.files.filter((file) => file.categoryId === definition.id) }))
        .filter((definition) => definition.files.length > 0)
    : [];

  function renderCategoryFile(file: CategoryFile) {
    return (
      <article className="category-file-card" key={file.title}>
        <div className="category-file-meta">
          <span>{file.status}</span>
          <small>{file.target || file.modal ? "OPENABLE" : "PENDING BUILD"}</small>
        </div>
        {file.modal ? (
          <h2><button className="category-file-title-button" type="button" onClick={() => setActiveModal(file.modal ?? null)}>{file.title}</button></h2>
        ) : <h2>{file.title}</h2>}
        <p>{file.description}</p>
        {file.modal ? (
          <button type="button" onClick={() => setActiveModal(file.modal ?? null)}>Open Assessment</button>
        ) : file.guideId ? (
          <button type="button" onClick={() => onNavigate("how-to", `/guides/${file.guideId}`)}>Open Guide</button>
        ) : file.target && file.path ? (
          <button type="button" onClick={() => onNavigate(file.target as ModuleKey, file.path as string)}>{category === "guides" ? "Open Guide" : "Open File"}</button>
        ) : <button type="button" disabled>Queued</button>}
      </article>
    );
  }

  return (
    <section className="page-shell category-module" aria-labelledby={`${category}-title`}>
      <PageFlourishHeader
        eyebrow={`Open directory // ${content.title}`}
        title={content.title}
        titleId={`${category}-title`}
        variant={category}
      >
        <p>{content.intro}</p>
      </PageFlourishHeader>

      {category === "guides" ? (
        <div className="guide-category-directory">
          {guideCategories.map((guideCategory) => (
            <section className="guide-category-section" key={guideCategory.id}>
              <header>
                <div><span className="terminal-label">CATEGORY</span><h2>{guideCategory.label}</h2><p>{guideCategory.description}</p></div>
                <button type="button" onClick={() => onNavigate("local-help", `/resources/${guideCategory.id}`)}>Related Resources</button>
              </header>
              <div className="category-file-grid">{guideCategory.files.map(renderCategoryFile)}</div>
            </section>
          ))}
        </div>
      ) : <div className="category-file-grid">{content.files.map(renderCategoryFile)}</div>}

      {activeModal === "love-or-fear" ? <LoveFearAssessmentModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === "freedom-test" ? <FreedomTestAssessmentModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === "coercive-control-map" ? <CoerciveControlPatternMapModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === "financial-captivity" ? <FinancialCaptivityAssessmentModal onClose={() => setActiveModal(null)} /> : null}
    </section>
  );
}

function FinancialCaptivityAssessmentModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<FinancialPhase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, FinancialScore>>({});
  const modalRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const currentItem = financialItems[questionIndex];
  const hasCurrentAnswer = currentItem ? answers[currentItem.id] !== undefined : false;
  const numericItems = financialItems.filter((item) => typeof answers[item.id] === "number");
  const numericCount = numericItems.length;
  const notSureCount = financialItems.length - numericCount;
  const rawTotal = numericItems.reduce((sum, item) => sum + (answers[item.id] as number), 0);
  const adjustedTotal = numericCount > 0 ? Math.round((rawTotal / numericCount) * 30) : 0;
  const resultScore = numericCount === 30 ? rawTotal : adjustedTotal;
  const hasOverallBand = numericCount >= 24;
  const band = hasOverallBand ? getFinancialBand(resultScore) : null;
  const domainResults = financialDomains.map((domain) => {
    const items = financialItems.filter((item) => item.domainId === domain.id);
    const numeric = items.filter((item) => typeof answers[item.id] === "number");
    const score = numeric.reduce((sum, item) => sum + (answers[item.id] as number), 0);
    return { ...domain, score, answered: numeric.length, notSure: items.length - numeric.length };
  });
  const strongestDomains = [...domainResults].sort((a, b) => b.score - a.score).slice(0, 3);
  const highConcernItems = financialItems.filter((item) => financialHighConcernIds.has(item.id) && ((answers[item.id] === 2) || (answers[item.id] === 3)));

  function resetState() {
    setPhase("intro");
    setQuestionIndex(0);
    setAnswers({});
  }

  function closeAssessment() {
    resetState();
    previousFocusRef.current?.focus();
    onClose();
  }

  function quickExit() {
    resetState();
    onClose();
    leaveSite();
  }

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    headingRef.current?.focus();
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  useEffect(() => { headingRef.current?.focus(); }, [phase, questionIndex]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAssessment();
      return;
    }
    if (event.key !== "Tab" || !modalRef.current) return;
    const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute("aria-hidden"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function goBack() {
    if (questionIndex === 0) setPhase("intro");
    else setQuestionIndex((current) => current - 1);
  }

  function goNext() {
    if (!hasCurrentAnswer) return;
    if (questionIndex === financialItems.length - 1) setPhase("results");
    else setQuestionIndex((current) => current + 1);
  }

  return (
    <div className="assessment-modal-backdrop" role="presentation">
      <section aria-describedby="financial-captivity-description" aria-labelledby="financial-captivity-title" aria-modal="true" className="assessment-modal freedom-test-modal financial-captivity-modal" onKeyDown={handleKeyDown} ref={modalRef} role="dialog">
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">TEMP MEMORY ONLY</span>
            <h1 id="financial-captivity-title" ref={headingRef} tabIndex={-1}>Financial Captivity Assessment</h1>
            <p className="sr-only" id="financial-captivity-description">An in-memory educational assessment. Answers are not saved.</p>
          </div>
          <div className="assessment-modal-actions">
            <button type="button" onClick={quickExit}>Quick Exit</button>
            <button aria-label="Close assessment" type="button" onClick={closeAssessment}>X</button>
          </div>
        </header>

        {phase === "intro" ? (
          <div className="assessment-modal-body freedom-test-intro">
            <h2>Is money being used to reduce your choices and establish control over you?</h2>
            <p>Financial control is not simply one person earning more, managing the budget, or a household going through hard times. The issue is power: whether someone uses money, work, debt, housing, transportation, benefits, or access to basic needs to make you dependent, punish resistance, prevent you from leaving, or establish the right to make decisions for you.</p>
            <p>This assessment can help you identify a pattern. It is educational, not a diagnosis, legal opinion, or financial audit. You do not need a high score - or any score - to deserve support.</p>
            <section className="freedom-test-note">
              <h3>Before you begin</h3>
              <p>If someone may monitor your phone, browser, email, bank activity, location, or downloads, use the safest device available to you. Do not save, print, change passwords, move money, or confront the person if doing so could put you at risk. Private action is not always safe action.</p>
            </section>
            <section className="freedom-scale-summary financial-scale-summary">
              {financialScale.map((option) => <article key={String(option.value)}><strong>{option.value === "not-sure" ? "?" : option.value}</strong><span>{option.label}</span><p>{option.meaning}</p></article>)}
            </section>
            <div className="assessment-modal-nav">
              <button type="button" onClick={() => setPhase("questions")}>Start Assessment</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}

        {phase === "questions" && currentItem ? (
          <div className="assessment-modal-body">
            <div className="question-status" aria-live="polite"><span>Question {questionIndex + 1} of 30</span><span>{financialDomains.find((domain) => domain.id === currentItem.domainId)?.label}</span></div>
            <h2>{currentItem.prompt}</h2>
            <div className="freedom-response-list" role="radiogroup" aria-label="Choose one response">
              {financialScale.map((option) => (
                <button aria-checked={answers[currentItem.id] === option.value} className={answers[currentItem.id] === option.value ? "selected" : ""} key={String(option.value)} role="radio" type="button" onClick={() => setAnswers((current) => ({ ...current, [currentItem.id]: option.value }))}>
                  <strong>{option.value === "not-sure" ? "?" : option.value}</strong><span>{option.label}</span><small>{option.meaning}</small>
                </button>
              ))}
            </div>
            <div className="assessment-modal-nav">
              <button type="button" onClick={goBack}>Back</button>
              <button disabled={!hasCurrentAnswer} type="button" onClick={goNext}>{questionIndex === 29 ? "Show Results" : "Next"}</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}

        {phase === "results" ? (
          <div className="assessment-modal-body love-fear-results freedom-test-results financial-results">
            <h2>Your Financial Captivity Assessment</h2>
            <p>Your answers stay only in this open session.</p>

            {highConcernItems.length ? (
              <section className="love-fear-alert">
                <h3>High-concern indicators</h3>
                <p>These behaviors can rapidly increase dependence, create legal or credit consequences, and make leaving more dangerous. They deserve attention regardless of the total score.</p>
                <ul>{highConcernItems.map((item) => <li key={item.id}><strong>Question {item.id} - {answers[item.id]}</strong><br />{item.prompt}</li>)}</ul>
              </section>
            ) : null}

            <section>
              <h3>Financial control by domain</h3>
              <p><strong>Highest domain scores:</strong> {strongestDomains.map((domain) => domain.label).join(", ")}.</p>
              <div className="pattern-map-domain-grid">
                {domainResults.map((domain) => (
                  <article className={`pattern-map-domain state-${Math.min(3, Math.floor(domain.score / 4))}`} key={domain.id}>
                    <div><h4>{domain.label}</h4><strong>{domain.score} / 15</strong></div>
                    <div aria-hidden="true" className="pattern-map-bar"><span style={{ width: `${(domain.score / 15) * 100}%` }} /></div>
                    <p><strong>{getFinancialDomainState(domain.score)}</strong></p>
                    {domain.notSure ? <p>{domain.notSure} response{domain.notSure === 1 ? "" : "s"} marked Not sure in this domain.</p> : null}
                  </article>
                ))}
              </div>
            </section>

            <section>
              {hasOverallBand && band ? (
                <>
                  <h3>{numericCount === 30 ? rawTotal : resultScore} / 90 - {band.label}</h3>
                  {numericCount < 30 ? <p><strong>Estimated score:</strong> ({rawTotal} raw points / {numericCount} numeric answers) x 30, rounded to {resultScore}. {notSureCount} response{notSureCount === 1 ? " was" : "s were"} marked Not sure.</p> : null}
                  <p>{band.text}</p>
                  <p><strong>Reflection:</strong> {band.reflection}</p>
                </>
              ) : (
                <>
                  <h3>Partial result - domain observations only</h3>
                  <p>{numericCount} of 30 responses were numeric and {notSureCount} were marked Not sure. An overall result range is not assigned when fewer than 24 responses are numeric.</p>
                </>
              )}
              {notSureCount ? <p className="freedom-test-note"><strong>Not having access to basic financial information may itself be relevant.</strong></p> : null}
              <p>Your score is a pattern-recognition tool, not a verdict. Frequency matters, but severity and purpose matter too. A single act - such as coerced debt, withholding medication, stealing identity documents, or threatening homelessness - can create serious captivity even when the total score is low.</p>
            </section>

            <section>
              <h3>What the pattern may be doing</h3>
              <ol className="financial-pattern-steps">
                <li><strong>Reduce access:</strong> Control money, documents, transportation, accounts, or information.</li>
                <li><strong>Reduce capacity:</strong> Interfere with work, education, health care, credit, or outside support.</li>
                <li><strong>Increase consequences:</strong> Create debt, dependence, housing insecurity, legal exposure, or fear of losing children or pets.</li>
                <li><strong>Punish resistance:</strong> Withdraw resources, escalate monitoring, manufacture emergencies, or threaten ruin.</li>
                <li><strong>Rewrite the story:</strong> Describe the control as help, responsibility, protection, generosity, or proof that you are incapable.</li>
              </ol>
              <p>The controlling person may point to your current dependence as justification for more control - even when their behavior helped create that dependence. That circular trap is the machinery of financial captivity.</p>
            </section>

            <footer className="love-fear-support-footer">
              <strong>SUPPORT IS INFORMATION, NOT A COMMAND</strong>
              <p>Needing financial help does not give another person ownership of your decisions. Earning less does not make your voice worth less. If money is being used to make "no" impossible, the problem is not that you are bad with money. The problem is control.</p>
              <p>If you may be in immediate danger, call emergency services if that is safe and appropriate where you are. In the United States, call the National Domestic Violence Hotline at 800-799-SAFE (7233), text START to 88788, or visit TheHotline.org. Use a safer device when possible.</p>
              <a href="/guides">Explore support resources</a>
            </footer>
            <div className="assessment-modal-nav">
              <button type="button" onClick={() => { setPhase("questions"); setQuestionIndex(0); }}>Review answers</button>
              <button type="button" onClick={resetState}>Start over</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CoerciveControlPatternMapModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<PatternMapPhase>("intro");
  const [scoredIndex, setScoredIndex] = useState(0);
  const [priorityIndex, setPriorityIndex] = useState(0);
  const [scoredAnswers, setScoredAnswers] = useState<Record<string, PatternMapScore>>({});
  const [priorityAnswers, setPriorityAnswers] = useState<Record<string, PatternMapPriorityAnswer>>({});
  const modalRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const currentScoredItem = patternMapScoredItems[scoredIndex];
  const currentPriorityItem = patternMapPriorityItems[priorityIndex];
  const hasCurrentScore = currentScoredItem ? scoredAnswers[currentScoredItem.id] !== undefined : false;
  const hasCurrentPriority = currentPriorityItem ? priorityAnswers[currentPriorityItem.id] !== undefined : false;
  const subtotals = Object.fromEntries(
    patternMapDomainOrder.map((domainId) => [
      domainId,
      patternMapScoredItems
        .filter((item) => item.domainId === domainId)
        .reduce((sum, item) => sum + (scoredAnswers[item.id] ?? 0), 0),
    ]),
  ) as Record<PatternMapDomainId, number>;
  const total = patternMapScoredItems.reduce((sum, item) => sum + (scoredAnswers[item.id] ?? 0), 0);
  const highDomains = patternMapDomainOrder.filter((domainId) => subtotals[domainId] >= 8);
  const highestSubtotal = Math.max(...patternMapDomainOrder.map((domainId) => subtotals[domainId]));
  const highestDomains = patternMapDomainOrder.filter((domainId) => subtotals[domainId] === highestSubtotal);
  const flaggedScored = patternMapScoredItems
    .filter((item) => (scoredAnswers[item.id] ?? 0) >= 3)
    .sort((a, b) => (scoredAnswers[b.id] ?? 0) - (scoredAnswers[a.id] ?? 0));
  const priorityYes = patternMapPriorityItems.filter((item) => priorityAnswers[item.id] === "yes");
  const priorityUnsure = patternMapPriorityItems.filter((item) => priorityAnswers[item.id] === "unsure");
  const band = getPatternMapBand(total);

  function resetState() {
    setPhase("intro");
    setScoredIndex(0);
    setPriorityIndex(0);
    setScoredAnswers({});
    setPriorityAnswers({});
  }

  function closeAssessment() {
    resetState();
    previousFocusRef.current?.focus();
    onClose();
  }

  function quickExit() {
    resetState();
    onClose();
    leaveSite();
  }

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    headingRef.current?.focus();
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [phase, scoredIndex, priorityIndex]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAssessment();
      return;
    }
    if (event.key !== "Tab" || !modalRef.current) return;
    const focusable = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("aria-hidden"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function goBackFromScored() {
    if (scoredIndex === 0) setPhase("intro");
    else setScoredIndex((current) => current - 1);
  }

  function goNextFromScored() {
    if (!hasCurrentScore) return;
    if (scoredIndex === patternMapScoredItems.length - 1) setPhase("priorityIntro");
    else setScoredIndex((current) => current + 1);
  }

  function goBackFromPriority() {
    if (priorityIndex === 0) setPhase("priorityIntro");
    else setPriorityIndex((current) => current - 1);
  }

  function goNextFromPriority() {
    if (!hasCurrentPriority) return;
    if (priorityIndex === patternMapPriorityItems.length - 1) setPhase("results");
    else setPriorityIndex((current) => current + 1);
  }

  const summaryDomains = highDomains.length > 0 ? highDomains : highestDomains;
  const summaryPrefix = highestSubtotal <= 3
    ? summaryDomains.length === 1 ? "Area to review" : "Areas to review"
    : summaryDomains.length === 1 ? "Most restricted area" : "Most restricted areas";

  return (
    <div className="assessment-modal-backdrop" role="presentation">
      <section
        aria-describedby="pattern-map-description"
        aria-labelledby="pattern-map-title"
        aria-modal="true"
        className="assessment-modal freedom-test-modal pattern-map-modal"
        onKeyDown={handleKeyDown}
        ref={modalRef}
        role="dialog"
      >
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">TEMP MEMORY ONLY</span>
            <h1 id="pattern-map-title" ref={headingRef} tabIndex={-1}>Coercive Control Pattern Map</h1>
            <p className="sr-only" id="pattern-map-description">An in-memory educational assessment. Answers are not saved.</p>
          </div>
          <div className="assessment-modal-actions">
            <button type="button" onClick={quickExit}>Quick Exit</button>
            <button aria-label="Close assessment" type="button" onClick={closeAssessment}>X</button>
          </div>
        </header>

        {phase === "intro" ? (
          <div className="assessment-modal-body freedom-test-intro">
            <h2>Map where control may be operating</h2>
            <p>Coercive control is not one argument or one bad habit. It is a pattern that narrows another person's freedom across daily life. This assessment maps where control may be operating and how concentrated it is. Answer for one current or former partner and think about the last 6-12 months, especially what happens when they are upset, jealous, challenged, told no, or losing access to you.</p>
            <section className="freedom-test-note">
              <h3>Use this only when it is safe</h3>
              <p>Internet use and devices can be monitored. Closing this assessment or using Quick Exit permanently clears your answers from this session.</p>
            </section>
            <section className="freedom-scale-summary">
              {patternMapScale.map((option) => (
                <article key={option.value}><strong>{option.value}</strong><span>{option.label}</span><p>{option.meaning}</p></article>
              ))}
            </section>
            <p>This is an educational pattern-recognition tool, not a diagnosis, legal finding, validated lethality instrument, or guarantee that a relationship is safe.</p>
            <div className="assessment-modal-nav">
              <button type="button" onClick={() => setPhase("scored")}>Start the pattern map</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}

        {phase === "scored" && currentScoredItem ? (
          <div className="assessment-modal-body">
            <div className="question-status" aria-live="polite"><span>Question {scoredIndex + 1} of 32</span><span>No saved answers</span></div>
            <h2>{currentScoredItem.prompt}</h2>
            <div className="freedom-response-list" role="radiogroup" aria-label="Choose one response">
              {patternMapScale.map((option) => (
                <button aria-checked={scoredAnswers[currentScoredItem.id] === option.value} className={scoredAnswers[currentScoredItem.id] === option.value ? "selected" : ""} key={option.value} role="radio" type="button" onClick={() => setScoredAnswers((current) => ({ ...current, [currentScoredItem.id]: option.value }))}>
                  <strong>{option.value}</strong><span>{option.label}</span><small>{option.meaning}</small>
                </button>
              ))}
            </div>
            <div className="assessment-modal-nav">
              <button type="button" onClick={goBackFromScored}>Back</button>
              <button disabled={!hasCurrentScore} type="button" onClick={goNextFromScored}>Next</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}

        {phase === "priorityIntro" ? (
          <div className="assessment-modal-body">
            <h2>Priority Pattern Check</h2>
            <p>You finished the pattern map. Next is a separate 12-item Priority Pattern Check. These answers do not change your score. They appear first on the results screen because some behaviors matter on their own, even when the total is low.</p>
            <div className="assessment-modal-nav">
              <button type="button" onClick={() => { setPhase("scored"); setScoredIndex(31); }}>Back</button>
              <button type="button" onClick={() => setPhase("priority")}>Continue to priority check</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}

        {phase === "priority" && currentPriorityItem ? (
          <div className="assessment-modal-body">
            <div className="question-status" aria-live="polite"><span>Priority check {priorityIndex + 1} of 12</span><span>Not scored</span></div>
            <h2>{currentPriorityItem.prompt}</h2>
            <div className="love-fear-flag-grid freedom-priority-grid" role="radiogroup" aria-label="Choose Yes, No, or Unsure">
              {(["yes", "no", "unsure"] as PatternMapPriorityAnswer[]).map((value) => (
                <button aria-checked={priorityAnswers[currentPriorityItem.id] === value} className={priorityAnswers[currentPriorityItem.id] === value ? "selected" : ""} key={value} role="radio" type="button" onClick={() => setPriorityAnswers((current) => ({ ...current, [currentPriorityItem.id]: value }))}>{value.toUpperCase()}</button>
              ))}
            </div>
            <div className="assessment-modal-nav">
              <button type="button" onClick={goBackFromPriority}>Back</button>
              <button disabled={!hasCurrentPriority} type="button" onClick={goNextFromPriority}>{priorityIndex === 11 ? "Show Results" : "Next"}</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}

        {phase === "results" ? (
          <div className="assessment-modal-body love-fear-results freedom-test-results pattern-map-results">
            <h2>Your Coercive Control Pattern Map</h2>
            <p>Your answers stay only in this open session.</p>

            {priorityYes.length ? <section className="love-fear-alert"><h3>Priority patterns you marked Yes</h3><ul>{priorityYes.map((item) => <li key={item.id}>{item.prompt}</li>)}</ul></section> : null}
            {priorityUnsure.length ? <section className="pattern-map-unsure"><h3>Priority patterns you marked Unsure</h3><p>Uncertainty still deserves attention; you do not need proof before asking for information.</p><ul>{priorityUnsure.map((item) => <li key={item.id}>{item.prompt}</li>)}</ul></section> : null}
            {!priorityYes.length && !priorityUnsure.length ? <p className="freedom-test-note">You did not mark any priority item Yes or Unsure. This does not certify safety or erase scored items that concern you.</p> : null}

            <section>
              <h3>Coercive Control Pattern Map</h3>
              <p><strong>{summaryPrefix}:</strong> {summaryDomains.map((id) => patternMapDomains[id].label).join(", ")}.</p>
              <p>The map matters more than the grand total.</p>
              <div className="pattern-map-domain-grid">
                {patternMapDomainOrder.map((domainId) => {
                  const score = subtotals[domainId];
                  return <article className={`pattern-map-domain state-${Math.min(3, Math.floor(score / 4))}`} key={domainId}>
                    <div><h4>{patternMapDomains[domainId].label}</h4><strong>{score} / 16</strong></div>
                    <div aria-hidden="true" className="pattern-map-bar"><span style={{ width: `${(score / 16) * 100}%` }} /></div>
                    <p><strong>{getPatternMapDomainState(score)}</strong></p>
                    {score >= 8 ? <p>{patternMapDomains[domainId].highText}</p> : null}
                  </article>;
                })}
              </div>
            </section>

            <section>
              <h3>Behaviors that are changing or organizing your choices</h3>
              {flaggedScored.length ? <ul>{flaggedScored.map((item) => { const score = scoredAnswers[item.id]; const scale = patternMapScale.find((option) => option.value === score); return <li key={item.id}><strong>{score} - {scale?.label} | {patternMapDomains[item.domainId].label}</strong><br />{item.prompt}</li>; })}</ul> : <p>No scored item was answered 3 or 4.</p>}
            </section>

            <section>
              <h3>{total} / 128 - {band.label}</h3>
              <p>These are editorial routing bands, not clinically validated cutoffs.</p>
              <p>{band.text}</p>
              <p><strong>A Yes or Unsure on the Priority Pattern Check, a score of 4 on any item, or fear of what may happen if you reduce contact, set a boundary, disclose the pattern, or leave deserves attention regardless of the total.</strong></p>
            </section>

            <footer className="love-fear-support-footer">
              <strong>SUPPORT IS INFORMATION, NOT A COMMAND</strong>
              <p>You do not have to decide what to call the relationship before asking for information. If you are in immediate danger in the United States, call 911. National Domestic Violence Hotline: 800-799-SAFE (7233) or text START to 88788. Use a safer device when possible.</p>
              <a href="/guides">Explore support resources</a>
            </footer>
            <div className="assessment-modal-nav">
              <button type="button" onClick={() => { setPhase("scored"); setScoredIndex(0); }}>Review answers</button>
              <button type="button" onClick={resetState}>Start over</button>
              <button type="button" onClick={closeAssessment}>Close</button>
              <button type="button" onClick={quickExit}>Quick Exit</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FreedomTestAssessmentModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<FreedomPhase>("intro");
  const [scoredIndex, setScoredIndex] = useState(0);
  const [priorityIndex, setPriorityIndex] = useState(0);
  const [scoredAnswers, setScoredAnswers] = useState<Record<number, FreedomScore>>({});
  const [priorityAnswers, setPriorityAnswers] = useState<Record<number, FreedomPriorityAnswer>>({});
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const modalRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const currentScoredItem = freedomScoredItems[scoredIndex];
  const currentPriorityItem = freedomPriorityItems[priorityIndex];
  const hasCurrentScore = currentScoredItem ? scoredAnswers[currentScoredItem.id] !== undefined : false;
  const hasCurrentPriority = currentPriorityItem ? priorityAnswers[currentPriorityItem.id] !== undefined : false;
  const partTotals = freedomPartLabels.map((_, partIndex) =>
    freedomScoredItems
      .filter((item) => item.partId === partIndex + 1)
      .reduce((sum, item) => sum + (scoredAnswers[item.id] ?? 0), 0),
  );
  const total = partTotals.reduce((sum, value) => sum + value, 0);
  const priorityFlags = freedomPriorityItems.filter((item) => {
    const answer = priorityAnswers[item.id];
    return answer === "yes" || answer === "unsure";
  });
  const scoredFlags = freedomScoredItems.filter((item) => (scoredAnswers[item.id] ?? 0) >= 3);
  const highPartIndexes = partTotals
    .map((value, index) => (value >= 9 ? index : -1))
    .filter((index) => index >= 0);
  const band = freedomBandText(total);

  function resetFreedomTestState() {
    setPhase("intro");
    setScoredIndex(0);
    setPriorityIndex(0);
    setScoredAnswers({});
    setPriorityAnswers({});
  }

  function closeAssessment() {
    resetFreedomTestState();
    previousFocusRef.current?.focus();
    onClose();
  }

  function quickExit() {
    resetFreedomTestState();
    onClose();
    leaveSite();
  }

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    headingRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [phase, scoredIndex, priorityIndex]);

  function handleModalKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAssessment();
      return;
    }

    if (event.key !== "Tab" || !modalRef.current) return;

    const focusable = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("aria-hidden"));

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function chooseScore(value: FreedomScore) {
    if (!currentScoredItem) return;
    setScoredAnswers((current) => ({ ...current, [currentScoredItem.id]: value }));
  }

  function choosePriority(value: FreedomPriorityAnswer) {
    if (!currentPriorityItem) return;
    setPriorityAnswers((current) => ({ ...current, [currentPriorityItem.id]: value }));
  }

  function backFromScored() {
    if (scoredIndex === 0) {
      setPhase("intro");
      return;
    }
    setScoredIndex((current) => current - 1);
  }

  function continueFromScored() {
    if (scoredIndex >= freedomScoredItems.length - 1) {
      setPhase("priorityIntro");
      return;
    }
    setScoredIndex((current) => current + 1);
  }

  function backFromPriority() {
    if (priorityIndex === 0) {
      setPhase("priorityIntro");
      return;
    }
    setPriorityIndex((current) => current - 1);
  }

  function continueFromPriority() {
    if (priorityIndex >= freedomPriorityItems.length - 1) {
      setPhase("results");
      return;
    }
    setPriorityIndex((current) => current + 1);
  }

  return (
    <div className="assessment-modal-backdrop" role="presentation">
      <section
        aria-describedby="freedom-test-description"
        aria-labelledby="freedom-test-title"
        aria-modal="true"
        className="assessment-modal freedom-test-modal"
        onKeyDown={handleModalKeyDown}
        ref={modalRef}
        role="dialog"
      >
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">TEMP MEMORY ONLY</span>
            <h1 id="freedom-test-title" ref={headingRef} tabIndex={-1}>
              The Freedom Test
            </h1>
            <p className="sr-only" id="freedom-test-description">
              The Freedom Test is an in-memory educational assessment. Answers are not saved.
            </p>
          </div>
          <div className="assessment-modal-actions">
            <button type="button" onClick={quickExit}>
              Quick Exit
            </button>
            <button aria-label="Close assessment" type="button" onClick={closeAssessment}>
              X
            </button>
          </div>
        </header>

        {phase === "intro" ? (
          <div className="assessment-modal-body freedom-test-intro">
            <h2>How much freedom do you actually have without retaliation?</h2>
            <p>
              This educational assessment looks at whether you remain free to speak, say no, move, connect, keep privacy, access resources, and make decisions when another person is upset or wants something. Think about the current or most recent relationship you are evaluating and what has happened over the last 6-12 months.
            </p>
            <section className="freedom-test-note">
              <h3>Your answers are not saved</h3>
              <p>
                Your answers stay only in this open assessment. Closing it, refreshing the page, or using Quick Exit permanently clears the session. There is no resume-later, download, email, export, or share function.
              </p>
            </section>
            <section className="freedom-scale-summary">
              {freedomScaleOptions.map((option) => (
                <article key={option.value}>
                  <strong>{option.value}</strong>
                  <span>{option.label}</span>
                  <p>{option.meaning}</p>
                </article>
              ))}
            </section>
            <p>
              This is an original Survivor Systems educational pattern-recognition tool. It is not a validated clinical screening instrument, legal finding, lethality assessment, or guarantee of safety.
            </p>
            <div className="assessment-modal-nav">
              <button type="button" onClick={() => setPhase("scored")}>
                Start Assessment
              </button>
              <button type="button" onClick={closeAssessment}>
                Close
              </button>
              <button type="button" onClick={quickExit}>
                Quick Exit
              </button>
            </div>
          </div>
        ) : null}

        {phase === "scored" && currentScoredItem ? (
          <div className="assessment-modal-body">
            <div className="question-status" aria-live="polite">
              <span>Question {scoredIndex + 1} of {freedomScoredItems.length}</span>
              <span>No saved answers</span>
            </div>
            <h2>{currentScoredItem.prompt}</h2>
            <div className="freedom-response-list" role="radiogroup" aria-label="Choose one answer">
              {freedomScaleOptions.map((option) => (
                <button
                  aria-checked={scoredAnswers[currentScoredItem.id] === option.value}
                  className={scoredAnswers[currentScoredItem.id] === option.value ? "selected" : ""}
                  key={option.value}
                  role="radio"
                  type="button"
                  onClick={() => chooseScore(option.value)}
                >
                  <strong>{option.value}</strong>
                  <span>{option.label}</span>
                  <small>{option.meaning}</small>
                </button>
              ))}
            </div>
            <div className="assessment-modal-nav">
              <button type="button" onClick={backFromScored}>
                Back
              </button>
              <button disabled={!hasCurrentScore} type="button" onClick={continueFromScored}>
                Continue
              </button>
              <button type="button" onClick={closeAssessment}>
                Close
              </button>
              <button type="button" onClick={quickExit}>
                Quick Exit
              </button>
            </div>
          </div>
        ) : null}

        {phase === "priorityIntro" ? (
          <div className="assessment-modal-body">
            <h2>Priority Pattern Check</h2>
            <p>
              The next 12 items describe behaviors that matter on their own. They are not added to your score. Choose Yes, No, or Unsure. One serious behavior can matter more than the overall number.
            </p>
            <p>
              A Yes or Unsure on the Priority Pattern Check, a score of 4 on any item, or fear of what may happen if the user leaves deserves attention regardless of the total.
            </p>
            <div className="assessment-modal-nav">
              <button
                type="button"
                onClick={() => {
                  setPhase("scored");
                  setScoredIndex(freedomScoredItems.length - 1);
                }}
              >
                Back
              </button>
              <button type="button" onClick={() => setPhase("priority")}>
                Continue
              </button>
              <button type="button" onClick={closeAssessment}>
                Close
              </button>
              <button type="button" onClick={quickExit}>
                Quick Exit
              </button>
            </div>
          </div>
        ) : null}

        {phase === "priority" && currentPriorityItem ? (
          <div className="assessment-modal-body">
            <div className="question-status" aria-live="polite">
              <span>Priority check {priorityIndex + 1} of {freedomPriorityItems.length}</span>
              <span>Not scored</span>
            </div>
            <h2>{currentPriorityItem.text}</h2>
            <div className="love-fear-flag-grid freedom-priority-grid">
              {(["yes", "no", "unsure"] as FreedomPriorityAnswer[]).map((value) => (
                <button
                  aria-pressed={priorityAnswers[currentPriorityItem.id] === value}
                  className={priorityAnswers[currentPriorityItem.id] === value ? "selected" : ""}
                  key={value}
                  type="button"
                  onClick={() => choosePriority(value)}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="assessment-modal-nav">
              <button type="button" onClick={backFromPriority}>
                Back
              </button>
              <button disabled={!hasCurrentPriority} type="button" onClick={continueFromPriority}>
                Continue
              </button>
              <button type="button" onClick={closeAssessment}>
                Close
              </button>
              <button type="button" onClick={quickExit}>
                Quick Exit
              </button>
            </div>
          </div>
        ) : null}

        {phase === "results" ? (
          <div className="assessment-modal-body love-fear-results freedom-test-results">
            <h2>Results</h2>
            {priorityFlags.length > 0 ? (
              <section className="love-fear-alert">
                <h3>Priority Pattern Flags</h3>
                <p>
                  These behaviors matter on their own. Your total score does not reduce their importance. Consider talking with a trained domestic violence advocate from a safer device.
                </p>
                <ul>
                  {priorityFlags.map((item) => (
                    <li key={item.id}>
                      <strong>{priorityAnswers[item.id]?.toUpperCase()}:</strong> {item.text}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h3>Six Part Subtotals</h3>
              <div className="love-fear-subtotals">
                {freedomPartLabels.map((part, index) => (
                  <article key={part}>
                    <span>Part {index + 1}</span>
                    <strong>{partTotals[index]} / 16</strong>
                    <p>{part}</p>
                    {partTotals[index] >= 13 ? <em>Strong concentration.</em> : null}
                  </article>
                ))}
              </div>
              {highPartIndexes.length > 0 ? (
                <ul>
                  {highPartIndexes.map((index) => (
                    <li key={index}>
                      <strong>{freedomPartLabels[index]}:</strong> {freedomPartInterpretations[index]}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section>
              <h3>Flagged Scored Items</h3>
              {scoredFlags.length > 0 ? (
                <ul>
                  {scoredFlags.map((item) => (
                    <li key={item.id}>
                      <strong>
                        {item.resultLabel} - {scoredAnswers[item.id]}
                      </strong>
                      : {item.prompt}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No scored items were answered 3 or 4.</p>
              )}
            </section>

            <section>
              <h3>{band.label}</h3>
              <p>Total score: {total} / 96</p>
              <p>{band.text}</p>
              <p>
                A Yes or Unsure on the Priority Pattern Check, a score of 4 on any item, or fear of what may happen if the user leaves deserves attention regardless of the total.
              </p>
            </section>

            <footer className="love-fear-support-footer">
              <strong>SUPPORT</strong>
              <p>
                Immediate danger: call 911. National Domestic Violence Hotline: 800-799-SAFE (7233) or text START to 88788. Use a safer device when possible. This assessment is educational and cannot determine whether a relationship is safe.
              </p>
            </footer>

            <div className="assessment-modal-nav">
              <button type="button" onClick={closeAssessment}>
                Close
              </button>
              <button type="button" onClick={quickExit}>
                Quick Exit
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function LoveFearAssessmentModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<"intro" | "scored" | "flags" | "results">("intro");
  const [scoredIndex, setScoredIndex] = useState(0);
  const [flagIndex, setFlagIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Record<number, LoveFearFlagAnswer>>({});

  const currentScoredItem = loveFearScoredItems[scoredIndex];
  const currentFlagItem = loveFearFlagItems[flagIndex];
  const hasCurrentScore = currentScoredItem ? scores[currentScoredItem.id] !== undefined : false;
  const hasCurrentFlag = currentFlagItem ? flags[currentFlagItem.id] !== undefined : false;
  const partTotals = loveFearParts.map((_, partIndex) =>
    loveFearScoredItems
      .filter((item) => item.part === partIndex + 1)
      .reduce((sum, item) => sum + (scores[item.id] ?? 0), 0),
  );
  const total = partTotals.reduce((sum, value) => sum + value, 0);
  const highestPartTotal = Math.max(...partTotals);
  const highestPartIndexes = partTotals
    .map((value, index) => (value === highestPartTotal ? index : -1))
    .filter((index) => index >= 0);
  const highPartIndexes = partTotals
    .map((value, index) => (value >= 12 ? index : -1))
    .filter((index) => index >= 0);
  const flaggedItems = loveFearFlagItems.filter((item) => {
    const answer = flags[item.id];
    return answer === "yes" || answer === "unsure";
  });
  const highScoredItems = loveFearScoredItems.filter((item) => (scores[item.id] ?? 0) >= 3);
  const band = getLoveFearBand(total);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function closeAndExit() {
    onClose();
    leaveSite();
  }

  function chooseScore(value: number) {
    if (!currentScoredItem) return;
    setScores((current) => ({ ...current, [currentScoredItem.id]: value }));
  }

  function chooseFlag(value: LoveFearFlagAnswer) {
    if (!currentFlagItem) return;
    setFlags((current) => ({ ...current, [currentFlagItem.id]: value }));
  }

  function goToNextScore() {
    if (scoredIndex >= loveFearScoredItems.length - 1) {
      setPhase("flags");
      return;
    }
    setScoredIndex((current) => current + 1);
  }

  function goToNextFlag() {
    if (flagIndex >= loveFearFlagItems.length - 1) {
      setPhase("results");
      return;
    }
    setFlagIndex((current) => current + 1);
  }

  return (
    <div className="assessment-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="love-fear-modal-title"
        aria-modal="true"
        className="assessment-modal love-fear-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">TEMP MEMORY ONLY</span>
            <h1 id="love-fear-modal-title">Is It Love Or Fear?</h1>
          </div>
          <div className="assessment-modal-actions">
            <button type="button" onClick={closeAndExit}>
              Quick Exit
            </button>
            <button aria-label="Close assessment" type="button" onClick={onClose}>
              X
            </button>
          </div>
        </header>

        {phase === "intro" ? (
          <div className="assessment-modal-body love-fear-intro">
            <p>
              An educational tool for noticing whether your relationship is organized around freedom,
              equality and safety - or around fear, appeasement and control.
            </p>
            <p>
              This assessment is not a diagnosis, a legal finding, a lethality assessment or a guarantee that a
              relationship is safe. It is an educational pattern-recognition tool. A low total score never cancels one
              serious behavior.
            </p>
            <p>
              All answers stay in this browser tab only while this modal is open. Closing this window starts it over next time.
            </p>
            <div className="terminal-actions compact-actions">
              <button type="button" onClick={() => setPhase("scored")}>
                Begin
              </button>
              <button type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : null}

        {phase === "scored" && currentScoredItem ? (
          <div className="assessment-modal-body">
            <div className="question-status">
              <span>Question {scoredIndex + 1} of {loveFearScoredItems.length}</span>
              <span>No saved answers</span>
            </div>
            <h2>{currentScoredItem.title}</h2>
            <div className="love-fear-pair">
              <article>
                <span>0 = LOVE / FREEDOM</span>
                <p>{currentScoredItem.left}</p>
              </article>
              <article>
                <span>4 = FEAR / CONTROL</span>
                <p>{currentScoredItem.right}</p>
              </article>
            </div>
            <fieldset className="love-fear-scale">
              <legend>Which is closer?</legend>
              {[0, 1, 2, 3, 4].map((value) => (
                <label className={scores[currentScoredItem.id] === value ? "selected" : ""} key={value}>
                  <input
                    checked={scores[currentScoredItem.id] === value}
                    name={`score-${currentScoredItem.id}`}
                    onChange={() => chooseScore(value)}
                    type="radio"
                    value={value}
                  />
                  <span>{value}</span>
                  <small>{value === 0 ? "Fully left" : value === 2 ? "Mixed / unsure" : value === 4 ? "Fully right" : value === 1 ? "Mostly left" : "Mostly right"}</small>
                </label>
              ))}
            </fieldset>
            <div className="assessment-modal-nav">
              <button disabled={scoredIndex === 0} type="button" onClick={() => setScoredIndex((current) => Math.max(0, current - 1))}>
                Back
              </button>
              <button disabled={!hasCurrentScore} type="button" onClick={goToNextScore}>
                {scoredIndex >= loveFearScoredItems.length - 1 ? "Priority Check" : "Next"}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "flags" && currentFlagItem ? (
          <div className="assessment-modal-body">
            <div className="question-status">
              <span>Question {flagIndex + 1} of {loveFearFlagItems.length}</span>
              <span>Priority pattern check</span>
            </div>
            <h2>{currentFlagItem.text}</h2>
            <div className="love-fear-flag-grid">
              {(["yes", "no", "unsure"] as LoveFearFlagAnswer[]).map((value) => (
                <button
                  className={flags[currentFlagItem.id] === value ? "selected" : ""}
                  key={value}
                  type="button"
                  onClick={() => chooseFlag(value)}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="assessment-modal-nav">
              <button
                type="button"
                onClick={() => {
                  if (flagIndex === 0) {
                    setPhase("scored");
                    setScoredIndex(loveFearScoredItems.length - 1);
                    return;
                  }
                  setFlagIndex((current) => Math.max(0, current - 1));
                }}
              >
                Back
              </button>
              <button disabled={!hasCurrentFlag} type="button" onClick={goToNextFlag}>
                {flagIndex >= loveFearFlagItems.length - 1 ? "Show Results" : "Next"}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "results" ? (
          <div className="assessment-modal-body love-fear-results">
            {flaggedItems.length > 0 ? (
              <section className="love-fear-alert">
                <h2>Priority Pattern Flags</h2>
                <ul>
                  {flaggedItems.map((item) => (
                    <li key={item.id}>
                      <strong>{flags[item.id]?.toUpperCase()}:</strong> {item.text}
                    </li>
                  ))}
                </ul>
                <p>
                  A Yes or Unsure on the Priority Pattern Check, a score of 4 on any item, or fear of what may happen if you leave deserves attention regardless of your total.
                </p>
              </section>
            ) : null}

            <section>
              <h2>Six Part Subtotals</h2>
              <div className="love-fear-subtotals">
                {loveFearParts.map((part, index) => (
                  <article key={part}>
                    <span>Part {index + 1}</span>
                    <strong>{partTotals[index]} / 16</strong>
                    <p>{part}</p>
                  </article>
                ))}
              </div>
              <p>
                The highest section subtotal may be more useful than the grand total. It shows where your freedom is being narrowed most.
              </p>
              <p>
                Highest part: {highestPartIndexes.map((index) => `Part ${index + 1} - ${loveFearParts[index]}`).join("; ")}.
              </p>
              {highPartIndexes.length > 0 ? (
                <ul>
                  {highPartIndexes.map((index) => (
                    <li key={index}>{loveFearHighPartText[index]}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section>
              <h2>Look Past The Total</h2>
              <p>
                Circle every individual item scored 3 or 4. These show where fear or control is concentrated. Review the Priority Pattern Check separately.
              </p>
              {highScoredItems.length > 0 ? (
                <ul>
                  {highScoredItems.map((item) => (
                    <li key={item.id}>
                      Item {item.id}: {item.title} - scored {scores[item.id]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No individual items scored 3 or 4.</p>
              )}
            </section>

            <section>
              <h2>{band.label}</h2>
              <p>Total score: {total} / 96</p>
              <p>{band.text}</p>
              <p>
                A Yes or Unsure on the Priority Pattern Check, a score of 4 on any item, or fear of what may happen if you leave deserves attention regardless of your total.
              </p>
              <p>
                The core distinction is not whether the relationship contains love. People can feel love inside harmful systems. The question is whether love is being used to protect your freedom - or invoked while your freedom is being taken.
              </p>
            </section>

            <footer className="love-fear-support-footer">
              <strong>U.S. SUPPORT</strong>
              <p>
                National Domestic Violence Hotline: 800-799-SAFE (7233) | Text START to 88788 | Call 911 for immediate danger.
              </p>
              <p>Internet and device activity can be monitored.</p>
            </footer>

            <div className="assessment-modal-nav">
              <button type="button" onClick={onClose}>
                Close
              </button>
              <button type="button" onClick={closeAndExit}>
                Quick Exit
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
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

  function openCrisisSupport() {
    onNavigate("planning", "/crisis-support");
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
          <h1 id="assessment-title">WAS I CRAZY?</h1>
          <p>
            Confusion is one of the telltale signs of coercive control. People who want control
            benefit when you are too busy questioning yourself to question what happened.
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
            skipLabel="Skip Typing"
            text={`SYSTEM:\n${activeResponse.response}`}
          />
          {responseDone && (
            <ProceedControls
              onDeny={showDenial}
              onExit={clearAndExit}
              onNext={loadNextQuestion}
              onCrisisSupport={openCrisisSupport}
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
            <button type="button" onClick={openCrisisSupport}>
              Crisis Support
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
            <button type="button" onClick={openCrisisSupport}>
              Crisis Support
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/resources")}>
              Understand Choices
            </button>
            <button type="button" onClick={() => onNavigate("rebuilding", "/rebuilding")}>
              Rebuilding Tools
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
  onCrisisSupport,
}: {
  onDeny: () => void;
  onExit: () => void;
  onNext: () => void;
  onCrisisSupport: () => void;
}) {
  return (
    <div className="proceed-terminal">
      <div className="terminal-label">HOW WOULD YOU LIKE TO PROCEED?</div>
      <div className="terminal-actions denial-actions">
        <button type="button" onClick={onCrisisSupport}>
          Crisis Support
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

function PlanningLanding({
  onNavigate,
}: {
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return (
    <section className="assessment-shell planning-landing" aria-labelledby="planning-landing-title">
      <div className="assessment-panel planning-landing-panel">
        <div className="terminal-label">LOAD MODULE // CRISIS SUPPORT</div>
        <h1 id="planning-landing-title">Crisis Support</h1>
        <p>
          Survivor Operating System is not an emergency service and does not guide active escape
          planning. If someone is still in danger or currently trying to get out, this system should
          route them toward direct human support instead.
        </p>

        <div className="planning-document-grid" aria-label="Crisis support options">
          <a className="planning-document-key" href="https://www.thehotline.org/" rel="noreferrer" target="_blank">
            <strong>NHDV Hotline</strong>
            <small>thehotline.org</small>
          </a>
          <a className="planning-document-key" href="sms:88788?body=START">
            <strong>Text START</strong>
            <small>88788</small>
          </a>
          <a className="planning-document-key" href="tel:18007997233">
            <strong>Call Hotline</strong>
            <small>1.800.799.7233</small>
          </a>
          <button className="planning-document-key" type="button" onClick={() => onNavigate("legal", "/resources")}>
            <strong>Legal / Local Resources</strong>
            <small>resource folder</small>
          </button>
          <button className="planning-document-key" type="button" onClick={() => onNavigate("rebuilding", "/rebuilding")}>
            <strong>Rebuilding Tools</strong>
            <small>when safe enough</small>
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
          <h1 id="planning-resource-title">{resource.title}</h1>
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
  onNavigate,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return <PlanningLanding onNavigate={onNavigate} />;
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
          <h1 id="snap-tanf-title">How To Navigate SNAP &amp; TANF</h1>
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
            <h2>{section.title}</h2>
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
        <h2 id="snap-navigation-system-title">When One Application Turns Into Six</h2>
        <p>
          SNAP and TANF may only cover part of what is needed. Childcare, transportation, housing,
          utility assistance, emergency financial help, and local services can each bring their own
          forms, deadlines, calls, and document requests.
        </p>
        <p>
          The Database holds the deeper Resource Navigation System: trackers for
          applications, case numbers, worker information, documents, deadlines, phone-call notes,
          local resources, and what to work on next.
        </p>
        <div className="terminal-actions denial-actions">
          <button type="button" onClick={() => onNavigate("library", "/resources")}>
            View Database
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
          <h1 id={`${guide.id}-title`}>{guide.title}</h1>
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
            <h2>{section.title}</h2>
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
          <h2 id={`${guide.id}-system-note`}>{guide.systemNote.title}</h2>
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

const compensationClauses = [
  ["Qualifying Crime", "The state decides which crimes qualify. Domestic or family violence, assault, sexual violence, child abuse, homicide, stalking under qualifying rules, trafficking, robbery involving injury, impaired driving, kidnapping, and other violent crimes may be covered.", "What exact compensable-crime category applies to this claim?"],
  ["Injury Or Death", "Programs may require physical injury, psychological injury, death, or another state-defined harm, plus documentation connecting treatment or loss to the crime.", "Does this state recognize psychological injury without physical injury, and what documentation establishes it?"],
  ["Crime Location & Residency", "The state where the crime occurred usually handles the claim, even when the victim lives elsewhere. Other provisions may cover out-of-state or overseas crimes.", "Which state has jurisdiction, and is there a nonresident or out-of-state-victim provision?"],
  ["Reporting", "A report may be required within a set period, but qualifying reports and good-cause exceptions vary. An arrest or prosecution is not always required.", "What counts as a qualifying report, what is the deadline, and what safety or good-cause exceptions apply?"],
  ["Filing Deadline", "The filing period may run from the crime, discovery, death, report, or another event. Extensions can exist. Filing early may preserve the claim while documents remain pending.", "What starts the deadline, and how can I request an extension or preserve the claim?"],
  ["Cooperation", "Programs commonly require reasonable cooperation, but that does not necessarily mean causing an arrest, agreeing with every prosecution decision, or ignoring safety concerns.", "How is reasonable cooperation defined, who decides it, and what safety exceptions apply?"],
  ["Causation", "The expense must be connected to the crime through dates, bills, records, provider statements, wage verification, reports, court records, or relocation documentation.", "What documentation is required to connect this expense to the crime?"],
  ["Payer Of Last Resort", "Insurance, public benefits, workers' compensation, paid leave, restitution, settlements, or other sources may be considered before compensation pays the remaining eligible loss.", "Which other payment sources must I pursue, which can be waived, and how will each affect this claim?"],
  ["Out-Of-Pocket Loss", "Programs generally pay actual documented losses, not the general value of suffering. Some can pay an approved provider directly when a bill is unpaid.", "Can the provider be paid directly, and what should the provider submit?"],
  ["Caps & Rate Limits", "A total claim cap and separate limits for counseling, relocation, wages, funeral costs, transportation, treatment, or provider rates may apply.", "What are the total cap, category limits, rates, and remaining balance?"],
  ["Contributory Conduct", "Some states may reduce an award based on alleged conduct. A relationship with the offender, returning, delayed reporting, substance use, or cohabitation should not automatically be treated as causing violence.", "What specific conduct is alleged, what evidence supports that finding, and what domestic-violence exceptions apply?"],
  ["Unjust Enrichment", "Payment may be structured when an award could benefit the offender through shared property, debts, accounts, insurance, or household expenses.", "Can payment go directly to the provider or be structured so the offender does not benefit?"],
  ["Documentation & Verification", "Claims can require identity documents, reports, bills, records, insurance statements, wage verification, leases, receipts, dependency records, releases, and safe contact information.", "What will be collected, who can receive it, and may I use a safe address?"],
  ["Restitution, Subrogation & Repayment", "If compensation pays first and another source later pays the same loss, the program may seek reimbursement. Changes and later recoveries may need to be reported.", "What later payments must I report, and what portion could the program recover?"],
  ["Appeal & Reconsideration", "A denial or reduction may be reviewable, but deadlines can be short. The written notice should identify the reason and procedure.", "What is the appeal deadline, where must it be filed, can I add evidence, and can an advocate or attorney help?"],
] as const;

const compensationApplicationQuestions = [
  "Is this reimbursement-only, or can the program pay providers directly?",
  "Is emergency, advance, or expedited assistance available?",
  "Which crime, injury, report, cooperation, and filing rules control the claim?",
  "Which exceptions apply to domestic violence, trauma, children, disability, threats, or good cause?",
  "What are the total cap and the limits for each expense category?",
  "Which insurance, benefits, restitution, or other sources must be used first?",
  "May the claim be filed now and supplemented with bills later?",
  "How long can the claim remain open, and who receives payment?",
  "How will the claimant's address and records be protected?",
  "What is the appeal deadline and required filing method?",
];

function CrimeVictimCompensationGuide({ onBack }: { onBack: () => void }) {
  return (
    <section className="page-shell how-to-guide-page compensation-guide" aria-labelledby="compensation-guide-title">
      <PageFlourishHeader
        eyebrow="Legal // Criminal // Know the clauses"
        title="Understanding Crime Victim Compensation"
        titleId="compensation-guide-title"
        variant="legal"
      >
        <p>What it may pay, what controls a claim, and why it is rarely immediate cash.</p>
      </PageFlourishHeader>

      <section className="how-to-system-note">
        <h2>The Most Important Truth First</h2>
        <p><strong>Compensation is usually reimbursement, not immediate escape money.</strong></p>
        <p>
          State programs may reimburse an eligible claimant, pay an approved provider directly, or cover
          continuing documented expenses after insurance and other payment sources are considered. They
          generally do not provide instant unrestricted cash or pay every loss caused by a crime.
        </p>
        <p>
          Each state controls its deadlines, eligible crimes, covered expenses, caps, documentation, and
          exceptions. This guide is educational, not legal advice or a promise of eligibility or payment.
        </p>
      </section>

      <section className="housing-options-master-script compensation-distinction">
        <p className="terminal-label">COMPENSATION IS NOT VICTIM ASSISTANCE</p>
        <h2>If money is needed now, ask separately.</h2>
        <p>
          A victim advocate may know about emergency lodging, flexible survivor funds, VOCA-funded direct
          assistance, relocation support, TANF emergency assistance, Community Action funds, rapid rehousing,
          food, transportation, phones, locks, storage, or document replacement.
        </p>
      </section>

      <section className="how-to-system-note">
        <h2>How The System Generally Works</h2>
        <ol>
          <li>A state-defined qualifying crime occurs and is reported or otherwise documented.</li>
          <li>An eligible claimant applies before the deadline.</li>
          <li>The program investigates eligibility and requests supporting records.</li>
          <li>Insurance and other payment sources are calculated.</li>
          <li>Covered losses are approved within total and category limits.</li>
          <li>Payment goes to the claimant or provider; later eligible bills may be added while the claim remains open.</li>
        </ol>
      </section>

      <div className="housing-options-pathways" aria-label="Clauses that may control a compensation claim">
        {compensationClauses.map(([title, summary, question], index) => (
          <details className="housing-option-pathway" key={title}>
            <summary><span>{String(index + 1).padStart(2, "0")}</span>{title}</summary>
            <div>
              <p>{summary}</p>
              <div className="phrase-bank"><div className="terminal-label">ASK SPECIFICALLY</div><code>{question}</code></div>
            </div>
          </details>
        ))}
      </div>

      <section className="compensation-coverage-grid" aria-label="Typical compensation coverage">
        <article className="how-to-system-note">
          <h2>Commonly Covered</h2>
          <ul>
            <li>Crime-related medical, hospital, dental, counseling, rehabilitation, or equipment costs</li>
            <li>Lost wages, funeral and burial costs, or qualifying loss of support</li>
            <li>In some states: relocation, lodging, locks, transportation, childcare, cleanup, or disability modifications</li>
          </ul>
        </article>
        <article className="how-to-system-note">
          <h2>Usually Not Covered</h2>
          <ul>
            <li>Pain and suffering, punitive damages, or unrestricted hardship payments</li>
            <li>Most stolen property, property damage, or ordinary living expenses</li>
            <li>Expenses already fully paid elsewhere, undocumented losses, or costs above program limits</li>
          </ul>
        </article>
      </section>

      <section className="how-to-system-note">
        <h2>Build The Claim Before The Paperwork Builds A Graveyard</h2>
        <p>File early when safely possible, even if the investigation, treatment, insurance process, or legal case is incomplete. Ask how to supplement the claim later.</p>
        <p>Keep the application, confirmation, claim number, bills, receipts, estimates, insurance statements, wage records, relocation costs, reports, court records, information requests, decisions, and appeal notices. Track what was sent, when, how, and to whom. Never send the only copy of an irreplaceable document.</p>
      </section>

      <section className="housing-options-master-script">
        <p className="terminal-label">WHEN A CLAIM IS DELAYED</p>
        <blockquote>
          Please identify every item still needed, who must provide it, when it was requested, whether the
          program can request it directly, and whether any undisputed part of the claim can be decided or paid
          while the remainder is pending.
        </blockquote>
        <h2>Questions That Prevent Ugly Surprises</h2>
        <ul>{compensationApplicationQuestions.map((question) => <li key={question}>{question}</li>)}</ul>
      </section>

      <section className="how-to-system-note">
        <h2>If The Claim Is Denied Or Reduced</h2>
        <ol>
          <li>Get the written decision and the law or policy it relies on.</li>
          <li>Calendar the appeal deadline immediately and request the claim file when permitted.</li>
          <li>Identify the exact issue: eligibility, documentation, causation, caps, other payment sources, alleged conduct, or lateness.</li>
          <li>Gather evidence addressing that reason and ask a victim advocate or civil legal-aid program for help.</li>
          <li>File using the required method and keep proof of delivery.</li>
        </ol>
      </section>

      <section className="housing-options-master-script">
        <p className="terminal-label">FIND THE CORRECT STATE PROGRAM</p>
        <p>Start with the U.S. Department of Justice Office for Victims of Crime state directory at OVC.OJP.gov/Help-for-Victims/Help-in-Your-State. The state where the crime occurred is usually the first program to contact.</p>
        <p>VictimConnect Resource Center: call or text 855-484-2846 or visit VictimConnect.org.</p>
        <p><strong>The useful question is not only “Do I qualify?”</strong> Ask which expenses qualify, under which clause, after which other payment sources, with what documentation, under what cap, paid to whom, and when. That question makes the machinery show its gears.</p>
      </section>

      <div className="terminal-actions denial-actions">
        <button type="button" onClick={onBack}>Back To Legal Resources</button>
        <button type="button" onClick={leaveSite}>Quick Exit</button>
      </div>
    </section>
  );
}

const housingOptionPathways = [
  {
    title: "Coordinated Entry & Continuum of Care",
    summary: "A local assessment and referral system that may connect survivors to rapid rehousing, transitional housing, permanent supportive housing, deposits, rent, utilities, moving costs, and housing navigation.",
    ask: "I am fleeing domestic violence and need a Coordinated Entry assessment for every available housing intervention, not only emergency shelter. Who is the access point?",
  },
  {
    title: "Rapid Rehousing & Survivor-Specific Projects",
    summary: "Programs may help locate an ordinary rental and cover deposits, short- or medium-term rent, landlord outreach, and voluntary support. These are separate from Section 8 waitlists.",
    ask: "Does the Continuum of Care have a DV Bonus, survivor rapid-rehousing, joint transitional-housing/rapid-rehousing, or landlord-incentive project?",
  },
  {
    title: "VAWA Housing Rights & Emergency Transfers",
    summary: "Some federally assisted housing programs must provide survivor protections involving emergency transfers, confidentiality, abuse-related lease problems, and certain voucher moves.",
    ask: "Is my housing covered by VAWA? I need the rights notice, emergency-transfer plan, and confidential request procedure.",
  },
  {
    title: "Housing Choice Voucher Portability",
    summary: "A current Housing Choice Voucher may sometimes move to another housing authority, including another county or state. Get accurate instructions before ending existing assistance.",
    ask: "How do I port my voucher, can the process be expedited for safety, and how will my address and contact information be protected?",
  },
  {
    title: "Crime-Victim Compensation",
    summary: "State programs may cover eligible relocation, lodging, locks, transportation, lost wages, counseling, or other crime-related expenses. Rules and deadlines vary by state.",
    ask: "Does this state's program cover relocation, temporary lodging, security, transportation, or lost wages, and what reporting or documentation rules apply?",
  },
  {
    title: "VOCA & Flexible Survivor Assistance",
    summary: "Local victim-service organizations may have flexible funds for rent, deposits, hotels, moving, storage, utilities, phones, transportation, locks, or household essentials.",
    ask: "Do you have VOCA assistance, flexible survivor funds, emergency relocation funds, or donated funds for housing-related expenses?",
  },
  {
    title: "Emergency Solutions Grant Programs",
    summary: "Locally administered ESG programs can include homelessness prevention, shelter, rapid rehousing, rent arrears, deposits, moving expenses, and housing stabilization.",
    ask: "Who administers ESG prevention and rapid-rehousing funds here, and can a survivor be screened before becoming literally homeless?",
  },
  {
    title: "TANF Diversion & Emergency Assistance",
    summary: "Households with children may be eligible for one-time diversion, crisis assistance, rent, deposits, utilities, transportation, childcare, or family-violence waivers.",
    ask: "Does this state offer TANF diversion, crisis assistance, relocation help, or a family-violence option in addition to ongoing benefits?",
  },
  {
    title: "Community Action Agencies",
    summary: "Regional agencies may administer rent, deposits, utilities, motel vouchers, transportation, homelessness prevention, housing counseling, and local charitable funds.",
    ask: "Which Community Action Agency covers this county, what is open today, and what funding reopens later?",
  },
  {
    title: "Civil Legal Aid For Housing",
    summary: "Legal advocacy may help enforce VAWA rights, prevent eviction, address a lease, protect rental assistance, challenge denials, or resolve abuse-related debt and utility problems.",
    ask: "I need civil legal help with the housing consequences of domestic violence, including my lease, eviction risk, rental assistance, and VAWA rights.",
  },
  {
    title: "McKinney-Vento School Support",
    summary: "Children staying in shelters, motels, vehicles, transitional programs, or temporarily with others may qualify for enrollment, school-of-origin transportation, meals, and referrals.",
    ask: "Who is the district's McKinney-Vento liaison? We need an eligibility determination, school-stability help, transportation, and housing referrals.",
  },
  {
    title: "Veteran Housing Programs",
    summary: "Veterans facing homelessness may qualify for SSVF prevention or rapid rehousing, HUD-VASH, temporary housing, case management, or benefit navigation.",
    ask: "Screen me for SSVF, HUD-VASH, temporary housing, and other VA homeless programs. The Homeless Veterans line is 877-424-3838.",
  },
  {
    title: "USDA Rural Development Housing",
    summary: "Rural Development multifamily properties may have rental assistance or waitlists that differ from local public housing. These are generally longer-term options.",
    ask: "Where are the USDA Rural Development multifamily and rental-assistance properties in this region, and which accept applications?",
  },
  {
    title: "Permanent Supportive Housing",
    summary: "A person with a qualifying disability and history of homelessness may be assessed for long-term rental assistance with voluntary services. Eligibility and availability are limited.",
    ask: "Can Coordinated Entry assess me for permanent supportive housing, and what homelessness and disability documentation is required?",
  },
  {
    title: "Transitional Apartments",
    summary: "Some survivor organizations operate confidential apartments or scattered-site housing away from an emergency shelter, sometimes without requiring a shelter stay first.",
    ask: "Do you offer transitional or scattered-site apartments, can I apply without entering shelter, and which nearby programs offer the same model?",
  },
];

const housingProgramQuestions = [
  "What exact program am I being screened for?",
  "Does fleeing domestic violence meet its homelessness or priority definition?",
  "Must I stay in a shelter before applying, and can I apply from another county or state?",
  "Is there a waitlist, lottery, prioritization process, or next funding date?",
  "Which costs can be paid: deposits, rent, arrears, utilities, moving, storage, lodging, transportation, fees, or furnishings?",
  "What documents are required, and can survivor self-certification be accepted?",
  "How will you contact me, protect my location, and store or share my information?",
  "What happens if the abusive person is on the lease, account, title, voucher, or application?",
  "If this program cannot help, who performs the full housing assessment for this area?",
];

function HousingOptionsGuide({ onBack }: { onBack: () => void }) {
  return (
    <section className="page-shell how-to-guide-page housing-options-guide" aria-labelledby="housing-options-title">
      <PageFlourishHeader
        eyebrow="Housing // Find the door that is actually open"
        title="Housing Options"
        titleId="housing-options-title"
        variant="resources"
      >
        <p>Less-obvious housing resources for survivors rebuilding after domestic violence.</p>
      </PageFlourishHeader>

      <section className="how-to-system-note">
        <h2>Emergency shelter is one option, not the entire housing system.</h2>
        <p>
          Housing may also involve homelessness-response programs, rental assistance, emergency transfers,
          relocation funding, legal protections, veteran services, rural housing, or school-based support.
          Programs, openings, funding, and eligibility vary by location; inclusion here is not a guarantee of placement.
        </p>
        <p>
          Applications can create calls, texts, mail, account alerts, and document requests. Ask each agency to use
          a safe name, number, email address, or mailing address when needed.
        </p>
      </section>

      <section className="housing-options-master-script" aria-labelledby="housing-start-title">
        <p className="terminal-label">START HERE // ASK FOR THE WHOLE SYSTEM</p>
        <h2 id="housing-start-title">Do not stop at “Do you have shelter beds?”</h2>
        <blockquote>
          I am fleeing domestic violence and do not have safe housing available to me. I need a Coordinated
          Entry assessment and information about every available housing intervention, not only emergency
          shelter. Please check rapid rehousing, survivor-specific projects, transitional housing, homelessness
          prevention, emergency lodging, deposits, rental assistance, and housing navigation. If your agency
          does not perform that assessment, who is the access point that does?
        </blockquote>
        <p>Dial 211, use HUD Find Shelter, contact a local domestic-violence program, or ask which regional Continuum of Care covers the county.</p>
      </section>

      <div className="housing-options-pathways" aria-label="Housing pathways">
        {housingOptionPathways.map((pathway, index) => (
          <details className="housing-option-pathway" key={pathway.title}>
            <summary><span>{String(index + 1).padStart(2, "0")}</span>{pathway.title}</summary>
            <div>
              <p>{pathway.summary}</p>
              <div className="phrase-bank"><div className="terminal-label">ASK SPECIFICALLY</div><code>{pathway.ask}</code></div>
            </div>
          </details>
        ))}
      </div>

      <section className="how-to-system-note">
        <h2>Questions To Ask Every Program</h2>
        <ul>{housingProgramQuestions.map((question) => <li key={question}>{question}</li>)}</ul>
      </section>

      <section className="housing-options-master-script">
        <p className="terminal-label">ONE-CALL MASTER SCRIPT</p>
        <blockquote>
          I cannot safely remain in or return to my housing. Screen me for every available housing intervention,
          not only emergency shelter: Coordinated Entry, rapid rehousing, survivor projects, transitional housing,
          prevention funds, relocation assistance, victim compensation, lodging, housing preferences, voucher
          portability, and VAWA transfer rights. How will my location and contact information be protected?
        </blockquote>
        <h2>National Starting Points</h2>
        <ul>
          <li>Emergency danger: call 911 if doing so is safe.</li>
          <li>National Domestic Violence Hotline: 800-799-SAFE (7233), text START to 88788, or TheHotline.org.</li>
          <li>Local referrals: dial 211 and ask for Coordinated Entry.</li>
          <li>HUD shelter and provider search: HUD.gov/FindShelter.</li>
          <li>Civil legal aid: LSC.gov and select Get Legal Help.</li>
          <li>Homeless Veterans: 877-424-3838.</li>
        </ul>
        <p><strong>“No shelter beds” does not mean “no housing resources.”</strong> Ask for the program name, eligibility decision, next access point, and full assessment. Bureaucracies love vague dead ends. Make them use nouns.</p>
      </section>

      <div className="terminal-actions denial-actions">
        <button type="button" onClick={onBack}>Back To Housing Resources</button>
        <button type="button" onClick={leaveSite}>Quick Exit</button>
      </div>
    </section>
  );
}

function HowToModule({
  initialGuideId = null,
  initialPriority = null,
  onBackToResources,
  onNavigate,
}: {
  initialGuideId?: string | null;
  initialPriority?: HowToGuide["priority"] | null;
  onBackToResources?: () => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [activeGuideId, setActiveGuideId] = useState<string | null>(initialGuideId);
  const [activePriorityId, setActivePriorityId] = useState<HowToGuide["priority"] | null>(initialPriority);
  const planningResourceMap: Record<string, string> = {
    "browser-trace-cleanup": "digital-traces",
    "pet-safety-plan": "pet-plan",
  };
  const activeResourceId = activeGuideId ? planningResourceMap[activeGuideId] : null;
  const activePriority = activePriorityId ? howToPriorities.find((priority) => priority.id === activePriorityId) : null;
  const visibleGuides = activePriorityId ? howToGuides.filter((guide) => guide.priority === activePriorityId) : [];

  useEffect(() => {
    setActiveGuideId(initialGuideId);
    setActivePriorityId(initialPriority);
  }, [initialGuideId, initialPriority]);

  if (activeGuideId === "snap-tanf") {
    return <SnapTanfGuide onBack={() => setActiveGuideId(null)} onNavigate={onNavigate} />;
  }

  if (activeGuideId === "housing-navigation") {
    return <RebuildingModule onBack={() => setActiveGuideId(null)} onNavigate={onNavigate} />;
  }

  if (activeGuideId === "housing-options") {
    return <HousingOptionsGuide onBack={() => setActiveGuideId(null)} />;
  }

  if (activeGuideId === "crime-victim-compensation") {
    return <CrimeVictimCompensationGuide onBack={() => setActiveGuideId(null)} />;
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
      <PageFlourishHeader
        eyebrow={activePriority ? `Folder open // ${activePriority.label}` : "Resources // How To Guides"}
        title="Resource Priorities"
        titleId="how-to-title"
        variant="resources"
      >
        <p>
          Practical guides are sorted by priority so the screen does not throw the whole system at
          the user at once. Open a folder first, then choose the guide that matches the next move.
        </p>
      </PageFlourishHeader>

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
                <h2>{priority.title}</h2>
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
              <h2>{activePriority.title}</h2>
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
                <h2>{guide.title}</h2>
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

type ResourceFolder = "landing" | HowToGuide["priority"] | "legal" | "access";

type GuideLaunch = {
  guideId: string;
  priorityId: HowToGuide["priority"];
};

function getInitialResourceFolder(moduleKey: Exclude<ModuleKey, "home" | "am-i-crazy" | "go-bag-prep">): ResourceFolder {
  if (moduleKey === "how-to") return "landing";
  if (moduleKey === "legal") return "legal";
  if (moduleKey === "library") return "access";
  if (moduleKey === "access") return "access";
  return "landing";
}

function AccessInformationModule() {
  const [showLibrary, setShowLibrary] = useState(false);

  if (showLibrary) {
    return (
      <section className="resources-nested-shell">
        <button className="resource-back-button" type="button" onClick={() => setShowLibrary(false)}>
          Back To Database
        </button>
        <LibraryModule />
      </section>
    );
  }

  return (
    <section className="page-shell library-module access-module" aria-labelledby="access-title">
      <PageFlourishHeader eyebrow="Database // Access" title="Database" titleId="access-title" variant="database">
        <p>
          The Database holds indexed previews, Resource Library access paths, and download
          unlock rules for deeper planners, trackers, and long-form guides.
        </p>
      </PageFlourishHeader>

      <section className="library-section" aria-labelledby="access-options-title">
        <div className="terminal-label">DATABASE ACCESS OPTIONS</div>
        <h2 id="access-options-title">Access Paths</h2>
        <div className="library-pass-grid">
          {libraryPasses.map((pass) => (
            <article className="library-pass-card" key={pass.id}>
              <div className="library-card-header">
                <span>{pass.price}</span>
                <small>ACCESS PATH</small>
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

      <section className="library-section" aria-labelledby="paid-library-entry-title">
        <div className="terminal-label">RESOURCE LIBRARY</div>
        <h2 id="paid-library-entry-title">Open Resource Library</h2>
        <p>
          Preview the deeper planners, trackers, and guide systems from here. The index is organized
          by resource category so the user can scan before unlocking.
        </p>
        <button className="resource-back-button" type="button" onClick={() => setShowLibrary(true)}>
          Open Resource Library
        </button>
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
  const requestedGuideId = window.location.pathname.startsWith("/guides/")
    ? window.location.pathname.replace("/guides/", "")
    : null;
  const requestedGuide = requestedGuideId ? howToGuides.find((guide) => guide.id === requestedGuideId) : null;
  const [activeFolder, setActiveFolder] = useState<ResourceFolder>(() => requestedGuide?.priority ?? getInitialResourceFolder(moduleKey));
  const [guideLaunch, setGuideLaunch] = useState<GuideLaunch | null>(() =>
    requestedGuide ? { guideId: requestedGuide.id, priorityId: requestedGuide.priority } : null
  );
  const requestedDirectory = window.location.pathname.startsWith("/resources/")
    ? window.location.pathname.replace("/resources/", "")
    : "housing";
  const [activeDirectory, setActiveDirectory] = useState<string | null>(requestedDirectory || "housing");

  useEffect(() => {
    setActiveFolder(requestedGuide?.priority ?? getInitialResourceFolder(moduleKey));
    setGuideLaunch(requestedGuide ? { guideId: requestedGuide.id, priorityId: requestedGuide.priority } : null);
    setActiveDirectory(requestedDirectory || "housing");
  }, [moduleKey, requestedDirectory, requestedGuide]);

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
        initialGuideId={guideLaunch?.priorityId === activeFolder ? guideLaunch.guideId : null}
        initialPriority={activeFolder}
        onBackToResources={() => {
          setGuideLaunch(null);
          setActiveFolder("landing");
        }}
        onNavigate={onNavigate}
      />
    );
  }

  const resourceDirectories = [
    {
      id: "housing",
      label: "Housing",
      description: "Housing systems, applications, Coordinated Entry, waitlists, utilities, and follow-up.",
      files: [
        {
          label: "Housing Options",
          action: () => {
            setGuideLaunch({ guideId: "housing-options", priorityId: "priority-2" });
            setActiveFolder("priority-2");
          },
        },
        {
          label: "How To Navigate Housing",
          action: () => {
            setGuideLaunch({ guideId: "housing-navigation", priorityId: "priority-2" });
            setActiveFolder("priority-2");
          },
        },
        { label: "Housing Assistance Tracker", action: () => setActiveFolder("access") },
        { label: "Housing Application Toolkit", action: () => setActiveFolder("access") },
        { label: "Coordinated Entry Contact Log", action: () => setActiveFolder("access") },
        { label: "Utility Assistance Tracker", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "legal-family",
      label: "Legal // Family",
      description: "Family court, custody, caregiving, hearings, deadlines, and documentation.",
      files: [
        { label: "Family Court Guide", action: () => setActiveFolder("legal") },
        { label: "Family Court Planner", action: () => setActiveFolder("access") },
        { label: "Court Date Tracker", action: () => setActiveFolder("access") },
        { label: "Custody Documentation Log", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "legal-civil",
      label: "Legal // Civil",
      description: "Protective orders, civil filings, motions, evidence, and hearing preparation.",
      files: [
        { label: "Civil Protective Order Guide", action: () => setActiveFolder("legal") },
        { label: "Motion Drafting Basics", action: () => setActiveFolder("legal") },
        { label: "Protective Order Hearing Planner", action: () => setActiveFolder("access") },
        { label: "Evidence Organizer", action: () => setActiveFolder("access") },
        { label: "Civil Filing Tracker", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "legal-criminal",
      label: "Legal // Criminal",
      description: "Reporting, criminal-system contact, victim services, incidents, and follow-up.",
      files: [
        {
          label: "Understanding Crime Victim Compensation",
          action: () => {
            setGuideLaunch({ guideId: "crime-victim-compensation", priorityId: "priority-2" });
            setActiveFolder("priority-2");
          },
        },
        { label: "Reporting & Criminal-System Guide - In Development", action: () => setActiveFolder("legal") },
        { label: "Incident Documentation Log", action: () => setActiveFolder("access") },
        { label: "Police Report Follow-Up Tracker", action: () => setActiveFolder("access") },
        { label: "Victim Services Contact Log", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "food",
      label: "Food",
      description: "SNAP, food access, interviews, documents, pantries, and benefit follow-up.",
      files: [
        {
          label: "How To Navigate SNAP & TANF",
          action: () => {
            setGuideLaunch({ guideId: "snap-tanf", priorityId: "priority-2" });
            setActiveFolder("priority-2");
          },
        },
        { label: "SNAP & Benefits Contact Log", action: () => setActiveFolder("access") },
        { label: "Food Assistance Application Tracker", action: () => setActiveFolder("access") },
        { label: "Food Resource Contact List", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "money",
      label: "Money",
      description: "Financial control, benefits, debt, credit, budgeting, records, and economic rebuilding.",
      files: [
        { label: "Benefits Assistance Tracker", action: () => setActiveFolder("access") },
        { label: "Budget Recovery Planner", action: () => setActiveFolder("access") },
        { label: "Debt & Credit Issue Tracker", action: () => setActiveFolder("access") },
        { label: "Financial Documents Inventory", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "homelessness",
      label: "Homelessness",
      description: "Shelter systems, temporary housing, vehicle living, daily logistics, and contact tracking.",
      files: [
        {
          label: "How To Live In Your Car",
          action: () => {
            setGuideLaunch({ guideId: "live-in-your-car", priorityId: "priority-1" });
            setActiveFolder("priority-1");
          },
        },
        { label: "Shelter Contact Tracker", action: () => setActiveFolder("access") },
        { label: "Temporary Housing Planner", action: () => setActiveFolder("access") },
        { label: "Vehicle Living Checklist", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "digital-safety",
      label: "Digital Safety",
      description: "Browser traces, account access, device monitoring, safer browsing, and documentation.",
      files: [
        {
          label: "How To Clear Your Browser History",
          action: () => {
            setGuideLaunch({ guideId: "browser-trace-cleanup", priorityId: "priority-1" });
            setActiveFolder("priority-1");
          },
        },
        { label: "Online Safety Checklist", action: () => setActiveFolder("access") },
        { label: "Account & Device Inventory", action: () => setActiveFolder("access") },
      ],
    },
    {
      id: "daily-stability",
      label: "Daily Stability",
      description: "Routines, pets, appointments, caregiving, and practical systems for disrupted days.",
      files: [
        { label: "How To Create Routine While Life Is Chaotic", action: () => { setGuideLaunch({ guideId: "routine-chaos", priorityId: "priority-3" }); setActiveFolder("priority-3"); } },
        { label: "How To Make A Safety Plan For Your Pet", action: () => { setGuideLaunch({ guideId: "pet-safety-plan", priorityId: "priority-1" }); setActiveFolder("priority-1"); } },
        { label: "Routine Builder", action: () => setActiveFolder("access") },
        { label: "Appointment & Follow-Up Tracker", action: () => setActiveFolder("access") },
        { label: "Pet Planning Checklist", action: () => setActiveFolder("access") },
      ],
    },
  ];

  return (
    <section className="page-shell resources-module" aria-labelledby="resources-title">
      <PageFlourishHeader eyebrow="Load module // Resource folders" title="Resources" titleId="resources-title" variant="resources">
        <p>
          Browse planners, trackers, toolkits, guides, and practical files by the part of life they support.
        </p>
      </PageFlourishHeader>

      <div className="resource-directory-tree" aria-label="Resource directories">
        {resourceDirectories.map((directory) => {
          const isOpen = activeDirectory === directory.id;

          return (
            <section className={`resource-directory${isOpen ? " open" : ""}`} key={directory.id}>
              <button
                className="resource-directory-toggle"
                type="button"
                onClick={() => setActiveDirectory(isOpen ? null : directory.id)}
                aria-expanded={isOpen}
              >
                <span>
                  <strong>{directory.label}</strong>
                  <small>{directory.description}</small>
                </span>
              </button>
              {isOpen ? (
                <div className="resource-file-list">
                  {directory.files.map((file) => (
                    <button className="resource-file-row" key={file.label} type="button" onClick={file.action}>
                      {file.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <section className="resource-support-callout" aria-labelledby="resource-support-title">
        <div>
          <span>KEEP THE ARCHIVE AVAILABLE</span>
          <h2 id="resource-support-title">Support Survivor Systems</h2>
          <p>
            Donations help maintain free educational tools, practical resources, hosting, and the
            continued development of Survivor Systems.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate("support", "/support")}>Donate</button>
      </section>
    </section>
  );
}

function SupportModule({ onNavigate }: { onNavigate: (module: ModuleKey, path: string) => void }) {
  const donationUrl = String(import.meta.env.VITE_STRIPE_DONATION_URL ?? "").trim();
  const [checkoutNotice, setCheckoutNotice] = useState("");

  function openDonationCheckout() {
    if (donationUrl) {
      window.location.assign(donationUrl);
      return;
    }

    setCheckoutNotice("Secure donation checkout is being connected. Please check back soon.");
  }

  return (
    <section className="page-shell support-module" aria-labelledby="support-title">
      <PageFlourishHeader
        eyebrow="Survivor Systems // Community support"
        title="Support"
        titleId="support-title"
        variant="resources"
      >
        <p>
          Survivor Systems is built to make clear, practical information easier to reach. Your
          support helps keep essential tools available while this archive continues to grow.
        </p>
      </PageFlourishHeader>

      <div className="support-page-grid">
        <article className="support-donation-panel">
          <span className="support-panel-label">ONE-TIME DONATION</span>
          <h2>Help sustain the system.</h2>
          <p>
            Donations support hosting, maintenance, research, accessibility work, and the creation
            of new free resources for survivors rebuilding their lives.
          </p>
          <button type="button" onClick={openDonationCheckout}>Donate Securely</button>
          {checkoutNotice ? <p className="support-checkout-notice" role="status">{checkoutNotice}</p> : null}
        </article>

        <aside className="support-principles" aria-label="Donation principles">
          <h2>What support protects</h2>
          <ul>
            <li>Free access to essential educational and crisis-reference tools</li>
            <li>Privacy-minded, account-optional experiences wherever possible</li>
            <li>New guides, assessments, planners, and survivor-centered resources</li>
            <li>Independent maintenance of the Survivor Systems platform</li>
          </ul>
        </aside>
      </div>

      <div className="support-page-actions">
        <button type="button" onClick={() => onNavigate("local-help", "/resources")}>Back to Resources</button>
        <button type="button" onClick={() => onNavigate("home", "/")}>Back to Home</button>
      </div>
    </section>
  );
}

function LibraryModule() {
  return (
    <section className="page-shell library-module" aria-labelledby="library-title">
      <PageFlourishHeader
        eyebrow="Resources // Library"
        title="Resource Library"
        titleId="library-title"
        variant="database"
      >
        <p>
          Free crisis tools stay live in the app. The Resource Library holds deeper templates,
          trackers, guides, and long-form systems for people who want more structure without a
          forced subscription or a forced category choice.
        </p>
      </PageFlourishHeader>

      <div className="library-rule-strip" aria-label="Library rules">
        <span>Unlimited Viewing During Active Pass</span>
        <span>Permanent Unlocks Stay Available</span>
        <span>Signed Download Links</span>
        <span>No Forced Renewal</span>
      </div>

      <section className="library-section" aria-labelledby="library-options-title">
        <div className="terminal-label">DATABASE ACCESS PATHS</div>
        <h2 id="library-options-title">Access Paths</h2>
        <div className="library-pass-grid">
          {libraryPasses.map((pass) => (
            <article className="library-pass-card" key={pass.id}>
              <div className="library-card-header">
                <span>{pass.price}</span>
                <small>ACCESS PATH</small>
              </div>
              <h3>{pass.title}</h3>
              <p>{pass.scope}</p>
              <ul>
                <li>{pass.viewing}</li>
                <li>{pass.unlocks}</li>
                <li>{pass.renewal}</li>
              </ul>
              <button type="button" disabled>
                Checkout Coming Soon
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="library-section" aria-labelledby="library-categories-title">
        <div className="terminal-label">DATABASE INDEX</div>
        <h2 id="library-categories-title">Indexed Categories</h2>
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
        <h2 id="library-preview-title">Look Inside Before Unlocking</h2>
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

      <section className="library-system-grid" aria-label="Library access notes">
        <article className="library-system-card">
          <h2>Founder Access Bonus</h2>
          <p>
            The first 100 paying library users receive one extra Permanent Unlock as a quiet thank-you
            for helping the system come online.
          </p>
        </article>
        <article className="library-system-card">
          <h2>Download Access</h2>
          <p>
            Library files can be previewed during an active access window. Permanent Unlocks are for
            the downloads the user wants to keep.
          </p>
        </article>
      </section>
    </section>
  );
}

function RebuildingModule({
  onBack,
  onNavigate,
}: {
  onBack?: () => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return (
    <section className="page-shell rebuilding-module" aria-labelledby="rebuilding-title">
      <PageFlourishHeader
        eyebrow="Resources // Stabilize"
        title="How To Navigate Housing"
        titleId="rebuilding-title"
        variant="rebuilding"
      >
        <p>
          Housing can feel like one giant locked door. It is usually a set of smaller doors:
          first night, waitlists, documents, transportation, privacy, benefits, advocates, and
          follow-up. This page helps name the system so it gets less impossible to approach.
        </p>
      </PageFlourishHeader>

      <div className="housing-command-strip" aria-label="Housing quick signals">
        <span>211</span>
        <span>Coordinated Entry</span>
        <span>DV Advocate</span>
        <span>Waitlists</span>
        <span>VAWA</span>
        <span>Track Everything</span>
      </div>

      <section className="rebuilding-mission-files" aria-labelledby="rebuilding-mission-files-title">
        <div>
          <p className="terminal-label">MISSION FILE</p>
          <h2 id="rebuilding-mission-files-title">Reality Check Tools</h2>
          <p>
            For the part where the brain keeps replaying the old argument and asking whether the
            harm was real. Spoiler: the system can run diagnostics without giving them admin access.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate("am-i-crazy", "/am-i-crazy")}>
          <span aria-hidden="true">RUN</span>
          <strong>Was I Crazy?</strong>
          <small>Open assessment</small>
        </button>
      </section>

      <div className="rebuilding-section-grid">
        {housingGuideSections.map((section, index) => (
          <article className="rebuilding-guide-card" key={section.id}>
            <div className="rebuilding-guide-card-header">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{section.label}</small>
            </div>
            <h2>{section.title}</h2>
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
        <h2 id="housing-bottom-line">One Mountain, Smaller Steps</h2>
        <p>
          Housing feels like one mountain, but it is actually a series of smaller steps, each one
          unlocking the next. Coordinated Entry gets you into the system. Community resources bridge
          gaps. Tracking helps you avoid losing ground you already gained. You do not have to figure
          all of this out at once. Start with the next step.
        </p>
        <div className="terminal-actions denial-actions">
          {onBack ? (
            <button type="button" onClick={onBack}>
              Back To stabilize.exe
            </button>
          ) : null}
          <button type="button" onClick={() => onNavigate("planning", "/crisis-support")}>
            Crisis Support
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
        <h1 id={`${guide.title.replaceAll(" ", "-").toLowerCase()}-title`}>{guide.title}</h1>
        <p className="legal-tagline">// Legal orientation. No shame. No blindfold.</p>

        <div className="legal-intro">{guide.intro}</div>

        <div className="legal-warning">
          <strong> Not Legal Advice</strong>
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
                    <strong> {block.title}</strong>
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
                <strong> {note.title}</strong>
                <p>{note.body}</p>
              </div>
            ))}
          </div>
        ) : null}

        {guide.reminder ? (
          <div className="legal-reminder">
            <strong> {guide.reminder.title}</strong>
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
          <h1 id="motion-drafting-title">Motion Drafting Basics</h1>
          <p className="legal-tagline">// Tools for clarity. Power for your future.</p>

          <div className="legal-intro">
            A motion is just a written request asking the court to do something. Before you write
            one word, you need to know which one you are actually filing. The wrong motion can get
            you a denial or delay instead of a hearing. This module starts where every filing
            should: research.
          </div>

          <div className="legal-warning">
            <strong> Read This First</strong>
            <p>
              This is general orientation, not legal advice. Motion names, formats, and filing rules
              are different in every state and sometimes every county. Nothing here replaces your
              local court's rules, your county clerk, or a legal aid attorney. Always confirm with
              your specific court before you file.
            </p>
          </div>

          <section className="legal-step-section" aria-labelledby="motion-step-title">
            <h2 id="motion-step-title"> Step One: Research Before You Write</h2>
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
            <h2 id="family-motion-title"> Common Family Court Motions</h2>
            <div className="legal-motion-grid">
              {familyCourtMotionSections.map((section) => (
                <article className="legal-motion-card" key={section.title}>
                  <h3>
                    {section.title}
                    {section.tag ? <span>{section.tag}</span> : null}
                  </h3>
                  {section.blocks.map((block) => (
                    <div className="legal-motion-block" key={block.title}>
                      <strong> {block.title}</strong>
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
              <strong> Note</strong>
              <p>
                Not every state uses these exact names. Some call a Motion to Modify a Petition to
                Modify. Some fold temporary orders and emergency relief into one filing. The category
                matters more than the exact label. Use this list to identify what you need, then
                confirm the correct name and form in your jurisdiction.
              </p>
            </div>
            <div className="legal-note">
              <strong> Subscriber Library Connection</strong>
              <p>
                Subscribers have access to the Court Planner, which is built for everything that
                happens around the filing, not the motion itself: case numbers, court contacts, local
                resources, evidence logs, statement practice, court vocabulary, logistics, and
                after-court notes.
              </p>
            </div>
          </div>

          <div className="legal-reminder">
            <strong> Remember</strong>
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
      <PageFlourishHeader eyebrow="Survivor Operating System // Legal" title="Legal Resources" titleId="legal-title" variant="legal">
        <p>
          Legal systems can be intimidating because they are systems with rules, deadlines,
          vocabulary, and power. This section is for orientation, language, and preparation before
          you ask a court, agency, advocate, or attorney for the next step.
        </p>
      </PageFlourishHeader>

      <div className="legal-category-grid">
        {legalCategories
          .filter((category) => category.id === "protective-orders" || category.id === "family-court")
          .map((category) => (
            <article className="legal-category-card ready" key={category.id}>
              <div className="legal-category-card-header">
                <span>{category.label}</span>
                <small>LIVE GUIDE</small>
              </div>
              <h2>{category.title}</h2>
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
  const [activeModule, setActiveModule] = useState<ModuleKey>(() => getInitialModule());
  const [, setControlPanel] = useState<ControlPanelState>(defaultControlPanel);
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

  const loadingLabel = loadingModule ? moduleRoutes[loadingModule]?.label : null;
  const moduleContent = activeModule === "home" ? (
    <HomeModule onNavigate={navigate} />
  ) : activeModule === "assessments" ||
    activeModule === "guides" ||
    activeModule === "education" ||
    activeModule === "about" ||
    activeModule === "advocacy" ||
    activeModule === "government" ? (
    <CategoryModule category={activeModule} onNavigate={navigate} />
  ) : activeModule === "am-i-crazy" ? (
    <AmICrazyModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
  ) : activeModule === "go-bag-prep" ? (
    <PlanningModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
  ) : activeModule === "planning" ? (
    <PlanningModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
  ) : activeModule === "rebuilding" ? (
    <RebuildingModule onNavigate={navigate} />
  ) : activeModule === "support" ? (
    <SupportModule onNavigate={navigate} />
  ) : activeModule === "local-help" || activeModule === "how-to" || activeModule === "legal" || activeModule === "library" ? (
    <ResourceModule moduleKey={activeModule} onNavigate={navigate} />
  ) : (
    <ResourceModule moduleKey={activeModule} onNavigate={navigate} />
  );

  return (
    <TerminalChrome activeModule={loadingModule ?? activeModule} onNavigate={navigate}>
      {loadingModule && loadingLabel ? (
        <ModuleLoading label={loadingLabel} />
      ) : (
        moduleContent
      )}
    </TerminalChrome>
  );
}
