import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DepartmentService, DepartmentResponse, CreateDepartmentDto, UpdateDepartmentDto } from '../../../services/department.service';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css']
})
export class DepartmentsComponent implements OnInit {
  departments: DepartmentResponse[] = [];
  filteredDepartments: DepartmentResponse[] = [];
  loading = false;
  saving = false;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  departmentForm: FormGroup;
  editingDepartment: DepartmentResponse | null = null;
  deletingDepartment: DepartmentResponse | null = null;
  searchTerm = '';

  constructor(
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.loading = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.filteredDepartments = [...departments];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  searchDepartments(): void {
    if (this.searchTerm.trim()) {
      this.filteredDepartments = this.departments.filter(dept =>
        dept.DepartmentName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dept.Description?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredDepartments = [...this.departments];
    }
  }

  openAddModal(): void {
    this.departmentForm.reset({ isActive: true });
    this.showAddModal = true;
  }

  openEditModal(department: DepartmentResponse): void {
    this.editingDepartment = department;
    this.departmentForm.patchValue({
      name: department.DepartmentName,
      description: department.Description,
      isActive: department.IsActive
    });
    this.showEditModal = true;
  }

  openDeleteModal(department: DepartmentResponse): void {
    this.deletingDepartment = department;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.editingDepartment = null;
    this.deletingDepartment = null;
    this.departmentForm.reset();
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) return;

    this.saving = true;
    const dto: CreateDepartmentDto = {
      DepartmentName: this.departmentForm.value.name,
      Description: this.departmentForm.value.description || ''
    };

    this.departmentService.createDepartment(dto).subscribe({
      next: () => {
        Toastify({
          text: "Department created successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadDepartments();
        this.closeModals();
        this.saving = false;
      },
      error: (error) => {
        console.error('Error creating department:', error);
        Toastify({
          text: "Failed to create department. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  updateDepartment(): void {
    if (this.departmentForm.invalid || !this.editingDepartment) return;

    this.saving = true;
    const dto: UpdateDepartmentDto = {
      DepartmentName: this.departmentForm.value.name,
      Description: this.departmentForm.value.description || '',
      IsActive: this.departmentForm.value.isActive
    };

    this.departmentService.updateDepartment(this.editingDepartment.DepartmentId, dto).subscribe({
      next: () => {
        Toastify({
          text: "Department updated successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadDepartments();
        this.closeModals();
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating department:', error);
        Toastify({
          text: "Failed to update department. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  deleteDepartment(): void {
    if (!this.deletingDepartment) return;

    this.departmentService.deleteDepartment(this.deletingDepartment.DepartmentId).subscribe({
      next: () => {
        Toastify({
          text: "Department deleted successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.loadDepartments();
        this.closeModals();
      },
      error: (error) => {
        console.error('Error deleting department:', error);
        Toastify({
          text: "Failed to delete department. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'AD';
    const firstInitial = this.currentUser.FirstName?.charAt(0) || '';
    const lastInitial = this.currentUser.LastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'AD';
  }

  getUserRole(): string {
    return this.currentUser?.Role || 'Admin';
  }

  getProfileImage(): string {
    if (!this.currentUser?.ProfileImage) return '';
    if (this.currentUser.ProfileImage.startsWith('data:') || this.currentUser.ProfileImage.startsWith('http')) {
      return this.currentUser.ProfileImage;
    }
    return `data:image/jpeg;base64,${this.currentUser.ProfileImage}`;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
