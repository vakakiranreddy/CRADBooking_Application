import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RoomListComponent } from './components/rooms/room-list.component';
import { BookRoomComponent } from './components/bookings/book-room.component';
import { MyBookingsComponent } from './components/bookings/my-bookings.component';
import { UserEventsComponent } from './components/events/user-events.component';
import { DeskListComponent } from './components/desks/desk-list.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { EmployeesComponent } from './components/admin/employees/employees.component';
import { RoomBookingsComponent } from './components/admin/room-bookings/room-bookings.component';
import { DeskBookingsComponent } from './components/admin/desk-bookings/desk-bookings.component';
import { MyBookingsComponent as AdminMyBookingsComponent } from './components/admin/my-bookings/my-bookings.component';
import { BookingListComponent } from './components/admin/booking-list/booking-list.component';
import { LocationsComponent } from './components/admin/locations/locations.component';
import { ResourcesComponent } from './components/admin/resources/resources.component';
import { RoomsComponent } from './components/admin/rooms/rooms.component';
import { DesksComponent } from './components/admin/desks/desks.component';
import { EventManagementComponent } from './components/admin/event-management/event-management.component';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'rooms', component: RoomListComponent },
      { path: 'desks', component: DeskListComponent },
      { path: 'book-room', component: BookRoomComponent },
      { path: 'bookings', component: MyBookingsComponent },
      { path: 'events', component: UserEventsComponent },
      { path: 'events/:id', loadComponent: () => import('./components/events/event-details.component').then(m => m.EventDetailsComponent) },
      { path: 'calendar', loadComponent: () => import('./components/shared/calendar/calendar.component').then(m => m.CalendarComponent) },
      { path: 'notifications', loadComponent: () => import('./components/user/user-notifications.component').then(m => m.UserNotificationsComponent) },
      { path: 'profile', loadComponent: () => import('./components/user/user-profile.component').then(m => m.UserProfileComponent) },
      { 
        path: 'admin', 
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: AdminDashboardComponent },
          { path: 'employees', component: EmployeesComponent },
          { path: 'departments', loadComponent: () => import('./components/admin/departments/departments.component').then(m => m.DepartmentsComponent) },
          { path: 'bookings', component: BookingListComponent },
          { path: 'locations', component: LocationsComponent },
          { path: 'resources', component: ResourcesComponent },
          { path: 'rooms', component: RoomsComponent },
          { path: 'desks', component: DesksComponent },
          { path: 'room-bookings', component: RoomBookingsComponent },
          { path: 'desk-bookings', component: DeskBookingsComponent },
          { path: 'my-bookings', component: AdminMyBookingsComponent },
          { path: 'calendar', loadComponent: () => import('./components/shared/calendar/calendar.component').then(m => m.CalendarComponent) },
          { path: 'events', component: EventManagementComponent },
          { path: 'events/:id/rsvp', loadComponent: () => import('./components/admin/event-rsvp-details.component').then(m => m.EventRsvpDetailsComponent) },
          { path: 'notifications', loadComponent: () => import('./components/admin/notification-management.component').then(m => m.NotificationManagementComponent) },
          { path: 'broadcasts', loadComponent: () => import('./components/admin/broadcast-management/broadcast-management.component').then(m => m.BroadcastManagementComponent) },
          { path: 'user-management', loadComponent: () => import('./components/admin/user-management/user-management.component').then(m => m.UserManagementComponent) }
        ]
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
