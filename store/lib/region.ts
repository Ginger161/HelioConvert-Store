// Client-safe region helpers. All prices are stored and charged in NGN; other currencies are display-only estimates.
export type Lang = "en" | "fr" | "es" | "pt";
export type Region = { currency: string; lang: Lang };

export const DEFAULT_REGION: Region = { currency: "NGN", lang: "en" };

// Approximate NGN -> currency multipliers. Update periodically (or swap for a live-rate fetch).
export const RATES: Record<string, number> = {
  NGN: 1, USD: 1 / 1500, GBP: 1 / 1900, EUR: 1 / 1630, GHS: 1 / 100, KES: 1 / 11.6, ZAR: 1 / 82, CAD: 1 / 1090,
};
export const CURRENCIES = Object.keys(RATES);
export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" }, { code: "fr", label: "Français" }, { code: "es", label: "Español" }, { code: "pt", label: "Português" },
];

export const COUNTRY: Record<string, Region> = {
  NG: { currency: "NGN", lang: "en" }, GH: { currency: "GHS", lang: "en" }, KE: { currency: "KES", lang: "en" },
  ZA: { currency: "ZAR", lang: "en" }, GB: { currency: "GBP", lang: "en" }, US: { currency: "USD", lang: "en" },
  CA: { currency: "CAD", lang: "en" }, IE: { currency: "EUR", lang: "en" }, DE: { currency: "EUR", lang: "en" },
  NL: { currency: "EUR", lang: "en" }, IT: { currency: "EUR", lang: "en" }, FR: { currency: "EUR", lang: "fr" },
  ES: { currency: "EUR", lang: "es" }, PT: { currency: "EUR", lang: "pt" }, BR: { currency: "USD", lang: "pt" },
  MX: { currency: "USD", lang: "es" }, CO: { currency: "USD", lang: "es" }, AR: { currency: "USD", lang: "es" },
  SN: { currency: "EUR", lang: "fr" }, CI: { currency: "EUR", lang: "fr" }, CM: { currency: "EUR", lang: "fr" },
  AO: { currency: "USD", lang: "pt" }, MZ: { currency: "USD", lang: "pt" },
};

const LOCALE: Record<Lang, string> = { en: "en", fr: "fr", es: "es", pt: "pt" };

export function fmtPrice(ngn: number, r: Region) {
  const cur = RATES[r.currency] ? r.currency : "NGN";
  const v = ngn * RATES[cur];
  const locale = cur === "NGN" ? "en-NG" : LOCALE[r.lang];
  return new Intl.NumberFormat(locale, {
    style: "currency", currency: cur,
    maximumFractionDigits: cur === "NGN" || v >= 100 ? 0 : 2, minimumFractionDigits: cur === "NGN" || v >= 100 ? 0 : 2,
  }).format(cur === "NGN" ? ngn : v);
}

