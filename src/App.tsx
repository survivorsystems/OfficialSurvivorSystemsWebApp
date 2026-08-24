import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  Download,
} from "lucide-react";
import denialSupportOne from "./assets/support/denial-support-1.png";
import denialSupportTwo from "./assets/support/denial-support-2.png";
import dvFundingInfographic from "./assets/systems/dv-funding-infographic.png";
import blankProposedSapcrOrderPreview from "./assets/library/blank-proposed-sapcr-order-preview.png";
import survivorHealingBundleMockup from "./assets/store/survivor-healing-bundle-mockup.png";
import { CommercePageTemplate, EditorialPageTemplate } from "./components/PageTemplates";
import { AgencyReviewForm } from "./components/AgencyReviewForm";
import { HousingStrategySystem } from "./components/HousingStrategySystem";
import {
  findStateResourceLocation,
  getProgramsForStateCategory,
  getStateResourceCategories,
  stateResourceLocations,
  stateResourcePrograms,
  type StateResourceLocation,
} from "./data/stateResources";
import {
  createLibraryFileUrl,
  fetchSubscriberCatalog,
  formatCatalogFileSize,
  readLibrarySession,
  sendLibraryMagicLink,
  type LibrarySession,
  type SubscriberCatalogItem,
} from "./lib/subscriberCatalog";

const denialImages = [denialSupportOne, denialSupportTwo];

