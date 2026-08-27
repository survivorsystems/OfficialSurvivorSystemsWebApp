import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, ExternalLink, Printer, RotateCcw, Search } from "lucide-react";
import { housingResources, type HousingResource } from "../data/housing";
import {
  buildHousingActionPlan,
  emptyHousingAnswers,
  humanizeHousingTag,
  matchHousingResources,
  type HousingAssessmentAnswers,
  type HousingMatch,
} from "../lib/housingStrategy";

type View = "landing" | "browse" | "assessment" | "results";
type MultiKey = "statuses" | "goals" | "assistance" | "abuseConnections" | "circumstances" | "incomeSources" | "barriers" | "flexibility";
type Option = { value: string; label: string };

const statusOptions: Option[] = [
  ["currently_housed", "I have housing and want to keep it"], ["unsafe_housing", "I have housing, but it does not feel safe"],
  ["behind_on_housing_costs", "I'm behind on rent or utilities"], ["at_risk_of_homelessness", "I may lose my housing soon"],
  ["temporary_stay", "I'm temporarily staying with someone"], ["shelter_or_transitional_housing", "I'm staying in a shelter or transitional housing"],
  ["vehicle_motel_unsheltered", "I'm staying in a motel, vehicle, or unsheltered"], ["experiencing_homelessness", "I'm currently experiencing homelessness"],
  ["needs_relocation", "I need to relocate"], ["stable_housing", "My housing is stable right now"],
].map(([value, label]) => ({ value, label }));

const goalOptions: Option[] = [
  ["keep_current_housing", "Keep my current housing"], ["prevent_homelessness", "Prevent eviction or housing loss"], ["relocate_safely", "Move somewhere safer"],
  ["affordable_rent", "Find affordable rent"], ["subsidized_housing", "Find subsidized housing"], ["housing_search", "Find housing that accepts my voucher"],
  ["monthly_rent_help", "Get help with monthly rent"], ["move_in_costs", "Get help with deposits or move-in costs"], ["temporary_housing", "Find temporary housing"],
  ["permanent_housing", "Find permanent housing"], ["relocate", "Move to another area"], ["homeownership", "Explore homeownership"],
  ["disability_accessibility", "Find accessible housing"], ["unsure", "I'm not sure yet"],
].map(([value, label]) => ({ value, label }));

const assistanceOptions: Option[] = [
  ["hcv", "Housing Choice Voucher / Section 8"], ["pbv", "Project-Based Voucher"], ["public_housing", "Public housing"],
  ["pbra", "Project-Based Rental Assistance or subsidized apartment"], ["usda", "USDA / Rural Development housing"],
  ["other", "Other housing assistance"], ["none", "No"], ["unsure", "I'm not sure"],
].map(([value, label]) => ({ value, label }));

const circumstanceOptions: Option[] = [
  ["family_with_children", "Children under 18 live in the household"], ["child_welfare_involved", "Child welfare is currently involved"],
  ["disability", "An adult household member has a disability"], ["age_62_plus", "Someone is age 62 or older"], ["veteran", "Someone is a veteran"],
  ["foster_youth", "Someone is transitioning out of foster care"], ["experiencing_homelessness", "The household is experiencing homelessness"],
].map(([value, label]) => ({ value, label }));

const barrierOptions: Option[] = [
  ["security_deposit", "Security deposit"], ["first_month_rent", "First month's rent"], ["application_fee", "Application fees"], ["utility_deposit", "Utility deposits"],
  ["bad_credit", "Bad credit"], ["no_credit", "No credit"], ["eviction_history", "Eviction history"], ["criminal_record", "Criminal record"],
  ["no_rental_history", "No rental history"], ["irregular_income", "Irregular income"], ["no_employment", "No employment"],
  ["disability_accessibility", "Disability or accessibility needs"], ["pets", "Pets or service animal"], ["transportation", "Transportation"],
  ["missing_documents", "Missing identification or documents"], ["no_bank_account", "No bank account"],
  ["landlord_voucher_acceptance", "Landlords will not accept my voucher"], ["monthly_rent_affordability", "Housing costs are too high"],
  ["housing_search", "I don't know where to search"], ["other", "Other"], ["none", "None of these"],
].map(([value, label]) => ({ value, label }));

