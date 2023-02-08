import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { RadarComponent } from "./pages/radar/radar.component";
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

@NgModule({
  declarations: [AppComponent, RadarComponent, MainLayoutComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
