import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  constructor(private http: HttpClient) {}

  filters = [];

  setFilters(data: []) {
    this.filters = data;
  }

  public getFilters(cityValue: string) {
    return new Promise((resolve, reject) => {
      const url = "http://localhost:9090/api/filter/";
      this.http
        .post<any>(
          url,
          { city: "Helsinki" },
          {
            headers: new HttpHeaders({
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST,PATCH,OPTIONS",
            }),
          }
        )
        .subscribe(
          (filters) => {
            console.log(filters);
            resolve(filters);
          },
          (error) => {
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
            console.log(data);
            resolve(data);
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