const STR = {
  en: {
    kicker: "> [SYS] pick · buy · learn · earn · grow", h1a: "Pick a course.", h1b: "Learn the skill.", h1c: "Earn and grow.",
    lead: "step-by-step books, guides, mini-courses, checklists and prompt packs. Detailed, practical material you can start using the moment you pay.",
    statCourses: "courses & guides", statBundles: "topic bundles", statPages: "pages of learning", statWords: "words of content",
    howTitle: "From curious to earning in four steps",
    s1t: "Pick", s1d: "Search every title across business, money, marketing, AI, wellbeing and more, or grab a complete topic bundle.",
    s2t: "Buy", s2d: "Pay in Naira (or see your local estimate). No account needed: your download page appears instantly.",
    s3t: "Learn", s3d: "Work through step-by-step lessons, frameworks, templates and checklists at your own pace.",
    s4t: "Earn & grow", s4d: "Put the playbooks to work in your business, freelancing or career. Come back to them any time.",
    insideTitle: "Look inside", insideSub: "Real pages from real courses: clear headings, tables, frameworks and action steps. Not a thin PDF.", pagesWord: "pages", avgPages: "avg. pages",
    typesTitle: "Pick the format that fits how you learn", typesSub: "Every topic comes in several formats, so you can go deep or move fast.",
    tBook: "Deep, chapter-by-chapter mastery of a topic.", tGuide: "Step-by-step walkthroughs you can finish in a weekend.",
    tMini: "A multi-day email course that builds a skill lesson by lesson.", tCheck: "Quick-win checklists: audit, fix, ship.",
    tList: "Short, punchy lists of mistakes, myths and moves.", tPrompt: "Ready-to-use AI prompts that do the heavy lifting.",
    bundles: "Bundles", bundleTag: "Bundle", inside: "What's inside", itemsWord: "items", buyBundle: "Buy this bundle", bundlesSub: "A complete topic in one purchase: every format, one price.", individually: "Or buy items individually", seeBundle: "View bundle",
    catalog: "Catalog", bundle: "Full bundle", mainSite: "Main site", indexed: "products indexed", search: "Search titles and topics…",
    allFormats: "All formats", all: "All", showMore: "Show more", left: "left", none: "Nothing matches that search.", buy: "Buy now",
    fullPage: "Full page", close: "Close", email: "you@email.com", browse: "Browse the catalog", getBundle: "Get the full bundle",
    heroA: "Ready-made books & courses that", heroB: "convert", heroSub: "practical guides, mini-courses, checklists and prompt packs by Ginger-Eke Chienyegom. Pay once, download instantly, use them in your own business.",
    bundleTitle: "The whole library, one price.", bundleSub: "Every title in the catalog, including everything added later, for one payment.",
    getBundleBtn: "Get the bundle", aboutTitle: "About the author", aboutBody: "Ginger-Eke Chienyegom is a B2B digital systems architect, software developer and the founder of HelioConvert, based in Abuja, Nigeria. These guides come from the same practical, systems-first thinking behind HelioConvert's client work.",
    note: "Charged in Naira (₦). Other currencies are estimates.", instant: "Instant download after payment.", region: "Region",
  },
  fr: {
    kicker: "> [SYS] choisir · acheter · apprendre · gagner · grandir", h1a: "Choisissez un cours.", h1b: "Apprenez la compétence.", h1c: "Gagnez et progressez.",
    lead: "livres, guides, mini-formations, check-lists et packs de prompts pas à pas. Un contenu détaillé et pratique, utilisable dès le paiement.",
    statCourses: "cours et guides", statBundles: "packs thématiques", statPages: "pages d'apprentissage", statWords: "mots de contenu",
    howTitle: "De la curiosité aux revenus en quatre étapes",
    s1t: "Choisir", s1d: "Parcourez tous les titres : business, argent, marketing, IA, bien-être… ou prenez un pack thématique complet.",
    s2t: "Acheter", s2d: "Payez en Naira (ou voyez l'estimation locale). Sans compte : votre page de téléchargement apparaît aussitôt.",
    s3t: "Apprendre", s3d: "Suivez des leçons pas à pas, des méthodes, modèles et check-lists, à votre rythme.",
    s4t: "Gagner et grandir", s4d: "Appliquez les méthodes dans votre entreprise, vos missions ou votre carrière. Revenez-y quand vous voulez.",
    insideTitle: "Regardez à l'intérieur", insideSub: "De vraies pages de vrais cours : titres clairs, tableaux, méthodes et actions concrètes. Pas un PDF creux.", pagesWord: "pages", avgPages: "pages en moyenne",
    typesTitle: "Choisissez le format qui vous convient", typesSub: "Chaque sujet existe en plusieurs formats : allez en profondeur ou avancez vite.",
    tBook: "Maîtrise approfondie d'un sujet, chapitre par chapitre.", tGuide: "Des pas-à-pas à terminer en un week-end.",
    tMini: "Une mini-formation par e-mail qui construit une compétence leçon après leçon.", tCheck: "Check-lists rapides : auditer, corriger, livrer.",
    tList: "Listes courtes et percutantes d'erreurs, de mythes et d'actions.", tPrompt: "Des prompts IA prêts à l'emploi qui font le gros du travail.",
    bundles: "Packs", bundleTag: "Pack", inside: "Contenu", itemsWord: "éléments", buyBundle: "Acheter ce pack", bundlesSub: "Un sujet complet en un achat : tous les formats, un seul prix.", individually: "Ou achetez les éléments séparément", seeBundle: "Voir le pack",
    catalog: "Catalogue", bundle: "Pack complet", mainSite: "Site principal", indexed: "produits indexés", search: "Rechercher un titre ou un sujet…",
    allFormats: "Tous les formats", all: "Tous", showMore: "Afficher plus", left: "restants", none: "Aucun résultat.", buy: "Acheter",
    fullPage: "Page complète", close: "Fermer", email: "vous@email.com", browse: "Parcourir le catalogue", getBundle: "Obtenir le pack complet",
    heroA: "Des livres et formations prêts à l'emploi qui", heroB: "convertissent", heroSub: "guides pratiques, mini-formations, check-lists et packs de prompts par Ginger-Eke Chienyegom. Payez une fois, téléchargez immédiatement.",
    bundleTitle: "Toute la bibliothèque, un seul prix.", bundleSub: "Tous les titres du catalogue, y compris les futurs ajouts, en un seul paiement.",
    getBundleBtn: "Obtenir le pack", aboutTitle: "À propos de l'auteur", aboutBody: "Ginger-Eke Chienyegom est architecte de systèmes numériques B2B, développeur et fondateur de HelioConvert, basé à Abuja, au Nigeria.",
    note: "Facturé en Naira (₦). Les autres devises sont des estimations.", instant: "Téléchargement immédiat après paiement.", region: "Région",
  },
  es: {
    kicker: "> [SYS] elige · compra · aprende · gana · crece", h1a: "Elige un curso.", h1b: "Aprende la habilidad.", h1c: "Gana y crece.",
    lead: "libros, guías, minicursos, listas y paquetes de prompts paso a paso. Material detallado y práctico que puedes usar apenas pagas.",
    statCourses: "cursos y guías", statBundles: "paquetes temáticos", statPages: "páginas de aprendizaje", statWords: "palabras de contenido",
    howTitle: "De la curiosidad a ganar en cuatro pasos",
    s1t: "Elige", s1d: "Busca entre todos los títulos de negocios, dinero, marketing, IA, bienestar y más, o lleva un paquete temático completo.",
    s2t: "Compra", s2d: "Paga en Naira (o mira tu estimado local). Sin cuenta: tu página de descarga aparece al instante.",
    s3t: "Aprende", s3d: "Sigue lecciones paso a paso, marcos de trabajo, plantillas y listas a tu ritmo.",
    s4t: "Gana y crece", s4d: "Aplica los métodos en tu negocio, trabajo freelance o carrera. Vuelve a ellos cuando quieras.",
    insideTitle: "Mira por dentro", insideSub: "Páginas reales de cursos reales: títulos claros, tablas, marcos y pasos de acción. No un PDF vacío.", pagesWord: "páginas", avgPages: "páginas promedio",
    typesTitle: "Elige el formato que va contigo", typesSub: "Cada tema viene en varios formatos: profundiza o avanza rápido.",
    tBook: "Dominio profundo de un tema, capítulo a capítulo.", tGuide: "Guías paso a paso que terminas en un fin de semana.",
    tMini: "Un curso por correo que construye una habilidad lección a lección.", tCheck: "Listas de victorias rápidas: auditar, corregir, publicar.",
    tList: "Listas cortas y directas de errores, mitos y jugadas.", tPrompt: "Prompts de IA listos para usar que hacen el trabajo pesado.",
    bundles: "Paquetes", bundleTag: "Paquete", inside: "Qué incluye", itemsWord: "elementos", buyBundle: "Comprar este paquete", bundlesSub: "Un tema completo en una compra: todos los formatos, un solo precio.", individually: "O compra los elementos por separado", seeBundle: "Ver paquete",
    catalog: "Catálogo", bundle: "Paquete completo", mainSite: "Sitio principal", indexed: "productos indexados", search: "Buscar títulos y temas…",
    allFormats: "Todos los formatos", all: "Todos", showMore: "Ver más", left: "restantes", none: "Sin resultados.", buy: "Comprar",
    fullPage: "Página completa", close: "Cerrar", email: "tu@email.com", browse: "Ver el catálogo", getBundle: "Obtener el paquete completo",
    heroA: "Libros y cursos listos para usar que", heroB: "convierten", heroSub: "guías prácticas, mini-cursos, listas de verificación y paquetes de prompts de Ginger-Eke Chienyegom. Paga una vez y descarga al instante.",
    bundleTitle: "Toda la biblioteca, un solo precio.", bundleSub: "Todos los títulos del catálogo, incluidos los futuros, con un solo pago.",
    getBundleBtn: "Obtener el paquete", aboutTitle: "Sobre el autor", aboutBody: "Ginger-Eke Chienyegom es arquitecto de sistemas digitales B2B, desarrollador y fundador de HelioConvert, con sede en Abuya, Nigeria.",
    note: "Se cobra en Naira (₦). Otras monedas son estimaciones.", instant: "Descarga inmediata tras el pago.", region: "Región",
  },
  pt: {
    kicker: "> [SYS] escolha · compre · aprenda · ganhe · cresça", h1a: "Escolha um curso.", h1b: "Aprenda a habilidade.", h1c: "Ganhe e cresça.",
    lead: "livros, guias, minicursos, checklists e pacotes de prompts passo a passo. Material detalhado e prático para usar assim que pagar.",
    statCourses: "cursos e guias", statBundles: "pacotes temáticos", statPages: "páginas de aprendizado", statWords: "palavras de conteúdo",
    howTitle: "Da curiosidade à renda em quatro passos",
    s1t: "Escolha", s1d: "Pesquise todos os títulos de negócios, dinheiro, marketing, IA, bem-estar e mais, ou leve um pacote temático completo.",
    s2t: "Compre", s2d: "Pague em Naira (ou veja a estimativa local). Sem conta: sua página de download aparece na hora.",
    s3t: "Aprenda", s3d: "Siga lições passo a passo, métodos, modelos e checklists no seu ritmo.",
    s4t: "Ganhe e cresça", s4d: "Aplique os métodos no seu negócio, freelas ou carreira. Volte a eles quando quiser.",
    insideTitle: "Veja por dentro", insideSub: "Páginas reais de cursos reais: títulos claros, tabelas, métodos e passos de ação. Não um PDF vazio.", pagesWord: "páginas", avgPages: "páginas em média",
    typesTitle: "Escolha o formato que combina com você", typesSub: "Cada tema vem em vários formatos: aprofunde ou avance rápido.",
    tBook: "Domínio profundo de um tema, capítulo a capítulo.", tGuide: "Passo a passo que você termina em um fim de semana.",
    tMini: "Um curso por e-mail que constrói uma habilidade lição a lição.", tCheck: "Checklists de vitórias rápidas: auditar, corrigir, publicar.",
    tList: "Listas curtas e diretas de erros, mitos e jogadas.", tPrompt: "Prompts de IA prontos que fazem o trabalho pesado.",
    bundles: "Pacotes", bundleTag: "Pacote", inside: "O que inclui", itemsWord: "itens", buyBundle: "Comprar este pacote", bundlesSub: "Um tema completo em uma compra: todos os formatos, um só preço.", individually: "Ou compre os itens separadamente", seeBundle: "Ver pacote",
    catalog: "Catálogo", bundle: "Pacote completo", mainSite: "Site principal", indexed: "produtos indexados", search: "Pesquisar títulos e temas…",
    allFormats: "Todos os formatos", all: "Todos", showMore: "Ver mais", left: "restantes", none: "Nenhum resultado.", buy: "Comprar",
    fullPage: "Página completa", close: "Fechar", email: "voce@email.com", browse: "Ver o catálogo", getBundle: "Obter o pacote completo",
    heroA: "Livros e cursos prontos que", heroB: "convertem", heroSub: "guias práticos, minicursos, checklists e pacotes de prompts de Ginger-Eke Chienyegom. Pague uma vez e baixe na hora.",
    bundleTitle: "A biblioteca inteira, um só preço.", bundleSub: "Todos os títulos do catálogo, incluindo os futuros, em um único pagamento.",
    getBundleBtn: "Obter o pacote", aboutTitle: "Sobre o autor", aboutBody: "Ginger-Eke Chienyegom é arquiteto de sistemas digitais B2B, desenvolvedor e fundador da HelioConvert, sediado em Abuja, Nigéria.",
    note: "Cobrado em Naira (₦). Outras moedas são estimativas.", instant: "Download imediato após o pagamento.", region: "Região",
  },
} as const;

export type Strings = { [K in keyof (typeof STR)["en"]]: string };
export const strings = (lang: Lang): Strings => STR[lang] ?? STR.en;
