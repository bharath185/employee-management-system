import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgxEchartsModule } from 'ngx-echarts';

import {
  DashboardOutline, TeamOutline, SettingOutline, AuditOutline,
  MenuFoldOutline, MenuUnfoldOutline, UserOutline, LogoutOutline,
  BankOutline, PlusOutline, SearchOutline, CloseOutline, ClearOutline,
  FileTextOutline, DownloadOutline, UploadOutline, EyeOutline, EditOutline,
  DeleteOutline, MoreOutline, ContactsOutline, ToolOutline, CheckCircleOutline,
  PhoneOutline, CalendarOutline, WarningOutline, SaveOutline,
  BarChartOutline, PieChartOutline, HistoryOutline, ArrowRightOutline,
  EyeInvisibleOutline, LoadingOutline, ExclamationCircleOutline,
  TagOutline, HeartOutline, IdcardOutline, GoldOutline, BookOutline,
  SolutionOutline, ExperimentOutline, FolderOutline, HomeOutline,
  CameraOutline, MailOutline, EnvironmentOutline, InfoCircleOutline,
  ControlOutline, AppstoreOutline, LockOutline, UserAddOutline, UserDeleteOutline,
  InboxOutline, CheckOutline, StopOutline
} from '@ant-design/icons-angular/icons';

registerLocaleData(en);

const icons = [
  DashboardOutline, TeamOutline, SettingOutline, AuditOutline,
  MenuFoldOutline, MenuUnfoldOutline, UserOutline, LogoutOutline,
  BankOutline, PlusOutline, SearchOutline, CloseOutline, ClearOutline,
  FileTextOutline, DownloadOutline, UploadOutline, EyeOutline, EditOutline,
  DeleteOutline, MoreOutline, ContactsOutline, ToolOutline, CheckCircleOutline,
  PhoneOutline, CalendarOutline, WarningOutline, SaveOutline,
  BarChartOutline, PieChartOutline, HistoryOutline, ArrowRightOutline,
  EyeInvisibleOutline, LoadingOutline, ExclamationCircleOutline,
  TagOutline, HeartOutline, IdcardOutline, GoldOutline, BookOutline,
  SolutionOutline, ExperimentOutline, FolderOutline, HomeOutline,
  CameraOutline, MailOutline, EnvironmentOutline, InfoCircleOutline,
  ControlOutline, AppstoreOutline, LockOutline, UserAddOutline, UserDeleteOutline,
  InboxOutline, CheckOutline, StopOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideAnimations(),
    importProvidersFrom(
      ReactiveFormsModule,
      FormsModule,
      NzIconModule.forRoot(icons),
      NgxEchartsModule.forRoot({ echarts: () => import('echarts') })
    ),
    provideNzI18n(en_US),
  ]
};
