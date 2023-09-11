import { Component } from "@angular/core";

@Component({
  selector: "ngx-available-options",
  templateUrl: "./available-options.component.html",
  styleUrls: ["./available-options.component.scss"],
})
export class AvailableOptionsComponent {
  previousSearches: any = [
    {
      name: "Project 1",
      id: "sim-122412fd-36bc-4f2q-8bwgf6y-dkjn44dc32",
      date: "2023-09-11",
      completed: true,
    },
    {
      name: "Project 2",
      id: "sim-122412fd-36bc-4f2q-8bwgf6y-dkjn44dc33",
      date: "2023-09-12",
      completed: false,
    },
    {
      name: "Project 3",
      id: "sim-122412fd-36bc-4f2q-8bwgf6y-dkjn44dc34",
      date: "2023-09-13",
      completed: true,
    },
  ];

  constructor() {}
}
