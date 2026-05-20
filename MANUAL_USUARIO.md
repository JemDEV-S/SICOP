# SICOP — Sistema de Control Presupuestal
**Municipalidad Distrital de San Jerónimo · Cusco**

URL de acceso: http://sicop.sistema01.munisanjeronimocusco.gob.pe/

---

## ¿Qué es SICOP?

SICOP es un sistema web de consulta presupuestal que permite visualizar, en tiempo real, el estado de ejecución del presupuesto institucional de la Municipalidad Distrital de San Jerónimo. Consolida la información del archivo de gasto (ReporteGasto) cargado por el área de presupuesto y la presenta en cuadros, indicadores y gráficos de fácil lectura.

El sistema es de **solo lectura para el público interno**: no modifica datos en SIAF ni en ningún otro sistema fuente.

---

## Indicadores clave (KPIs)

En todas las vistas se muestran los siguientes indicadores al inicio de la página:

| Indicador | Descripción |
|---|---|
| **PIA** | Presupuesto Institucional de Apertura |
| **Modificaciones** | Créditos y anulaciones aplicados al PIA |
| **PIM** | Presupuesto Institucional Modificado (PIA + Modificaciones) |
| **Certificación** | Monto certificado; incluye avance % sobre el PIM |
| **Compromiso anual** | Monto comprometido en el año |
| **Devengado** | Monto devengado; es el indicador principal de ejecución |
| **Girado** | Monto girado (órdenes de pago emitidas) |
| **Pagado** | Monto efectivamente pagado |

Todos los montos están expresados en **Soles (S/)**.

---

## Vistas del sistema

### 1. Dashboard — Resumen ejecutivo
**Ruta:** `/`

Vista principal con el resumen completo de la ejecución. Incluye:

- **KPIs globales** con barras de progreso y porcentaje de avance.
- **PIM vs Devengado por órgano** — barras horizontales comparativas por unidad orgánica.
- **Flujo presupuestal** — gráfico de cascada que muestra PIM → Certificado → Compromiso → Devengado → Girado.
- **Distribución PIM por genérica** — montos por clasificador genérico del gasto.
- **Distribución PIM por rubro** — montos por fuente de financiamiento.
- **Devengado mensual** — evolución del devengado mes a mes.
- **Reporte jerárquico resumido** — primeras 20 finalidades con sus rubros y clasificadores.

---

### 2. Reporte Principal
**Ruta:** `/reporte-principal`

Tabla jerárquica expandible con tres niveles de detalle:

```
Finalidad (nivel 1)
  └── Rubro / Fuente de financiamiento (nivel 2)
        └── Clasificador genérico del gasto (nivel 3)
```

**Columnas mostradas:** PIA · Modificaciones · PIM · Certificado · Compromiso · Devengado · Girado · % Certif. · % Comp. · % Dev.

- Haga clic en **▸** para expandir una finalidad y ver sus rubros.
- Haga clic en **▸** sobre un rubro para ver el detalle por clasificador.
- Las celdas de modificaciones en **verde** indican créditos; en **rojo**, anulaciones.
- Los porcentajes usan un sistema de colores: **verde** > 70 %, **ámbar** 30–70 %, **rojo** < 30 %.
- Las partidas marcadas con **R** son clasificadores con carácter restringido.

---

### 3. Ejecución Mensual
**Ruta:** `/mensual`

Muestra la evolución del presupuesto mes a mes. Contiene:

- **Barras por mes** — devengado de cada mes del año fiscal en curso.
- **Tabla mensual detallada** con columnas: Mes · Compromiso · Devengado · Girado · Pagado · Dev. acumulado · % avance PIM.

Útil para identificar en qué meses hubo mayor o menor actividad de gasto.

---

### 4. Inversiones
**Ruta:** `/inversiones`

Lista todos los proyectos de inversión activos (tipo PROYECTO), mostrando:

- Código CUI / Código de proyecto.
- Nombre completo del proyecto.
- Unidad orgánica responsable.
- PIM · Devengado · Girado · % avance.

Los porcentajes de avance usan el mismo código de colores que el resto del sistema.

---

## Filtros disponibles

