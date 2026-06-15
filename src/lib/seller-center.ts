export const sellerCenterSettingKeys = [
  "seller_center_important_notification",
  "seller_center_learning_enabled",
  "seller_center_toolkit_enabled",
  "seller_center_campaign_name",
  "seller_center_enabled_options",
] as const;

export const defaultSellerCenterSettings = {
  seller_center_important_notification: "You are updated! No new important notification for you.",
  seller_center_learning_enabled: "true",
  seller_center_toolkit_enabled: "true",
  seller_center_campaign_name: "11.11 Growth Guide",
  seller_center_enabled_options: "all",
};

export const sellerCenterModules = [
  {
    title: "Products",
    href: "/seller/products",
    description: "Create products, manage stock, SKUs, images and approval status.",
    features: ["Manage products", "Media center", "Opportunity center"],
    options: [
      {
        title: "Manage Products",
        href: "/seller/products",
        description: "Review all live, pending, draft and rejected product listings.",
      },
      {
        title: "Add Products",
        href: "/seller/products/new",
        description: "Create a new product with category, price, inventory and media.",
      },
      {
        title: "Media Center",
        href: "/seller/products?view=media-center",
        description: "Review product image readiness, uploaded media and listing assets.",
      },
      {
        title: "Fulfilment by Marketplace",
        href: "/seller/products?view=fulfilment",
        description: "Prepare products and stock for managed fulfillment workflows.",
      },
      {
        title: "Brand Management",
        href: "/seller/products?view=brand-management",
        description: "Keep brands, authorization documents and category attributes ready.",
      },
      {
        title: "Opportunity Center",
        href: "/seller/products?view=opportunity-center",
        description: "Find high demand products, collect opportunities and upload matching listings.",
      },
    ],
  },
  {
    title: "Assortment Growth",
    href: "/seller/assortment-growth",
    description: "Find catalog gaps, improve stock depth and grow active assortment.",
    features: ["Opportunity filters", "Demand gaps", "Traffic boost"],
    options: [
      {
        title: "Assortment Growth Center",
        href: "/seller/assortment-growth?view=growth-center",
        description: "Open recommended actions for assortment, stock and conversion growth.",
      },
      {
        title: "Opportunity Center",
        href: "/seller/assortment-growth?view=opportunity-center",
        description: "Collect high-demand/low-supply product opportunities and upload matching listings.",
      },
      {
        title: "Uploaded Products",
        href: "/seller/assortment-growth?view=uploaded-products",
        description: "Track products uploaded from collected opportunities.",
      },
      {
        title: "High Demand Low Supply",
        href: "/seller/assortment-growth?view=high-demand-low-supply",
        description: "Review products with strong buyer demand and limited supply.",
      },
      {
        title: "Top Product",
        href: "/seller/assortment-growth?view=top-product",
        description: "Review trending product suggestions and price bands.",
      },
    ],
  },
  {
    title: "Orders and Reviews",
    href: "/seller/orders",
    description: "Handle pending orders, fulfillment status and customer reviews.",
    features: ["Pending orders", "To be reviewed", "Delivery workflow"],
    options: [
      {
        title: "All Orders",
        href: "/seller/orders",
        description: "View every order item that belongs to your seller store.",
      },
      {
        title: "Pending Orders",
        href: "/seller/orders?status=pending",
        description: "Start processing new orders waiting for seller action.",
      },
      {
        title: "Processing Orders",
        href: "/seller/orders?status=processing",
        description: "Continue packing and fulfillment for orders already accepted.",
      },
      {
        title: "Ready to Ship",
        href: "/seller/orders?status=shipped",
        description: "Track orders that have moved into shipping workflow.",
      },
      {
        title: "Delivered Orders",
        href: "/seller/orders?status=delivered",
        description: "Review completed sales and earned revenue.",
      },
      {
        title: "Cancelled Orders",
        href: "/seller/orders?status=cancelled",
        description: "Monitor cancelled orders and failed fulfillment patterns.",
      },
      {
        title: "Customer Reviews",
        href: "/seller/reviews",
        description: "Read ratings and product feedback from verified customers.",
      },
      {
        title: "Submit a Claim",
        href: "/seller/support?tool=claim",
        description: "Open a support claim for order, return or payment issues.",
      },
    ],
  },
  {
    title: "Account Health",
    href: "/seller/account-health",
    description: "Run seller operations reviews for non-compliance points, order volume limits and policy risk signals.",
    features: ["Policy signals", "Order volume limit", "Corrective actions"],
    options: [
      {
        title: "Account Health Overview",
        href: "/seller/account-health",
        description: "Review your health score, active risk level, required evidence and corrective actions.",
      },
      {
        title: "Non-compliance Points",
        href: "/seller/account-health?view=ncp",
        description: "Track policy points, root causes, evidence and actions needed to keep the store healthy.",
      },
      {
        title: "Order Volume Limit",
        href: "/seller/account-health?view=ovl",
        description: "See your daily fulfillment capacity, cutoff risk and account limit recovery path.",
      },
      {
        title: "Policy Center",
        href: "/seller/guidelines",
        description: "Review marketplace rules, listing policy, fulfillment standards and escalation guidance.",
      },
      {
        title: "Performance Tips",
        href: "/seller/account-health?view=performance",
        description: "Use practical actions to improve fulfillment, buyer experience and quality metrics.",
      },
    ],
  },
  {
    title: "Marketing Center",
    href: "/seller/marketing",
    description: "Join campaigns, prepare DrzFlash deals, run promotions and manage discount tools.",
    features: ["Campaign calendar", "Flash sale slots", "Promotion tools"],
    options: [
      {
        title: "Campaign",
        href: "/seller/marketing?tool=campaign",
        description: "Prepare seller campaigns, event participation and campaign submissions.",
      },
      {
        title: "DrzFlash",
        href: "/seller/marketing?tool=drzflash",
        description: "Prepare time-bound product offers, campaign stock and flash sale slots.",
      },
      {
        title: "Promotions",
        href: "/seller/marketing?tool=promotions",
        description: "Create voucher, free shipping and bundle promotion requests.",
      },
      {
        title: "Daraz Coins Discount",
        href: "/seller/marketing?tool=coins",
        description: "Design coin-style discounts and loyalty conversion hooks.",
      },
      {
        title: "Daraz Programs",
        href: "/seller/marketing?tool=programs",
        description: "Apply for program participation, growth tasks and seller benefits.",
      },
      {
        title: "Submission History",
        href: "/seller/marketing?tool=submissions",
        description: "Track campaign, voucher, ads and promotion requests submitted to admin.",
      },
    ],
  },
  {
    title: "Marketing Solutions",
    href: "/seller/marketing-solutions",
    description: "Promote products with sponsored slots and performance tracking.",
    features: ["Sponsored discovery", "Product ads", "Ad performance"],
    options: [
      {
        title: "Overview",
        href: "/seller/marketing-solutions?tool=overview",
        description: "Review sponsored discovery, account balance and campaign readiness.",
      },
      {
        title: "Product Ads",
        href: "/seller/marketing-solutions?tool=product-ads",
        description: "Create and run product ad requests for selected listings.",
      },
      {
        title: "Ad Performance",
        href: "/seller/marketing-solutions?tool=ad-performance",
        description: "Track clicks, spend, conversion and ad learning signals.",
      },
      {
        title: "Account Settings",
        href: "/seller/marketing-solutions?tool=account-settings",
        description: "Manage sponsored ads balance, top-up requests and account controls.",
      },
    ],
  },
  {
    title: "Data Insight",
    href: "/seller/analytics",
    description: "Track sales, views, conversion and product performance trends.",
    features: ["Sales insight", "Product ranking", "Traffic health"],
    options: [
      {
        title: "Business Advisor",
        href: "/seller/analytics",
        description: "View sales, revenue and product performance in one dashboard.",
      },
      {
        title: "Dashboard",
        href: "/seller/analytics?view=dashboard",
        description: "Review realtime performance, key metrics and ranking cards.",
      },
      {
        title: "Product",
        href: "/seller/analytics?view=product",
        description: "Compare product views, sales count, rating and inventory signals.",
      },
      {
        title: "Promotion",
        href: "/seller/analytics?view=promotion",
        description: "Review promotion performance and campaign conversion signals.",
      },
      {
        title: "FAQ",
        href: "/seller/analytics?view=faq",
        description: "Read business advisor metric definitions and dashboard guidance.",
      },
    ],
  },
  {
    title: "Learn and Grow",
    href: "/seller/learn",
    description: "Education resources, policies, image guidelines and platform guides.",
    features: ["Policies", "FBD guides", "Image guidelines"],
    options: [
      {
        title: "Daraz University",
        href: "/seller/learn?view=university",
        description: "Open training resources, courses and seller education paths.",
      },
      {
        title: "Policies and Guidelines",
        href: "/seller/guidelines",
        description: "Read seller rules, listing policy and marketplace standards.",
      },
      {
        title: "Fulfillment Guides",
        href: "/seller/learn?view=fulfillment",
        description: "Learn order handling, inbound stock and outbound workflow basics.",
      },
      {
        title: "Education Livestream",
        href: "/seller/learn?view=livestream",
        description: "Follow campaign learning and seller training sessions.",
      },
      {
        title: "Image Guidelines",
        href: "/seller/learn?view=image-guidelines",
        description: "Improve product content quality for approval and conversion.",
      },
    ],
  },
  {
    title: "Store",
    href: "/seller/store",
    description: "Manage storefront identity, seller profile, branding and shop status.",
    features: ["Store profile", "Holiday mode", "Brand assets"],
    options: [
      {
        title: "Store Profile",
        href: "/seller/store",
        description: "Review store identity, public profile, brand assets and shop status.",
      },
      {
        title: "Store Decoration",
        href: "/seller/store?view=decoration",
        description: "Plan storefront visuals, banners and customer-facing layout.",
      },
      {
        title: "Store Builder",
        href: "/seller/store?view=builder",
        description: "Organize store sections, featured products and shop experience.",
      },
      {
        title: "Holiday Mode",
        href: "/seller/store?view=holiday-mode",
        description: "Check current holiday status and customer purchase availability.",
      },
      {
        title: "Chat and Messages",
        href: "/seller/support?tool=messages",
        description: "Open seller communication and support conversation workflow.",
      },
    ],
  },
  {
    title: "Finance",
    href: "/seller/earnings",
    description: "Review earnings, withdrawals, commissions and payout status.",
    features: ["Earnings", "Payouts", "Commission"],
    options: [
      {
        title: "MyIncome",
        href: "/seller/earnings",
        description: "Review income overview, release status and statement details.",
      },
      {
        title: "Seller finance",
        href: "/seller/earnings?view=seller-finance",
        description: "Track payout readiness, account statement and withdrawal requests.",
      },
      {
        title: "Shared Wallet",
        href: "/seller/earnings?view=shared-wallet",
        description: "Track marketing balance, top-up requests and wallet movement.",
      },
    ],
  },
  {
    title: "Setting and Support",
    href: "/seller/support",
    description: "Access support tickets, claims, policy guidance and seller operations help.",
    features: ["Support tickets", "Claims", "Policy help"],
    options: [
      {
        title: "Help Center",
        href: "/seller/support",
        description: "Find support articles and seller help resources.",
      },
      {
        title: "Support Tickets",
        href: "/seller/support?view=tickets",
        description: "Create, monitor and follow seller support cases.",
      },
      {
        title: "Submit a Claim",
        href: "/seller/support?tool=claim",
        description: "Raise a claim for order, payment, fulfillment or account issues.",
      },
      {
        title: "Policies",
        href: "/seller/guidelines",
        description: "Open seller policy, quality rules and compliance guidance.",
      },
      {
        title: "Seller App",
        href: "/seller/support?view=app",
        description: "Access mobile seller workflow guidance and app readiness.",
      },
    ],
  },
  {
    title: "My Account",
    href: "/seller/settings",
    description: "Seller account, business documents, bank information and owner details.",
    features: ["Business info", "Bank details", "KYC"],
    options: [
      {
        title: "Account Profile",
        href: "/seller/settings",
        description: "Manage account details, business contact and seller identity.",
      },
      {
        title: "Business Information",
        href: "/seller/settings?view=business",
        description: "Review business address, email, phone and owner details.",
      },
      {
        title: "KYC Documents",
        href: "/seller/settings?view=kyc",
        description: "Keep verification documents ready for account review.",
      },
      {
        title: "Bank Information",
        href: "/seller/settings?view=bank",
        description: "Maintain payout account and bank details.",
      },
      {
        title: "Security Settings",
        href: "/seller/settings?view=security",
        description: "Review account security and access readiness.",
      },
    ],
  },
];

