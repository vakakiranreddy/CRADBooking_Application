import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { BookRoomComponent } from './book-room.component';
import { BookingService } from '../../services/booking.service';
import { RoomService } from '../../services/room.service';
import { DeskService } from '../../services/desk.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

describe('BookRoomComponent', () => {
  let fixture: ComponentFixture<BookRoomComponent>;
  let component: BookRoomComponent;
  let bookingService: jasmine.SpyObj<BookingService>;

  beforeEach(async () => {
    bookingService = jasmine.createSpyObj<BookingService>('BookingService', ['createBooking']);
    bookingService.createBooking.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [BookRoomComponent],
      providers: [
        { provide: BookingService, useValue: bookingService },
        { provide: RoomService, useValue: jasmine.createSpyObj('RoomService', ['getRoomByResourceId']) },
        { provide: DeskService, useValue: jasmine.createSpyObj('DeskService', ['getDeskByResourceId']) },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['notify']) },
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['getCurrentUser']) },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookRoomComponent);
    component = fixture.componentInstance;
  });

  it('does not send a booking whose start time is in the past', () => {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    component.resourceId = 1;
    component.bookingForm.patchValue({
      meetingName: 'Past meeting',
      participantCount: 2,
      startTime: toLocalInputValue(start),
      endTime: toLocalInputValue(end)
    });

    component.onSubmit();

    expect(bookingService.createBooking).not.toHaveBeenCalled();
    expect(component.errorMessage).toMatch(/start time must be in the future/i);
    expect(component.loading).toBe(false);
  });
});
