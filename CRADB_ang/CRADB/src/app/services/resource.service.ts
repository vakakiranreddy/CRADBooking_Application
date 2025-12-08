import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ResourceResponse {
  Id: number;
  ResourceId: number;
  Name: string;
  ResourceType: number;
  LocationId: number;
  BuildingId: number;
  FloorId: number;
  IsUnderMaintenance: boolean;
  IsBlocked: boolean;
  IsActive: boolean;
  BlockedFrom?: string;
  BlockedUntil?: string;
  BlockReason?: string;
  CreatedAt: string;
  UpdatedAt: string;
  LocationName?: string;
  LocationAddress?: string;
  City?: string;
  State?: string;
  Country?: string;
  BuildingName?: string;
  FloorName?: string;
}

export interface CreateResourceDto {
  Name: string;
  ResourceType: number;
  BuildingId: number;
  FloorId: number;
  IsActive?: boolean;
}

export interface MaintenanceStatusDto {
  IsUnderMaintenance: boolean;
}

export interface BlockResourceDto {
  BlockedFrom?: string;
  BlockedUntil?: string;
  BlockReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private apiUrl = `${environment.apiBaseUrl}/api/resource`;

  constructor(private http: HttpClient) {}

  getAllResources(): Observable<ResourceResponse[]> {
    return this.http.get<ResourceResponse[]>(this.apiUrl);
  }

  getResourceById(id: number): Observable<ResourceResponse> {
    return this.http.get<ResourceResponse>(`${this.apiUrl}/${id}`);
  }

  createResource(resource: CreateResourceDto): Observable<ResourceResponse> {
    return this.http.post<ResourceResponse>(this.apiUrl, resource);
  }

  updateResource(id: number, resource: any): Observable<ResourceResponse> {
    return this.http.put<ResourceResponse>(`${this.apiUrl}/${id}`, resource);
  }

  deleteResource(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  updateMaintenanceStatus(id: number, status: MaintenanceStatusDto): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}/maintenance`, status);
  }

  blockResource(id: number, blockData: BlockResourceDto): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/block`, blockData);
  }

  unblockResource(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/unblock`, {});
  }

  getResourcesUnderMaintenance(): Observable<ResourceResponse[]> {
    return this.http.get<ResourceResponse[]>(`${this.apiUrl}/maintenance`);
  }

  getBlockedResources(): Observable<ResourceResponse[]> {
    return this.http.get<ResourceResponse[]>(`${this.apiUrl}/blocked`);
  }

  convertToRoom(resourceId: number, roomData: any): Observable<any> {
    const formData = new FormData();
    Object.keys(roomData).forEach(key => {
      if (roomData[key] !== null && roomData[key] !== undefined) {
        formData.append(key, roomData[key]);
      }
    });
    return this.http.post(`${environment.apiBaseUrl}/api/room`, formData);
  }

  convertToRoomJson(resourceId: number, roomData: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/api/room`, roomData);
  }

  convertToDeskJson(resourceId: number, deskData: any): Observable<any> {
    // First activate the resource, then create desk
    return new Observable(observer => {
      // Activate the resource first
      this.updateResource(resourceId, { IsActive: true }).subscribe({
        next: () => {
          // Then create the desk
          const deskPayload = {
            ...deskData,
            ResourceId: resourceId
          };
          this.http.post(`${environment.apiBaseUrl}/api/desk`, deskPayload).subscribe({
            next: (result) => observer.next(result),
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }

  convertToDesk(resourceId: number, deskData: any): Observable<any> {
    // First activate the resource, then create desk
    return new Observable(observer => {
      // Activate the resource first
      this.updateResource(resourceId, { IsActive: true }).subscribe({
        next: () => {
          // Then create the desk
          const formData = new FormData();
          const enhancedDeskData = {
            ...deskData,
            ResourceId: resourceId
          };
          
          Object.keys(enhancedDeskData).forEach(key => {
            if (enhancedDeskData[key] !== null && enhancedDeskData[key] !== undefined) {
              formData.append(key, enhancedDeskData[key]);
            }
          });
          
          this.http.post(`${environment.apiBaseUrl}/api/desk`, formData).subscribe({
            next: (result) => observer.next(result),
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Debug method to check desk status
  getDeskById(deskId: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/api/desk/${deskId}`);
  }

  // Method to activate a desk if it's inactive
  activateDesk(deskId: number): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/api/desk/${deskId}/activate`, {});
  }

  // Method to activate a resource directly
  activateResource(resourceId: number): Observable<any> {
    return this.updateResource(resourceId, { IsActive: true });
  }
}