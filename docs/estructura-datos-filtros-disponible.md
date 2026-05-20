# Guia tecnica: estructura de datos, filtros y dinero disponible

Este documento resume como esta armado el proyecto para poder modificar filtros y agregar informacion de dinero disponible por unidad organica o clasificador.

## 1. Mapa rapido del proyecto

- `prisma/schema.prisma`: modelo de datos principal. Define dimensiones, cargas y hechos presupuestales.
- `lib/ingestion/`: lectura del Excel, carga de catalogos y creacion de registros presupuestales.
- `lib/api/filtros.ts`: parseo de parametros URL y construccion del `where` de Prisma.
- `lib/api/queries.ts`: consultas agregadas para KPIs, distribuciones, series mensuales, ranking y tabla generica.
- `lib/api/view-queries.ts`: consultas compuestas para vistas especificas, especialmente reporte principal e inversiones.
- `app/api/`: endpoints REST que reutilizan `lib/api`.
- `app/page.tsx`, `app/reporte-principal/page.tsx`, `app/mensual/page.tsx`, `app/inversiones/page.tsx`: vistas server-side.
- `components/sicop/`: componentes visuales actuales: filtros, KPIs, tablas y graficos.

## 2. Estructura de datos presupuestal

La tabla central es `hechos_ejecucion`, modelada como `HechoEjecucion`.

Campos clave:

- `cargaId`: identifica la carga Excel vigente o historica.
- `anoEje`: anio presupuestal.
- `mes`: `0` para montos anuales; `1..12` para ejecucion mensual.
- `metaId`: conecta con `DimMeta`.
- `rubroId`: conecta con `DimRubro`.
- `clasificadorId`: conecta con `DimClasificadorGasto`.
- `categoriaGasto`: `CORRIENTE`, `CAPITAL` o `SERVICIO_DEUDA`.
- `mtoPia`, `mtoModificaciones`, `mtoPim`, `mtoCertificado`, `mtoCompromisoAnual`: montos anuales, normalmente consultados con `mes = 0`.
- `mtoCompromisoMes`, `mtoDevengado`, `mtoGirado`, `mtoPagado`: montos mensuales, normalmente consultados con `mes` entre `mesDesde` y `mesHasta`.

La unidad organica no esta directamente en `hechos_ejecucion`. Se obtiene por esta ruta:

```txt
HechoEjecucion.metaId -> DimMeta.id
DimMeta.unidadOrganicaId -> DimUnidadOrganica.id
```

El clasificador si esta conectado directamente:

```txt
HechoEjecucion.clasificadorId -> DimClasificadorGasto.id
```

## 3. Jerarquias importantes

### Unidad organica

`DimUnidadOrganica` tiene una estructura de arbol:

- `id`
- `nivel`
- `padreId`
- `nombre`
- `nombreCorto`
- `ruta`: ejemplo conceptual `1/4/9`
- `rutaNombres`: ejemplo conceptual `ORGANO > UNIDAD > SUBUNIDAD`

El filtro por unidad incluye descendientes. Si se selecciona una unidad padre, tambien entran las unidades hijas. Esto ocurre en `unidadDescendantWhere()` dentro de `lib/api/filtros.ts`, usando `ruta` y `startsWith`.

### Clasificador

`DimClasificadorGasto` tambien se interpreta jerarquicamente por codigo:

- `codigo`: por ejemplo `2.3.1.1.1.1`
- `codigoPadre`
- `nivel`
- `descripcion`
- `restringido`

El filtro por clasificador tambien incluye descendientes. Si se filtra `2.3`, entran `2.3.*`. Esto ocurre en `clasificadorWhere()` dentro de `lib/api/filtros.ts`.

## 4. Como entran los datos desde Excel

La carga principal usa `lib/ingestion/procesarCarga.ts`.

Flujo:

1. `parseCatalogosIniciales()` lee hojas de catalogo:
   - `RB`: rubros.
   - `CG`: clasificadores.
   - `SF`: estructura organica por `sec_func`.
2. `parseSheetGasto()` lee `SheetGasto`.
3. `upsertCatalogosIniciales()` crea/actualiza rubros, clasificadores y unidades organicas.
4. `upsertDimensions()` crea/actualiza programa, funcion y meta.
5. Por cada fila valida se crean:
   - 1 hecho anual con `mes = 0`.
   - 12 hechos mensuales con `mes = 1..12`.

Importante: los montos anuales y mensuales estan separados. Para calcular disponibilidad presupuestal normalmente se debe usar la parte anual (`mes = 0`), porque `PIM`, `Certificado` y `Compromiso Anual` viven ahi.

## 5. Filtros actuales

Todos los filtros compartidos se definen en `lib/api/filtros.ts`.

Parametros aceptados:

