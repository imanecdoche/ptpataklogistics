import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Mengompresi file gambar di browser secara kilat (<100ms) menggunakan Canvas HTML5.
 * Mengubah foto kamera/galeri resolusi tinggi (5MB-15MB) menjadi data gambar ~50KB-120KB
 * dengan teks kwitansi yang tetap sangat tajam dan jelas terbaca.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1100,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Timeout pengaman agar tidak pernah stuck jika browser gagal memproses format tertentu
    const timeout = setTimeout(() => {
      reject(new Error('Waktu pemrosesan gambar habis. Format gambar mungkin tidak didukung.'));
    }, 8000);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      clearTimeout(timeout);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

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
          URL.revokeObjectURL(objectUrl);
          // Fallback langsung baca file jika canvas tidak tersedia
          const fallbackReader = new FileReader();
          fallbackReader.onload = () => resolve(fallbackReader.result as string);
          fallbackReader.onerror = () => reject(new Error('Gagal membaca gambar.'));
          fallbackReader.readAsDataURL(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        URL.revokeObjectURL(objectUrl);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Format gambar tidak dapat dibaca oleh browser.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Mengubah Data URL (Base64) menjadi Blob secara efisien di memori.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0] ? parts[0].match(/:(.*?);/) : null;
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const rawBase64 = parts[1] || '';
  const binaryStr = atob(rawBase64);
  const len = binaryStr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Mengunggah file bukti kwitansi / invoice.
 * - Kompresi Canvas instan (<100ms).
 * - Coba unggah ke Firebase Cloud Storage dengan timeout cepat 2 detik.
 * - Jika Firebase Storage lambat, offline, atau terkendala izin/bucket,
 *   langsung kembalikan Data URL terkompresi (~50KB) yang aman disimpan di Firestore/Local.
 * - Pengguna dijamin TIDAK PERNAH STUCK di layar unggah!
 */
export async function uploadReceiptImage(
  file: File,
  folder = 'receipts'
): Promise<string> {
  // 1. Kompresi instan terlebih dahulu
  const compressedDataUrl = await compressImageToDataUrl(file);

  // 2. Coba simpan ke Firebase Cloud Storage dengan batas waktu (timeout) 2.5 detik
  try {
    const uploadPromise = (async () => {
      const blob = dataUrlToBlob(compressedDataUrl);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${sanitizedName}.jpg`;
      const storageRef = ref(storage, filePath);

      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg'
      });
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 2500)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    return downloadUrl;
  } catch {
    // Jika upload ke Storage timeout atau gagal, gunakan compressedDataUrl langsung!
    // Ukurannya hanya ~50KB sehingga 100% aman dan instan untuk disimpan.
    return compressedDataUrl;
  }
}
