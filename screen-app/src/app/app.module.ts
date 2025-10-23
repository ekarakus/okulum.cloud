import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { KioskComponent } from './kiosk.component';

// register Turkish locale data for Angular pipes
registerLocaleData(localeTr);

@NgModule({
  declarations: [AppComponent, KioskComponent],
  imports: [BrowserModule, CommonModule, HttpClientModule],
  providers: [{ provide: LOCALE_ID, useValue: 'tr' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
