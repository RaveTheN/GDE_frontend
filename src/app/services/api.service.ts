import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  constructor(private http: HttpClient) {}

  public getFilters(body: { city: string }): any {
    return new Promise((resolve, reject) => {
      const url = "http://127.0.0.1:9090/api/filter/";
      this.http
        .post<any>(url, body, {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
          }),
        })
        .subscribe(
          (data) => {
            console.log(data);
            resolve(data);
            console.log(body);
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
            console.log(body);
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
