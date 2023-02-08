import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RadarComponent } from "./pages/radar/radar.component";

const routes: Routes = [{ path: "", component: RadarComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