export const allSellerCenterOptionHrefs = Array.from(
  new Set(sellerCenterModules.flatMap((module) => module.options.map((option) => option.href)))
);

const sellerCenterOptionAliases: Record<string, string> = {
  "/seller/marketing?tool=campaigns": "/seller/marketing?tool=campaign",
  "/seller/marketing?tool=flash-sale": "/seller/marketing?tool=drzflash",
  "/seller/marketing?tool=voucher": "/seller/marketing?tool=promotions",
  "/seller/marketing?tool=free-shipping": "/seller/marketing?tool=promotions",
  "/seller/marketing?tool=bundles": "/seller/marketing?tool=promotions",
};

export const sellerLearningResources = [
  {
    title: "Policies & Guidelines",
    description: "Marketplace policies, seller rules and terms.",
    href: "/seller/guidelines",
    views: "244,783",
  },
  {
    title: "FBD: Creating An Outbound Order",
    description: "Fulfillment workflow and outbound order basics.",
    href: "/seller/learn",
    views: "118,136",
  },
  {
    title: "Fulfilment by Marketplace",
    description: "Inbound stock, warehouse readiness and delivery operations.",
    href: "/seller/learn",
    views: "97,660",
  },
  {
    title: "Image Guidelines",
    description: "Improve product photos for higher approval rates.",
    href: "/seller/learn",
    views: "169,175",
  },
];

