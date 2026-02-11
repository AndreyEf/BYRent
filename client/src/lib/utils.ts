import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPriceByn(priceInKopecks: number, usdRate?: number): string {
  if (priceInKopecks === 0) return "Бесплатно";
  
  const byn = priceInKopecks / 100;
  const bynFormatted = byn.toFixed(2).replace('.', ',');
  
  if (usdRate && usdRate > 0) {
    const usd = byn / usdRate;
    return `${bynFormatted} BYN ($${usd.toFixed(2)})`;
  }
  
  return `${bynFormatted} BYN`;
}
