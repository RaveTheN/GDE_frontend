import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
  NbCardModule,
  NbCheckboxModule,
  NbMenuModule,
  NbRadioModule,
  NbStepperModule,
} from "@nebular/theme";

import { ThemeModule } from "../@theme/theme.module";
import { PagesComponent } from "./pages.component";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ECommerceModule } from "./e-commerce/e-commerce.module";
import { PagesRoutingModule } from "./pages-routing.module";
import { MiscellaneousModule } from "./miscellaneous/miscellaneous.module";
import { CreateLayerComponent } from "./create-layer/create-layer.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AvailableOptionsComponent } from "./available-options/available-options.component";

@NgModule({
  imports: [
    NbCheckboxModule,
    NbRadioModule,
    FormsModule,
    ReactiveFormsModule,
    NbCardModule,
    NbStepperModule,
    PagesRoutingModule,
    ThemeModule,
    NbMenuModule,
    DashboardModule,
    ECommerceModule,
    MiscellaneousModule,
  ],
  declarations: [
    PagesComponent,
    CreateLayerComponent,
    AvailableOptionsComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PagesModule {}
