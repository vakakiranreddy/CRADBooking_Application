import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CreateRsvpDto {
  EventId: number;
  Status: RsvpStatus;
}

export interface RsvpResponseDto {
  RSVPId: number;
  EventId: number;
  UserId: number;
  Status: RsvpStatusType;
  ResponseDate: string;
}

export interface UserRsvpDetails {
  Id: number;
  EmployeeId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Role: string;
  LocationId?: number;
  DepartmentId?: number;
  Title?: string;
  IsActive: boolean;
  LastLoginAt: string;
  CreatedAt: string;
  Status?: RsvpStatusType;
  ResponseDate?: string;
  RSVPId?: number;
  EventId?: number;
  UserId?: number;
}

export enum RsvpStatusType {
  Yes = 0,
  No = 1,
  Maybe = 2
}

export enum RsvpStatus {
  Yes = 0,
  No = 1,
  Maybe = 2
}

@Injectable({
  providedIn: 'root'
})
export class EventRsvpService {
  private apiUrl = `${environment.apiBaseUrl}/api/EventRSVP`;

  constructor(private http: HttpClient) {}

  addUserRsvp(dto: CreateRsvpDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rsvp`, dto);
  }

  updateUserRsvp(dto: CreateRsvpDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rsvp`, dto);
  }

  getUserRsvp(eventId: number): Observable<RsvpResponseDto | null> {
    return this.http.get<RsvpResponseDto>(`${this.apiUrl}/user-rsvp/${eventId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      })
    );
  }

  getRsvpsByEvent(eventId: number): Observable<RsvpResponseDto[]> {
    return this.http.get<RsvpResponseDto[]>(`${this.apiUrl}/event/${eventId}`);
  }

  getRsvpsByUser(userId: number): Observable<RsvpResponseDto[]> {
    return this.http.get<RsvpResponseDto[]>(`${this.apiUrl}/user/${userId}`);
  }

  getInterestedCount(eventId: number): Observable<{eventId: number, interestedCount: number}> {
    return this.http.get<{eventId: number, interestedCount: number}>(`${this.apiUrl}/event/${eventId}/interested/count`);
  }

  getNotInterestedCount(eventId: number): Observable<{eventId: number, notInterestedCount: number}> {
    return this.http.get<{eventId: number, notInterestedCount: number}>(`${this.apiUrl}/event/${eventId}/not-interested/count`);
  }

  getMaybeCount(eventId: number): Observable<{eventId: number, maybeCount: number}> {
    return this.http.get<{eventId: number, maybeCount: number}>(`${this.apiUrl}/event/${eventId}/maybe/count`);
  }

  getInterestedUsers(eventId: number): Observable<UserRsvpDetails[]> {
    return this.http.get<UserRsvpDetails[]>(`${this.apiUrl}/event/${eventId}/interested/users`);
  }

  getMaybeUsers(eventId: number): Observable<UserRsvpDetails[]> {
    return this.http.get<UserRsvpDetails[]>(`${this.apiUrl}/event/${eventId}/maybe/users`);
  }

  getNotInterestedUsers(eventId: number): Observable<UserRsvpDetails[]> {
    return this.http.get<UserRsvpDetails[]>(`${this.apiUrl}/event/${eventId}/not-interested/users`);
  }

  getAllRsvpUsers(eventId: number): Observable<UserRsvpDetails[]> {
    return this.http.get<UserRsvpDetails[]>(`${this.apiUrl}/event/${eventId}/all/users`);
  }
}