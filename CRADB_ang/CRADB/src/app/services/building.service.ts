import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BuildingResponse {
  Id: number;
  Name: string;
  LocationId: number;
  LocationName: string;
  Address: string;
  NumberOfFloors: number;
  BuildingImage?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface BuildingCreateDto {
  Name: string;
  LocationId: number;
  Address: string;
  NumberOfFloors: number;
}

@Injectable({
  providedIn: 'root'
})
export class BuildingService {
  private apiUrl = `${environment.apiBaseUrl}/api/buildings`;

  constructor(private http: HttpClient) {}

  getAllBuildings(): Observable<BuildingResponse[]> {
    return this.http.get<BuildingResponse[]>(this.apiUrl);
  }

  getBuildingById(id: number): Observable<BuildingResponse> {
    return this.http.get<BuildingResponse>(`${this.apiUrl}/${id}`);
  }

  createBuilding(building: BuildingCreateDto): Observable<BuildingResponse> {
    const formData = new FormData();
    Object.keys(building).forEach(key => {
      formData.append(key, (building as any)[key]);
    });
    return this.http.post<BuildingResponse>(this.apiUrl, formData);
  }

  updateBuilding(id: number, building: BuildingCreateDto): Observable<BuildingResponse> {
    const formData = new FormData();
    Object.keys(building).forEach(key => {
      formData.append(key, (building as any)[key]);
    });
    return this.http.put<BuildingResponse>(`${this.apiUrl}/${id}`, formData);
  }

  deleteBuilding(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBuildingsByLocation(locationId: number): Observable<BuildingResponse[]> {
    return this.http.get<BuildingResponse[]>(`${this.apiUrl}/location/${locationId}`);
  }
}