import { bundledImage } from "./site-images";

export type DoctorProfile = {
  name: string;
  title: string;
  qualifications: string[];
  photo_url: string;
  intro: string;
};

export type ClinicContent = {
  name: string;
  doctor_name: string;
  doctor_title: string;
  experience_years: number;
  qualifications: string[];
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  maps_url: string;
  hours: string;
  holiday: string;
  fees: { consultation: number; follow_up: number; online: string };
  social: { facebook: string; instagram: string; tiktok: string; youtube: string };
  doctor_photo_url: string;
  logo_url: string;
  certificate_url: string;
  second_doctor: DoctorProfile;
};
export type HomeContent = {
  announcement: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_highlight: string;
  hero_subtitle: string;
};
export type AboutContent = { doctor_intro: string; mission: string; vision: string };
export type StoreContent = {
  delivery_fee: number;
  free_delivery_over: number;
  delivery_time: string;
  jazzcash_number: string;
  jazzcash_title: string;
  easypaisa_number: string;
  easypaisa_title: string;
  bank_name: string;
  bank_account_title: string;
  bank_account_number: string;
  bank_iban: string;
};
export type SiteContent = { clinic: ClinicContent; home: HomeContent; about: AboutContent; store: StoreContent };

export const DEFAULT_CONTENT: SiteContent = {
  clinic: {
    name: "Khaliq Rahim Medical Center",
    doctor_name: "Dr. Khaliq Rahim",
    doctor_title: "Homeopathic Specialist · Physician & Consultant",
    experience_years: 30,
    qualifications: [
      "Ph.D (I.Land)",
      "Doctorate of Medicine (U.K)",
      "D.I.HOM (UK)",
      "B.H.M.S — University of Peshawar",
      "DHMS (PAK)",
      "Ex. Medical Officer IHMC (IBD)",
    ],
    phone: "0333-0501084",
    whatsapp: "923330501084",
    email: "khaliqrahimmedicalcenter@gmail.com",
    address: "Kiyani Road, Near Athal Chowk, Bhara Kahu, Islamabad",
    city: "Bhara Kahu, Islamabad",
    maps_url: "https://maps.app.goo.gl/M8nBCR6EZgvxMCYk6",
    hours: "Monday – Saturday, 9:00 AM – 8:00 PM",
    holiday: "Sunday closed",
    fees: { consultation: 1000, follow_up: 500, online: "Depends on case" },
    social: {
      facebook: "https://www.facebook.com/share/1FBG3Zmdbm/",
      instagram: "https://www.instagram.com/krhomeomedical",
      tiktok: "https://www.tiktok.com/@krhomeo",
      youtube: "",
    },
    doctor_photo_url: "",
    logo_url: "",
    certificate_url: "",
    second_doctor: {
      name: "Dr. Ghulam Shabber Awan",
      title: "Homeopathic Consultant",
      qualifications: ["DHMS — Islamabad", "R.H.M.S — Islamabad"],
      photo_url: "/images/site/Dr%20Ghulam%20Shabber%20Awan.jpeg",
      intro: "Available for homeopathic consultations at Khaliq Rahim Medical Center.",
    },
  },
  home: {
    announcement: "Order medicines online · Home delivery across Pakistan · Cash on Delivery · WhatsApp 0333-0501084",
    hero_eyebrow: "Homeopathic Clinic & Medicine Store · Islamabad",
    hero_title: "Gentle healing,",
    hero_highlight: "for the whole you.",
    hero_subtitle:
      "Individualized homeopathic treatment by our doctors. Consult in clinic or online, then order prescribed medicines with home delivery across Pakistan.",
  },
  about: { doctor_intro: "", mission: "", vision: "" },
  store: {
    delivery_fee: 250,
    free_delivery_over: 3000,
    delivery_time: "2–4 working days across Pakistan",
    jazzcash_number: "",
    jazzcash_title: "",
    easypaisa_number: "",
    easypaisa_title: "",
    bank_name: "",
    bank_account_title: "",
    bank_account_number: "",
    bank_iban: "",
  },
};

export function mergeContent(rows: { key: string; value: unknown }[]): SiteContent {
  const out = structuredClone(DEFAULT_CONTENT) as SiteContent;
  for (const r of rows) {
    if (r.key in out && r.value && typeof r.value === "object") {
      const k = r.key as keyof SiteContent;
      (out as Record<string, unknown>)[k] = { ...(out[k] as object), ...(r.value as object) };
    }
  }
  return out;
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Turn a stored media path into a URL the browser can load. */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  const bundled = bundledImage(path);
  if (bundled) return bundled;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/api/public/media/${path}`;
}
