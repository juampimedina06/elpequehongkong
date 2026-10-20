# El Pequeño Hong Kong

Plataforma de catálogo digital dinámico y gestión de inventario de alto rendimiento, diseñada con una estética editorial minimalista y optimizada para operar eficientemente bajo las cuotas del Free Tier de Supabase.

---

## 🚀 Tecnologías Principales

- **Framework Web**: [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- **Biblioteca UI**: [React 19](https://react.dev/)
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/) (modo estricto)
- **Estilos & Diseño**: [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI + Lucide React
- **Backend & Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL con RLS, Auth, Storage bucket `catalog-media`, RPCs y búsqueda trigram `pg_trgm`)
- **Testing**: Node.js Test Runner nativo con [TSX](https://github.com/privatenumber/tsx)

---

## 🏛️ Arquitectura del Sistema

El proyecto sigue una arquitectura en capas desacoplada para garantizar escalabilidad, testeabilidad y mantenimiento limpio:

```
elpequehongkong/
├── actions/             # Next.js Server Actions (mutaciones, revalidaciones de caché)
│   ├── auth/            # Acciones de inicio/cierre de sesión
│   ├── banners/         # Mutaciones y reordenamiento de banners
│   ├── categories/      # Acciones para gestión de categorías
│   ├── products/        # Acciones para catálogo de productos y precios
│   └── stock/           # Registro auditable de movimientos de stock
├── app/                 # Rutas de Next.js App Router
│   ├── (public)/        # Catálogo público, vitrina y ficha de producto
│   ├── admin/           # Panel de administración protegido
│   │   ├── categorias/  # CRUD jerárquico de categorías
│   │   ├── portada/     # Gestor de banners y hero
│   │   ├── productos/   # Catálogo, variantes y actualización masiva
│   │   └── stock/       # Auditoría y ajuste de inventario
│   ├── catalogo/        # Catálogo público con filtros sincronizados en URL
│   ├── login/           # Pantalla de acceso de administración
│   └── layout.tsx       # Layout raíz
├── components/          # Componentes de interfaz clasificados por contexto
│   ├── admin/           # Tablas, métricas, modales de gestión y monitores
│   ├── auth/            # Formularios y guards de autenticación
│   ├── public/          # Filtros de catálogo, cards, galería y selectores
│   └── ui/              # Primitivas de UI accesibles
├── lib/                 # Clientes base y utilidades centrales
│   ├── supabase/        # Clientes Supabase (Browser, Server, Middleware, Admin Service Role)
│   └── image-compression.ts # Compresión adaptativa WebP en cliente
├── services/            # Capa de negocio (Separación Repository / Service)
│   ├── *.repository.ts  # Acceso directo a datos e invocación de RPCs
│   └── *.service.ts     # Validaciones de dominio, transacciones lógicas y saneamiento
├── utils/               # Formateadores puros de dominio (moneda ARS, slugify, bytes, links de WhatsApp)
├── types/               # Tipos TypeScript y definiciones del esquema de base de datos
├── tickets/             # Especificaciones funcionales y criterios de aceptación
└── tests/               # Pruebas automatizadas de arquitectura y dominio
```

---

## ✨ Módulos y Funcionalidades Implementadas

### 1. Autenticación de Administrador Único y Protección de Rutas
- Interceptación y validación de sesiones en Edge Middleware (`proxy.ts` / `middleware.ts`) con `supabase.auth.getUser()`, evitando consultas N+1 y protegiendo todas las rutas bajo `/admin/*`.
- Redirección inteligente de retorno (`?redirect=...`) con saneamiento anti-open-redirect.
- Barra de navegación administrativa y layouts consistentes con diseño minimalista.

### 2. Monitor de Cuotas Free Tier y KPIs en Tiempo Real
- Monitor en el panel administrativo con alertas estilo semáforo (verde `< 70%`, ámbar `70% - 90%`, rojo `> 90%`) para vigilar:
  - Almacenamiento en Supabase Storage (límite 1 GB).
  - Tamaño de Base de Datos PostgreSQL (límite 500 MB).
  - Usuarios Activos Mensuales (MAU).
- Valuación total del inventario en vivo (`stock_quantity * precio unitario`).
- Alertas de stock crítico e inventario bajo ordenadas por prioridad de reposición.
- Fallback tolerante a fallos si el RPC de base de datos no está disponible.

### 3. Compresión WebP en Cliente y Limpieza de Storage
- Reducción adaptativa de imágenes en el cliente antes de la subida (`maxWidth: 1200`, calidad iterativa `0.80 -> 0.72 -> 0.65` para asegurar `< 150 KB`).
- Almacenamiento en bucket inmutable `catalog-media` con cabeceras `cacheControl: 31536000` (1 año de caché en CDN).
- Limpieza física y rollback transaccional automático de archivos huérfanos si una mutación falla o se reemplazan/eliminan imágenes.

### 4. CRUD Jerárquico de Categorías y Subcategorías
- Estructura anidada con prevención estricta de ciclos y auto-paternidad (`parent_id === id`).
- Generación automática de slugs normalizados a partir del nombre.
- Conteo de productos asociados y manejo seguro de eliminación de archivos multimedia en Storage.

### 5. Catálogo de Productos, Variantes Dinámicas y Galería
- Búsqueda en tiempo real por nombre/SKU, filtrado por categorías y estado (`draft`, `active`, `archived`).
- Modificación rápida inline de precios y toggle de productos destacados (`is_featured`).
- **Actualizador Masivo de Precios**: herramienta para aumentar o disminuir precios por porcentaje en lote, con opción de redondeo y preservación del precio anterior en `compare_at_price`.
- Gestión de variantes por producto (talle, color, dimensiones, SKU, precio específico y stock).
- Galería WebP interactiva con selección de imagen principal y ordenamiento.
- Creación rápida de categoría inline dentro del modal de producto sin perder el progreso.

### 6. Módulo de Auditoría y Movimientos de Stock
- Registro de movimientos de stock clasificados: Entrada (`IN`), Salida (`OUT`) y Ajuste (`ADJUSTMENT`).
- Ejecución atómica mediante RPC PostgreSQL `register_stock_movement` con fallback transaccional.
- Previsualización en vivo del stock resultante y guard contra stock negativo (`stock_quantity < 0`).
- Historial cronológico inmutable con filtros por tipo de movimiento, búsqueda por SKU/nombre y cálculo de balances.

### 7. Gestor de Portada y Home Pública 100% Dinámica
- Panel administrativo `/admin/portada` para gestionar banners promocionales con títulos, subtítulos, texto de botón CTA y enlaces internos/externos.
- Subida de imágenes de portada optimizadas a `catalog-media/banners` con limpieza automática de archivos anteriores.
- Activación/desactivación instantánea (`is_active`) y control de visualización (`display_order`).
- Home pública (`/`) dinámica: vitrina de banners activos, categorías principales, recién llegados y productos destacados.

---

## 🛠️ Instalación y Configuración Local

### Prerrequisitos
- Node.js 20+ o superior
- Cuenta y proyecto en [Supabase](https://supabase.com/)

### 1. Clonar el repositorio
```bash
git clone https://github.com/juampimedina06/elpequehongkong.git
cd elpequehongkong
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz copiando el archivo de ejemplo:

```bash
cp .env.example .env
```

Define los valores correspondientes:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-anon-o-publishable
SUPABASE_SECRET_KEY=tu-service-role-secret-key
NEXT_PUBLIC_WHATSAPP_NUMBER=5491100000000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configurar la Base de Datos
Ejecuta la migración inicial de Supabase ubicada en `supabase/migrations/` en el SQL Editor de tu panel de Supabase para crear las tablas, índices `pg_trgm`, políticas RLS, funciones RPC y el bucket de Storage `catalog-media`.

---

## 🧪 Pruebas y Calidad de Código

El proyecto cuenta con una suite completa de pruebas unitarias y de integración que validan los servicios, seguridad y dominio:

```bash
# Ejecutar suite de tests (64 tests unitarios y de integración)
npm test

# Verificación de tipos TypeScript estricta
npx tsc --noEmit

# Compilación para producción (Next.js App Router)
npm run build

# Iniciar servidor de desarrollo
npm run dev
```

---

## 🗺️ Roadmap del Proyecto

- [x] **TICKET-01**: Base arquitectónica, clientes de Supabase y esquema SQL.
- [x] **TICKET-02**: Autenticación de Administrador y rutas protegidas.
- [x] **TICKET-03**: Compresión adaptativa WebP y limpieza de Storage.
- [x] **TICKET-04**: Monitor de recursos Free Tier y dashboard de KPIs.
- [x] **TICKET-05**: CRUD de categorías y subcategorías.
- [x] **TICKET-06**: CRUD de productos, variantes y galería WebP.
- [x] **TICKET-07**: Módulo de auditoría y movimientos de stock.
- [x] **TICKET-08**: Portada dinámica y gestión de banners promocionales.
- [x] **TICKET-09**: Catálogo público con filtros URL, badges dinámicos y ficha de producto (SEO).
