/**
 * IRS EIN Wizard — Additional Details: entity type not yet supported
 *
 * Reached when legal_structure is not LLC or members_of_llc is not "1"
 * (i.e., any entity type other than Single-Member LLC).
 *
 * Slice 1 scope: SINGLE_MEMBER_LLC only.
 * Other entity types deferred to Slice 3 pending pixel-confirmed HTML captures.
 */

export default function AdditionalDetailsComingSoon() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <p>This entity type is not yet supported. Please check back soon.</p>
    </main>
  );
}
