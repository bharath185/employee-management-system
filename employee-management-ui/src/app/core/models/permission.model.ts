export interface RolePermission {
  id?: number;
  role: string;
  resource: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PermissionMatrix {
  [role: string]: RolePermission[];
}
