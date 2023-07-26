import { NgModule } from "@angular/core";
import { MapComponent } from "./map/map.component";
import { BrowserModule } from "@angular/platform-browser";
import { StepperComponent } from "./stepper.component";

@NgModule({
  declarations: [MapComponent],
  imports: [BrowserModule],
  bootstrap: [StepperComponent],
})
export class StepperModule {}
