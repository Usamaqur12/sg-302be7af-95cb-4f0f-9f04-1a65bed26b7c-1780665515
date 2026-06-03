-- Add full-text search support to products table

-- 1. Add a text search vector column
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create a function to update the search vector
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically update search vector on insert/update
DROP TRIGGER IF EXISTS products_search_vector_trigger ON products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();

-- 4. Update existing products with search vectors
UPDATE products SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(sku, '')), 'C');

-- 5. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS products_search_vector_idx ON products USING GIN(search_vector);

-- 6. Create additional search helper function
CREATE OR REPLACE FUNCTION search_products(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL(10,2),
  rating DECIMAL(3,2),
  total_reviews INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.rating,
    p.total_reviews,
    ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM products p
  WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
    AND p.status = 'approved'
  ORDER BY rank DESC, p.rating DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;