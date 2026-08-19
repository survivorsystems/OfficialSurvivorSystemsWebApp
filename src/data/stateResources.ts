export type StateResourceLocation = {
  name: string;
  slug: string;
};

export const stateResourceCategories = [
  "Housing",
  "Food",
  "Childcare Assistance",
  "Transportation Assistance",
  "Disability",
  "Other Programs",
] as const;

const locationNames = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Puerto Rico",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

function slugifyLocation(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const stateResourceLocations: StateResourceLocation[] = locationNames.map((name) => ({
  name,
  slug: slugifyLocation(name),
}));

export function findStateResourceLocation(slug: string | null) {
  return stateResourceLocations.find((location) => location.slug === slug) ?? null;
}
