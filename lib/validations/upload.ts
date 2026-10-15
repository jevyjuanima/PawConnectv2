export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_LABEL: "5MB",
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const,
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp"] as const,
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDogImageFile(file: {
  size: number;
  type: string;
  name: string;
}): FileValidationResult {
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the limit of ${UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL}.`,
    };
  }

  if (
    !UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(
      file.type as (typeof UPLOAD_LIMITS.ALLOWED_MIME_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP image formats are permitted.",
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (
    !ext ||
    !UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(
      ext as (typeof UPLOAD_LIMITS.ALLOWED_EXTENSIONS)[number]
    )
  ) {
    return {
      valid: false,
      error: "Invalid file extension. Expected .jpg, .jpeg, .png, or .webp.",
    };
  }

  return { valid: true };
}

export const VIDEO_UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE_LABEL: "50MB",
  ALLOWED_MIME_TYPES: ["video/mp4", "video/webm"] as const,
  ALLOWED_EXTENSIONS: ["mp4", "webm"] as const,
};

export function validateDogVideoFile(file: {
  size: number;
  type: string;
  name: string;
}): FileValidationResult {
  if (file.size > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video size exceeds the maximum limit of ${VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL}.`,
    };
  }

  // Check MIME type or extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  const isValidMime =
    file.type &&
    VIDEO_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(
      file.type as (typeof VIDEO_UPLOAD_LIMITS.ALLOWED_MIME_TYPES)[number]
    );
  const isValidExt =
    ext &&
    VIDEO_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(
      ext as (typeof VIDEO_UPLOAD_LIMITS.ALLOWED_EXTENSIONS)[number]
    );

  if (!isValidMime && !isValidExt) {
    return {
      valid: false,
      error: "Only MP4 and WebM video formats are permitted.",
    };
  }

  if (
    !ext ||
    !VIDEO_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(
      ext as (typeof VIDEO_UPLOAD_LIMITS.ALLOWED_EXTENSIONS)[number]
    )
  ) {
    return {
      valid: false,
      error: "Invalid video file extension. Expected .mp4 or .webm.",
    };
  }

  return { valid: true };
}

