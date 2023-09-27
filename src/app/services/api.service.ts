import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { rejects } from "assert";
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

      // Process and add markers to the map (see bottom for responseData example)
      responseDataArray.forEach((responseData, index) => {
        const filter = body.filter[index];
        const markers = this.processMarkersCoordinates(
          responseData[0].features
        );

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
          external: false,
        });

        requestPromises.push(requestPromise);
      }

      // Wait for all HTTP requests to complete
      const responseDataArray = await Promise.all(requestPromises);

      // Process and add markers to the map (see bottom for responseData example)
      responseDataArray.forEach((responseData, index) => {
        console.log(JSON.stringify(body));
        const filter = body.filter[index];
        const markers = this.processMarkersCoordinates(
          responseData[0].features
        );

        // Add markers to the corresponding layer group
        markers.forEach((marker) => marker.addTo(this.apiPoints[filter]));
      });
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
  private processMarkersCoordinates(responseData: any): L.Marker[] {
    return responseData.map((element: any) => {
      const coordinates =
        element.geometry === null
          ? element.properties.location.value.coordinates
          : element.geometry.coordinates;

      return L.marker([coordinates[1], coordinates[0]], {
        icon: this.customIcon,
      }).bindPopup(`${element.properties.type}`);
    });
  }

  public currentLayer = []; //dev purposes only

  public async saveSearch(queryDetails: any) {
    return new Promise((resolve, reject) => {
      console.log(queryDetails);
      for (const filter of queryDetails.filters) {
        //extracting coordinates from apiPoints (which contains all the points obtained from the last search)
        //in alternative to apiPoints I could use overlayMaps from create-layer, which after a research contains the same data of apiPoints
        let coordinates = [];
        for (let obj of Object.entries<any>(this.apiPoints[filter]._layers)) {
          coordinates.push([obj[1]._latlng.lat, obj[1]._latlng.lng]);
        }
        const url = "http://127.0.0.1:9090/api/document/save/";
        const body = {
          city: queryDetails.city,
          filter: [filter],
          name: queryDetails.queryName,
          description: queryDetails.queryDescription,
          query: JSON.stringify(queryDetails.geojsonFeatures),
          requestJson: {
            type: "Polygon/PointRadius/Multipolygon",
            value: queryDetails,
          },
          geojson: {
            type: "Feature",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [coordinates],
                },
                properties: {
                  name: queryDetails.queryName,
                },
              },
            ],
          },
        };
        this.http
          .post(url, body, {
            headers: new HttpHeaders({
              Authorization:
                "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJCQUpfRm04T0tOdXlBaXB2MTA5VElsOENpdHpxWGlSR0FCUHI2NWx4M2c0In0.eyJleHAiOjE2ODMwMzIwOTYsImlhdCI6MTY4MzAzMTc5NiwiYXV0aF90aW1lIjoxNjgzMDMxNzk1LCJqdGkiOiJmNjZlYzg3MC1mMWM5LTQxM2UtODZiZS05ODU3ZGNlZjFlNGQiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODUvYXV0aC9yZWFsbXMvU3BvdHRlZCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNjIzYTUwNi1mODAzLTQ5NjktYTVhMi01Yjk4MjU2NDMxNjciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzcG90dGVkIiwic2Vzc2lvbl9zdGF0ZSI6IjBmMDk3ZTExLTZmYjUtNGNhZC1iZDkzLTMwNjA5ZDZmMmQ3NiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXNwb3R0ZWQiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiIwZjA5N2UxMS02ZmI1LTRjYWQtYmQ5My0zMDYwOWQ2ZjJkNzYiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJSaXRhIEdhZXRhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoicml0YS5nYWV0YUBlbmcuaXQiLCJnaXZlbl9uYW1lIjoiUml0YSIsImZhbWlseV9uYW1lIjoiR2FldGEiLCJlbWFpbCI6InJpdGEuZ2FldGFAZW5nLml0In0.RVBSlrsLL7TRNSxEEXkP1F0RX0cw7cwEbVHPJg9-MNzYzWHDQJE0wDqFgL2u_d_E2I9B1vu5tLbL0pEEUnmnzj5cIsIz4eP2uGbq-0wIG08Xf3eZLQjd8ZvsIact5u_L_Cs400OUMVOsUyuq-B9k39_HevsaMbHIzHpaXiWKur6J77KzIcbg-UQ5sfq11HZMkrZnxNnHWvBJxdzV-ZQiD7Lav-_AGb32ZQ0zIb5sQ2LE-CI2_531LNjXOcHu8vG6wNarJ9XZgFeXfToe9W_y1LFJ1vJbv1RvIazZiXhJlCULbZ1XI0hP-lW1PAi3XonMKcVcT1B6EiGWQy2x3CqzGg",
              "Content-Type": "application/json",
            }),
            responseType: "text",
          })
          .subscribe((data) => {
            resolve(console.log(data));
          }),
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
          };
      }
    });
  }

  public currentId = [];

  /**
   * This function performs a search for documents based on the provided IDs.
   * @param id - An array of document IDs to search for.
   * @returns A Promise that resolves with markers representing the search results on a map or an error message.
   */
  public getSearch(id: string[]) {
    return new Promise((resolve, reject) => {
      // Send an HTTP GET request to the API to retrieve search results for the provided IDs
      this.http
        .get(`http://127.0.0.1:9090/api/document/${id}`)
        .subscribe((data: any) => {
          // Extract the 'filter' property from the API response
          let filter = data.filter;
          this.apiPoints[filter] = L.layerGroup();

          // Extract the coordinates of the search results and create markers for each
          let markers =
            data.geojson.properties.features[0].geometry.coordinates[0].map(
              (coordinate: [number, number]) => {
                // Create markers using the custom icon declared at the beginning and bind a popup with the filter name
                return L.marker([coordinate[0], coordinate[1]], {
                  icon: this.customIcon,
                }).bindPopup(`${filter}`);
              }
            );

          // Add markers to the corresponding layer group
          markers.forEach((marker: L.Marker) =>
            marker.addTo(this.apiPoints[filter])
          );

          resolve(data);
        }),
        (error) => {
          console.log(error);
          if (error.status === 400 || error.error.text === "Request retrieved")
            // Resolve with an error message if the request is successful but contains an error message
            resolve(error.error.text);
          // Reject the Promise with the error
          else reject(error);
        };
    });
  }

  allProjects = [];

  public getAll() {
    return new Promise((resolve, reject) => {
      this.http
        .get("http://127.0.0.1:9090/api/document/getdocuments", {
          headers: new HttpHeaders({
            Authorization:
              "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJCQUpfRm04T0tOdXlBaXB2MTA5VElsOENpdHpxWGlSR0FCUHI2NWx4M2c0In0.eyJleHAiOjE2ODMwMzIwOTYsImlhdCI6MTY4MzAzMTc5NiwiYXV0aF90aW1lIjoxNjgzMDMxNzk1LCJqdGkiOiJmNjZlYzg3MC1mMWM5LTQxM2UtODZiZS05ODU3ZGNlZjFlNGQiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODUvYXV0aC9yZWFsbXMvU3BvdHRlZCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNjIzYTUwNi1mODAzLTQ5NjktYTVhMi01Yjk4MjU2NDMxNjciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzcG90dGVkIiwic2Vzc2lvbl9zdGF0ZSI6IjBmMDk3ZTExLTZmYjUtNGNhZC1iZDkzLTMwNjA5ZDZmMmQ3NiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXNwb3R0ZWQiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiIwZjA5N2UxMS02ZmI1LTRjYWQtYmQ5My0zMDYwOWQ2ZjJkNzYiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJSaXRhIEdhZXRhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoicml0YS5nYWV0YUBlbmcuaXQiLCJnaXZlbl9uYW1lIjoiUml0YSIsImZhbWlseV9uYW1lIjoiR2FldGEiLCJlbWFpbCI6InJpdGEuZ2FldGFAZW5nLml0In0.RVBSlrsLL7TRNSxEEXkP1F0RX0cw7cwEbVHPJg9-MNzYzWHDQJE0wDqFgL2u_d_E2I9B1vu5tLbL0pEEUnmnzj5cIsIz4eP2uGbq-0wIG08Xf3eZLQjd8ZvsIact5u_L_Cs400OUMVOsUyuq-B9k39_HevsaMbHIzHpaXiWKur6J77KzIcbg-UQ5sfq11HZMkrZnxNnHWvBJxdzV-ZQiD7Lav-_AGb32ZQ0zIb5sQ2LE-CI2_531LNjXOcHu8vG6wNarJ9XZgFeXfToe9W_y1LFJ1vJbv1RvIazZiXhJlCULbZ1XI0hP-lW1PAi3XonMKcVcT1B6EiGWQy2x3CqzGg",
          }),
        })
        .subscribe((data: any) => {
          console.log(data);
          data
            .map((e: any) =>
              Object({
                name: e.name,
                id: e.id,
                date: "2023-09-11",
                completed: true,
              })
            )
            .forEach((e: any) => this.allProjects.push(e));
          console.log(this.allProjects);
        }),
        (error) => {
          console.log(error);
          if (error.status === 400 || error.error.text === "Request retrieved")
            // Resolve with an error message if the request is successful but contains an error message
            resolve(error.error.text);
          // Reject the Promise with the error
          else reject(error);
        };
    });
  }

  public deleteEntry(id: string) {
    return new Promise((resolve, reject) => {
      this.http
        .delete(`http://127.0.0.1:9090/api/document/${id}`)
        .subscribe((data: any) => {
          resolve("entry deleted");
        }),
        (error) => {
          console.log(error);
          if (error.status === 400 || error.error.text === "Request retrieved")
            // Resolve with an error message if the request is successful but contains an error message
            resolve(error.error.text);
          // Reject the Promise with the error
          else reject(error);
        };
    });
  }

  public async updateSearch(queryDetails: any) {
    console.log(queryDetails);
    return new Promise((resolve, reject) => {
      for (const filter of queryDetails.filters) {
        //extracting coordinates from apiPoints (which contains all the points obtained from the last search)
        //in alternative to apiPoints I could use overlayMaps from create-layer, which after a research contains the same data of apiPoints
        let coordinates = [];
        for (let obj of Object.entries<any>(this.apiPoints[filter]._layers)) {
          coordinates.push([obj[1]._latlng.lat, obj[1]._latlng.lng]);
        }
        const url = "http://127.0.0.1:9090/api/document/save/";
        const body = {
          id: queryDetails.id,
          userEmail: '"rita.gaeta@eng.it"',
          userID: '"f623a506-f803-4969-a5a2-5b9825643167"',
          city: queryDetails.city,
          filter: [filter],
          name: queryDetails.queryName,
          description: queryDetails.queryDescription,
          query: JSON.stringify(queryDetails.geojsonFeatures),
          requestJson: {
            type: "Polygon/PointRadius/Multipolygon",
            value: queryDetails,
          },
          geojson: {
            type: "Feature",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [coordinates],
                },
                properties: {
                  name: queryDetails.queryName,
                },
              },
            ],
          },
        };
        this.http
          .post(url, body, {
            headers: new HttpHeaders({
              Authorization:
                "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJCQUpfRm04T0tOdXlBaXB2MTA5VElsOENpdHpxWGlSR0FCUHI2NWx4M2c0In0.eyJleHAiOjE2ODMwMzIwOTYsImlhdCI6MTY4MzAzMTc5NiwiYXV0aF90aW1lIjoxNjgzMDMxNzk1LCJqdGkiOiJmNjZlYzg3MC1mMWM5LTQxM2UtODZiZS05ODU3ZGNlZjFlNGQiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODUvYXV0aC9yZWFsbXMvU3BvdHRlZCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNjIzYTUwNi1mODAzLTQ5NjktYTVhMi01Yjk4MjU2NDMxNjciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzcG90dGVkIiwic2Vzc2lvbl9zdGF0ZSI6IjBmMDk3ZTExLTZmYjUtNGNhZC1iZDkzLTMwNjA5ZDZmMmQ3NiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXNwb3R0ZWQiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiIwZjA5N2UxMS02ZmI1LTRjYWQtYmQ5My0zMDYwOWQ2ZjJkNzYiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJSaXRhIEdhZXRhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoicml0YS5nYWV0YUBlbmcuaXQiLCJnaXZlbl9uYW1lIjoiUml0YSIsImZhbWlseV9uYW1lIjoiR2FldGEiLCJlbWFpbCI6InJpdGEuZ2FldGFAZW5nLml0In0.RVBSlrsLL7TRNSxEEXkP1F0RX0cw7cwEbVHPJg9-MNzYzWHDQJE0wDqFgL2u_d_E2I9B1vu5tLbL0pEEUnmnzj5cIsIz4eP2uGbq-0wIG08Xf3eZLQjd8ZvsIact5u_L_Cs400OUMVOsUyuq-B9k39_HevsaMbHIzHpaXiWKur6J77KzIcbg-UQ5sfq11HZMkrZnxNnHWvBJxdzV-ZQiD7Lav-_AGb32ZQ0zIb5sQ2LE-CI2_531LNjXOcHu8vG6wNarJ9XZgFeXfToe9W_y1LFJ1vJbv1RvIazZiXhJlCULbZ1XI0hP-lW1PAi3XonMKcVcT1B6EiGWQy2x3CqzGg",
              "Content-Type": "application/json",
            }),
            responseType: "text",
          })
          .subscribe((data) => {
            resolve(console.log(data));
          }),
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
          };
      }
    });
  }
}

// responseData example =
//   [
//     {
//       type: "FeatureCollection",
//       features: [
//         {
//           id: "urn:ngsi-ld:Open311ServiceRequest:Helsinki:iot10",
//           type: "Feature",
//           properties: {
//             type: "Open311ServiceRequest",
//             comment: { type: "Property", value: "" },
//             created_at: {
//               type: "Property",
//               value: {
//                 type: "DateTime",
//                 value: "2023-09-19T06:32:26.488Z",
//               },
//             },
//             device_id: { type: "Property", value: "" },
//             image: { type: "Property", value: "" },
//             tags: { type: "Property", value: [] },
//             location: {
//               type: "GeoProperty",
//               value: {
//                 type: "Point",
//                 coordinates: [24.944594, 60.161347],
//               },
//             },
//           },
//           "@context":
//             "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
//           geometry: {
//             type: "Point",
//             coordinates: [24.944594, 60.161347],
//           },
//         },
//       ],
//     },
//   ],
// ];
