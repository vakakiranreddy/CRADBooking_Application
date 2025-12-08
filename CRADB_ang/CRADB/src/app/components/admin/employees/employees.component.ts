import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService, CreateUserRequest } from '../../../services/user.service';
import { UserResponse } from '../../../models/user.models';
import { DepartmentResponse } from '../../../services/department.service';
import { LocationResponse } from '../../../services/location.service';
import { DashboardService } from '../../../services/dashboard.service';
import { AuthService } from '../../../services/auth.service';
import Toastify from 'toastify-js';
import { AuthResponse } from '../../../models/auth.models';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SidebarComponent],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {
  employees: UserResponse[] = [];
  filteredEmployees: UserResponse[] = [];
  paginatedEmployees: UserResponse[] = [];
  departments: DepartmentResponse[] = [];
  locations: LocationResponse[] = [];
  loading = false;
  saving = false;
  searchTerm = '';
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;
  showAddEmployeeModal = false;
  showFilters = false;
  currentPage = 1;
  pageSize = 8;
  totalPages = 0;
  selectedDepartment = '';
  selectedLocation = '';
  selectedStatus = '';
  employeeForm: FormGroup;

  constructor(
    private userService: UserService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.employeeForm = this.fb.group({
      employeeId: [{ value: '', disabled: true }],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      title: [''],
      departmentId: [''],
      locationId: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadEmployeePageData();
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'AD';
    const firstInitial = this.currentUser.FirstName?.charAt(0) || '';
    const lastInitial = this.currentUser.LastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'AD';
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Admin';
    return `${this.currentUser.FirstName || ''} ${this.currentUser.LastName || ''} `.trim() || 'Admin';
  }

  getUserRole(): string {
    return this.currentUser?.Role || 'Admin';
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadEmployeePageData(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.dashboardService.getEmployeePageData().subscribe({
      next: (data: any) => {
        this.employees = data.Users || [];
        this.departments = data.Departments || [];
        this.locations = data.Locations || [];
        this.filteredEmployees = [...this.employees];
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading employee page data:', error);
        this.employees = [];
        this.departments = [];
        this.locations = [];
        this.filteredEmployees = [];
        this.paginatedEmployees = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadEmployees(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: UserResponse[]) => {
        this.employees = users || [];
        this.filteredEmployees = [...this.employees];
        this.currentPage = 1;
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  searchEmployees(): void {
    if (this.searchTerm.trim()) {
      this.filteredEmployees = this.employees.filter(emp =>
        emp.FirstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.LastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.Email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.EmployeeId.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredEmployees = this.employees;
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  getEmployeeInitials(employee: UserResponse): string {
    return `${employee.FirstName.charAt(0)}${employee.LastName.charAt(0)} `.toUpperCase();
  }

  getProfileImage(employee: UserResponse): string {
    if (!employee.ProfileImage) return '';
    if (employee.ProfileImage.startsWith('data:') || employee.ProfileImage.startsWith('http')) {
      return employee.ProfileImage;
    }
    return `data:image/jpeg;base64,${employee.ProfileImage}`;
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
  }

  updatePagination(): void {
    if (!this.filteredEmployees || this.filteredEmployees.length === 0) {
      this.paginatedEmployees = [];
      this.totalPages = 0;
      return;
    }

    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
  }

  updatePageSize(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages && i <= 5; i++) {
      pages.push(i);
    }
    return pages;
  }

  getDisplayedCount(): number {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return Math.min(startIndex + this.pageSize, this.filteredEmployees.length);
  }



  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    let filtered = [...this.employees];

    if (this.selectedDepartment) {
      filtered = filtered.filter(emp => emp.DepartmentId?.toString() === this.selectedDepartment);
    }

    if (this.selectedLocation) {
      filtered = filtered.filter(emp => emp.LocationId?.toString() === this.selectedLocation);
    }

    if (this.selectedStatus !== '') {
      const isActive = this.selectedStatus === 'true';
      filtered = filtered.filter(emp => emp.IsActive === isActive);
    }

    this.filteredEmployees = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  generateEmployeeId(): void {
    const firstName = this.employeeForm.get('firstName')?.value || '';
    const lastName = this.employeeForm.get('lastName')?.value || '';

    if (firstName && lastName) {
      const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const employeeId = initials + timestamp;
      this.employeeForm.patchValue({ employeeId });
    }
  }

  addEmployee(): void {
    if (this.employeeForm.invalid) return;

    const formValue = this.employeeForm.value;
    if (formValue.password !== formValue.confirmPassword) {
      Toastify({
        text: "Passwords do not match. Please try again.",
        duration: 3000,
        backgroundColor: "#f59e0b"
      }).showToast();
      return;
    }

    this.generateEmployeeId();
    this.saving = true;
    const newEmployee: CreateUserRequest = {
      employeeId: this.employeeForm.get('employeeId')?.value || '',
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      title: formValue.title,
      departmentId: formValue.departmentId ? parseInt(formValue.departmentId) : undefined,
      locationId: formValue.locationId ? parseInt(formValue.locationId) : undefined
    };

    this.userService.createUser(newEmployee).subscribe({
      next: () => {
        this.loadEmployees();
        this.showAddEmployeeModal = false;
        this.employeeForm.reset();
        this.employeeForm.patchValue({ employeeId: '' });
        this.saving = false;
      },
      error: (error) => {
        console.error('Error creating employee:', error);
        let errorMessage = 'Error creating employee. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        Toastify({
          text: errorMessage,
          duration: 4000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.saving = false;
      }
    });
  }

  closeModal(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showAddEmployeeModal = false;
    }
  }

  trackByEmployeeId(index: number, employee: UserResponse): number {
    return employee.Id;
  }

  toggleUserStatus(employee: UserResponse): void {
    this.userService.toggleUserStatus(employee.Id).subscribe({
      next: (response) => {
        employee.IsActive = response.isActive;
        Toastify({
          text: `User ${response.isActive ? 'activated' : 'deactivated'} successfully!`,
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        Toastify({
          text: "Failed to update user status. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }
}