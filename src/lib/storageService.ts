import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Mengompresi file gambar di browser menggunakan Canvas HTML5.
 * Mengurangi ukuran file foto kamera/galeri dari 5MB-10MB menjadi ~100-250KB JPEG
 * dengan resolusi tajam (max sisi 1600px).
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering context 2D tidak tersedia.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Gagal mengompresi gambar.'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Gagal memuat elemen gambar.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file lokal.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Mengunggah file bukti kwitansi / invoice ke Firebase Cloud Storage.
 * Otomatis terkompresi. Memiliki fallback Base64 jika koneksi storage terkendala.
 */
export async function uploadReceiptImage(
  file: File,
  folder = 'receipts'
): Promise<string> {
  try {
    const compressedBlob = await compressImage(file);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${Date.now()}_${sanitizedName}.jpg`;
    const storageRef = ref(storage, path);

    const snapshot = await uploadBytes(storageRef, compressedBlob, {
      contentType: 'image/jpeg'
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageErr) {
    console.warn('Firebase Storage upload gagal, beralih ke fallback Base64:', storageErr);
    // Fallback: simpan dalam bentuk string base64 terkompresi
    const compressedBlob = await compressImage(file, 1200, 0.7);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedBlob);
    });
  }
}
