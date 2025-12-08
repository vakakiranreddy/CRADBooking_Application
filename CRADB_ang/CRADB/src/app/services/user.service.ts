import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserResponse } from '../models/user.models';

export interface CreateUserRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  locationId?: number;
  departmentId?: number;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<UserResponse> {
    const formData = new FormData();
    formData.append('EmployeeId', user.employeeId);
    formData.append('FirstName', user.firstName);
    formData.append('LastName', user.lastName);
    formData.append('Email', user.email);
    formData.append('PhoneNumber', user.phoneNumber);
    formData.append('Password', user.password);
    formData.append('ConfirmPassword', user.confirmPassword);
    if (user.locationId) formData.append('LocationId', user.locationId.toString());
    if (user.departmentId) formData.append('DepartmentId', user.departmentId.toString());
    if (user.title) formData.append('Title', user.title);

    return this.http.post<UserResponse>(this.apiUrl, formData);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, user: UserResponse): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, user);
  }

  searchUsers(keyword: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/search?keyword=${keyword}`);
  }

  uploadProfileImage(userId: number, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('profileImage', file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/${userId}/image`, formData);
  }

  toggleUserStatus(userId: number): Observable<{ isActive: boolean }> {
    return this.http.put<{ isActive: boolean }>(`${this.apiUrl}/${userId}/status`, {});
  }
}