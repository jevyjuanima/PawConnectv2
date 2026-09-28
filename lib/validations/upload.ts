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
