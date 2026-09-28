import type {
  DogStatus,
  DogSize,
  DogGender,
  ApplicationStatus,
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
