import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { StepperComponent } from "./stepper/stepper.component";
import { MapCreationComponent } from "./map-creation.component";

const routes: Routes = [
  {
    path: "",
    component: StepperComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MapCreationRoutingModule {}
