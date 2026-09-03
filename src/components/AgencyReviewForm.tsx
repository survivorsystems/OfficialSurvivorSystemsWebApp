import { type FormEvent, useState } from "react";

type AgencyReviewFormProps = {
  stateName: string;
  resourceKey?: string;
  resourceName?: string;
  onBack: () => void;
};

const helpOptions = [
  "Emergency shelter", "Housing", "Rental assistance", "Utility assistance", "Food assistance",
  "Cash assistance", "Transportation", "Childcare", "Legal help", "Protective order help",
  "Domestic violence services", "Sexual assault services", "Human trafficking services",
  "Immigration help", "Counseling or mental health support", "Disability-related assistance",
  "Medical care", "Case management", "Employment or job assistance", "Other",
];

const denialOptions = [
  "No funding", "No beds or space", "Waitlist closed", "Income too high", "Income too low or no income",
  "Immigration status", "Residency or county requirement", "Did not meet domestic violence definition",
  "Did not meet trafficking definition", "Situation was considered too old", "Not enough documentation",
  "Disability or accessibility issue", "Service animal or pet", "Mental health", "Substance use",
  "Family size or children", "Age", "Gender eligibility", "Prior assistance", "Another organization was responsible",
  "No reason was given", "Other", "Not applicable: I received services",
];

const barrierOptions = [
  "Long waits", "Could not reach anyone", "Complicated application", "Had to repeat my story",
  "Required documents I could not get", "Transportation", "Childcare", "Language",
  "Disability or accessibility", "Technology or internet", "Immigration", "Service animal",
  "Staff behavior", "Referred from agency to agency", "Unclear requirements", "No significant barriers", "Other",
];

const accuracyOptions = [
  "Phone number was wrong", "Website was broken", "Hours were inaccurate", "Eligibility information was inaccurate",
  "Service area was inaccurate", "Agency no longer offers the service", "Application process changed",
  "Agency appears closed", "Important information was missing", "Everything was accurate", "Other",
];

const scales = {
  contacted: ["This week", "Within the last month", "1-3 months ago", "3-6 months ago", "6-12 months ago", "More than a year ago", "I do not remember"],
  reached: ["Yes, easily", "Yes, after multiple attempts", "I left a message and received a response", "I left a message and received no response", "No one answered", "The contact information did not work", "I used an online application or form", "Other"],
  outcome: ["I received the help", "I received some help", "I was approved and am waiting", "I was placed on a waitlist", "I was referred elsewhere", "I completed intake but was not accepted", "I was told I was not eligible", "I was turned away without an intake", "I received no response", "The program was full", "The organization no longer operated or offered the advertised service", "I chose not to continue", "Other"],
  agreement: ["Strongly agree", "Agree", "Neutral", "Disagree", "Strongly disagree", "Not applicable"],
  judged: ["Never", "Rarely", "Sometimes", "Often", "Throughout the experience", "Prefer not to answer"],
  safer: ["Much more supported", "Somewhat more supported", "No difference", "Somewhat less supported", "Much less supported", "Not sure"],
  recommend: ["Yes", "Probably", "Maybe", "Probably not", "No", "I do not feel comfortable answering"],
};

const publicRatingOptions = [
  { value: "trusted", label: "Trusted", detail: "This resource was helpful, respectful, or reliable." },
  { value: "not_helpful", label: "Not Helpful", detail: "This resource did not provide useful help or meaningful access." },
  { value: "possibly_dangerous", label: "Possibly Dangerous", detail: "Something about this resource's actions, advice, or handling may have increased risk or caused harm." },
];

function RadioQuestion({ name, legend, options }: { name: string; legend: string; options: string[] }) {
  return <fieldset className="agency-review-question"><legend>{legend}</legend><div className="agency-review-options">
    {options.map((option) => <label key={option}><input type="radio" name={name} value={option} /> <span>{option}</span></label>)}
  </div></fieldset>;
}

