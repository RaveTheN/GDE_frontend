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

  getCookie(cname: string) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookiesArray = decodedCookie.split(";");
    for (let c of cookiesArray) {
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  switchLanguage(language: string) {
    document.cookie = `urbanageLanguage=${language}`;
    this.translate.use(this.getCookie("urbanageLanguage"));
  }

  //storing selected search Id(s) into services
  public storeIds(id: string) {
    localStorage.setItem("searchId", id);
  }

  async deleteSearch(id: string) {
    let element = document.getElementById(id);
    try {
      await this.apiServices.deleteEntry(id);
      element.remove();
    } catch (error) {
      //Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  async ngOnInit() {
    this.switchLanguage(this?.getCookie("urbanageLanguage"));
    document.getElementById("languageSelector");
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
  //delete confirmation
  confirmationId = "";

  setConfirmation(id) {
    this.confirmationId = id;
  }

  closeDialog() {
    this.confirmationId = "";
  }
}
