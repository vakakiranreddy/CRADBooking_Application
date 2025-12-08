import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  emailForm: FormGroup;
  resetForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  otpSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      otp: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  sendOtp(): void {
    if (this.emailForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      this.authService.forgotPassword(this.emailForm.value.email).subscribe({
        next: (response) => {
          this.loading = false;
          this.otpSent = true;
          this.successMessage = 'OTP sent to your email';
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Failed to send OTP';
        }
      });
    }
  }

  resetPassword(): void {
    if (this.resetForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      const resetData = {
        email: this.emailForm.value.email,
        otp: this.resetForm.value.otp,
        newPassword: this.resetForm.value.newPassword
      };

      this.authService.resetPassword(resetData).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Password reset successfully';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Failed to reset password';
        }
      });
    }
  }

  goToLogin(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/login']);
  }
}
