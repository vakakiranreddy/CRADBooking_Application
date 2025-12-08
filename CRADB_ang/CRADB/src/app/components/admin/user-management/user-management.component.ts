import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService, CreateUserRequest } from '../../../services/user.service';
import { UserResponse } from '../../../models/user.models';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: UserResponse[] = [];
  showCreateForm = false;
  loading = false;
  creating = false;
  deleting = false;
  createError = '';
  createUserForm: FormGroup;
  roleForm: FormGroup;
  showRoleForm = false;
  selectedUser: UserResponse | null = null;
  currentUser: AuthResponse | null = null;
  showProfileDropdown = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.createUserForm = this.fb.group({
      employeeId: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      title: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.roleForm = this.fb.group({
      Role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
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

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    }
    return null;
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createUser(): void {
    if (this.createUserForm.valid) {
      this.creating = true;
      this.createError = '';

      const userData: CreateUserRequest = this.createUserForm.value;

      this.userService.createUser(userData).subscribe({
        next: (user) => {
          this.creating = false;
          this.showCreateForm = false;
          this.resetForm();
          this.loadUsers();
        },
        error: (error) => {
          this.creating = false;
          this.createError = error.error?.message || 'Failed to create user';
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.deleting = true;
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.deleting = false;
          this.loadUsers();
        },
        error: (error) => {
          this.deleting = false;
          Toastify({
            text: "Failed to delete user. Please try again.",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
        }
      });
    }
  }

  searchUsers(event: any): void {
    const keyword = event.target.value.trim();
    if (keyword) {
      this.userService.searchUsers(keyword).subscribe({
        next: (users) => {
          this.users = users;
        },
        error: (error) => {
          console.error('Error searching users:', error);
        }
      });
    } else {
      this.loadUsers();
    }
  }

  resetForm(): void {
    this.createUserForm.reset();
    this.createError = '';
  }

  changeRole(user: UserResponse): void {
    this.selectedUser = user;
    this.roleForm.patchValue({ Role: user.Role });
    this.showRoleForm = true;
  }

  submitRoleChange(): void {
    if (this.roleForm.valid && this.selectedUser) {
      const updateData = {
        ...this.selectedUser,
        Role: this.roleForm.value.Role
      };
      this.userService.updateUser(this.selectedUser.Id, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.showRoleForm = false;
          this.selectedUser = null;
        },
        error: (error) => {
          Toastify({
            text: "Failed to update user role. Please try again.",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
        }
      });
    }
  }
}