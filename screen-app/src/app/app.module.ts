import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { KioskComponent } from './kiosk.component';

// register Turkish locale data for Angular pipes
registerLocaleData(localeTr);

const routes: Routes = [
  { path: '', component: KioskComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [AppComponent, KioskComponent],
  imports: [BrowserModule, CommonModule, HttpClientModule, RouterModule.forRoot(routes)],
  providers: [{ provide: LOCALE_ID, useValue: 'tr' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
