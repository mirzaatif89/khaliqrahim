// Original Lovable uploads bundled locally so images work without its asset proxy.
export const SITE_IMAGES = {
  doctor: "/images/site/dr-khaliq-rahim.jpg",
  secondDoctor: "/images/site/Dr%20Ghulam%20Shabber%20Awan.jpeg",
  logoLeaf: "/images/site/krmc-logo-leaf.png",
  logo: "/images/site/krmc-logo.jpg",
} as const;

const legacyImages: Record<string, string> = {
  "/__l5e/assets-v1/aa499bea-c591-41c1-8a3c-d47c53f971c6/dr-khaliq-rahim.jpg": SITE_IMAGES.doctor,
  "/__l5e/assets-v1/08ed534f-0428-427e-b814-f873616477bb/krmc-logo-leaf.png": SITE_IMAGES.logoLeaf,
  "/__l5e/assets-v1/374c199c-470a-4f96-a753-6d7464c3de3b/krmc-logo.jpg": SITE_IMAGES.logo,
};

export function bundledImage(path: string): string | undefined {
  return legacyImages[path];
}
