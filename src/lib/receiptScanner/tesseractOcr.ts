import { createWorker } from 'tesseract.js';

/**
 * Melakukan pre-processing pada gambar di Canvas HTML5 untuk meningkatkan kontras,
 * mengubah ke grayscale, dan menajamkan karakter angka struk/m-banking.
 */
export async function preprocessImageForOcr(file: File | Blob | string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Skala gambar optimal untuk OCR (lebar 1200px - 1600px)
      const maxDim = 1500;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(typeof file === 'string' ? file : URL.createObjectURL(file));
        return;
      }

      // Gambar ke canvas
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;

        // Grayscale + Adaptive Contrast Boost
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] ?? 0;
          const g = d[i + 1] ?? 0;
          const b = d[i + 2] ?? 0;
          // Luminance formula
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Tingkatkan kontras agar tulisan hitam di latar biru/kuning m-banking terlihat tajam
          gray = (gray - 128) * 1.35 + 128;
          gray = Math.min(255, Math.max(0, gray));

          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      }
    };

    img.onerror = () => {
      resolve(typeof file === 'string' ? file : URL.createObjectURL(file));
    };

    if (typeof file === 'string') {
      img.src = file;
    } else {
      img.src = URL.createObjectURL(file);
    }
  });
}

/**
 * Menjalankan OCR lokal menggunakan Tesseract.js (WebAssembly) tanpa API AI.
 * Mengembalikan seluruh teks yang berhasil diekstraksi dari bukti transfer.
 */
export async function performOcr(
  imageSource: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  const processedImageUrl = await preprocessImageForOcr(imageSource);

  // Buat worker Tesseract untuk bahasa Indonesia & Inggris
  const worker = await createWorker('ind+eng', 1, {
    logger: (m: any) => {
      if (onProgress && typeof m.progress === 'number') {
        const pct = Math.round(m.progress * 100);
        onProgress(pct, m.status || 'Membaca teks...');
      }
    }
  });

  try {
    const ret = await worker.recognize(processedImageUrl);
    await worker.terminate();
    return ret.data.text || '';
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}
