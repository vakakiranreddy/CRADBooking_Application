import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { BookRoomComponent } from './book-room.component';
import { BookingService } from '../../services/booking.service';
import { RoomService } from '../../services/room.service';
import { DeskService } from '../../services/desk.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

describe('BookRoomComponent', () => {
  let component: BookRoomComponent;
  let bookingService: jasmine.SpyObj<BookingService>;

  beforeEach(async () => {
    bookingService = jasmine.createSpyObj<BookingService>('BookingService', ['createBooking']);
    bookingService.createBooking.and.returnValue(EMPTY);

    await TestBed.configureTestingModule({
      imports: [BookRoomComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: BookingService, useValue: bookingService },
        { provide: RoomService, useValue: jasmine.createSpyObj<RoomService>('RoomService', ['getRoomByResourceId']) },
        { provide: DeskService, useValue: jasmine.createSpyObj<DeskService>('DeskService', ['getDeskByResourceId']) },
        { provide: NotificationService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) }
      ]
    }).compileComponents();

    component = TestBed.createComponent(BookRoomComponent).componentInstance;
  });

  it('rejects a start time in the past and sets minDateTime to local now', () => {
    const before = formatLocalDateTime(new Date());
    component.ngOnInit();
    const after = formatLocalDateTime(new Date());

    // (1) The picker minimum must be the user's local current time, to the minute.
    expect([before, after]).toContain(component.minDateTime);

    // (2) A start two hours ago must be rejected with an error and never sent.
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    component.resourceId = 5;
    component.bookingForm.setValue({
      meetingName: 'Past meeting',
      participantCount: 3,
      startTime: formatLocalDateTime(twoHoursAgo),
      endTime: formatLocalDateTime(oneHourAgo),
      purpose: '',
      sendReminder: true
    });

    component.onSubmit();

    expect(component.errorMessage).not.toBe('');
    expect(bookingService.createBooking).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });
});
