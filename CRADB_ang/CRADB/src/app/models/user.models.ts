export interface UserResponse {
  Id: number;
  EmployeeId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Role: string;
  LocationId?: number;
  DepartmentId?: number;
  Title?: string;
  IsActive: boolean;
  LastLoginAt?: Date;
  CreatedAt: Date;
  ProfileImage?: string;
}