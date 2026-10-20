export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProductStatus = 'draft' | 'active' | 'archived'
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  storage_path: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface CategoryWithCountRow extends CategoryRow {
  products_count: number
  parent_name?: string | null
}

export interface ProductRow {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  base_price: number
  compare_at_price: number | null
  status: ProductStatus
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariantRow {
  id: string
  product_id: string
  sku: string | null
  name: string
  size: string | null
  color: string | null
  dimensions: string | null
  price_override: number | null
  stock_quantity: number
  min_stock_alert: number
  image_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductImageRow {
  id: string
  product_id: string
  variant_id: string | null
  url: string
  storage_path: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

export interface StockMovementRow {
  id: string
  variant_id: string
  movement_type: StockMovementType
  quantity_change: number
  previous_stock: number
  new_stock: number
  reason: string
  created_by: string | null
  created_at: string
}

export interface HomeBannerRow {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  storage_path: string
  link_url: string | null
  cta_text: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShowcaseProductItem {
  id: string
  name: string
  slug: string
  description: string | null
  base_price: number
  compare_at_price: number | null
  category_id: string | null
  category_name: string | null
  category_slug: string | null
  primary_image_url: string | null
  secondary_image_url: string | null
  total_stock: number
  min_stock_alert: number
  is_featured: boolean
  created_at: string
}

export interface SystemStorageStats {
  db_size_bytes: number
  db_limit_bytes: number
  storage_size_bytes: number
  storage_limit_bytes: number
  total_files_count: number
  egress_limit_bytes: number
  mau_limit: number
}

export interface ProductWithRelations extends ProductRow {
  category?: CategoryRow | null
  variants: ProductVariantRow[]
  images: ProductImageRow[]
}

export interface StockMovementWithDetails extends StockMovementRow {
  variant?: {
    id: string
    name: string
    sku: string | null
    size: string | null
    color: string | null
    stock_quantity: number
    product?: {
      id: string
      name: string
      slug: string
    } | null
  } | null
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          storage_path?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      products: {
        Row: ProductRow
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          base_price: number
          compare_at_price?: number | null
          status?: ProductStatus
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      product_variants: {
        Row: ProductVariantRow
        Insert: {
          id?: string
          product_id: string
          sku?: string | null
          name: string
          size?: string | null
          color?: string | null
          dimensions?: string | null
          price_override?: number | null
          stock_quantity?: number
          min_stock_alert?: number
          image_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
        Relationships: []
      }
      product_images: {
        Row: ProductImageRow
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          url: string
          storage_path: string
          alt_text?: string | null
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
        Relationships: []
      }
      stock_movements: {
        Row: StockMovementRow
        Insert: {
          id?: string
          variant_id: string
          movement_type: StockMovementType
          quantity_change: number
          previous_stock: number
          new_stock: number
          reason: string
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>
        Relationships: []
      }
      home_banners: {
        Row: HomeBannerRow
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url: string
          storage_path: string
          link_url?: string | null
          cta_text?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['home_banners']['Insert']>
        Relationships: []
      }
    }
    Views: {
      categories_with_count: {
        Row: CategoryWithCountRow
        Relationships: []
      }
    }
    Functions: {
      register_stock_movement: {
        Args: {
          p_variant_id: string
          p_type: StockMovementType
          p_quantity_change: number
          p_reason: string
        }
        Returns: StockMovementRow
      }
      get_random_showcase_products: {
        Args: {
          p_limit?: number
        }
        Returns: ShowcaseProductItem[]
      }
      get_system_storage_stats: {
        Args: Record<string, never>
        Returns: SystemStorageStats
      }
    }
    Enums: {
      product_status: ProductStatus
      stock_movement_type: StockMovementType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
