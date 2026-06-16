CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  role ENUM('customer', 'seller', 'admin', 'manager', 'warehouse') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  cnic_number VARCHAR(120),
  cnic_front_url TEXT,
  cnic_back_url TEXT,
  kyc_document_url TEXT,
  email_verified_at DATETIME,
  reset_token_hash VARCHAR(255),
  reset_token_expires_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_profiles_role (role),
  INDEX idx_profiles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seller_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  business_address TEXT,
  business_phone VARCHAR(50),
  business_email VARCHAR(191),
  logo_url TEXT,
  banner_url TEXT,
  kyc_document_url TEXT,
  kyc_document_type VARCHAR(100),
  tax_id VARCHAR(120),
  owner_full_name VARCHAR(255),
  owner_cnic VARCHAR(120),
  cnic_front_url TEXT,
  cnic_back_url TEXT,
  business_registration_url TEXT,
  tax_certificate_url TEXT,
  bank_statement_url TEXT,
  brand_authorization_url TEXT,
  pickup_address TEXT,
  return_address TEXT,
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(255),
  bank_name VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  total_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  available_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_reviews INT NOT NULL DEFAULT 0,
  holiday_mode TINYINT(1) NOT NULL DEFAULT 0,
  holiday_message TEXT,
  order_volume_limit INT NOT NULL DEFAULT 50,
  non_compliance_points INT NOT NULL DEFAULT 0,
  account_health_status ENUM('excellent', 'good', 'warning', 'at_risk') NOT NULL DEFAULT 'excellent',
  admin_note TEXT,
  seller_center_enabled_options TEXT,
  storefront_config JSON,
  verified_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sellers_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_seller_profiles_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id CHAR(36),
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_categories_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO categories (id, name, slug, description, parent_id, display_order, is_active) VALUES
('00000000-0000-4000-8000-000000001001', 'Electronics', 'electronics', 'Mobiles, cameras, audio, TV and everyday consumer electronics.', NULL, 1, 1),
('00000000-0000-4000-8000-000000001101', 'Mobiles & Accessories', 'mobiles-accessories', 'Smartphones, chargers, cases and wearables.', '00000000-0000-4000-8000-000000001001', 1, 1),
('00000000-0000-4000-8000-000000001102', 'TV & Home Theater', 'tv-home-theater', 'Televisions, streaming devices and home cinema gear.', '00000000-0000-4000-8000-000000001001', 2, 1),
('00000000-0000-4000-8000-000000001103', 'Camera & Photo', 'camera-photo', 'Cameras, lenses, tripods and photo accessories.', '00000000-0000-4000-8000-000000001001', 3, 1),
('00000000-0000-4000-8000-000000001104', 'Headphones & Audio', 'headphones-audio', 'Headphones, speakers and audio accessories.', '00000000-0000-4000-8000-000000001001', 4, 1),
('00000000-0000-4000-8000-000000001002', 'Computers', 'computers', 'Laptops, desktops, components, printers and computer accessories.', NULL, 2, 1),
('00000000-0000-4000-8000-000000001105', 'Laptops', 'laptops', 'Work, gaming and everyday laptops.', '00000000-0000-4000-8000-000000001002', 1, 1),
('00000000-0000-4000-8000-000000001106', 'Desktops & Monitors', 'desktops-monitors', 'Desktop PCs, displays and workstations.', '00000000-0000-4000-8000-000000001002', 2, 1),
('00000000-0000-4000-8000-000000001107', 'Computer Components', 'computer-components', 'Storage, memory, graphics and PC parts.', '00000000-0000-4000-8000-000000001002', 3, 1),
('00000000-0000-4000-8000-000000001108', 'Printers & Ink', 'printers-ink', 'Printers, scanners, toner and ink.', '00000000-0000-4000-8000-000000001002', 4, 1),
('00000000-0000-4000-8000-000000001003', 'Home & Kitchen', 'home-kitchen', 'Kitchen, dining, bedding, decor, furniture and home essentials.', NULL, 3, 1),
('00000000-0000-4000-8000-000000001109', 'Kitchen & Dining', 'kitchen-dining', 'Cookware, dinnerware and kitchen tools.', '00000000-0000-4000-8000-000000001003', 1, 1),
('00000000-0000-4000-8000-000000001110', 'Bedding & Bath', 'bedding-bath', 'Bedding, towels and bath accessories.', '00000000-0000-4000-8000-000000001003', 2, 1),
('00000000-0000-4000-8000-000000001111', 'Furniture', 'furniture', 'Living room, bedroom and office furniture.', '00000000-0000-4000-8000-000000001003', 3, 1),
('00000000-0000-4000-8000-000000001112', 'Storage & Organization', 'storage-organization', 'Closet, pantry and home organization.', '00000000-0000-4000-8000-000000001003', 4, 1),
('00000000-0000-4000-8000-000000001004', 'Beauty & Personal Care', 'beauty-personal-care', 'Skincare, haircare, makeup, fragrance and grooming.', NULL, 4, 1),
('00000000-0000-4000-8000-000000001113', 'Skin Care', 'skin-care', 'Cleansers, moisturizers and treatments.', '00000000-0000-4000-8000-000000001004', 1, 1),
('00000000-0000-4000-8000-000000001114', 'Hair Care', 'hair-care', 'Shampoo, styling tools and treatments.', '00000000-0000-4000-8000-000000001004', 2, 1),
('00000000-0000-4000-8000-000000001115', 'Makeup', 'makeup', 'Face, eye, lip and nail makeup.', '00000000-0000-4000-8000-000000001004', 3, 1),
('00000000-0000-4000-8000-000000001116', 'Fragrance', 'fragrance', 'Perfume, cologne and body sprays.', '00000000-0000-4000-8000-000000001004', 4, 1),
('00000000-0000-4000-8000-000000001005', 'Clothing, Shoes & Jewelry', 'clothing-shoes-jewelry', 'Fashion for women, men, kids, shoes, watches and jewelry.', NULL, 5, 1),
('00000000-0000-4000-8000-000000001117', 'Women''s Fashion', 'womens-fashion', 'Clothing, shoes, handbags and accessories.', '00000000-0000-4000-8000-000000001005', 1, 1),
('00000000-0000-4000-8000-000000001118', 'Men''s Fashion', 'mens-fashion', 'Clothing, shoes, watches and accessories.', '00000000-0000-4000-8000-000000001005', 2, 1),
('00000000-0000-4000-8000-000000001119', 'Girls'' Fashion', 'girls-fashion', 'Girls clothing, shoes and accessories.', '00000000-0000-4000-8000-000000001005', 3, 1),
('00000000-0000-4000-8000-000000001120', 'Boys'' Fashion', 'boys-fashion', 'Boys clothing, shoes and accessories.', '00000000-0000-4000-8000-000000001005', 4, 1),
('00000000-0000-4000-8000-000000001006', 'Health & Household', 'health-household', 'Vitamins, wellness, household supplies and personal health.', NULL, 6, 1),
('00000000-0000-4000-8000-000000001121', 'Vitamins & Supplements', 'vitamins-supplements', 'Daily wellness and nutrition support.', '00000000-0000-4000-8000-000000001006', 1, 1),
('00000000-0000-4000-8000-000000001122', 'Medical Supplies', 'medical-supplies', 'Home health, first aid and monitoring tools.', '00000000-0000-4000-8000-000000001006', 2, 1),
('00000000-0000-4000-8000-000000001123', 'Household Supplies', 'household-supplies', 'Paper, cleaning and pantry household supplies.', '00000000-0000-4000-8000-000000001006', 3, 1),
('00000000-0000-4000-8000-000000001124', 'Personal Care', 'personal-care', 'Hygiene, grooming and personal care products.', '00000000-0000-4000-8000-000000001006', 4, 1),
('00000000-0000-4000-8000-000000001007', 'Sports & Outdoors', 'sports-outdoors', 'Fitness, camping, team sports, outdoor recreation and travel gear.', NULL, 7, 1),
('00000000-0000-4000-8000-000000001125', 'Exercise & Fitness', 'exercise-fitness', 'Training equipment, yoga and fitness accessories.', '00000000-0000-4000-8000-000000001007', 1, 1),
('00000000-0000-4000-8000-000000001126', 'Outdoor Recreation', 'outdoor-recreation', 'Camping, hiking and outdoor gear.', '00000000-0000-4000-8000-000000001007', 2, 1),
('00000000-0000-4000-8000-000000001127', 'Team Sports', 'team-sports', 'Cricket, football, basketball and more.', '00000000-0000-4000-8000-000000001007', 3, 1),
('00000000-0000-4000-8000-000000001128', 'Sports Clothing', 'sports-clothing', 'Performance apparel and shoes.', '00000000-0000-4000-8000-000000001007', 4, 1),
('00000000-0000-4000-8000-000000001008', 'Toys & Games', 'toys-games', 'Toys, learning games, puzzles, action figures and family play.', NULL, 8, 1),
('00000000-0000-4000-8000-000000001129', 'Action Figures', 'action-figures', 'Collectibles, figures and playsets.', '00000000-0000-4000-8000-000000001008', 1, 1),
('00000000-0000-4000-8000-000000001130', 'Learning Toys', 'learning-toys', 'STEM, early learning and educational toys.', '00000000-0000-4000-8000-000000001008', 2, 1),
('00000000-0000-4000-8000-000000001131', 'Board Games', 'board-games', 'Board games, card games and party games.', '00000000-0000-4000-8000-000000001008', 3, 1),
('00000000-0000-4000-8000-000000001132', 'Outdoor Play', 'outdoor-play', 'Ride-ons, sports toys and outdoor fun.', '00000000-0000-4000-8000-000000001008', 4, 1),
('00000000-0000-4000-8000-000000001009', 'Automotive', 'automotive', 'Car parts, motorcycle gear, oils, tools and vehicle accessories.', NULL, 9, 1),
('00000000-0000-4000-8000-000000001133', 'Car Electronics', 'car-electronics', 'Dash cams, audio and vehicle tech.', '00000000-0000-4000-8000-000000001009', 1, 1),
('00000000-0000-4000-8000-000000001134', 'Oils & Fluids', 'oils-fluids', 'Engine oil, coolants and car care fluids.', '00000000-0000-4000-8000-000000001009', 2, 1),
('00000000-0000-4000-8000-000000001135', 'Exterior Accessories', 'exterior-accessories', 'Covers, lighting and exterior styling.', '00000000-0000-4000-8000-000000001009', 3, 1),
('00000000-0000-4000-8000-000000001136', 'Motorcycle Gear', 'motorcycle-gear', 'Helmets, parts and riding accessories.', '00000000-0000-4000-8000-000000001009', 4, 1),
('00000000-0000-4000-8000-000000001010', 'Books', 'books', 'Books, textbooks, literature, business, kids and learning titles.', NULL, 10, 1),
('00000000-0000-4000-8000-000000001137', 'Literature & Fiction', 'literature-fiction', 'Novels, stories and classic fiction.', '00000000-0000-4000-8000-000000001010', 1, 1),
('00000000-0000-4000-8000-000000001138', 'Business & Money', 'business-money', 'Business, investing and career books.', '00000000-0000-4000-8000-000000001010', 2, 1),
('00000000-0000-4000-8000-000000001139', 'Children''s Books', 'childrens-books', 'Picture books, readers and kids learning.', '00000000-0000-4000-8000-000000001010', 3, 1),
('00000000-0000-4000-8000-000000001140', 'Textbooks', 'textbooks', 'School, college and professional textbooks.', '00000000-0000-4000-8000-000000001010', 4, 1),
('00000000-0000-4000-8000-000000001011', 'Grocery & Gourmet Food', 'grocery-gourmet-food', 'Pantry, snacks, beverages, breakfast, cooking and gourmet food.', NULL, 11, 1),
('00000000-0000-4000-8000-000000001141', 'Pantry Staples', 'pantry-staples', 'Rice, flour, oil, spices and staples.', '00000000-0000-4000-8000-000000001011', 1, 1),
('00000000-0000-4000-8000-000000001142', 'Snacks', 'snacks', 'Chips, biscuits, nuts and treats.', '00000000-0000-4000-8000-000000001011', 2, 1),
('00000000-0000-4000-8000-000000001143', 'Beverages', 'beverages', 'Tea, coffee, juices and drinks.', '00000000-0000-4000-8000-000000001011', 3, 1),
('00000000-0000-4000-8000-000000001144', 'Breakfast Foods', 'breakfast-foods', 'Cereal, spreads and breakfast items.', '00000000-0000-4000-8000-000000001011', 4, 1),
('00000000-0000-4000-8000-000000001012', 'Baby', 'baby', 'Baby care, diapers, feeding, nursery, strollers and toys.', NULL, 12, 1),
('00000000-0000-4000-8000-000000001145', 'Diapers & Wipes', 'diapers-wipes', 'Diapers, wipes and changing supplies.', '00000000-0000-4000-8000-000000001012', 1, 1),
('00000000-0000-4000-8000-000000001146', 'Feeding', 'baby-feeding', 'Bottles, feeding chairs and baby food tools.', '00000000-0000-4000-8000-000000001012', 2, 1),
('00000000-0000-4000-8000-000000001147', 'Strollers & Car Seats', 'strollers-car-seats', 'Travel systems, strollers and car seats.', '00000000-0000-4000-8000-000000001012', 3, 1),
('00000000-0000-4000-8000-000000001148', 'Nursery', 'nursery', 'Cribs, bedding and nursery decor.', '00000000-0000-4000-8000-000000001012', 4, 1),
('00000000-0000-4000-8000-000000001013', 'Pet Supplies', 'pet-supplies', 'Pet food, treats, grooming, beds, toys and supplies.', NULL, 13, 1),
('00000000-0000-4000-8000-000000001149', 'Dog Supplies', 'dog-supplies', 'Dog food, treats, toys and care.', '00000000-0000-4000-8000-000000001013', 1, 1),
('00000000-0000-4000-8000-000000001150', 'Cat Supplies', 'cat-supplies', 'Cat food, litter, toys and care.', '00000000-0000-4000-8000-000000001013', 2, 1),
('00000000-0000-4000-8000-000000001151', 'Fish & Aquatic Pets', 'fish-aquatic-pets', 'Aquariums, food and fish care.', '00000000-0000-4000-8000-000000001013', 3, 1),
('00000000-0000-4000-8000-000000001152', 'Pet Grooming', 'pet-grooming', 'Brushes, shampoos and grooming tools.', '00000000-0000-4000-8000-000000001013', 4, 1),
('00000000-0000-4000-8000-000000001014', 'Tools & Home Improvement', 'tools-home-improvement', 'Power tools, hardware, lighting, plumbing and home repair.', NULL, 14, 1),
('00000000-0000-4000-8000-000000001153', 'Power Tools', 'power-tools', 'Drills, saws, grinders and power tools.', '00000000-0000-4000-8000-000000001014', 1, 1),
('00000000-0000-4000-8000-000000001154', 'Hand Tools', 'hand-tools', 'Tool kits, screwdrivers and hand tools.', '00000000-0000-4000-8000-000000001014', 2, 1),
('00000000-0000-4000-8000-000000001155', 'Lighting', 'lighting', 'Indoor, outdoor and smart lighting.', '00000000-0000-4000-8000-000000001014', 3, 1),
('00000000-0000-4000-8000-000000001156', 'Paint & Supplies', 'paint-supplies', 'Paint, brushes and renovation supplies.', '00000000-0000-4000-8000-000000001014', 4, 1),
('00000000-0000-4000-8000-000000001015', 'Appliances', 'appliances', 'Major appliances, small appliances and home comfort products.', NULL, 15, 1),
('00000000-0000-4000-8000-000000001157', 'Kitchen Appliances', 'kitchen-appliances', 'Microwaves, blenders, air fryers and mixers.', '00000000-0000-4000-8000-000000001015', 1, 1),
('00000000-0000-4000-8000-000000001158', 'Laundry Appliances', 'laundry-appliances', 'Washers, dryers and laundry care.', '00000000-0000-4000-8000-000000001015', 2, 1),
('00000000-0000-4000-8000-000000001159', 'Heating & Cooling', 'heating-cooling', 'Fans, heaters and air quality products.', '00000000-0000-4000-8000-000000001015', 3, 1),
('00000000-0000-4000-8000-000000001160', 'Refrigerators', 'refrigerators', 'Fridges, freezers and cooling appliances.', '00000000-0000-4000-8000-000000001015', 4, 1),
('00000000-0000-4000-8000-000000001016', 'Arts, Crafts & Sewing', 'arts-crafts-sewing', 'Craft supplies, sewing, painting, drawing and creative materials.', NULL, 16, 1),
('00000000-0000-4000-8000-000000001161', 'Painting & Drawing', 'painting-drawing', 'Paint, brushes, sketchbooks and drawing tools.', '00000000-0000-4000-8000-000000001016', 1, 1),
('00000000-0000-4000-8000-000000001162', 'Sewing', 'sewing', 'Fabric, machines, thread and sewing tools.', '00000000-0000-4000-8000-000000001016', 2, 1),
('00000000-0000-4000-8000-000000001163', 'Craft Supplies', 'craft-supplies', 'Paper, glue, kits and creative supplies.', '00000000-0000-4000-8000-000000001016', 3, 1),
('00000000-0000-4000-8000-000000001164', 'Scrapbooking', 'scrapbooking', 'Albums, stickers and paper craft.', '00000000-0000-4000-8000-000000001016', 4, 1),
('00000000-0000-4000-8000-000000001017', 'Video Games', 'video-games', 'Consoles, games, accessories, online gaming and collectibles.', NULL, 17, 1),
('00000000-0000-4000-8000-000000001165', 'Consoles', 'gaming-consoles', 'PlayStation, Xbox, Nintendo and handheld consoles.', '00000000-0000-4000-8000-000000001017', 1, 1),
('00000000-0000-4000-8000-000000001166', 'Games', 'video-games-software', 'Console, PC and online games.', '00000000-0000-4000-8000-000000001017', 2, 1),
('00000000-0000-4000-8000-000000001167', 'Gaming Accessories', 'gaming-accessories', 'Controllers, headsets and gaming gear.', '00000000-0000-4000-8000-000000001017', 3, 1),
('00000000-0000-4000-8000-000000001168', 'PC Gaming', 'pc-gaming', 'Gaming PCs, components and peripherals.', '00000000-0000-4000-8000-000000001017', 4, 1),
('00000000-0000-4000-8000-000000001018', 'Industrial & Scientific', 'industrial-scientific', 'Lab supplies, safety, janitorial, industrial tools and measurement.', NULL, 18, 1),
('00000000-0000-4000-8000-000000001169', 'Lab & Scientific', 'lab-scientific', 'Lab equipment, testing and scientific supplies.', '00000000-0000-4000-8000-000000001018', 1, 1),
('00000000-0000-4000-8000-000000001170', 'Safety Supplies', 'safety-supplies', 'Protective gear and workplace safety.', '00000000-0000-4000-8000-000000001018', 2, 1),
('00000000-0000-4000-8000-000000001171', 'Janitorial', 'janitorial', 'Cleaning, facility and commercial supplies.', '00000000-0000-4000-8000-000000001018', 3, 1),
('00000000-0000-4000-8000-000000001172', 'Test & Measurement', 'test-measurement', 'Meters, scales and measurement tools.', '00000000-0000-4000-8000-000000001018', 4, 1),
('00000000-0000-4000-8000-000000001019', 'Luggage & Travel Gear', 'luggage-travel-gear', 'Suitcases, backpacks, travel accessories and bags.', NULL, 19, 1),
('00000000-0000-4000-8000-000000001173', 'Suitcases', 'suitcases', 'Carry-ons, checked luggage and travel sets.', '00000000-0000-4000-8000-000000001019', 1, 1),
('00000000-0000-4000-8000-000000001174', 'Backpacks', 'backpacks', 'School, laptop and travel backpacks.', '00000000-0000-4000-8000-000000001019', 2, 1),
('00000000-0000-4000-8000-000000001175', 'Travel Accessories', 'travel-accessories', 'Organizers, locks, pillows and travel essentials.', '00000000-0000-4000-8000-000000001019', 3, 1),
('00000000-0000-4000-8000-000000001176', 'Duffel Bags', 'duffel-bags', 'Gym, weekend and travel duffels.', '00000000-0000-4000-8000-000000001019', 4, 1),
('00000000-0000-4000-8000-000000001020', 'Movies & Television', 'movies-television', 'Movies, TV shows, box sets, documentaries and entertainment media.', NULL, 20, 1),
('00000000-0000-4000-8000-000000001177', 'Movies', 'movies', 'Action, drama, comedy and classic movies.', '00000000-0000-4000-8000-000000001020', 1, 1),
('00000000-0000-4000-8000-000000001178', 'TV Shows', 'tv-shows', 'Series, seasons and box sets.', '00000000-0000-4000-8000-000000001020', 2, 1),
('00000000-0000-4000-8000-000000001179', 'Documentaries', 'documentaries', 'Documentaries and educational entertainment.', '00000000-0000-4000-8000-000000001020', 3, 1),
('00000000-0000-4000-8000-000000001180', 'Kids & Family', 'kids-family-video', 'Family-friendly movies and shows.', '00000000-0000-4000-8000-000000001020', 4, 1),
('00000000-0000-4000-8000-000000001021', 'Software', 'software', 'Productivity, antivirus, design, business and education software.', NULL, 21, 1),
('00000000-0000-4000-8000-000000001181', 'Antivirus & Security', 'antivirus-security', 'Security, VPN and antivirus software.', '00000000-0000-4000-8000-000000001021', 1, 1),
('00000000-0000-4000-8000-000000001182', 'Business Software', 'business-software', 'Accounting, office and business tools.', '00000000-0000-4000-8000-000000001021', 2, 1),
('00000000-0000-4000-8000-000000001183', 'Design Software', 'design-software', 'Creative, photo and video software.', '00000000-0000-4000-8000-000000001021', 3, 1),
('00000000-0000-4000-8000-000000001184', 'Education Software', 'education-software', 'Learning apps and educational software.', '00000000-0000-4000-8000-000000001021', 4, 1),
('00000000-0000-4000-8000-000000001022', 'Smart Home', 'smart-home', 'Smart speakers, cameras, lighting, sensors and connected home devices.', NULL, 22, 1),
('00000000-0000-4000-8000-000000001185', 'Smart Speakers', 'smart-speakers', 'Voice assistants and connected speakers.', '00000000-0000-4000-8000-000000001022', 1, 1),
('00000000-0000-4000-8000-000000001186', 'Smart Lighting', 'smart-lighting', 'Connected bulbs, strips and lighting kits.', '00000000-0000-4000-8000-000000001022', 2, 1),
('00000000-0000-4000-8000-000000001187', 'Security Cameras', 'security-cameras', 'Indoor, outdoor and doorbell cameras.', '00000000-0000-4000-8000-000000001022', 3, 1),
('00000000-0000-4000-8000-000000001188', 'Smart Plugs', 'smart-plugs', 'Smart plugs, switches and sensors.', '00000000-0000-4000-8000-000000001022', 4, 1);

