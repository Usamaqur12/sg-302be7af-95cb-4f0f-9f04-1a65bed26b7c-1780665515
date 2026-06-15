export type ProductAttributeType = "text" | "number" | "select" | "boolean" | "textarea" | "date";

export interface ProductAttributeDefinition {
  key: string;
  label: string;
  type: ProductAttributeType;
  required?: boolean;
  placeholder?: string;
  unit?: string;
  options?: string[];
}

export interface ProductAttributeTemplate {
  id: string;
  title: string;
  description: string;
  matchSlugs: string[];
  attributes: ProductAttributeDefinition[];
}

const yesNoOptions = ["Yes", "No"];

export const productAttributeTemplates: ProductAttributeTemplate[] = [
  {
    id: "mobile_phone",
    title: "Mobile Phone Details",
    description: "Required phone specifications for approval and customer filters.",
    matchSlugs: ["android-phones", "iphones", "5g-phones", "feature-phones", "smartphones"],
    attributes: [
      { key: "ram", label: "RAM", type: "select", required: true, options: ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB+"] },
      { key: "storage", label: "Storage", type: "select", required: true, options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"] },
      { key: "pta_status", label: "PTA Approved", type: "select", required: true, options: yesNoOptions },
      { key: "sim_type", label: "SIM Type", type: "select", options: ["Single SIM", "Dual SIM", "eSIM", "Dual SIM + eSIM"] },
      { key: "battery_capacity", label: "Battery Capacity", type: "number", placeholder: "5000", unit: "mAh" },
      { key: "official_warranty", label: "Official Warranty", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "laptop",
    title: "Laptop Details",
    description: "Core laptop specs used by buyers when comparing products.",
    matchSlugs: ["gaming-laptops", "business-laptops", "student-laptops", "2-in-1-laptops", "laptop-types", "laptops"],
    attributes: [
      { key: "processor", label: "Processor", type: "text", required: true, placeholder: "Intel Core i5 12th Gen" },
      { key: "ram", label: "RAM", type: "select", required: true, options: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB+"] },
      { key: "storage", label: "Storage", type: "text", required: true, placeholder: "512 GB SSD" },
      { key: "screen_size", label: "Screen Size", type: "number", placeholder: "15.6", unit: "inch" },
      { key: "graphics", label: "Graphics", type: "text", placeholder: "Intel Iris Xe / RTX 4060" },
      { key: "operating_system", label: "Operating System", type: "select", options: ["Windows", "macOS", "ChromeOS", "Linux", "DOS / No OS"] },
    ],
  },
  {
    id: "fashion",
    title: "Fashion Attributes",
    description: "Size, fabric and fit details required for fashion listings.",
    matchSlugs: [
      "womens-kurtas-shalwar-kameez",
      "womens-tops-tshirts",
      "womens-dresses",
      "mens-tshirts",
      "mens-shirts",
      "mens-shalwar-kameez",
      "mens-jeans-pants",
      "womens-clothing",
      "mens-clothing",
      "girls-fashion",
      "boys-fashion",
    ],
    attributes: [
      { key: "size", label: "Size", type: "select", required: true, options: ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "Custom"] },
      { key: "fabric", label: "Fabric", type: "text", required: true, placeholder: "Cotton, Lawn, Denim..." },
      { key: "fit", label: "Fit", type: "select", options: ["Regular", "Slim", "Relaxed", "Oversized", "Tailored"] },
      { key: "gender", label: "Gender", type: "select", options: ["Women", "Men", "Girls", "Boys", "Unisex"] },
      { key: "season", label: "Season", type: "select", options: ["Summer", "Winter", "All Season", "Festive"] },
      { key: "care_instructions", label: "Care Instructions", type: "textarea", placeholder: "Machine wash, dry clean, hand wash..." },
    ],
  },
  {
    id: "footwear_bags",
    title: "Footwear & Bag Attributes",
    description: "Sizing and material details for shoes, sandals, sneakers and bags.",
    matchSlugs: ["womens-sandals", "womens-sneakers", "mens-formal-shoes", "mens-sneakers", "womens-shoes-bags", "mens-shoes-accessories", "womens-handbags"],
    attributes: [
      { key: "size", label: "Size", type: "text", required: true, placeholder: "EU 42 / UK 8 / Medium" },
      { key: "outer_material", label: "Outer Material", type: "text", placeholder: "Leather, PU, Canvas..." },
      { key: "sole_material", label: "Sole Material", type: "text", placeholder: "Rubber, EVA, TPR..." },
      { key: "closure_type", label: "Closure Type", type: "select", options: ["Lace-up", "Slip-on", "Buckle", "Zip", "Magnetic", "Open"] },
      { key: "occasion", label: "Occasion", type: "select", options: ["Casual", "Formal", "Sports", "Party", "Daily Use"] },
    ],
  },
  {
    id: "grocery",
    title: "Grocery & Food Details",
    description: "Pack, expiry and storage information for food approval.",
    matchSlugs: ["rice", "flour-atta", "cooking-oil-ghee", "spices-masala", "pasta-noodles", "sauces-condiments", "canned-food", "pantry-staples", "packaged-food", "snacks", "beverages"],
    attributes: [
      { key: "net_weight", label: "Net Weight / Volume", type: "text", required: true, placeholder: "1 kg, 500 ml, 12 pcs" },
      { key: "expiry_date", label: "Expiry Date", type: "date", required: true },
      { key: "pack_size", label: "Pack Size", type: "text", placeholder: "Single, Pack of 6, Carton" },
      { key: "ingredients", label: "Ingredients", type: "textarea", placeholder: "List major ingredients" },
      { key: "storage_instructions", label: "Storage Instructions", type: "textarea", placeholder: "Store in cool dry place" },
      { key: "halal_certified", label: "Halal Certified", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "beauty",
    title: "Beauty & Personal Care Details",
    description: "Shade, volume, expiry and suitability details for beauty products.",
    matchSlugs: ["face-wash", "moisturizers", "serums", "sunscreen", "body-lotions", "foundation", "concealer", "blush-highlighter", "mascara", "eyeliner", "lipstick", "face-care", "body-care", "face-makeup", "eye-lip-makeup"],
    attributes: [
      { key: "skin_type", label: "Skin Type", type: "select", options: ["All Skin Types", "Oily", "Dry", "Combination", "Sensitive", "Normal"] },
      { key: "shade", label: "Shade / Color", type: "text", placeholder: "Ivory, Nude, Black..." },
      { key: "volume", label: "Volume / Weight", type: "text", required: true, placeholder: "30 ml, 100 g" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "dermatologically_tested", label: "Dermatologically Tested", type: "select", options: yesNoOptions },
      { key: "usage_instructions", label: "Usage Instructions", type: "textarea", placeholder: "How the customer should use this product" },
    ],
  },
  {
    id: "appliance",
    title: "Appliance Details",
    description: "Capacity, power and installation fields for appliances.",
    matchSlugs: ["kitchen-appliances", "laundry-appliances", "heating-cooling", "refrigerators", "appliances"],
    attributes: [
      { key: "capacity", label: "Capacity", type: "text", required: true, placeholder: "1.5 L, 10 kg, 300 L" },
      { key: "power", label: "Power", type: "number", placeholder: "1200", unit: "W" },
      { key: "voltage", label: "Voltage", type: "select", options: ["220-240V", "110V", "Dual Voltage"] },
      { key: "energy_rating", label: "Energy Rating", type: "select", options: ["A+++", "A++", "A+", "A", "B", "C", "Not Rated"] },
      { key: "installation_required", label: "Installation Required", type: "select", options: yesNoOptions },
      { key: "included_accessories", label: "Included Accessories", type: "textarea", placeholder: "Remote, pipe, filter, manual..." },
    ],
  },
  {
    id: "automotive",
    title: "Automotive Fitment",
    description: "Compatibility and vehicle fitment details for auto parts.",
    matchSlugs: ["dash-cameras", "reverse-cameras", "parking-sensors", "car-stereos", "car-speakers", "oils-fluids", "motorcycle-gear", "automotive"],
    attributes: [
      { key: "vehicle_compatibility", label: "Vehicle Compatibility", type: "textarea", required: true, placeholder: "Toyota Corolla 2014-2020, Honda Civic..." },
      { key: "part_number", label: "Part Number", type: "text", placeholder: "OEM / aftermarket part number" },
      { key: "installation_type", label: "Installation Type", type: "select", options: ["DIY", "Professional Installation", "Plug & Play"] },
      { key: "warranty_months", label: "Warranty", type: "number", unit: "months" },
    ],
  },
  {
    id: "tools",
    title: "Tools & Hardware Specs",
    description: "Technical fields for tools, accessories and hardware.",
    matchSlugs: ["drills", "grinders", "saws", "drill-bits", "saw-blades", "tool-batteries", "power-tools", "hand-tools"],
    attributes: [
      { key: "power_source", label: "Power Source", type: "select", required: true, options: ["Corded Electric", "Battery", "Manual", "Pneumatic", "Petrol"] },
      { key: "voltage", label: "Voltage", type: "text", placeholder: "12V, 20V, 220V" },
      { key: "material", label: "Material", type: "text", placeholder: "Steel, carbide, plastic..." },
      { key: "included_items", label: "Included Items", type: "textarea", placeholder: "Tool, battery, charger, case..." },
      { key: "safety_certification", label: "Safety Certification", type: "text", placeholder: "CE, ISO, local standard" },
    ],
  },
  {
    id: "gaming",
    title: "Gaming Product Details",
    description: "Console, region and compatibility details for gaming products.",
    matchSlugs: ["playstation-consoles", "xbox-consoles", "nintendo-consoles", "console-controllers", "video-games-software", "gaming-accessories", "pc-gaming"],
    attributes: [
      { key: "platform", label: "Platform", type: "select", required: true, options: ["PlayStation", "Xbox", "Nintendo", "PC", "Mobile", "Multi-platform"] },
      { key: "region", label: "Region", type: "select", options: ["Region Free", "US", "EU", "Asia", "Middle East"] },
      { key: "edition", label: "Edition", type: "text", placeholder: "Standard, Digital, Deluxe..." },
      { key: "online_required", label: "Online Required", type: "select", options: yesNoOptions },
    ],
  },
  {
    id: "default",
    title: "Category Attributes",
    description: "Extra product details that help admin approval and customer filters.",
    matchSlugs: [],
    attributes: [
      { key: "material", label: "Material", type: "text", placeholder: "Main material or composition" },
      { key: "country_of_origin", label: "Country of Origin", type: "text", placeholder: "Pakistan, China, UAE..." },
      { key: "certification", label: "Certification / License", type: "text", placeholder: "Optional certification or approval" },
      { key: "usage_notes", label: "Usage Notes", type: "textarea", placeholder: "Important usage, compatibility or care details" },
    ],
  },
];

export function getProductAttributeTemplate(categorySlugs: string[]) {
  const normalizedSlugs = new Set(categorySlugs.map((slug) => slug.toLowerCase()));
  return (
    productAttributeTemplates.find((template) =>
      template.matchSlugs.some((slug) => normalizedSlugs.has(slug))
    ) || productAttributeTemplates[productAttributeTemplates.length - 1]
  );
}
