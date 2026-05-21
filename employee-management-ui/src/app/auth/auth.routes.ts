import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Login - Employee Management System' },
  { path: 'register', component: RegisterComponent, title: 'Register - Employee Management System' },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
