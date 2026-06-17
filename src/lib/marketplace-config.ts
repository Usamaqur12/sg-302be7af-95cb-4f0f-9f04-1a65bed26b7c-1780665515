export interface MarketplaceCategoryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string | null;
  children?: MarketplaceCategoryConfig[];
}

export interface FooterLinkConfig {
  label: string;
  href: string;
}

export interface FooterSectionConfig {
  title: string;
  links: FooterLinkConfig[];
}

export interface SellerCampaignSlotConfig {
  title: string;
  window: string;
  eligibility: string;
  discount: string;
  channel: string;
  type?: "campaign" | "drzflash";
  status?: "active" | "draft" | "ended";
}

export const pakistanMajorCities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Sukkur",
  "Bahawalpur",
  "Abbottabad",
  "Mardan",
  "Rahim Yar Khan",
  "Sargodha",
  "Larkana",
  "Sheikhupura",
  "Mirpur",
];

export const currencyOptions = [
  { code: "PKR", symbol: "Rs", label: "Pakistani Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "GBP", label: "British Pound" },
  { code: "EUR", symbol: "EUR", label: "Euro" },
  { code: "AED", symbol: "AED", label: "UAE Dirham" },
  { code: "SAR", symbol: "SAR", label: "Saudi Riyal" },
];

export const defaultFooterSections: FooterSectionConfig[] = [
  {
    title: "Get to Know Us",
    links: [
      { label: "About Mercato", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press Center", href: "/press" },
      { label: "Investor Relations", href: "/investors" },
    ],
  },
  {
    title: "Make Money with Us",
    links: [
      { label: "Sell on Mercato", href: "/seller-info" },
      { label: "Seller Center", href: "/seller" },
      { label: "Vendor Signup", href: "/seller/register" },
      { label: "Advertise Products", href: "/seller/marketing-solutions" },
      { label: "Fulfillment Services", href: "/seller/learn?view=fulfillment" },
    ],
  },
  {
    title: "Payment Products",
    links: [
      { label: "Business Account", href: "/business" },
      { label: "Shop with Points", href: "/rewards" },
      { label: "Reload Balance", href: "/account/dashboard" },
      { label: "Currency Converter", href: "/currency" },
      { label: "Payment Help", href: "/help?topic=payments" },
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      { label: "Your Account", href: "/account/dashboard" },
      { label: "Your Orders", href: "/account/orders" },
      { label: "Shipping Rates", href: "/shipping" },
      { label: "Returns & Replacements", href: "/returns" },
      { label: "Help Center", href: "/help" },
    ],
  },
];

export const defaultSellerCampaignSlots: SellerCampaignSlotConfig[] = [
  {
    title: "Mid Month Mega Campaign",
    window: "Jun 15 - Jun 20",
    eligibility: "Approved products with stock above 10 units",
    discount: "5% - 20%",
    channel: "Homepage + category slots",
    type: "campaign",
    status: "active",
  },
  {
    title: "Electronics Week",
    window: "Jun 22 - Jun 29",
    eligibility: "Electronics, computers and accessories",
    discount: "8% - 25%",
    channel: "Category campaign",
    type: "campaign",
    status: "active",
  },
  {
    title: "Payday Deals",
    window: "Jul 01 - Jul 05",
    eligibility: "All active sellers with ready stock",
    discount: "Flat or percentage voucher",
    channel: "Campaign landing page",
    type: "campaign",
    status: "active",
  },
  {
    title: "Flash Deal Rush",
    window: "Admin scheduled flash sale",
    eligibility: "Approved products with ready stock and competitive pricing",
    discount: "Limited-time flash discount",
    channel: "DrzFlash slot",
    type: "drzflash",
    status: "active",
  },
];

export const amazonStyleCategories: MarketplaceCategoryConfig[] = [
  {
    id: "00000000-0000-4000-8000-000000001001",
    name: "Electronics",
    slug: "electronics",
    description: "Mobiles, cameras, audio, TV and everyday consumer electronics.",
    children: [
      { id: "00000000-0000-4000-8000-000000001101", name: "Mobiles & Accessories", slug: "mobiles-accessories", description: "Smartphones, chargers, cases and wearables." },
      { id: "00000000-0000-4000-8000-000000001102", name: "TV & Home Theater", slug: "tv-home-theater", description: "Televisions, streaming devices and home cinema gear." },
      { id: "00000000-0000-4000-8000-000000001103", name: "Camera & Photo", slug: "camera-photo", description: "Cameras, lenses, tripods and photo accessories." },
      { id: "00000000-0000-4000-8000-000000001104", name: "Headphones & Audio", slug: "headphones-audio", description: "Headphones, speakers and audio accessories." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001002",
    name: "Computers",
    slug: "computers",
    description: "Laptops, desktops, components, printers and computer accessories.",
    children: [
      { id: "00000000-0000-4000-8000-000000001105", name: "Laptops", slug: "laptops", description: "Work, gaming and everyday laptops." },
      { id: "00000000-0000-4000-8000-000000001106", name: "Desktops & Monitors", slug: "desktops-monitors", description: "Desktop PCs, displays and workstations." },
      { id: "00000000-0000-4000-8000-000000001107", name: "Computer Components", slug: "computer-components", description: "Storage, memory, graphics and PC parts." },
      { id: "00000000-0000-4000-8000-000000001108", name: "Printers & Ink", slug: "printers-ink", description: "Printers, scanners, toner and ink." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001003",
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Kitchen, dining, bedding, decor, furniture and home essentials.",
    children: [
      { id: "00000000-0000-4000-8000-000000001109", name: "Kitchen & Dining", slug: "kitchen-dining", description: "Cookware, dinnerware and kitchen tools." },
      { id: "00000000-0000-4000-8000-000000001110", name: "Bedding & Bath", slug: "bedding-bath", description: "Bedding, towels and bath accessories." },
      { id: "00000000-0000-4000-8000-000000001111", name: "Furniture", slug: "furniture", description: "Living room, bedroom and office furniture." },
      { id: "00000000-0000-4000-8000-000000001112", name: "Storage & Organization", slug: "storage-organization", description: "Closet, pantry and home organization." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001004",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description: "Skincare, haircare, makeup, fragrance and grooming.",
    children: [
      { id: "00000000-0000-4000-8000-000000001113", name: "Skin Care", slug: "skin-care", description: "Cleansers, moisturizers and treatments." },
      { id: "00000000-0000-4000-8000-000000001114", name: "Hair Care", slug: "hair-care", description: "Shampoo, styling tools and treatments." },
      { id: "00000000-0000-4000-8000-000000001115", name: "Makeup", slug: "makeup", description: "Face, eye, lip and nail makeup." },
      { id: "00000000-0000-4000-8000-000000001116", name: "Fragrance", slug: "fragrance", description: "Perfume, cologne and body sprays." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001005",
    name: "Clothing, Shoes & Jewelry",
    slug: "clothing-shoes-jewelry",
    description: "Fashion for women, men, kids, shoes, watches and jewelry.",
    children: [
      { id: "00000000-0000-4000-8000-000000001117", name: "Women's Fashion", slug: "womens-fashion", description: "Clothing, shoes, handbags and accessories." },
      { id: "00000000-0000-4000-8000-000000001118", name: "Men's Fashion", slug: "mens-fashion", description: "Clothing, shoes, watches and accessories." },
      { id: "00000000-0000-4000-8000-000000001119", name: "Girls' Fashion", slug: "girls-fashion", description: "Girls' clothing, shoes and accessories." },
      { id: "00000000-0000-4000-8000-000000001120", name: "Boys' Fashion", slug: "boys-fashion", description: "Boys' clothing, shoes and accessories." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001006",
    name: "Health & Household",
    slug: "health-household",
    description: "Vitamins, wellness, household supplies and personal health.",
    children: [
      { id: "00000000-0000-4000-8000-000000001121", name: "Vitamins & Supplements", slug: "vitamins-supplements", description: "Daily wellness and nutrition support." },
      { id: "00000000-0000-4000-8000-000000001122", name: "Medical Supplies", slug: "medical-supplies", description: "Home health, first aid and monitoring tools." },
      { id: "00000000-0000-4000-8000-000000001123", name: "Household Supplies", slug: "household-supplies", description: "Paper, cleaning and pantry household supplies." },
      { id: "00000000-0000-4000-8000-000000001124", name: "Personal Care", slug: "personal-care", description: "Hygiene, grooming and personal care products." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001007",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    description: "Fitness, camping, team sports, outdoor recreation and travel gear.",
    children: [
      { id: "00000000-0000-4000-8000-000000001125", name: "Exercise & Fitness", slug: "exercise-fitness", description: "Training equipment, yoga and fitness accessories." },
      { id: "00000000-0000-4000-8000-000000001126", name: "Outdoor Recreation", slug: "outdoor-recreation", description: "Camping, hiking and outdoor gear." },
      { id: "00000000-0000-4000-8000-000000001127", name: "Team Sports", slug: "team-sports", description: "Cricket, football, basketball and more." },
      { id: "00000000-0000-4000-8000-000000001128", name: "Sports Clothing", slug: "sports-clothing", description: "Performance apparel and shoes." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001008",
    name: "Toys & Games",
    slug: "toys-games",
    description: "Toys, learning games, puzzles, action figures and family play.",
    children: [
      { id: "00000000-0000-4000-8000-000000001129", name: "Action Figures", slug: "action-figures", description: "Collectibles, figures and playsets." },
      { id: "00000000-0000-4000-8000-000000001130", name: "Learning Toys", slug: "learning-toys", description: "STEM, early learning and educational toys." },
      { id: "00000000-0000-4000-8000-000000001131", name: "Board Games", slug: "board-games", description: "Board games, card games and party games." },
      { id: "00000000-0000-4000-8000-000000001132", name: "Outdoor Play", slug: "outdoor-play", description: "Ride-ons, sports toys and outdoor fun." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001009",
    name: "Automotive",
    slug: "automotive",
    description: "Car parts, motorcycle gear, oils, tools and vehicle accessories.",
    children: [
      { id: "00000000-0000-4000-8000-000000001133", name: "Car Electronics", slug: "car-electronics", description: "Dash cams, audio and vehicle tech." },
      { id: "00000000-0000-4000-8000-000000001134", name: "Oils & Fluids", slug: "oils-fluids", description: "Engine oil, coolants and car care fluids." },
      { id: "00000000-0000-4000-8000-000000001135", name: "Exterior Accessories", slug: "exterior-accessories", description: "Covers, lighting and exterior styling." },
      { id: "00000000-0000-4000-8000-000000001136", name: "Motorcycle Gear", slug: "motorcycle-gear", description: "Helmets, parts and riding accessories." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001010",
    name: "Books",
    slug: "books",
    description: "Books, textbooks, literature, business, kids and learning titles.",
    children: [
      { id: "00000000-0000-4000-8000-000000001137", name: "Literature & Fiction", slug: "literature-fiction", description: "Novels, stories and classic fiction." },
      { id: "00000000-0000-4000-8000-000000001138", name: "Business & Money", slug: "business-money", description: "Business, investing and career books." },
      { id: "00000000-0000-4000-8000-000000001139", name: "Children's Books", slug: "childrens-books", description: "Picture books, readers and kids learning." },
      { id: "00000000-0000-4000-8000-000000001140", name: "Textbooks", slug: "textbooks", description: "School, college and professional textbooks." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001011",
    name: "Grocery & Gourmet Food",
    slug: "grocery-gourmet-food",
    description: "Pantry, snacks, beverages, breakfast, cooking and gourmet food.",
    children: [
      { id: "00000000-0000-4000-8000-000000001141", name: "Pantry Staples", slug: "pantry-staples", description: "Rice, flour, oil, spices and staples." },
      { id: "00000000-0000-4000-8000-000000001142", name: "Snacks", slug: "snacks", description: "Chips, biscuits, nuts and treats." },
      { id: "00000000-0000-4000-8000-000000001143", name: "Beverages", slug: "beverages", description: "Tea, coffee, juices and drinks." },
      { id: "00000000-0000-4000-8000-000000001144", name: "Breakfast Foods", slug: "breakfast-foods", description: "Cereal, spreads and breakfast items." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001012",
    name: "Baby",
    slug: "baby",
    description: "Baby care, diapers, feeding, nursery, strollers and toys.",
    children: [
      { id: "00000000-0000-4000-8000-000000001145", name: "Diapers & Wipes", slug: "diapers-wipes", description: "Diapers, wipes and changing supplies." },
      { id: "00000000-0000-4000-8000-000000001146", name: "Feeding", slug: "baby-feeding", description: "Bottles, feeding chairs and baby food tools." },
      { id: "00000000-0000-4000-8000-000000001147", name: "Strollers & Car Seats", slug: "strollers-car-seats", description: "Travel systems, strollers and car seats." },
      { id: "00000000-0000-4000-8000-000000001148", name: "Nursery", slug: "nursery", description: "Cribs, bedding and nursery decor." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001013",
    name: "Pet Supplies",
    slug: "pet-supplies",
    description: "Pet food, treats, grooming, beds, toys and supplies.",
    children: [
      { id: "00000000-0000-4000-8000-000000001149", name: "Dog Supplies", slug: "dog-supplies", description: "Dog food, treats, toys and care." },
      { id: "00000000-0000-4000-8000-000000001150", name: "Cat Supplies", slug: "cat-supplies", description: "Cat food, litter, toys and care." },
      { id: "00000000-0000-4000-8000-000000001151", name: "Fish & Aquatic Pets", slug: "fish-aquatic-pets", description: "Aquariums, food and fish care." },
      { id: "00000000-0000-4000-8000-000000001152", name: "Pet Grooming", slug: "pet-grooming", description: "Brushes, shampoos and grooming tools." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001014",
    name: "Tools & Home Improvement",
    slug: "tools-home-improvement",
    description: "Power tools, hardware, lighting, plumbing and home repair.",
    children: [
      { id: "00000000-0000-4000-8000-000000001153", name: "Power Tools", slug: "power-tools", description: "Drills, saws, grinders and power tools." },
      { id: "00000000-0000-4000-8000-000000001154", name: "Hand Tools", slug: "hand-tools", description: "Tool kits, screwdrivers and hand tools." },
      { id: "00000000-0000-4000-8000-000000001155", name: "Lighting", slug: "lighting", description: "Indoor, outdoor and smart lighting." },
      { id: "00000000-0000-4000-8000-000000001156", name: "Paint & Supplies", slug: "paint-supplies", description: "Paint, brushes and renovation supplies." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001015",
    name: "Appliances",
    slug: "appliances",
    description: "Major appliances, small appliances and home comfort products.",
    children: [
      { id: "00000000-0000-4000-8000-000000001157", name: "Kitchen Appliances", slug: "kitchen-appliances", description: "Microwaves, blenders, air fryers and mixers." },
      { id: "00000000-0000-4000-8000-000000001158", name: "Laundry Appliances", slug: "laundry-appliances", description: "Washers, dryers and laundry care." },
      { id: "00000000-0000-4000-8000-000000001159", name: "Heating & Cooling", slug: "heating-cooling", description: "Fans, heaters and air quality products." },
      { id: "00000000-0000-4000-8000-000000001160", name: "Refrigerators", slug: "refrigerators", description: "Fridges, freezers and cooling appliances." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001016",
    name: "Arts, Crafts & Sewing",
    slug: "arts-crafts-sewing",
    description: "Craft supplies, sewing, painting, drawing and creative materials.",
    children: [
      { id: "00000000-0000-4000-8000-000000001161", name: "Painting & Drawing", slug: "painting-drawing", description: "Paint, brushes, sketchbooks and drawing tools." },
      { id: "00000000-0000-4000-8000-000000001162", name: "Sewing", slug: "sewing", description: "Fabric, machines, thread and sewing tools." },
      { id: "00000000-0000-4000-8000-000000001163", name: "Craft Supplies", slug: "craft-supplies", description: "Paper, glue, kits and creative supplies." },
      { id: "00000000-0000-4000-8000-000000001164", name: "Scrapbooking", slug: "scrapbooking", description: "Albums, stickers and paper craft." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001017",
    name: "Video Games",
    slug: "video-games",
    description: "Consoles, games, accessories, online gaming and collectibles.",
    children: [
      { id: "00000000-0000-4000-8000-000000001165", name: "Consoles", slug: "gaming-consoles", description: "PlayStation, Xbox, Nintendo and handheld consoles." },
      { id: "00000000-0000-4000-8000-000000001166", name: "Games", slug: "video-games-software", description: "Console, PC and online games." },
      { id: "00000000-0000-4000-8000-000000001167", name: "Gaming Accessories", slug: "gaming-accessories", description: "Controllers, headsets and gaming gear." },
      { id: "00000000-0000-4000-8000-000000001168", name: "PC Gaming", slug: "pc-gaming", description: "Gaming PCs, components and peripherals." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001018",
    name: "Industrial & Scientific",
    slug: "industrial-scientific",
    description: "Lab supplies, safety, janitorial, industrial tools and measurement.",
    children: [
      { id: "00000000-0000-4000-8000-000000001169", name: "Lab & Scientific", slug: "lab-scientific", description: "Lab equipment, testing and scientific supplies." },
      { id: "00000000-0000-4000-8000-000000001170", name: "Safety Supplies", slug: "safety-supplies", description: "Protective gear and workplace safety." },
      { id: "00000000-0000-4000-8000-000000001171", name: "Janitorial", slug: "janitorial", description: "Cleaning, facility and commercial supplies." },
      { id: "00000000-0000-4000-8000-000000001172", name: "Test & Measurement", slug: "test-measurement", description: "Meters, scales and measurement tools." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001019",
    name: "Luggage & Travel Gear",
    slug: "luggage-travel-gear",
    description: "Suitcases, backpacks, travel accessories and bags.",
    children: [
      { id: "00000000-0000-4000-8000-000000001173", name: "Suitcases", slug: "suitcases", description: "Carry-ons, checked luggage and travel sets." },
      { id: "00000000-0000-4000-8000-000000001174", name: "Backpacks", slug: "backpacks", description: "School, laptop and travel backpacks." },
      { id: "00000000-0000-4000-8000-000000001175", name: "Travel Accessories", slug: "travel-accessories", description: "Organizers, locks, pillows and travel essentials." },
      { id: "00000000-0000-4000-8000-000000001176", name: "Duffel Bags", slug: "duffel-bags", description: "Gym, weekend and travel duffels." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001020",
    name: "Movies & Television",
    slug: "movies-television",
    description: "Movies, TV shows, box sets, documentaries and entertainment media.",
    children: [
      { id: "00000000-0000-4000-8000-000000001177", name: "Movies", slug: "movies", description: "Action, drama, comedy and classic movies." },
      { id: "00000000-0000-4000-8000-000000001178", name: "TV Shows", slug: "tv-shows", description: "Series, seasons and box sets." },
      { id: "00000000-0000-4000-8000-000000001179", name: "Documentaries", slug: "documentaries", description: "Documentaries and educational entertainment." },
      { id: "00000000-0000-4000-8000-000000001180", name: "Kids & Family", slug: "kids-family-video", description: "Family-friendly movies and shows." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001021",
    name: "Software",
    slug: "software",
    description: "Productivity, antivirus, design, business and education software.",
    children: [
      { id: "00000000-0000-4000-8000-000000001181", name: "Antivirus & Security", slug: "antivirus-security", description: "Security, VPN and antivirus software." },
      { id: "00000000-0000-4000-8000-000000001182", name: "Business Software", slug: "business-software", description: "Accounting, office and business tools." },
      { id: "00000000-0000-4000-8000-000000001183", name: "Design Software", slug: "design-software", description: "Creative, photo and video software." },
      { id: "00000000-0000-4000-8000-000000001184", name: "Education Software", slug: "education-software", description: "Learning apps and educational software." },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000001022",
    name: "Smart Home",
    slug: "smart-home",
    description: "Smart speakers, cameras, lighting, sensors and connected home devices.",
    children: [
      { id: "00000000-0000-4000-8000-000000001185", name: "Smart Speakers", slug: "smart-speakers", description: "Voice assistants and connected speakers." },
      { id: "00000000-0000-4000-8000-000000001186", name: "Smart Lighting", slug: "smart-lighting", description: "Connected bulbs, strips and lighting kits." },
      { id: "00000000-0000-4000-8000-000000001187", name: "Security Cameras", slug: "security-cameras", description: "Indoor, outdoor and doorbell cameras." },
      { id: "00000000-0000-4000-8000-000000001188", name: "Smart Plugs", slug: "smart-plugs", description: "Smart plugs, switches and sensors." },
    ],
  },
];

let generatedCategorySequence = 2000;

function marketplaceCategory(
  name: string,
  slug: string,
  description: string,
  children: MarketplaceCategoryConfig[] = []
): MarketplaceCategoryConfig {
  generatedCategorySequence += 1;
  return {
    id: `00000000-0000-4000-8000-${String(generatedCategorySequence).padStart(12, "0")}`,
    name,
    slug,
    description,
    children,
  };
}

const deepCategoryBranches: Record<string, MarketplaceCategoryConfig[]> = {
  "mobiles-accessories": [
    marketplaceCategory("Smartphones", "smartphones", "Android, iOS, 5G and feature phones.", [
      marketplaceCategory("Android Phones", "android-phones", "Samsung, Xiaomi, Oppo, Vivo and other Android phones."),
      marketplaceCategory("iPhones", "iphones", "Apple iPhone models and official iOS phones."),
      marketplaceCategory("5G Phones", "5g-phones", "5G-ready phones across budgets and brands."),
      marketplaceCategory("Feature Phones", "feature-phones", "Keypad phones and basic calling devices."),
    ]),
    marketplaceCategory("Mobile Accessories", "mobile-accessories", "Cases, chargers, cables and power accessories.", [
      marketplaceCategory("Cases & Covers", "mobile-cases-covers", "Phone cases, covers, bumpers and protective shells."),
      marketplaceCategory("Screen Protectors", "screen-protectors", "Glass, film and privacy screen protectors."),
      marketplaceCategory("Chargers & Cables", "chargers-cables", "Wall chargers, USB cables and fast charging accessories."),
      marketplaceCategory("Power Banks", "power-banks", "Portable chargers and backup power banks."),
    ]),
  ],
  "tv-home-theater": [
    marketplaceCategory("Televisions", "televisions", "LED, QLED, OLED and smart televisions.", [
      marketplaceCategory("Smart TVs", "smart-tvs", "Internet-connected televisions with streaming apps."),
      marketplaceCategory("LED TVs", "led-tvs", "LED televisions for everyday home viewing."),
      marketplaceCategory("QLED & OLED TVs", "qled-oled-tvs", "Premium display televisions with enhanced color and contrast."),
    ]),
    marketplaceCategory("Streaming & Home Cinema", "streaming-home-cinema", "Streaming devices, soundbars and theater equipment.", [
      marketplaceCategory("Streaming Devices", "streaming-devices", "TV sticks, Android boxes and media players."),
      marketplaceCategory("Soundbars", "soundbars", "Soundbars and compact home theater audio."),
      marketplaceCategory("Projectors", "projectors", "Home, office and portable projectors."),
    ]),
  ],
  laptops: [
    marketplaceCategory("Laptop Types", "laptop-types", "Laptops grouped by use case and audience.", [
      marketplaceCategory("Gaming Laptops", "gaming-laptops", "High-performance laptops for gaming and graphics."),
      marketplaceCategory("Business Laptops", "business-laptops", "Work laptops for offices and professionals."),
      marketplaceCategory("Student Laptops", "student-laptops", "Affordable laptops for study and everyday use."),
      marketplaceCategory("2-in-1 Laptops", "2-in-1-laptops", "Touchscreen and convertible laptops."),
    ]),
    marketplaceCategory("Laptop Accessories", "laptop-accessories", "Bags, chargers, cooling and laptop protection.", [
      marketplaceCategory("Laptop Bags", "laptop-bags", "Sleeves, backpacks and laptop cases."),
      marketplaceCategory("Laptop Chargers", "laptop-chargers", "Replacement and compatible laptop adapters."),
      marketplaceCategory("Cooling Pads", "cooling-pads", "Laptop cooling stands and pads."),
    ]),
  ],
  "computer-components": [
    marketplaceCategory("Internal Components", "internal-components", "Core PC build and upgrade parts.", [
      marketplaceCategory("Processors", "processors", "Desktop and workstation CPUs."),
      marketplaceCategory("Graphics Cards", "graphics-cards", "GPUs for gaming, editing and AI workloads."),
      marketplaceCategory("Motherboards", "motherboards", "Motherboards by socket, chipset and form factor."),
      marketplaceCategory("Memory RAM", "memory-ram", "Desktop and laptop RAM modules."),
    ]),
    marketplaceCategory("Storage & Power", "storage-power", "Storage drives, PSUs and PC cooling.", [
      marketplaceCategory("SSD Drives", "ssd-drives", "SATA, NVMe and portable SSD storage."),
      marketplaceCategory("Hard Drives", "hard-drives", "Internal and external HDD storage."),
      marketplaceCategory("Power Supplies", "power-supplies", "Computer PSUs and power accessories."),
    ]),
  ],
  "kitchen-dining": [
    marketplaceCategory("Cookware", "cookware", "Pots, pans and everyday cooking tools.", [
      marketplaceCategory("Pots & Pans", "pots-pans", "Cooking pots, frying pans and saute pans."),
      marketplaceCategory("Pressure Cookers", "pressure-cookers", "Pressure cookers and multi-cook pots."),
      marketplaceCategory("Bakeware", "bakeware", "Baking trays, molds and ovenware."),
    ]),
    marketplaceCategory("Dining & Serveware", "dining-serveware", "Dinner sets, drinkware and serving tools.", [
      marketplaceCategory("Dinnerware Sets", "dinnerware-sets", "Plates, bowls and dinner sets."),
      marketplaceCategory("Glassware", "glassware", "Glasses, mugs and drinkware."),
      marketplaceCategory("Cutlery", "cutlery", "Spoons, forks, knives and serving cutlery."),
    ]),
  ],
  furniture: [
    marketplaceCategory("Living Room Furniture", "living-room-furniture", "Sofas, tables and lounge furniture.", [
      marketplaceCategory("Sofas & Couches", "sofas-couches", "Sofas, couches and sofa sets."),
      marketplaceCategory("Coffee Tables", "coffee-tables", "Coffee, side and center tables."),
      marketplaceCategory("TV Stands", "tv-stands", "TV units, media stands and consoles."),
    ]),
    marketplaceCategory("Bedroom Furniture", "bedroom-furniture", "Beds, wardrobes and bedroom storage.", [
      marketplaceCategory("Beds", "beds", "Bed frames, divans and bedroom sets."),
      marketplaceCategory("Wardrobes", "wardrobes", "Closets, wardrobes and clothing storage."),
      marketplaceCategory("Mattresses", "mattresses", "Foam, spring and orthopedic mattresses."),
    ]),
  ],
  "skin-care": [
    marketplaceCategory("Face Care", "face-care", "Cleansers, moisturizers and face treatments.", [
      marketplaceCategory("Face Wash", "face-wash", "Face cleansers and daily face wash."),
      marketplaceCategory("Moisturizers", "moisturizers", "Creams, lotions and hydrating products."),
      marketplaceCategory("Serums", "serums", "Face serums and treatment concentrates."),
      marketplaceCategory("Sunscreen", "sunscreen", "SPF creams, gels and sun protection."),
    ]),
    marketplaceCategory("Body Care", "body-care", "Body lotions, washes and treatments.", [
      marketplaceCategory("Body Lotions", "body-lotions", "Lotions, creams and body moisturizers."),
      marketplaceCategory("Body Wash", "body-wash", "Shower gels and body cleansers."),
      marketplaceCategory("Hand & Foot Care", "hand-foot-care", "Hand creams, foot creams and care tools."),
    ]),
  ],
  makeup: [
    marketplaceCategory("Face Makeup", "face-makeup", "Foundation, concealer and finishing products.", [
      marketplaceCategory("Foundation", "foundation", "Liquid, powder and cream foundations."),
      marketplaceCategory("Concealer", "concealer", "Concealers and correctors."),
      marketplaceCategory("Blush & Highlighter", "blush-highlighter", "Blush, bronzer and highlighter products."),
    ]),
    marketplaceCategory("Eye & Lip Makeup", "eye-lip-makeup", "Mascara, eyeliner, lipstick and lip care.", [
      marketplaceCategory("Mascara", "mascara", "Mascara and lash products."),
      marketplaceCategory("Eyeliner", "eyeliner", "Pencil, gel and liquid eyeliners."),
      marketplaceCategory("Lipstick", "lipstick", "Lipstick, lip gloss and lip tint."),
    ]),
  ],
  "womens-fashion": [
    marketplaceCategory("Women's Clothing", "womens-clothing", "Eastern, western and daily wear for women.", [
      marketplaceCategory("Kurtas & Shalwar Kameez", "womens-kurtas-shalwar-kameez", "Women's eastern wear and stitched suits."),
      marketplaceCategory("Tops & T-Shirts", "womens-tops-tshirts", "Women's tops, shirts and casual wear."),
      marketplaceCategory("Dresses", "womens-dresses", "Casual, party and formal dresses."),
    ]),
    marketplaceCategory("Women's Shoes & Bags", "womens-shoes-bags", "Footwear, handbags and accessories.", [
      marketplaceCategory("Sandals", "womens-sandals", "Women's sandals and open footwear."),
      marketplaceCategory("Sneakers", "womens-sneakers", "Women's sneakers and casual shoes."),
      marketplaceCategory("Handbags", "womens-handbags", "Handbags, shoulder bags and totes."),
    ]),
  ],
  "mens-fashion": [
    marketplaceCategory("Men's Clothing", "mens-clothing", "Eastern, western and workwear for men.", [
      marketplaceCategory("Men's T-Shirts", "mens-tshirts", "Casual T-shirts and polos."),
      marketplaceCategory("Men's Shirts", "mens-shirts", "Dress shirts, casual shirts and office wear."),
      marketplaceCategory("Men's Shalwar Kameez", "mens-shalwar-kameez", "Traditional men's clothing."),
      marketplaceCategory("Jeans & Pants", "mens-jeans-pants", "Jeans, chinos and trousers."),
    ]),
    marketplaceCategory("Men's Shoes & Accessories", "mens-shoes-accessories", "Footwear, watches and men's accessories.", [
      marketplaceCategory("Formal Shoes", "mens-formal-shoes", "Office and occasion shoes."),
      marketplaceCategory("Men's Sneakers", "mens-sneakers", "Sneakers and casual shoes."),
      marketplaceCategory("Watches", "mens-watches", "Analog, digital and smart watches."),
    ]),
  ],
  "pantry-staples": [
    marketplaceCategory("Cooking Essentials", "cooking-essentials", "Rice, flour, oil and spices.", [
      marketplaceCategory("Rice", "rice", "Basmati, sella and everyday rice."),
      marketplaceCategory("Flour & Atta", "flour-atta", "Wheat flour, atta and baking flour."),
      marketplaceCategory("Cooking Oil & Ghee", "cooking-oil-ghee", "Cooking oil, ghee and shortening."),
      marketplaceCategory("Spices & Masala", "spices-masala", "Whole spices, powdered spices and masala mixes."),
    ]),
    marketplaceCategory("Packaged Food", "packaged-food", "Ready food, sauces and packaged pantry items.", [
      marketplaceCategory("Pasta & Noodles", "pasta-noodles", "Pasta, noodles and instant meals."),
      marketplaceCategory("Sauces & Condiments", "sauces-condiments", "Sauces, ketchup, chutneys and condiments."),
      marketplaceCategory("Canned Food", "canned-food", "Canned vegetables, beans, fish and meats."),
    ]),
  ],
  "baby-feeding": [
    marketplaceCategory("Baby Bottles & Cups", "baby-bottles-cups", "Bottles, nipples, cups and feeding accessories.", [
      marketplaceCategory("Feeding Bottles", "feeding-bottles", "Plastic, glass and anti-colic feeding bottles."),
      marketplaceCategory("Sippy Cups", "sippy-cups", "Training cups and toddler drinkware."),
      marketplaceCategory("Bottle Sterilizers", "bottle-sterilizers", "Sterilizers, warmers and cleaning tools."),
    ]),
    marketplaceCategory("Baby Food & Nursing", "baby-food-nursing", "Baby food, nursing and mealtime essentials.", [
      marketplaceCategory("Baby Cereals", "baby-cereals", "Infant cereals and weaning food."),
      marketplaceCategory("Bibs & Burp Cloths", "bibs-burp-cloths", "Bibs, burp cloths and feeding towels."),
      marketplaceCategory("High Chairs", "high-chairs", "High chairs and booster seats."),
    ]),
  ],
  "car-electronics": [
    marketplaceCategory("Vehicle Cameras", "vehicle-cameras", "Dash cameras, reverse cameras and parking assistance.", [
      marketplaceCategory("Dash Cameras", "dash-cameras", "Front, rear and dual dash cameras."),
      marketplaceCategory("Reverse Cameras", "reverse-cameras", "Backup cameras and parking cameras."),
      marketplaceCategory("Parking Sensors", "parking-sensors", "Parking sensors and assist kits."),
    ]),
    marketplaceCategory("Car Audio", "car-audio", "Speakers, stereos and in-car entertainment.", [
      marketplaceCategory("Car Stereos", "car-stereos", "Head units and infotainment players."),
      marketplaceCategory("Car Speakers", "car-speakers", "Door speakers, tweeters and component speakers."),
      marketplaceCategory("Amplifiers", "car-amplifiers", "Car audio amplifiers and wiring kits."),
    ]),
  ],
  "power-tools": [
    marketplaceCategory("Drilling & Cutting", "drilling-cutting", "Drills, saws and cutting machines.", [
      marketplaceCategory("Drills", "drills", "Corded and cordless drills."),
      marketplaceCategory("Grinders", "grinders", "Angle grinders and grinding accessories."),
      marketplaceCategory("Saws", "saws", "Circular saws, jigsaws and cutting tools."),
    ]),
    marketplaceCategory("Tool Accessories", "tool-accessories", "Bits, blades, batteries and tool storage.", [
      marketplaceCategory("Drill Bits", "drill-bits", "Masonry, metal and wood drill bits."),
      marketplaceCategory("Saw Blades", "saw-blades", "Blades for saws and cutting machines."),
      marketplaceCategory("Tool Batteries", "tool-batteries", "Cordless tool batteries and chargers."),
    ]),
  ],
  "gaming-consoles": [
    marketplaceCategory("Console Families", "console-families", "PlayStation, Xbox and Nintendo hardware.", [
      marketplaceCategory("PlayStation Consoles", "playstation-consoles", "PlayStation consoles and bundles."),
      marketplaceCategory("Xbox Consoles", "xbox-consoles", "Xbox consoles and bundles."),
      marketplaceCategory("Nintendo Consoles", "nintendo-consoles", "Nintendo Switch and handheld consoles."),
    ]),
    marketplaceCategory("Console Accessories", "console-accessories", "Controllers, docks, storage and charging accessories.", [
      marketplaceCategory("Controllers", "console-controllers", "Gamepads and wireless controllers."),
      marketplaceCategory("Charging Docks", "charging-docks", "Controller and console charging docks."),
      marketplaceCategory("Console Storage", "console-storage", "Storage expansion and memory cards."),
    ]),
  ],
  "smart-lighting": [
    marketplaceCategory("Smart Bulbs & Strips", "smart-bulbs-strips", "Connected bulbs, strips and lighting kits.", [
      marketplaceCategory("Smart Bulbs", "smart-bulbs", "Wi-Fi and Bluetooth smart bulbs."),
      marketplaceCategory("LED Light Strips", "led-light-strips", "RGB strips and smart light strips."),
      marketplaceCategory("Smart Lamps", "smart-lamps", "Connected table and floor lamps."),
    ]),
    marketplaceCategory("Lighting Controls", "lighting-controls", "Switches, dimmers and control hubs.", [
      marketplaceCategory("Smart Switches", "smart-switches", "Wall switches and smart relays."),
      marketplaceCategory("Dimmers", "smart-dimmers", "Smart dimmers and brightness controls."),
      marketplaceCategory("Lighting Hubs", "lighting-hubs", "Hubs and bridges for smart lighting."),
    ]),
  ],
};

function addDeepCategoryBranches(categories: MarketplaceCategoryConfig[]) {
  return categories.map((category) => ({
    ...category,
    children: (category.children ?? []).map((child) => ({
      ...child,
      children: deepCategoryBranches[child.slug] ?? child.children ?? [],
    })),
  }));
}

export const marketplaceCategoryTree = addDeepCategoryBranches(amazonStyleCategories);

export interface FlatMarketplaceCategoryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
}

function flattenMarketplaceCategories(
  categories: MarketplaceCategoryConfig[],
  parentId: string | null = null
): FlatMarketplaceCategoryConfig[] {
  return categories.flatMap((category, index) => [
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url ?? null,
      parent_id: parentId,
      display_order: index + 1,
    },
    ...flattenMarketplaceCategories(category.children ?? [], category.id),
  ]);
}

export const flatMarketplaceCategories = flattenMarketplaceCategories(marketplaceCategoryTree);