function CheckboxQuestion({ name, legend, options }: { name: string; legend: string; options: string[] }) {
  return <fieldset className="agency-review-question"><legend>{legend}</legend><div className="agency-review-options agency-review-options-grid">
    {options.map((option) => <label key={option}><input type="checkbox" name={name} value={option} /> <span>{option}</span></label>)}
  </div></fieldset>;
}

function TextQuestion({ name, label, optional = true }: { name: string; label: string; optional?: boolean }) {
  return <label className="agency-review-textarea"><span>{label}{optional ? " (optional)" : ""}</span><textarea name={name} rows={5} maxLength={3000} /></label>;
}

export function AgencyReviewForm({ stateName, resourceKey, resourceName, onBack }: AgencyReviewFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const multi = (name: string) => data.getAll(name).map(String);
    const answer = (name: string) => String(data.get(name) ?? "").trim();
    const payload = {
      state: stateName,
      resourceKey,
      agencyName: answer("agencyName"),
      branchLocation: answer("branchLocation"),
      publicationPermission: answer("publicationPermission"),
      followUpAllowed: answer("followUpAllowed") === "Yes",
      followUpContact: answer("followUpContact"),
      privacyAcknowledged: data.get("privacyAcknowledged") === "yes",
      website: answer("website"),
      answers: {
        contactedWhen: answer("contactedWhen"), helpSought: multi("helpSought"), reachedAgency: answer("reachedAgency"),
        outcome: answer("outcome"), denialReasons: multi("denialReasons"), listingAccuracy: answer("listingAccuracy"),
        feltListenedTo: answer("feltListenedTo"), treatedWithRespect: answer("treatedWithRespect"),
        optionsExplained: answer("optionsExplained"), feltJudged: answer("feltJudged"), barriers: multi("barriers"),
        supportImpact: answer("supportImpact"), publicRating: answer("publicRating"), recommendation: answer("recommendation"),
        agencyDidWell: answer("agencyDidWell"), agencyCouldChange: answer("agencyCouldChange"), survivorShouldKnow: answer("survivorShouldKnow"),
        investigate: answer("investigate"), investigateWhy: answer("investigateWhy"), directoryIssues: multi("directoryIssues"),
        directoryExplanation: answer("directoryExplanation"), experienceNarrative: answer("experienceNarrative"),
        afterwardNarrative: answer("afterwardNarrative"), additionalSurvivorNote: answer("additionalSurvivorNote"),
      },
    };

    try {
      const response = await fetch("/api/agency-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Your review could not be submitted.");
      form.reset();
      setStatus("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your review could not be submitted.");
      setStatus("error");
    }
  }

  return <section className="page-shell agency-review-page" aria-labelledby="agency-review-title">
    <header className="agency-review-hero">
      <p>RESOURCE DIRECTORY FEEDBACK</p>
      <h1 id="agency-review-title">Review Resource</h1>
      <p>Your experience can help other survivors make better-informed choices and help Survivor Systems identify patterns in access to services.</p>
    </header>
    <button className="resource-back-button agency-review-back" type="button" onClick={onBack}>Back To {stateName} Resources</button>
    {status === "sent" ? <div className="agency-review-success" role="status"><h2>Thank you for sharing what happened.</h2><p>Your rating was added to the community totals. Written responses and follow-up information remain private.</p></div> :
    <form className="agency-review-form" onSubmit={submitReview}>
      <div className="agency-review-notice"><h2>Share only what feels safe.</h2><p>You do not have to explain or prove what happened. Please do not include your home address, Social Security number, case numbers, immigration document numbers, or another person’s identifying information.</p></div>
      <section className="agency-review-section"><h2>Agency And Visit</h2>
        <label className="agency-review-input"><span>Agency or program name</span><input name="agencyName" required maxLength={200} defaultValue={resourceName} readOnly={Boolean(resourceName)} /></label>
        <label className="agency-review-input"><span>Location or branch (optional)</span><input name="branchLocation" maxLength={200} /></label>
        <RadioQuestion name="contactedWhen" legend="When did you contact this agency?" options={scales.contacted} />
        <CheckboxQuestion name="helpSought" legend="What kind of help were you seeking? Select all that apply." options={helpOptions} />
      </section>
      <section className="agency-review-section"><h2>Access And Outcome</h2>
        <RadioQuestion name="reachedAgency" legend="Were you able to reach someone?" options={scales.reached} />
        <RadioQuestion name="outcome" legend="What was the outcome?" options={scales.outcome} />
        <CheckboxQuestion name="denialReasons" legend="If you were denied or turned away, what reason were you given? Select all that apply." options={denialOptions} />
        <RadioQuestion name="listingAccuracy" legend="How accurate was the information you found about this agency?" options={["Very accurate", "Mostly accurate", "Some information was inaccurate", "The experience was significantly different", "The service appeared to no longer exist", "I am not sure"]} />
      </section>
      <section className="agency-review-section"><h2>How You Were Treated</h2>
        <RadioQuestion name="feltListenedTo" legend="I felt listened to." options={scales.agreement} />
        <RadioQuestion name="treatedWithRespect" legend="Staff treated me with respect." options={scales.agreement} />
        <RadioQuestion name="optionsExplained" legend="Staff explained what was happening and what my options were." options={scales.agreement} />
        <RadioQuestion name="feltJudged" legend="I felt judged, blamed, dismissed, or talked down to." options={scales.judged} />
        <CheckboxQuestion name="barriers" legend="What barriers did you encounter? Select all that apply." options={barrierOptions} />
        <RadioQuestion name="supportImpact" legend="After contacting this agency, did you feel safer or better supported?" options={scales.safer} />
        <fieldset className="agency-review-question agency-public-rating"><legend>How would you describe this resource overall?</legend><div className="agency-review-options">
          {publicRatingOptions.map((option) => <label key={option.value}><input type="radio" name="publicRating" value={option.value} required /> <span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}
        </div></fieldset>
        <RadioQuestion name="recommendation" legend="Would you recommend this agency to another survivor?" options={scales.recommend} />
      </section>
      <section className="agency-review-section"><h2>In Your Words</h2>
        <TextQuestion name="experienceNarrative" label="Tell us what happened during your experience." />
        <TextQuestion name="afterwardNarrative" label="What happened afterward?" />
        <TextQuestion name="agencyDidWell" label="What did the agency do well?" />
        <TextQuestion name="agencyCouldChange" label="What could the agency do differently?" />
        <TextQuestion name="survivorShouldKnow" label="What should another survivor know before contacting this agency?" />
        <TextQuestion name="additionalSurvivorNote" label="Is there anything else other survivors should know?" />
        <RadioQuestion name="investigate" legend="Should Survivor Systems investigate this agency or listing further?" options={["Yes", "No"]} />
        <TextQuestion name="investigateWhy" label="If yes, what should Survivor Systems look into?" />
      </section>
      <section className="agency-review-section"><h2>Directory Accuracy</h2>
        <CheckboxQuestion name="directoryIssues" legend="Did anything in the directory listing need to be corrected? Select all that apply." options={accuracyOptions} />
        <TextQuestion name="directoryExplanation" label="Tell us more about any correction that is needed." />
      </section>
      <section className="agency-review-section"><h2>Permission And Follow-Up</h2>
        <RadioQuestion name="publicationPermission" legend="May Survivor Systems use your written comments?" options={["Yes, anonymously", "No, use my answers only in aggregate", "Ask me before publishing anything"]} />
        <RadioQuestion name="followUpAllowed" legend="May Survivor Systems contact you with a follow-up question?" options={["Yes", "No"]} />
        <label className="agency-review-input"><span>Email or preferred contact method (optional)</span><input name="followUpContact" maxLength={250} /></label>
        <label className="agency-review-consent"><input type="checkbox" name="privacyAcknowledged" value="yes" required /><span>I understand that I should not include sensitive identifying information in this form.</span></label>
        <label className="agency-review-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </section>
      {status === "error" ? <p className="agency-review-error" role="alert">{errorMessage}</p> : null}
      <button className="agency-review-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Submitting..." : "Submit My Review"}</button>
    </form>}
  </section>;
}