- `cargaId`: consulta una carga especifica.
- `anoEje`: anio de ejecucion.
- `mesDesde`, `mesHasta`: rango mensual.
- `unidades`: ids separados por coma. Ejemplo: `unidades=3,4`.
- `metas`: ids separados por coma.
- `rubros`: codigos separados por coma.
- `clasificadores`: codigos separados por coma.
- `programas`: codigos separados por coma.
- `categorias`: valores del enum `CategoriaGasto`.
- `tipoProdProy`: `PRODUCTO` o `PROYECTO`.
- `incluirRestringido`: `true/false` o `1/0`.
- `q`: busqueda libre en datos de meta.

El objeto final se construye en `buildHechoWhere()`. Cualquier filtro nuevo que afecte a las consultas presupuestales debe agregarse ahi para que aplique a KPIs, tablas, graficos y endpoints.

## 6. Donde se muestran/modifican los filtros en la UI

El componente principal es `components/sicop/SicopFilterBar.tsx`.

Actualmente muestra:

- Rubro.
- Unidad organica.
- Programa presupuestal.
- Rango de meses.
- Incluir/excluir clasificadores restringidos.
- Busqueda libre.

Los catalogos que alimentan ese componente salen de `getCatalogosBasicos()` en `lib/api/page-data.ts`.

Si agregas un filtro visible, normalmente debes tocar:

1. `lib/api/filtros.ts`: agregar el parametro al schema y al `where`.
2. `lib/api/page-data.ts`: cargar catalogo si el filtro necesita opciones.
3. `components/sicop/SicopFilterBar.tsx`: agregar control visual y chip activo.
4. Las paginas que usan `<SicopFilterBar {...catalogos} />` si cambia la forma de props.

Paginas afectadas:

- `app/page.tsx`
- `app/reporte-principal/page.tsx`
- `app/mensual/page.tsx`
- `app/inversiones/page.tsx`

## 7. Endpoints backend relacionados

Endpoints de ejecucion:

- `GET /api/ejecucion/kpis`
- `GET /api/ejecucion/series-mensuales`
- `GET /api/ejecucion/distribucion-rubro`
- `GET /api/ejecucion/distribucion-generica`
- `GET /api/ejecucion/distribucion-organica`
- `GET /api/ejecucion/ranking-metas`
- `GET /api/ejecucion/heatmap-mes-generica`
- `GET /api/ejecucion/tabla?groupBy=meta|rubro|generica|organica`

Catalogos:

- `GET /api/catalogos/unidades-organicas`
- `GET /api/catalogos/clasificadores?q=...&limit=...`
- `GET /api/catalogos/rubros`
- `GET /api/catalogos/programas`
- `GET /api/catalogos/metas`

Los endpoints de ejecucion llaman a `parseFiltros()` y luego a funciones de `lib/api/queries.ts` o `lib/api/view-queries.ts`.

## 8. Como agregar "dinero disponible"

Primero definir que significa disponible. En este sistema ya existe:

```ts
saldoPorCertificar = pim - certificado
```

Para disponibilidad por unidad organica o clasificador, las formulas mas probables son:

```ts
disponibleCertificar = pim - certificado
disponibleComprometer = pim - compromisoAnual
disponibleDevengar = pim - devengado
```

Recomendacion: usar como campo base `disponible = pim - certificado` si el objetivo es saber cuanto presupuesto queda sin certificar. Si el usuario funcional necesita disponibilidad para compromiso, usar `pim - compromisoAnual`.

### Cambio backend recomendado

Modificar los agregadores en:

- `lib/api/queries.ts`
- `lib/api/view-queries.ts`

En `lib/api/queries.ts`, agregar el calculo en `finalizeAgg()`:

```ts
function finalizeAgg<T extends ReturnType<typeof emptyAgg>>(agg: T) {
  return {
    ...agg,
    disponibleCertificar: round2(agg.pim - agg.certificado),
    disponibleComprometer: round2(agg.pim - agg.compromisoAnual),
    disponibleDevengar: round2(agg.pim - agg.devengado),
    avanceDevengado: agg.pim ? round2((agg.devengado / agg.pim) * 100) : 0,
  };
}
```

Esto impacta directamente:

- Distribucion por rubro.
- Distribucion por generica/clasificador generico.
- Distribucion por organica.
- Ranking de metas.
- `GET /api/ejecucion/tabla`.

En `lib/api/view-queries.ts`, agregar campos equivalentes en `finalize()`:

```ts
function finalize(agg: Agg) {
  return {
    ...agg,
    saldoCertificar: round2(agg.pim - agg.certificado),
    disponibleCertificar: round2(agg.pim - agg.certificado),
    disponibleComprometer: round2(agg.pim - agg.compromisoAnual),
    disponibleDevengar: round2(agg.pim - agg.devengado),
    avanceCertificado: agg.pim ? round2((agg.certificado / agg.pim) * 100) : 0,
    avanceCompromiso: agg.pim ? round2((agg.compromisoAnual / agg.pim) * 100) : 0,
    avanceDevengado: agg.pim ? round2((agg.devengado / agg.pim) * 100) : 0,
    avanceGirado: agg.pim ? round2((agg.girado / agg.pim) * 100) : 0,
  };
}
```

