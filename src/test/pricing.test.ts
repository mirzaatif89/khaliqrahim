import { describe, expect, it } from "vitest";
import { deliveryFeeFor, isClinicDay, isValidPkMobile, orderTotal } from "@/lib/pricing";

const store = { delivery_fee: 250, free_delivery_over: 3000 };

describe("delivery charges", () => {
  it("charges Rs 250 below Rs 3000", () => {
    expect(deliveryFeeFor(2999, store)).toBe(250);
    expect(orderTotal(1000, store)).toBe(1250);
  });
  it("is free at Rs 3000 and above", () => {
    expect(deliveryFeeFor(3000, store)).toBe(0);
  });
  it("never free when threshold is 0", () => {
    expect(deliveryFeeFor(10000, { delivery_fee: 300, free_delivery_over: 0 })).toBe(300);
  });
});

describe("clinic rules", () => {
  it("is closed on Sunday", () => {
    expect(isClinicDay(new Date(2026, 0, 4))).toBe(false); // Sunday
    expect(isClinicDay(new Date(2026, 0, 5))).toBe(true); // Monday
  });
  it("accepts Pakistani mobile formats", () => {
    expect(isValidPkMobile("0333-0501084")).toBe(true);
    expect(isValidPkMobile("+92 333 0501084")).toBe(true);
    expect(isValidPkMobile("12345")).toBe(false);
  });
});
