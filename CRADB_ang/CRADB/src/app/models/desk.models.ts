export interface DeskResponse {
  Id: number;
  DeskId: number;
  ResourceId: number;
  DeskName: string;
  DeskType: string;
  HasMonitor: boolean;
  HasKeyboard: boolean;
  HasMouse: boolean;
  HasHeadset: boolean;
  HasWebcam: boolean;
  HasDockingStation: boolean;
  DeskImage?: string;
  Description?: string;
  LocationId: number;
  BuildingId: number;
  FloorId: number;
  IsUnderMaintenance: boolean;
  IsBlocked: boolean;
  NearWindow: boolean;
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
  ResourceType?: string;
  ImageUrl?: string;
}

export interface CreateDeskDto {
  ResourceId: number;
  DeskName: string;
  DeskType: string;
  HasMonitor: boolean;
  HasKeyboard: boolean;
  HasMouse: boolean;
  HasHeadset: boolean;
  HasWebcam: boolean;
  Description?: string;
  LocationId: number;
  BuildingId: number;
  FloorId: number;
}