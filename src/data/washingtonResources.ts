export type WashingtonResource = {
  name: string;
  summary: string;
  access: string;
  coverage: string;
  phone?: string;
  secondaryPhone?: string;
  url: string;
  note?: string;
};

function web(name: string, summary: string, url: string, coverage: string, note?: string): WashingtonResource {
  return { name, summary, access: "Use the official website for current intake instructions and contact options.", coverage, url, note };
}

function call(name: string, summary: string, phone: string, url: string, coverage: string, note?: string, secondaryPhone?: string): WashingtonResource {
  return { name, summary, access: "Call for current availability, eligibility, and the safest way to access help.", coverage, phone, secondaryPhone, url, note };
}

export const washingtonCategoryGuidance: Record<string, { nextStep: string; limitation: string }> = {
  "Homelessness Prevention & Intervention": { nextStep: "Ask for coordinated entry, diversion, prevention, emergency shelter, or rapid re-housing. Explain if ordinary shelter or shared databases could create a safety risk.", limitation: "Entry points and available funding vary by county. Ask whether a confidential victim-service pathway is available." },
  Housing: { nextStep: "Contact a local domestic violence program for confidential shelter, safe placement, housing help, transportation, or cross-county coordination.", limitation: "Shelter space and financial assistance are not guaranteed. Call before traveling, especially when ferry or rural travel is involved." },
  "Subsidized Housing": { nextStep: "Apply to multiple housing authorities and properties because their waitlists are separate.", limitation: "Waitlists, openings, preferences, and documentation rules change. HUD does not accept applications for local programs." },
  "Cash Assistance": { nextStep: "Use Washington Connection or call DSHS. Ask about the Family Violence Option, good cause, or safety-related exemptions when program requirements create danger.", limitation: "Eligibility and emergency-fund availability depend on current program rules and household circumstances." },
  "Immigration Services": { nextStep: "Request screening from a licensed immigration attorney or DOJ-accredited representative for VAWA, U visa, T visa, asylum, or SIJS options.", limitation: "Only a licensed attorney or accredited representative should provide immigration legal advice. Verify credentials before sharing documents." },
  "Trafficking Victim Services": { nextStep: "Contact a specialized provider for safety, housing, medical care, legal help, immigration relief, identification, transportation, benefits, or compensation.", limitation: "Do not confront a suspected trafficker or attempt to investigate. Provider capacity and geographic coverage vary." },
  "Rapid Rehousing": { nextStep: "Ask coordinated entry, a domestic violence program, or a community action agency about confidential assessment, deposits, arrears, utilities, flexible funds, and safe relocation.", limitation: "Rapid re-housing usually requires referral or coordinated entry and depends on local openings and funding." },
  "Legal Assistance": { nextStep: "Ask about filing, service, hearings, firearm surrender, custody, housing, evidence, address confidentiality, and available court advocacy.", limitation: "Court deadlines and legal consequences can be significant. General information is not individualized legal advice." },
  "Rental Assistance": { nextStep: "Check 211, coordinated entry, community action, utility providers, and a survivor program for current rent, deposit, utility, and emergency funds.", limitation: "Funding and waitlists change quickly. Get legal advice before ending a lease, withholding rent, or missing an eviction hearing." },
  "SNAP / Food Assistance": { nextStep: "Apply through Washington Connection, call DSHS, or use a Community Services Office. Ask about expedited Basic Food if available money and food are extremely low.", limitation: "Benefit amounts and expedited eligibility depend on current household information and program rules." },
  "Transportation Assistance": { nextStep: "Ask about confidential shelter transportation, ferry costs, court rides, gas cards, repairs, Medicaid rides, and cross-county travel.", limitation: "Medicaid rides and paratransit usually require advance booking. Regional and ferry schedules can materially affect access." },
  "Childcare Assistance": { nextStep: "Apply for Working Connections Child Care and ask how domestic violence, homelessness, TANF, work, school, or child welfare affects eligibility or priority.", limitation: "Provider openings, subsidy authorization, safe contact, and appeal procedures vary." },
  "Sexual Assault / Rape Survivor Resources": { nextStep: "Ask about confidential advocacy, hospital accompaniment, forensic exams without immediate police reporting, evidence storage, transportation, follow-up care, and costs.", limitation: "Medical and evidence timelines may matter. Ask the local program or medical provider what options remain available without assuming a report is required." },
};

