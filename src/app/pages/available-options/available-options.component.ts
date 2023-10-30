import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../services/api.service";
import { TranslateService } from "@ngx-translate/core";
import { Router } from "@angular/router";

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
    private translate: TranslateService,
    private router: Router
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
    document.cookie = `language=${language}`;
    this.translate.use(this.getCookie("language"));
  }

  //storing selected search Id(s) into services
  public storeIds(id: string) {
    localStorage.setItem("searchId", id);
  }

  async deleteSearch(id: string) {
    let element = document.getElementById(id);
    let positionInArray: number;
    //get the position of the element we want to delete in the previousSearches array
    this.previousSearches.forEach((e) => {
      if (e.id === id) {
        //store the index in positionInArray
        positionInArray = this.previousSearches.indexOf(e);
      }
    });
    try {
      await this.apiServices.deleteEntry(id);
      element.remove();
      //remove element from the array
      this.previousSearches.splice(positionInArray, 1);
    } catch (error) {
      //Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  navigate() {
    this.router.navigate(["pages/create-layer"]);
  }

  async ngOnInit() {
    window.addEventListener(
      "message",
      (event) => {
        //this.receiveMessage();
        console.log("set token", event);
        if (event.data.hasOwnProperty("accessToken")) {
          localStorage.setItem("token", event.data.accessToken);
          document.cookie = `language=${event.data.language}`;
          console.log("after token");
          this.apiServices.storedLayers = [];
        }
      },
      false
    );

    this.switchLanguage(this?.getCookie("language"));
    document.getElementById("languageSelector");
    //remove entries in storedLayers from previous unfinished researches
    this.apiServices.storedLayers = [];
    try {
      this.previousSearches = await this.apiServices.getAll();
    } catch (error) {
      //Show a message in case of error
      console.error("API call failed:", error);
    }

    //empty any leftover layer from previous searches
    this.apiServices.storedLayers = [];
  }

  ngAfterContentInit(): void {
    // console.log(this.apiServices.allProjects);
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
