# Sistema de Reporte de Ejecucion Presupuestal

Portal publico y panel administrativo para consultar el avance de ejecucion presupuestal de la Municipalidad Distrital de San Jeronimo, Cusco.

## Fase 1

Esta base incluye:

- Next.js App Router con TypeScript y Tailwind CSS.
- Prisma configurado para MySQL.
- Migracion inicial del modelo de datos presupuestal.
- Seed de rubros, clasificadores base y super-admin de prueba.
- Endpoint `GET /api/health`.
- CI basico con validate, lint y build.

> Nota: la guia propone Next.js 14. El proyecto usa Next.js 16.2.6 porque el audit actual marca la rama 14 como vulnerable. La arquitectura App Router se mantiene.

## Fase 2

La ingesta del Excel ya esta disponible por CLI:

```bash
npm run import:excel -- ReporteGasto_13.05.26.xlsx
```

Opciones:

```bash
npm run import:excel -- ReporteGasto_13.05.26.xlsx --force
npm run import:excel -- ReporteGasto_13.05.26.xlsx --usuario-id=1
```

El importador:

- Lee catalogos maestros desde `RB`, `CG` y `SF`.
- Usa `SheetGasto` solo para hechos presupuestales y datos propios de metas.
- Valida columnas obligatorias y ano fiscal unico.
- Valida que cada rubro exista en `RB`, cada clasificador exista en `CG` y cada `sec_func` tenga estructura organica valida en `SF`.
- Calcula SHA-256 del archivo para detectar duplicados.
- Crea una carga versionada en `cargas`.
- Hace upsert de rubros, clasificadores, estructura organica, programas, funciones y metas.
- Colapsa niveles organicos repetidos: si organo, unidad y subunidad tienen el mismo nombre, se guarda un solo nodo.
- Guarda `nombre corto` como atributo de la meta, no como unidad organica.
- Inserta 13 hechos por fila: `mes=0` para montos anuales y `mes=1..12` para ejecucion mensual.
- Marca la carga exitosa como vigente para el ano fiscal.

Para reconstruir los datos presupuestales desde cero sin tocar usuarios:

```bash
npm run import:excel -- ReporteGasto_13.05.26.xlsx --reset
```

> Nota: la guia menciona `xlsx`, pero el proyecto usa `exceljs` para lectura porque `xlsx` registra vulnerabilidades sin fix disponible en `npm audit`.

## Requisitos

- Node.js 20+
- MySQL 8+

## Configuracion local

1. Copia `.env.example` a `.env`.
2. Ajusta `DATABASE_URL` con tus credenciales MySQL.
3. Instala dependencias:

```bash
npm install
```

4. Ejecuta la migracion y seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Levanta el servidor:

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Comandos utiles

```bash
npm run lint
npm run build
npm run prisma:generate
npm run prisma:deploy
npm run import:excel -- ReporteGasto_13.05.26.xlsx
```

## Fase 3

La API publica esta disponible en:

- `GET /api/ejecucion/kpis`
- `GET /api/ejecucion/tabla`
- `GET /api/ejecucion/series-mensuales`
- `GET /api/ejecucion/distribucion-rubro`
- `GET /api/ejecucion/distribucion-generica`
- `GET /api/ejecucion/distribucion-organica`
- `GET /api/ejecucion/ranking-metas`
- `GET /api/ejecucion/heatmap-mes-generica`
- `GET /api/catalogos/unidades-organicas`
- `GET /api/catalogos/metas`
- `GET /api/catalogos/rubros`
- `GET /api/catalogos/clasificadores`
- `GET /api/catalogos/programas`
- `GET /api/cargas/vigente`
- `GET /api/cargas/historial`

Filtros por query string:

`cargaId`, `anoEje`, `mesDesde`, `mesHasta`, `unidades`, `metas`, `rubros`, `clasificadores`, `programas`, `categorias`, `tipoProdProy`, `incluirRestringido`, `q`.

Los filtros multivalor usan CSV, por ejemplo:

```text
/api/ejecucion/kpis?rubros=18,09&mesDesde=1&mesHasta=5
```

Por defecto se incluyen clasificadores restringidos para cuadrar con los totales oficiales. Usa `incluirRestringido=false` para excluirlos.

Hay una coleccion de prueba en `docs/api.http`.

## Fase 4

El dashboard publico en `/` ya consume la base real e incluye:

- Shell visual SICOP basado en el handoff `sicop-san-jer-nimo`.
- Header institucional, navegacion superior y sidebar de estructura institucional.
- Filtros sincronizados con URL.
- KPIs principales.
- Barras por organo, generica y rubro.
- Flujo de ejecucion presupuestal.
- Vista `/reporte-principal` con jerarquia Finalidad -> Rubro -> Clasificador.
- Vista `/mensual` con los 12 meses y acumulados.
- Vista `/inversiones` con proyectos por CUI.
- Vista `/admin` con historial, usuarios y unidades organicas.

Ejemplos:

```text
/?rubros=18
/?unidades=856&groupBy=meta
/?groupBy=rubro&incluirRestringido=false
```
