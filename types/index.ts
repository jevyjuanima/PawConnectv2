import type {
  DogStatus,
  DogSize,
  DogGender,
  ApplicationStatus,
  ScreeningStatus,
  FollowupStatus,
  UserRole,
} from "@/lib/constants/statuses";

export interface ProfileRecord {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogRecord {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  age_years: number;
  age_months: number;
  gender: DogGender;
  size: DogSize;
  color: string | null;
  description: string;
  medical_history: string | null;
  vaccinated: boolean;
  spayed_neutered: boolean;
  special_needs: string | null;
  location: string;
  status: DogStatus;
  rejection_reason: string | null;
  video_url?: string | null;
  video_storage_path?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogImageRecord {
  id: string;
  dog_id: string;
  storage_path: string;
  public_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface DogWithImages extends DogRecord {
  images: DogImageRecord[];
  primary_image?: string;
  owner?: Partial<ProfileRecord>;
}

export interface HouseholdScreeningRecord {
  id: string;
  application_id: string;
  applicant_id: string;
  dog_id: string;
  status: ScreeningStatus;
  household_agreement: boolean;
  housing_type: string;
  landlord_permission: boolean | null;
  has_children: boolean;
  children_details: string | null;
  household_members_details: string;
  existing_pets_details: string | null;
  pet_care_experience: string;
  daily_alone_hours: number;
  daily_care_arrangements: string;
  emergency_vet_care_plan: string;
  screening_consent: boolean;
  reviewer_id: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface HouseholdScreeningReviewRecord {
  id: string;
  screening_id: string;
  reviewer_id: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HouseholdScreeningWithDetails extends HouseholdScreeningRecord {
  dog?: DogWithImages;
  applicant?: ProfileRecord;
  reviewer?: ProfileRecord;
  review?: HouseholdScreeningReviewRecord;
}

export interface AdoptionApplicationRecord {
  id: string;
  dog_id: string;
  applicant_id: string;
  housing_type: string;
  has_yard: boolean;
  has_other_pets: boolean;
  other_pets_details: string | null;
  household_members_count: number;
  experience_level: string;
  reason_for_adopting: string;
  status: ApplicationStatus;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithDetails extends AdoptionApplicationRecord {
  dog: DogWithImages;
  applicant: ProfileRecord;
  screening?: HouseholdScreeningRecord | null;
}

export interface PostAdoptionFollowupRecord {
  id: string;
  application_id: string;
  dog_id: string;
  adopter_id: string;
  month_number: number;
  due_date: string;
  status: FollowupStatus;
  submitted_at: string | null;
  general_health: string | null;
  eating_behavior_adjustment: string | null;
  veterinary_care: string | null;
  living_environment: string | null;
  problems_concerns: string | null;
  photo_url: string | null;
  photo_storage_path: string | null;
  video_storage_path: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  requires_additional_followup: boolean;
  additional_followup_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostAdoptionFollowupReviewRecord {
  id: string;
  followup_id: string;
  reviewer_id: string;
  admin_notes: string | null;
  requires_additional_followup: boolean;
  additional_followup_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowupWithDetails extends PostAdoptionFollowupRecord {
  dog?: DogWithImages;
  adopter?: ProfileRecord;
  reviewer?: ProfileRecord;
  application?: AdoptionApplicationRecord;
  review?: PostAdoptionFollowupReviewRecord;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "application_status" | "rehome_status" | "system";
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type ActionResponse<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

