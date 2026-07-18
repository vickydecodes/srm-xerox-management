
export type Role = 'staff' | 'department' | 'super_admin';

export interface AuthUser {
  id: string;
  branch: string;
  permissions: string[];
  role: Role;
  batches?: string[] | { _id: string }[];
  standard?: string | { _id: string };
}
