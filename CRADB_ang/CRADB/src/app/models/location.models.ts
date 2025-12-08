export interface LocationResponse {
  Id: number;
  Name: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  PostalCode: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface LocationRequest {
  Name: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  PostalCode: string;
  IsActive: boolean;
}

export interface BuildingResponse {
  Id: number;
  Name: string;
  LocationId: number;
  LocationName: string;
  Address: string;
  Floors: number;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface BuildingRequest {
  Name: string;
  LocationId: number;
  Address: string;
  Floors: number;
  IsActive: boolean;
}