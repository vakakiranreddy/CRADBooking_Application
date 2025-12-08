import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationItem {
  id: number;
  type: 'booking' | 'event' | 'location';
  title: string;
  message: string;
  locationId?: number;
  locationName?: string;
  count: number;
  createdAt: string;
}

export interface SendNotificationDto {
  UserId: number;
  Title: string;
  Message: string;
  Type: string;
  BookingId?: number;
}

export interface SendBroadcastDto {
  Title: string;
  Message: string;
  LocationId?: number | undefined;
  TargetAudience: string;
}

export interface EmailNotificationRequest {
  type: 'booking' | 'event' | 'location';
  locationId?: number;
  subject: string;
  message: string;
  recipients?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private userNotificationUrl = `${environment.apiBaseUrl}/api/UserNotification`;
  private broadcastUrl = `${environment.apiBaseUrl}/api/BroadcastNotification`;

  constructor(private http: HttpClient) {}

  getUserNotifications(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.userNotificationUrl}/user/${userId}`);
  }

  sendNotification(dto: SendNotificationDto): Observable<any> {
    return this.http.post<any>(this.userNotificationUrl, dto);
  }

  createBroadcast(dto: SendBroadcastDto): Observable<any> {
    return this.http.post<any>(this.broadcastUrl, dto);
  }

  sendBookingNotification(userId: number, bookingId: number, resourceName: string, startTime: Date): Observable<any> {
    const dto: SendNotificationDto = {
      UserId: userId,
      Title: `Booking Confirmation - ${resourceName}`,
      Message: `Your booking for ${resourceName} on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} has been confirmed.`,
      Type: 'Booking',
      BookingId: bookingId
    };
    return this.sendNotification(dto);
  }

  getAllBroadcasts(): Observable<any[]> {
    return this.http.get<any[]>(this.broadcastUrl);
  }

  getBroadcastsByLocation(locationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.broadcastUrl}/location/${locationId}`);
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(`${this.userNotificationUrl}/${notificationId}/read`, {});
  }
}