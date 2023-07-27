import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { CreateLayerComponent } from "./create-layer.component";
import { NbCardModule, NbStepperModule, NbThemeModule } from "@nebular/theme";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@NgModule({
  declarations: [
    CreateLayerComponent,
    NbStepperModule,
    FormsModule,
    NbThemeModule,
    ReactiveFormsModule,
    NbStepperModule,
    NbCardModule,
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [CreateLayerComponent],
})
export class CreateLayerModule {}
