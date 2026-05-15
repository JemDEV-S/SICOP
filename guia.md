# Sistema de Reporte de Avance de Ejecución Presupuestal
## Municipalidad Distrital de San Jerónimo – Cusco

**Guía de Implementación Completa · v1.0**

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Stack tecnológico definitivo](#3-stack-tecnológico-definitivo)
4. [Modelo de datos (MySQL)](#4-modelo-de-datos-mysql)
5. [Diseño visual y branding](#5-diseño-visual-y-branding)
6. [Ingesta del Excel (la pieza más crítica)](#6-ingesta-del-excel-la-pieza-más-crítica)
7. [API – Next.js Route Handlers](#7-api--nextjs-route-handlers)
8. [Frontend: páginas y componentes](#8-frontend-páginas-y-componentes)
9. [Sistema de filtros](#9-sistema-de-filtros)
10. [KPIs y fórmulas](#10-kpis-y-fórmulas)
11. [Visualizaciones (charts)](#11-visualizaciones-charts)
12. [Exportación PDF y Excel](#12-exportación-pdf-y-excel)
13. [Autenticación y autorización](#13-autenticación-y-autorización)
14. [Responsive y experiencia móvil](#14-responsive-y-experiencia-móvil)
15. [Despliegue y operación](#15-despliegue-y-operación)
16. [Estructura de carpetas](#16-estructura-de-carpetas)
17. [Plan de implementación por fases](#17-plan-de-implementación-por-fases)
18. [Pruebas y QA](#18-pruebas-y-qa)
19. [Mantenimiento y roadmap futuro](#19-mantenimiento-y-roadmap-futuro)
20. [Anexo A · Glosario presupuestal](#20-anexo-a--glosario-presupuestal)
21. [Anexo B · Diccionario de columnas de SheetGasto](#21-anexo-b--diccionario-de-columnas-de-sheetgasto)

---

## 1. Resumen ejecutivo

### 1.1 Propósito

Construir un portal **público y transparente** que muestre el avance de la ejecución presupuestal de la Municipalidad Distrital de San Jerónimo, alimentado por un Excel oficial (hoja `SheetGasto`) que un administrador sube periódicamente. Cualquier ciudadano podrá consultar, filtrar, comparar y descargar la información sin necesidad de cuenta. El sistema versiona cada carga, lo que permite ver la evolución del PIM y del devengado a lo largo del ejercicio.

### 1.2 Alcance del MVP

- Vista pública con KPIs, tabla dinámica equivalente a la hoja `PRINCIPAL`, ocho visualizaciones y filtros jerárquicos.
- Panel admin con login multiusuario, carga de Excel versionada y bitácora de cargas.
- Exportación a Excel y PDF de cualquier vista filtrada.
- Optimizado primero para móvil, con paridad de funcionalidad en escritorio.
- Branding institucional (paleta `#3484A5`, `#2CA792`, `#F0C84F`).

### 1.3 Cifras de referencia del ejercicio 2026 (al 13/05/2026)

| Indicador | Monto S/. | % vs PIM |
|---|---:|---:|
| PIA | 65 116 324 | 93.7 % |
| **PIM** | **69 500 489** | 100.0 % |
| Certificación | 31 895 699 | 45.9 % |
| Compromiso anual | 24 128 790 | 34.7 % |
| **Devengado** | **18 350 858** | **26.4 %** |
| Girado | 17 133 948 | 24.7 % |

Volumen de datos: 1 890 filas crudas por carga × ~12 cargas/año = ~22 700 filas desnormalizadas por mes × año fiscal. MySQL maneja esto sin esfuerzo.

### 1.4 Esfuerzo estimado

8 semanas con un desarrollador full‑stack a tiempo completo. Detalle por fase en la sección 17.

---

## 2. Arquitectura del sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                          NAVEGADOR                                │
│  ┌──────────────────┐                ┌──────────────────────┐    │
│  │  Vista pública   │                │  Panel admin         │    │
│  │  (responsive)    │                │  (autenticado)       │    │
│  └────────┬─────────┘                └──────────┬───────────┘    │
└───────────┼──────────────────────────────────────┼────────────────┘
            │ HTTPS                                │ HTTPS + Cookie
            ▼                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 14 (App Router)                        │
│                                                                   │
│  ┌──────────────────┐   ┌─────────────────┐  ┌────────────────┐ │
│  │ Server Components│   │ Route Handlers  │  │  NextAuth.js   │ │
│  │ (SSR del dash)   │   │ (REST API)      │  │  (sesión)      │ │
│  └────────┬─────────┘   └────────┬────────┘  └──────┬─────────┘ │
│           │                      │                   │           │
│           └──────────┬───────────┴───────────────────┘           │
│                      ▼                                            │
│            ┌─────────────────────┐                                │
│            │   Prisma ORM        │                                │
│            └──────────┬──────────┘                                │
└───────────────────────┼───────────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                        MySQL 8.0+                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Dimensiones  │  │   Hechos     │  │ Cargas (versionado)  │   │
│  │ (catálogos)  │  │  ejecucion   │  │ + usuarios admin     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 Flujo de datos (carga)

1. Admin se autentica en `/admin`.
2. Sube `.xlsx` en `/admin/cargas/nueva`.
3. Backend valida formato, hashea el archivo (detecta duplicados), inserta `cargas` con estado `PROCESANDO`.
4. Worker (mismo proceso por simplicidad) parsea SheetGasto, **desnormaliza los 12 meses** de cada fila en 12 registros, hace upsert de dimensiones nuevas (metas, unidades orgánicas, programas, etc.) y bulk‑insert en `hechos_ejecucion` etiquetando con `carga_id`.
5. Marca la carga como `EXITOSA` y `es_vigente = true`, y pone en `false` la anterior del mismo año.
6. La vista pública sirve por defecto la carga vigente; permite seleccionar cargas anteriores para comparación.

### 2.2 Flujo de datos (consulta)

1. Cliente solicita `/` con filtros en la URL (`?org=12,18&meta=43&rubro=18`).
2. Server Component parsea filtros (Zod) y consulta a Prisma con joins a las dimensiones.
3. Genera HTML con KPIs prerrenderizados (mejor LCP móvil).
4. Componentes client (`use client`) hidratan los charts con TanStack Query usando los mismos filtros.
5. Cache HTTP de 5 min por combinación de filtros (`Cache-Control: s-maxage=300, stale-while-revalidate=600`).

---

## 3. Stack tecnológico definitivo

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Next.js 14** (App Router) + TypeScript | SSR para SEO/velocidad móvil, API y front en un solo deploy |
| BD | **MySQL 8.0+** | Solicitado. Soporta CTE recursivos para el árbol orgánico |
| ORM | **Prisma 5** | Tipado fuerte, migraciones, perfecto con Next.js |
| Auth | **Auth.js v5** (ex NextAuth) + Credentials | Multi‑admin con username/password, cookies httpOnly |
| Estilos | **Tailwind CSS** + **shadcn/ui** | Mobile‑first, accesible, theming via CSS vars |
| Charts | **Recharts** + **D3** (treemap, heatmap) | React‑first, responsivo |
| Tabla | **TanStack Table v8** | Tablas dinámicas con virtualización y exportación |
| Estado servidor | **TanStack Query** | Cache cliente, refetch al cambiar filtros |
| Validación | **Zod** | Schemas compartidos para API y formularios |
| Excel parse | **xlsx (SheetJS)** | Estándar de facto en Node |
| Excel export | **exceljs** | Mejor para escribir (estilos, formato moneda) |
| PDF export | **@react-pdf/renderer** | Templates declarativos en React |
| Hash pwd | **bcryptjs** | Estándar |
| File hash | **crypto** (Node built‑in) | SHA‑256 para detectar cargas duplicadas |
| Logs | **Pino** | JSON estructurado, rápido |
| Deploy | **VPS Linux** + PM2 + Nginx, o **Vercel** + MySQL externo (PlanetScale / Railway / Hostinger) | Costo ~US$ 10–25/mes |

---

## 4. Modelo de datos (MySQL)

### 4.1 Diagrama relacional

```
usuarios ──┐
           ▼
        cargas ───────────┐
                          ▼
                  hechos_ejecucion
                  │   │   │   │
                  ▼   ▼   ▼   ▼
              meta rub clasif (ano,mes)
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
    unidad   prog_pp   funcion
    organica
       │
       └── (autoref para árbol)
```

### 4.2 DDL completo

```sql
-- ============================================================
-- DIMENSIONES (catálogos)
-- ============================================================

CREATE TABLE dim_rubro (
  id              SMALLINT       NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(8)     NOT NULL,           -- '00', '07', '08'...
  nombre          VARCHAR(200)   NOT NULL,
  fuente_codigo   VARCHAR(4)     NOT NULL,           -- '1','2','3','4','5'
  fuente_nombre   VARCHAR(100)   NOT NULL,
  nombre_corto    VARCHAR(20)    NOT NULL,           -- 'RO', 'RDR', 'CSC'
  descripcion     TEXT           NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rubro_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dim_clasificador_gasto (
  id                    INT          NOT NULL AUTO_INCREMENT,
  codigo                VARCHAR(20)  NOT NULL,        -- '2.3.1.99.1.99'
  codigo_padre          VARCHAR(20)  NULL,
  nivel                 TINYINT      NOT NULL,        -- 1..5
  descripcion           VARCHAR(300) NOT NULL,
  descripcion_detallada TEXT         NULL,
  restringido           BOOLEAN      NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  UNIQUE KEY uk_clasif_codigo (codigo),
  KEY idx_clasif_padre (codigo_padre),
  KEY idx_clasif_nivel (nivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dim_unidad_organica (
  id          INT           NOT NULL AUTO_INCREMENT,
  nivel       TINYINT       NOT NULL,        -- 1=Órgano, 2=Unidad, 3=SubUnidad, 4=NombreCorto
  padre_id    INT           NULL,
  nombre      VARCHAR(200)  NOT NULL,
  nombre_corto VARCHAR(50)  NULL,
  ruta        VARCHAR(800)  NOT NULL,        -- materialized path: '1/4/12'
  ruta_nombres VARCHAR(1000) NOT NULL,       -- 'GERENCIA INFRAESTRUCTURA > SUB EJECUCION INV...'
  PRIMARY KEY (id),
  KEY idx_uo_padre (padre_id),
  KEY idx_uo_nivel (nivel),
  KEY idx_uo_ruta (ruta(255)),
  CONSTRAINT fk_uo_padre FOREIGN KEY (padre_id) REFERENCES dim_unidad_organica(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dim_programa_pptal (
  id      SMALLINT     NOT NULL AUTO_INCREMENT,
  codigo  VARCHAR(8)   NOT NULL,
  nombre  VARCHAR(200) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pp_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dim_funcion (
  id                  SMALLINT     NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(8)   NOT NULL,
  nombre              VARCHAR(150) NOT NULL,
  division_codigo     VARCHAR(8)   NULL,
  division_nombre     VARCHAR(150) NULL,
  grupo_codigo        VARCHAR(8)   NULL,
  grupo_nombre        VARCHAR(150) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_func (codigo, division_codigo, grupo_codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE dim_meta (
  id                       INT           NOT NULL AUTO_INCREMENT,
  ano_eje                  SMALLINT      NOT NULL,
  meta                     INT           NOT NULL,
  sec_func                 INT           NOT NULL,
  finalidad_codigo         VARCHAR(10)   NOT NULL,
  finalidad_nombre         TEXT          NOT NULL,
  tipo_prod_proy           ENUM('PRODUCTO','PROYECTO') NOT NULL,
  producto_proyecto_codigo VARCHAR(10)   NOT NULL,
  producto_proyecto_nombre TEXT          NOT NULL,
  cui                      VARCHAR(10)   NULL,         -- solo proyectos
  programa_pptal_id        SMALLINT      NULL,
  funcion_id               SMALLINT      NULL,
  unidad_organica_id       INT           NOT NULL,     -- al nivel hoja
  nombre_corto             VARCHAR(150)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_meta (ano_eje, meta, sec_func),
  KEY idx_meta_cui (cui),
  KEY idx_meta_uo (unidad_organica_id),
  KEY idx_meta_pp (programa_pptal_id),
  CONSTRAINT fk_meta_pp  FOREIGN KEY (programa_pptal_id) REFERENCES dim_programa_pptal(id),
  CONSTRAINT fk_meta_fn  FOREIGN KEY (funcion_id)        REFERENCES dim_funcion(id),
  CONSTRAINT fk_meta_uo  FOREIGN KEY (unidad_organica_id) REFERENCES dim_unidad_organica(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- USUARIOS Y CARGAS (versionado)
-- ============================================================

CREATE TABLE usuarios (
  id              INT          NOT NULL AUTO_INCREMENT,
  username        VARCHAR(50)  NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  rol             ENUM('SUPER_ADMIN','ADMIN') NOT NULL DEFAULT 'ADMIN',
  activo          BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_acceso   DATETIME     NULL,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_username (username),
  UNIQUE KEY uk_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cargas (
  id               INT           NOT NULL AUTO_INCREMENT,
  ano_eje          SMALLINT      NOT NULL,
  fecha_carga      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_corte      DATE          NULL,                   -- "datos al día X"
  usuario_id       INT           NOT NULL,
  archivo_nombre   VARCHAR(255)  NOT NULL,
  archivo_hash     CHAR(64)      NOT NULL,               -- SHA-256 hex
  archivo_size     INT           NOT NULL,
  filas_procesadas INT           NOT NULL,
  pim_total        DECIMAL(15,2) NOT NULL,
  devengado_total  DECIMAL(15,2) NOT NULL,
  estado           ENUM('PROCESANDO','EXITOSA','CON_ERRORES','FALLIDA') NOT NULL DEFAULT 'PROCESANDO',
  es_vigente       BOOLEAN       NOT NULL DEFAULT FALSE,
  observaciones    TEXT          NULL,
  PRIMARY KEY (id),
  KEY idx_carga_vigente (ano_eje, es_vigente),
  KEY idx_carga_user (usuario_id),
  CONSTRAINT fk_carga_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- HECHOS – la tabla central
-- granularidad: año × mes × meta × rubro × clasificador × carga
-- ============================================================

CREATE TABLE hechos_ejecucion (
  id                   BIGINT        NOT NULL AUTO_INCREMENT,
  carga_id             INT           NOT NULL,
  ano_eje              SMALLINT      NOT NULL,
  mes                  TINYINT       NOT NULL,        -- 0 = totales anuales; 1..12 = mes
  meta_id              INT           NOT NULL,
  rubro_id             SMALLINT      NOT NULL,
  clasificador_id      INT           NOT NULL,
  categoria_gasto      ENUM('CORRIENTE','CAPITAL','DEUDA') NOT NULL,
  -- montos anuales (válidos cuando mes = 0)
  mto_pia              DECIMAL(15,2) NOT NULL DEFAULT 0,
  mto_modificaciones   DECIMAL(15,2) NOT NULL DEFAULT 0,
  mto_pim              DECIMAL(15,2) NOT NULL DEFAULT 0,
  mto_certificado      DECIMAL(15,2) NOT NULL DEFAULT 0,
  mto_compromiso_anual DECIMAL(15,2) NOT NULL DEFAULT 0,
  -- montos mensuales (válidos cuando mes 1..12)
  mto_compromiso_mes   DECIMAL(15,2) NOT NULL DEFAULT 0,
  mto_devengado        DECIMAL(15,2) NOT NULL DEFAULT 0,
  mto_girado           DECIMAL(15,2) NOT NULL DEFAULT 0,
  mto_pagado           DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_hec_carga (carga_id),
  KEY idx_hec_consulta (ano_eje, mes, meta_id, rubro_id, clasificador_id, carga_id),
  KEY idx_hec_meta (meta_id),
  KEY idx_hec_rubro (rubro_id),
  KEY idx_hec_clasif (clasificador_id),
  KEY idx_hec_categ (categoria_gasto),
  CONSTRAINT fk_hec_carga  FOREIGN KEY (carga_id)        REFERENCES cargas(id) ON DELETE CASCADE,
  CONSTRAINT fk_hec_meta   FOREIGN KEY (meta_id)         REFERENCES dim_meta(id),
  CONSTRAINT fk_hec_rubro  FOREIGN KEY (rubro_id)        REFERENCES dim_rubro(id),
  CONSTRAINT fk_hec_clasif FOREIGN KEY (clasificador_id) REFERENCES dim_clasificador_gasto(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  PARTITION BY RANGE (ano_eje) (
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p2027 VALUES LESS THAN (2028),
    PARTITION pmax  VALUES LESS THAN MAXVALUE
  );

-- ============================================================
-- VISTAS – conveniencia para consultas
-- ============================================================

-- "Última carga vigente por año" (atajo)
CREATE VIEW v_carga_vigente AS
SELECT * FROM cargas WHERE es_vigente = TRUE;

-- Hechos solo de la carga vigente, listos para el dashboard
CREATE VIEW v_hechos_vigente AS
SELECT h.*
FROM hechos_ejecucion h
JOIN v_carga_vigente cv ON cv.id = h.carga_id;
```

### 4.3 Notas de diseño del modelo

- **Granularidad mensual desde el origen.** Cada fila de SheetGasto genera **13 registros**: uno con `mes = 0` que guarda los totales anuales (PIA, PIM, certificado, compromiso anual) y 12 con `mes = 1..12` que guardan los desagregados mensuales. Esto elimina las 48 columnas mensuales que tiene Excel y vuelve trivial sumar por rango de meses.
- **Path materializado en `dim_unidad_organica`.** El campo `ruta` (ej. `'3/14/47'`) permite resolver "todos los descendientes de X" con `WHERE ruta LIKE '3/14/%'`, sin CTE recursivo. Es la clave para el filtro jerárquico.
- **`es_vigente` por año.** Solo una carga puede estar vigente por año fiscal. El admin puede "revertir" a una carga anterior con un click → marca esa como vigente y la actual como no vigente.
- **Particionamiento por año.** Mejora drásticamente las consultas cuando el sistema acumule 5+ años.
- **`carga_id` en la PK lógica.** Permite mantener histórico sin tocar las consultas: la vista `v_hechos_vigente` siempre apunta a "el ahora".

---

## 5. Diseño visual y branding

### 5.1 Paleta institucional

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | **#3484A5** | Headers, links, énfasis principal, gráficos primarios |
| `--color-secondary` | **#2CA792** | Buen avance (≥75 %), barras de éxito, accent |
| `--color-accent` | **#F0C84F** | Llamadas a la acción, advertencias suaves, highlights |
| `--color-success` | #2CA792 | Variante de `--color-secondary` |
| `--color-warning` | #E89A3C | Avance medio (40–75 %) |
| `--color-danger` | #C44536 | Avance crítico (<25 %) |
| `--color-bg` | #FAFAF7 | Fondo página (móvil + escritorio) |
| `--color-surface` | #FFFFFF | Cards, modales |
| `--color-surface-alt` | #F2EFE8 | Filas pares en tabla, sidebar |
| `--color-text` | #1A2A35 | Texto principal |
| `--color-text-soft` | #5A6B78 | Texto secundario, labels |
| `--color-border` | #E5E1D6 | Bordes suaves |
| `--color-primary-50` | #EAF3F7 | Fondo hover de items primarios |
| `--color-secondary-50` | #E4F4F0 | Fondo de badges "exitoso" |

### 5.2 Tipografía

- **Display / títulos:** [`Fraunces`](https://fonts.google.com/specimen/Fraunces) — serif variable con carácter institucional pero contemporáneo.
- **Cuerpo / UI:** [`IBM Plex Sans`](https://fonts.google.com/specimen/IBM+Plex+Sans) — sans‑serif técnico, excelente legibilidad en cifras.
- **Mono / cifras tabulares:** [`IBM Plex Mono`](https://fonts.google.com/specimen/IBM+Plex+Mono) — para columnas de S/. alineadas.

Tamaños base mobile→desktop:

| Rol | Mobile | Desktop |
|---|---|---|
| H1 dashboard | 24 px | 36 px |
| H2 sección | 18 px | 24 px |
| KPI número | 28 px | 40 px |
| Body | 14 px | 15 px |
| Caption/label | 12 px | 13 px |

### 5.3 Tokens en Tailwind config

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#3484A5', 50: '#EAF3F7', 100: '#D4E7EF',
                   500: '#3484A5', 700: '#21607A', 900: '#11384A' },
        secondary: { DEFAULT: '#2CA792', 50: '#E4F4F0',
                     500: '#2CA792', 700: '#1E7A6A' },
        accent: { DEFAULT: '#F0C84F', 50: '#FDF6E0',
                  500: '#F0C84F', 700: '#B8932B' },
        danger: '#C44536',
        warn: '#E89A3C',
        bg: '#FAFAF7',
        surface: { DEFAULT: '#FFFFFF', alt: '#F2EFE8' },
        text: { DEFAULT: '#1A2A35', soft: '#5A6B78' },
        border: '#E5E1D6',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: { card: '12px', pill: '999px' },
      boxShadow: {
        card: '0 1px 3px rgba(26,42,53,0.06), 0 1px 2px rgba(26,42,53,0.04)',
        floating: '0 8px 24px rgba(26,42,53,0.10)',
      },
    },
  },
}
export default config
```

### 5.4 Reglas estéticas

- **Mobile‑first.** Todo se diseña primero a 375 px. El desktop es expansión, no la versión "real".
- **Cifras tabulares.** Toda columna de S/. usa `font-variant-numeric: tabular-nums` para que las unidades, millares y decimales alineen perfectamente.
- **Semáforos sutiles.** El color del % avance vive en un círculo o pill discreto, no en la fila completa. No invadir.
- **Header institucional.** Banda superior con `#3484A5`, logo municipal a la izquierda, y debajo en `#FAFAF7` el título "Avance de Ejecución Presupuestal 2026".
- **Accent amarillo dosificado.** El `#F0C84F` es el toque cálido peruano; úsalo para el KPI estrella (% Devengado) y para los CTA. Nunca en bloques grandes.

---

## 6. Ingesta del Excel (la pieza más crítica)

### 6.1 Validaciones obligatorias

Al recibir el archivo, el sistema verifica **antes** de tocar la BD:

1. Es un `.xlsx` válido (firma ZIP).
2. Existe la hoja exacta `SheetGasto` (case‑sensitive).
3. La fila 1 contiene **todas** las columnas esperadas. Lista canónica:

```
ano_eje, departamento, provincia, pliego, sec_ejec, programa_pptal,
tipo_prod_proy, producto_proyecto, tipo_act_obra_ac, activ_obra_accinv,
funcion, division_fn, grupo_fn, meta, finalidad, unidad_medida,
cant_meta_anual, cant_meta_sem, avan_fisico_anual, avan_fisico_sem,
sec_func, departamento_meta, provincia_meta, distrito_meta,
fuente_financ, rubro, categoria_gasto, tipo_transaccion,
generica, subgenerica, subgenerica_det, especifica, especifica_det,
mto_pia, mto_modificaciones, mto_pim, mto_certificado, mto_compro_anual,
mto_at_comp_01..mto_at_comp_12,
mto_devenga_01..mto_devenga_12,
mto_girado_01..mto_girado_12,
mto_pagado_01..mto_pagado_12,
filtro_genérica, filtro_específica, filtro_certificación,
filtro_compromisoanual, filtro_compromisomensual, filtro_devengado,
filtro_girado, filtro_pagado, filtro_saldocert, filtro_restringido,
filtro_rubro, órgano, unidad orgánica, sub unidad orgánica,
nombre corto, CUI, f
```

Faltó alguna → la carga se rechaza con detalle y código HTTP 422.

4. Hash SHA‑256 del archivo: si coincide con una carga previa, advertir y pedir confirmación explícita ("este archivo es idéntico a la carga #14 del 12/05").
5. El año (`ano_eje`) es uniforme en todas las filas; si hay mezcla, error.
6. Existe al menos 1 fila no vacía.

### 6.2 Pseudocódigo del worker

```typescript
// lib/ingestion/procesarCarga.ts
import { read, utils } from 'xlsx'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db'

export async function procesarCarga(buffer: Buffer, archivo: { nombre: string }, usuarioId: number) {
  const hash = createHash('sha256').update(buffer).digest('hex')
  const wb = read(buffer, { type: 'buffer' })

  if (!wb.SheetNames.includes('SheetGasto'))
    throw new Error('La hoja "SheetGasto" no existe en el archivo.')

  const rows = utils.sheet_to_json<RawRow>(wb.Sheets['SheetGasto'], { defval: 0 })
  validarColumnas(rows[0])
  const ano = Number(rows[0].ano_eje)
  if (rows.some(r => Number(r.ano_eje) !== ano))
    throw new Error('Hay filas con distinto año de ejecución.')

  // 1. Crear carga en estado PROCESANDO
  const carga = await prisma.cargas.create({ data: {
    ano_eje: ano, usuario_id: usuarioId, archivo_nombre: archivo.nombre,
    archivo_hash: hash, archivo_size: buffer.length,
    filas_procesadas: 0, pim_total: 0, devengado_total: 0, estado: 'PROCESANDO',
  }})

  try {
    await prisma.$transaction(async tx => {
      // 2. Upsert dimensiones nuevas (programas, funciones, metas, UO, clasif)
      const mapaPP        = await upsertProgramas(tx, rows)
      const mapaFuncion   = await upsertFunciones(tx, rows)
      const mapaUO        = await upsertUnidadesOrganicas(tx, rows)
      const mapaClasif    = await upsertClasificadores(tx, rows)
      const mapaMetas     = await upsertMetas(tx, rows, ano, mapaPP, mapaFuncion, mapaUO)
      const mapaRubros    = await prisma.dim_rubro.findMany().then(toMap('codigo','id'))

      // 3. Desnormalizar y bulk insert
      const hechos: HechoInsert[] = []
      for (const r of rows) {
        const ctx = { carga_id: carga.id, ano_eje: ano,
                      meta_id: mapaMetas.get(claveMeta(r))!,
                      rubro_id: mapaRubros.get(codigoRubro(r))!,
                      clasificador_id: mapaClasif.get(r.f)!,
                      categoria_gasto: mapCategoria(r.categoria_gasto) }
        // Fila anual (mes = 0)
        hechos.push({ ...ctx, mes: 0,
          mto_pia: r.mto_pia, mto_modificaciones: r.mto_modificaciones,
          mto_pim: r.mto_pim, mto_certificado: r.filtro_certificación,
          mto_compromiso_anual: r.filtro_compromisoanual,
          mto_compromiso_mes: 0, mto_devengado: 0, mto_girado: 0, mto_pagado: 0 })
        // 12 filas mensuales
        for (let m = 1; m <= 12; m++) {
          const mm = String(m).padStart(2, '0')
          hechos.push({ ...ctx, mes: m,
            mto_pia: 0, mto_modificaciones: 0, mto_pim: 0,
            mto_certificado: 0, mto_compromiso_anual: 0,
            mto_compromiso_mes: r[`mto_at_comp_${mm}`] ?? 0,
            mto_devengado: r[`mto_devenga_${mm}`] ?? 0,
            mto_girado: r[`mto_girado_${mm}`] ?? 0,
            mto_pagado: r[`mto_pagado_${mm}`] ?? 0 })
        }
      }
      // Insert por chunks de 1000
      for (let i = 0; i < hechos.length; i += 1000)
        await tx.hechos_ejecucion.createMany({ data: hechos.slice(i, i + 1000) })

      // 4. Marcar vigencia: esta carga sí, las otras del año, no.
      await tx.cargas.updateMany({
        where: { ano_eje: ano, id: { not: carga.id } },
        data: { es_vigente: false },
      })
      await tx.cargas.update({
        where: { id: carga.id },
        data: { estado: 'EXITOSA', es_vigente: true,
                filas_procesadas: rows.length,
                pim_total: sum(rows, 'mto_pim'),
                devengado_total: sum(rows, 'filtro_devengado') },
      })
    }, { timeout: 120_000 })  // 2 min para cargas grandes
  } catch (err) {
    await prisma.cargas.update({ where: { id: carga.id },
      data: { estado: 'FALLIDA', observaciones: String(err) }})
    throw err
  }

  return carga
}
```

### 6.3 Reglas de upsert por dimensión

- **Rubros y clasificadores.** Carga inicial (seed) con los catálogos oficiales. La carga del Excel **no** los modifica; solo verifica que cada `r.f` exista. Si aparece un código nuevo, se inserta automáticamente con `restringido = false` y se loguea para revisión.
- **Programas presupuestales y funciones.** Upsert por código.
- **Unidades orgánicas.** Se reconstruyen los 4 niveles (Órgano → Unidad → SubUnidad → Nombre corto) a partir de los 4 campos del Excel. Cada nodo se inserta si no existe, con su `ruta` materializada. **Se normalizan espacios y mayúsculas** antes de comparar (las hojas tienen entradas como `'SUBGERENCIA DE GESTIÓN DE RESIDUOS SOLIDOS '` con espacio final → trim).
- **Metas.** Clave (`ano_eje`, `meta`, `sec_func`). Si una meta cambia de unidad orgánica entre cargas, se actualiza con la última.

### 6.4 Casos borde detectados en el archivo actual

- Hay metas con `meta` repetido pero distinto `sec_func` (sec_func es el verdadero unique). La clave única la lleva `(meta, sec_func)`.
- Hay 14 filas vacías al final de SF (numeradas 162‑197). El parser ignora filas con `meta` vacío.
- Algunos `nombre corto` están en blanco (ej. fila 82). Permitido.
- Algunos códigos CG aparecen en SheetGasto pero no en CG (clasificadores nuevos del MEF). Inserción automática.

---

## 7. API – Next.js Route Handlers

### 7.1 Convenciones generales

- Todos los endpoints aceptan los mismos query params de filtros (definidos abajo).
- Respuestas en JSON con `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` para endpoints públicos.
- Endpoints admin requieren sesión válida (middleware en `middleware.ts`).
- Validación de input con Zod, errores devueltos como `{ error: { code, message, details } }` con códigos HTTP correctos.

### 7.2 Schema de filtros (Zod)

```typescript
// lib/filtros.ts
import { z } from 'zod'

export const filtrosSchema = z.object({
  ano: z.coerce.number().int().min(2020).max(2099),
  carga_id: z.coerce.number().int().optional(),           // null → vigente
  mes_hasta: z.coerce.number().int().min(1).max(12).optional(),
  org: z.string().optional()        // CSV de IDs de unidad orgánica
    .transform(s => s?.split(',').map(Number)),
  meta: z.string().optional().transform(s => s?.split(',').map(Number)),
  cui: z.string().optional().transform(s => s?.split(',')),
  tipo: z.enum(['PRODUCTO','PROYECTO']).optional(),
  programa: z.string().optional().transform(s => s?.split(',').map(Number)),
  funcion: z.string().optional().transform(s => s?.split(',').map(Number)),
  categoria: z.enum(['CORRIENTE','CAPITAL','DEUDA']).optional(),
  rubro: z.string().optional().transform(s => s?.split(',').map(Number)),
  fuente: z.string().optional().transform(s => s?.split(',')),
  clasif: z.string().optional().transform(s => s?.split(',').map(Number)),
  rango_avance: z.enum(['0-25','25-50','50-75','75-100','100+']).optional(),
  incluir_restringido: z.coerce.boolean().default(false),
  q: z.string().optional(),                                // búsqueda libre
})
export type Filtros = z.infer<typeof filtrosSchema>
```

### 7.3 Inventario de endpoints

#### Públicos

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/ejecucion/kpis` | Los ~10 KPIs principales |
| GET | `/api/ejecucion/tabla` | Tabla agrupada (param `groupBy=meta\|org\|economico`) paginada |
| GET | `/api/ejecucion/series-mensuales` | 12 puntos por fase de ejecución para el gráfico de evolución |
| GET | `/api/ejecucion/distribucion-rubro` | Aggregado por rubro |
| GET | `/api/ejecucion/distribucion-generica` | Aggregado por genérica de gasto |
| GET | `/api/ejecucion/distribucion-organica` | Aggregado por nodo del árbol orgánico (param `nivel`) |
| GET | `/api/ejecucion/ranking-metas` | Top y bottom N por % avance |
| GET | `/api/ejecucion/heatmap-mes-generica` | Matriz 12 × N genéricas |
| GET | `/api/catalogos/unidades-organicas` | Árbol completo de UO (cached 1h) |
| GET | `/api/catalogos/metas` | Lista de metas del año vigente |
| GET | `/api/catalogos/rubros` | 6 rubros |
| GET | `/api/catalogos/clasificadores` | Árbol completo de CG (cached 24h) |
| GET | `/api/catalogos/programas` | Programas presupuestales |
| GET | `/api/cargas/vigente` | Metadatos de la carga vigente (fecha, total filas) |
| GET | `/api/cargas/historial` | Lista de cargas del año para selector de comparación |

#### Admin (`/api/admin/*`)

| Método | Ruta | Acción |
|---|---|---|
| POST | `/api/admin/cargas` | Subir nuevo Excel (multipart/form-data) |
| GET | `/api/admin/cargas` | Listar todas las cargas con detalle |
| POST | `/api/admin/cargas/:id/restaurar` | Marca esa carga como vigente |
| DELETE | `/api/admin/cargas/:id` | Borra carga (cascada elimina hechos) – solo SUPER_ADMIN |
| GET | `/api/admin/usuarios` | Listar usuarios |
| POST | `/api/admin/usuarios` | Crear admin – solo SUPER_ADMIN |
| PATCH | `/api/admin/usuarios/:id` | Activar/desactivar, cambiar rol |
| POST | `/api/admin/usuarios/:id/cambiar-password` | Reset contraseña |

#### Export

| Método | Ruta | Output |
|---|---|---|
| GET | `/api/export/excel` | `.xlsx` con la tabla filtrada + hoja resumen |
| GET | `/api/export/pdf` | PDF con KPIs, charts y tabla |

### 7.4 Ejemplo de implementación – endpoint de KPIs

```typescript
// app/api/ejecucion/kpis/route.ts
import { NextResponse } from 'next/server'
import { filtrosSchema } from '@/lib/filtros'
import { construirWhere } from '@/lib/queries/where'
import { prisma } from '@/lib/db'

export const revalidate = 300 // 5 min

export async function GET(req: Request) {
  const url = new URL(req.url)
  const filtros = filtrosSchema.parse(Object.fromEntries(url.searchParams))
  const where = await construirWhere(filtros, { mes: 0 })   // totales anuales

  const r = await prisma.hechos_ejecucion.aggregate({
    _sum: {
      mto_pia: true, mto_pim: true, mto_modificaciones: true,
      mto_certificado: true, mto_compromiso_anual: true,
    },
    where,
  })

  const monthly = await prisma.hechos_ejecucion.aggregate({
    _sum: { mto_devengado: true, mto_girado: true, mto_pagado: true },
    where: { ...where, mes: { gte: 1, lte: 12 } },
  })

  const pim = num(r._sum.mto_pim)
  const dev = num(monthly._sum.mto_devengado)
  const cert = num(r._sum.mto_certificado)
  const compr = num(r._sum.mto_compromiso_anual)
  const gir = num(monthly._sum.mto_girado)
  const pag = num(monthly._sum.mto_pagado)

  return NextResponse.json({
    pia: num(r._sum.mto_pia),
    pim,
    modificaciones: num(r._sum.mto_modificaciones),
    certificado: cert,
    compromiso_anual: compr,
    devengado: dev,
    girado: gir,
    pagado: pag,
    saldo_por_certificar: pim - cert,
    saldo_por_devengar: pim - dev,
    pct_certificado: pim ? cert / pim : 0,
    pct_compromiso: pim ? compr / pim : 0,
    pct_devengado: pim ? dev / pim : 0,
    pct_girado: pim ? gir / pim : 0,
    tasa_pago: dev ? pag / dev : 0,
  }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
}

const num = (v: any) => Number(v ?? 0)
```

---

## 8. Frontend: páginas y componentes

### 8.1 Mapa de rutas

```
/                          → Dashboard público (KPIs + charts + tabla)
/tabla                     → Vista tabla expandida (full-width, más filas)
/comparar                  → Vista de comparación entre cargas
/acerca                    → Metodología y glosario
/admin/login               → Login admin
/admin                     → Home admin (atajos)
/admin/cargas              → Historial de cargas
/admin/cargas/nueva        → Subir nuevo Excel
/admin/cargas/[id]         → Detalle de una carga
/admin/usuarios            → Gestión de admins (solo SUPER_ADMIN)
/admin/perfil              → Cambiar password del usuario logueado
```

### 8.2 Estructura del dashboard público (`/`)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER MUNICIPAL                                            │
│ [logo] Municipalidad Distrital de San Jerónimo              │
│ Avance de Ejecución Presupuestal · Ejercicio 2026          │
│ Datos al: 13/05/2026 · Carga #14                            │
├─────────────────────────────────────────────────────────────┤
│ [⚙ Filtros]    [chips activos: 2 unidades, Rubro 18]   [⬇] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │  PIM    │ │Devengado│ │  % Dev  │ │ Girado  │  ← KPIs    │
│ │ 69.5 M  │ │ 18.4 M  │ │ 26.4 %  │ │ 17.1 M  │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │  Cert   │ │ Compro. │ │  Saldo  │ │ Ritmo   │            │
│ │ 45.9 %  │ │ 34.7 %  │ │ x cert  │ │ proyect │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
├─────────────────────────────────────────────────────────────┤
│ [ FUNNEL EJECUCIÓN ]   [ EVOLUCIÓN MENSUAL ]                │
├─────────────────────────────────────────────────────────────┤
│ [ TREEMAP POR UO ]     [ DONUT PROD/PROY ]                  │
├─────────────────────────────────────────────────────────────┤
│ [ BARRAS RUBRO ]       [ BARRAS GENÉRICA ]                  │
├─────────────────────────────────────────────────────────────┤
│ [ RANKING METAS ]                                           │
├─────────────────────────────────────────────────────────────┤
│ [ HEATMAP MES × GENÉRICA ]                                  │
├─────────────────────────────────────────────────────────────┤
│ TABLA DINÁMICA (resumida, vínculo a /tabla full)            │
│ [Modo: Programático ▾]    [Buscar]              [Exportar▾] │
│ ─────────────────────────────────────────────────────────── │
│ ▾ Meta 1 · Acciones administrativas       69.5M  18.4M  26% │
│   ▸ 00. RO                                948K   204K   22% │
│     2.1.1.9.3.13 OTROS BONOS EXTRAORD     60K    37K    62% │
│   ▸ 09. RDR                               ...                │
│ ▸ Meta 2 ...                                                │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Componentes clave

```
components/
├── dashboard/
│   ├── KpiCard.tsx                  # tarjeta con número grande + delta + barra
│   ├── KpiGrid.tsx                  # contenedor de 8 KpiCards (responsive 2/4/8)
│   ├── EmbudoEjecucion.tsx          # funnel SVG custom o Recharts FunnelChart
│   ├── EvolucionMensual.tsx         # LineChart con 4 series (cert/compr/dev/gir)
│   ├── TreemapOrganico.tsx          # D3 Treemap por UO
│   ├── DonutProdProy.tsx            # PieChart compacto
│   ├── BarrasRubro.tsx              # BarChart horizontal apilado
│   ├── BarrasGenerica.tsx           # BarChart vertical
│   ├── RankingMetas.tsx             # lista top10/bottom10 con barras inline
│   ├── HeatmapMesGenerica.tsx       # grid 12×N coloreado por intensidad
│   └── TablaDinamica.tsx            # TanStack Table con expand y export
├── filters/
│   ├── FilterDrawer.tsx             # contenedor (sheet en móvil, sidebar en desktop)
│   ├── ArbolUnidadOrganica.tsx      # tree-select con casillas heredables
│   ├── SelectorMeta.tsx             # combobox con búsqueda
│   ├── SelectorRubro.tsx            # multi-pill
│   ├── ArbolClasificador.tsx        # tree-select 5 niveles
│   ├── RangoMes.tsx                 # slider 1-12
│   ├── SwitchRestringido.tsx
│   ├── SwitchTipo.tsx               # producto/proyecto
│   ├── BuscadorLibre.tsx
│   └── ChipsActivos.tsx             # render de filtros activos + remove
├── layout/
│   ├── HeaderPublico.tsx
│   ├── HeaderAdmin.tsx
│   ├── FooterMunicipal.tsx
│   ├── SelectorCarga.tsx            # dropdown para ver cargas anteriores
│   └── BotonExportar.tsx
└── ui/                              # shadcn/ui base (Button, Sheet, Dialog, ...)
```

---

## 9. Sistema de filtros

### 9.1 Filtros disponibles (mismos para todos los endpoints)

| Filtro | Tipo UI | Multi | Jerárquico |
|---|---|---|---|
| Año | Select | No | – |
| Carga (versión) | Select | No | – |
| Mes hasta | Slider 1‑12 | No | – |
| **Unidad orgánica** | **Tree‑select** | Sí | **Sí (4 niveles)** |
| Meta / Finalidad | Combobox + buscador | Sí | – |
| CUI (proyectos) | Combobox | Sí | – |
| Tipo (Producto/Proyecto) | Toggle | No | – |
| Programa presupuestal | Multi‑pill | Sí | – |
| Función | Combobox | Sí | – |
| Categoría de gasto | Toggle | No | – |
| Rubro / Fuente | Multi‑pill | Sí | – |
| **Clasificador de gasto** | **Tree‑select** | Sí | **Sí (5 niveles)** |
| Rango % avance | Pills (0‑25, 25‑50…) | No | – |
| Incluir restringido | Switch | No | – |
| Búsqueda libre | Input | – | – |

### 9.2 Lógica del árbol orgánico jerárquico

Cuando el usuario marca un nodo padre (ej. **Gerencia de Infraestructura**), se incluyen automáticamente **todas las metas** cuyo nodo hoja sea descendiente. Esto se resuelve en una sola consulta SQL usando la `ruta` materializada:

```sql
-- Si se seleccionaron las UO con id 3 y 14:
SELECT id FROM dim_unidad_organica
WHERE ruta LIKE '3/%' OR ruta = '3'
   OR ruta LIKE '14/%' OR ruta = '14';
```

El frontend muestra:

```
☑ ▾ Gerencia de Infraestructura            (S/. 41.6 M, 22.9% dev)
  ☑ ▾ Subgerencia de Ejecución de Inv.     (S/. 33.4 M, 18.1% dev)
  ☑   Subgerencia de Mantenimiento         (S/.  6.2 M, 51.2% dev)
  ☑   Subgerencia de Equipo Mecánico       (S/.  2.0 M, 33.4% dev)
☐ ▸ Gerencia de Desarrollo Social
☐ ▸ Gerencia de Gestión Ambiental
...
```

Marcar el padre marca sus hijos; desmarcar un hijo deja el padre en estado indeterminado. Cifras al lado de cada nodo se actualizan en vivo con los demás filtros activos.

### 9.3 Sincronización con URL

Todos los filtros viven en la URL (querystring). Beneficios:

- Compartir vistas con un link es trivial.
- Botón "atrás" funciona.
- Cache HTTP por URL es efectivo.

Ejemplo: `https://transparencia.munisanjeronimo.gob.pe/?org=3,14&meta=43&rubro=18&mes_hasta=4`

Implementación con `useSearchParams` de Next.js y un hook `useFiltros()` que actualiza la URL con `router.replace(url, { scroll: false })` debounced 300 ms.

---

## 10. KPIs y fórmulas

### 10.1 KPIs principales (siempre visibles)

| # | KPI | Fórmula | Formato |
|---|---|---|---|
| 1 | **PIM** | Σ mto_pim (mes=0) | S/. 0,000,000 |
| 2 | **Devengado** | Σ mto_devengado (mes 1‑12) | S/. 0,000,000 |
| 3 | **% Avance Devengado** ⭐ | Devengado / PIM | 00.0 % |
| 4 | **Certificación** | Σ mto_certificado (mes=0) | S/. 0,000,000 |
| 5 | **% Certificación** | Certificación / PIM | 00.0 % |
| 6 | **Compromiso Anual** | Σ mto_compromiso_anual (mes=0) | S/. |
| 7 | **% Compromiso** | Compromiso / PIM | 00.0 % |
| 8 | **Girado** | Σ mto_girado (1‑12) | S/. |
| 9 | **Saldo por Certificar** | PIM − Certificación | S/. |
| 10 | **Saldo por Devengar** | PIM − Devengado | S/. |
| 11 | **Modificaciones netas** | PIM − PIA | S/. (puede ser ±) |

### 10.2 KPIs derivados (insights)

| KPI | Fórmula | Interpretación |
|---|---|---|
| **Tasa de pago** | Pagado / Devengado | Calidad del cierre financiero |
| **Ritmo mensual de devengado** | Devengado / nº meses con ejecución | S/. promedio mensual |
| **Proyección a fin de año** | Ritmo × 12 | Estimación lineal de cierre |
| **Brecha frente a la meta lineal** | Devengado − (PIM × mes / 12) | Negativo = atrasado |
| **% modificaciones** | abs(PIM − PIA) / PIA | Volatilidad presupuestal |
| **Concentración** | Σ PIM top‑3 unidades / PIM total | Riesgo de concentración |

### 10.3 Semáforo de avance (criterio sugerido)

| Mes del año | Verde | Amarillo | Rojo |
|---|---|---|---|
| Q1 (ene‑mar) | ≥20 % | 10‑20 % | <10 % |
| Q2 (abr‑jun) | ≥45 % | 30‑45 % | <30 % |
| Q3 (jul‑sep) | ≥70 % | 55‑70 % | <55 % |
| Q4 (oct‑dic) | ≥90 % | 75‑90 % | <75 % |

Los umbrales son configurables vía tabla `config` si la gerencia los quiere ajustar.

---

## 11. Visualizaciones (charts)

### 11.1 Inventario y librería

| Chart | Librería | Datos | Refresca con filtros |
|---|---|---|---|
| Funnel de ejecución | Recharts `FunnelChart` o SVG custom | 6 valores (PIM, Cert, Compr, Dev, Gir, Pag) | Sí |
| Evolución mensual | Recharts `LineChart` (4 series) | 12 puntos | Sí |
| Treemap unidades orgánicas | `d3-treemap` o `react-d3-tree-map` | Top 20 UO | Sí |
| Barras horizontales por rubro | Recharts `BarChart` horizontal | 6 barras | Sí |
| Barras verticales por genérica | Recharts `BarChart` | 6 genéricas | Sí |
| Donut producto vs proyecto | Recharts `PieChart` | 2 segmentos | Sí |
| Ranking metas top/bottom 10 | Componente custom (HTML) | 20 filas | Sí |
| Heatmap mes × genérica | Componente custom (CSS grid) | 12 × 6 celdas | Sí |

### 11.2 Patrón común de cliente

```typescript
'use client'
import useSWR from 'swr'
import { useFiltros } from '@/lib/useFiltros'

export function EvolucionMensual() {
  const { qs } = useFiltros()
  const { data, isLoading } = useSWR(`/api/ejecucion/series-mensuales?${qs}`, fetcher)
  if (isLoading) return <Skeleton h={300} />
  return <LineChart data={data}>...</LineChart>
}
```

### 11.3 Decisiones de diseño de los charts

- Colores siempre desde las CSS vars (`var(--color-primary)`, etc.), nunca hard‑coded en componentes.
- Tooltips con cifras en formato peruano (`S/ 1,234,567.89`).
- Eje Y en miles/millones automáticos (`Intl.NumberFormat('es-PE', { notation: 'compact' })`).
- En móvil: cada chart ocupa el ancho completo, scroll vertical entre ellos.
- Mensaje "Sin datos para los filtros seleccionados" claro cuando aplica.

---

## 12. Exportación PDF y Excel

### 12.1 Excel

`/api/export/excel?<filtros>` genera un `.xlsx` con tres hojas:

1. **Resumen** – KPIs + parámetros del filtro aplicado + fecha de corte.
2. **Tabla** – la tabla dinámica completa (sin paginar) con el agrupamiento elegido.
3. **Detalle** – todas las filas no agrupadas que matchearon los filtros.

Implementación con `exceljs`:

```typescript
import ExcelJS from 'exceljs'
const wb = new ExcelJS.Workbook()
wb.creator = 'Municipalidad Distrital de San Jerónimo'
const hoja = wb.addWorksheet('Tabla', { views: [{ state: 'frozen', ySplit: 1 }] })
hoja.columns = [
  { header: 'Meta / Finalidad', key: 'finalidad', width: 60 },
  { header: 'RF',               key: 'rubro',     width: 10 },
  { header: 'Clasificador',     key: 'clasif',    width: 50 },
  { header: 'PIA',              key: 'pia',       width: 14, style: { numFmt: '#,##0.00' } },
  { header: 'PIM',              key: 'pim',       width: 14, style: { numFmt: '#,##0.00' } },
  { header: 'Devengado',        key: 'dev',       width: 14, style: { numFmt: '#,##0.00' } },
  { header: '% Avance',         key: 'pct',       width: 10, style: { numFmt: '0.00%' } },
]
// Header con color institucional
hoja.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
hoja.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3484A5' } }
rows.forEach(r => hoja.addRow(r))
return new Response(await wb.xlsx.writeBuffer(), {
  headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
             'Content-Disposition': `attachment; filename="ejecucion_${ano}_${Date.now()}.xlsx"` }})
```

### 12.2 PDF

`/api/export/pdf?<filtros>` con `@react-pdf/renderer`. Template:

- **Página 1:** carátula con logo, título, fecha de corte, parámetros del filtro.
- **Página 2:** KPIs en grid 2×4 + funnel.
- **Página 3:** evolución mensual + ranking metas.
- **Página 4 en adelante:** tabla agrupada (truncada a 200 filas con nota "ver Excel para detalle completo").
- Pie de página: "Generado el [fecha] · Fuente: SheetGasto carga #N del [fecha de carga]".

Hojas usan los mismos colores y tipografías del dashboard para coherencia.

---

## 13. Autenticación y autorización

### 13.1 Flujo

1. Admin entra a `/admin/login` → username + password.
2. Auth.js verifica con bcrypt contra `usuarios.password_hash`. Si OK, crea sesión JWT en cookie httpOnly de 8 horas.
3. Middleware `middleware.ts` protege todo lo bajo `/admin/*` y `/api/admin/*`: si no hay sesión, redirige a `/admin/login`.
4. Si la cuenta está `activo = false`, login falla con mensaje "Cuenta inhabilitada".

### 13.2 Configuración Auth.js v5

```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/admin/login' },
  providers: [Credentials({
    name: 'Credenciales',
    credentials: { username: {}, password: {} },
    async authorize(c) {
      const user = await prisma.usuarios.findUnique({ where: { username: String(c?.username) }})
      if (!user || !user.activo) return null
      if (!await compare(String(c?.password), user.password_hash)) return null
      await prisma.usuarios.update({ where: { id: user.id }, data: { ultimo_acceso: new Date() }})
      return { id: String(user.id), name: user.nombre_completo, email: user.email, role: user.rol }
    }})],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as any).role; return token },
    async session({ session, token }) { (session.user as any).role = token.role; return session },
  },
})
```

### 13.3 Roles

| Rol | Puede hacer |
|---|---|
| **ADMIN** | Subir cargas, ver historial, restaurar cargas previas, ver/editar su propio perfil |
| **SUPER_ADMIN** | Todo lo anterior + crear/desactivar otros admins, eliminar cargas |

### 13.4 Buenas prácticas obligatorias

- Passwords con bcrypt cost 12. Mínimo 8 caracteres con al menos una letra y un número.
- Rate limit en `/admin/login`: 5 intentos por IP en 15 min (usando `@upstash/ratelimit` o tabla `intentos_login`).
- Bitácora: cada upload, cambio de vigencia, creación/desactivación de usuario se registra en una tabla `auditoria`.
- Las contraseñas no aparecen en logs ni en respuestas JSON, nunca.

---

## 14. Responsive y experiencia móvil

### 14.1 Breakpoints

| Nombre | Ancho | Uso |
|---|---|---|
| `xs` | <480 px | Mobile pequeño (mayoría del público) |
| `sm` | 480‑767 | Mobile grande |
| `md` | 768‑1023 | Tablet |
| `lg` | 1024‑1279 | Desktop |
| `xl` | ≥1280 | Desktop grande |

### 14.2 Adaptaciones móviles

- **Filtros** viven en un `Sheet` (drawer) que se despliega desde abajo con botón flotante "Filtros (3)" en la esquina inferior derecha.
- **KPIs**: en móvil son 2 columnas, en tablet 4, en desktop 4 + segunda fila.
- **Charts**: ancho 100 %, scroll vertical entre ellos. El treemap se simplifica a top 10 en móvil; el heatmap rota a vertical.
- **Tabla**: en móvil colapsa a "cards" expandibles (cada fila se convierte en una tarjeta con etiquetas). En desktop, tabla tradicional con sticky headers.
- **Header** se vuelve sticky con el título corto al hacer scroll.
- Tap targets mínimo 44×44 px (Apple HIG).
- Lazy load de charts fuera del viewport (Intersection Observer) para que el LCP móvil sea <2.5 s.

### 14.3 PWA opcional (recomendado)

Añadir `manifest.json` y service worker básico para:

- Icono propio al "agregar a pantalla de inicio".
- Cache de assets estáticos para visitas repetidas más rápidas.
- Funciona offline para la última vista consultada.

---

## 15. Despliegue y operación

### 15.1 Opciones de hosting

| Opción | Costo aprox/mes | Pros | Contras |
|---|---|---|---|
| **VPS Linux** (Hostinger, DigitalOcean) | US$ 6–12 | Control total, MySQL local, sin límites | Hay que administrar |
| **Vercel + PlanetScale** (MySQL) | US$ 0–25 | Cero ops, CDN global | PlanetScale ya no tiene free; revisar precios |
| **Vercel + Railway** (MySQL) | US$ 10–20 | Simple, autoscaling | Latencia BD ↔ función |
| **Render.com** + PostgreSQL/MySQL | US$ 14 | Todo en uno | Costo medio |

Recomendación inicial: **VPS Hostinger Cloud Startup** (S/. ~40/mes) corriendo Next.js con PM2 detrás de Nginx + MySQL local. Cuando crezca el tráfico, migrar a Vercel.

### 15.2 Variables de entorno

```bash
# .env.production
DATABASE_URL="mysql://app:pwd@localhost:3306/munisanjeronimo"
NEXTAUTH_URL="https://transparencia.munisanjeronimo.gob.pe"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
UPLOAD_MAX_MB=10
RATE_LIMIT_LOGIN=5
LOG_LEVEL=info
TZ="America/Lima"
```

### 15.3 Pipeline CI/CD sugerido

GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_KEY }}
          script: |
            cd /var/www/munisanjeronimo
            git pull origin main
            npm ci --omit=dev
            npx prisma migrate deploy
            npm run build
            pm2 reload muni-app
```

### 15.4 Operación diaria

- **Backups**: dump de MySQL automático diario a las 3 a.m., 30 días de retención. Cron + `mysqldump --single-transaction`.
- **Monitoreo**: UptimeRobot ping cada 5 min a `/api/health`.
- **Logs**: rotación con `logrotate`, 14 días.
- **Certificado SSL**: Let's Encrypt automático con Certbot.

---

## 16. Estructura de carpetas

```
muni-ejecucion/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                          # dashboard
│   │   ├── tabla/page.tsx
│   │   ├── comparar/page.tsx
│   │   ├── acerca/page.tsx
│   │   └── layout.tsx
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── cargas/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nueva/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── usuarios/page.tsx
│   │   │   ├── perfil/page.tsx
│   │   │   └── layout.tsx
│   │   └── login/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── ejecucion/{kpis,tabla,series-mensuales,distribucion-rubro,
│   │   │              distribucion-generica,distribucion-organica,
│   │   │              ranking-metas,heatmap-mes-generica}/route.ts
│   │   ├── catalogos/{unidades-organicas,metas,rubros,clasificadores,programas}/route.ts
│   │   ├── cargas/{vigente,historial}/route.ts
│   │   ├── admin/cargas/{route.ts,[id]/route.ts,[id]/restaurar/route.ts}
│   │   ├── admin/usuarios/{route.ts,[id]/route.ts,[id]/cambiar-password/route.ts}
│   │   ├── export/{excel,pdf}/route.ts
│   │   └── health/route.ts
│   ├── globals.css
│   └── layout.tsx                            # root
├── components/
│   ├── dashboard/{KpiCard,KpiGrid,EmbudoEjecucion,
│   │              EvolucionMensual,TreemapOrganico,DonutProdProy,
│   │              BarrasRubro,BarrasGenerica,RankingMetas,
│   │              HeatmapMesGenerica,TablaDinamica}.tsx
│   ├── filters/...
│   ├── layout/...
│   ├── admin/{TablaCargas,FormSubirExcel,FormUsuario}.tsx
│   └── ui/                                   # shadcn/ui generados
├── lib/
│   ├── db.ts                                 # prisma client
│   ├── auth.ts                               # auth.js config
│   ├── filtros.ts                            # zod schema + helpers
│   ├── useFiltros.ts                         # hook cliente
│   ├── formato.ts                            # S/. , %, fechas
│   ├── queries/{kpis,tabla,series,catalogos,where}.ts
│   ├── ingestion/{parser,validator,procesarCarga,upsertDims}.ts
│   ├── export/{excel,pdf}.tsx
│   └── tipos.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                               # carga RB, CG iniciales + super-admin
├── public/
│   ├── logo-muni.svg
│   ├── favicon.ico
│   └── og-image.png
├── styles/globals.css
├── middleware.ts                             # protege /admin/*
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

---

## 17. Plan de implementación por fases

Estimado total: **8 semanas** con un desarrollador full‑stack a tiempo completo.

### Fase 1 · Cimientos (semana 1)

- Bootstrap del proyecto Next.js + TS + Tailwind + shadcn/ui.
- Configurar Prisma con MySQL.
- Crear y migrar el esquema completo (DDL de §4.2).
- Seed con `dim_rubro`, `dim_clasificador_gasto` y un super‑admin de prueba.
- CI/CD básico (lint + build) en GitHub Actions.
- Deploy del esqueleto en hosting elegido con dominio y SSL.

**Entregable:** página vacía en producción con base de datos lista.

### Fase 2 · Ingesta del Excel (semanas 2)

- Parser de SheetGasto con todas las validaciones (§6.1).
- Upsert de dimensiones derivadas.
- Bulk insert en `hechos_ejecucion` con desnormalización mensual.
- Tabla `cargas` con versionado y vigencia.
- Tests con el archivo que entregaste (1 890 filas → ~24 570 registros).

**Entregable:** un comando CLI o endpoint que sube el archivo y deja la BD lista para consultar.

### Fase 3 · API pública (semana 3)

- Schema Zod de filtros.
- Builder de `where` que respeta el árbol orgánico, los rangos, los restringidos, etc.
- Implementar los 8 endpoints de `/api/ejecucion/*` y los 5 de `/api/catalogos/*`.
- Cache HTTP.
- Tests de los endpoints con datos reales.

**Entregable:** Postman/Bruno collection con todos los endpoints funcionando.

### Fase 4 · Dashboard frontend (semanas 4‑5)

- Layout público con header institucional y branding (paleta + tipografías).
- Componente `KpiGrid` con los 10 KPIs.
- Tabla dinámica con TanStack Table en los 3 modos de agrupamiento.
- Funnel de ejecución y evolución mensual.
- Sincronización de filtros con la URL.

**Entregable:** dashboard navegable con datos reales en desktop.

### Fase 5 · Charts complejos y mobile (semana 6)

- Treemap, barras por rubro/genérica, donut, ranking metas, heatmap.
- Filtros completos: árbol orgánico, árbol clasificador, multi‑selects.
- Drawer de filtros móvil.
- Adaptación responsive de toda la página.
- Tests visuales (Storybook o Playwright snapshots).

**Entregable:** versión mobile production‑ready.

### Fase 6 · Panel admin (semana 7)

- Login con Auth.js, middleware de protección.
- Pantalla de subida de Excel con feedback de progreso.
- Historial de cargas con opción de restaurar.
- Gestión de usuarios admin (solo SUPER_ADMIN).
- Bitácora de auditoría.

**Entregable:** flujo completo "admin sube nuevo Excel → vista pública refleja cambios".

### Fase 7 · Exportación y comparación (semana 7‑8)

- Endpoint de export a Excel (3 hojas, formato institucional).
- Endpoint de export a PDF con template @react-pdf/renderer.
- Vista `/comparar` para ver dos cargas lado a lado.
- KPI "diferencias entre cargas" (modificaciones, nuevo devengado, etc.).

**Entregable:** botón "Descargar" funcional en Excel y PDF.

### Fase 8 · QA, optimización, capacitación (semana 8)

- Tests E2E con Playwright (al menos: carga de archivo, filtrado, export).
- Lighthouse audit > 90 en performance/accessibility/SEO/best‑practices en móvil.
- Documentación de operación y manual para el admin (PDF interno).
- Capacitación de 1 hora al admin municipal.
- Hardening: rate limits, CSP, security headers.

**Entregable:** sistema en producción + documentación.

---

## 18. Pruebas y QA

### 18.1 Niveles de testing

| Nivel | Herramienta | Cobertura objetivo |
|---|---|---|
| Unitarios | Vitest | Lógica de cálculo, formato, parsing |
| Integración API | Vitest + supertest | Cada endpoint con BD de prueba |
| E2E | Playwright | Flujos críticos (login, upload, filtros, export) |
| Visual | Playwright snapshots | Charts y tabla |

### 18.2 Casos críticos a probar

- Subir un archivo válido completo (el de 1 890 filas) y verificar que todos los totales cuadran con la hoja PRINCIPAL.
- Subir un archivo con columnas faltantes → debe rechazarse.
- Subir el mismo archivo dos veces → debe advertir y permitir confirmar.
- Restaurar carga anterior → la vista pública refleja los datos antiguos en <1 min.
- Filtrar por una unidad orgánica padre → los totales suman exactamente los descendientes.
- Filtrar por "incluir restringido = off" → no aparecen las filas con `restringido = true`.
- Exportar a Excel con filtros aplicados → contiene exactamente los mismos números que se ven en pantalla.
- Acceder en móvil 375 px → todos los elementos visibles, ningún overflow horizontal.
- 1000 usuarios simultáneos en el dashboard público → respuesta < 1 s (con cache HTTP).

---

## 19. Mantenimiento y roadmap futuro

### 19.1 Mantenimiento esperado

- 1 carga de Excel por mes (5 min de trabajo del admin).
- Revisión de logs y backups: 15 min/semana.
- Actualizaciones de dependencias: 2 horas/mes.

### 19.2 Funcionalidades futuras (post‑MVP)

| # | Funcionalidad | Beneficio |
|---|---|---|
| 1 | **Ingresos**: agregar ejecución del lado de ingresos (Recaudado/Determinado), no solo gastos | Visión 360° |
| 2 | **Importar desde API SIAF directamente** vía Consulta Amigable MEF | Eliminar la carga manual |
| 3 | **Alertas automáticas**: avisar al admin si una meta no ejecuta nada en X meses | Gestión proactiva |
| 4 | **Mapa geográfico** de proyectos por sector del distrito | Engagement ciudadano |
| 5 | **Modo "obras públicas"** con fotos, avance físico y financiero por CUI | Transparencia de inversión |
| 6 | **API pública** para periodistas/investigadores | Datos abiertos |
| 7 | **Comparación con otras municipalidades** del país | Benchmarking |
| 8 | **Reportes programados** que se envían por correo cada mes | Automatización |

---

## 20. Anexo A · Glosario presupuestal

| Término | Significado |
|---|---|
| **PIA** | Presupuesto Institucional de Apertura. Monto aprobado al inicio del año fiscal. |
| **PIM** | Presupuesto Institucional Modificado. PIA ± modificaciones (créditos suplementarios, transferencias, etc.). |
| **Modificaciones** | Cambios al presupuesto inicial: incorporaciones, anulaciones, transferencias. |
| **Certificación** | Reserva de crédito presupuestario para iniciar un proceso de gasto. Paso previo al compromiso. |
| **Compromiso anual** | Obligación firme generada al adjudicar un contrato. Es la afectación del PIM. |
| **Compromiso mensual** | Atención mensual del compromiso anual (calendariza el gasto). |
| **Devengado** | Reconocimiento de la obligación de pago una vez recibido el bien o servicio. **El KPI estándar de ejecución.** |
| **Girado** | Emisión del cheque, transferencia o autorización de pago. |
| **Pagado** | Pago efectivo realizado al proveedor. |
| **Saldo por certificar** | PIM − Certificación. Crédito aún disponible para reservar. |
| **Rubro** | Origen específico del financiamiento (RO, RDR, FCM, IM, CSC, DT...). |
| **Fuente de financiamiento** | Agregado de rubros (1.RO, 2.RDR, 3.ROOC, 4.DT, 5.RD). |
| **Categoría de gasto** | 5.Corriente, 6.Capital, 7.Servicio deuda. |
| **Genérica de gasto** | Primer nivel del clasificador económico (2.1 Personal, 2.3 Bienes y Servicios, 2.6 Activos no Financieros...). |
| **Meta presupuestal** | Unidad mínima de programación; combinación de finalidad + unidad orgánica + ubicación + período. |
| **Finalidad** | Resultado específico que se busca lograr con la meta. |
| **CUI** | Código Único de Inversiones (Invierte.pe). Identifica un proyecto de inversión. |
| **Programa Presupuestal** | Conjunto de actividades y productos articulados para lograr un resultado específico (Presupuesto por Resultados). |
| **Función / División / Grupo funcional** | Clasificación funcional del gasto (Salud, Educación, Saneamiento, etc.). |
| **SIAF** | Sistema Integrado de Administración Financiera (MEF). Fuente de toda la data. |

## 21. Anexo B · Diccionario de columnas de SheetGasto

| Columna del Excel | Tabla destino | Notas |
|---|---|---|
| `ano_eje` | `dim_meta.ano_eje`, `hechos.ano_eje` | Debe ser uniforme en toda la carga |
| `pliego`, `sec_ejec` | (info de cabecera, opcional) | Constantes para esta municipalidad |
| `programa_pptal` | `dim_programa_pptal` | Upsert por código |
| `tipo_prod_proy` | `dim_meta.tipo_prod_proy` | "3.PRODUCTO" → 'PRODUCTO' |
| `producto_proyecto` | `dim_meta.producto_proyecto_*` | Split por "." → código + nombre |
| `funcion`, `division_fn`, `grupo_fn` | `dim_funcion` | Upsert combinado |
| `meta` | `dim_meta.meta` + `hechos.meta_id` | Nº meta |
| `finalidad` | `dim_meta.finalidad_*` | Split "." → cod + nombre |
| `sec_func` | `dim_meta.sec_func` | Parte de la PK lógica |
| `fuente_financ` | (deriva el rubro) | Fuente agregada |
| `rubro` | `dim_rubro` → `hechos.rubro_id` | Match exacto |
| `categoria_gasto` | `hechos.categoria_gasto` | "5.GASTOS CORRIENTES" → 'CORRIENTE' |
| `f` | `dim_clasificador_gasto.codigo` → `hechos.clasificador_id` | Código completo de 5 niveles |
| `mto_pia`, `mto_modificaciones`, `mto_pim` | `hechos` (mes=0) | Anuales |
| `filtro_certificación` | `hechos.mto_certificado` (mes=0) | Usar el `filtro_*` que ya suma correctamente |
| `filtro_compromisoanual` | `hechos.mto_compromiso_anual` (mes=0) | |
| `mto_at_comp_01..12` | `hechos.mto_compromiso_mes` (mes 1..12) | Por mes |
| `mto_devenga_01..12` | `hechos.mto_devengado` (mes 1..12) | Por mes |
| `mto_girado_01..12` | `hechos.mto_girado` (mes 1..12) | Por mes |
| `mto_pagado_01..12` | `hechos.mto_pagado` (mes 1..12) | Por mes |
| `filtro_restringido` | `dim_clasificador_gasto.restringido` | "RESTRINGIDO" / "NO PUEDE SER HABILITADA" → true |
| `órgano`, `unidad orgánica`, `sub unidad orgánica`, `nombre corto` | `dim_unidad_organica` (4 niveles) | Trim + upsert por nivel |
| `CUI` | `dim_meta.cui` | Solo para proyectos |

---

## Cierre

Este documento es la base técnica completa para que un equipo de desarrollo pueda implementar el sistema sin ambigüedades. Cualquier decisión adicional (logo final, dominio, plan exacto de hosting) se incorpora sin afectar la arquitectura.

Próximos pasos sugeridos:

1. **Aprobar la guía** (o pedir ajustes en alguna sección).
2. Compartir **logo institucional** y cualquier ajuste cromático/tipográfico.
3. Decidir el **hosting** (recomiendo VPS Hostinger para empezar).
4. **Kick‑off de Fase 1.**

Una vez aprobada, generamos el repositorio inicial con todo el scaffolding y la migración Prisma lista para correr.

---

*Documento generado el 13 de mayo de 2026 · v1.0*