const incomeOptions: Option[] = [
  ["employment", "Employment"], ["self_employment", "Self-employment"], ["ssi", "SSI"], ["ssdi", "SSDI"], ["social_security", "Social Security"],
  ["child_support", "Child support"], ["tanf", "TANF"], ["unemployment", "Unemployment"], ["pension", "Pension or retirement"],
  ["none", "No current income"], ["other", "Other"], ["prefer_not", "Prefer not to answer"],
].map(([value, label]) => ({ value, label }));

const flexibilityOptions: Option[] = [
  ["neighborhood", "I need to stay in my current neighborhood"], ["city", "I need to stay in my current city"], ["county", "I can move within my county"],
  ["nearby_counties", "I can consider nearby counties"], ["state", "I can move elsewhere in my state"], ["another_state", "I would consider another state"],
  ["rural", "I would consider a rural area"], ["flexible", "I'm flexible"], ["unsure", "I'm not sure"],
].map(([value, label]) => ({ value, label }));

const abuseConnectionOptions: Option[] = [
  ["lives_with_me", "Lives with me"], ["on_lease", "Is on my lease"], ["knows_location", "Knows where I live"],
  ["housing_interference", "Controls or interferes with rent or housing"], ["property_control", "Owns or manages the property"],
  ["relocation_reason", "Is creating a reason I need to relocate"], ["none", "None of these"], ["unsure", "I'm not sure"], ["prefer_not", "Prefer not to answer"],
].map(([value, label]) => ({ value, label }));

const categories: Array<{ id: string; label: string; matches: (resource: HousingResource) => boolean }> = [
  { id: "all", label: "All resources", matches: () => true },
  { id: "rentals", label: "Affordable Rentals", matches: (r) => r.housingGoals.some((g) => ["affordable_rent", "subsidized_housing"].includes(g)) },
  { id: "stability", label: "Housing Stability", matches: (r) => r.housingGoals.some((g) => ["keep_current_housing", "prevent_homelessness"].includes(g)) },
  { id: "survivor", label: "Survivor Housing", matches: (r) => r.populationTags.some((t) => ["domestic_violence", "dating_violence", "sexual_assault", "stalking"].includes(t)) },
  { id: "rights", label: "Rights & Protections", matches: (r) => r.resourceKind === "housing_protection" },
  { id: "disability", label: "Disability Housing", matches: (r) => r.populationTags.some((t) => t.includes("disability")) },
  { id: "family", label: "Family & Youth", matches: (r) => r.populationTags.some((t) => ["family_with_children", "child_welfare_involved", "foster_youth"].includes(t)) },
  { id: "rural", label: "Rural Housing", matches: (r) => r.geographicScope === "rural_eligible_area" },
  { id: "homeownership", label: "Homeownership", matches: (r) => r.housingGoals.includes("homeownership") },
  { id: "search", label: "Places to Search", matches: (r) => r.resourceKind === "search_pathway" },
];