INSERT IGNORE INTO categories (id, name, slug, description, parent_id, display_order, is_active)
SELECT UUID(), 'Smartphones', 'smartphones', 'Android, iOS, 5G and feature phones.', p.id, 1, 1 FROM categories p WHERE p.slug='mobiles-accessories'
UNION ALL SELECT UUID(), 'Mobile Accessories', 'mobile-accessories', 'Cases, chargers, cables and power accessories.', p.id, 2, 1 FROM categories p WHERE p.slug='mobiles-accessories'
UNION ALL SELECT UUID(), 'Televisions', 'televisions', 'LED, QLED, OLED and smart televisions.', p.id, 1, 1 FROM categories p WHERE p.slug='tv-home-theater'
UNION ALL SELECT UUID(), 'Streaming & Home Cinema', 'streaming-home-cinema', 'Streaming devices, soundbars and theater equipment.', p.id, 2, 1 FROM categories p WHERE p.slug='tv-home-theater'
UNION ALL SELECT UUID(), 'Laptop Types', 'laptop-types', 'Laptops grouped by use case and audience.', p.id, 1, 1 FROM categories p WHERE p.slug='laptops'
UNION ALL SELECT UUID(), 'Laptop Accessories', 'laptop-accessories', 'Bags, chargers, cooling and laptop protection.', p.id, 2, 1 FROM categories p WHERE p.slug='laptops'
UNION ALL SELECT UUID(), 'Internal Components', 'internal-components', 'Core PC build and upgrade parts.', p.id, 1, 1 FROM categories p WHERE p.slug='computer-components'
UNION ALL SELECT UUID(), 'Storage & Power', 'storage-power', 'Storage drives, PSUs and PC cooling.', p.id, 2, 1 FROM categories p WHERE p.slug='computer-components'
UNION ALL SELECT UUID(), 'Cookware', 'cookware', 'Pots, pans and everyday cooking tools.', p.id, 1, 1 FROM categories p WHERE p.slug='kitchen-dining'
UNION ALL SELECT UUID(), 'Dining & Serveware', 'dining-serveware', 'Dinner sets, drinkware and serving tools.', p.id, 2, 1 FROM categories p WHERE p.slug='kitchen-dining'
UNION ALL SELECT UUID(), 'Living Room Furniture', 'living-room-furniture', 'Sofas, tables and lounge furniture.', p.id, 1, 1 FROM categories p WHERE p.slug='furniture'
UNION ALL SELECT UUID(), 'Bedroom Furniture', 'bedroom-furniture', 'Beds, wardrobes and bedroom storage.', p.id, 2, 1 FROM categories p WHERE p.slug='furniture'
UNION ALL SELECT UUID(), 'Face Care', 'face-care', 'Cleansers, moisturizers and face treatments.', p.id, 1, 1 FROM categories p WHERE p.slug='skin-care'
UNION ALL SELECT UUID(), 'Body Care', 'body-care', 'Body lotions, washes and treatments.', p.id, 2, 1 FROM categories p WHERE p.slug='skin-care'
UNION ALL SELECT UUID(), 'Face Makeup', 'face-makeup', 'Foundation, concealer and finishing products.', p.id, 1, 1 FROM categories p WHERE p.slug='makeup'
UNION ALL SELECT UUID(), 'Eye & Lip Makeup', 'eye-lip-makeup', 'Mascara, eyeliner, lipstick and lip care.', p.id, 2, 1 FROM categories p WHERE p.slug='makeup'
UNION ALL SELECT UUID(), 'Women''s Clothing', 'womens-clothing', 'Eastern, western and daily wear for women.', p.id, 1, 1 FROM categories p WHERE p.slug='womens-fashion'
UNION ALL SELECT UUID(), 'Women''s Shoes & Bags', 'womens-shoes-bags', 'Footwear, handbags and accessories.', p.id, 2, 1 FROM categories p WHERE p.slug='womens-fashion'
UNION ALL SELECT UUID(), 'Men''s Clothing', 'mens-clothing', 'Eastern, western and workwear for men.', p.id, 1, 1 FROM categories p WHERE p.slug='mens-fashion'
UNION ALL SELECT UUID(), 'Men''s Shoes & Accessories', 'mens-shoes-accessories', 'Footwear, watches and men''s accessories.', p.id, 2, 1 FROM categories p WHERE p.slug='mens-fashion'
UNION ALL SELECT UUID(), 'Cooking Essentials', 'cooking-essentials', 'Rice, flour, oil and spices.', p.id, 1, 1 FROM categories p WHERE p.slug='pantry-staples'
UNION ALL SELECT UUID(), 'Packaged Food', 'packaged-food', 'Ready food, sauces and packaged pantry items.', p.id, 2, 1 FROM categories p WHERE p.slug='pantry-staples'
UNION ALL SELECT UUID(), 'Baby Bottles & Cups', 'baby-bottles-cups', 'Bottles, nipples, cups and feeding accessories.', p.id, 1, 1 FROM categories p WHERE p.slug='baby-feeding'
UNION ALL SELECT UUID(), 'Baby Food & Nursing', 'baby-food-nursing', 'Baby food, nursing and mealtime essentials.', p.id, 2, 1 FROM categories p WHERE p.slug='baby-feeding'
UNION ALL SELECT UUID(), 'Vehicle Cameras', 'vehicle-cameras', 'Dash cameras, reverse cameras and parking assistance.', p.id, 1, 1 FROM categories p WHERE p.slug='car-electronics'
UNION ALL SELECT UUID(), 'Car Audio', 'car-audio', 'Speakers, stereos and in-car entertainment.', p.id, 2, 1 FROM categories p WHERE p.slug='car-electronics'
UNION ALL SELECT UUID(), 'Drilling & Cutting', 'drilling-cutting', 'Drills, saws and cutting machines.', p.id, 1, 1 FROM categories p WHERE p.slug='power-tools'
UNION ALL SELECT UUID(), 'Tool Accessories', 'tool-accessories', 'Bits, blades, batteries and tool storage.', p.id, 2, 1 FROM categories p WHERE p.slug='power-tools'
UNION ALL SELECT UUID(), 'Console Families', 'console-families', 'PlayStation, Xbox and Nintendo hardware.', p.id, 1, 1 FROM categories p WHERE p.slug='gaming-consoles'
UNION ALL SELECT UUID(), 'Console Accessories', 'console-accessories', 'Controllers, docks, storage and charging accessories.', p.id, 2, 1 FROM categories p WHERE p.slug='gaming-consoles'
UNION ALL SELECT UUID(), 'Smart Bulbs & Strips', 'smart-bulbs-strips', 'Connected bulbs, strips and lighting kits.', p.id, 1, 1 FROM categories p WHERE p.slug='smart-lighting'
UNION ALL SELECT UUID(), 'Lighting Controls', 'lighting-controls', 'Switches, dimmers and control hubs.', p.id, 2, 1 FROM categories p WHERE p.slug='smart-lighting';

