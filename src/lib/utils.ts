import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs:ClassValue[]){return twMerge(clsx(inputs));}
export function money(value:number, currency="UGX") {
  return new Intl.NumberFormat("en-UG", { style:"currency", currency, maximumFractionDigits:0 }).format(value);
}
export function dateLabel(value:string) {
  return new Intl.DateTimeFormat("en-UG", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(value));
}
export function pct(a:number,b:number) { return b ? Math.round((a/b)*100) : 0; }
export function initials(name:string) { return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(); }
