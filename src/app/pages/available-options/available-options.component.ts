import { Component } from "@angular/core";

@Component({
  selector: "ngx-available-options",
  templateUrl: "./available-options.component.html",
  styleUrls: ["./available-options.component.scss"],
})
export class AvailableOptionsComponent {
  previousSearches: string[] = ["Search 1", "Search 2", "Search 3"];

  constructor() {}
}
