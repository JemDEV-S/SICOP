import { NO_CARGA_VIGENTE_MESSAGE } from "@/lib/api/filtros";
import { Panel } from "./SicopShell";

export function NoCargaVigentePanel() {
  return (
    <Panel title="Primera carga requerida">
      <div style={{ display: "grid", gap: 10, color: "var(--fg-muted)", fontSize: 13, lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          El sistema esta operativo, pero el dashboard necesita una carga Excel procesada correctamente antes de consultar indicadores.
        </p>
        <p style={{ margin: 0 }}>
          Ingresa al panel administrativo, sube el archivo presupuestal y verifica que la carga termine en estado EXITOSA y quede marcada como vigente.
        </p>
      </div>
    </Panel>
  );
}

export function isNoCargaVigenteError(error: unknown) {
  return error instanceof Error && error.message === NO_CARGA_VIGENTE_MESSAGE;
}
