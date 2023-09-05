import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import * as L from "leaflet";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  customIcon = L.icon({
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/88/Map_marker.svg",

    iconSize: [15, 35], // size of the icon
  });

  constructor(private http: HttpClient) {}

  apiFilters = [];

  setFilters(data: string[]) {
    this.apiFilters = data;
  }

  public getFilters(cityValue: string) {
    return new Promise((resolve, reject) => {
      const url = "http://localhost:9090/api/filter/";
      this.http
        .post(url, JSON.stringify({ city: cityValue }), {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,PATCH,OPTIONS",
          }),
          responseType: "text",
        })
        .subscribe(
          (data) => {
            const cleanData = data.replace(/[\[\],]/g, "");
            const dataArray = cleanData.split(" ");
            resolve(this.setFilters(dataArray));
            console.log(this.apiFilters);
          },
          (error) => {
            console.log(error);
            if (
              error.status === "400" ||
              error.error.text === "Request retrieved"
            )
              resolve(error.error.text);
            else reject(error);
          }
        );
    });
  }

  apiPoints: any = {
    points: [],
  };

  public getPolygonData(body: {
    city: string;
    filter: string[];
    polygon: {}[];
  }): any {
    return new Promise((resolve, reject) => {
      const url = "http://localhost:9090/api/polygondata/";
      this.http
        .post<any>(url, body, {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,PATCH,OPTIONS",
          }),
        })
        .subscribe(
          (data) => {
            resolve(
              data[0].features
                .map((element: any) =>
                  L.marker(
                    [
                      element.geometry.coordinates[1],
                      element.geometry.coordinates[0],
                    ],
                    {
                      icon: this.customIcon,
                    }
                  ).bindPopup(`${element.properties.type}`)
                )
                .forEach((element) => this.apiPoints.points.push(element))
            );
            console.log(this.apiPoints);
          },
          (error) => {
            console.log(error);
            if (
              error.status === "200" ||
              error.error.text === "Request retrieved"
            )
              resolve(error.error.text);
            else reject(error);
          }
        );
    });
  }
}