function libraryPreviewImage(resource: SubscriberCatalogItem) {
  const resourceKey = `${resource.id} ${resource.title}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  return resourceKey.includes("blankproposedorderinsuitaffectingparentchildrelationship")
    ? blankProposedSapcrOrderPreview
    : null;
}

function ProtectedDocumentViewer({ resource, url }: { resource: SubscriberCatalogItem; url: string }) {
  const docxContainer = useRef<HTMLDivElement>(null);
  const [docxStatus, setDocxStatus] = useState<"loading" | "ready" | "error">("loading");
  const isDocx = resource.format.toLowerCase().includes("docx") || resource.id.toLowerCase().endsWith(".docx");

  useEffect(() => {
    if (!isDocx || !docxContainer.current) return;
    const controller = new AbortController();
    const container = docxContainer.current;
    setDocxStatus("loading");
    container.replaceChildren();

    Promise.all([
      fetch(url, { signal: controller.signal }),
      import("docx-preview"),
    ])
      .then(([response, docxPreview]) => {
        if (!response.ok) throw new Error("Document request failed.");
        return Promise.all([response.blob(), Promise.resolve(docxPreview)]);
      })
      .then(([document, docxPreview]) => docxPreview.renderAsync(document, container, undefined, {
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
      }))
      .then(() => setDocxStatus("ready"))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDocxStatus("error");
      });

    return () => {
      controller.abort();
      container.replaceChildren();
    };
  }, [isDocx, url]);

  if (!isDocx) return <iframe src={url} title={resource.title} />;

  return (
    <div className="library-docx-viewer">
      {docxStatus === "loading" ? <p role="status">Rendering the document...</p> : null}
      {docxStatus === "error" ? <p role="alert">This Word document could not be displayed. Use Download Document above to open it on your device.</p> : null}
      <div ref={docxContainer} aria-label={resource.title} />
    </div>
  );
}

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
  | "go-bag-prep"
  | "planning"
  | "rebuilding"
  | "local-help"
  | "how-to"
  | "legal"
  | "library"
  | "access"
  | "subscribe"
  | "store";

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

type LibraryPass = {
  id: string;
  title: string;
  price: string;
  scope: string;
  viewing: string;
  unlocks: string;
  renewal: string;
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
    status: "AVAILABLE",
    available: true,
  },
  {
    id: "family-court",
    label: "02",
    title: "Family Court",
    description: "Custody, parenting time, support, temporary orders, motion drafting, and court prep.",
    status: "AVAILABLE",
    available: true,
  },
  {
    id: "civil-court",
    label: "03",
    title: "Civil Court",
    description: "Civil filings, claims, responses, deadlines, and paperwork that is not family-court specific.",
    status: "COMING SOON",
  },
  {
    id: "reporting",
    label: "04",
    title: "Reporting",
    description: "Police reports, incident documentation, advocate support, and what to ask before reporting.",
    status: "COMING SOON",
  },
  {
    id: "immigration",
    label: "05",
    title: "Immigration",
    description: "Immigration-related survivor protections, documentation, referrals, and legal-aid pathways.",
    status: "COMING SOON",
  },
];

const libraryPasses: LibraryPass[] = [
  {
    id: "subscriber-library",
    title: "Premium Survivor Library",
    price: "MONTHLY",
    scope: "One subscription for the complete library of planners, trackers, templates, and deeper guides.",
    viewing: "Unlimited library viewing while subscribed.",
    unlocks: "Download any subscriber resource included in the library.",
    renewal: "Renews monthly until canceled.",
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
    status: "BENEFITS GUIDE",
    description:
      "A practical benefits-navigation guide for starting the application, asking for expedited SNAP, handling missing documents, and understanding TANF domestic violence protections.",
    action: "open",
    priority: "priority-2",
  },
  {
    id: "routine-chaos",
    title: "How To Create Routine While Life Is Chaotic",
    subtitle: "Small anchors, rest, self-care, space, creativity, and future-building when life keeps moving.",
    status: "ROUTINE GUIDE",
    description:
      "A stabilizing guide for creating routines that can survive disrupted days, low energy, temporary housing, grief, and rebuilding.",
    action: "open",
    priority: "priority-3",
  },
  {
    id: "live-in-your-car",
    title: "How To Live In Your Car",
    subtitle: "Vehicle readiness, storage, sleep, privacy, bathrooms, food, parking, pets, kids, and safety basics.",
    status: "HOUSING GUIDE",
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
      "A guide to housing systems and the many smaller doors that can sit inside the word housing.",
    action: "open",
    priority: "priority-2",
  },
];

const howToPriorities = [
  {
    id: "priority-1",
    label: "Urgent needs",
    title: "Triage",
    description:
      "Start here when the task is urgent, private, or close to the body: device traces, pets, vehicle living, and immediate stabilization logistics.",
  },
  {
    id: "priority-2",
    label: "Stabilizing",
    title: "Stabilize",
    description:
      "Use this folder for benefits, housing, coordinated entry, applications, follow-ups, and the bureaucracy that starts multiplying.",
  },
  {
    id: "priority-3",
    label: "Rebuilding",
    title: "Rebuild",
    description:
      "Use this section when the fire is a little lower and the next task is rhythm, routine, recovery, and building a life that belongs to you again.",
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
    terminalLabel: "Routine While Life Is Chaotic",
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
    terminalLabel: "Vehicle Living",
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
        title: "Important",
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
  terminalLabel: "Civil Protective Order Guide",
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
    title: "Permission and Choice",
    body:
      "Wanting protection and feeling afraid of the process can both be true. Court can be intimidating. Preparation is not overreacting. It is the system choosing not to walk in blind.",
  },
};

const familyCourtGuide: LegalGuidePageData = {
  title: "Family Court Guide",
  eyebrow: "Legal // Family Court",
  terminalLabel: "Family Court Guide",
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
    title: "What The Signed Order Controls",
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
  education: { label: "Surviving", path: "/surviving" },
  about: { label: "About", path: "/about" },
  advocacy: { label: "Assessments", path: "/assessments" },
  government: { label: "Systems", path: "/systems" },
  support: { label: "Support", path: "/support" },
  "go-bag-prep": { label: "Immediate Support", path: "/crisis-support" },
  planning: { label: "Immediate Support", path: "/crisis-support" },
  rebuilding: { label: "Guides", path: "/rebuilding" },
  "local-help": { label: "Resources", path: "/resources" },
  "how-to": { label: "Guides", path: "/guides" },
  legal: { label: "Guides", path: "/guides" },
  library: { label: "Premium Survivor Library", path: "/resources/access" },
  access: { label: "Premium Survivor Library", path: "/resources/access" },
  subscribe: { label: "Subscribe", path: "/subscribe" },
  store: { label: "Store", path: "/store" },
};

const allNavTargets: Array<{ key: ModuleKey; label: string; path: string }> = [
  { key: "home", ...moduleRoutes.home },
  { key: "planners", ...moduleRoutes.planners },
  { key: "toolkits", ...moduleRoutes.toolkits },
  { key: "education", ...moduleRoutes.education },
  { key: "about", ...moduleRoutes.about },
  { key: "advocacy", ...moduleRoutes.advocacy },
  { key: "government", ...moduleRoutes.government },
  { key: "support", ...moduleRoutes.support },
  { key: "planning", label: "Immediate Support", path: "/crisis-support" },
  { key: "local-help", ...moduleRoutes["local-help"] },
  { key: "how-to", ...moduleRoutes["how-to"] },
  { key: "legal", ...moduleRoutes.legal },
  { key: "library", ...moduleRoutes.library },
  { key: "access", ...moduleRoutes.access },
  { key: "store", ...moduleRoutes.store },
];

type SidebarIconKey =
  | "home"
  | "about"
  | "advocacy"
  | "assessments"
  | "education"
  | "government"
  | "guides"
  | "planners"
  | "toolkits";

const navItems: Array<{ key: ModuleKey; label: string; path: string; code: SidebarIconKey }> = [
  { key: "home", label: "Home", path: "/", code: "home" },
  { key: "local-help", label: "Resources", path: "/resources", code: "toolkits" },
  { key: "guides", label: "Guides", path: "/guides", code: "guides" },
  { key: "store", label: "Store", path: "/store", code: "planners" },
  { key: "government", label: "Systems", path: "/systems", code: "government" },
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
    case "home":
      return (
        <svg {...commonProps}>
          <path d="M8 30 32 9l24 21" fill="var(--folk-mustard, #D6A536)" stroke="var(--folk-ink, #26302C)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M14 27v28h36V27L32 14 14 27Z" fill="var(--folk-cream, #F6E8D0)" stroke="var(--folk-ink, #26302C)" strokeWidth="4" strokeLinejoin="round" />
          <rect x="26" y="37" width="12" height="18" fill="var(--folk-teal, #347D7B)" stroke="var(--folk-ink, #26302C)" strokeWidth="3" />
        </svg>
      );
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

function isPrimaryNavActive(activeModule: ModuleKey, navKey: ModuleKey) {
  if (navKey === "local-help") {
    return activeModule === "local-help" || activeModule === "planners" || activeModule === "toolkits" || activeModule === "access" || activeModule === "library";
  }

  if (navKey === "guides") return activeModule === "guides" || activeModule === "how-to" || activeModule === "legal" || activeModule === "rebuilding" || activeModule === "advocacy" || activeModule === "assessments";

  if (navKey === "advocacy") return activeModule === "advocacy" || activeModule === "assessments";

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
        title: "Premium Survivor Library Access",
        description: "Subscriber access, library previews, and deeper planner and tracker resources.",
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
        description: "The subscriber toolkit library with previews, planners, trackers, and downloads.",
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
    title: "Surviving",
    intro:
      "Information for staying safer during the planning phase, documenting abuse, understanding risk, and preparing for an exit. More resources are being built for this section.",
    files: [
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
    title: "Assessments",
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
          "Your concern is heard without rewriting reality, punishing you, or putting your character on trial. That is a healthier conflict pattern.",
      },
      {
        id: "1b",
        label: "They say it never happened or that I misunderstood.",
        responseTitle: "Gaslighting may be present",
        response:
          "Your lived experience has been submitted for unauthorized deletion. They do not receive administrator privileges over your memory simply because the facts are inconvenient.",
        pattern: "Gaslighting or reality rewriting",
      },
      {
        id: "1c",
        label: "They say I am too sensitive, dramatic, or crazy.",
        responseTitle: "The focus may be shifting away from the harm",
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
        responseTitle: "Retaliation may be shaping what feels safe to say",
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
          "Ordinary personal decisions do not require permission or advance warning. This answer reflects room for personal choice.",
      },
      {
        id: "2b",
        label: "Sometimes, mainly during specific disagreements.",
        responseTitle: "NORMAL CONFLICT LOAD",
        response:
          "Some adjustment may be ordinary compromise, provided it does not begin taking over the rest of your life or choices.",
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
        responseTitle: "Accountability and repair may be possible",
        response:
          "Both people can acknowledge impact without retaliation or counterattack. That creates room for meaningful repair.",
      },
      {
        id: "3b",
        label: "Usually me, even when I raised the original concern.",
        responseTitle: "Blame reversal may be present",
        response: "You reported the malfunction. You were assigned responsibility for causing the malfunction. Logic failure confirmed.",
        pattern: "Blame reversal",
      },
      {
        id: "3c",
        label: "They apologize, but the same behavior keeps happening.",
        responseTitle: "The apology has not become lasting change",
        response:
          "The words may sound right, but repeated apologies are not the same as changed behavior.",
        pattern: "Repeated apology without change",
      },
      {
        id: "3d",
        label: "The conversation becomes so confusing that the original issue disappears.",
        responseTitle: "Chaos may be replacing accountability",
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
        response: "Disagreement does not remove your right to make your own decision.",
      },
      {
        id: "4b",
        label: "Uncomfortable, but not afraid.",
        responseTitle: "MINOR CONFLICT LOAD",
        response:
          "Discomfort is not automatically danger. Notice whether the tension comes from disagreement itself or from anticipating consequences.",
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
          "Friends, interests, identity, and independent choices remain available. The relationship has not consumed the rest of your life.",
      },
      {
        id: "5b",
        label: "Some parts of my life faded, but I am not sure how.",
        responseTitle: "Your life may be getting smaller",
        response:
          "No dramatic shutdown found. Loss appears gradual: one cancelled plan, abandoned interest, or exhausting argument at a time.",
        pattern: "Gradual life contraction",
      },
      {
        id: "5c",
        label: "They create conflict around friends, family, work, or hobbies.",
        responseTitle: "ISOLATION SEQUENCE RUNNING",
        response: "Outside connection repeatedly creates conflict, making independence costly.",
        pattern: "Isolation sequence",
      },
      {
        id: "5d",
        label: "I feel isolated and increasingly dependent on them.",
        responseTitle: "SUPPORT NETWORK SEVERELY RESTRICTED",
        response:
          "Perspective, resources, and alternatives are increasingly unavailable. One person's version of reality is taking priority over your own. That can seriously erode clarity.",
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
        responseTitle: "Resource surveillance may be present",
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
        responseTitle: "Identity may be used as leverage",
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
        response: "A demand for total access can be surveillance even when it is described as intimacy. Total access is not proof of trust.",
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
        response: "The expectation is uneven. Repair remains possible if discussion leads to a real and lasting change.",
      },
      {
        id: "8c",
        label: "They can do things I would be punished for doing.",
        responseTitle: "A double standard may be present",
        response: "One person receives freedom while the other receives penalties for the same behavior. That creates a hierarchy.",
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
        responseTitle: "Repair and accountability are present",
        response: "Harm acknowledged. Responsibility accepted. Behavior changed. No loophole or smoke machine required.",
      },
      {
        id: "9b",
        label: "They apologize and become intensely loving.",
        responseTitle: "LOVE-BOMBING LEVELS SUSPICIOUSLY HIGH",
        response: "Intense affection after an incident is not enough to establish repair. Lasting behavior over time matters more.",
        pattern: "Post-incident affection spike",
      },
      {
        id: "9c",
        label: "They blame stress, alcohol, trauma, work, or someone else.",
        responseTitle: "Explanations may be replacing responsibility",
        response: "Stress. Alcohol. Trauma. Work. Childhood. Weather. Mercury retrograde. Explanation capacity exceeded. Responsibility remains pending.",
        pattern: "Excuse shifting",
      },
      {
        id: "9d",
        label: "They act like nothing happened.",
        responseTitle: "The incident may be dismissed or erased",
        response: "They may act as though the event disappeared while your body and memory continue carrying it.",
        pattern: "Incident erasure",
      },
      {
        id: "9e",
        label: "The same cycle keeps repeating.",
        responseTitle: "The same harm cycle may be repeating",
        response: "Harm, apology, calm, hope, and renewed harm can form a repeating cycle even when each apology feels sincere.",
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
        responseTitle: "The future may feel workable",
        response:
          "Repair may be possible when both people acknowledge harm, accept responsibility, and make lasting behavioral changes.",
      },
      {
        id: "10b",
        label: "Sad, depleted, or trapped.",
        responseTitle: "FUTURE PROJECTION: DEPLETION",
        response:
          "Imagining another year may reveal exhaustion, sadness, or restriction that present-day survival has left little room to process.",
        pattern: "Future depletion",
      },
      {
        id: "10c",
        label: "Afraid things would become worse.",
        responseTitle: "Fear of escalation deserves attention",
        response: "Fear that conditions will worsen may be based on patterns you already recognize. Take your own concern seriously.",
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
  notice: "Choose a page or assessment whenever you are ready.",
};

function leaveSite() {
  window.location.replace("https://iluvrocks.rocks");
}

function getInitialModule(): ModuleKey {
  const path = window.location.pathname;
  if (path === "/assessments") return "advocacy";
  if (path === "/guides") return "guides";
  if (path.startsWith("/guides/")) return "how-to";
  if (path === "/planners-trackers" || path === "/toolkits") return "local-help";
  if (path === "/surviving" || path === "/education-awareness") return "advocacy";
  if (path === "/about") return "about";
  if (path === "/strategy" || path === "/advocacy") return "advocacy";
  if (path === "/government" || path === "/systems") return "government";
  if (path === "/support") return "support";
  if (path === "/rebuilding") return "rebuilding";
  if (path === "/planning" || path === "/go-bag-prep" || path === "/crisis-support") return "planning";
  if (path === "/local-help") return "local-help";
  if (path === "/how-to") return "how-to";
  if (path === "/legal") return "legal";
  if (path === "/library") return "access";
  if (path === "/resources/access" || path === "/resources/access/view") return "access";
  if (path === "/subscribe") return "subscribe";
  if (path === "/store" || path.startsWith("/store/")) return "store";
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
      <p>OPENING {label.toUpperCase()}...</p>
    </div>
  );
}

function SiteChrome({
  activeModule,
  children,
  onNavigate,
}: {
  activeModule: ModuleKey;
  children: ReactNode;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const activeLabel = moduleRoutes[activeModule]?.label ?? "Home";
  const visualModule = activeModule === "access" ? "library" : activeModule;
  const [pressedNavItem, setPressedNavItem] = useState<ModuleKey | null>(null);

  return (
    <main className={`terminal-frame app-frame hud-frame module-${visualModule}`}>
      <section className="site-shell" aria-label="Survivor Systems">
        <aside className="folk-sidebar">
          <button className="desktop-brand-panel" type="button" onClick={() => onNavigate("home", "/")}>
            <BrandLogo />
          </button>
          <nav className="desktop-icon-grid" aria-label="Site navigation">
            {navItems.map((item) => (
              <button
                className={`desktop-icon desktop-icon-${item.code}${isPrimaryNavActive(activeModule, item.key) ? " active" : ""}${pressedNavItem === item.key ? " is-pressed" : ""}`}
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key, item.path)}
                onBlur={() => setPressedNavItem(null)}
                onFocus={() => setPressedNavItem(item.key)}
                onMouseEnter={() => setPressedNavItem(item.key)}
                onMouseLeave={() => setPressedNavItem(null)}
              >
                <span className="desktop-icon-title">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <button className="floating-quick-escape" type="button" onClick={leaveSite} aria-label="Quick Escape">
          Quick Escape
        </button>

        <section className="folk-main-shell">
          <section className={`terminal-screen hud-window hud-window-${visualModule}`} aria-label={activeLabel}>
          <div className="terminal-content">
            {activeModule !== "home" ? (
              <header className="site-editorial-masthead" aria-label="Survivor Systems">
                <p>TOOLS FOR CLARITY, AUTONOMY + REBUILDING</p>
                <div>
                  <span>EST. 2026</span>
                  <strong>SURVIVOR SYSTEMS</strong>
                  <span>START ANYWHERE</span>
                </div>
              </header>
            ) : null}
            {children}
          </div>
          </section>
        </section>

      </section>
    </main>
  );
}

function HomeModule({ onNavigate }: { onNavigate: (module: ModuleKey, path: string) => void }) {
  return (
    <section className="home-terminal bauhaus-home" aria-labelledby="home-title">
      <header className="home-editorial-masthead">
        <p>TOOLS FOR CLARITY, AUTONOMY + REBUILDING</p>
        <div>
          <span>EST. 2026</span>
          <strong>SURVIVOR SYSTEMS</strong>
          <span>START ANYWHERE</span>
        </div>
      </header>

      <article className="home-editorial-lead">
        <p className="home-editorial-kicker">PRACTICAL INFORMATION FOR THE WHOLE PICTURE</p>
        <h1 id="home-title">Welcome to Survivor Systems</h1>
        <div className="home-editorial-lead-copy">
          <p>
            Welcome to <strong>Survivor Systems</strong>, a place for practical tools for when your life
            has become an administrative nightmare.
          </p>
          <p>
            Find state-specific housing, financial, legal, childcare, transportation, immigration, and
            survivor resources. Use trackers to document what's happening. Build court records that make
            sense. Organize money, housing applications, safety information, and next steps. Grab workbooks
            and kits for rebuilding autonomy, income, routines, identity, and everything else abuse has a
            way of hijacking.
          </p>
          <p><strong>No inspirational-poster bullshit. No pretending a hotline fixes everything.</strong></p>
          <p>
            Just information, tools, templates, and systems you can actually use to figure out what's
            available, make informed decisions, keep your receipts, and move your life in the direction
            <strong> you</strong> choose.
          </p>
        </div>
        <p className="home-editorial-deck">Welcome in. Use what helps. Leave what doesn't.</p>
      </article>

      <div className="home-editorial-secondary" aria-label="Where to begin and device safety">
        <article className="home-start-story">
          <header className="home-article-header">
            <p className="home-editorial-kicker">A GUIDED PLACE TO BEGIN</p>
            <h2>Start Here</h2>
          </header>
          <p>
            There is a lot here: assessments, safety information, practical guides, state resources,
            planning tools, and rebuilding support. Start Here asks a few questions and points you
            toward what may be most relevant. Your answers aren't saved or transmitted.
          </p>
          <div className="home-editorial-actions">
            <button type="button" onClick={() => onNavigate("advocacy", "/assessments")}>Take Start Here</button>
            <button type="button" onClick={() => onNavigate("local-help", "/resources")}>Browse Resources</button>
          </div>
        </article>

        <article className="home-safety-story" aria-labelledby="home-privacy">
          <header className="home-article-header">
            <p className="home-editorial-kicker">A NOTE ABOUT DEVICE SAFETY</p>
            <h2 id="home-privacy">Abusers often monitor devices and online activity.</h2>
          </header>
          <p>
            Cyberstalking can include checking browser history, accessing accounts, tracking a phone's
            location, reading messages, or installing surveillance software. Changing settings or
            clearing history can sometimes alert the person monitoring you. Use a safer device when
            possible and make changes only when they feel safe for you.
          </p>
          <button type="button" onClick={() => onNavigate("how-to", "/guides/browser-trace-cleanup")}>Open Digital Safety Guide</button>
        </article>
      </div>

      <aside className="home-editorial-disclaimer" aria-labelledby="home-education-disclaimer-title">
        <strong id="home-education-disclaimer-title">Educational information, not individualized advice.</strong>
        <p>Survivor Systems provides general educational information and practical planning tools. Nothing on this site is legal, medical, financial, mental-health, or other individualized professional advice unless a page explicitly states otherwise.</p>
      </aside>

    </section>
  );
}

type BundleDownload = {
  name: string;
  url: string;
};

function StoreModule() {
  const isHealingBundleSuccess = window.location.pathname === "/store/survivor-healing-bundle/success";
  const [bundleDownloads, setBundleDownloads] = useState<BundleDownload[]>([]);
  const [bundleAccessStatus, setBundleAccessStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [bundleAccessMessage, setBundleAccessMessage] = useState("");

  useEffect(() => {
    if (!isHealingBundleSuccess) return;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setBundleAccessStatus("error");
      setBundleAccessMessage("The Stripe checkout confirmation is missing. Please use the return link from your completed checkout.");
      return;
    }

    const controller = new AbortController();
    setBundleAccessStatus("loading");
    fetch(`/api/bundle-access?session_id=${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { downloads?: BundleDownload[]; error?: string };
        if (!response.ok || !result.downloads) throw new Error(result.error || "The bundle could not be prepared.");
        setBundleDownloads(result.downloads);
        setBundleAccessStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setBundleAccessStatus("error");
        setBundleAccessMessage(error instanceof Error ? error.message : "The bundle could not be prepared.");
      });

    return () => controller.abort();
  }, [isHealingBundleSuccess]);

  if (isHealingBundleSuccess) {
    return (
      <section className="page-shell store-module store-bundle-success" aria-labelledby="store-bundle-success-title">
        <PageFlourishHeader
          eyebrow="PURCHASE COMPLETE"
          title="Your Survivor Healing Bundle"
          titleId="store-bundle-success-title"
          variant="resources"
        >
          <p>Your five resources will appear below after the completed Stripe payment is verified.</p>
        </PageFlourishHeader>

        <section className="store-delivery-panel" aria-live="polite">
          {bundleAccessStatus === "loading" ? <p>Preparing your secure downloads...</p> : null}
          {bundleAccessStatus === "error" ? (
            <>
              <h2>We couldn't prepare the files yet.</h2>
              <p>{bundleAccessMessage}</p>
              <button type="button" onClick={() => window.location.reload()}>Try Again</button>
            </>
          ) : null}
          {bundleAccessStatus === "ready" ? (
            <>
              <span>SECURE DOWNLOADS</span>
              <h2>Everything in your bundle</h2>
              <p>These private links expire after ten minutes. Refresh this page to generate new links from the verified purchase.</p>
              <div className="store-download-list">
                {bundleDownloads.map((download) => (
                  <a key={download.name} href={download.url}>{download.name}</a>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </section>
    );
  }

  const plannedKits = [
    {
      title: "Family Court Kit",
      description: "Court planning, incident documentation, custody records, evidence organization, deadlines, and hearing preparation in one coordinated collection.",
    },
    {
      title: "Protective Order Kit",
      description: "Incident chronology, evidence preparation, filing organization, hearing planning, order records, and enforcement documentation.",
    },
    {
      title: "Housing Stability Kit",
      description: "Housing strategy, applications, waitlists, documents, program contacts, follow-up, utilities, and relocation planning.",
    },
  ];

  return (
    <section className="page-shell store-module" aria-labelledby="store-title">
      <PageFlourishHeader
        eyebrow="SURVIVOR SYSTEMS / PRACTICAL KITS"
        title="Survivor Systems Store"
        titleId="store-title"
        variant="resources"
      >
        <p>
          Focused collections of related tools, grouped around the real task someone is trying to manage.
          Each kit will clearly show what is included before purchase.
        </p>
      </PageFlourishHeader>

      <section className="store-status" aria-labelledby="store-status-title">
        <span>THE FIRST KIT IS READY</span>
        <h2 id="store-status-title">Built around a need, not a pile of downloads.</h2>
        <p>Each collection brings related tools together around one practical area of rebuilding.</p>
      </section>

      <div className="store-live-kit" aria-label="Available kit">
        <article>
          <figure className="store-kit-preview">
            <img
              src={survivorHealingBundleMockup}
              alt="Survivor Healing Bundle workbook covers and interior pages for emotional, financial, sexual, and total autonomy restoration"
              decoding="async"
            />
          </figure>
          <span>AVAILABLE NOW</span>
          <h2>Survivor Healing Bundle</h2>
          <p>A five-part collection for rebuilding emotional, financial, sexual, and personal autonomy while examining the larger systems that shape control.</p>
          <ul>
            <li>Emotional Autonomy Restoration</li>
            <li>Financial Autonomy Restoration</li>
            <li>Sexual Autonomy Restoration</li>
            <li>Total Autonomy Restoration</li>
            <li>Dismantling The Patriarchy</li>
          </ul>
          <div className="store-purchase-row">
            <strong>$14.99</strong>
            <a href="https://buy.stripe.com/9B68wR0Ko0cr7Vm9QbfQI03">Buy</a>
          </div>
        </article>
      </div>

      <div className="store-kit-grid" aria-label="More kits in preparation">
        {plannedKits.map((kit) => (
          <article key={kit.title}>
            <span>IN PREPARATION</span>
            <h2>{kit.title}</h2>
            <p>{kit.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutModule({ onNavigate }: { onNavigate: (module: ModuleKey, path: string) => void }) {
  return (
    <section className="page-shell about-story" aria-labelledby="about-story-title">
      <PageFlourishHeader
        eyebrow="BUILT FOR THE PART NOBODY PREPARES YOU FOR"
        title="About Survivor Systems"
        titleId="about-story-title"
        variant="about"
      >
        <p>Surviving abuse is only one part of getting free.</p>
      </PageFlourishHeader>

      <section className="about-story-intro" aria-labelledby="about-whole-picture-title">
        <div>
          <span>THE WHOLE PICTURE</span>
          <h2 id="about-whole-picture-title">Rebuilding doesn't happen one system at a time.</h2>
        </div>
        <div>
          <p>
            Leaving can mean suddenly having to figure out housing, money, transportation, benefits,
            court, safety, documentation, work, childcare, technology, healthcare, and a dozen other
            systems while your nervous system is already running on fumes.
          </p>
          <p>Most resources treat those problems separately. Survivor Systems looks at the whole picture.</p>
          <p>
            It's a practical resource and strategy platform designed to help survivors understand what's
            happening, identify where control is still being applied, and make informed decisions about
            what comes next.
          </p>
          <p><strong>And it exists because I needed something like it myself.</strong></p>
        </div>
      </section>

      <section className="about-founder-section" aria-labelledby="about-founder-title">
        <div>
          <span>WHY I BUILT IT</span>
          <h2 id="about-founder-title">Leaving isn't the finish line.</h2>
          <p>
            I'm a survivor of trafficking, coercive control, domestic violence, homelessness, stalking,
            and post-separation abuse.
          </p>
          <p>
            I know what it's like to have your access to money, housing, transportation, information,
            relationships, and basic stability controlled by another person. I also know what happens
            after you get away.
          </p>
          <p>
            People tell survivors to leave abusive situations as if leaving is the finish line. It isn't.
            Sometimes it's the beginning of an entirely new fight.
          </p>
          <p>
            You may be safe from the immediate relationship and still be dealing with destroyed finances,
            housing instability, court cases, damaged credit, missing documents, employment gaps, trauma,
            isolation, custody issues, stalking, or an abuser who has simply moved their control into
            another system.
          </p>
          <p>I spent a lot of time trying to navigate those systems while also rebuilding my own life.</p>
        </div>
      </section>

      <blockquote className="about-strategy-callout">
        <span>THE PROBLEM I KEPT FINDING</span>
        <p>There was information everywhere, but very little strategy.</p>
      </blockquote>

      <section className="about-overlap-section" aria-labelledby="about-overlap-title">
        <div>
          <p>A hotline might understand domestic violence.</p>
          <p>A housing program might understand homelessness.</p>
          <p>A court resource might explain a legal process.</p>
          <p>A benefits office might explain eligibility.</p>
        </div>
        <div>
          <span>REAL LIFE OVERLAPS</span>
          <h2 id="about-overlap-title">Survivors don't live inside one category at a time.</h2>
          <p>Real life is messier than that. Everything overlaps.</p>
        </div>
      </section>

      <section className="about-difference-section" aria-labelledby="about-difference-title">
        <div>
          <span>WHAT SURVIVOR SYSTEMS DOES DIFFERENTLY</span>
          <h2 id="about-difference-title">Better information. Clearer strategy. Your decisions.</h2>
          <p>
            Survivor Systems is designed around that overlap. We're not here to patronize you or sugarcoat
            anything. We are here to prepare you for your new life, free from abuse, with information we
            wish we had. Information that could make what feels impossible, very possible. Step by step.
          </p>
          <p>
            Think of Survivor Systems like a friend guiding you through how to navigate rebuilding your
            new life with wisdom and experience. The goal isn't to tell survivors what to do. It's to help
            people see the board more clearly so they can make their own decisions.
          </p>
          <p>
            That might mean taking an assessment to identify financial captivity or post-separation
            control. It might mean learning how a particular system works before walking into it, finding
            a free resource, building a practical plan, documenting what's happening, or getting help
            thinking through a complicated situation.
          </p>
          <p><strong>Sometimes the most powerful thing a survivor can have is simply better information and a clearer strategy.</strong></p>
        </div>
      </section>

      <section className="about-offerings" aria-labelledby="about-offerings-title">
        <header>
          <span>RESOURCES, ASSESSMENTS, SERVICES + TRAINING</span>
          <h2 id="about-offerings-title">Practical support for survivors and the people serving them.</h2>
        </header>
        <div className="about-offerings-grid">
          <article>
            <span>TOOLS</span>
            <h3>Resources and assessments</h3>
            <p>
              Educational resources, assessments, planners, guides, and strategy tools for people
              rebuilding after abuse. Some resources are completely free. Others are low-cost tools
              designed to help fund the project while keeping information accessible.
            </p>
          </article>
          <article>
            <span>STRATEGY</span>
            <h3>One-on-one support</h3>
            <p>
              I also offer one-on-one strategy services for people who need help organizing a complicated
              situation, identifying options, or figuring out what questions they should be asking next.
            </p>
          </article>
          <article>
            <span>TRAINING</span>
            <h3>Professional education</h3>
            <p>
              Training and consulting are available for organizations, advocates, service providers, and
              professionals who want a deeper understanding of coercive control, survivor barriers,
              post-separation abuse, and the ways different systems can unintentionally create additional
              obstacles for people trying to rebuild.
            </p>
          </article>
        </div>
      </section>

      <section className="about-principles" aria-labelledby="about-principles-title">
        <div>
          <span>THIS ISN'T ABOUT TELLING SURVIVORS HOW TO SURVIVE</span>
          <h2 id="about-principles-title">Survivors are already doing that.</h2>
          <p>This is about giving them better tools.</p>
        </div>
        <ul>
          <li>People navigating abuse and its aftermath deserve more than encouragement.</li>
          <li>They deserve useful information.</li>
          <li>They deserve options.</li>
          <li>They deserve practical tools.</li>
          <li>They deserve to understand the systems affecting their lives.</li>
          <li>And they deserve resources that recognize escaping control and rebuilding autonomy aren't the same thing.</li>
        </ul>
        <p>
          The goal of Survivor Systems is to make rebuilding a little less confusing, a little more
          strategic, and a hell of a lot less lonely.
        </p>
      </section>

      <section className="about-start" aria-labelledby="about-start-title">
        <span>START WHEREVER YOU ARE</span>
        <h2 id="about-start-title">You don't have to solve everything at once.</h2>
        <p>You don't need to know exactly what kind of help you need before you begin.</p>
        <p>Take an assessment if you're trying to understand what's happening.</p>
        <p>Browse the resource library if you're looking for practical information.</p>
        <p>Book a strategy session if your situation is complicated and you need help sorting through the moving pieces.</p>
        <p>If you're an organization or professional interested in training or consulting, you can learn more about working together.</p>
        <div className="about-start-actions">
          <button type="button" onClick={() => onNavigate("advocacy", "/assessments")}>Open Assessments</button>
          <button type="button" onClick={() => onNavigate("local-help", "/resources")}>Browse Resources</button>
        </div>
        <p><strong>You just need a place to start.</strong></p>
      </section>
    </section>
  );
}

function SystemsModule() {
  const [activeSystem, setActiveSystem] = useState<"directory" | "funding" | "audit">("directory");

  return (
    <section className="page-shell systems-page" aria-labelledby="systems-page-title">
      <header className="systems-page-header">
        <span>SURVIVOR SYSTEMS</span>
        <h1 id="systems-page-title">
          {activeSystem === "funding" ? "DV Funding Educational Guide" : "Systems"}
        </h1>
      </header>

      {activeSystem === "directory" ? (
        <>
          <div className="systems-directory systems-directory-consolidated" aria-label="Systems educational guides">
            <button type="button" onClick={() => setActiveSystem("funding")}>
              <span>01</span>
              <strong>DV Funding Educational Guide</strong>
              <small>Follow funding from federal appropriations through state administration and local implementation.</small>
            </button>
          </div>
          <section className="systems-articles" aria-labelledby="systems-articles-title">
            <header>
              <span>FOLLOW THE RECORDS</span>
              <h2 id="systems-articles-title">Systems Articles</h2>
            </header>
            <button type="button" onClick={() => setActiveSystem("audit")}>
              <span>FINANCIAL RESEARCH GUIDE</span>
              <strong>How to Audit a 501(c)(3)</strong>
              <small>Trace public funding, Form 990s, compensation, program expenses, grants, and related organizations.</small>
            </button>
          </section>
        </>
      ) : null}

      {activeSystem === "funding" ? (
        <article className="federal-systems-page" aria-labelledby="federal-funding-title">
          <button className="systems-back-button" type="button" onClick={() => setActiveSystem("directory")}>
            Back to Systems
          </button>

          <figure className="federal-funding-infographic">
            <img
              src={dvFundingInfographic}
              alt="Follow the Money infographic showing how federal domestic violence funding moves through agencies, state administration, program allocations, and local organizations before services reach survivors."
            />
            <figcaption>Follow the Money: Domestic Violence Funding. Updated May 2026.</figcaption>
          </figure>

          <section className="federal-funding-summary" aria-labelledby="federal-funding-title">
            <header>
              <span>PLAIN-LANGUAGE SUMMARY</span>
              <h2 id="federal-funding-title">What Federal Domestic Violence Funding Actually Pays For</h2>
              <p>A plain-language summary of Survivor Systems' Follow the Money infographic.</p>
            </header>

            <section>
              <h3>The short version</h3>
              <p>
                Federal domestic violence funding does not move directly from Congress to survivors.
                Congress appropriates the money, federal agencies distribute it, states administer it,
                and the funds are divided among courts, law enforcement, prosecutors, victim-service
                programs, nonprofits, coalitions, and other organizations. Survivors are at the end of that chain.
              </p>
            </section>

            <section>
              <h3>What the STOP VAWA example shows</h3>
              <p>
                Using Texas STOP VAWA formula funding as an example, federal rules reserve 25% for law
                enforcement, 25% for prosecutors, 5% for courts, 30% for victim services, and 15% for
                discretionary purposes. That means 55% is reserved for police, prosecutors, and courts.
                States may also use up to 10% of each category for administration.
              </p>
              <strong className="federal-funding-emphasis">
                As much as 65% can therefore be committed to justice-system institutions and state
                administration, while only 30% is guaranteed to the victim-services category.
              </strong>
            </section>

            <section>
              <h3>Victim services are not the same as direct survivor aid</h3>
              <p>
                The "victim services" category can pay for staff salaries, shelter operations, counseling,
                legal services, utilities, equipment, training, and other program costs. It does not tell the
                public how much is spent on direct, tangible help such as rent, hotel stays, transportation,
                relocation, food, clothing, or cash assistance.
              </p>
            </section>

            <section>
              <h3>The transparency problem</h3>
              <p>
                Public reports generally show how much money was awarded and how many people were served,
                but they do not consistently show how much of that funding actually reached survivors as
                direct material help. Those costs are often blended into broad categories such as "victim services."
              </p>
              <strong className="federal-funding-emphasis">
                Funding domestic violence programs and funding survivors are not necessarily the same thing.
              </strong>
            </section>

            <section>
              <h3>Why this matters</h3>
              <p>
                Federal funding supports an entire response system: government agencies, courts, police,
                prosecutors, nonprofits, shelters, advocates, and service providers. Some of that infrastructure
                is essential. But if we want to know whether the money is helping survivors rebuild their lives,
                public reporting needs to clearly separate system operating costs from the concrete assistance
                survivors actually receive.
              </p>
            </section>
          </section>
        </article>
      ) : null}

      {activeSystem === "funding" ? (
        <article className="state-systems-page" aria-labelledby="state-funding-title">
          <section className="state-funding-summary" aria-labelledby="state-funding-title">
            <header>
              <span>STATE GOVERNMENT</span>
              <h2 id="state-funding-title">How State Governments Administer Domestic Violence Funding</h2>
              <p>
                State governments play a major role in deciding how federal domestic violence funding
                is administered after it leaves Washington.
              </p>
            </header>

            <section>
              <h3>The basic flow</h3>
              <p className="state-funding-flow">
                Congress appropriates the money <strong>to</strong> federal agencies <strong>to</strong> states
                <strong> to</strong> courts, law enforcement, prosecutors, victim-service programs,
                nonprofits, and other organizations <strong>to</strong> survivors receiving services.
              </p>
              <p>
                States are therefore not just passive middlemen. They are a major administrative layer
                between federal funding and the programs survivors eventually encounter.
              </p>
            </section>

            <section>
              <h3>States can keep part of the funding for administration</h3>
              <p>
                Using STOP VAWA formula funding as an example, states may use up to 10% of each funding
                category for state administrative costs.
              </p>
              <p>
                That money can support the state agencies and employees responsible for managing grants,
                reviewing applications, monitoring programs, handling compliance, reporting, and distributing
                funds to local recipients.
              </p>
              <p>
                This means some of the money appropriated for domestic violence programs is spent at the
                state-government level before it ever reaches a local organization or survivor.
              </p>
            </section>

            <section>
              <h3>Much of the budget is already assigned before states make local awards</h3>
              <p>STOP VAWA funding is divided into required categories:</p>
              <ul>
                <li>25% for law enforcement</li>
                <li>25% for prosecutors</li>
                <li>5% for courts</li>
                <li>30% for victim services</li>
                <li>15% discretionary</li>
              </ul>
              <p>
                That means 55% is reserved for police, prosecutors, and courts before the discretionary
                portion is considered.
              </p>
              <strong className="state-funding-emphasis">
                When the potential state administrative share is included, as much as 65% can be committed
                to justice-system institutions and state administration, while only 30% is guaranteed to
                the victim-services category.
              </strong>
            </section>

            <section>
              <h3>States decide which programs receive many of these funds</h3>
              <p>
                After receiving federal formula funding, state agencies distribute money through grants
                and other allocations. Depending on the funding stream, recipients can include:
              </p>
              <ul>
                <li>Local law enforcement agencies</li>
                <li>Prosecutors</li>
                <li>Courts</li>
                <li>Domestic violence shelters</li>
                <li>Victim-service organizations</li>
                <li>Legal-service programs</li>
                <li>Advocacy organizations</li>
                <li>Coalitions</li>
                <li>Other government or nonprofit programs</li>
              </ul>
              <p>
                So while Congress determines much of the federal funding structure, state governments
                play a major role in deciding which specific organizations and programs receive money
                within their state.
              </p>
            </section>

            <section>
              <h3>"Victim services" does not mean money given directly to survivors</h3>
              <p>
                Even when money is allocated to victim services, it can still be used to operate organizations
                and programs. Victim-service funding may pay for staff salaries, shelter operations, counseling,
                legal services, utilities, equipment, training, and other program expenses.
              </p>
              <p>Those services may be important, but the category does not tell the public how much money is ultimately spent on:</p>
              <ul>
                <li>Rent or hotel stays</li>
                <li>Transportation or relocation</li>
                <li>Food or clothing</li>
                <li>Direct financial assistance</li>
              </ul>
              <p>
                Those expenses are often blended together with organizational operating costs under broad
                categories such as "victim services."
              </p>
            </section>

            <section>
              <h3>The transparency problem</h3>
              <p>
                State reports can often tell the public how much money was awarded, which organizations
                received grants, and how many people were served. What they do not consistently show is how
                much of the domestic violence budget ultimately became direct material assistance to survivors.
              </p>
              <blockquote>
                After state administration, justice-system spending, program operations, salaries, and other
                institutional costs are paid, how much money actually reaches survivors in a form that directly
                helps them become safer, obtain housing, relocate, travel, eat, or rebuild their lives?
              </blockquote>
            </section>

            <section>
              <h3>The bottom line</h3>
              <p>
                State governments sit in the middle of the domestic violence funding system. They receive
                federal funding, administer portions of it, distribute grants, oversee programs, and help
                determine which institutions and organizations receive funding.
              </p>
              <p>
                But the amount a state reports as being spent "on domestic violence" should not automatically
                be interpreted as money spent directly on survivors. A large portion supports the institutions
                responsible for responding to domestic violence, and current public reporting does not consistently
                separate those system costs from the concrete assistance survivors actually receive.
              </p>
              <strong className="state-funding-emphasis">
                Funding a state domestic violence system and directly funding survivors are not the same thing.
              </strong>
            </section>
          </section>
        </article>
      ) : null}

      {activeSystem === "funding" ? (
        <article className="local-systems-page" aria-labelledby="local-funding-title">
          <section className="local-funding-summary" aria-labelledby="local-funding-title">
            <header>
              <span>LOCAL GOVERNMENT</span>
              <h2 id="local-funding-title">What Happens When Domestic Violence Funding Reaches the Local Level?</h2>
              <p>
                By the time domestic violence funding reaches a city, county, or community, much of its
                purpose has already been determined by federal law and state-level allocation decisions.
              </p>
            </header>

            <section>
              <h3>The local level is where funding becomes the system survivors actually interact with</h3>
              <p>
                Local recipients may include police departments, prosecutors' offices, courts, shelters,
                advocacy programs, legal-service organizations, and other community providers.
              </p>
            </section>

            <section>
              <h3>This is where the budget becomes services</h3>
              <p>Local agencies and organizations decide how their individual awards are used within the rules of their grants. That can mean paying for:</p>
              <ul>
                <li>Staff and advocates</li>
                <li>Shelter operations</li>
                <li>Local law-enforcement programs</li>
                <li>Prosecution and court programs</li>
                <li>Attorneys and legal assistance</li>
                <li>Counseling and case management</li>
                <li>Transportation or emergency assistance</li>
                <li>Other approved program expenses</li>
              </ul>
              <p>This is the point where a government budget becomes an actual local program.</p>
            </section>

            <section>
              <h3>Local spending determines what survivors can actually access</h3>
              <p>
                Two communities can receive domestic violence funding and still offer survivors very different
                experiences. One community may have significant shelter capacity, transportation assistance,
                legal help, or flexible emergency funding. Another may spend more heavily on justice-system
                programs, staffing, training, or services that do not address a survivor's immediate material needs.
              </p>
              <strong className="local-funding-emphasis">
                The amount of domestic violence funding available in a community does not necessarily tell a
                survivor what help will actually be available when they ask for it.
              </strong>
            </section>

            <section>
              <h3>Local governments and organizations are the last institutional layer</h3>
              <p>For most survivors, the local level is where the entire funding system either works or doesn't. This is where a survivor finds out whether there is:</p>
              <ul>
                <li>A shelter bed</li>
                <li>An advocate available</li>
                <li>Transportation</li>
                <li>Legal assistance</li>
                <li>Relocation help</li>
                <li>Emergency financial assistance</li>
                <li>Someone who can actually help solve the problem in front of them</li>
              </ul>
            </section>

            <section>
              <h3>The useful question</h3>
              <p className="local-funding-question">Not only: How much domestic violence funding did this community receive?</p>
              <strong className="local-funding-emphasis">What did that funding actually make available to survivors in this community?</strong>
            </section>
          </section>

          <article className="change-starts-locally" aria-labelledby="change-starts-locally-title">
            <header>
              <span>LOCAL ADVOCACY</span>
              <h2 id="change-starts-locally-title">Change Starts Locally</h2>
              <p>
                Local government has enormous influence over how domestic violence is handled in real life.
                City councils, county commissioners, sheriffs, police chiefs, prosecutors, judges, court
                administrators, boards, and committees shape enforcement, funding, policy, reporting,
                oversight, and the day-to-day response survivors actually receive.
              </p>
              <strong>That makes local advocacy one of the most direct ways to pressure the system to change.</strong>
            </header>

            <aside className="local-advocacy-safety-note">
              <strong>Protect your safety and privacy.</strong>
              <p>
                Public advocacy can expose names, accounts, locations, or personal history. Participate only
                in ways that feel safe, use safer contact information when needed, and do not publish details
                that could help an abusive person locate or monitor you.
              </p>
            </aside>

            <div className="local-advocacy-sections">
              <section>
                <span>01</span><h3>Find the decision-maker</h3>
                <p>Start with the person or body that actually controls the issue.</p>
                <p>
                  For law-enforcement policy, look at the sheriff, police chief, city council, county commission,
                  or whoever controls the department's budget and oversight. For prosecution, look at the district
                  or county attorney and the policies inside that office. For court procedure, look at the judge,
                  court administrator, or governing body with authority over that process.
                </p>
                <p>
                  For funding, contracts, grants, or program oversight, identify the board, committee, council,
                  or agency responsible for approving those decisions. The more specific you are about who has
                  authority, the harder it becomes for officials to pass responsibility around.
                </p>
              </section>

              <section>
                <span>02</span><h3>Connect the money to the policy</h3>
                <p>
                  Once you have traced the funding, use that information in the conversation. Some local positions,
                  training, programs, and operations are paid in whole or in part with federal dollars earmarked
                  for domestic violence. That creates a direct accountability issue when the same institution
                  accepts that funding while maintaining policies or practices that leave women unprotected.
                </p>
                <p>
                  An agency cannot reasonably point to domestic violence grants as proof that it is addressing the
                  problem while refusing to examine enforcement failures, weak policies, poor complaint handling,
                  or repeated patterns that put survivors at risk.
                </p>
                <p>
                  Officials who vote against stronger protections for women can still oversee institutions that
                  benefit financially from domestic violence funding. When that happens, the money and the policy
                  belong in the same public conversation.
                </p>
                <strong className="local-advocacy-emphasis">
                  If an institution benefits from funding that exists because women are being abused, the people
                  controlling that institution should be able to explain what that funding is producing.
                </strong>
              </section>

              <section>
                <span>03</span><h3>Ask questions that create a record</h3>
                <p>
                  Strong advocacy gets specific quickly. Ask who wrote the policy, when it was last reviewed, how
                  complaints are handled, what performance requirements are attached to the funding, how many cases
                  were declined, how many protection-order violations resulted in enforcement action, and who has
                  the authority to change the current practice.
                </p>
                <p>
                  These questions create answers that can be documented and compared with budgets, policies,
                  promises, and outcomes. Once an official answers in writing or on the record, there is something
                  concrete to return to.
                </p>
              </section>

              <section>
                <span>04</span><h3>Use public meetings strategically</h3>
                <p>
                  Public meetings matter because decisions are made there, budgets are approved there, contracts
                  are discussed there, and officials make statements that become part of the public record.
                </p>
                <p>
                  Watch agendas for public safety, victim services, police funding, court administration, grant
                  awards, nonprofit contracts, committee appointments, or policy changes. When relevant, bring the
                  issue into public comment or ask for it to be placed on the agenda.
                </p>
                <p>
                  A focused statement usually carries more weight than trying to explain the entire history in three
                  minutes. State the problem, connect it to the responsible agency or official, cite the record, and
                  ask for a specific action.
                </p>
              </section>

              <section>
                <span>05</span><h3>Make a concrete demand</h3>
                <p>
                  Officials respond differently when a request is specific enough to be acted on, denied, delayed,
                  or ignored. Ask for a policy review, an audit, publication of grant expenditures, an independent
                  complaint process, stronger enforcement procedures, survivor representation on a committee, or
                  changes in how an agency handles stalking, protection-order violations, or domestic violence reports.
                </p>
                <p>A clear demand gives you something measurable to follow up on later.</p>
              </section>

              <section>
                <span>06</span><h3>Keep the paper trail</h3>
                <p>
                  Follow important conversations in writing. Record who was contacted, what was requested, what they
                  said, what they agreed to do, and when they said they would do it. Save emails, meeting minutes,
                  letters, public statements, and agency responses.
                </p>
                <p>
                  A clean timeline becomes especially valuable when months pass, staff changes, or officials start
                  describing earlier conversations differently.
                </p>
              </section>

              <section>
                <span>07</span><h3>Track what officials actually do</h3>
                <p>
                  Public statements matter less than decisions. Votes, budgets, policy changes, complaint responses,
                  enforcement practices, and follow-through give you a clearer record of how an official or agency
                  actually handles domestic violence issues.
                </p>
                <p>
                  If someone publicly supports survivors while blocking oversight, voting against protections,
                  ignoring documented failures, or refusing to change a harmful policy, those actions belong beside
                  the public statement. The record speaks for itself.
                </p>
              </section>

              <section>
                <span>08</span><h3>Build pressure through consistency</h3>
                <p>
                  Local systems often count on public attention fading. A documented issue that keeps returning to
                  meetings, records requests, public discussion, reporters, and community conversations becomes
                  harder to bury over time.
                </p>
                <p>
                  Sustained pressure does not require constant confrontation. It requires consistency,
                  documentation, and a willingness to keep the same unresolved issue in front of the people
                  responsible for fixing it.
                </p>
              </section>

              <section>
                <span>09</span><h3>Work with other people</h3>
                <p>
                  Advocacy becomes stronger when the work is shared. Talk about these issues in third spaces like
                  Reddit, TikTok, Instagram, community groups, local meetings, and survivor networks. There are more
                  engaged survivors connected to one another now than ever before, and that changes how quickly
                  patterns can become visible.
                </p>
                <p>
                  Sharing a story, public record, policy failure, grant document, or voting record can help other
                  people understand what is happening in their communities. The more people who understand how the
                  local system works, the harder it becomes for the same failures to stay isolated and invisible.
                </p>
              </section>

              <section>
                <span>10</span><h3>Make inaction visible</h3>
                <p>
                  Local officials hold public power, and their decisions can be examined publicly. If an agency
                  receives domestic violence funding while protection orders go unenforced, stalking is minimized,
                  survivors are turned away, or policies remain unchanged after repeated failures, that connection
                  belongs in the public record.
                </p>
                <p>
                  Once a pattern is documented and attached to specific decisions, budgets, policies, and officials,
                  the issue becomes much harder to reduce to a private complaint. It becomes a question of public accountability.
                </p>
              </section>

              <section>
                <span>11</span><h3>Why local advocacy matters</h3>
                <p>
                  Local advocacy can change the conditions survivors encounter in real life. Policy reviews can lead
                  to different enforcement procedures. Budget pressure can change where money goes. Public scrutiny
                  can lead to audits, stronger reporting requirements, new oversight, leadership changes, and different
                  priorities inside an agency. Voting records and public decisions can also follow officials into
                  elections and future appointments.
                </p>
                <p>
                  None of those changes happen automatically, and local institutions rarely volunteer for scrutiny.
                  They change when enough pressure makes the current arrangement harder to defend.
                </p>
                <strong className="local-advocacy-emphasis">
                  The people making these decisions are public officials. The money they manage is public money.
                  The systems they control exist to serve the public. Survivors have every right to question them,
                  challenge them, and demand better.
                </strong>
              </section>
            </div>
          </article>
        </article>
      ) : null}

      {activeSystem === "audit" ? (
        <article className="nonprofit-audit-page" aria-labelledby="nonprofit-audit-title">
          <button className="systems-back-button" type="button" onClick={() => setActiveSystem("directory")}>
            Back to Systems
          </button>
          <header className="nonprofit-audit-header">
            <span>FINANCIAL RESEARCH GUIDE</span>
            <h2 id="nonprofit-audit-title">How to Audit a 501(c)(3)</h2>
            <p>How to review a domestic violence nonprofit, coalition, or service organization using public records.</p>
          </header>

          <section className="audit-intro">
            <p>
              Domestic violence nonprofits, coalitions, and service organizations often receive money from
              government grants, private foundations, donations, contracts, and other public funding streams.
              Public financial records can show where money comes from, how much an organization receives,
              how it reports spending, how much goes toward salaries and operations, and how much is distributed through programs.
            </p>
          </section>

          <div className="audit-steps">
            <section><span>01</span><h3>Start with the organization's legal name</h3><p>Find the full legal name, EIN, city and state, website, and any parent or affiliated organizations. The EIN is especially useful because a public-facing name may differ from the legal name in tax records.</p></section>
            <section><span>02</span><h3>Find the Form 990</h3><p>Most tax-exempt nonprofits file a Form 990 with the IRS each year. Search the IRS Tax Exempt Organization Search, ProPublica Nonprofit Explorer, or Candid. Start with three to five years when available so changes are easier to compare.</p></section>
            <section><span>03</span><h3>Record the main financial numbers</h3><ul><li><strong>Total revenue:</strong> money received that year.</li><li><strong>Total expenses:</strong> money spent that year.</li><li><strong>Total assets:</strong> cash, investments, property, and other reported assets.</li><li><strong>Total liabilities:</strong> debts and other obligations.</li><li><strong>Net assets:</strong> assets after liabilities.</li></ul><p>Write these numbers down for every year under review.</p></section>
            <section><span>04</span><h3>Find out where the money comes from</h3><p>Track government grants, private grants, donations, fundraising, program-service revenue, investment income, and other revenue. For government funding, record the amount and the agency that provided it whenever available.</p></section>
            <section><span>05</span><h3>Look at how expenses are reported</h3><p>Form 990 expenses are generally divided into program services, management and general, and fundraising. Program-service expenses can include salaries, advocates, counselors, attorneys, shelter operations, rent, utilities, transportation programs, software, contractors, training, administration, supplies, and direct assistance. Read schedules, notes, and financial statements for more detail.</p></section>
            <section><span>06</span><h3>Check executive and staff compensation</h3><p>Record executive director or CEO compensation, other highly compensated employees, benefits and additional compensation, compensation through related organizations, and changes from year to year.</p></section>
            <section><span>07</span><h3>Read the program descriptions</h3><p>Compare the organization's stated major programs and reported program spending with its website and annual reports. Look for emergency assistance, housing, shelter, transportation, relocation, legal help, counseling, advocacy, case management, and financial assistance.</p></section>
            <section><span>08</span><h3>Check Schedule I</h3><p>Schedule I reports certain grants and assistance given to organizations, governments, and individuals in the United States. Look for recipient names, amounts, grant purposes, assistance reported to individuals, and grants made to other organizations. When money passes to another nonprofit, review that organization's records too.</p></section>
            <section><span>09</span><h3>Look for related organizations</h3><p>Identify foundations, affiliated nonprofits, parent organizations, subsidiaries, related shelters, and other connected entities. Search each legal organization separately when tracing money through a larger network.</p></section>
            <section><span>10</span><h3>Find audited financial statements</h3><p>Search the organization's website for audited financial statements, annual reports, financial reports, audits, transparency, and accountability pages. Review government grants, restricted funds, program expenses, leases, liabilities, cash reserves, major contracts, and related-party transactions. Read the accompanying notes.</p></section>
            <section><span>11</span><h3>Compare several years</h3><p>Build a table with year, revenue, government grants, expenses, executive pay, program expenses, administration, and net assets. Add any categories relevant to the organization, then compare year by year.</p></section>
            <section><span>12</span><h3>Trace government grants</h3><p>Search VAWA, VOCA, FVPSA, state domestic violence grants, victim-services grants, and city, county, or state contracts. For every grant, record the funding agency, amount awarded, grant period, purpose, recipient, and spending restrictions. Compare those records with the Form 990 and financial statements.</p></section>
            <section><span>13</span><h3>Compare public claims with financial records</h3><p>Review the website, annual reports, fundraising campaigns, impact reports, press releases, and grant announcements. Write down specific services the organization says it provides, then look for those programs in its financial reporting. Preserve the original wording when documenting findings.</p></section>
            <section><span>14</span><h3>Request public financial records</h3><p>If a Form 990 is not online, request the organization's publicly available tax records directly. You do not need to provide a reason.</p><blockquote>I'm requesting a copy of your most recent Form 990 and other publicly available financial records.</blockquote></section>
            <section><span>15</span><h3>Keep a record of every source</h3><p>Save Form 990s, audited financial statements, grant awards, state funding records, annual reports, screenshots, public contracts, and organization webpages. Record the year and source for every number so it can be verified later.</p></section>
          </div>

          <section className="audit-money-trail">
            <span>BUILD THE MONEY TRAIL</span>
            <p>Where the money came from</p><b>to</b>
            <p>How much the organization received</p><b>to</b>
            <p>How the organization categorized its spending</p><b>to</b>
            <p>Which programs received funding</p><b>to</b>
            <p>Which expenses can be identified within those programs</p>
            <strong>Public funding should be traceable.</strong>
          </section>
        </article>
      ) : null}
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
  const baseContent = categoryFiles[category];
  const content = category === "advocacy"
    ? {
        title: "Assessments",
        intro: "Use an assessment to name patterns, understand what is affecting your choices, and find a practical place to begin.",
        files: categoryFiles.assessments.files,
      }
    : baseContent;
  const [activeModal, setActiveModal] = useState<CategoryFile["modal"] | null>(null);
  const guideCategories = category === "guides"
    ? resourceCategoryDefinitions
        .map((definition) => ({ ...definition, files: content.files.filter((file) => file.categoryId === definition.id) }))
        .filter((definition) => definition.files.length > 0)
    : [];

  function renderCategoryFile(file: CategoryFile) {
    return (
      <article className="category-file-card" key={file.title}>
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

  if (activeModal) {
    return (
      <section className="page-shell category-module assessment-workspace" aria-label="Assessment workspace">
        {activeModal === "love-or-fear" ? <LoveFearAssessmentModal onClose={() => setActiveModal(null)} /> : null}
        {activeModal === "freedom-test" ? <FreedomTestAssessmentModal onClose={() => setActiveModal(null)} /> : null}
        {activeModal === "coercive-control-map" ? <CoerciveControlPatternMapModal onClose={() => setActiveModal(null)} /> : null}
        {activeModal === "financial-captivity" ? <FinancialCaptivityAssessmentModal onClose={() => setActiveModal(null)} /> : null}
      </section>
    );
  }

  return (
    <section
      className="page-shell category-module"
      aria-label={category === "government" ? "Government" : undefined}
      aria-labelledby={category === "government" ? undefined : `${category}-title`}
    >
      {category !== "government" ? (
        <PageFlourishHeader
          eyebrow={category === "advocacy" ? "PRIVATE, IN-BROWSER ASSESSMENTS" : content.title}
          title={content.title}
          titleId={`${category}-title`}
          variant={category}
        >
          <p>{content.intro}</p>
        </PageFlourishHeader>
      ) : null}

      {category === "guides" ? (
        <div className="guide-category-directory">
          <section className="guide-assessment-entry" aria-labelledby="guide-assessment-entry-title">
            <div>
              <span>PRIVATE, IN-BROWSER TOOLS</span>
              <h2 id="guide-assessment-entry-title">Assessments</h2>
              <p>Name patterns, organize concerns, and find a practical place to begin. Answers stay in temporary browser state and are not saved or transmitted.</p>
            </div>
            <button type="button" onClick={() => onNavigate("advocacy", "/assessments")}>Open Assessments</button>
          </section>
          {guideCategories.map((guideCategory) => (
            <section className="guide-category-section" key={guideCategory.id}>
              <header>
                <div><span className="terminal-label">CATEGORY</span><h2>{guideCategory.label}</h2><p>{guideCategory.description}</p></div>
              </header>
              <div className="category-file-grid">{guideCategory.files.map(renderCategoryFile)}</div>
            </section>
          ))}
        </div>
      ) : <div className="category-file-grid">{content.files.map(renderCategoryFile)}</div>}
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
    headingRef.current?.focus();
  }, []);

  useEffect(() => { headingRef.current?.focus(); }, [phase, questionIndex]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAssessment();
      return;
    }
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
    <div className="assessment-modal-backdrop">
      <section aria-describedby="financial-captivity-description" aria-labelledby="financial-captivity-title" className="assessment-modal freedom-test-modal financial-captivity-modal" onKeyDown={handleKeyDown} ref={modalRef} role="region">
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">ANSWERS ARE NOT SAVED</span>
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
    headingRef.current?.focus();
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
    <div className="assessment-modal-backdrop">
      <section
        aria-describedby="pattern-map-description"
        aria-labelledby="pattern-map-title"
        className="assessment-modal freedom-test-modal pattern-map-modal"
        onKeyDown={handleKeyDown}
        ref={modalRef}
        role="region"
      >
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">ANSWERS ARE NOT SAVED</span>
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
    <div className="assessment-modal-backdrop">
      <section
        aria-describedby="freedom-test-description"
        aria-labelledby="freedom-test-title"
        className="assessment-modal freedom-test-modal"
        onKeyDown={handleModalKeyDown}
        ref={modalRef}
        role="region"
      >
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">ANSWERS ARE NOT SAVED</span>
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
    <div className="assessment-modal-backdrop">
      <section
        aria-labelledby="love-fear-modal-title"
        className="assessment-modal love-fear-modal"
        role="region"
      >
        <header className="assessment-modal-header">
          <div>
            <span className="terminal-label">ANSWERS ARE NOT SAVED</span>
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
              All answers stay in this browser tab only while this assessment is open. Leaving this assessment starts it over next time.
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
            <p className="love-fear-instruction">Choose the response that comes closest to your experience right now.</p>
            <blockquote className="love-fear-statement">{currentScoredItem.left}</blockquote>
            <fieldset className="love-fear-scale">
              <legend>How much do you agree or disagree with this statement?</legend>
              {[0, 1, 2, 3, 4].map((value) => (
                <label className={scores[currentScoredItem.id] === 4 - value ? "selected" : ""} key={value}>
                  <input
                    checked={scores[currentScoredItem.id] === 4 - value}
                    name={`score-${currentScoredItem.id}`}
                    onChange={() => chooseScore(4 - value)}
                    type="radio"
                    value={value}
                  />
                  <small>{value === 0 ? "Completely disagree" : value === 1 ? "Somewhat disagree" : value === 2 ? "Neither agree nor disagree" : value === 3 ? "Somewhat agree" : "Completely agree"}</small>
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
          <div className="terminal-label">PRIVATE REALITY CHECK</div>
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
            <span>{started ? "ANSWERS ARE NOT SAVED" : "NOT STARTED"}</span>
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
          <div className="terminal-label">WHAT THIS MAY MEAN</div>
          <h2>{activeResponse.pattern ?? "A healthier pattern may be present"}</h2>
          <TypedText
            className="system-typed-text"
            onDone={completeSystemTyping}
            skipLabel="Show Full Response"
            text={activeResponse.pattern
              ? `This answer may reflect ${activeResponse.pattern.toLowerCase()}. Notice whether it happens repeatedly, narrows your choices, or makes you manage the other person's reactions to stay safe or keep the peace.`
              : "This answer describes room for accountability, repair, and independent choice. What matters is whether that freedom and respect remain consistent over time."}
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
            <div className="terminal-label">TAKE A BREATH</div>
            <h2>A brief support break</h2>
            <p>You can pause without losing your place.</p>
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
          <div className="terminal-label">ASSESSMENT COMPLETE</div>
          <h2>You have more information. You do not need to make a final decision right now.</h2>
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
        <div className="terminal-label">Crisis Support</div>
        <h1 id="planning-landing-title">Crisis Support</h1>
        <p>
          Survivor Systems is not an emergency service and does not guide active escape
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
          <div className="screenshot-card-header"><span>{resource.status}</span></div>
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
          <p className="terminal-label">Benefits Guide</p>
          <h1 id="snap-tanf-title">How To Navigate SNAP &amp; TANF</h1>
          <p>
            Applying for benefits can feel overwhelming, especially when housing, money, safety,
            childcare, or transportation are already in motion. This guide breaks the system into
            steps: apply, document, interview, protect contact information, and follow up.
          </p>
        </div>
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
          The Premium Survivor Library holds the deeper Resource Navigation System: trackers for
          applications, case numbers, worker information, documents, deadlines, phone-call notes,
          local resources, and what to work on next.
        </p>
        <div className="terminal-actions denial-actions">
          <button type="button" onClick={() => onNavigate("library", "/resources")}>
            View Premium Survivor Library
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
    <EditorialPageTemplate
      className={`page-shell how-to-guide-page guide-${guide.id}`}
      eyebrow={`Resources / Guides / ${guide.terminalLabel}`}
      intro={<p>{guide.intro}</p>}
      quickMap={guide.quickMap}
      title={guide.title}
      titleId={`${guide.id}-title`}
    >
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
    </EditorialPageTemplate>
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
        eyebrow={activePriority ? `Guide section / ${activePriority.label}` : "Resources / How To Guides"}
        title="How To Guides"
        titleId="how-to-title"
        variant="resources"
      >
        <p>
          Practical guides are grouped by what may be most useful right now. Choose a section, then
          open the guide that matches your next step.
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
                  View Guides
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <>
          <div className="how-to-folder-bar">
            <div>
              <p className="terminal-label">GUIDE SECTION</p>
              <h2>{activePriority.title}</h2>
            </div>
            <button type="button" onClick={onBackToResources ?? (() => setActivePriorityId(null))}>
              {onBackToResources ? "Back To Resources" : "Back To Guide Sections"}
            </button>
          </div>

          <div className="how-to-guide-grid">
            {visibleGuides.map((guide, index) => (
              <article className="how-to-guide-card" key={guide.id}>
                <div className="how-to-guide-card-header">
                  <span>{String(index + 1).padStart(2, "0")}</span>
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

function getInitialResourceFolder(moduleKey: Exclude<ModuleKey, "home" | "go-bag-prep">): ResourceFolder {
  if (moduleKey === "how-to") return "landing";
  if (moduleKey === "legal") return "legal";
  if (moduleKey === "library") return "access";
  if (moduleKey === "access") return "access";
  return "landing";
}

function AccessInformationModule() {
  const requestedPreview = new URLSearchParams(window.location.search).get("preview") ?? "";
  return <LibraryModule initialSearch={requestedPreview} />;
}

function StateResourcesDirectory({ onSelect }: { onSelect: (location: StateResourceLocation) => void }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLocations = stateResourceLocations.filter((location) =>
    !normalizedQuery || location.name.toLowerCase().includes(normalizedQuery)
  );

  return (
    <section className="state-resource-directory" aria-labelledby="state-resource-directory-title">
      <header>
        <span>STATE-BY-STATE DIRECTORY</span>
        <h2 id="state-resource-directory-title">Find Programs Where You Live</h2>
        <p>
          Choose a state or Puerto Rico to find housing, food, childcare, transportation,
          disability, and other assistance programs available there.
        </p>
      </header>
      <label className="state-resource-search">
        Find your state or territory
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Start typing a location"
        />
      </label>
      <nav className="state-resource-grid" aria-label="State and territory resource pages">
        {visibleLocations.map((location) => (
          <a
            href={`/resources/states/${location.slug}`}
            key={location.slug}
            onClick={(event) => {
              event.preventDefault();
              onSelect(location);
            }}
          >
            {location.name}
          </a>
        ))}
      </nav>
      {visibleLocations.length === 0 ? <p className="state-resource-empty">No locations match that search.</p> : null}
    </section>
  );
}

function StateResourcePage({ location, onBack }: { location: StateResourceLocation; onBack: () => void }) {
  const programsByCategory = stateResourcePrograms[location.slug] ?? {};
  const hasPrograms = Object.values(programsByCategory).some((programs) => programs && programs.length > 0);
  const categories = getStateResourceCategories(location.slug);
  const stateDownloadUrl = location.downloadFile
    ? `${import.meta.env.VITE_SUPABASE_URL ?? "https://nwpqdpfhburdeprbfkqi.supabase.co"}/storage/v1/object/public/${encodeURIComponent("State Resources Bucket")}/${encodeURIComponent(location.downloadFile)}?download=${encodeURIComponent(location.downloadFile)}`
    : null;

  return (
    <section className="page-shell state-resource-page" aria-labelledby="state-resource-title">
      <PageFlourishHeader
        eyebrow="RESOURCES / STATE PROGRAMS"
        title={`${location.name} Resources`}
        titleId="state-resource-title"
        variant="resources"
      >
        <p>
          State-specific assistance programs organized by need, with practical access information,
          eligibility notes, service areas, and direct contact details.
        </p>
      </PageFlourishHeader>

      <div className="state-resource-top-actions">
        <button className="resource-back-button state-resource-back" type="button" onClick={onBack}>Back To All States</button>
        {stateDownloadUrl ? (
          <a className="state-resource-download-button" href={stateDownloadUrl}>
            <Download aria-hidden="true" size={20} strokeWidth={2.5} />
            Download State Info
          </a>
        ) : null}
        <a className="state-resource-review-button" href={`/resources/review-agency?state=${encodeURIComponent(location.name)}`}>Review An Agency</a>
      </div>

      {hasPrograms ? (
        <aside className="state-resource-verification" aria-label="Resource verification note">
          <strong>Information reviewed {location.reviewedOn ?? "recently"}</strong>
          <p>Funding, capacity, eligibility, and waitlists can change. Confirm current availability directly with the provider before relying on a program.</p>
        </aside>
      ) : null}

      <nav className="state-resource-category-nav" aria-label={`${location.name} resource categories`}>
        {categories.map((category) => (
          <a href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} key={category}>{category}</a>
        ))}
      </nav>

      <div className="state-resource-category-list" aria-label={`${location.name} resource categories`}>
        {categories.map((category) => {
          const programs = getProgramsForStateCategory(location.slug, category);
          return (
            <section key={category} id={category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
              <h2>{category}</h2>
              {programs.length > 0 ? (
                <div className="state-program-list">
                  {programs.map((program) => (
                    <article key={program.name}>
                      <h3>{program.name}</h3>
                      <p>{program.summary}</p>
                      <dl>
                        {program.fit ? <div><dt>Who it may fit</dt><dd>{program.fit}</dd></div> : null}
                        {program.access ? <div><dt>How to access it</dt><dd>{program.access}</dd></div> : null}
                        {program.coverage ? <div><dt>Service area</dt><dd>{program.coverage}</dd></div> : null}
                      </dl>
                      {program.note ? <p className="state-program-note">{program.note}</p> : null}
                      <div className="state-program-actions">
                        {program.phone ? <a href={`tel:${program.phone.replace(/[^0-9+]/g, "")}`}>Call {program.phone}</a> : null}
                        {program.secondaryPhone ? <a href={`tel:${program.secondaryPhone.replace(/[^0-9+]/g, "")}`}>Call {program.secondaryPhone}</a> : null}
                        {program.url ? <a href={program.url} target="_blank" rel="noreferrer">Official Website</a> : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p>Verified {location.name} programs and application information will be added here.</p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ResourceModule({
  moduleKey,
  onNavigate,
}: {
  moduleKey: Exclude<ModuleKey, "home" | "go-bag-prep">;
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
  const requestedStateSlug = window.location.pathname.startsWith("/resources/states/")
    ? window.location.pathname.replace("/resources/states/", "").split("/")[0]
    : null;
  const [activeStateSlug, setActiveStateSlug] = useState<string | null>(requestedStateSlug);
  const [activeDirectory, setActiveDirectory] = useState<string | null>(requestedDirectory || "housing");
  const isAgencyReview = window.location.pathname === "/resources/review-agency";
  const freeResourceLabels = new Set([
    "Housing Strategy System",
    "Housing Options",
    "How To Navigate Housing",
    "Family Court Guide",
    "Civil Protective Order Guide",
    "Motion Drafting Basics",
    "Understanding Crime Victim Compensation",
    "How To Navigate SNAP & TANF",
    "How To Live In Your Car",
    "How To Clear Your Browser History",
    "How To Create Routine While Life Is Chaotic",
    "How To Make A Safety Plan For Your Pet",
  ]);

  useEffect(() => {
    setActiveFolder(requestedGuide?.priority ?? getInitialResourceFolder(moduleKey));
    setGuideLaunch(requestedGuide ? { guideId: requestedGuide.id, priorityId: requestedGuide.priority } : null);
    setActiveDirectory(requestedDirectory || "housing");
    setActiveStateSlug(requestedStateSlug);
  }, [moduleKey, requestedDirectory, requestedGuide, requestedStateSlug]);

  useEffect(() => {
    const syncStateRoute = () => {
      const path = window.location.pathname;
      setActiveStateSlug(path.startsWith("/resources/states/")
        ? path.replace("/resources/states/", "").split("/")[0]
        : null);
    };
    window.addEventListener("popstate", syncStateRoute);
    return () => window.removeEventListener("popstate", syncStateRoute);
  }, []);

  const activeState = findStateResourceLocation(activeStateSlug);

  if (isAgencyReview) {
    const requestedStateName = new URLSearchParams(window.location.search).get("state") || "Your State";
    return <AgencyReviewForm stateName={requestedStateName} onBack={() => {
      const state = stateResourceLocations.find((item) => item.name === requestedStateName);
      window.history.pushState({}, "", state ? `/resources/states/${state.slug}` : "/resources");
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }} />;
  }

  if (activeState) {
    return (
      <StateResourcePage
        location={activeState}
        onBack={() => {
          window.history.pushState({}, "", "/resources");
          setActiveStateSlug(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

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

  if (activeDirectory === "housing-strategy") {
    return (
      <HousingStrategySystem
        onBack={() => {
          window.history.pushState({}, "", "/resources");
          setActiveDirectory("housing");
        }}
      />
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
          label: "Housing Strategy System",
          action: () => {
            window.history.pushState({}, "", "/resources/housing-strategy");
            setActiveDirectory("housing-strategy");
          },
        },
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
        {
          label: "Housing Assistance Tracker",
          action: () => {
            window.history.pushState({}, "", "/resources/access?preview=housing");
            setActiveFolder("access");
          },
        },
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
  void resourceDirectories;
  void freeResourceLabels;

  return (
    <section className="page-shell resources-module" aria-label="Resources">
      <PageFlourishHeader
        eyebrow="STATE-BY-STATE SUPPORT DIRECTORY"
        title="Resources"
        titleId="resources-title"
        variant="resources"
      >
        <p>
          Browse state-specific housing, food, childcare, transportation, disability, immigration,
          trafficking, and other assistance programs.
        </p>
      </PageFlourishHeader>

      <StateResourcesDirectory
        onSelect={(location) => {
          window.history.pushState({}, "", `/resources/states/${location.slug}`);
          setActiveStateSlug(location.slug);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <section className="resource-support-callout" aria-labelledby="resource-support-title">
        <div>
          <span>KEEP FREE RESOURCES AVAILABLE</span>
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
          support helps keep essential tools available while Survivor Systems continues to grow.
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

function SubscribeModule({ onNavigate }: { onNavigate: (module: ModuleKey, path: string) => void }) {
  const checkoutUrl = String(import.meta.env.VITE_STRIPE_SUBSCRIPTION_URL ?? "").trim();
  const [checkoutNotice, setCheckoutNotice] = useState("");

  function beginSubscription() {
    if (checkoutUrl) {
      window.location.assign(checkoutUrl);
      return;
    }
    setCheckoutNotice("Secure subscription checkout is being connected. You can still browse every library summary and preview.");
  }

  return (
    <CommercePageTemplate
      className="page-shell subscribe-module"
      eyebrow="Premium Survivor Library"
      intro={<p>One recurring subscription opens the complete collection of private planners, templates, trackers, and downloadable guides.</p>}
      title="Subscribe"
      titleId="subscribe-title"
    >
      <section className="subscribe-offer" aria-labelledby="subscribe-offer-title">
        <header>
          <span>MONTHLY ACCESS</span>
          <h2 id="subscribe-offer-title">The Complete Premium Survivor Library</h2>
          <p>Browse public summaries before subscribing. Once your subscription is active, sign in with your subscriber email to open and download the protected files.</p>
        </header>

        <div className="subscribe-benefits" aria-label="Subscription includes">
          <p><strong>Unlimited access</strong><span>View the full private library while your subscription is active.</span></p>
          <p><strong>Downloads included</strong><span>Open and download every resource included with Premium access.</span></p>
          <p><strong>Growing collection</strong><span>New planners, templates, trackers, and guides are included as they are published.</span></p>
          <p><strong>Cancel anytime</strong><span>Your subscription renews monthly until you cancel it.</span></p>
        </div>

        <div className="subscribe-actions">
          <button type="button" onClick={beginSubscription}>Continue to Secure Checkout</button>
          <button type="button" onClick={() => onNavigate("access", "/resources/access")}>Back to Library Previews</button>
        </div>
        {checkoutNotice ? <p className="subscribe-checkout-notice" role="status">{checkoutNotice}</p> : null}
      </section>
    </CommercePageTemplate>
  );
}

function LibraryModule({ initialSearch = "" }: { initialSearch?: string }) {
  const [catalog, setCatalog] = useState<SubscriberCatalogItem[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [catalogSearch, setCatalogSearch] = useState(initialSearch);
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [librarySession] = useState<LibrarySession | null>(() => readLibrarySession());
  const [libraryEmail, setLibraryEmail] = useState("");
  const [libraryAuthStatus, setLibraryAuthStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [openingResourceId, setOpeningResourceId] = useState<string | null>(null);
  const [libraryAccessMessage, setLibraryAccessMessage] = useState("");
  const [previewResource, setPreviewResource] = useState<SubscriberCatalogItem | null>(null);
  const [viewerResourceId, setViewerResourceId] = useState(() => new URLSearchParams(window.location.search).get("resource"));
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerStatus, setViewerStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (librarySession && params.get("checkout") === "success") {
      setLibraryAccessMessage("Your Premium access is ready. You can open or download any full resource below.");
    } else if (params.has("access_error")) {
      setLibraryAccessMessage("Checkout was completed, but access could not be confirmed yet. Use Restore Premium Access below with the email used at checkout.");
    }
  }, [librarySession]);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogStatus("loading");
    fetchSubscriberCatalog(controller.signal)
      .then((items) => {
        setCatalog(items);
        setCatalogStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCatalogStatus("error");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const syncViewerRoute = () => setViewerResourceId(new URLSearchParams(window.location.search).get("resource"));
    window.addEventListener("popstate", syncViewerRoute);
    return () => window.removeEventListener("popstate", syncViewerRoute);
  }, []);

  const catalogCategories = [...new Set(catalog.map((resource) => resource.category))].sort();
  const catalogCategoryCounts = catalogCategories.map((category) => ({
    category,
    count: catalog.filter((resource) => resource.category === category).length,
  }));
  const visibleCatalog = catalog.filter((resource) => {
    const query = catalogSearch.trim().toLowerCase();
    return (catalogCategory === "all" || resource.category === catalogCategory) &&
      (!query || `${resource.title} ${resource.category} ${resource.format}`.toLowerCase().includes(query));
  });
  const viewerResource = viewerResourceId ? catalog.find((resource) => resource.id === viewerResourceId) ?? null : null;

  useEffect(() => {
    if (!viewerResource || !librarySession) {
      setViewerUrl("");
      setViewerStatus("idle");
      return;
    }

    let cancelled = false;
    setViewerStatus("loading");
    createLibraryFileUrl(viewerResource.id, librarySession.accessToken)
      .then((url) => {
        if (cancelled) return;
        setViewerUrl(url);
        setViewerStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setViewerStatus("error");
      });
    return () => { cancelled = true; };
  }, [librarySession, viewerResource]);

  async function requestLibrarySignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = libraryEmail.trim();
    if (!email) return;
    setLibraryAuthStatus("sending");
    try {
      await sendLibraryMagicLink(email);
      setLibraryAuthStatus("sent");
    } catch {
      setLibraryAuthStatus("error");
    }
  }

  async function openLibraryResource(resource: SubscriberCatalogItem) {
    if (!librarySession) {
      setLibraryAccessMessage("Subscribe or restore Premium access on this device before opening the full resource.");
      return;
    }
    setOpeningResourceId(resource.id);
    setLibraryAccessMessage("");
    try {
      const url = await createLibraryFileUrl(resource.id, librarySession.accessToken);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setLibraryAccessMessage(error instanceof Error ? error.message : "The protected file could not be opened.");
    } finally {
      setOpeningResourceId(null);
    }
  }

  function promptLibraryAccess() {
    setLibraryAccessMessage("Already subscribed? Restore access with the email used at checkout. New subscribers can start with the Subscribe button.");
    document.getElementById("library-subscriber-sign-in-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showLibrarySummary(resource: SubscriberCatalogItem) {
    setPreviewResource(resource);
    window.requestAnimationFrame(() => {
      document.getElementById("library-public-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function viewFullResource(resource: SubscriberCatalogItem) {
    const params = new URLSearchParams({ resource: resource.id });
    window.history.pushState({}, "", `/resources/access/view?${params.toString()}`);
    setViewerResourceId(resource.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToPremiumIndex() {
    window.history.pushState({}, "", "/resources/access");
    setViewerResourceId(null);
    setViewerUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadUrl(url: string, resource: SubscriberCatalogItem) {
    const separator = url.includes("?") ? "&" : "?";
    const extension = resource.id.split(".").pop() || resource.format.toLowerCase();
    const filename = `${resource.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.${extension}`;
    return `${url}${separator}download=${encodeURIComponent(filename)}`;
  }

  if (librarySession && viewerResourceId) {
    return (
      <CommercePageTemplate
        className="page-shell library-module library-document-page"
        eyebrow="Premium Survivor Library / Document"
        intro={<p>{viewerResource?.preview ?? "Opening your protected library document."}</p>}
        title={viewerResource?.title ?? "Premium Library Document"}
        titleId="library-document-title"
      >
        <div className="library-document-toolbar">
          <button type="button" onClick={returnToPremiumIndex}>Back to Premium Library</button>
          {viewerStatus === "ready" && viewerUrl && viewerResource ? (
            <a href={downloadUrl(viewerUrl, viewerResource)}>Download Document</a>
          ) : null}
        </div>
        {catalogStatus === "loading" || viewerStatus === "loading" ? <p className="library-catalog-status" role="status">Opening the protected document...</p> : null}
        {catalogStatus === "ready" && !viewerResource ? <p className="library-catalog-status library-catalog-error" role="alert">This document is not listed in the Premium Survivor Library.</p> : null}
        {viewerStatus === "error" ? <p className="library-catalog-status library-catalog-error" role="alert">This document could not be opened. Return to the library and try again.</p> : null}
        {viewerStatus === "ready" && viewerUrl && viewerResource ? (
          <section className="library-document-reader" aria-label={`${viewerResource.title} document viewer`}>
            <ProtectedDocumentViewer resource={viewerResource} url={viewerUrl} />
          </section>
        ) : null}
      </CommercePageTemplate>
    );
  }

  if (librarySession) {
    return (
      <CommercePageTemplate
        className="page-shell library-module library-subscriber-index"
        eyebrow="Resources / Premium Library"
        intro={<p>Select any title to read the document in your browser or download a copy.</p>}
        title="Premium Survivor Library"
        titleId="library-title"
      >
        <div className="library-access-active">
          <strong>Premium access is active</strong>
          <span>{librarySession.email ?? "Subscriber access"}</span>
        </div>
        {libraryAccessMessage ? <p className="library-catalog-status" role="status">{libraryAccessMessage}</p> : null}
        {catalogStatus === "loading" ? <p className="library-catalog-status" role="status">Loading your Premium library...</p> : null}
        {catalogStatus === "error" ? <p className="library-catalog-status library-catalog-error" role="alert">The library could not be reached. Please refresh the page.</p> : null}
        {catalogStatus === "ready" ? (
          <div className="library-subscriber-list">
            {catalog.map((resource) => (
              <article key={resource.id}>
                <div>
                  <span>{resource.category} / {resource.format}</span>
                  <h2>
                    <a
                      href={`/resources/access/view?${new URLSearchParams({ resource: resource.id }).toString()}`}
                      onClick={(event) => { event.preventDefault(); viewFullResource(resource); }}
                    >
                      {resource.title}
                    </a>
                  </h2>
                </div>
                <p>{resource.preview}</p>
              </article>
            ))}
          </div>
        ) : null}
      </CommercePageTemplate>
    );
  }

  return (
    <CommercePageTemplate
        className="page-shell library-module"
        eyebrow="Resources / Library"
        intro={<p>
          Free guides stay available under Resources. The Premium Survivor Library holds deeper templates,
          trackers, guides, and long-form systems in one recurring subscription.
        </p>}
        title="Premium Survivor Library"
        titleId="library-title"
      >

      <div className="library-rule-strip" aria-label="Library rules">
        <span>Unlimited Viewing</span>
        <span>Subscriber Downloads</span>
        <span>New Resources Added</span>
        <span>Cancel Anytime</span>
      </div>

      <section className="library-section" aria-labelledby="library-options-title">
        <div className="terminal-label">PREMIUM SURVIVOR LIBRARY</div>
        <h2 id="library-options-title">Premium Access</h2>
        <div className="library-pass-grid">
          {libraryPasses.map((pass) => (
            <article className="library-pass-card" key={pass.id}>
              <div className="library-card-header">
                <span>{pass.price}</span>
                <small>MONTHLY SUBSCRIPTION</small>
              </div>
              <h3>{pass.title}</h3>
              <p>{pass.scope}</p>
              <ul>
                <li>{pass.viewing}</li>
                <li>{pass.unlocks}</li>
                <li>{pass.renewal}</li>
              </ul>
              <button type="button" onClick={() => window.location.assign("/subscribe")}>
                Subscribe to Premium
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="library-section" aria-labelledby="library-categories-title">
        <div className="terminal-label">LIBRARY INDEX</div>
        <h2 id="library-categories-title">Indexed Categories</h2>
        <div className="library-category-grid">
          {catalogCategoryCounts.map(({ category, count }) => (
            <article className="library-category-card" key={category}>
              <span>{String(count).padStart(2, "0")} RESOURCES</span>
              <h3>{category}</h3>
              <p>Browse previews and access details for {category} resources.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="library-section" aria-labelledby="library-preview-title">
        <div className="terminal-label">RESOURCE PREVIEWS</div>
        <h2 id="library-preview-title">Look Inside Before Subscribing</h2>
        <p>Every visitor can browse and preview every resource indexed in the Survivor Systems library. No sign-in is required for previews.</p>
        {catalogStatus === "loading" ? <p className="library-catalog-status" role="status">Loading the Premium Survivor Library catalog...</p> : null}
        {catalogStatus === "error" ? <p className="library-catalog-status library-catalog-error" role="alert">The live library catalog could not be reached. No private files were exposed.</p> : null}
        {catalogStatus === "ready" ? (
          <>
            <div className="library-catalog-tools">
              <label>
                Search catalog
                <input type="search" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Search titles, categories, or formats" />
              </label>
              <label>
                Category
                <select value={catalogCategory} onChange={(event) => setCatalogCategory(event.target.value)}>
                  <option value="all">All categories</option>
                  {catalogCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <p><strong>{visibleCatalog.length}</strong> of {catalog.length} previews</p>
            </div>
            {previewResource ? (
              <section id="library-public-preview" className="library-public-preview" aria-labelledby="library-public-preview-title">
                {libraryPreviewImage(previewResource) ? (
                  <figure className="library-document-preview">
                    <img src={libraryPreviewImage(previewResource) ?? undefined} alt="First page preview of the blank proposed order" />
                    <figcaption>First page preview</figcaption>
                  </figure>
                ) : (
                  <div className="library-public-preview-mark" aria-hidden="true">
                    <strong>{previewResource.format}</strong>
                    <span>PUBLIC PREVIEW</span>
                  </div>
                )}
                <div>
                  <span>{previewResource.category}</span>
                  <h3 id="library-public-preview-title"><a href="/subscribe">{previewResource.title}</a></h3>
                  <p>{previewResource.preview}</p>
                  <dl>
                    <div><dt>Format</dt><dd>{previewResource.format}</dd></div>
                    <div><dt>File size</dt><dd>{formatCatalogFileSize(previewResource.fileSizeBytes)}</dd></div>
                    <div><dt>Full access</dt><dd>{previewResource.access}</dd></div>
                  </dl>
                  <div className="library-public-preview-actions">
                    <button type="button" onClick={() => setPreviewResource(null)}>Close Preview</button>
                    {librarySession ? (
                      <button type="button" onClick={() => openLibraryResource(previewResource)} disabled={openingResourceId === previewResource.id}>
                        {openingResourceId === previewResource.id ? "Opening..." : "Open or Download Full Resource"}
                      </button>
                    ) : (
                      <button type="button" onClick={promptLibraryAccess}>Restore Premium Access</button>
                    )}
                  </div>
                </div>
              </section>
            ) : null}
            <div className="library-preview-grid">
          {visibleCatalog.map((resource) => (
            <article className="library-preview-card" key={resource.id}>
              {libraryPreviewImage(resource) ? (
                <div className="library-preview-frame library-preview-frame-document">
                  <img src={libraryPreviewImage(resource) ?? undefined} alt="Preview of the blank proposed order" />
                  <span>PREVIEW</span>
                </div>
              ) : (
                <div className="library-preview-frame" aria-hidden="true">
                  <strong>{resource.format}</strong>
                  <span>PREVIEW</span>
                  <small>{formatCatalogFileSize(resource.fileSizeBytes)}</small>
                </div>
              )}
              <div>
                <span className="library-resource-format">{resource.format}</span>
                <h3><a href="/subscribe">{resource.title}</a></h3>
                <p>{resource.preview}</p>
                <small>{resource.category}</small>
                <p className="library-access-note">{resource.access}</p>
                <div className="library-preview-actions">
                  <button type="button" onClick={() => showLibrarySummary(resource)}>View Summary</button>
                  {librarySession ? (
                    <button type="button" onClick={() => openLibraryResource(resource)} disabled={openingResourceId === resource.id}>
                      {openingResourceId === resource.id ? "Opening..." : "Open or Download Full Resource"}
                    </button>
                  ) : (
                    <button type="button" onClick={promptLibraryAccess}>Restore Premium Access</button>
                  )}
                </div>
              </div>
            </article>
          ))}
            </div>
            {visibleCatalog.length === 0 ? <p className="library-catalog-status">No previews match those filters.</p> : null}
          </>
        ) : null}

        <section className="library-sign-in-panel" aria-labelledby="library-subscriber-sign-in-title">
          <h3 id="library-subscriber-sign-in-title">Restore Premium Access</h3>
          <p>Checkout unlocks the library automatically. On a different browser or device, use the email from checkout to restore access. Public summaries above never require an account.</p>
          <form onSubmit={requestLibrarySignIn}>
            <label>
              Subscriber email
              <input type="email" autoComplete="email" required value={libraryEmail} onChange={(event) => setLibraryEmail(event.target.value)} />
            </label>
            <button type="submit" disabled={libraryAuthStatus === "sending"}>
              {libraryAuthStatus === "sending" ? "Sending Link..." : "Email My Access Link"}
            </button>
            {libraryAuthStatus === "sent" ? <p role="status">Check your email, then use the link to restore the library on this device.</p> : null}
            {libraryAuthStatus === "error" ? <p role="alert">The access link could not be sent. Confirm this is the email used at Premium checkout.</p> : null}
          </form>
          {libraryAccessMessage ? <p className="library-catalog-status library-catalog-error" role="alert">{libraryAccessMessage}</p> : null}
        </section>
      </section>

    </CommercePageTemplate>
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
        eyebrow="Resources / Housing Guide"
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

      <section className="housing-page-summary" aria-labelledby="housing-page-summary-title">
        <div>
          <p className="housing-summary-label">WHAT'S ON THIS PAGE</p>
          <h2 id="housing-page-summary-title">A practical guide to navigating housing systems</h2>
          <p>
            Learn where to begin, what to ask, which records to keep, and how to follow up across
            housing programs. The Housing Assistance Tracker is a separate tool in the Premium Survivor Library.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("access", "/resources/access?preview=housing")}
        >
          Preview Subscriber Housing Tools
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
        <p className="housing-summary-label">KEY TAKEAWAY</p>
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
              Back to Housing Resources
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
    <EditorialPageTemplate
      className="page-shell legal-module legal-guide-shell"
      eyebrow={guide.eyebrow.replaceAll("//", "/")}
      intro={<p>{guide.intro}</p>}
      title={guide.title}
      titleId={`${guide.title.replaceAll(" ", "-").toLowerCase()}-title`}
      tone="blue"
    >

        <div className="legal-warning">
          <strong> Not Legal Advice</strong>
          <p>{guide.warning}</p>
        </div>

        <section className="legal-motion-section" aria-label={`${guide.title} sections`}>
          <div className="legal-motion-grid">
            {guide.sections.map((section, sectionIndex) => (
              <section className="legal-article-section" key={section.title}>
                <article className="legal-motion-card">
                  <h3>
                    {section.title}
                    {section.tag ? <span>{section.tag}</span> : null}
                  </h3>
                  {section.blocks.map((block) => (
                    <div className="legal-motion-block" key={block.title}>
                      <strong>{block.title}</strong>
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
                {guide.notes?.[sectionIndex] ? (
                  <aside className="legal-note legal-note-inline">
                    <span>OF NOTE</span>
                    <strong>{guide.notes[sectionIndex].title}</strong>
                    <p>{guide.notes[sectionIndex].body}</p>
                  </aside>
                ) : null}
              </section>
            ))}
          </div>
        </section>

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
    </EditorialPageTemplate>
  );
}

function LegalModule() {
  const [activeView, setActiveView] = useState<"landing" | "motion-drafting" | "protective-orders" | "family-court-guide">(
    "landing",
  );

  if (activeView === "motion-drafting") {
    return (
      <EditorialPageTemplate
        className="page-shell legal-module legal-guide-shell"
        eyebrow="Resources / Legal / Family Court"
        intro={<p>
            A motion is just a written request asking the court to do something. Before you write
            one word, you need to know which one you are actually filing. The wrong motion can get
            you a denial or delay instead of a hearing. This module starts where every filing
            should: research.
          </p>}
        title="Motion Drafting Basics"
        titleId="motion-drafting-title"
        tone="blue"
      >

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
            <h2 id="motion-step-title">Research Before You Write</h2>
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
              <strong> Premium Survivor Library Connection</strong>
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
      </EditorialPageTemplate>
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
      <PageFlourishHeader eyebrow="Resources / Legal" title="Legal Resources" titleId="legal-title" variant="legal">
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
    if (activeModule !== "planning" && activeModule !== "go-bag-prep") {
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
  ) : activeModule === "about" ? (
    <AboutModule onNavigate={navigate} />
  ) : activeModule === "government" ? (
    <SystemsModule />
  ) : activeModule === "assessments" ||
    activeModule === "guides" ||
    activeModule === "education" ||
    activeModule === "advocacy" ? (
    <CategoryModule category={activeModule} onNavigate={navigate} />
  ) : activeModule === "go-bag-prep" ? (
    <PlanningModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
  ) : activeModule === "planning" ? (
    <PlanningModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
  ) : activeModule === "rebuilding" ? (
    <RebuildingModule onNavigate={navigate} />
  ) : activeModule === "support" ? (
    <SupportModule onNavigate={navigate} />
  ) : activeModule === "subscribe" ? (
    <SubscribeModule onNavigate={navigate} />
  ) : activeModule === "store" ? (
    <StoreModule />
  ) : activeModule === "local-help" || activeModule === "how-to" || activeModule === "legal" || activeModule === "library" ? (
    <ResourceModule moduleKey={activeModule} onNavigate={navigate} />
  ) : (
    <ResourceModule moduleKey={activeModule} onNavigate={navigate} />
  );

  return (
    <SiteChrome activeModule={loadingModule ?? activeModule} onNavigate={navigate}>
      {loadingModule && loadingLabel ? (
        <ModuleLoading label={loadingLabel} />
      ) : (
        moduleContent
      )}
    </SiteChrome>
  );
}
