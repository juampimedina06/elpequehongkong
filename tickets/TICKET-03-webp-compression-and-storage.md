# TICKET-03: Utilidad de Compresión de Imágenes WebP y Limpieza de Storage

## 1. Contexto y Objetivo
Cuidar estrictamente el límite gratuito de 1 GB de almacenamiento y 5 GB de Egress de Supabase Storage en el bucket `catalog-media`. Toda imagen seleccionada en el navegador debe convertirse a `.webp` (máximo 1200px de ancho, calidad inicial `0.80`, peso objetivo `< 150 KB`) antes de subirse, y cada archivo reemplazado o eliminado debe borrarse físicamente de Storage.

**Mejora de Rendimiento y Recursos:**
- Compresión adaptativa en cliente: si a calidad `0.80` el blob supera los `150 KB`, realiza una segunda pasada bajando gradualmente la calidad (`0.72`, `0.65`) hasta cumplir el objetivo sin degradación visual perceptible.
- `cacheControl: '31536000'` (1 año) en las subidas a `catalog-media` ya que los paths incluyen timestamp + UUID único, maximizando el hit-ratio del CDN y ahorrando Egress.

## 2. Archivos a Crear / Modificar
- `lib/image-compression.ts` (y re-export en `utils/compressImage.ts`)
- `services/storage.service.ts`
- `actions/storage/storage.actions.ts`
- `tests/storage-and-compression.test.ts`

## 3. Requisitos Técnicos Exactos
1. **Compresión Cliente (`lib/image-compression.ts`)**:
   - Función `compressImageToWebP(file: File, options?: { maxWidth?: number; quality?: number; maxSizeKB?: number }): Promise<File>`.
   - Valores por defecto: `maxWidth = 1200`, `quality = 0.80`, `maxSizeKB = 150`.
   - Convierte JPG/PNG/WebP a `.webp` preservando relación de aspecto.
2. **Servicio y Server Action de Limpieza (`catalog-media`)**:
   - Constante `CATALOG_MEDIA_BUCKET = 'catalog-media'`.
   - Funciones para subir archivos por carpeta (`products`, `categories`, `banners`) devolviendo `{ url, storage_path, size_bytes }`.
   - Server Action `deleteCatalogMediaFiles(storagePaths: string | string[])` que elimina de forma segura uno o múltiples archivos físicos en `catalog-media` usando `storage_path`.

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` verificando generación de paths sanitizados, subida WebP y borrado de `storage_path` en `catalog-media`.
- `npm run build` exitoso.
