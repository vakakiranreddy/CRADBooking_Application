import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LocationResponse {
  LocationId: number;
  Name: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  PostalCode: string;
  LocationImage?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface LocationCreateDto {
  Name: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  PostalCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = `${environment.apiBaseUrl}/api/locations`;

  constructor(private http: HttpClient) {}

  getAllLocations(): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(this.apiUrl);
  }

  getLocationById(id: number): Observable<LocationResponse> {
    return this.http.get<LocationResponse>(`${this.apiUrl}/${id}`);
  }

  createLocation(location: LocationCreateDto): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(this.apiUrl, location);
  }

  updateLocation(id: number, location: LocationCreateDto): Observable<LocationResponse> {
    return this.http.put<LocationResponse>(`${this.apiUrl}/${id}`, location);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchLocations(searchTerm: string): Observable<LocationResponse[]> {
    return this.http.get<LocationResponse[]>(`${this.apiUrl}/search?searchTerm=${searchTerm}`);
  }
}