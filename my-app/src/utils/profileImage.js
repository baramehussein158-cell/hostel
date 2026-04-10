const MAX_PROFILE_IMAGE_DIMENSION = 1600;
const MAX_PROFILE_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const DIRECT_PROFILE_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_IMAGE_BYTES = 900 * 1024;
const PROFILE_IMAGE_OUTPUT_TYPE = 'image/jpeg';
const PROFILE_IMAGE_OUTPUT_EXTENSION = 'jpg';

const formatFileSize = (bytes) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
};

const createCompressedFileName = (fileName) => {
  const normalizedFileName = fileName || 'profile-image';
  const lastDotIndex = normalizedFileName.lastIndexOf('.');
  const baseName = lastDotIndex > 0 ? normalizedFileName.slice(0, lastDotIndex) : normalizedFileName;
  return `${baseName}.${PROFILE_IMAGE_OUTPUT_EXTENSION}`;
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to prepare the selected image.'));
        return;
      }

      resolve(blob);
    }, type, quality);
  });

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read the selected image.'));
    };

    image.src = objectUrl;
  });

export const prepareProfileImageForUpload = async (file) => {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  if (file.size > MAX_PROFILE_IMAGE_UPLOAD_BYTES) {
    throw new Error(`This image is ${formatFileSize(file.size)}. Please choose one smaller than 10MB.`);
  }

  if (file.size <= DIRECT_PROFILE_IMAGE_UPLOAD_BYTES) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const resizeRatio = longestEdge > MAX_PROFILE_IMAGE_DIMENSION
    ? MAX_PROFILE_IMAGE_DIMENSION / longestEdge
    : 1;

  const targetWidth = Math.max(1, Math.round(image.naturalWidth * resizeRatio));
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * resizeRatio));
  const shouldCompress = resizeRatio < 1 || file.size > MAX_PROFILE_IMAGE_BYTES;

  if (!shouldCompress) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to prepare the selected image.');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  let quality = 0.88;
  let blob = await canvasToBlob(canvas, PROFILE_IMAGE_OUTPUT_TYPE, quality);

  while (blob.size > MAX_PROFILE_IMAGE_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, PROFILE_IMAGE_OUTPUT_TYPE, quality);
  }

  return new File([blob], createCompressedFileName(file.name), {
    type: PROFILE_IMAGE_OUTPUT_TYPE,
    lastModified: Date.now(),
  });
};

export const createProfilePreviewUrl = (file) => URL.createObjectURL(file);
