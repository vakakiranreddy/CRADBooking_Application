import { ResourceType, SessionStatus } from './enums';

export interface CreateBookingRequest {
  resourceId: number;
  startTime: Date;
  endTime: Date;
  meetingName: string;
  participantCount: number;
  purpose?: string;
  sendReminder?: boolean;
}

export interface BookingResponse {
  bookingId: number;
  id: number;
  userId: number;
  userName?: string;
  resourceId: number;
  resourceName?: string;
  resourceType: ResourceType;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  sessionStatus: SessionStatus;
  meetingName?: string;
  purpose?: string;
  participantCount?: number;
  locationName?: string;
  buildingName?: string;
  floorName?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface RoomAvailabilityRequest {
  locationId?: number;
  buildingId?: number;
  floorId?: number;
  startTime: Date;
  endTime: Date;
  capacity?: number;
  hasTV?: boolean;
  hasWhiteboard?: boolean;
  hasWiFi?: boolean;
  hasProjector?: boolean;
  hasVideoConference?: boolean;
  hasAirConditioning?: boolean;
}