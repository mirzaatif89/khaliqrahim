/** Delivery & fee rules shared by the storefront UI. The database repeats this rule when an order is placed. */
export type StoreSettings = {
  delivery_fee: number;
  free_delivery_over: number;
};

export function deliveryFeeFor(subtotal: number, s: StoreSettings): number {
  if (subtotal <= 0) return 0;
  if (s.free_delivery_over > 0 && subtotal >= s.free_delivery_over) return 0;
  return s.delivery_fee;
}

export function orderTotal(subtotal: number, s: StoreSettings): number {
  return subtotal + deliveryFeeFor(subtotal, s);
}

export function formatPKR(n: number | null | undefined): string {
  if (n == null) return "—";
  return "Rs " + Math.round(n).toLocaleString("en-PK");
}

/** Normalise Pakistani mobile numbers to 03XXXXXXXXX. */
export function normalizePhone(p: string): string {
  let d = (p || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("92")) d = "0" + d.slice(2);
  if (d.length === 10 && d.startsWith("3")) d = "0" + d;
  return d;
}

export function isValidPkMobile(p: string): boolean {
  return /^03\d{9}$/.test(normalizePhone(p));
}

/** Clinic is open Monday–Saturday; Sunday is a holiday. */
export function isClinicDay(date: Date): boolean {
  return date.getDay() !== 0;
}

export const CLINIC_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM",
  "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
];