export const washingtonProgramsByCategory: Record<string, WashingtonResource[]> = {
  "Homelessness Prevention & Intervention": [
    call("Washington 211", "Searches current local housing, food, utility, transportation, and crisis resources.", "211", "https://wa211.org/", "Statewide"),
    web("Washington Commerce Homelessness Response", "Official overview with local homelessness and coordinated-entry connections.", "https://www.commerce.wa.gov/homelessness-response/", "Statewide system information"),
    web("Washington Balance of State Continuum of Care", "Coordinates federal homelessness resources across 34 small and medium counties.", "https://www.commerce.wa.gov/homelessness-response/federal-grants/continuum-of-care/", "34 Balance of State counties"),
    web("King County Regional Homelessness Authority", "Shelter and coordinated-services access for Seattle and King County.", "https://kcrha.org/resources/", "King County"),
    web("Snohomish County Coordinated Entry", "Shelter and housing access through Snohomish County's homelessness system.", "https://www.snohomishcountywa.gov/549/Homelessness", "Snohomish County"),
    web("Pierce County Coordinated Entry", "Coordinated access to Tacoma and Pierce County homeless housing programs.", "https://www.piercecountywa.gov/4701/Coordinated-Entry", "Pierce County"),
    web("Council for the Homeless", "Housing hotline, coordinated entry, and homelessness services.", "https://www.councilforthehomeless.org/", "Clark County"),
    web("Community Action and Rural Housing Connections", "Local housing and basic-needs help through community action providers including Skagit, Kittitas, Yakima, Tri-Cities, Walla Walla, and Okanogan programs.", "https://wapartnership.org/", "Regional and rural Washington", "Use the directory to confirm the organization serving your county."),
  ],
  Housing: [
    web("WSCADV Program Directory", "Directory of 70-plus county, Tribal, and culturally specific domestic violence and sexual assault programs.", "https://wscadv.org/washington-domestic-violence-programs/", "County, regional, Tribal, and culturally specific programs statewide"),
    call("King County Domestic Violence Hotline", "24-hour connection to domestic violence advocacy, shelter, and local services.", "206-737-0242", "https://www.kcadv.org/", "King County", undefined, "877-737-0242"),
    web("New Beginnings", "Confidential domestic violence shelter, advocacy, and housing support.", "https://newbegin.org/", "Seattle and King County"),
    web("LifeWire", "Survivor services, housing stability, and advocacy.", "https://www.lifewire.org/", "East King County"),
    web("YWCA Seattle King Snohomish", "Gender-based violence advocacy and housing services.", "https://www.ywcaworks.org/programs/gender-based-violence-services", "King and Snohomish counties"),
    web("API Chaya", "Culturally specific support for Asian, Pacific Islander, immigrant, domestic violence, sexual assault, and trafficking survivors.", "https://www.apichaya.org/", "Greater Seattle region with culturally specific pathways"),
    web("ADWAS", "Advocacy for Deaf and DeafBlind survivors.", "https://www.adwas.org/", "Statewide and regional Deaf-access pathways"),
    web("Washington State Native American Coalition Against Domestic Violence and Sexual Assault", "Connects Native survivors with Tribal and Native-centered programs.", "https://www.women-spirit.org/", "Tribal communities and Native survivors statewide"),
    call("StrongHearts Native Helpline", "Confidential Native-centered domestic and sexual violence support and referrals.", "844-762-8483", "https://strongheartshelpline.org/", "National service available throughout Washington"),
  ],
  "Subsidized Housing": [
    web("Washington Housing Finance Commission", "Affordable housing, rental-property, homeownership, and housing-counseling information.", "https://www.wshfc.org/", "Statewide"),
    web("HousingSearchNW", "Searchable affordable and accessible rental listings.", "https://housingsearchnw.org/", "Washington rental listings"),
    web("HUD Washington Housing Authorities", "Official directory of local public housing authorities administering vouchers and public housing.", "https://www.hud.gov/states/washington/renting/hawebsites", "Local housing authorities statewide", "Each authority maintains separate applications and waitlists."),
    web("HUD VAWA Housing Rights", "Federal forms and information about survivor protections in covered housing.", "https://www.hud.gov/vawa", "Federally assisted housing", "Protections may include confidentiality, emergency transfer, lease bifurcation, and protection from abuse-related denial or eviction."),
    web("Seattle and King County Housing Authorities", "Public housing, vouchers, and assisted-housing programs administered through separate authorities.", "https://www.seattlehousing.org/", "Seattle and King County", "King County outside Seattle uses https://www.kcha.org/. Apply separately where appropriate."),
    web("Regional Washington Housing Authorities", "Local housing authorities serve Tacoma, Pierce, Snohomish, Everett, Vancouver, Spokane, Yakima, Kitsap, Whatcom, Chelan-Douglas, Grant, Walla Walla, and Cowlitz areas.", "https://www.hud.gov/states/washington/renting/hawebsites", "Regional jurisdictions statewide", "Use HUD's official directory for the correct local authority and current waitlist."),
    web("Fair Housing Center of Washington", "Fair-housing education, investigation, and enforcement support.", "https://fhcwashington.org/", "Washington"),
  ],
  "Cash Assistance": [
    web("Washington Connection", "Online applications for cash, food, medical, and other public benefits.", "https://www.washingtonconnection.org/", "Statewide"),
    call("DSHS Community Services", "Benefits interviews, TANF questions, and connections to local Community Services Offices.", "877-501-2233", "https://www.dshs.wa.gov/esa/community-services-offices", "Statewide"),
    web("DSHS Temporary Assistance for Needy Families", "Monthly cash assistance for eligible families, including Family Violence Option pathways.", "https://www.dshs.wa.gov/esa/community-services-offices/temporary-assistance-needy-families", "Statewide", "Tell DSHS when WorkFirst, child-support cooperation, appointments, mail, or contact methods create danger."),
    web("Additional Requirements for Emergent Needs", "Emergency help of up to $2,000 for certain qualifying needs under current rules.", "https://www.dshs.wa.gov/esa/community-services-offices/emergency-resources", "Statewide", "Amount, eligibility, and covered needs depend on current rules."),
    web("Diversion Cash Assistance", "Short-term cash alternative to ongoing TANF for qualifying families.", "https://www.dshs.wa.gov/esa/community-services-offices/diversion-cash-assistance", "Statewide"),
    web("Washington Crime Victims Compensation", "May cover eligible crime-related medical, counseling, wage, funeral, and other costs.", "https://lni.wa.gov/claims/crime-victim-claims/apply-for-crime-victim-benefits", "Statewide", "Coverage requires an application and qualifying crime-related losses."),
    web("Washington Community Action Partnership", "Directory of local anti-poverty agencies offering emergency and basic-needs programs.", "https://wapartnership.org/", "Local agencies statewide", "Programs and available funds vary by county and provider."),
  ],
  "Immigration Services": [
    web("Northwest Immigrant Rights Project", "Statewide nonprofit immigration legal services and survivor-related screening, subject to capacity.", "https://www.nwirp.org/", "Statewide"),
    web("Immigration Advocates Network Washington Directory", "Searches nonprofit immigration providers by county and case type.", "https://www.immigrationadvocates.org/nonprofit/legaldirectory/search?state=WA", "Statewide directory"),
    web("API Chaya", "Culturally specific advocacy for immigrant survivors of domestic violence, sexual assault, and trafficking.", "https://www.apichaya.org/", "Greater Seattle and regional referrals"),
    web("Colectiva Legal del Pueblo", "Community-based immigration legal support and organizing.", "https://colectivalegal.org/", "Washington"),
    web("Catholic Immigration Legal Services Seattle", "DOJ-recognized immigration legal services.", "https://ccsww.org/services/immigration-services/", "Western Washington"),
    web("World Relief Washington", "Immigration legal and refugee services through western Washington and Spokane offices.", "https://worldrelief.org/western-wa/", "Western and eastern Washington", "Spokane services are listed at https://worldrelief.org/spokane/."),
    web("Washington Office of Refugee and Immigrant Assistance", "State refugee and immigrant services and program connections.", "https://www.dshs.wa.gov/esa/office-refugee-and-immigrant-assistance", "Statewide"),
    call("EOIR Case Status", "Official immigration-court case status system.", "800-898-7180", "https://acis.eoir.justice.gov/en/", "Federal cases in Washington", "Case status information is not legal advice."),
  ],
  "Trafficking Victim Services": [
    call("National Human Trafficking Hotline", "Confidential trafficking support, referrals, and service navigation.", "888-373-7888", "https://humantraffickinghotline.org/en", "National service available in Washington", "Text HELP or INFO to 233733."),
    web("Washington Commerce Trafficking Victim Resources", "State assistance routes for trafficking survivors.", "https://www.commerce.wa.gov/ocva/clearinghouse-on-human-trafficking/resources-for-victims/", "Statewide"),
    web("WARN Service Provider Directory", "Regional directory of trafficking service providers.", "https://warn-trafficking.org/service-providers/", "Washington regions"),
    web("REST", "Shelter and services for people affected by commercial sexual exploitation.", "https://iwantrest.com/", "Seattle and King County"),
    web("Organization for Prostitution Survivors", "Peer support and services for adult survivors.", "https://www.seattleops.org/", "Seattle region"),
    web("Mirror Ministries", "Trafficking-survivor advocacy and support.", "https://www.mirrorministries.org/", "Tri-Cities region"),
    web("Innovations Human Trafficking Collaborative", "Survivor support, coordination, and training.", "https://innovationshtc.org/", "Washington"),
    call("VictimConnect", "Confidential crime-victim information and referrals.", "855-484-2846", "https://victimconnect.org/", "National service available in Washington"),
  ],
  "Rapid Rehousing": [
    web("Washington Commerce Homelessness Response", "Local coordinated-entry routes for prevention, shelter, and rapid re-housing.", "https://www.commerce.wa.gov/homelessness-response/", "Statewide system with local entry points"),
    web("WSCADV Domestic Violence Housing First", "Survivor-centered flexible housing model and local program connections.", "https://wscadv.org/projects/domestic-violence-housing-first/", "Participating survivor programs statewide"),
    web("WSCADV Program Directory", "Finds confidential local survivor programs that may provide housing advocacy or flexible assistance.", "https://wscadv.org/washington-domestic-violence-programs/", "County, regional, Tribal, and culturally specific programs statewide"),
    web("YWCA Seattle King Snohomish Housing", "Family and survivor housing services.", "https://www.ywcaworks.org/programs/housing", "King and Snohomish counties"),
    web("Solid Ground", "Housing stabilization and homelessness-prevention programs.", "https://www.solid-ground.org/get-help/housing/", "King County"),
    web("Regional Survivor Housing Programs", "Local domestic violence programs may offer shelter, transitional housing, rapid re-housing, deposits, relocation, and flexible funds.", "https://wscadv.org/washington-domestic-violence-programs/", "County and regional service areas statewide", "Use the directory for Snohomish, Pierce, Clark, Thurston, Spokane, Benton-Franklin, Whatcom, Kitsap, Skagit, Kittitas, Okanogan, and coastal programs."),
  ],
  "Legal Assistance": [
    web("Washington Courts Protection Order Forms", "Official mandatory protection-order forms and instructions.", "https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=142", "Washington courts", "Protection orders may address domestic violence, sexual assault, stalking, harassment, vulnerable-adult abuse, and coercive control under current law."),
    web("WashingtonLawHelp Protection Orders", "Plain-language protection-order, family-safety, and filing guidance.", "https://www.washingtonlawhelp.org/issues/family-safety/domestic-violence", "Statewide"),
    web("Northwest Justice Project", "Statewide civil legal aid, including housing and family-safety matters.", "https://nwjustice.org/", "Statewide", "Eligibility and representation depend on legal issue, income, location, conflicts, and capacity."),
    call("CLEAR Legal Help", "Civil legal-aid screening outside King County, with online intake options.", "888-201-1014", "https://nwjustice.org/get-legal-help", "Washington outside King County"),
    web("Sexual Violence Law Center", "Civil legal services for sexual-violence survivors.", "https://svlawcenter.org/", "Statewide"),
    web("Regional Civil Legal Aid", "Local legal-aid programs serve East and North King, Pierce, Snohomish, Spokane, and Benton-Franklin regions.", "https://www.wsba.org/for-the-public/find-legal-help", "Regional jurisdictions statewide", "Use the State Bar directory to confirm the correct provider and current intake."),
    call("Washington Address Confidentiality Program", "Provides a substitute mailing address for eligible survivors.", "800-822-1065", "https://www.sos.wa.gov/statewide-programs/address-confidentiality-program-acp", "Statewide", "Enrollment rules apply; ask how the program interacts with court and agency records."),
    web("WomensLaw Washington", "Plain-language information about Washington domestic violence and custody law.", "https://www.womenslaw.org/laws/wa", "Statewide information", "Information is not a substitute for advice about a specific case."),
  ],
  "Rental Assistance": [
    call("Washington 211 Rental and Utility Help", "Searches current rent, deposit, utility, and emergency-fund programs.", "211", "https://wa211.org/", "Local programs statewide", "Funding and openings change quickly."),
    web("WashingtonLawHelp Housing", "Tenant information about eviction, repairs, deposits, and rental rights.", "https://www.washingtonlawhelp.org/issues/housing", "Statewide"),
    web("Northwest Justice Project Housing Help", "Civil legal aid for eviction and subsidized-housing problems.", "https://nwjustice.org/", "Statewide, subject to intake and eligibility"),
    web("Tenants Union of Washington", "Tenant-rights education and hotline information.", "https://tenantsunion.org/", "Washington"),
    web("Housing Justice Projects", "Eviction-defense projects serving King and Pierce counties.", "https://www.kcba.org/?pg=Housing-Justice-Project", "King and Pierce counties", "Pierce County access is through https://tacomaprobono.org/housing-justice-project/."),
    web("Washington Community Action Partnership", "Locates community action agencies providing rent, energy, weatherization, and emergency help.", "https://wapartnership.org/", "Local providers statewide", "Available assistance varies by provider and funding cycle."),
    web("Washington LIHEAP", "Heating-assistance provider directory.", "https://www.commerce.wa.gov/community-opportunities/low-income-home-energy-assistance-program-liheap/", "Local providers statewide", "Benefits are seasonal and eligibility-based."),
  ],
  "SNAP / Food Assistance": [
    web("Washington Basic Food", "Official SNAP eligibility and application information.", "https://www.dshs.wa.gov/esa/community-services-offices/basic-food", "Statewide"),
    web("Washington Connection", "Online application for Basic Food and other benefits.", "https://www.washingtonconnection.org/", "Statewide"),
    call("DSHS Basic Food Assistance", "Application interviews, benefit questions, and Community Services Office connections.", "877-501-2233", "https://www.dshs.wa.gov/esa/community-services-offices", "Statewide", "Ask about expedited Basic Food when available money and food are extremely low."),
    web("Washington Food Coalition", "Statewide network of food banks and pantries.", "https://www.wafoodcoalition.org/", "Statewide"),
    web("Northwest Harvest", "Free food resources and markets.", "https://www.northwestharvest.org/need-food/", "Statewide"),
    web("Regional Food Bank Locators", "Food Lifeline, Second Harvest, Emergency Food Network, and county food banks provide regional food-site searches.", "https://foodlifeline.org/need-food/", "Western, eastern, Pierce, Clark, and local service areas", "Eastern Washington and north Idaho locator: https://2-harvest.org/food-near-me-wa/."),
    web("Washington WIC", "Nutrition support for eligible pregnant and postpartum people and children under five.", "https://doh.wa.gov/you-and-your-family/wic", "Statewide"),
  ],
  "Transportation Assistance": [
    web("WSDOT Public Transportation", "State directory of transit and mobility options.", "https://wsdot.wa.gov/travel/transportation-options/public-transportation", "Statewide"),
    call("Washington 211 Transportation", "Finds local medical rides, gas cards, volunteer drivers, paratransit, and emergency transportation.", "211", "https://wa211.org/", "Local programs statewide"),
    web("Apple Health Transportation", "Non-emergency medical transportation for eligible Medicaid appointments.", "https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-care/transportation-services-nonemergency", "Regional brokers statewide", "Advance booking and eligibility verification are usually required."),
    web("Puget Sound Regional Transit", "Sound Transit and county systems provide rail, bus, ferry, and paratransit routes.", "https://www.soundtransit.org/", "King, Pierce, Snohomish, and Puget Sound regions"),
    web("Washington State Ferries", "Ferry routes, fares, accessibility, and travel information.", "https://wsdot.wa.gov/travel/washington-state-ferries", "Puget Sound ferry system", "Ferry cost and timing can affect access to shelter, court, medical care, and services."),
    web("County and Rural Transit Directory", "Local systems serve Clark, Kitsap, Jefferson, Clallam, Mason, Grays Harbor, Skagit, Whatcom, Spokane, Tri-Cities, Yakima, Chelan-Douglas, Grant, Walla Walla, and rural regions.", "https://wsdot.wa.gov/travel/transportation-options/public-transportation", "Regional and rural Washington", "Check accessibility, paratransit eligibility, fares, and reservation requirements directly."),
    web("People For People Transportation", "Rural, regional, and Medicaid transportation.", "https://www.pfp.org/transportation/", "Central and southeast Washington"),
  ],
  "Childcare Assistance": [
    call("Working Connections Child Care", "Helps eligible families pay for child care through Washington's subsidy program.", "844-626-8687", "https://dcyf.wa.gov/services/earlylearning-childcare/getting-help", "Statewide", "Domestic violence, homelessness, child welfare, TANF, work, school, and approved activities may affect eligibility or priority."),
    web("DCYF Child Care Portal", "Online application and multilingual child-care assistance.", "https://dcyf.wa.gov/childcare", "Statewide"),
    web("Child Care Check", "Searches licensed providers and referral options.", "https://www.findchildcarewa.org/", "Statewide"),
    web("Child Care Aware of Washington", "Regional child-care navigation and provider referrals.", "https://childcareawarewa.org/", "Statewide through regional programs"),
    web("ECEAP and Head Start", "Free early-learning programs for eligible children and families.", "https://dcyf.wa.gov/services/earlylearning-childcare/eceap-headstart", "Local programs statewide"),
    web("McKinney-Vento Washington", "School enrollment, stability, and transportation rights for students experiencing homelessness.", "https://ospi.k12.wa.us/student-success/access-opportunity-education/homeless-education", "Public schools statewide"),
    web("Washington Parent to Parent", "Support for families of children with disabilities.", "https://arcwa.org/parent-to-parent/", "Statewide"),
    call("DSHS Division of Child Support", "Child-support services and information about good cause and safer contact arrangements.", "800-442-5437", "https://www.dshs.wa.gov/esa/division-child-support", "Statewide", "Tell the agency when cooperation or contact could create danger."),
  ],
  "Sexual Assault / Rape Survivor Resources": [
    web("WSCADV Sexual Assault Program Directory", "County and Tribal sexual-assault programs offering confidential advocacy and local referrals.", "https://wscadv.org/washington-domestic-violence-programs/", "County, regional, and Tribal programs statewide"),
    call("RAINN", "Confidential 24-hour sexual assault support and chat.", "800-656-4673", "https://rainn.org/", "National service available in Washington"),
    web("Washington Department of Health Sexual and Domestic Violence Resources", "State sexual and domestic violence information and resource connections.", "https://doh.wa.gov/you-and-your-family/injury-and-violence-prevention/sexual-and-domestic-violence/resources", "Statewide"),
    web("Sexual Violence Law Center", "Civil legal services for sexual-violence survivors.", "https://svlawcenter.org/", "Statewide"),
    call("King County Sexual Assault Resource Center", "24-hour sexual-assault resource line, advocacy, and support.", "888-998-6423", "https://www.kcsarc.org/", "King County"),
    web("Harborview Center for Sexual Assault", "Medical, forensic, counseling, and advocacy services.", "https://depts.washington.edu/uwhatc/", "Seattle and King County"),
    web("Regional Sexual Assault Programs", "Local programs serve Pierce, Whatcom, Skagit, Island, Jefferson, Clallam, Thurston, Grays Harbor, Pacific, Cowlitz, Clark, Kittitas, Spokane, Benton-Franklin, Okanogan, Grant-Adams, and Palouse regions.", "https://wscadv.org/washington-domestic-violence-programs/", "County and regional programs statewide", "Use the statewide directory to confirm the direct crisis line, hospital coverage, and current service area."),
    call("StrongHearts Native Helpline", "Native-centered sexual and domestic violence support and referrals.", "844-762-8483", "https://strongheartshelpline.org/", "Native survivors throughout Washington"),
  ],
};
