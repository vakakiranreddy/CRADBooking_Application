import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { RoomService } from '../../services/room.service';
import { DeskService } from '../../services/desk.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { CreateBookingRequest } from '../../models/booking.models';
import { RoomResponse } from '../../models/room.models';
import { DeskResponse } from '../../models/desk.models';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-book-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-room.component.html',
  styleUrls: ['./book-room.component.css']
})
export class BookRoomComponent implements OnInit {
  bookingForm: FormGroup;
  loading = false;
  errorMessage = '';
  selectedRoom: RoomResponse | null = null;
  selectedDesk: DeskResponse | null = null;
  resourceId: number | null = null;
  resourceType: string = 'Resource';

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private roomService: RoomService,
    private deskService: DeskService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.bookingForm = this.fb.group({
      meetingName: ['', Validators.required],
      participantCount: ['', [Validators.required, Validators.min(1)]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      purpose: [''],
      sendReminder: [true]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['resourceId']) {
        this.resourceId = +params['resourceId'];
        this.resourceType = params['resourceType'] || 'Resource';
        this.loadResourceDetails();
      }
    });

    const now = new Date();
    const minDateTime = now.toISOString().slice(0, 16);
    const startTimeControl = document.getElementById('startTime') as HTMLInputElement;
    const endTimeControl = document.getElementById('endTime') as HTMLInputElement;
    
    setTimeout(() => {
      if (startTimeControl) startTimeControl.min = minDateTime;
      if (endTimeControl) endTimeControl.min = minDateTime;
    }, 100);
  }

  loadResourceDetails(): void {
    if (this.resourceId) {
      if (this.resourceType === 'Room') {
        this.roomService.getRoomByResourceId(this.resourceId).subscribe({
          next: (room) => {
            this.selectedRoom = room;
            this.bookingForm.patchValue({ participantCount: room.Capacity });
          },
          error: (error) => {
            Toastify({
              text: "Failed to load room details",
              duration: 3000,
              backgroundColor: "#ef4444"
            }).showToast();
          }
        });
      } else if (this.resourceType === 'Desk') {
        this.deskService.getDeskByResourceId(this.resourceId).subscribe({
          next: (desk) => {
            this.selectedDesk = desk;
            this.bookingForm.patchValue({ participantCount: 1 });
          },
          error: (error) => {
            Toastify({
              text: "Failed to load desk details",
              duration: 3000,
              backgroundColor: "#ef4444"
            }).showToast();
          }
        });
      }
    }
  }

  onSubmit(): void {
    if (this.bookingForm.valid && this.resourceId) {
      this.loading = true;
      this.errorMessage = '';

      const formValue = this.bookingForm.value;
      const startTime = new Date(formValue.startTime);
      const endTime = new Date(formValue.endTime);
      
      const booking: CreateBookingRequest = {
        resourceId: this.resourceId,
        startTime: startTime,
        endTime: endTime,
        meetingName: formValue.meetingName,
        participantCount: formValue.participantCount,
        purpose: formValue.purpose || undefined,
        sendReminder: formValue.sendReminder
      };

      if (booking.endTime <= booking.startTime) {
        this.errorMessage = 'End time must be after start time';
        this.loading = false;
        return;
      }

      console.log('Booking data being sent:', booking);
      console.log('Start time ISO:', booking.startTime.toISOString());
      console.log('End time ISO:', booking.endTime.toISOString());
      console.log('Current time:', new Date().toISOString());
      
      this.bookingService.createBooking(booking).subscribe({
        next: (response) => {
          this.loading = false;
          Toastify({
            text: this.resourceType + ' booked successfully!',
            duration: 3000,
            backgroundColor: "#10b981"
          }).showToast();
          this.router.navigate(['/bookings']);
        },
        error: (error) => {
          this.loading = false;
          console.error('Booking error:', error);
          console.error('Error details:', error.error);
          if (error.error?.errors) {
            console.error('Validation errors:', error.error.errors);
            let errorMsg = 'Validation failed:\n';
            Object.keys(error.error.errors).forEach(key => {
              errorMsg += `${key}: ${error.error.errors[key].join(', ')}\n`;
            });
            this.errorMessage = errorMsg;
          } else {
            this.errorMessage = error.error?.message || 'Failed to book room. Please try again.';
          }
        }
      });
    }
  }

  goBack(): void {
    if (this.resourceType === 'Desk') {
      this.router.navigate(['/desks']);
    } else {
      this.router.navigate(['/rooms']);
    }
  }
}
