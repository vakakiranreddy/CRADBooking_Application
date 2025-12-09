import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RoomService } from '../../services/room.service';
import { RoomResponse } from '../../models/room.models';
import { LocationResponse } from '../../services/location.service';
import { BookingService, CreateBookingRequest } from '../../services/booking.service';
import { NavigationComponent } from '../shared/navigation.component';
import { DashboardService } from '../../services/dashboard.service';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavigationComponent],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.css']
})
export class RoomListComponent implements OnInit {
  rooms: RoomResponse[] = [];
  locations: LocationResponse[] = [];
  loading = false;
  selectedLocation = '';
  employeeCount = '8';
  showBookingModal = false;
  selectedRoom: RoomResponse | null = null;
  bookingLoading = false;
  minDateTime = '';
  bookingData = {
    meetingName: '',
    startTime: '',
    endTime: '',
    participantCount: 1,
    purpose: ''
  };

  currentUser: any;

  constructor(
    private roomService: RoomService,
    private bookingService: BookingService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private dashboardService: DashboardService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.updateMinDateTime();
    this.refreshData();
  }

  updateMinDateTime(): void {
    const now = new Date();
    this.minDateTime = this.formatDateTimeLocal(now);
  }

  refreshData(): void {
    this.loading = true;
    this.dashboardService.getRoomsPageData().subscribe({
      next: (data) => {
        this.rooms = this.filterRoomsByCapacity(data.Rooms || []);
        this.locations = data.Locations || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        Toastify({
          text: "Failed to load rooms data",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
        this.rooms = [];
        this.locations = [];
        this.loading = false;
      }
    });
  }



  onLocationChange(): void {
    this.searchRooms();
  }

  searchRooms(): void {
    if (this.selectedLocation) {
      this.loading = true;
      this.roomService.getRoomsByLocation(Number(this.selectedLocation)).subscribe({
        next: (rooms) => {
          this.rooms = this.filterRoomsByCapacity(rooms || []);
          this.loading = false;
        },
        error: (error) => {
          Toastify({
            text: "Failed to load rooms by location",
            duration: 3000,
            backgroundColor: "#ef4444"
          }).showToast();
          this.rooms = [];
          this.loading = false;
        }
      });
    } else {
      this.refreshData();
    }
  }

  filterRoomsByCapacity(rooms: RoomResponse[]): RoomResponse[] {
    if (!this.employeeCount) return rooms;
    const minCapacity = Number(this.employeeCount);
    return rooms.filter(room => room.Capacity >= minCapacity);
  }

  getLocationName(locationId: number): string {
    const location = this.locations.find(l => l.LocationId === locationId);
    return location ? location.City : 'Unknown';
  }

  openBookingModal(room: RoomResponse): void {
    this.selectedRoom = room;
    this.showBookingModal = true;
    // Set default times (current time + 1 hour)
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    this.bookingData = {
      meetingName: '',
      startTime: this.formatDateTimeLocal(startTime),
      endTime: this.formatDateTimeLocal(endTime),
      participantCount: room.Capacity,
      purpose: ''
    };
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedRoom = null;
  }

  bookRoom(): void {
    if (!this.selectedRoom) return;

    this.bookingLoading = true;
    const booking: CreateBookingRequest = {
      resourceId: this.selectedRoom.ResourceId,
      startTime: new Date(this.bookingData.startTime),
      endTime: new Date(this.bookingData.endTime),
      meetingName: this.bookingData.meetingName,
      participantCount: this.bookingData.participantCount,
      purpose: this.bookingData.purpose || undefined
    };

    this.bookingService.createBooking(booking).subscribe({
      next: (response) => {
        this.bookingLoading = false;
        this.cdr.detectChanges();
        Toastify({
          text: "Room booked successfully!",
          duration: 3000,
          backgroundColor: "#10b981"
        }).showToast();
        this.closeBookingModal();
      },
      error: (error) => {
        this.bookingLoading = false;
        this.cdr.detectChanges();
        Toastify({
          text: error?.error?.message || "Failed to book room. Please try again.",
          duration: 3000,
          backgroundColor: "#ef4444"
        }).showToast();
      }
    });
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getRoomImage(room: RoomResponse): string {
    if (room.RoomImage) {
      if (room.RoomImage.startsWith('data:') || room.RoomImage.startsWith('http')) {
        return room.RoomImage;
      }
      return `data:image/jpeg;base64,${room.RoomImage}`;
    }
    return '';
  }
}