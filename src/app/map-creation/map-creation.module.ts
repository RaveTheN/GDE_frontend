import { NgModule } from "@angular/core";
import { StepperComponent } from "./stepper/stepper.component";
import { NbCardModule, NbStepperModule } from "@nebular/theme";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ThemeModule } from "../@theme/theme.module";
import { MapCreationRoutingModule } from "./map-creation-routing.module";

@NgModule({
  imports: [
    FormsModule,
    ThemeModule,
    ReactiveFormsModule,
    NbStepperModule,
    NbCardModule,
    MapCreationRoutingModule,
  ],
  declarations: [StepperComponent],
})
export class MapCreationModule {}