INSERT IGNORE INTO categories (id, name, slug, description, parent_id, display_order, is_active)
SELECT UUID(), 'Android Phones', 'android-phones', 'Samsung, Xiaomi, Oppo, Vivo and other Android phones.', p.id, 1, 1 FROM categories p WHERE p.slug='smartphones'
UNION ALL SELECT UUID(), 'iPhones', 'iphones', 'Apple iPhone models and official iOS phones.', p.id, 2, 1 FROM categories p WHERE p.slug='smartphones'
UNION ALL SELECT UUID(), '5G Phones', '5g-phones', '5G-ready phones across budgets and brands.', p.id, 3, 1 FROM categories p WHERE p.slug='smartphones'
UNION ALL SELECT UUID(), 'Cases & Covers', 'mobile-cases-covers', 'Phone cases, covers, bumpers and protective shells.', p.id, 1, 1 FROM categories p WHERE p.slug='mobile-accessories'
UNION ALL SELECT UUID(), 'Chargers & Cables', 'chargers-cables', 'Wall chargers, USB cables and fast charging accessories.', p.id, 3, 1 FROM categories p WHERE p.slug='mobile-accessories'
UNION ALL SELECT UUID(), 'Power Banks', 'power-banks', 'Portable chargers and backup power banks.', p.id, 4, 1 FROM categories p WHERE p.slug='mobile-accessories'
UNION ALL SELECT UUID(), 'Smart TVs', 'smart-tvs', 'Internet-connected televisions with streaming apps.', p.id, 1, 1 FROM categories p WHERE p.slug='televisions'
UNION ALL SELECT UUID(), 'LED TVs', 'led-tvs', 'LED televisions for everyday home viewing.', p.id, 2, 1 FROM categories p WHERE p.slug='televisions'
UNION ALL SELECT UUID(), 'Soundbars', 'soundbars', 'Soundbars and compact home theater audio.', p.id, 2, 1 FROM categories p WHERE p.slug='streaming-home-cinema'
UNION ALL SELECT UUID(), 'Gaming Laptops', 'gaming-laptops', 'High-performance laptops for gaming and graphics.', p.id, 1, 1 FROM categories p WHERE p.slug='laptop-types'
UNION ALL SELECT UUID(), 'Business Laptops', 'business-laptops', 'Work laptops for offices and professionals.', p.id, 2, 1 FROM categories p WHERE p.slug='laptop-types'
UNION ALL SELECT UUID(), 'Student Laptops', 'student-laptops', 'Affordable laptops for study and everyday use.', p.id, 3, 1 FROM categories p WHERE p.slug='laptop-types'
UNION ALL SELECT UUID(), 'Laptop Bags', 'laptop-bags', 'Sleeves, backpacks and laptop cases.', p.id, 1, 1 FROM categories p WHERE p.slug='laptop-accessories'
UNION ALL SELECT UUID(), 'Laptop Chargers', 'laptop-chargers', 'Replacement and compatible laptop adapters.', p.id, 2, 1 FROM categories p WHERE p.slug='laptop-accessories'
UNION ALL SELECT UUID(), 'Processors', 'processors', 'Desktop and workstation CPUs.', p.id, 1, 1 FROM categories p WHERE p.slug='internal-components'
UNION ALL SELECT UUID(), 'Graphics Cards', 'graphics-cards', 'GPUs for gaming, editing and AI workloads.', p.id, 2, 1 FROM categories p WHERE p.slug='internal-components'
UNION ALL SELECT UUID(), 'SSD Drives', 'ssd-drives', 'SATA, NVMe and portable SSD storage.', p.id, 1, 1 FROM categories p WHERE p.slug='storage-power'
UNION ALL SELECT UUID(), 'Pots & Pans', 'pots-pans', 'Cooking pots, frying pans and saute pans.', p.id, 1, 1 FROM categories p WHERE p.slug='cookware'
UNION ALL SELECT UUID(), 'Dinnerware Sets', 'dinnerware-sets', 'Plates, bowls and dinner sets.', p.id, 1, 1 FROM categories p WHERE p.slug='dining-serveware'
UNION ALL SELECT UUID(), 'Sofas & Couches', 'sofas-couches', 'Sofas, couches and sofa sets.', p.id, 1, 1 FROM categories p WHERE p.slug='living-room-furniture'
UNION ALL SELECT UUID(), 'Beds', 'beds', 'Bed frames, divans and bedroom sets.', p.id, 1, 1 FROM categories p WHERE p.slug='bedroom-furniture'
UNION ALL SELECT UUID(), 'Face Wash', 'face-wash', 'Face cleansers and daily face wash.', p.id, 1, 1 FROM categories p WHERE p.slug='face-care'
UNION ALL SELECT UUID(), 'Moisturizers', 'moisturizers', 'Creams, lotions and hydrating products.', p.id, 2, 1 FROM categories p WHERE p.slug='face-care'
UNION ALL SELECT UUID(), 'Foundation', 'foundation', 'Liquid, powder and cream foundations.', p.id, 1, 1 FROM categories p WHERE p.slug='face-makeup'
UNION ALL SELECT UUID(), 'Lipstick', 'lipstick', 'Lipstick, lip gloss and lip tint.', p.id, 3, 1 FROM categories p WHERE p.slug='eye-lip-makeup'
UNION ALL SELECT UUID(), 'Kurtas & Shalwar Kameez', 'womens-kurtas-shalwar-kameez', 'Women''s eastern wear and stitched suits.', p.id, 1, 1 FROM categories p WHERE p.slug='womens-clothing'
UNION ALL SELECT UUID(), 'Handbags', 'womens-handbags', 'Handbags, shoulder bags and totes.', p.id, 3, 1 FROM categories p WHERE p.slug='womens-shoes-bags'
UNION ALL SELECT UUID(), 'Men''s T-Shirts', 'mens-tshirts', 'Casual T-shirts and polos.', p.id, 1, 1 FROM categories p WHERE p.slug='mens-clothing'
UNION ALL SELECT UUID(), 'Men''s Shalwar Kameez', 'mens-shalwar-kameez', 'Traditional men''s clothing.', p.id, 3, 1 FROM categories p WHERE p.slug='mens-clothing'
UNION ALL SELECT UUID(), 'Men''s Sneakers', 'mens-sneakers', 'Sneakers and casual shoes.', p.id, 2, 1 FROM categories p WHERE p.slug='mens-shoes-accessories'
UNION ALL SELECT UUID(), 'Rice', 'rice', 'Basmati, sella and everyday rice.', p.id, 1, 1 FROM categories p WHERE p.slug='cooking-essentials'
UNION ALL SELECT UUID(), 'Cooking Oil & Ghee', 'cooking-oil-ghee', 'Cooking oil, ghee and shortening.', p.id, 3, 1 FROM categories p WHERE p.slug='cooking-essentials'
UNION ALL SELECT UUID(), 'Pasta & Noodles', 'pasta-noodles', 'Pasta, noodles and instant meals.', p.id, 1, 1 FROM categories p WHERE p.slug='packaged-food'
UNION ALL SELECT UUID(), 'Feeding Bottles', 'feeding-bottles', 'Plastic, glass and anti-colic feeding bottles.', p.id, 1, 1 FROM categories p WHERE p.slug='baby-bottles-cups'
UNION ALL SELECT UUID(), 'High Chairs', 'high-chairs', 'High chairs and booster seats.', p.id, 3, 1 FROM categories p WHERE p.slug='baby-food-nursing'
UNION ALL SELECT UUID(), 'Dash Cameras', 'dash-cameras', 'Front, rear and dual dash cameras.', p.id, 1, 1 FROM categories p WHERE p.slug='vehicle-cameras'
UNION ALL SELECT UUID(), 'Car Stereos', 'car-stereos', 'Head units and infotainment players.', p.id, 1, 1 FROM categories p WHERE p.slug='car-audio'
UNION ALL SELECT UUID(), 'Drills', 'drills', 'Corded and cordless drills.', p.id, 1, 1 FROM categories p WHERE p.slug='drilling-cutting'
UNION ALL SELECT UUID(), 'Drill Bits', 'drill-bits', 'Masonry, metal and wood drill bits.', p.id, 1, 1 FROM categories p WHERE p.slug='tool-accessories'
UNION ALL SELECT UUID(), 'PlayStation Consoles', 'playstation-consoles', 'PlayStation consoles and bundles.', p.id, 1, 1 FROM categories p WHERE p.slug='console-families'
UNION ALL SELECT UUID(), 'Controllers', 'console-controllers', 'Gamepads and wireless controllers.', p.id, 1, 1 FROM categories p WHERE p.slug='console-accessories'
UNION ALL SELECT UUID(), 'Smart Bulbs', 'smart-bulbs', 'Wi-Fi and Bluetooth smart bulbs.', p.id, 1, 1 FROM categories p WHERE p.slug='smart-bulbs-strips'
UNION ALL SELECT UUID(), 'Smart Switches', 'smart-switches', 'Wall switches and smart relays.', p.id, 1, 1 FROM categories p WHERE p.slug='lighting-controls';

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  category_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  description TEXT,
  specifications JSON,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_per_item DECIMAL(10,2),
  sku VARCHAR(191),
  barcode VARCHAR(191),
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  status ENUM('draft', 'pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_deal TINYINT(1) NOT NULL DEFAULT 0,
  deal_expires_at DATETIME,
  views_count INT NOT NULL DEFAULT 0,
  sales_count INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_reviews INT NOT NULL DEFAULT 0,
  approved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  UNIQUE KEY uniq_products_seller_slug (seller_id, slug),
  INDEX idx_products_seller (seller_id),
  INDEX idx_products_category (category_id),
  INDEX idx_products_status (status),
  INDEX idx_products_flags (status, is_featured, is_deal),
  FULLTEXT INDEX idx_products_search (title, description, sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images_product (product_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  size VARCHAR(80),
  color VARCHAR(80),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  stock_quantity INT NOT NULL DEFAULT 0,
  sku VARCHAR(191) NOT NULL UNIQUE,
  image_url TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_variants_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id CHAR(36) PRIMARY KEY,
  cart_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  variant_id CHAR(36),
  quantity INT NOT NULL DEFAULT 1,
  price_at_addition DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_cart_product_variant (cart_id, product_id, variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_wishlist_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  order_number VARCHAR(80) NOT NULL UNIQUE,
  customer_id CHAR(36) NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  shipping_full_name VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(50) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(120) NOT NULL,
  shipping_state VARCHAR(120) NOT NULL,
  shipping_postal_code VARCHAR(40) NOT NULL,
  shipping_country VARCHAR(120) NOT NULL,
  billing_same_as_shipping TINYINT(1) NOT NULL DEFAULT 1,
  billing_full_name VARCHAR(255),
  billing_address TEXT,
  billing_city VARCHAR(120),
  billing_state VARCHAR(120),
  billing_postal_code VARCHAR(40),
  billing_country VARCHAR(120),
  notes TEXT,
  tracking_number VARCHAR(191),
  shipped_at DATETIME,
  delivered_at DATETIME,
  cancelled_at DATETIME,
  cancellation_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE RESTRICT,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  product_title VARCHAR(255) NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  seller_earnings DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_seller (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL UNIQUE,
  payment_method VARCHAR(80) NOT NULL,
  provider VARCHAR(40),
  provider_payment_intent_id VARCHAR(191),
  provider_charge_id VARCHAR(191),
  provider_refund_id VARCHAR(191),
  idempotency_key VARCHAR(191),
  transaction_id VARCHAR(191),
  payment_proof_url TEXT,
  failure_message TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'pkr',
  refunded_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  paid_at DATETIME,
  refunded_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_payments_provider_intent (provider_payment_intent_id),
  UNIQUE KEY uniq_payments_idempotency_key (idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_refunds (
  id CHAR(36) PRIMARY KEY,
  payment_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'stripe',
  provider_refund_id VARCHAR(191),
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(191),
  status VARCHAR(80) NOT NULL DEFAULT 'pending',
  idempotency_key VARCHAR(191),
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_refunds_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_payment_refunds_provider_refund (provider_refund_id),
  UNIQUE KEY uniq_payment_refunds_idempotency_key (idempotency_key),
  INDEX idx_payment_refunds_payment (payment_id),
  INDEX idx_payment_refunds_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id CHAR(36) PRIMARY KEY,
  provider_event_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(191) NOT NULL,
  payment_intent_id VARCHAR(191),
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_stripe_webhook_event (provider_event_id),
  INDEX idx_stripe_webhook_payment_intent (payment_intent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_status_events (
  id CHAR(36) PRIMARY KEY,
  payment_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  status VARCHAR(80) NOT NULL,
  source VARCHAR(80) NOT NULL,
  provider_event_id VARCHAR(191),
  provider_object_id VARCHAR(191),
  message TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_status_events_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_status_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payment_status_events_payment (payment_id),
  INDEX idx_payment_status_events_order (order_id),
  INDEX idx_payment_status_events_provider_event (provider_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seller_earnings (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  order_item_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'pending',
  available_at DATETIME,
  released_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seller_earnings_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller_earnings_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  INDEX idx_seller_earnings_release (status, available_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  rejected_at DATETIME,
  completed_at DATETIME,
  rejection_reason TEXT,
  approved_by CHAR(36),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_withdrawals_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawals_admin FOREIGN KEY (approved_by) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_events (
  id CHAR(36) PRIMARY KEY,
  payment_id CHAR(36),
  order_id CHAR(36) NOT NULL,
  provider VARCHAR(120) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  event_status ENUM('received', 'processed', 'ignored', 'failed') NOT NULL DEFAULT 'received',
  provider_event_id VARCHAR(191),
  provider_payment_id VARCHAR(191),
  amount DECIMAL(12,2),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  payload JSON NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_events_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_payment_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_payment_events_provider_event (provider, provider_event_id),
  INDEX idx_payment_events_order (order_id),
  INDEX idx_payment_events_payment (payment_id),
  INDEX idx_payment_events_status (event_status, received_at),
  INDEX idx_payment_events_provider_payment (provider, provider_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refund_records (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  payment_id CHAR(36),
  return_request_id CHAR(36),
  requested_by CHAR(36),
  approved_by CHAR(36),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  reason TEXT NOT NULL,
  status ENUM('requested', 'approved', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'requested',
  provider VARCHAR(120),
  provider_refund_id VARCHAR(191),
  notes TEXT,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  processed_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_refund_records_amount CHECK (amount > 0),
  CONSTRAINT fk_refund_records_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_refund_records_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_refund_records_requested_by FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_refund_records_approved_by FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_refund_records_provider_refund (provider, provider_refund_id),
  INDEX idx_refund_records_order (order_id),
  INDEX idx_refund_records_payment (payment_id),
  INDEX idx_refund_records_return_request (return_request_id),
  INDEX idx_refund_records_status (status, requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payout_batches (
  id CHAR(36) PRIMARY KEY,
  batch_number VARCHAR(120) NOT NULL UNIQUE,
  status ENUM('draft', 'approved', 'processing', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'draft',
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_fees DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  item_count INT NOT NULL DEFAULT 0,
  payout_method VARCHAR(120),
  payout_reference VARCHAR(191),
  scheduled_for DATE,
  approved_by CHAR(36),
  approved_at DATETIME,
  processed_at DATETIME,
  completed_at DATETIME,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payout_batches_approved_by FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_payout_batches_status (status, scheduled_for),
  INDEX idx_payout_batches_reference (payout_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payout_batch_items (
  id CHAR(36) PRIMARY KEY,
  payout_batch_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  seller_earning_id CHAR(36),
  withdrawal_request_id CHAR(36),
  amount DECIMAL(12,2) NOT NULL,
  fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'included', 'paid', 'failed', 'withheld') NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  paid_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_payout_batch_items_amount CHECK (amount >= 0),
  CONSTRAINT chk_payout_batch_items_net_amount CHECK (net_amount >= 0),
  CONSTRAINT chk_payout_batch_items_source CHECK (seller_earning_id IS NOT NULL OR withdrawal_request_id IS NOT NULL),
  CONSTRAINT fk_payout_batch_items_batch FOREIGN KEY (payout_batch_id) REFERENCES payout_batches(id) ON DELETE CASCADE,
  CONSTRAINT fk_payout_batch_items_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payout_batch_items_earning FOREIGN KEY (seller_earning_id) REFERENCES seller_earnings(id) ON DELETE SET NULL,
  CONSTRAINT fk_payout_batch_items_withdrawal FOREIGN KEY (withdrawal_request_id) REFERENCES withdrawal_requests(id) ON DELETE SET NULL,
  INDEX idx_payout_batch_items_batch (payout_batch_id),
  INDEX idx_payout_batch_items_seller (seller_id, status),
  INDEX idx_payout_batch_items_earning (seller_earning_id),
  INDEX idx_payout_batch_items_withdrawal (withdrawal_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cod_reconciliations (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL UNIQUE,
  payment_id CHAR(36),
  courier_name VARCHAR(120),
  courier_reference VARCHAR(191),
  expected_amount DECIMAL(12,2) NOT NULL,
  collected_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  remitted_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  courier_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discrepancy_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  status ENUM('awaiting_collection', 'collected', 'partially_remitted', 'reconciled', 'short_paid', 'over_paid', 'disputed', 'written_off') NOT NULL DEFAULT 'awaiting_collection',
  collected_at DATETIME,
  remitted_at DATETIME,
  reconciled_at DATETIME,
  reconciled_by CHAR(36),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_cod_reconciliations_expected CHECK (expected_amount >= 0),
  CONSTRAINT chk_cod_reconciliations_collected CHECK (collected_amount >= 0),
  CONSTRAINT chk_cod_reconciliations_remitted CHECK (remitted_amount >= 0),
  CONSTRAINT chk_cod_reconciliations_fee CHECK (courier_fee >= 0),
  CONSTRAINT fk_cod_reconciliations_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_cod_reconciliations_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_cod_reconciliations_reconciled_by FOREIGN KEY (reconciled_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_cod_reconciliations_status (status, created_at),
  INDEX idx_cod_reconciliations_payment (payment_id),
  INDEX idx_cod_reconciliations_courier (courier_name, courier_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_ledger_entries (
  id CHAR(36) PRIMARY KEY,
  entry_number VARCHAR(120) NOT NULL UNIQUE,
  entry_type VARCHAR(120) NOT NULL,
  direction ENUM('debit', 'credit') NOT NULL,
  status ENUM('pending', 'posted', 'voided') NOT NULL DEFAULT 'pending',
  account_code VARCHAR(120) NOT NULL,
  seller_id CHAR(36),
  customer_id CHAR(36),
  order_id CHAR(36),
  order_item_id CHAR(36),
  payment_id CHAR(36),
  payment_event_id CHAR(36),
  refund_record_id CHAR(36),
  payout_batch_id CHAR(36),
  payout_batch_item_id CHAR(36),
  cod_reconciliation_id CHAR(36),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  memo TEXT,
  idempotency_key VARCHAR(191) UNIQUE,
  posted_at DATETIME,
  voided_at DATETIME,
  metadata JSON NOT NULL,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_finance_ledger_entries_amount CHECK (amount >= 0),
  CONSTRAINT fk_finance_ledger_entries_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_payment_event FOREIGN KEY (payment_event_id) REFERENCES payment_events(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_refund FOREIGN KEY (refund_record_id) REFERENCES refund_records(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_payout_batch FOREIGN KEY (payout_batch_id) REFERENCES payout_batches(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_payout_item FOREIGN KEY (payout_batch_item_id) REFERENCES payout_batch_items(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_cod FOREIGN KEY (cod_reconciliation_id) REFERENCES cod_reconciliations(id) ON DELETE SET NULL,
  CONSTRAINT fk_finance_ledger_entries_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_finance_ledger_entries_status (status, posted_at),
  INDEX idx_finance_ledger_entries_account (account_code, direction),
  INDEX idx_finance_ledger_entries_order (order_id),
  INDEX idx_finance_ledger_entries_seller (seller_id),
  INDEX idx_finance_ledger_entries_payment (payment_id),
  INDEX idx_finance_ledger_entries_refund (refund_record_id),
  INDEX idx_finance_ledger_entries_payout (payout_batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(36) PRIMARY KEY,
  product_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  order_id CHAR(36),
  rating INT NOT NULL,
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
  helpful_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_reviews_purchase (product_id, user_id, order_id),
  CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS return_requests (
  id CHAR(36) PRIMARY KEY,
  return_number VARCHAR(80) NOT NULL UNIQUE,
  order_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  status ENUM('requested', 'approved', 'rejected', 'received', 'refunded') NOT NULL DEFAULT 'requested',
  reason VARCHAR(191) NOT NULL,
  details TEXT,
  refund_amount DECIMAL(10,2),
  admin_note TEXT,
  approved_at DATETIME,
  rejected_at DATETIME,
  refunded_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_returns_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_returns_order (order_id),
  INDEX idx_returns_customer (customer_id),
  INDEX idx_returns_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id CHAR(36) PRIMARY KEY,
  ticket_number VARCHAR(80) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  order_id CHAR(36),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80),
  priority VARCHAR(40) NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  assigned_to CHAR(36),
  resolved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_assignee FOREIGN KEY (assigned_to) REFERENCES profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_messages (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ticket_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_messages_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  valid_from DATETIME,
  valid_until DATETIME,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotion_requests (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  product_id CHAR(36),
  request_type VARCHAR(80) NOT NULL DEFAULT 'seller_voucher',
  title VARCHAR(255) NOT NULL,
  details TEXT,
  discount_type VARCHAR(40),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  budget_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  start_at DATETIME,
  end_at DATETIME,
  status ENUM('pending', 'approved', 'active', 'rejected', 'ended') NOT NULL DEFAULT 'pending',
  approved_by CHAR(36),
  approved_at DATETIME,
  rejected_at DATETIME,
  rejection_reason TEXT,
  admin_note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_promotion_requests_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_promotion_requests_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_promotion_requests_admin FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_promotion_requests_seller (seller_id),
  INDEX idx_promotion_requests_product (product_id),
  INDEX idx_promotion_requests_type_status (request_type, status),
  INDEX idx_promotion_requests_status_dates (status, start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  product_id CHAR(36),
  campaign_type VARCHAR(80) NOT NULL DEFAULT 'sponsored_products',
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(80) NOT NULL DEFAULT 'traffic',
  placement VARCHAR(80) NOT NULL DEFAULT 'search_results',
  status ENUM('pending', 'approved', 'active', 'paused', 'rejected', 'ended') NOT NULL DEFAULT 'pending',
  daily_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_budget DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  spent_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  target_keywords TEXT,
  target_categories TEXT,
  admin_score INT NOT NULL DEFAULT 50,
  quality_score INT NOT NULL DEFAULT 50,
  seller_health_score INT NOT NULL DEFAULT 50,
  start_at DATETIME,
  end_at DATETIME,
  approved_by CHAR(36),
  approved_at DATETIME,
  rejected_at DATETIME,
  rejection_reason TEXT,
  admin_note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_marketing_campaigns_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_marketing_campaigns_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_marketing_campaigns_admin FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_marketing_campaigns_seller (seller_id),
  INDEX idx_marketing_campaigns_product (product_id),
  INDEX idx_marketing_campaigns_status (status, start_at, end_at),
  INDEX idx_marketing_campaigns_score (status, admin_score, bid_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketing_ad_events (
  id CHAR(36) PRIMARY KEY,
  campaign_id CHAR(36) NOT NULL,
  product_id CHAR(36),
  seller_id CHAR(36) NOT NULL,
  event_type ENUM('impression', 'click', 'conversion') NOT NULL DEFAULT 'impression',
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_marketing_events_campaign FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_marketing_events_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_marketing_events_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  INDEX idx_marketing_events_campaign (campaign_id, event_type),
  INDEX idx_marketing_events_seller (seller_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  street TEXT NOT NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  postal_code VARCHAR(40) NOT NULL,
  country VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_addresses_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  id CHAR(36) PRIMARY KEY,
  `key` VARCHAR(191) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  bucket_key VARCHAR(255) PRIMARY KEY,
  rate_limit_key VARCHAR(120) NOT NULL,
  ip_address VARCHAR(80) NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  window_reset_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rate_limit_key (rate_limit_key),
  INDEX idx_rate_limit_reset (window_reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS abuse_audit_events (
  id CHAR(36) PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  rate_limit_key VARCHAR(120),
  ip_address VARCHAR(80),
  user_agent VARCHAR(500),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_abuse_event_type (event_type),
  INDEX idx_abuse_rate_limit_key (rate_limit_key),
  INDEX idx_abuse_ip_created (ip_address, created_at),
  INDEX idx_abuse_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NOT NULL,
  action VARCHAR(80) NOT NULL,
  table_name VARCHAR(120) NOT NULL,
  record_id CHAR(36),
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_audit_admin FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_admin_audit_admin (admin_id),
  INDEX idx_admin_audit_table (table_name, record_id),
  INDEX idx_admin_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS upload_files (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  scope ENUM('product', 'seller-logo', 'seller-banner', 'kyc', 'cms', 'category', 'payment-proof') NOT NULL,
  storage ENUM('public', 'private') NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  review_status ENUM('pending', 'approved', 'manual_review') NOT NULL DEFAULT 'pending',
  retention_days INT,
  expires_at DATETIME,
  deleted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_upload_files_owner FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_upload_files_owner_scope (owner_id, scope, created_at),
  INDEX idx_upload_files_scope_status (scope, review_status),
  INDEX idx_upload_files_expires (expires_at, deleted_at),
  INDEX idx_upload_files_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id CHAR(36) PRIMARY KEY,
  email_type VARCHAR(120) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  html_body MEDIUMTEXT NOT NULL,
  status ENUM('queued', 'sending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  provider_message_id VARCHAR(255),
  last_error TEXT,
  metadata JSON,
  next_retry_at DATETIME,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email_delivery_status (status, next_retry_at),
  INDEX idx_email_delivery_type (email_type),
  INDEX idx_email_delivery_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (id, `key`, value, description) VALUES
(UUID(), 'default_commission_rate', '15.00', 'Default commission percentage for new sellers'),
(UUID(), 'tax_rate', '0.00', 'Default tax rate percentage'),
(UUID(), 'shipping_rate', '0.00', 'Default shipping rate'),
(UUID(), 'site_name', 'Mercato', 'Public marketplace name'),
(UUID(), 'site_currency_code', 'PKR', 'Currency code displayed across the marketplace'),
(UUID(), 'site_currency_symbol', 'Rs', 'Currency symbol displayed before marketplace prices'),
(UUID(), 'site_currency_rate', '1', 'Display conversion rate applied to base product prices'),
(UUID(), 'default_delivery_city', 'Karachi', 'Default customer delivery city shown in the header'),
(UUID(), 'seller_payout_hold_days', '2', 'Days after delivery before seller earnings become available'),
(UUID(), 'seller_center_important_notification', 'You are updated! No new important notification for you.', 'Seller Center dashboard notification controlled by admin'),
(UUID(), 'seller_center_learning_enabled', 'true', 'Show Learn and Grow recommendations in seller dashboard'),
(UUID(), 'seller_center_toolkit_enabled', 'true', 'Show popular seller toolkit actions'),
(UUID(), 'seller_center_campaign_name', '11.11 Growth Guide', 'Featured seller education campaign'),
(UUID(), 'seller_center_enabled_options', 'all', 'Enabled Seller Center workflow options'),
(UUID(), 'homepage_hero_title', 'Everything your customers search for, all in one marketplace', 'Homepage hero title controlled by admin CMS'),
(UUID(), 'homepage_hero_subtitle', 'Discover trusted sellers, daily deals, fast order tracking and admin-approved products built for a serious multivendor store.', 'Homepage hero subtitle controlled by admin CMS'),
(UUID(), 'homepage_hero_cta_label', 'Shop Today''s Deals', 'Homepage hero CTA label controlled by admin CMS'),
(UUID(), 'homepage_hero_cta_href', '/deals', 'Homepage hero CTA link controlled by admin CMS'),
(UUID(), 'footer_about_text', 'Mercato connects customers with verified sellers, curated products, secure checkout and reliable support.', 'Footer about text controlled by admin CMS'),
(UUID(), 'footer_links_json', '[{"title":"Get to Know Us","links":[{"label":"About Mercato","href":"/about"},{"label":"Careers","href":"/careers"},{"label":"Blog","href":"/blog"},{"label":"Press Center","href":"/press"},{"label":"Investor Relations","href":"/investors"}]},{"title":"Make Money with Us","links":[{"label":"Sell on Mercato","href":"/seller-info"},{"label":"Seller Center","href":"/seller"},{"label":"Vendor Signup","href":"/seller/register"},{"label":"Advertise Products","href":"/seller/marketing-solutions"},{"label":"Fulfillment Services","href":"/seller/learn?view=fulfillment"}]},{"title":"Payment Products","links":[{"label":"Business Account","href":"/business"},{"label":"Shop with Points","href":"/rewards"},{"label":"Reload Balance","href":"/account/dashboard"},{"label":"Currency Converter","href":"/currency"},{"label":"Payment Help","href":"/help?topic=payments"}]},{"title":"Let Us Help You","links":[{"label":"Your Account","href":"/account/dashboard"},{"label":"Your Orders","href":"/account/orders"},{"label":"Shipping Rates","href":"/shipping"},{"label":"Returns & Replacements","href":"/returns"},{"label":"Help Center","href":"/help"}]}]', 'Editable footer column links as JSON'),
(UUID(), 'public_pages_json', '[{"slug":"terms","title":"Terms of Service","summary":"Marketplace rules for buyers, sellers, payments, delivery and returns.","lastUpdated":"June 2026","sections":[{"heading":"Acceptance of Terms","body":"By using this marketplace, buyers and sellers agree to platform rules, product approvals, payments, returns and account safety."},{"heading":"Seller Listings","body":"Products remain pending until admin approval. Admin can approve, reject, feature, suspend or remove listings."}]},{"slug":"privacy","title":"Privacy Policy","summary":"How account, order, seller KYC and payment data is handled.","lastUpdated":"June 2026","sections":[{"heading":"Information We Collect","body":"We collect account details, order activity, seller business information, KYC documents and support messages needed to operate the marketplace."},{"heading":"KYC Access","body":"Authorized admin staff can review seller CNIC, business documents and buyer KYC data where provided."}]},{"slug":"contact","title":"Contact Us","summary":"Reach marketplace support for buyer help, seller support, payments, returns and KYC questions.","lastUpdated":"June 2026","contact":{"email":"support@marketplace.com","phone":"+92 300 0000000","address":"Karachi, Pakistan","hours":"Monday - Saturday, 9:00 AM - 6:00 PM"},"sections":[{"heading":"Support Scope","body":"Use this page for order issues, seller onboarding, payment proof, return requests, KYC questions and technical support."}]},{"slug":"about","title":"About Mercato","summary":"A multivendor marketplace built for verified sellers, trusted products and reliable operations.","lastUpdated":"June 2026","sections":[{"heading":"Marketplace Mission","body":"Mercato helps customers discover products from verified sellers while keeping approvals, content, seller access and fulfillment workflows organized."}]}]', 'Editable public pages such as terms, privacy, contact and custom pages');
