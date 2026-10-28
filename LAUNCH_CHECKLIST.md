# Launch and discoverability checklist

Goal: searching **Ginger-Eke Chienyegom** leads to HelioConvert (what you do, the store and courses), and searching
**HelioConvert Store** leads back to you.

What the store already does for this (built and verified locally): one connected identity graph on every page
(Person, Organization, Store, Website) that reuses the exact `@id`s from helioconvrt.com, an `/about` page for your name,
a sitemap (1,200+ URLs), `robots.txt`, `/llms.txt`, per-page titles/descriptions/canonicals, Product and Breadcrumb data,
and visible "by Ginger-Eke Chienyegom, founder of HelioConvert" links back to your main site.

## 1. Put the store on `store.helioconvrt.com`

1. Create a project on Vercel from the `store` folder (set **Root Directory** to `store`).
2. Add these environment variables in Vercel (Production):

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://store.helioconvrt.com` |
   | `SITE_URL` | `https://store.helioconvrt.com` |
   | `SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key (secret) |
   | `PAYSTACK_SECRET_KEY` | your **live** Paystack secret key (without it, checkout refuses to run in production) |

3. In Vercel: Project, Settings, Domains, add `store.helioconvrt.com`. Vercel shows a DNS record; add it at the place
   your domain's DNS is managed (usually a `CNAME` named `store`). HTTPS is automatic.
4. Do one real small purchase end to end (Naira) before announcing it.

## 2. Tell Google and Bing

1. Google Search Console: add a **Domain** property for `helioconvrt.com` (verify with the DNS TXT record). It covers the
   main site and every subdomain.
2. Submit two sitemaps: `https://helioconvrt.com/sitemap.xml` and `https://store.helioconvrt.com/sitemap.xml`.
3. Use "Request indexing" on: the store home page, `/about`, and the main site home page.
4. Bing Webmaster Tools: import the site from Search Console. Bing feeds several AI search products, so it matters here.

## 3. Changes for helioconvrt.com (MADE in the main-site folder, not yet deployed)

Done: "Courses" link in the nav and a store link in the footer, page text pre-rendered into `index.html`, store and About
added to `llms.txt`, richer founder/company data in `index.html`, dated sitemap, `netlify.toml` (build settings and
www to bare-domain redirect). Go live order: store subdomain first, then push the main site, so the new link isn't dead.

The original notes, for reference:

- **Link to the store** from the header or footer: `https://store.helioconvrt.com`. This is the strongest signal that the two
  sites belong together.
- **Make the page text visible without JavaScript.** The main site is a client-rendered app (`<div id="root">`), so most
  AI crawlers see only the head, not "Who is Ginger-Eke Chienyegom?". Pre-render it (for example `vite-react-ssg`) or move it
  to a framework that renders HTML on the server. This is the biggest single gap.
- **Add to `public/llms.txt`:**

  ```
  ## Courses and the store
  HelioConvert Store (https://store.helioconvrt.com) is HelioConvert's digital library of books, guides, mini-courses,
  checklists, prompt packs and bundles by Ginger-Eke Chienyegom. About: https://store.helioconvrt.com/about
  ```

- **One address for the main site.** Your canonical is `https://helioconvrt.com` (no `www`); redirect `www` to it at your
  host so links and signals don't split.
- Add `lastmod` dates to `sitemap.xml` and keep it in step as you add pages.

## 4. Make your name say the same thing everywhere

- LinkedIn headline and About, GitHub bio: the same one-line description, for example
  "Founder of HelioConvert. B2B systems architect and software developer, Abuja, Nigeria", with links to both sites.
- Always spell the name exactly **Ginger-Eke Chienyegom**.
- If you use other profiles (X, Instagram, YouTube), add their URLs to `SAME_AS` in `store/lib/site.ts` and to the JSON-LD
  on helioconvrt.com, so they join the same identity.

## 5. What to expect

- Indexing takes days to weeks. Your name ranking for HelioConvert can take weeks to months, and nobody can guarantee a
  result or a Google knowledge panel. What helps most: consistent identity data (done), links between your profiles and both
  sites, and mentions on other sites (guest posts, podcasts, directories).
- Check progress in Search Console (queries for "ginger-eke chienyegom" and "helioconvert store"), and every month ask an
  AI assistant "Who is Ginger-Eke Chienyegom?" and "What is HelioConvert Store?" to see what it says.
