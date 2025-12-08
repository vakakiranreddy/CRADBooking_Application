import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckInResponse {
  CheckInId: number;
  BookingId: number;
  CheckInTime: string;
  CheckOutTime?: string;
  Status: string;
  MeetingName: string;
  ResourceName: string;
}

export interface CheckInStats {
  TotalCheckIns: number;
  AverageSessionDuration: number;
  OnTimeCheckIns: number;
  LateCheckIns: number;
}

@Injectable({
  providedIn: 'root'
})
export class CheckInService {
  private apiUrl = `${environment.apiBaseUrl}/api/checkin`;

  constructor(private http: HttpClient) {}

  checkIn(bookingId: number): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${this.apiUrl}/checkin/${bookingId}`, {});
  }

  checkOut(bookingId: number): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${this.apiUrl}/checkout/${bookingId}`, {});
  }

  getCheckInStatus(bookingId: number): Observable<CheckInResponse> {
    return this.http.get<CheckInResponse>(`${this.apiUrl}/status/${bookingId}`);
  }

  getMyCheckInHistory(): Observable<CheckInResponse[]> {
    return this.http.get<CheckInResponse[]>(`${this.apiUrl}/history`);
  }

  getMyCheckInStats(): Observable<CheckInStats> {
    return this.http.get<CheckInStats>(`${this.apiUrl}/statistics`);
  }
}