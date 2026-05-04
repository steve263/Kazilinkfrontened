import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function getRatingLabel(rating: number): string {
  if (rating >= 4.8) return "Exceptional";
  if (rating >= 4.5) return "Excellent";
  if (rating >= 4.0) return "Very Good";
  if (rating >= 3.5) return "Good";
  return "Average";
}

export function getPriceLabel(range: string): string {
  switch (range) {
    case "$":
      return "Budget-friendly";
    case "$$":
      return "Mid-range";
    case "$$$":
      return "Premium";
    default:
      return range;
  }
}
