/**
 * Photo Upload Security & Regression Test Suite
 *
 * Verifies the direct browser-to-Supabase signed upload URL pattern for dog photos:
 *   - createDogPhotoUploadUrlAction (server action — issues signed URL from file metadata)
 *   - deleteDogPhotoAction (server action — owner/admin-only deletion)
 *
 * These are static source-analysis tests consistent with the existing test suite.
 * They inspect the implementation logic without requiring a live Supabase connection.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const uploadActionPath = path.resolve("app/actions/upload.ts");
const rehomeFormPath = path.resolve("components/rehome/RehomeForm.tsx");
const validationPath = path.resolve("lib/validations/upload.ts");
const nextConfigPath = path.resolve("next.config.ts");

const followupDialogPath = path.resolve("components/followups/FollowupReportDialog.tsx");
const dogsActionPath = path.resolve("app/actions/dogs.ts");

const uploadActionSrc = fs.readFileSync(uploadActionPath, "utf8");
const rehomeFormSrc = fs.readFileSync(rehomeFormPath, "utf8");
const followupDialogSrc = fs.readFileSync(followupDialogPath, "utf8");
const validationSrc = fs.readFileSync(validationPath, "utf8");
const nextConfigSrc = fs.readFileSync(nextConfigPath, "utf8");
const dogsActionSrc = fs.readFileSync(dogsActionPath, "utf8");

// ---------------------------------------------------------------------------
// Mirror the production validation logic locally for unit-style assertions
// ---------------------------------------------------------------------------
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_LABEL: "5MB",
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp"],
};

function validateDogImage(file) {
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File size exceeds the limit of ${UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL}.` };
  }
  if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, and WebP image formats are permitted." };
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "Invalid file extension." };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// 1. Authentication guard
// ---------------------------------------------------------------------------
test("Photo Upload Security: Server action requires authentication before issuing a URL", () => {
  // Action must read userId from Clerk auth() — never from client input
  assert.ok(
    uploadActionSrc.includes("const { userId } = await auth();"),
    "createDogPhotoUploadUrlAction must call auth() to obtain userId"
  );
  assert.ok(
    uploadActionSrc.includes("Authentication required to upload photos"),
    "Action must return an auth error when userId is falsy"
  );
});

// ---------------------------------------------------------------------------
// 2. Server-side file metadata validation
// ---------------------------------------------------------------------------
test("Photo Upload Security: Server validates file metadata before issuing a signed URL", () => {
  assert.ok(
    uploadActionSrc.includes("validateDogImageFile(fileInfo)"),
    "createDogPhotoUploadUrlAction must call validateDogImageFile with the supplied metadata"
  );
  assert.ok(
    uploadActionSrc.includes("Invalid file"),
    "Action must return an error for invalid files"
  );
});

test("Photo Upload Validation: Valid JPEG, PNG, and WebP files under 5 MB are accepted", () => {
  const validFiles = [
    { name: "dog.jpg", size: 1 * 1024 * 1024, type: "image/jpeg" },
    { name: "dog.jpeg", size: 2 * 1024 * 1024, type: "image/jpeg" },
    { name: "dog.png", size: 3 * 1024 * 1024, type: "image/png" },
    { name: "dog.webp", size: 4 * 1024 * 1024, type: "image/webp" },
    { name: "dog.webp", size: 5 * 1024 * 1024, type: "image/webp" }, // exactly at limit
  ];
  for (const file of validFiles) {
    const res = validateDogImage(file);
    assert.equal(res.valid, true, `Expected ${file.name} (${file.type}) to be accepted`);
    assert.equal(res.error, undefined);
  }
});

test("Photo Upload Validation: Files larger than 5 MB are rejected", () => {
  const oversized = [
    { name: "large.jpg", size: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES + 1, type: "image/jpeg" },
    { name: "large.png", size: 10 * 1024 * 1024, type: "image/png" },
    { name: "large.webp", size: 6 * 1024 * 1024, type: "image/webp" },
  ];
  for (const file of oversized) {
    const res = validateDogImage(file);
    assert.equal(res.valid, false, `Expected ${file.name} to be rejected for size`);
    assert.match(res.error || "", /5MB/i);
  }
});

test("Photo Upload Validation: Unsupported MIME types are rejected", () => {
  const invalidTypes = [
    { name: "dog.gif", size: 1024, type: "image/gif" },
    { name: "dog.bmp", size: 1024, type: "image/bmp" },
    { name: "dog.tiff", size: 1024, type: "image/tiff" },
    { name: "document.pdf", size: 1024, type: "application/pdf" },
    { name: "script.exe", size: 1024, type: "application/x-msdownload" },
    { name: "archive.zip", size: 1024, type: "application/zip" },
    { name: "video.mp4", size: 1024, type: "video/mp4" },
  ];
  for (const file of invalidTypes) {
    const res = validateDogImage(file);
    assert.equal(res.valid, false, `Expected ${file.name} (${file.type}) to be rejected`);
    assert.match(res.error || "", /jpeg|png|webp/i);
  }
});

test("Photo Upload Validation: Unsupported file extensions are rejected", () => {
  const invalidExtensions = [
    { name: "photo.svg", size: 1024, type: "image/jpeg" },   // wrong ext despite correct MIME
    { name: "photo.heic", size: 1024, type: "image/heic" },
    { name: "photo.avif", size: 1024, type: "image/avif" },
    { name: "photo", size: 1024, type: "image/jpeg" },        // no extension
  ];
  for (const file of invalidExtensions) {
    const res = validateDogImage(file);
    assert.equal(res.valid, false, `Expected ${file.name} to be rejected for invalid extension`);
  }
});

// ---------------------------------------------------------------------------
// 3. Path scoping — server controls the storage path
// ---------------------------------------------------------------------------
test("Photo Upload Security: Storage path is server-controlled and scoped to dogs/{userId}/", () => {
  // The action constructs the path from the authenticated userId — client cannot choose it
  assert.ok(
    uploadActionSrc.includes("const storagePath = `dogs/${userId}/${cleanFileName}`"),
    "createDogPhotoUploadUrlAction must lock storagePath to dogs/{userId}/"
  );
});

test("Photo Upload Security: Signed URL targets the dog-photos bucket specifically", () => {
  assert.ok(
    uploadActionSrc.includes('.from("dog-photos")'),
    "createDogPhotoUploadUrlAction must target the dog-photos bucket"
  );
  assert.ok(
    uploadActionSrc.includes("createSignedUploadUrl(storagePath)"),
    "Action must use createSignedUploadUrl, not direct upload"
  );
});

test("Photo Upload Security: No secret key is returned to the client", () => {
  // The admin client is used server-side to call createSignedUploadUrl().
  // The response only contains the signed URL and token — not the secret key.
  assert.ok(
    !uploadActionSrc.includes("SUPABASE_SECRET_KEY"),
    "upload.ts must NOT return SUPABASE_SECRET_KEY to the caller"
  );
  assert.ok(
    uploadActionSrc.includes("createAdminSupabaseClient"),
    "Admin client is used server-side to sign the upload URL"
  );
});

// ---------------------------------------------------------------------------
// 4. Photo deletion — ownership check
// ---------------------------------------------------------------------------
test("Photo Upload Security: deleteDogPhotoAction requires authentication", () => {
  assert.ok(
    uploadActionSrc.includes("deleteDogPhotoAction"),
    "deleteDogPhotoAction must exist in upload.ts"
  );
  // Auth guard — same pattern as deleteDogVideoAction
  assert.ok(
    uploadActionSrc.includes("Authentication required"),
    "deleteDogPhotoAction must return auth error when unauthenticated"
  );
});

test("Photo Upload Security: deleteDogPhotoAction enforces ownership — only owner or admin may delete", () => {
  assert.ok(
    uploadActionSrc.includes("Unauthorized to delete this photo"),
    "deleteDogPhotoAction must reject unauthorized delete attempts"
  );
  // The ownership check uses the same pattern as deleteDogVideoAction
  assert.ok(
    uploadActionSrc.includes("isOwner = storagePath.startsWith(`dogs/${userId}/`)"),
    "deleteDogPhotoAction must restrict deletion to paths owned by the authenticated user"
  );
  assert.ok(
    uploadActionSrc.includes("if (!isOwner && !isAdmin)"),
    "deleteDogPhotoAction must allow admins to delete any photo"
  );
});

// ---------------------------------------------------------------------------
// 5. UI: direct upload pattern — no file bytes sent through Next.js
// ---------------------------------------------------------------------------
test("Photo Upload UI: RehomeForm uses createDogPhotoUploadUrlAction, not the old buffered action", () => {
  assert.ok(
    rehomeFormSrc.includes("createDogPhotoUploadUrlAction"),
    "RehomeForm must import and call createDogPhotoUploadUrlAction"
  );
  assert.ok(
    !rehomeFormSrc.includes("uploadDogPhotoAction"),
    "RehomeForm must NOT reference the old uploadDogPhotoAction"
  );
});

test("Photo Upload UI: RehomeForm sends file bytes directly to Supabase via XHR PUT", () => {
  assert.ok(
    rehomeFormSrc.includes("xhr.open(\"PUT\", signedUrl, true)"),
    "RehomeForm must PUT the file to the signed URL via XMLHttpRequest"
  );
  assert.ok(
    rehomeFormSrc.includes("xhr.setRequestHeader(\"Content-Type\", file.type)"),
    "RehomeForm must set Content-Type header for the PUT request"
  );
  assert.ok(
    rehomeFormSrc.includes("xhr.send(file)"),
    "RehomeForm must send the raw File object directly, not FormData"
  );
});

test("Photo Upload UI: RehomeForm records server-supplied publicUrl, not a client-constructed URL", () => {
  assert.ok(
    rehomeFormSrc.includes("url: publicUrl"),
    "RehomeForm must use the publicUrl from the server action response"
  );
});

test("Photo Upload UI: RehomeForm best-effort cleans up orphaned photos on removal", () => {
  assert.ok(
    rehomeFormSrc.includes("deleteDogPhotoAction"),
    "RehomeForm must import deleteDogPhotoAction for cleanup"
  );
  assert.ok(
    rehomeFormSrc.includes("deleteDogPhotoAction(photoToRemove.path)"),
    "removePhoto must call deleteDogPhotoAction with the removed photo path"
  );
});

test("Photo Upload UI: FollowupReportDialog uses createDogPhotoUploadUrlAction and bypasses Next.js server actions for photos", () => {
  assert.ok(
    followupDialogSrc.includes("createDogPhotoUploadUrlAction"),
    "FollowupReportDialog must import createDogPhotoUploadUrlAction"
  );
  assert.ok(
    !followupDialogSrc.includes("uploadDogPhotoAction"),
    "FollowupReportDialog must NOT reference the old uploadDogPhotoAction"
  );
  assert.ok(
    followupDialogSrc.includes("xhr.open(\"PUT\", signedUrl)"),
    "FollowupReportDialog must PUT the photo file directly to the Supabase signedUrl"
  );
});

// ---------------------------------------------------------------------------
// 6. next.config.ts — bodySizeLimit removed
// ---------------------------------------------------------------------------
test("Config: bodySizeLimit is removed since no Server Action buffers file bytes", () => {
  assert.ok(
    !nextConfigSrc.includes("bodySizeLimit"),
    "next.config.ts must NOT set bodySizeLimit — all uploads bypass Next.js"
  );
});

// ---------------------------------------------------------------------------
// 7. Validation constants in source
// ---------------------------------------------------------------------------
test("Photo Upload Validation: Source defines 5 MB limit and permitted MIME types", () => {
  assert.ok(
    validationSrc.includes("MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024"),
    "upload validation must define 5 MB limit"
  );
  assert.ok(
    validationSrc.includes("MAX_FILE_SIZE_LABEL: \"5MB\""),
    "upload validation must label the limit as 5MB"
  );
  assert.ok(
    validationSrc.includes('"image/jpeg"'),
    "upload validation must permit image/jpeg"
  );
  assert.ok(
    validationSrc.includes('"image/png"'),
    "upload validation must permit image/png"
  );
  assert.ok(
    validationSrc.includes('"image/webp"'),
    "upload validation must permit image/webp"
  );
});

// ---------------------------------------------------------------------------
// 8. Regression: video upload behavior unchanged
// ---------------------------------------------------------------------------
test("Regression: Video upload (createDogVideoUploadUrlAction) remains in upload.ts", () => {
  assert.ok(
    uploadActionSrc.includes("createDogVideoUploadUrlAction"),
    "createDogVideoUploadUrlAction must still exist"
  );
  assert.ok(
    uploadActionSrc.includes('.from("dog-videos")'),
    "Video upload must still target the dog-videos bucket"
  );
  assert.ok(
    uploadActionSrc.includes("createSignedUploadUrl(storagePath)"),
    "Video upload must still use signed upload URL pattern"
  );
});

test("Regression: deleteDogVideoAction remains in upload.ts", () => {
  assert.ok(
    uploadActionSrc.includes("deleteDogVideoAction"),
    "deleteDogVideoAction must still exist"
  );
  assert.ok(
    uploadActionSrc.includes("Unauthorized to delete this video"),
    "deleteDogVideoAction must still enforce ownership"
  );
});

test("Regression: createFollowupVideoSignedUrlAction remains in upload.ts", () => {
  assert.ok(
    uploadActionSrc.includes("createFollowupVideoSignedUrlAction"),
    "createFollowupVideoSignedUrlAction must still exist"
  );
  assert.ok(
    uploadActionSrc.includes(".createSignedUrl(storagePath, 3600)"),
    "Follow-up video action must still generate 1-hour signed URLs"
  );
});

test("Regression: Signed URL generation authorization checks preserved", () => {
  // Photo upload: path scoped by server
  assert.ok(uploadActionSrc.includes("const storagePath = `dogs/${userId}/${cleanFileName}`"));
  // Video upload: ownership check
  assert.ok(uploadActionSrc.includes("isOwner = storagePath.startsWith(`dogs/${userId}/`)"));
  // Admin or owner restriction
  assert.ok(uploadActionSrc.includes("if (!isOwner && !isAdmin)"));
});

// ---------------------------------------------------------------------------
// 9. Dog Listing Photo Ownership Hardening (Step 5E)
// ---------------------------------------------------------------------------

// Helper mirroring the server-side photo path validation logic for unit testing
function validatePhotoOwnershipPath(photoPath, userId) {
  if (!photoPath || typeof photoPath !== "string" || !photoPath.trim()) {
    return { valid: false, error: "Empty or invalid photo path" };
  }
  const permittedPrefix = `dogs/${userId}/`;
  if (!photoPath.startsWith(permittedPrefix)) {
    return { valid: false, error: "Photo does not belong to the user's namespace" };
  }
  if (photoPath.includes("..")) {
    return { valid: false, error: "Path traversal detected" };
  }
  return { valid: true };
}

test("Photo Ownership Validation: Valid photo path owned by current user is accepted", () => {
  const userId = "user_clerk_123";
  const validPath = `dogs/${userId}/1729384918234_abc123.jpg`;
  const result = validatePhotoOwnershipPath(validPath, userId);
  assert.equal(result.valid, true);
});

test("Photo Ownership Validation: Multiple legitimate photos owned by current user are accepted", () => {
  const userId = "user_clerk_123";
  const paths = [
    `dogs/${userId}/1729384918234_first.jpg`,
    `dogs/${userId}/1729384918235_second.png`,
    `dogs/${userId}/1729384918236_third.webp`,
  ];
  for (const p of paths) {
    const result = validatePhotoOwnershipPath(p, userId);
    assert.equal(result.valid, true, `Expected ${p} to be valid`);
  }
});

test("Photo Ownership Validation: Photo path belonging to another user is rejected", () => {
  const currentUserId = "user_clerk_123";
  const victimUserId = "user_clerk_456";
  const foreignPath = `dogs/${victimUserId}/stolen_photo.jpg`;
  const result = validatePhotoOwnershipPath(foreignPath, currentUserId);
  assert.equal(result.valid, false);
  assert.equal(result.error, "Photo does not belong to the user's namespace");
});

test("Photo Ownership Validation: Arbitrary and malformed storage paths are rejected", () => {
  const userId = "user_clerk_123";
  const malformedPaths = [
    "",
    "   ",
    null,
    undefined,
    `dogs/${userId}/../../etc/passwd`,
    `dogs/${userId}/../victim/photo.jpg`,
    `followups/${userId}/photo.jpg`, // Wrong bucket/namespace for dog listing
    "/absolute/root/photo.jpg",
    "random_string_without_folder.png",
    `dogs/other/${userId}/nested.jpg`,
  ];
  for (const p of malformedPaths) {
    const result = validatePhotoOwnershipPath(p, userId);
    assert.equal(result.valid, false, `Expected ${p} to be rejected`);
  }
});

test("Photo Ownership Source: createDogAction requires authentication before processing photos", () => {
  assert.ok(
    dogsActionSrc.includes("const { userId } = await auth();"),
    "createDogAction must authenticate user via Clerk"
  );
  assert.ok(
    dogsActionSrc.includes("if (!userId)"),
    "createDogAction must guard against unauthenticated callers"
  );
});

test("Photo Ownership Source: createDogAction validates all photo paths in imageUrls against permitted user prefix", () => {
  assert.ok(
    dogsActionSrc.includes("const permittedPhotoPrefix = `dogs/${userId}/`;"),
    "createDogAction must construct permittedPhotoPrefix using server-authenticated userId"
  );
  assert.ok(
    dogsActionSrc.includes("!photoPath.startsWith(permittedPhotoPrefix)"),
    "createDogAction must check that each photo path starts with permittedPhotoPrefix"
  );
  assert.ok(
    dogsActionSrc.includes('photoPath.includes("..")'),
    "createDogAction must reject path traversal sequences"
  );
  assert.ok(
    dogsActionSrc.includes("Unauthorized photo storage path: all photos must belong to the listing owner"),
    "createDogAction must return safe user-friendly error message on violation"
  );
});

test("Photo Ownership Source: Validation occurs before inserting new dog into database", () => {
  const validationIndex = dogsActionSrc.indexOf("const permittedPhotoPrefix = `dogs/${userId}/`;");
  const insertDogIndex = dogsActionSrc.indexOf('.from("dogs")\n      .insert(dogPayload)');
  assert.ok(validationIndex !== -1, "permittedPhotoPrefix check must be present");
  assert.ok(insertDogIndex !== -1, "insert(dogPayload) must be present");
  assert.ok(
    validationIndex < insertDogIndex,
    "Photo validation must execute BEFORE creating the dog record in the database"
  );
});

test("Photo Ownership Source: updateDogAction does not accept or mutate dog_images", () => {
  const updateDogIndex = dogsActionSrc.indexOf("export async function updateDogAction");
  const deleteDogIndex = dogsActionSrc.indexOf("export async function deleteDogAction");
  const updateDogSrc = dogsActionSrc.substring(updateDogIndex, deleteDogIndex);

  assert.ok(
    !updateDogSrc.includes("dog_images"),
    "updateDogAction must NOT write to dog_images table"
  );
  assert.ok(
    !updateDogSrc.includes("imageUrls"),
    "updateDogAction must NOT accept or process imageUrls parameter"
  );
});

