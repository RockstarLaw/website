// Industry / subject-matter tags for the Project Shop faceted search.
// A project can be tagged with multiple industries. Filter rail exposes
// these as multi-select chips alongside Area of Law.
//
// These are the BUSINESS / REAL-WORLD industry labels — what the project
// IS about — not the legal subject. (Legal subject = AREAS_OF_LAW.)
//
// Edit this list when a new project doesn't fit any existing industry.

export const INDUSTRIES = [
  "Apparel & Clothing",
  "Footwear & Sneakers",
  "Music",
  "Film & TV",
  "Comics & Graphic Novels",
  "Trading Cards & Collectibles",
  "Food & Beverage / Restaurants",
  "Sports & Athletics",
  "Gaming, Toys & Entertainment",
  "Technology & Software",
  "Finance, Trading & Securities",
  "Publishing & Books",
  "Live Events & Performance",
  "Visual Arts & Photography",
  "Cosmetics & Beauty",
  "Automotive",
  "Cannabis",
  "Real Estate & Property",
  "Hospitality & Travel",
  "Healthcare & Pharma",
  "Consumer Products",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
