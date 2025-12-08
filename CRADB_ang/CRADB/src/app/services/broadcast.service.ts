import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BroadcastResponse {
  Id: number;
  Title: string;
  Message: string;
  TargetAudience: string;
  ScheduledDate: string;
  Status: string;
  Type: string;
  TargetLocationId?: number;
  TargetDepartmentId?: number;
  TargetRole?: string;
  SentAt: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface SendBroadcastDto {
  Title: string;
  Message: string;
  TargetAudience?: string;
  Type: string;
  TargetLocationId?: number;
  TargetDepartmentId?: number;
  TargetRole?: string;
  DepartmentIds?: number[];
  LocationIds?: number[];
  UserRoles?: string[];
  ScheduledDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BroadcastService {
  private apiUrl = `${environment.apiBaseUrl}/api/broadcastnotification`;

  constructor(private http: HttpClient) {}

  getAllBroadcasts(): Observable<BroadcastResponse[]> {
    return this.http.get<BroadcastResponse[]>(this.apiUrl);
  }

  getBroadcastById(id: number): Observable<BroadcastResponse> {
    return this.http.get<BroadcastResponse>(`${this.apiUrl}/${id}`);
  }

  createBroadcast(broadcast: SendBroadcastDto): Observable<BroadcastResponse> {
    return this.http.post<BroadcastResponse>(this.apiUrl, broadcast);
  }

  updateBroadcast(id: number, broadcast: SendBroadcastDto): Observable<BroadcastResponse> {
    return this.http.put<BroadcastResponse>(`${this.apiUrl}/${id}`, broadcast);
  }

  deleteBroadcast(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  getByDateRange(from: string, to: string): Observable<BroadcastResponse[]> {
    return this.http.get<BroadcastResponse[]>(`${this.apiUrl}/date-range?from=${from}&to=${to}`);
  }

  getByDepartment(departmentId: number): Observable<BroadcastResponse[]> {
    return this.http.get<BroadcastResponse[]>(`${this.apiUrl}/department/${departmentId}`);
  }

  getByLocation(locationId: number): Observable<BroadcastResponse[]> {
    return this.http.get<BroadcastResponse[]>(`${this.apiUrl}/location/${locationId}`);
  }

  getByRole(role: string): Observable<BroadcastResponse[]> {
    return this.http.get<BroadcastResponse[]>(`${this.apiUrl}/role/${role}`);
  }

  processPendingBroadcasts(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/process-pending`, {});
  }
}