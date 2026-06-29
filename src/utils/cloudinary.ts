/**
 * Utility for uploading files to Cloudinary with progress tracking.
 */

export interface CloudinaryUploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  onProgress?: (percent: number) => void;
}

/**
 * Uploads a file/blob to Cloudinary using XMLHttpRequest for real-time progress.
 * 
 * @param file The file or blob to upload.
 * @param resourceType The resource type ("image" or "video"). Audio files use "video".
 * @param options Upload configuration and progress callbacks.
 */
export function uploadToCloudinary(
  file: File | Blob,
  resourceType: "image" | "video",
  options: CloudinaryUploadOptions = {}
): Promise<string> {
  const cloudName = options.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = options.uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return Promise.reject(
      new Error(
        "Cloudinary is not fully configured. Please ensure VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET are set in your environment variables (.env)."
      )
    );
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    xhr.open("POST", url, true);

    // Track upload progress in real-time
    if (xhr.upload && options.onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress!(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url);
          } else {
            reject(new Error("Cloudinary response missing 'secure_url' attribute."));
          }
        } catch (e) {
          reject(new Error("Failed to parse Cloudinary JSON response."));
        }
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText);
          reject(new Error(errResponse.error?.message || `Cloudinary rejected with status ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Cloudinary rejected with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("A network error occurred while uploading to Cloudinary."));
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    xhr.send(formData);
  });
}
