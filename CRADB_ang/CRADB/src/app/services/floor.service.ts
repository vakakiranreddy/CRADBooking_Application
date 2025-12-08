import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FloorResponse {
  Id: number;
  FloorNumber: number;
  BuildingId: number;
  BuildingName: string;
  LocationId: number;
  LocationName: string;
  FloorName: string;
  IsActive: boolean;
}

export interface FloorCreateDto {
  LocationId: number;
  BuildingId: number;
  FloorName: string;
  FloorNumber: number;
}

@Injectable({
  providedIn: 'root'
})
export class FloorService {
  private apiUrl = `${environment.apiBaseUrl}/api/floor`;

  constructor(private http: HttpClient) {}

  getAllFloors(): Observable<FloorResponse[]> {
    return this.http.get<FloorResponse[]>(this.apiUrl);
  }

  getFloorById(id: number): Observable<FloorResponse> {
    return this.http.get<FloorResponse>(`${this.apiUrl}/${id}`);
  }

  createFloor(floor: FloorCreateDto): Observable<FloorResponse> {
    return this.http.post<FloorResponse>(this.apiUrl, floor);
  }

  updateFloor(id: number, floor: FloorCreateDto): Observable<FloorResponse> {
    return this.http.put<FloorResponse>(`${this.apiUrl}/${id}`, floor);
  }

  deleteFloor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getFloorsByBuilding(buildingId: number): Observable<FloorResponse[]> {
    return this.http.get<FloorResponse[]>(`${this.apiUrl}/building/${buildingId}`);
  }
}