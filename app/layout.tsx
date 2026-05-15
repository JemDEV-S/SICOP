import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ejecucion presupuestal | Municipalidad Distrital de San Jeronimo",
  description: "Portal publico de avance de ejecucion presupuestal de la Municipalidad Distrital de San Jeronimo, Cusco.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Evita flash al cargar: aplica tema guardado antes de que React hidrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sicop-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
