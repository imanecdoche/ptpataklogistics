/**
 * Helper untuk memetakan nama jenis material ke asset icon 1:1 resmi
 * Terletak di public/images/materials/
 */
export function getMaterialIconSrc(name: string): string {
  if (!name) return '/images/materials/batu belah.jpg';
  const lower = name.toLowerCase();
  if (lower.includes('batu belah')) return '/images/materials/batu belah.jpg';
  if (lower.includes('pasir')) return '/images/materials/pasir extra cor.jpg';
  if (lower.includes('abu batu') || lower.includes('screen')) return '/images/materials/abu batu screen.jpeg';
  if (lower.includes('makadam') || lower.includes('base course')) return '/images/materials/makadam.jpg';
  return '/images/materials/batu belah.jpg';
}
