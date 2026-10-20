-- =============================================================================
-- Migration: 20261020000000_initial_catalog_schema.sql
-- Description: Initial schema for El Peque Hong Kong Dynamic Catalog & Stock
-- =============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Enums
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Tables

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url text,
  storage_path text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  base_price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  compare_at_price numeric(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  status public.product_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid,
  url text NOT NULL,
  storage_path text NOT NULL,
  alt_text text,
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text UNIQUE,
  name text NOT NULL,
  size text,
  color text,
  dimensions text,
  price_override numeric(12, 2) CHECK (price_override IS NULL OR price_override >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_alert integer NOT NULL DEFAULT 3 CHECK (min_stock_alert >= 0),
  image_id uuid REFERENCES public.product_images(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  movement_type public.stock_movement_type NOT NULL,
  quantity_change integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL CHECK (new_stock >= 0),
  reason text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  link_url text,
  cta_text text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes (B-tree Foreign Keys + Trigram Search)
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.categories(is_active, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status_featured_created ON public.products(status, is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku_trgm ON public.product_variants USING gin (sku gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_product_images_variant_id ON public.product_images(variant_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_created ON public.stock_movements(variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_home_banners_active_order ON public.home_banners(is_active, display_order ASC);

-- 5. Views (security_invoker = true to respect RLS)
CREATE OR REPLACE VIEW public.categories_with_count
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.description,
  c.parent_id,
  c.image_url,
  c.storage_path,
  c.is_active,
  c.display_order,
  c.created_at,
  c.updated_at,
  COALESCE(COUNT(p.id), 0)::integer AS products_count,
  parent.name AS parent_name
FROM public.categories c
LEFT JOIN public.products p ON p.category_id = c.id
LEFT JOIN public.categories parent ON parent.id = c.parent_id
GROUP BY c.id, parent.name;

-- 6. Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (TO anon, authenticated)
CREATE POLICY "categories_public_select" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR (select auth.uid()) IS NOT NULL);

CREATE POLICY "products_public_select" ON public.products
  FOR SELECT TO anon, authenticated
  USING (status = 'active' OR (select auth.uid()) IS NOT NULL);

CREATE POLICY "product_variants_public_select" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR (select auth.uid()) IS NOT NULL);

CREATE POLICY "product_images_public_select" ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "home_banners_public_select" ON public.home_banners
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR (select auth.uid()) IS NOT NULL);

-- Admin Write & Protected Read Policies (TO authenticated with auth.uid() check)
CREATE POLICY "categories_admin_insert" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "categories_admin_update" ON public.categories
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "categories_admin_delete" ON public.categories
  FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "product_variants_admin_insert" ON public.product_variants
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "product_variants_admin_update" ON public.product_variants
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "product_variants_admin_delete" ON public.product_variants
  FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "product_images_admin_insert" ON public.product_images
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "product_images_admin_update" ON public.product_images
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "product_images_admin_delete" ON public.product_images
  FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "stock_movements_admin_select" ON public.stock_movements
  FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "stock_movements_admin_insert" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "home_banners_admin_insert" ON public.home_banners
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "home_banners_admin_update" ON public.home_banners
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "home_banners_admin_delete" ON public.home_banners
  FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- 7. RPC Functions

CREATE OR REPLACE FUNCTION public.register_stock_movement(
  p_variant_id uuid,
  p_type public.stock_movement_type,
  p_quantity_change integer,
  p_reason text
)
RETURNS public.stock_movements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_prev_stock integer;
  v_new_stock integer;
  v_delta integer;
  v_movement public.stock_movements;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: admin session required' USING ERRCODE = '42501';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required for stock movements' USING ERRCODE = '22023';
  END IF;

  SELECT stock_quantity
  INTO v_prev_stock
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product variant not found: %', p_variant_id USING ERRCODE = 'P0002';
  END IF;

  IF p_type = 'IN' THEN
    IF p_quantity_change <= 0 THEN
      RAISE EXCEPTION 'IN movement quantity must be greater than 0' USING ERRCODE = '22023';
    END IF;
    v_new_stock := v_prev_stock + p_quantity_change;
    v_delta := p_quantity_change;
  ELSIF p_type = 'OUT' THEN
    IF p_quantity_change <= 0 THEN
      RAISE EXCEPTION 'OUT movement quantity must be greater than 0' USING ERRCODE = '22023';
    END IF;
    v_new_stock := v_prev_stock - p_quantity_change;
    v_delta := -p_quantity_change;
  ELSIF p_type = 'ADJUSTMENT' THEN
    v_new_stock := p_quantity_change;
    v_delta := v_new_stock - v_prev_stock;
  ELSE
    RAISE EXCEPTION 'Unsupported movement type: %', p_type USING ERRCODE = '22023';
  END IF;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative (previous: %, attempted new: %)', v_prev_stock, v_new_stock
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = v_new_stock,
      updated_at = now()
  WHERE id = p_variant_id;

  INSERT INTO public.stock_movements (
    variant_id,
    movement_type,
    quantity_change,
    previous_stock,
    new_stock,
    reason,
    created_by
  )
  VALUES (
    p_variant_id,
    p_type,
    v_delta,
    v_prev_stock,
    v_new_stock,
    btrim(p_reason),
    v_user_id
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_random_showcase_products(p_limit integer DEFAULT 8)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  base_price numeric,
  compare_at_price numeric,
  category_id uuid,
  category_name text,
  category_slug text,
  primary_image_url text,
  secondary_image_url text,
  total_stock integer,
  min_stock_alert integer,
  is_featured boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.base_price,
    p.compare_at_price,
    p.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    (
      SELECT pi.url
      FROM public.product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.display_order ASC
      LIMIT 1
    ) AS primary_image_url,
    (
      SELECT pi.url
      FROM public.product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.display_order ASC
      OFFSET 1
      LIMIT 1
    ) AS secondary_image_url,
    COALESCE((
      SELECT SUM(pv.stock_quantity)::integer
      FROM public.product_variants pv
      WHERE pv.product_id = p.id AND pv.is_active = true
    ), 0) AS total_stock,
    COALESCE((
      SELECT MIN(pv.min_stock_alert)::integer
      FROM public.product_variants pv
      WHERE pv.product_id = p.id AND pv.is_active = true
    ), 3) AS min_stock_alert,
    p.is_featured,
    p.created_at
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.status = 'active'
  ORDER BY p.is_featured DESC, random()
  LIMIT GREATEST(COALESCE(p_limit, 8), 1);
$$;

CREATE OR REPLACE FUNCTION public.get_system_storage_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_db_bytes bigint;
  v_storage_bytes bigint;
  v_files_count bigint;
BEGIN
  IF (select auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT pg_database_size(current_database()) INTO v_db_bytes;

  SELECT
    COALESCE(SUM((metadata->>'size')::bigint), 0),
    COUNT(*)
  INTO v_storage_bytes, v_files_count
  FROM storage.objects
  WHERE bucket_id = 'catalog-media';

  RETURN jsonb_build_object(
    'db_size_bytes', COALESCE(v_db_bytes, 0),
    'db_limit_bytes', 524288000,
    'storage_size_bytes', COALESCE(v_storage_bytes, 0),
    'storage_limit_bytes', 1073741824,
    'total_files_count', COALESCE(v_files_count, 0),
    'egress_limit_bytes', 5368709120,
    'mau_limit', 50000
  );
END;
$$;

-- Restrict get_system_storage_stats execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_system_storage_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_system_storage_stats() TO authenticated;

-- 8. Storage Bucket & Policies (catalog-media)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-media',
  'catalog-media',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "catalog_media_public_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'catalog-media');

CREATE POLICY "catalog_media_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog-media' AND (select auth.uid()) IS NOT NULL);

CREATE POLICY "catalog_media_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog-media' AND (select auth.uid()) IS NOT NULL)
  WITH CHECK (bucket_id = 'catalog-media' AND (select auth.uid()) IS NOT NULL);

CREATE POLICY "catalog_media_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'catalog-media' AND (select auth.uid()) IS NOT NULL);

