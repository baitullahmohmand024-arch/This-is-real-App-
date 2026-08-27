import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Helper to convert File or Blob to base64 Data URL (safe resilient fallback)
export const fileToDataUrl = (file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Compress image before upload/storage to ensure optimal speed and low storage usage
export const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Upload media file: tries Firebase Storage first, falls back gracefully to compressed Data URL
export const uploadMediaFile = async (
  file: Blob | File,
  folder = 'media',
  onProgress?: (percent: number) => void
): Promise<string> => {
  try {
    const extension = (file as File).name ? (file as File).name.split('.').pop() : 'bin';
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const storageRef = ref(storage, filename);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        async (error) => {
          console.warn('Storage upload error, using inline fallback:', error);
          try {
            const dataUrl = await fileToDataUrl(file);
            resolve(dataUrl);
          } catch (e) {
            reject(error);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            const dataUrl = await fileToDataUrl(file);
            resolve(dataUrl);
          }
        }
      );
    });
  } catch (error) {
    console.warn('Fallback to direct data URL due to:', error);
    return await fileToDataUrl(file);
  }
};
