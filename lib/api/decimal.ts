import { Prisma } from "@prisma/client";

type NumericLike = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: NumericLike) {
  if (value == null) {
    return 0;
  }

  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
