import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RoomResponse, RoomRequest, RoomAmenityFilter } from '../models/room.models';

export type { RoomResponse };
import { RoomAvailabilityRequest } from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = `${environment.apiBaseUrl}/api/room`;

  constructor(private http: HttpClient) {}

  getRoomById(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/${id}`);
  }

  getRoomByResourceId(resourceId: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/resource/${resourceId}`);
  }

  getAllRooms(): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(this.apiUrl);
  }

  getRoomsByLocation(locationId: number): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.apiUrl}/location/${locationId}`);
  }

  getRoomsByBuilding(buildingId: number): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.apiUrl}/building/${buildingId}`);
  }

  getRoomsByFloor(floorId: number): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.apiUrl}/floor/${floorId}`);
  }

  getRoomsByCapacity(minCapacity: number): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.apiUrl}/capacity/${minCapacity}`);
  }

  searchRoomsWithAmenities(filter: RoomAmenityFilter): Observable<RoomResponse[]> {
    return this.http.post<RoomResponse[]>(`${this.apiUrl}/search-amenities`, filter);
  }

  getAvailableRooms(request: RoomAvailabilityRequest): Observable<RoomResponse[]> {
    return this.http.post<RoomResponse[]>(`${this.apiUrl}/available`, request);
  }

  getRooms(): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(this.apiUrl);
  }

  getRoom(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/${id}`);
  }

  createRoom(room: RoomRequest): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(this.apiUrl, room);
  }

  updateRoom(id: number, room: RoomRequest): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.apiUrl}/${id}`, room);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createRoomWithForm(room: any): Observable<RoomResponse> {
    const formData = new FormData();
    Object.keys(room).forEach(key => {
      if (room[key] !== null && room[key] !== undefined) {
        if (Array.isArray(room[key])) {
          room[key].forEach((item: any) => formData.append(key, item));
        } else {
          formData.append(key, room[key]);
        }
      }
    });
    return this.http.post<RoomResponse>(this.apiUrl, formData);
  }

  createRoomWithFormData(formData: FormData): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(this.apiUrl, formData);
  }

  updateRoomWithFormData(id: number, formData: FormData): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.apiUrl}/${id}`, formData);
  }

  updateRoomWithForm(id: number, room: any): Observable<RoomResponse> {
    const formData = new FormData();
    Object.keys(room).forEach(key => {
      if (room[key] !== null && room[key] !== undefined) {
        if (Array.isArray(room[key])) {
          room[key].forEach((item: any) => formData.append(key, item));
        } else {
          formData.append(key, room[key]);
        }
      }
    });
    return this.http.put<RoomResponse>(`${this.apiUrl}/${id}`, formData);
  }
}