import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiBaseUrl}/api/dashboard`;

  constructor(private http: HttpClient) {}

  getAdminDashboardData(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin-data/${userId}`);
  }

  getEmployeePageData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee-data`);
  }

  getCalendarPageData(userId?: number | null): Observable<any> {
    if (userId) {
      return this.http.get(`${this.apiUrl}/calendar-data`, { params: { userId: userId.toString() } });
    }
    return this.http.get(`${this.apiUrl}/calendar-data`);
  }

  getEventsPageData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/events-data`);
  }

  getEventRsvpData(eventId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/event-rsvp-data/${eventId}`);
  }

  getNotificationPageData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notification-data`);
  }

  getResourcePageData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resource-data`);
  }

  getUserDashboardData(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-data/${userId}`);
  }

  getRoomsPageData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms-data`);
  }

  getDesksPageData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/desks-data`);
  }
}
