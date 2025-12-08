export interface RoomResponse {
  Id: number;
  RoomId: number;
  ResourceId: number;
  RoomName: string;
  Capacity: number;
  HasTV: boolean;
  HasWhiteboard: boolean;
  HasWiFi: boolean;
  HasProjector: boolean;
  HasVideoConference: boolean;
  HasAirConditioning: boolean;
  PhoneExtension?: string;
  RoomImage?: string;
  LocationId: number;
  BuildingId: number;
  FloorId: number;
  IsUnderMaintenance: boolean;
  IsBlocked: boolean;
  BlockedFrom?: string;
  BlockedUntil?: string;
  BlockReason?: string;
  MinBookingDuration?: number;
  MaxBookingDuration?: number;
  LocationName?: string;
  LocationAddress?: string;
  City?: string;
  BuildingName?: string;
  FloorName?: string;
}

export interface RoomRequest {
  name: string;
  buildingId: number;
  floor: number;
  capacity: number;
  description?: string;
  amenities?: string[];
  imageUrl?: string;
  bookingDurationLimit: number;
  isActive: boolean;
}

export interface CreateRoomDto {
  ResourceId: number;
  RoomName: string;
  Capacity: number;
  HasTV: boolean;
  HasWhiteboard: boolean;
  HasWiFi: boolean;
  HasProjector: boolean;
  HasVideoConference: boolean;
  HasAirConditioning: boolean;
  PhoneExtension?: string;
  RoomImage?: string;
  LocationId: number;
  BuildingId: number;
  FloorId: number;
  MinBookingDuration?: number;
  MaxBookingDuration?: number;
}

export interface RoomAmenityFilter {
  locationId?: number;
  buildingId?: number;
  floorId?: number;
  capacity?: number;
  hasTV?: boolean;
  hasWhiteboard?: boolean;
  hasWiFi?: boolean;
  hasProjector?: boolean;
  hasVideoConference?: boolean;
  hasAirConditioning?: boolean;
}