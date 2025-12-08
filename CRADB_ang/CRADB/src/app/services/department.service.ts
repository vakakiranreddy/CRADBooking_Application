import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DepartmentResponse {
  Id: number;
  DepartmentId: number;
  Name: string;
  DepartmentName: string;
  Description: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateDepartmentDto {
  DepartmentName: string;
  Description: string;
}

export interface UpdateDepartmentDto {
  DepartmentName: string;
  Description: string;
  IsActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiBaseUrl}/api/department`;

  constructor(private http: HttpClient) {}

  getAllDepartments(): Observable<DepartmentResponse[]> {
    return this.http.get<DepartmentResponse[]>(this.apiUrl);
  }

  getActiveDepartments(): Observable<DepartmentResponse[]> {
    return this.http.get<DepartmentResponse[]>(`${this.apiUrl}/active`);
  }

  getDepartmentById(id: number): Observable<DepartmentResponse> {
    return this.http.get<DepartmentResponse>(`${this.apiUrl}/${id}`);
  }

  createDepartment(department: CreateDepartmentDto): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(this.apiUrl, department);
  }

  updateDepartment(id: number, department: UpdateDepartmentDto): Observable<DepartmentResponse> {
    return this.http.put<DepartmentResponse>(`${this.apiUrl}/${id}`, department);
  }

  deleteDepartment(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }
}