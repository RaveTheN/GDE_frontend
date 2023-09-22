import { Component, OnInit, AfterContentInit } from "@angular/core";
import { ApiService } from "../../services/api.service";

@Component({
  selector: "ngx-available-options",
  templateUrl: "./available-options.component.html",
  styleUrls: ["./available-options.component.scss"],
})
export class AvailableOptionsComponent implements OnInit {
  previousSearches: any = this.apiServices.allProjects;

  constructor(private apiServices: ApiService) {}

  //storing selected search Id(s) into services
  public storeIds(id: string) {
    this.apiServices.currentId = [];
    this.apiServices.currentId.push(id);
  }

  async ngOnInit() {
    try {
      await this.apiServices.getAll();
    } catch (error) {
      //Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  ngAfterContentInit(): void {
    console.log(this.apiServices.allProjects);
  }
}