export const sellerToolkitLinks = [
  { title: "Marketing Solutions", href: "/seller/marketing-solutions?tool=sponsored-products" },
  { title: "Campaign", href: "/seller/marketing?tool=campaign" },
  { title: "DrzFlash", href: "/seller/marketing?tool=drzflash" },
  { title: "Promotions", href: "/seller/marketing?tool=promotions" },
  { title: "Daraz Coins Discount", href: "/seller/marketing?tool=coins" },
  { title: "Education Livestream", href: "/seller/learn?view=livestream" },
];

export function settingValue(
  rows: Array<{ key: string; value: unknown }> | null | undefined,
  key: keyof typeof defaultSellerCenterSettings
) {
  const found = rows?.find((row) => row.key === key)?.value;
  return String(found ?? defaultSellerCenterSettings[key]);
}

export function settingEnabled(
  rows: Array<{ key: string; value: unknown }> | null | undefined,
  key: "seller_center_learning_enabled" | "seller_center_toolkit_enabled"
) {
  return settingValue(rows, key).toLowerCase() !== "false";
}

export function parseSellerCenterEnabledOptions(value: unknown) {
  const raw = String(value ?? "all").trim();
  if (!raw || raw.toLowerCase() === "all") return allSellerCenterOptionHrefs;

  const requested = new Set(
    raw
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
  for (const [legacyHref, currentHref] of Object.entries(sellerCenterOptionAliases)) {
    if (requested.has(legacyHref)) requested.add(currentHref);
  }

  return allSellerCenterOptionHrefs.filter((href) => requested.has(href));
}

export function serializeSellerCenterEnabledOptions(hrefs: string[]) {
  const enabled = allSellerCenterOptionHrefs.filter((href) => hrefs.includes(href));
  return enabled.length === allSellerCenterOptionHrefs.length ? "all" : enabled.join("\n");
}

export function enabledSellerCenterOptionHrefs(
  rows: Array<{ key: string; value: unknown }> | null | undefined
) {
  return parseSellerCenterEnabledOptions(settingValue(rows, "seller_center_enabled_options"));
}

export function sellerCenterRowsWithSellerOverride(
  rows: Array<{ key: string; value: unknown }> | null | undefined,
  sellerEnabledOptions: unknown
) {
  const override = String(sellerEnabledOptions ?? "").trim();
  if (!override) return rows ?? [];

  return [
    ...(rows ?? []).filter((row) => row.key !== "seller_center_enabled_options"),
    { key: "seller_center_enabled_options", value: override },
  ];
}

export function sellerCenterOptionEnabled(
  rows: Array<{ key: string; value: unknown }> | null | undefined,
  href: string
) {
  return enabledSellerCenterOptionHrefs(rows).includes(href);
}

export function visibleSellerCenterModules(
  rows: Array<{ key: string; value: unknown }> | null | undefined
) {
  const enabled = new Set(enabledSellerCenterOptionHrefs(rows));
  return sellerCenterModules
    .map((module) => ({
      ...module,
      options: module.options.filter((option) => enabled.has(option.href)),
    }))
    .filter((module) => module.options.length > 0);
}
