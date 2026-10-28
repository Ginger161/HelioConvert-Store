import { abs, AUTHOR, BIO, MAIN_SITE, ORG_DESCRIPTION, ORG_ID, ORG_LOGO, PERSON_ID, SAME_AS, SITE_NAME, STORE_DESCRIPTION } from "./site";

const ADDRESS = { "@type": "PostalAddress", addressLocality: "Abuja", addressCountry: "NG" };

// One connected graph: Ginger-Eke (Person) <-> HelioConvert (Organization) <-> HelioConvert Store (OnlineStore + WebSite).
// The Person and Organization @ids match the ones on helioconvrt.com, so the two sites describe the same entities.
export function entityGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person", "@id": PERSON_ID, name: AUTHOR, jobTitle: "Systems Architect & Founder", description: BIO,
        url: MAIN_SITE, image: abs("/profile.jpg"), address: ADDRESS, worksFor: { "@id": ORG_ID }, sameAs: SAME_AS,
        subjectOf: { "@type": "WebPage", "@id": abs("/about"), url: abs("/about"), name: `About ${AUTHOR}` },
        knowsAbout: ["Revenue operations", "Lead generation systems", "AI automation", "Software integrations", "CRM architecture", "Business automation"],
      },
      {
        "@type": "Organization", "@id": ORG_ID, name: "HelioConvert", alternateName: ["HelioConvrt", "Helio Convert"],
        url: MAIN_SITE, logo: ORG_LOGO, description: ORG_DESCRIPTION, founder: { "@id": PERSON_ID }, address: ADDRESS, sameAs: SAME_AS,
        owns: { "@id": abs("/#store") },
      },
      {
        "@type": "OnlineStore", "@id": abs("/#store"), name: SITE_NAME, alternateName: ["HelioConvrt Store", "HelioConvert Library"],
        url: abs("/"), description: STORE_DESCRIPTION, parentOrganization: { "@id": ORG_ID }, founder: { "@id": PERSON_ID },
        logo: abs("/logo.png"), currenciesAccepted: "NGN", areaServed: "Worldwide",
      },
      {
        "@type": "WebSite", "@id": abs("/#website"), name: SITE_NAME, alternateName: ["HelioConvrt Store", "HelioConvert Library"], url: abs("/"),
        description: STORE_DESCRIPTION, inLanguage: "en", publisher: { "@id": ORG_ID }, creator: { "@id": PERSON_ID },
        potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: abs("/library?q={search_term_string}") }, "query-input": "required name=search_term_string" },
      },
    ],
  };
}
