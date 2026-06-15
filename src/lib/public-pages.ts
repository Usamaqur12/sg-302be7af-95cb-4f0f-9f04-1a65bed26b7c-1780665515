export interface PublicPageSection {
  heading: string;
  body: string;
}

export interface PublicPageContact {
  email?: string;
  phone?: string;
  address?: string;
  hours?: string;
}

export interface PublicPageDefinition {
  slug: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: PublicPageSection[];
  contact?: PublicPageContact;
}

export const defaultPublicPages: PublicPageDefinition[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "Marketplace rules for buyers, sellers, payments, delivery, returns and account use.",
    lastUpdated: "June 2026",
    sections: [
      {
        heading: "Acceptance of Terms",
        body: "By accessing this marketplace, customers and sellers agree to follow the platform rules, account requirements and transaction policies controlled by the marketplace admin.",
      },
      {
        heading: "Buyer and Seller Accounts",
        body: "Users are responsible for keeping account details accurate and secure. Sellers must complete KYC, keep listings truthful and fulfill orders according to the approved marketplace workflow.",
      },
      {
        heading: "Product Listings",
        body: "All seller products remain pending until admin approval. The admin may approve, reject, suspend, feature or remove listings to protect customers and platform quality.",
      },
      {
        heading: "Payments, Payouts and Fees",
        body: "Payments, commissions, seller earnings and withdrawal requests are managed through the platform finance workflow. Sellers can only withdraw available balances after admin review.",
      },
      {
        heading: "Returns and Refunds",
        body: "Customers can request returns for eligible orders. Admin reviews return requests, seller notes, delivery status and refund approvals before funds are released.",
      },
      {
        heading: "Contact",
        body: "Questions about these terms can be sent to legal@marketplace.com.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How customer, seller, KYC, payment and order information is collected and used.",
    lastUpdated: "June 2026",
    sections: [
      {
        heading: "Information We Collect",
        body: "We collect account details, contact information, order activity, seller business information, KYC documents and support messages needed to operate the marketplace.",
      },
      {
        heading: "How We Use Information",
        body: "Information is used to process orders, approve sellers, verify KYC, manage payments, track delivery, handle support and improve marketplace safety.",
      },
      {
        heading: "Seller KYC and Documents",
        body: "Seller CNIC, business registration, bank proof and related KYC files are visible to authorized admin staff for verification and compliance review.",
      },
      {
        heading: "Sharing",
        body: "Order and fulfillment data may be shared with sellers, shipping teams, payment processors and support staff only as needed for marketplace operations.",
      },
      {
        heading: "Security",
        body: "The platform uses role-based access, session controls and admin-only areas to reduce unauthorized access to sensitive data.",
      },
      {
        heading: "Contact",
        body: "Privacy requests can be sent to privacy@marketplace.com.",
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact Us",
    summary: "Reach marketplace support for buyer help, seller support, payments, returns and KYC questions.",
    lastUpdated: "June 2026",
    contact: {
      email: "support@marketplace.com",
      phone: "+92 300 0000000",
      address: "Karachi, Pakistan",
      hours: "Monday - Saturday, 9:00 AM - 6:00 PM",
    },
    sections: [
      {
        heading: "Support Scope",
        body: "Use this page for order issues, seller onboarding, payment proof, return requests, KYC questions and technical support.",
      },
    ],
  },
  {
    slug: "about",
    title: "About Mercato",
    summary: "A multivendor marketplace built for verified sellers, trusted products and reliable operations.",
    lastUpdated: "June 2026",
    sections: [
      {
        heading: "Marketplace Mission",
        body: "Mercato helps customers discover products from verified sellers while keeping approvals, content, seller access and fulfillment workflows organized.",
      },
      {
        heading: "Seller Quality",
        body: "Sellers are reviewed through KYC, account health controls and admin-managed Seller Center permissions before their products reach customers.",
      },
    ],
  },
];

function cleanSlug(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeSection(section: unknown): PublicPageSection | null {
  const raw = section as Partial<PublicPageSection> | null | undefined;
  const heading = cleanText(raw?.heading);
  const body = cleanText(raw?.body);
  if (!heading && !body) return null;
  return {
    heading: heading || "Section",
    body,
  };
}

function normalizeContact(value: unknown): PublicPageContact | undefined {
  const raw = value as Partial<PublicPageContact> | null | undefined;
  const contact = {
    email: cleanText(raw?.email),
    phone: cleanText(raw?.phone),
    address: cleanText(raw?.address),
    hours: cleanText(raw?.hours),
  };
  if (!contact.email && !contact.phone && !contact.address && !contact.hours) return undefined;
  return contact;
}

export function normalizePublicPages(value: unknown): PublicPageDefinition[] {
  const rows = Array.isArray(value) ? value : [];
  const pages = rows
    .map((page, index) => {
      const raw = page as Partial<PublicPageDefinition> | null | undefined;
      const slug = cleanSlug(raw?.slug) || `page-${index + 1}`;
      const title = cleanText(raw?.title) || "Untitled Page";
      const sections = Array.isArray(raw?.sections)
        ? raw.sections.map(normalizeSection).filter(Boolean) as PublicPageSection[]
        : [];

      return {
        slug,
        title,
        summary: cleanText(raw?.summary),
        lastUpdated: cleanText(raw?.lastUpdated) || "June 2026",
        sections: sections.length ? sections : [{ heading: "Content", body: "" }],
        contact: normalizeContact(raw?.contact),
      };
    })
    .filter((page) => page.slug && page.title);

  return pages.length ? pages : defaultPublicPages;
}

export function parsePublicPages(value: unknown): PublicPageDefinition[] {
  if (!value) return defaultPublicPages;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return normalizePublicPages(parsed);
  } catch {
    return defaultPublicPages;
  }
}

export function publicPagesToJson(pages: PublicPageDefinition[]) {
  return JSON.stringify(normalizePublicPages(pages), null, 2);
}

export function getDefaultPublicPage(slug: string) {
  return defaultPublicPages.find((page) => page.slug === slug) ?? defaultPublicPages[0];
}

export function findPublicPage(pages: PublicPageDefinition[], slug: string) {
  return pages.find((page) => page.slug === cleanSlug(slug));
}
