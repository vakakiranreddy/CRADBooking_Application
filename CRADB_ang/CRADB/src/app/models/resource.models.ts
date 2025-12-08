export interface ResourceResponse {
  id: number;
  resourceId: number;
  name: string;
  resourceType: number;
  locationId: number;
  buildingId: number;
  floorId: number;
  isUnderMaintenance: boolean;
  isBlocked: boolean;
  isActive: boolean;
  blockedFrom?: string;
  blockedUntil?: string;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
  locationName?: string;
  locationAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  buildingName?: string;
  floorName?: string;
}

export interface ResourceRequest {
  Name: string;
  Type: string;
  BuildingId: number;
  Floor: number;
  Capacity: number;
  IsActive: boolean;
}

export interface BlockResourceRequest {
  ResourceId: number;
  BlockedUntil: string;
  Reason: string;
}

export interface MaintenanceRequest {
  ResourceId: number;
  MaintenanceUntil: string;
  Reason: string;
}

export interface CreateResourceDto {
  Name: string;
  ResourceType: number;
  BuildingId: number;
  FloorId: number;
}

export interface MaintenanceStatusDto {
  isUnderMaintenance: boolean;
  maintenanceReason?: string;
}

export interface BlockResourceDto {
  reason: string;
  startDate: Date;
}