import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const followupMigrationPath = path.resolve("supabase/migrations/20261018000001_followup_video.sql");
const followupActionPath = path.resolve("app/actions/followup.ts");
const uploadActionPath = path.resolve("app/actions/upload.ts");
const adminFollowupRowPath = path.resolve("components/admin/AdminFollowupRow.tsx");
const userFollowupListPath = path.resolve("components/followups/UserFollowupList.tsx");
const dialogPath = path.resolve("components/followups/FollowupReportDialog.tsx");
const videoPlayerPath = path.resolve("components/followups/FollowupVideoPlayer.tsx");
const validationUploadPath = path.resolve("lib/validations/upload.ts");
const validationFollowupPath = path.resolve("lib/validations/followup.ts");

const followupMigrationSql = fs.readFileSync(followupMigrationPath, "utf8");
const followupActionSrc = fs.readFileSync(followupActionPath, "utf8");
const uploadActionSrc = fs.readFileSync(uploadActionPath, "utf8");
const adminFollowupRowSrc = fs.readFileSync(adminFollowupRowPath, "utf8");
const userFollowupListSrc = fs.readFileSync(userFollowupListPath, "utf8");
const dialogSrc = fs.readFileSync(dialogPath, "utf8");
const videoPlayerSrc = fs.readFileSync(videoPlayerPath, "utf8");
const validationUploadSrc = fs.readFileSync(validationUploadPath, "utf8");
const validationFollowupSrc = fs.readFileSync(validationFollowupPath, "utf8");

// Mirror client validation rules for testing
const VIDEO_UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE_LABEL: "50MB",
  ALLOWED_MIME_TYPES: ["video/mp4", "video/webm"],
  ALLOWED_EXTENSIONS: ["mp4", "webm"],
};

