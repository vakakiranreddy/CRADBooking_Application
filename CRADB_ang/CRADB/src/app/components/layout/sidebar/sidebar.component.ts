import { Component, HostListener, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() mobileOpen = false;
  @Output() closeMobile = new EventEmitter<void>();
  showBookingDropdown = false;
  currentUser: AuthResponse | null = null;
  private userSubscription: Subscription | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  get isAdmin(): boolean {
    return this.currentUser?.Role === 'Admin';
  }

  getProfileImage(): string {
    if (!this.currentUser?.ProfileImage) return '';
    if (this.currentUser.ProfileImage.startsWith('data:') || this.currentUser.ProfileImage.startsWith('http')) {
      return this.currentUser.ProfileImage;
    }
    return `data:image/jpeg;base64,${this.currentUser.ProfileImage}`;
  }

  toggleBookingDropdown(): void {
    this.showBookingDropdown = !this.showBookingDropdown;
  }

  close(): void {
    this.closeMobile.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const sidebar = target.closest('.sidebar');
    const bookingLink = target.closest('.nav-item');
    
    if (!sidebar || !bookingLink?.querySelector('.booking-submenu')) {
      this.showBookingDropdown = false;
    }
  }
}