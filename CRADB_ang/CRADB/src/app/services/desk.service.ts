import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeskResponse, CreateDeskDto } from '../models/desk.models';

export type { DeskResponse } from '../models/desk.models';

@Injectable({
  providedIn: 'root'
})
export class DeskService {
  private apiUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  getAllDesks(): Observable<DeskResponse[]> {
    return this.http.get<DeskResponse[]>(`${this.apiUrl}/desk`);
  }

  getDeskById(id: number): Observable<DeskResponse> {
    return this.http.get<DeskResponse>(`${this.apiUrl}/desk/${id}`);
  }

  getDeskByResourceId(resourceId: number): Observable<DeskResponse> {
    return this.http.get<DeskResponse>(`${this.apiUrl}/desk/resource/${resourceId}`);
  }

  getAvailableDesks(requestDto?: any): Observable<DeskResponse[]> {
    if (requestDto) {
      return this.http.post<DeskResponse[]>(`${this.apiUrl}/desk/available`, requestDto);
    }
    return this.http.get<DeskResponse[]>(`${this.apiUrl}/desk`);
  }

  getDesksByLocation(locationId: number): Observable<DeskResponse[]> {
    return this.http.get<DeskResponse[]>(`${this.apiUrl}/desk/location/${locationId}`);
  }

  createDesk(desk: CreateDeskDto): Observable<DeskResponse> {
    return this.http.post<DeskResponse>(`${this.apiUrl}/desk`, desk);
  }

  createDeskWithFormData(formData: FormData): Observable<DeskResponse> {
    return this.http.post<DeskResponse>(`${this.apiUrl}/desk`, formData);
  }

  updateDeskWithFormData(id: number, formData: FormData): Observable<DeskResponse> {
    return this.http.put<DeskResponse>(`${this.apiUrl}/desk/${id}`, formData);
  }

  updateDesk(id: number, desk: Partial<CreateDeskDto>): Observable<DeskResponse> {
    return this.http.put<DeskResponse>(`${this.apiUrl}/desk/${id}`, desk);
  }

  deleteDesk(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/desk/${id}`);
  }
}