import { ExtraOptions, RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";

export const routes: Routes = [
  // {
  //   path: "pages",
  //   loadChildren: () =>
  //     import("./pages/pages.module").then((m) => m.PagesModule),
  // },
  { path: "", redirectTo: "map-creation", pathMatch: "full" },
  { path: "**", redirectTo: "map-creation" },
  {
    path: "map-creation",
    loadChildren: () =>
      import("./map-creation/map-creation.module").then(
        (m) => m.MapCreationModule
      ),
  },
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
