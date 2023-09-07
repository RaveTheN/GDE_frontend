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

  //Stores the filters to be passed to create-layer.component
  apiFilters: string[] = [];

  /**
   * Sets apiFilters with the data provided by getFilters().
   * @param data - An array of filter data to set.
   */
  setFilters(data: string[]): void {
    this.apiFilters = data;
  }

  /**
   * Retrieves filters for a specific city from the API.
   * @param cityValue - The city for which filters are requested.
   * @returns A Promise that resolves with the retrieved filters.
   */
  public getFilters(cityValue: string) {
    return new Promise((resolve, reject) => {
      const url = "http://localhost:9090/api/filter/";
      this.http
        .post(url, JSON.stringify({ city: cityValue }), {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
          }),
          responseType: "text",
        })
        .subscribe(
          (data) => {
            // Clean up the data and split it into an array
            const cleanData = data.replace(/[\[\],]/g, "");
            const dataArray = cleanData.split(" ");

            // Set the filters and resolve the Promise with the filter data
            resolve(this.setFilters(dataArray));
          },
          (error) => {
            console.log(error);
            if (
              error.status === 400 ||
              error.error.text === "Request retrieved"
            )
              // Resolve with an error message if the request is successful but contains an error message
              resolve(error.error.text);
            // Reject the Promise with the error
            else reject(error);
          }
        );
    });
  }

  //Stores the points to be passed to create-layer.component
  apiPoints = {};

  /**
   * Retrieves circle data for specified filters and adds markers to the map.
   * @param body - An object containing city, filter, point, radius end external.
   * external - means whether to search inside or outside the shape.
   * @returns A Promise that resolves when data is retrieved and markers are added.
   */
  public async getPointRadiusData(body: {
    city: string;
    filter: string[];
    point: {};
    radius: Number;
    external: boolean; //true by default, for now
  }): Promise<void> {
    try {
      // Create an array to store all the HTTP request promises
      const requestPromises: Promise<any>[] = [];

      // Iterate through each filter
      for (const filter of body.filter) {
        this.apiPoints[filter] = L.layerGroup();
        const url = `http://localhost:9090/api/pointradiusdata/`;

        // Create a promise for each HTTP request and push it to the array
        const requestPromise = this.makeHttpRequest(url, {
          city: body.city,
          filter: [filter],
          point: body.point,
          radius: body.radius,
          external: true,
        });

        requestPromises.push(requestPromise);
      }

      // Wait for all HTTP requests to complete
      const responseDataArray = await Promise.all(requestPromises);

      // Process and add markers to the map
      responseDataArray.forEach((responseData, index) => {
        const filter = body.filter[index];
        const markers = this.processFigureData(responseData);

        // Add markers to the corresponding layer group
        markers.forEach((marker) => marker.addTo(this.apiPoints[filter]));
      });

      console.log(this.apiPoints);
    } catch (error) {
      console.error(error);
      throw error; // Re-throw the error for proper handling elsewhere
    }
  }

  /**
   * Retrieves polygon data for specified filters and adds markers to the map.
   * @param body - An object containing city, filter, and polygon data.
   * @returns A Promise that resolves when data is retrieved and markers are added.
   */
  public async getPolygonData(body: {
    city: string;
    filter: string[];
    polygon: {}[];
  }): Promise<void> {
    try {
      // Create an array to store all the HTTP request promises
      const requestPromises: Promise<any>[] = [];

      // Iterate through each filter
      for (const filter of body.filter) {
        this.apiPoints[filter] = L.layerGroup();
        const url = `http://localhost:9090/api/polygondata/`;

        // Create a promise for each HTTP request and push it to the array
        const requestPromise = this.makeHttpRequest(url, {
          city: body.city,
          filter: [filter],
          polygon: body.polygon,
        });

        requestPromises.push(requestPromise);
      }

      // Wait for all HTTP requests to complete
      const responseDataArray = await Promise.all(requestPromises);

      // Process and add markers to the map
      responseDataArray.forEach((responseData, index) => {
        const filter = body.filter[index];
        const markers = this.processFigureData(responseData);

        // Add markers to the corresponding layer group
        markers.forEach((marker) => marker.addTo(this.apiPoints[filter]));
      });

      console.log(this.apiPoints);
    } catch (error) {
      console.error(error);
      throw error; // Re-throw the error for proper handling elsewhere
    }
  }

  /**
   * Makes an HTTP POST request to the specified URL with the given data.
   * @param url - The URL to send the request to.
   * @param data - The data to send in the request body.
   * @returns A Promise that resolves with the response data.
   */
  private makeHttpRequest(url: string, data: any): Promise<any> {
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
    });

    return this.http
      .post(url, data, { headers })
      .toPromise()
      .catch((error) => {
        if (error.status === 200 || error.error?.text === "Request retrieved") {
          return error.error.text;
        } else {
          throw error;
        }
      });
  }

  /**
   * Processes the response data and creates markers.
   * @param responseData - The response data from the HTTP request.
   * @returns An array of markers.
   */
  private processFigureData(responseData: any): L.Marker[] {
    return responseData[0].features.map((element: any) => {
      const coordinates =
        element.geometry === null
          ? element.properties.location.value.coordinates
          : element.geometry.coordinates;

      return L.marker([coordinates[1], coordinates[0]], {
        icon: this.customIcon,
      }).bindPopup(`${element.properties.type}`);
    });
  }
}
