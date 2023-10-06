import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
  NbCardModule,
  NbCheckboxModule,
  NbMenuModule,
  NbRadioModule,
  NbSelectModule,
  NbStepperModule,
} from "@nebular/theme";

import { ThemeModule } from "../@theme/theme.module";
import { PagesComponent } from "./pages.component";
import { PagesRoutingModule } from "./pages-routing.module";
import { MiscellaneousModule } from "./miscellaneous/miscellaneous.module";
import { CreateLayerComponent } from "./create-layer/create-layer.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AvailableOptionsComponent } from "./available-options/available-options.component";
import { ViewLayerComponent } from "./view-layer/view-layer.component";
import { EditLayerComponent } from "./edit-layer/edit-layer.component";
import { AuthService } from "../services/auth-service.service";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AuthInterceptorService } from "../services/auth-interceptor.service";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { HttpClient, HttpClientModule } from "@angular/common/http";

// Function for loading translation files
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

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
    MiscellaneousModule,
    NbSelectModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [
    PagesComponent,
    CreateLayerComponent,
    AvailableOptionsComponent,
    ViewLayerComponent,
    EditLayerComponent,
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PagesModule {}
