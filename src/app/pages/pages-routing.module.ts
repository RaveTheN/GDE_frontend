import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";

import { PagesComponent } from "./pages.component";
import { NotFoundComponent } from "./miscellaneous/not-found/not-found.component";
import { CreateLayerComponent } from "./create-layer/create-layer.component";
import { AvailableOptionsComponent } from "./available-options/available-options.component";

const routes: Routes = [
  {
    path: "",
    component: PagesComponent,
    children: [
      {
        path: "available-options",
        component: AvailableOptionsComponent,
      },
      {
        path: "create-layer",
        component: CreateLayerComponent,
      },
      {
        path: "",
        redirectTo: "available-options",
        pathMatch: "full",
      },
      {
        path: "**",
        component: NotFoundComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