En todas las vistas aparece una barra de filtros en la parte superior. Los filtros se pueden combinar entre sí:

| Filtro | Descripción |
|---|---|
| **Unidad orgánica** | Filtra por gerencia, subgerencia u órgano ejecutor |
| **Rubro** | Fuente de financiamiento (Recursos ordinarios, Recursos directamente recaudados, etc.) |
| **Meta** | Actividad, proyecto u obra específica |
| **Genérica** | Clasificador genérico del gasto (Personal, Bienes, Servicios, etc.) |
| **Programa** | Programa presupuestal |

Al seleccionar un filtro, **todos los indicadores, gráficos y tablas de la página se actualizan automáticamente**. Para quitar un filtro, seleccione la opción en blanco o vuelva a hacer clic en la selección activa.

El panel lateral izquierdo también permite navegar directamente por la estructura orgánica de la institución.

---

## Panel administrativo

**Ruta:** `/admin` — Requiere inicio de sesión.

### Actualizar datos

El sistema trabaja con archivos Excel exportados del SIAF. Existen dos tipos de carga:

| Tipo | Archivo esperado | Uso |
|---|---|---|
| **Excel crudo** | `ReporteGasto (##).xls` / `.xlsx` | Exportación directa del SIAF sin modificar |
| **Excel completo** | Libro `.xlsx` con hojas `RB`, `CG`, `SF`, `SheetGasto` | Libro enriquecido con hojas auxiliares |

**Pasos para actualizar los datos:**
1. Ingresar al panel administrativo en `/admin`.
2. En la sección **"Actualizar datos"**, seleccionar el tipo de archivo correspondiente.
3. Hacer clic en **"Seleccionar archivo"** y elegir el `.xls` / `.xlsx` desde el equipo.
4. Presionar el botón **"Subir Excel crudo"** o **"Subir Excel completo"** según corresponda.
5. El sistema procesa el archivo automáticamente y lo publica como carga vigente.
6. Al finalizar aparecerá el mensaje **"Carga procesada y publicada"**.

> El proceso puede tardar unos segundos dependiendo del tamaño del archivo. No cierre la ventana mientras se procesa.

### Historial de cargas

Muestra las últimas 20 cargas registradas con su estado (Exitosa / Fallida) y la cantidad de registros procesados. Si necesita volver a una versión anterior, use el botón **"Restaurar"** en la fila correspondiente.

### Gestión de usuarios

Los usuarios con rol **SUPER_ADMIN** pueden:
- Crear nuevas cuentas de acceso al panel administrativo.
- Activar o desactivar cuentas existentes.
- Asignar rol **ADMIN** o **SUPER_ADMIN**.

### Bitácora

Registro de las últimas acciones realizadas en el sistema (cargas, restauraciones, cambios de usuario) con fecha, hora y usuario responsable.

---

## Preguntas frecuentes

**¿Con qué frecuencia se actualizan los datos?**
Los datos se actualizan manualmente cada vez que el responsable de presupuesto sube un nuevo archivo Excel desde el panel administrativo. La fecha y hora de la última actualización se muestra en el encabezado y en el panel lateral del sistema.

**¿Los datos son en tiempo real desde el SIAF?**
No. SICOP trabaja con archivos exportados del SIAF. La información es tan reciente como la última carga subida por el área de presupuesto.

**¿Qué significa el indicador de devengado?**
El devengado es el gasto reconocido por la entidad: el bien fue recibido o el servicio fue prestado y se generó la obligación de pago. Es el principal indicador de ejecución presupuestal según la normativa del MEF.

**¿Puedo exportar los datos?**
La versión actual del sistema es de visualización. Para obtener el detalle en Excel, solicite el archivo ReporteGasto directamente al área de presupuesto.

**¿Qué hago si la página muestra "Sin datos vigentes"?**
Significa que aún no se ha subido ningún archivo de carga o que la carga activa fue retirada. Contacte al administrador del sistema para que suba el archivo de gasto actualizado.

---

*Sistema desarrollado para la Municipalidad Distrital de San Jerónimo — Cusco.*
*Año fiscal en curso: 2026.*
