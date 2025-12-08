export enum UserRole {
  User = 'User',
  Admin = 'Admin'
}

export enum SessionStatus {
  Reserved = 'Reserved',
  CheckedIn = 'CheckedIn',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow'
}

export enum ResourceType {
  Room = 'Room',
  Desk = 'Desk'
}

export enum OtpType {
  ForgotPassword = 'ForgotPassword'
}

export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4
}