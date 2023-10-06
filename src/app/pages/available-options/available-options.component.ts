import { Component, OnInit, AfterContentInit } from "@angular/core";
import { ApiService } from "../../services/api.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "ngx-available-options",
  templateUrl: "./available-options.component.html",
  styleUrls: ["./available-options.component.scss"],
})
export class AvailableOptionsComponent implements OnInit {
  previousSearches: any = [];
  //languages
  selectedValue: number = 1; // Set the default value to 1

  constructor(
    private apiServices: ApiService,
    private translate: TranslateService
  ) {
    translate.setDefaultLang("en");
  }

  switchLanguage(language: string) {
    this.translate.use(language);
  }

  //storing selected search Id(s) into services
  public storeIds(id: string) {
    this.apiServices.currentId = [];
    this.apiServices.currentId.push(id);
  }

  async deleteSearch(id: string) {
    try {
      await this.apiServices.deleteEntry(id);
    } catch (error) {
      //Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  async ngOnInit() {
    //remove entries in storedLayers previous unfinished researches
    this.apiServices.storedLayers = [];
    try {
      this.previousSearches = await this.apiServices.getAll();
    } catch (error) {
      //Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  ngAfterContentInit(): void {
    console.log(this.apiServices.allProjects);
  }
}
