import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BookingResponse {
  BookingId: number;
  Id: number;
  UserId: number;
  UserName?: string;
  ResourceId: number;
  ResourceName?: string;
  ResourceType: string;
  StartTime: string;
  EndTime: string;
  Status: string | number;
  SessionStatus: string | number;
  MeetingName?: string;
  Purpose?: string;
  ParticipantCount?: number;
  LocationName?: string;
  BuildingName?: string;
  FloorName?: string;
  CreatedAt: string;
  UpdatedAt: string;
  CancelledAt?: string;
  CancellationReason?: string;
}

export interface CreateBookingDto {
  ResourceId: number;
  StartTime: string;
  EndTime: string;
  Purpose: string;
  MeetingName?: string;
  Description?: string;
}

export interface CreateBookingRequest {
  resourceId: number;
  startTime: Date;
  endTime: Date;
  meetingName: string;
  participantCount: number;
  purpose?: string;
  sendReminder?: boolean;
}

export interface BookingAnalytics {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  mostBookedResource: string;
  averageBookingDuration: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiBaseUrl}/api/booking`;

  constructor(private http: HttpClient) { }

  createBooking(booking: CreateBookingRequest | CreateBookingDto): Observable<BookingResponse> {
    // Convert CreateBookingRequest to API format if needed
    let apiBooking: any;
    if ('resourceId' in booking) {
      // It's CreateBookingRequest format
      apiBooking = {
        ResourceId: booking.resourceId,
        StartTime: this.formatDateTimeForIST(booking.startTime),
        EndTime: this.formatDateTimeForIST(booking.endTime),
        MeetingName: booking.meetingName,
        ParticipantCount: booking.participantCount,
        Purpose: booking.purpose || null,
        SendReminder: booking.sendReminder || true
      };
    } else {
      // It's already CreateBookingDto format
      apiBooking = booking;
    }
    return this.http.post<BookingResponse>(this.apiUrl, apiBooking);
  }

  getAllBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(this.apiUrl);
  }

  getBookingById(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/${id}`);
  }

  getMyBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/my-bookings`);
  }

  getUserBookings(userId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/user/${userId}`);
  }

  getBookingsByStatus(status: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/status/${status}`);
  }

  getResourceBookings(resourceId: number, date?: string): Observable<BookingResponse[]> {
    const params = date ? `?date=${date}` : '';
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/resource/${resourceId}${params}`);
  }

  getCalendarBookings(startDate: string, endDate: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/calendar?startDate=${startDate}&endDate=${endDate}`);
  }

  getAnalytics(startDate?: string, endDate?: string, locationId?: number): Observable<BookingAnalytics> {
    let params = '';
    if (startDate || endDate || locationId) {
      const queryParams = [];
      if (startDate) queryParams.push(`startDate=${startDate}`);
      if (endDate) queryParams.push(`endDate=${endDate}`);
      if (locationId) queryParams.push(`locationId=${locationId}`);
      params = '?' + queryParams.join('&');
    }
    return this.http.get<BookingAnalytics>(`${this.apiUrl}/analytics${params}`);
  }

  cancelBooking(id: number, reason: string): Observable<boolean> {
    const options = {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reason)
    };
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`, options);
  }

  private formatDateTimeForIST(date: Date): string {
    // Get the original datetime-local value without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}