function MultiChoice({ options, selected, onToggle }: { options: Option[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div className="housing-choice-grid">{options.map((option) => {
    const active = selected.includes(option.value);
    return <button aria-pressed={active} className={active ? "selected" : ""} key={option.value} type="button" onClick={() => onToggle(option.value)}>
      <span className="housing-choice-check">{active ? <Check size={18} /> : null}</span><span>{option.label}</span>
    </button>;
  })}</div>;
}

function ResourceCard({ resource, onOpen }: { resource: HousingResource; onOpen: () => void }) {
  return <article className="housing-resource-card">
    <div className="housing-resource-meta"><span>{humanizeHousingTag(resource.resourceKind)}</span><small>{humanizeHousingTag(resource.geographicScope)}</small></div>
    <h3>{resource.name}</h3><p>{resource.userFacingSummary}</p>
    <div className="housing-tag-list">{resource.housingGoals.slice(0, 4).map((goal) => <span key={goal}>{humanizeHousingTag(goal)}</span>)}</div>
    <p className="housing-resource-note">{resource.requiresLocalImplementation ? "Local implementation must be confirmed" : resource.federalProgram ? "Federal pathway" : "Availability varies by location"}</p>
    <button type="button" onClick={onOpen}>View Details <ChevronRight size={18} /></button>
  </article>;
}

function ResourceDetail({ resource, onBack }: { resource: HousingResource; onBack: () => void }) {
  return <article className="housing-detail">
    <button className="resource-back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> Back to resources</button>
    <p className="housing-kicker">{humanizeHousingTag(resource.resourceKind)}</p><h2>{resource.name}</h2>
    <section><h3>What this is</h3><p>{resource.userFacingSummary}</p></section>
    <section><h3>What it may help with</h3><div className="housing-tag-list">{[...resource.housingGoals, ...resource.assistanceTypes].map((item) => <span key={item}>{humanizeHousingTag(item)}</span>)}</div></section>
    <section><h3>Who should look into it</h3><p>This may be worth checking if its purpose and circumstances match yours. {resource.eligibilityDetermination === "not_an_eligibility_program" ? "This is a search pathway, not an eligibility decision." : "The administering program or property must confirm eligibility."}</p></section>
    <section><h3>How to access it</h3><p>{resource.accessModels.map(humanizeHousingTag).join("; ")}.</p></section>
    {resource.questionToAsk ? <section className="housing-question-callout"><h3>What to ask</h3><blockquote>{resource.questionToAsk}</blockquote></section> : null}
    <section><h3>Important limitations</h3><ul>{resource.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>
    <a className="button housing-source-link" href={resource.sourceUrl} target="_blank" rel="noreferrer">Official source: {resource.officialSourceName} <ExternalLink size={17} /></a>
  </article>;
}

function MatchCard({ match }: { match: HousingMatch }) {
  return <article className="housing-match-card">
    <p className="housing-kicker">{humanizeHousingTag(match.resource.resourceKind)}</p><h3>{match.resource.name}</h3>
    <div className="housing-match-reasons">{match.reasons.map((reason) => <span key={reason}>{reason}</span>)}</div>
    <h4>What it may help with</h4><p>{match.resource.userFacingSummary}</p>
    <h4>What to do next</h4><p>{match.resource.questionToAsk ?? `Contact the administering organization and ask whether this resource is available in your area.`}</p>
    {match.resource.questionToAsk ? <blockquote><strong>Ask:</strong> {match.resource.questionToAsk}</blockquote> : null}
    {match.missingPrerequisites.length ? <p className="housing-caution">This pathway has requirements that your answers did not confirm: {match.missingPrerequisites.map(humanizeHousingTag).join(", ")}.</p> : null}
    <details><summary>Important limitations</summary><ul>{match.resource.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>
    <a href={match.resource.sourceUrl} target="_blank" rel="noreferrer">Official source <ExternalLink size={15} /></a>
  </article>;
}

function LegacyHousingStrategySystem({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("browse");
  const [answers, setAnswers] = useState<HousingAssessmentAnswers>({ ...emptyHousingAnswers });
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [needFilter, setNeedFilter] = useState("");
  const [situationFilter, setSituationFilter] = useState("");
  const [populationFilter, setPopulationFilter] = useState("");
  const [detail, setDetail] = useState<HousingResource | null>(null);

  const matches = useMemo(() => matchHousingResources(housingResources, answers), [answers]);
  const actionPlan = useMemo(() => buildHousingActionPlan(matches), [matches]);
  const visibleResources = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const categoryRule = categories.find((item) => item.id === category) ?? categories[0];
    return housingResources.filter((resource) => {
      const searchable = [resource.name, resource.shortName, resource.userFacingSummary, ...resource.assistanceTypes, ...resource.housingGoals, ...resource.barrierTags, ...resource.populationTags].filter(Boolean).join(" ").toLowerCase();
      return categoryRule.matches(resource) && (!normalized || searchable.includes(normalized)) && (!needFilter || resource.housingGoals.includes(needFilter) || resource.barrierTags.includes(needFilter)) && (!situationFilter || resource.housingStatuses.includes(situationFilter)) && (!populationFilter || resource.populationTags.includes(populationFilter));
    });
  }, [category, needFilter, populationFilter, search, situationFilter]);

  function toggle(key: MultiKey, value: string) {
    setAnswers((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  }

  function reset() { setAnswers({ ...emptyHousingAnswers }); setStep(0); setView("landing"); }
  function finishAssessment() { setView("results"); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const questions = [
    { title: "Which of these describe your housing situation right now?", content: <MultiChoice options={statusOptions} selected={answers.statuses} onToggle={(v) => toggle("statuses", v)} /> },
    { title: "What would you like help accomplishing?", content: <MultiChoice options={goalOptions} selected={answers.goals} onToggle={(v) => toggle("goals", v)} /> },
    { title: "How soon do you need another housing option or solution?", content: <MultiChoice options={[["immediate","Today or immediately"],["seven_days","Within 7 days"],["thirty_days","Within 30 days"],["one_to_three_months","Within 1-3 months"],["stable","I'm stable for now"]].map(([value,label])=>({value,label}))} selected={answers.urgency ? [answers.urgency] : []} onToggle={(v) => setAnswers((a) => ({...a, urgency: v as HousingAssessmentAnswers["urgency"]}))} /> },
    { title: "Where are you looking for housing?", content: <div className="housing-field-grid"><label>ZIP code<input inputMode="numeric" value={answers.zipCode} onChange={(e)=>setAnswers(a=>({...a,zipCode:e.target.value}))}/></label><label>County<input value={answers.county} onChange={(e)=>setAnswers(a=>({...a,county:e.target.value}))}/></label><label>State<input value={answers.state} onChange={(e)=>setAnswers(a=>({...a,state:e.target.value}))}/></label><p>Location is used only for this session and is not saved.</p></div> },
    { title: "Do you currently receive any housing assistance?", content: <MultiChoice options={assistanceOptions} selected={answers.assistance} onToggle={(v) => toggle("assistance", v)} /> },
    { title: "Are you currently on any housing waitlists?", content: <MultiChoice options={[["yes","Yes"],["no","No"],["unsure","I'm not sure"]].map(([value,label])=>({value,label}))} selected={answers.waitlist ? [answers.waitlist] : []} onToggle={(v)=>setAnswers(a=>({...a,waitlist:v as HousingAssessmentAnswers["waitlist"]}))}/> },
    { title: "Is abuse or violence affecting your housing situation?", content: <><MultiChoice options={[["yes","Yes"],["no","No"],["prefer_not","Prefer not to answer"]].map(([value,label])=>({value,label}))} selected={answers.abuseAffectsHousing ? [answers.abuseAffectsHousing] : []} onToggle={(v)=>setAnswers(a=>({...a,abuseAffectsHousing:v as HousingAssessmentAnswers["abuseAffectsHousing"]}))}/>{answers.abuseAffectsHousing==="yes"?<><h3>Is the person causing harm connected to your housing?</h3><MultiChoice options={abuseConnectionOptions} selected={answers.abuseConnections} onToggle={(v)=>toggle("abuseConnections",v)}/></>:null}</> },
    { title: "Do any of these household circumstances apply?", content: <><p>Some housing pathways are available only to certain households. You can skip anything you do not want to answer.</p><MultiChoice options={circumstanceOptions} selected={answers.circumstances} onToggle={(v)=>toggle("circumstances",v)}/></> },
    { title: "Household size and income", content: <div className="housing-field-grid"><label>People in household<input inputMode="numeric" value={answers.householdSize} onChange={(e)=>setAnswers(a=>({...a,householdSize:e.target.value}))}/></label><label>Approximate monthly household income<input placeholder="Amount, range, varies, none, or prefer not" value={answers.monthlyIncome} onChange={(e)=>setAnswers(a=>({...a,monthlyIncome:e.target.value}))}/></label><p>This can identify programs worth investigating. It is not an official income-eligibility decision.</p></div> },
    { title: "What types of income does your household receive?", content: <MultiChoice options={incomeOptions} selected={answers.incomeSources} onToggle={(v)=>toggle("incomeSources",v)}/> },
    { title: "What's making housing harder to get or keep?", content: <MultiChoice options={barrierOptions} selected={answers.barriers} onToggle={(v)=>toggle("barriers",v)}/> },
    { title: "How flexible are you about where you live?", content: <MultiChoice options={flexibilityOptions} selected={answers.flexibility} onToggle={(v)=>toggle("flexibility",v)}/> },
    { title: "If assistance made it affordable, would you consider owning a home?", content: <MultiChoice options={[["yes","Yes"],["maybe","Maybe"],["no","No"]].map(([value,label])=>({value,label}))} selected={answers.homeownership ? [answers.homeownership] : []} onToggle={(v)=>setAnswers(a=>({...a,homeownership:v as HousingAssessmentAnswers["homeownership"]}))}/> },
  ];

  if (detail) return <section className="housing-strategy-system"><ResourceDetail resource={detail} onBack={() => setDetail(null)} /></section>;

  return <section className="housing-strategy-system" aria-labelledby="housing-strategy-title">
    <header className="housing-system-header"><div><p className="housing-kicker">RESOURCES / HOUSING</p><h1 id="housing-strategy-title">Housing Resource Directory</h1><p>Browse housing programs, protections, inventories, financing options, and places to look for housing.</p></div><button className="resource-back-button" type="button" onClick={onBack}><ArrowLeft size={18}/> Back to Resources</button></header>

    {view === "landing" ? <div className="housing-entry-grid">
      <article><span>01</span><h2>Browse Housing Resources</h2><p>Search all 28 programs, protections, inventories, financing options, and places to look for housing.</p><button type="button" onClick={()=>setView("browse")}>Browse Resources <ChevronRight size={18}/></button></article>
      <article><span>02</span><h2>Build Your Housing Strategy</h2><p>Sort through your housing situation, priorities, barriers, and possible next steps without creating an account.</p><button type="button" onClick={()=>{setStep(0);setView("assessment")}}>Start Assessment <ChevronRight size={18}/></button></article>
    </div> : null}

    {view === "browse" ? <section className="housing-browser"><div className="housing-browser-tools"><label className="housing-search"><Search size={20}/><input aria-label="Search housing resources" placeholder="Search housing resources" value={search} onChange={(e)=>setSearch(e.target.value)}/></label><div className="housing-filter-grid"><label>Need<select value={needFilter} onChange={(e)=>setNeedFilter(e.target.value)}><option value="">All needs</option>{goalOptions.slice(0,-1).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><label>Situation<select value={situationFilter} onChange={(e)=>setSituationFilter(e.target.value)}><option value="">All situations</option>{statusOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><label>Circumstance<select value={populationFilter} onChange={(e)=>setPopulationFilter(e.target.value)}><option value="">All circumstances</option>{circumstanceOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label></div></div>
      <nav className="housing-category-nav" aria-label="Housing resource categories">{categories.map(item=><button className={category===item.id?"active":""} key={item.id} type="button" onClick={()=>setCategory(item.id)}>{item.label}</button>)}</nav>
      <p className="housing-result-count">{visibleResources.length} resources</p><div className="housing-resource-grid">{visibleResources.map(resource=><ResourceCard key={resource.id} resource={resource} onOpen={()=>setDetail(resource)}/>)}</div>
    </section> : null}

    {view === "assessment" ? <section className="housing-assessment"><div className="housing-assessment-progress"><span style={{width:`${((step+1)/questions.length)*100}%`}}/><b>{step+1} / {questions.length}</b></div><p className="housing-kicker">HOUSING STRATEGY ASSESSMENT</p><h2>{questions[step].title}</h2>{questions[step].content}<div className="housing-assessment-actions"><button className="resource-back-button" type="button" onClick={()=>step===0?setView("landing"):setStep(s=>s-1)}>Back</button><button type="button" onClick={()=>step===questions.length-1?finishAssessment():setStep(s=>s+1)}>{step===questions.length-1?"Build My Strategy":"Next"}<ChevronRight size={18}/></button></div></section> : null}

    {view === "results" ? <HousingResults matches={matches} actions={actionPlan} onReset={reset}/> : null}
  </section>;
}

function HousingResults({ matches, actions, onReset }: { matches: HousingMatch[]; actions: ReturnType<typeof buildHousingActionPlan>; onReset: () => void }) {
  const sections: Array<{id: HousingMatch["section"]; title:string; intro:string}> = [
    {id:"best",title:"Best Options Right Now",intro:"These pathways align most closely with the housing problem and goals you described."},
    {id:"checking",title:"Other Options Worth Checking",intro:"These may help, but local availability or eligibility still needs to be verified."},
    {id:"long_term",title:"Longer-Term Housing Paths",intro:"These options may take more preparation and should not replace urgent housing work."},
    {id:"protections",title:"Housing Rights or Protections",intro:"These are protections to investigate, not discretionary grants."},
    {id:"search",title:"Places You Probably Haven't Searched",intro:"These pathways can reveal properties and local programs outside ordinary rental websites."},
    {id:"reimbursement",title:"Expense Recovery",intro:"These resources reimburse eligible expenses. Do not rely on them as upfront move-in money."},
  ];
  const strongCount=matches.filter(m=>m.classification==="strong").length;
  return <section className="housing-results"><header><p className="housing-kicker">ASSESSMENT RESULTS</p><h2>Your Housing Strategy</h2><p>Based on your answers, Survivor Systems identified {matches.length} potential housing pathways, including {strongCount} that may be useful for your current situation.</p><div className="housing-results-actions"><button type="button" onClick={()=>window.print()}><Printer size={18}/> Print / Save Results</button><button className="resource-back-button" type="button" onClick={onReset}><RotateCcw size={18}/> Start Over</button></div></header>
    {sections.map(section=>{const items=matches.filter(m=>m.section===section.id).slice(0,section.id==="best"?5:6);return items.length?<section className={`housing-results-section housing-results-${section.id}`} key={section.id}><h3>{section.title}</h3><p>{section.intro}</p><div className="housing-match-grid">{items.map(match=><MatchCard key={match.resource.id} match={match}/>)}</div></section>:null})}
    <section className="housing-action-plan"><h3>Your Next Steps</h3>{(["start","next","later"] as const).map(horizon=>{const items=actions.filter(a=>a.horizon===horizon).slice(0,5);return items.length?<div key={horizon}><h4>{horizon==="start"?"Start Here":horizon==="next"?"Next":"Longer Term"}</h4><ol>{items.map(item=><li key={`${horizon}-${item.resourceId}`}>{item.action}</li>)}</ol></div>:null})}</section>
    <p className="housing-privacy-note">This strategy was generated in this browser session. Your answers were not saved. Program availability and eligibility must be confirmed by the administering property, agency, housing authority, lender, or provider.</p>
  </section>;
}

export function HousingStrategySystem({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [needFilter, setNeedFilter] = useState("");
  const [situationFilter, setSituationFilter] = useState("");
  const [populationFilter, setPopulationFilter] = useState("");
  const [detail, setDetail] = useState<HousingResource | null>(null);

  const visibleResources = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const categoryRule = categories.find((item) => item.id === category) ?? categories[0];

    return housingResources.filter((resource) => {
      const searchable = [
        resource.name,
        resource.shortName,
        resource.userFacingSummary,
        ...resource.assistanceTypes,
        ...resource.housingGoals,
        ...resource.barrierTags,
        ...resource.populationTags,
      ].filter(Boolean).join(" ").toLowerCase();

      return categoryRule.matches(resource)
        && (!normalized || searchable.includes(normalized))
        && (!needFilter || resource.housingGoals.includes(needFilter) || resource.barrierTags.includes(needFilter))
        && (!situationFilter || resource.housingStatuses.includes(situationFilter))
        && (!populationFilter || resource.populationTags.includes(populationFilter));
    });
  }, [category, needFilter, populationFilter, search, situationFilter]);

  if (detail) {
    return <section className="housing-strategy-system"><ResourceDetail resource={detail} onBack={() => setDetail(null)} /></section>;
  }

  return (
    <section className="housing-strategy-system" aria-labelledby="housing-strategy-title">
      <header className="housing-system-header">
        <div>
          <p className="housing-kicker">RESOURCES / HOUSING</p>
          <h1 id="housing-strategy-title">Housing Resource Directory</h1>
          <p>Browse housing programs, protections, inventories, financing options, and places to look for housing.</p>
        </div>
        <button className="resource-back-button" type="button" onClick={onBack}><ArrowLeft size={18}/> Back to Resources</button>
      </header>

      <section className="housing-browser">
        <div className="housing-browser-tools">
          <label className="housing-search"><Search size={20}/><input aria-label="Search housing resources" placeholder="Search housing resources" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
          <div className="housing-filter-grid">
            <label>Need<select value={needFilter} onChange={(event) => setNeedFilter(event.target.value)}><option value="">All needs</option>{goalOptions.slice(0, -1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Situation<select value={situationFilter} onChange={(event) => setSituationFilter(event.target.value)}><option value="">All situations</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Circumstance<select value={populationFilter} onChange={(event) => setPopulationFilter(event.target.value)}><option value="">All circumstances</option>{circumstanceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
        </div>
        <nav className="housing-category-nav" aria-label="Housing resource categories">{categories.map((item) => <button className={category === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setCategory(item.id)}>{item.label}</button>)}</nav>
        <p className="housing-result-count">{visibleResources.length} resources</p>
        <div className="housing-resource-grid">{visibleResources.map((resource) => <ResourceCard key={resource.id} resource={resource} onOpen={() => setDetail(resource)}/>)}</div>
      </section>
    </section>
  );
}
