export const solesFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

export const percentFormatter = new Intl.NumberFormat("es-PE", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
