import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventResponse {
  EventId: number;
  EventTitle: string;
  Description?: string;
  LocationId?: number;
  LocationName?: string;
  BuildingId?: number;
  FloorId?: number;
  Date: string;
  StartTime: string;
  EndTime: string;
  IsActive: boolean;
  EventImage?: string;
  CreatedAt: string;
  UpdatedAt: string;
  InterestedUserIds?: number[];
  NotInterestedUserIds?: number[];
  MaybeUserIds?: number[];
}

export interface CreateEventDto {
  EventTitle: string;
  Description?: string;
  LocationId?: number;
  BuildingId?: number;
  FloorId?: number;
  Date: string;
  StartTime: string;
  EndTime: string;
  EventImage?: File;
}

export interface UpdateEventDto {
  EventTitle: string;
  Description?: string;
  LocationId?: number;
  BuildingId?: number;
  FloorId?: number;
  Date: string;
  StartTime: string;
  EndTime: string;
  EventImage?: File;
  IsActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiBaseUrl}/api/event`;

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: CreateEventDto): Observable<EventResponse> {
    const formData = new FormData();
    Object.keys(event).forEach(key => {
      const value = (event as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return this.http.post<EventResponse>(this.apiUrl, formData);
  }

  updateEvent(id: number, event: UpdateEventDto): Observable<EventResponse> {
    const formData = new FormData();
    Object.keys(event).forEach(key => {
      const value = (event as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return this.http.put<EventResponse>(`${this.apiUrl}/${id}`, formData);
  }

  deleteEvent(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  searchEvents(keyword: string): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(`${this.apiUrl}/search?keyword=${keyword}`);
  }

  getUpcomingEvents(): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(`${this.apiUrl}/upcoming`);
  }

  getPastEvents(): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(`${this.apiUrl}/past`);
  }

  getTotalEventCount(): Observable<{ totalEvents: number }> {
    return this.http.get<{ totalEvents: number }>(`${this.apiUrl}/count`);
  }

  getEventParticipantCount(id: number): Observable<{ eventId: number; participantCount: number }> {
    return this.http.get<{ eventId: number; participantCount: number }>(`${this.apiUrl}/${id}/participants/count`);
  }
}