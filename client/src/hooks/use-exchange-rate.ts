import { useQuery } from "@tanstack/react-query";

interface ExchangeRate {
  currency: string;
  rate: number;
  baseCurrency: string;
}

export function useExchangeRate() {
  const { data } = useQuery<ExchangeRate>({
    queryKey: ["/api/exchange-rate"],
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
  
  return data?.rate;
}

export function formatRentPrice(value: number | null | undefined, usdRate?: number): string {
  if (value === null || value === undefined) return "";
  
  const formatted = new Intl.NumberFormat("ru-RU").format(value);
  
  if (usdRate && usdRate > 0) {
    const usd = value / usdRate;
    return `${formatted} BYN ($${usd.toFixed(2)})`;
  }
  
  return `${formatted} BYN`;
}
