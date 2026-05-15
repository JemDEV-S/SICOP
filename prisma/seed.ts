import bcrypt from "bcryptjs";
import { PrismaClient, RolUsuario } from "@prisma/client";

const prisma = new PrismaClient();

const rubros = [
  {
    codigo: "00",
    nombre: "Recursos Ordinarios",
    fuenteCodigo: "1",
    fuenteNombre: "Recursos Ordinarios",
    nombreCorto: "RO",
    descripcion: "Financiamiento proveniente de la recaudacion general del tesoro publico.",
  },
  {
    codigo: "07",
    nombre: "Fondo de Compensacion Municipal",
    fuenteCodigo: "5",
    fuenteNombre: "Recursos Determinados",
    nombreCorto: "FCM",
    descripcion: "Transferencias por Fondo de Compensacion Municipal.",
  },
  {
    codigo: "08",
    nombre: "Impuestos Municipales",
    fuenteCodigo: "5",
    fuenteNombre: "Recursos Determinados",
    nombreCorto: "IM",
    descripcion: "Ingresos por tributos municipales.",
  },
  {
    codigo: "09",
    nombre: "Recursos Directamente Recaudados",
    fuenteCodigo: "2",
    fuenteNombre: "Recursos Directamente Recaudados",
    nombreCorto: "RDR",
    descripcion: "Ingresos generados por la entidad.",
  },
  {
    codigo: "13",
    nombre: "Donaciones y Transferencias",
    fuenteCodigo: "4",
    fuenteNombre: "Donaciones y Transferencias",
    nombreCorto: "DT",
    descripcion: "Recursos recibidos por donacion o transferencia.",
  },
  {
    codigo: "18",
    nombre: "Canon y Sobrecanon, Regalias, Renta de Aduanas y Participaciones",
    fuenteCodigo: "5",
    fuenteNombre: "Recursos Determinados",
    nombreCorto: "CSC",
    descripcion: "Recursos determinados asociados a canon, sobrecanon y participaciones.",
  },
  {
    codigo: "19",
    nombre: "Recursos por Operaciones Oficiales de Credito",
    fuenteCodigo: "3",
    fuenteNombre: "Recursos por Operaciones Oficiales de Credito",
    nombreCorto: "ROOC",
    descripcion: "Recursos provenientes de operaciones oficiales de credito.",
  },
];

const clasificadores = [
  ["2", null, 1, "Gastos presupuestarios"],
  ["2.1", "2", 2, "Personal y obligaciones sociales"],
  ["2.2", "2", 2, "Pensiones y otras prestaciones sociales"],
  ["2.3", "2", 2, "Bienes y servicios"],
  ["2.4", "2", 2, "Donaciones y transferencias"],
  ["2.5", "2", 2, "Otros gastos"],
  ["2.6", "2", 2, "Adquisicion de activos no financieros"],
  ["2.7", "2", 2, "Adquisicion de activos financieros"],
  ["2.8", "2", 2, "Servicio de la deuda publica"],
  ["2.3.1", "2.3", 3, "Compra de bienes"],
  ["2.3.2", "2.3", 3, "Contratacion de servicios"],
  ["2.6.2", "2.6", 3, "Construccion de edificios y estructuras"],
  ["2.6.3", "2.6", 3, "Adquisicion de vehiculos, maquinarias y otros"],
  ["2.6.8", "2.6", 3, "Otros gastos de activos no financieros"],
] as const;

async function main() {
  for (const rubro of rubros) {
    await prisma.dimRubro.upsert({
      where: { codigo: rubro.codigo },
      update: rubro,
      create: rubro,
    });
  }

  for (const [codigo, codigoPadre, nivel, descripcion] of clasificadores) {
    await prisma.dimClasificadorGasto.upsert({
      where: { codigo },
      update: {
        codigoPadre,
        nivel,
        descripcion,
        descripcionDetallada: descripcion,
      },
      create: {
        codigo,
        codigoPadre,
        nivel,
        descripcion,
        descripcionDetallada: descripcion,
      },
    });
  }

  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@munisanjeronimo.gob.pe";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.upsert({
    where: { username },
    update: {
      email,
      passwordHash,
      nombreCompleto: "Administrador del sistema",
      rol: RolUsuario.SUPER_ADMIN,
      activo: true,
    },
    create: {
      username,
      email,
      passwordHash,
      nombreCompleto: "Administrador del sistema",
      rol: RolUsuario.SUPER_ADMIN,
      activo: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