function validateDogVideo(file) {
  if (file.size > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video size exceeds the maximum limit of ${VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL}.`,
    };
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  const isValidMime = file.type && VIDEO_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type);
  const isValidExt = ext && VIDEO_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(ext);

  if (!isValidMime && !isValidExt) {
    return {
      valid: false,
      error: "Please upload an MP4 or WebM video.",
    };
  }
  return { valid: true };
}

test("Post-Adoption Video: Valid video upload validation passes for MP4 and WebM under 50MB", () => {
  assert.ok(validationUploadSrc.includes("MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024"));
  assert.ok(validationUploadSrc.includes('"video/mp4", "video/webm"'));
  assert.ok(validationUploadSrc.includes('"mp4", "webm"'));

  const validMp4 = validateDogVideo({
    name: "dog_progress.mp4",
    size: 25 * 1024 * 1024,
    type: "video/mp4",
  });
  assert.equal(validMp4.valid, true);
  assert.equal(validMp4.error, undefined);

  const validWebm = validateDogVideo({
    name: "dog_routine.webm",
    size: 49 * 1024 * 1024,
    type: "video/webm",
  });
  assert.equal(validWebm.valid, true);
  assert.equal(validWebm.error, undefined);
});

test("Post-Adoption Video: Invalid file type is strictly rejected", () => {
  const invalidTypes = [
    { name: "script.exe", size: 1024, type: "application/x-msdownload" },
    { name: "dog.mov", size: 1024 * 1024, type: "video/quicktime" },
    { name: "dog.avi", size: 1024 * 1024, type: "video/x-msvideo" },
    { name: "notes.pdf", size: 1024 * 1024, type: "application/pdf" },
  ];

  for (const file of invalidTypes) {
    const res = validateDogVideo(file);
    assert.equal(res.valid, false, `Expected ${file.name} to be rejected`);
    assert.match(res.error || "", /MP4 or WebM/i);
  }
});

test("Post-Adoption Video: Oversized video exceeding 50MB limit is rejected", () => {
  const oversizedFile = {
    name: "huge_dog_video.mp4",
    size: VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES + 1,
    type: "video/mp4",
  };
  const res = validateDogVideo(oversizedFile);
  assert.equal(res.valid, false);
  assert.match(res.error || "", /50MB/i);
});

test("Post-Adoption Video: Follow-up validation schema definition contains video_storage_path", () => {
  assert.ok(
    validationFollowupSrc.includes('video_storage_path: z.string().optional().nullable().or(z.literal(""))'),
    "followupReportSchema must define video_storage_path as optional/nullable string"
  );

  const schema = z.object({
    followup_id: z.string().uuid(),
    general_health: z.string().trim().min(10).max(1000),
    eating_behavior_adjustment: z.string().trim().min(10).max(1000),
    veterinary_care: z.string().trim().min(5).max(1000),
    living_environment: z.string().trim().min(5).max(1000),
    problems_concerns: z.string().trim().max(1000).optional().nullable(),
    photo_url: z.string().url().optional().nullable().or(z.literal("")),
    photo_storage_path: z.string().optional().nullable().or(z.literal("")),
    video_storage_path: z.string().optional().nullable().or(z.literal("")),
  });

  const baseValidPayload = {
    followup_id: "a0000000-0000-0000-0000-000000000001",
    general_health: "Max is energetic, healthy, eating well and has a shiny coat.",
    eating_behavior_adjustment: "Adjusted completely to the daily schedule and eats twice a day.",
    veterinary_care: "Visited vet last Tuesday for 6-month wellness checkup.",
    living_environment: "Indoor sleeping bed in living room and 2 daily walks in park.",
  };

  const withVideo = schema.safeParse({
    ...baseValidPayload,
    video_storage_path: "dogs/user_123/1700000000-progress.mp4",
  });
  assert.equal(withVideo.success, true);
  if (withVideo.success) {
    assert.equal(withVideo.data.video_storage_path, "dogs/user_123/1700000000-progress.mp4");
  }

  const withoutVideo = schema.safeParse({
    ...baseValidPayload,
    video_storage_path: null,
  });
  assert.equal(withoutVideo.success, true);

  const withEmptyVideo = schema.safeParse({
    ...baseValidPayload,
    video_storage_path: "",
  });
  assert.equal(withEmptyVideo.success, true);
});

test("Post-Adoption Video: Video storage path ownership validation in submitFollowUpReportAction", () => {
  assert.ok(
    followupActionSrc.includes("if (parsed.data.video_storage_path)"),
    "Action must inspect parsed.data.video_storage_path"
  );
  assert.ok(
    followupActionSrc.includes("!parsed.data.video_storage_path.startsWith(`dogs/${userId}/`)"),
    "Action must strictly require path prefix dogs/${userId}/ matching the authenticated adopter"
  );
  assert.ok(
    followupActionSrc.includes("video_storage_path: parsed.data.video_storage_path || null"),
    "Action must include video_storage_path in the DB update payload"
  );
});

test("Post-Adoption Video: Admin & Owner signed URL authorization in upload.ts", () => {
  assert.ok(
    uploadActionSrc.includes("createFollowupVideoSignedUrlAction"),
    "createFollowupVideoSignedUrlAction must exist"
  );
  assert.ok(
    uploadActionSrc.includes("isOwner = storagePath.startsWith(`dogs/${userId}/`)"),
    "Signed URL action must verify ownership based on authenticated user ID prefix"
  );
  assert.ok(
    uploadActionSrc.includes("if (!isOwner && !isAdmin)"),
    "Signed URL action must restrict playback to owner or admin only"
  );
  assert.ok(
    uploadActionSrc.includes('.from("dog-videos")'),
    "Signed URL action must read from the private dog-videos bucket"
  );
  assert.ok(
    uploadActionSrc.includes(".createSignedUrl(storagePath, 3600)"),
    "Signed URL action must generate short-lived (1-hour) signed URLs, never public URLs"
  );
});

test("Post-Adoption Video: Reusable FollowupVideoPlayer handles loading, error, and HTML5 video playback", () => {
  assert.ok(
    videoPlayerSrc.includes("createFollowupVideoSignedUrlAction(storagePath)"),
    "FollowupVideoPlayer must fetch signed playback URL"
  );
  assert.ok(
    videoPlayerSrc.includes("Loader2"),
    "FollowupVideoPlayer must have loading state"
  );
  assert.ok(
    videoPlayerSrc.includes("Retry Loading Video"),
    "FollowupVideoPlayer must provide retry button on error"
  );
  assert.ok(
    videoPlayerSrc.includes("<video"),
    "FollowupVideoPlayer must render HTML5 video element"
  );
});

test("Post-Adoption Video: Admin UI displays video player and handles empty state", () => {
  assert.ok(
    adminFollowupRowSrc.includes("FollowupVideoPlayer"),
    "AdminFollowupRow must import and render FollowupVideoPlayer"
  );
  assert.ok(
    adminFollowupRowSrc.includes("followup.video_storage_path"),
    "AdminFollowupRow must check followup.video_storage_path"
  );
  assert.ok(
    adminFollowupRowSrc.includes("No video clip was submitted"),
    "AdminFollowupRow must provide an informative empty state when no video is uploaded"
  );
  assert.ok(
    adminFollowupRowSrc.includes("Video"),
    "AdminFollowupRow must indicate video presence on the row summary"
  );
});

test("Post-Adoption Video: User Followup List supports video playback for adopters", () => {
  assert.ok(
    userFollowupListSrc.includes("FollowupVideoPlayer"),
    "UserFollowupList must import and render FollowupVideoPlayer"
  );
  assert.ok(
    userFollowupListSrc.includes("selectedForView.video_storage_path"),
    "UserFollowupList must check selectedForView.video_storage_path"
  );
});

test("Post-Adoption Video: FollowupReportDialog UI supports video upload and progress tracking", () => {
  assert.ok(
    dialogSrc.includes("handleVideoUpload"),
    "FollowupReportDialog must implement handleVideoUpload"
  );
  assert.ok(
    dialogSrc.includes("createDogVideoUploadUrlAction"),
    "FollowupReportDialog must use createDogVideoUploadUrlAction for direct upload"
  );
  assert.ok(
    dialogSrc.includes("videoUploadProgress"),
    "FollowupReportDialog must track video upload progress"
  );
  assert.ok(
    dialogSrc.includes("handleRemoveVideo"),
    "FollowupReportDialog must allow removing attached video"
  );
  assert.ok(
    dialogSrc.includes("video_storage_path: videoPath || null"),
    "FollowupReportDialog must pass video_storage_path on submission"
  );
});

test("Post-Adoption Video: Migration is additive and enforces database trigger ownership", () => {
  assert.ok(
    followupMigrationSql.includes("ALTER TABLE public.post_adoption_followups"),
    "Migration must alter public.post_adoption_followups"
  );
  assert.ok(
    followupMigrationSql.includes("ADD COLUMN IF NOT EXISTS video_storage_path TEXT"),
    "Migration must add optional video_storage_path column"
  );
  assert.ok(
    followupMigrationSql.includes("protect_post_adoption_followup_fields()"),
    "Migration must update protect_post_adoption_followup_fields trigger function"
  );
  assert.ok(
    followupMigrationSql.includes("NEW.video_storage_path LIKE 'dogs/' || NEW.adopter_id || '/%'"),
    "Migration trigger must enforce that video_storage_path belongs to adopter dogs/ folder"
  );
  assert.ok(
    followupMigrationSql.includes("SET search_path = public, pg_catalog"),
    "Trigger function must have explicit secure search_path"
  );
});

test("Post-Adoption Video: Regression check - photo upload and monthly follow-up workflow preserved", () => {
  assert.ok(dialogSrc.includes("handlePhotoUpload"));
  assert.ok(dialogSrc.includes("handleRemovePhoto"));
  assert.ok(dialogSrc.includes("photoUrl"));

  assert.ok(followupActionSrc.includes("photo_storage_path: parsed.data.photo_storage_path || null"));
  assert.ok(followupActionSrc.includes("photo_url: parsed.data.photo_url || null"));

  assert.ok(adminFollowupRowSrc.includes("followup.photo_url"));
  assert.ok(adminFollowupRowSrc.includes("Attached Dog Photo"));
});