Esto impacta:

- Reporte principal por finalidad/rubro/clasificador.
- Vista de inversiones.

### Mostrar disponible por unidad organica

La funcion actual es `getDistribucionOrganica()` en `lib/api/queries.ts`.

Agrupa usando:

```ts
const unidad = fact.metaDim.unidadOrganica;
const raiz = unidad.rutaNombres.split(" > ")[0] || unidad.nombre;
```

Eso significa que hoy agrupa por el primer nivel de la ruta, no necesariamente por la unidad exacta. Si necesitas disponible por cada unidad organica exacta, cambia la clave:

```ts
const key = String(unidad.id);
const agg = map.get(key) ?? {
  ...emptyAgg(),
  unidadOrganicaId: unidad.id,
  nombre: unidad.rutaNombres,
  ruta: unidad.rutaNombres,
};
```

Si necesitas por organo raiz, deja la logica actual.

### Mostrar disponible por clasificador

Hoy `getDistribucionGenerica()` agrupa solo por generica:

```ts
const codigo = fact.clasificador.codigo.split(".").slice(0, 2).join(".");
```

Para agrupar por clasificador completo, crea una funcion nueva o agrega un `groupBy` nuevo:

```ts
export async function getDistribucionClasificador(filtros: Filtros, prefetched?: FactRow[]) {
  const facts = prefetched ?? await getFactRows(filtros);
  const map = new Map<string, ReturnType<typeof emptyAgg> & { codigo: string; nombre: string }>();

  for (const fact of facts) {
    const key = fact.clasificador.codigo;
    const agg = map.get(key) ?? {
      ...emptyAgg(),
      codigo: fact.clasificador.codigo,
      nombre: fact.clasificador.descripcion,
    };
    map.set(key, addFact(agg, fact));
  }

  return Array.from(map.values()).map(finalizeAgg).sort((a, b) => b.pim - a.pim);
}
```

Luego extender `getTabla()`:

```ts
if (groupBy === "clasificador") return (await getDistribucionClasificador(filtros)).slice(0, limit);
```

Y consultar:

```txt
/api/ejecucion/tabla?groupBy=clasificador
```

## 9. Ajustes de tipos frontend

Si agregas campos nuevos a respuestas usadas por componentes cliente, actualiza:

- `components/dashboard/types.ts`

Por ejemplo en `TablaRow`:

```ts
disponibleCertificar?: number;
disponibleComprometer?: number;
disponibleDevengar?: number;
```

Para el reporte principal, los tipos estan definidos localmente en:

- `components/sicop/SicopPrincipalTable.tsx`

Agregar los campos a `Clasificador`, `Rubro` y `Finalidad`, y luego una columna nueva:

```tsx
<th className="sicop-num">Disponible</th>
...
<td className="sicop-num">{money(item.disponibleCertificar)}</td>
```

Tambien debes ajustar el `colgroup` y el `minWidth` de la tabla si agregas columnas.

## 10. Recomendaciones para no romper la consistencia

- Mantener una sola definicion de filtros en `lib/api/filtros.ts`.
- No duplicar filtros en cada endpoint.
- Para montos de presupuesto inicial/modificado/certificado/compromiso anual, usar `mes = 0`.
- Para devengado/girado/pagado mensual, usar `mes = 1..12`.
- Si agregas un filtro nuevo, probarlo en al menos:
  - `/`
  - `/reporte-principal`
  - `/mensual`
  - `/inversiones`
  - `/api/ejecucion/kpis`
  - `/api/ejecucion/tabla`
- Si el filtro es jerarquico, decidir si debe incluir descendientes como unidad organica y clasificador.
- Si el calculo de disponible debe aparecer en varias vistas, agregarlo en los `finalize`/`finalizeAgg`, no manualmente en cada componente.

## 11. Checklist de implementacion sugerido

1. Definir formula funcional de disponible:
   - `PIM - Certificado`, o
   - `PIM - Compromiso Anual`, o
   - ambas.
2. Agregar campos calculados en `lib/api/queries.ts`.
3. Agregar campos calculados en `lib/api/view-queries.ts`.
4. Si se necesita clasificador completo, crear `getDistribucionClasificador()`.
5. Extender `getTabla()` con `groupBy=clasificador`.
6. Actualizar tipos en `components/dashboard/types.ts`.
7. Actualizar tablas/componentes donde se mostrara disponible.
8. Si hay filtro nuevo, modificar `lib/api/filtros.ts`, `lib/api/page-data.ts` y `SicopFilterBar.tsx`.
9. Probar consultas con filtros combinados: unidad + rubro + clasificador + meses.

