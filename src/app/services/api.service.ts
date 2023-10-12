import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import * as L from "leaflet";
import * as turf from "@turf/turf";

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
      const url = `${environment.base_url}/api/filter/`;
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
   */
  public getPolygonData(body: {
    city: string;
    filter: string[];
    polygon: {}[];
  }): any {
    return new Promise((resolve, reject) => {
      //cycling once for each voice inside body.filter
      body.filter.forEach((f) => {
        //making a new key in apiPoint with the name of the current filter
        this.apiPoints[f] ? null : (this.apiPoints[f] = L.layerGroup());
        const url = `${environment.base_url}/api/multipolygondata/`;
        let tesselationResults = [];

        for (let layer of this.storedLayers) {
          var poly = turf.polygon(layer.geometry.coordinates);
          var triangles = turf.tesselate(poly);
          console.log(triangles);
          let feature: any;
          for (feature of triangles.features) {
            // console.log(feature);
            let polygonArray = [];
            // Flatten the nested array and push edges to the polygon array
            for (const coordinate of feature.geometry.coordinates.flat()) {
              const edge = {
                latitude: coordinate[1],
                longitude: coordinate[0],
              };
              polygonArray.push(edge);
            }
            tesselationResults.push(polygonArray);
            this.http
              .post<any>(
                url,
                { city: body.city, filter: [f], polygon: tesselationResults },
                {
                  headers: new HttpHeaders({
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,PATCH,OPTIONS",
                  }),
                }
              )
              .subscribe(
                (data) => {
                  resolve(
                    data.forEach((element) => {
                      element.features
                        .map((element: any) =>
                          element.geometry === null
                            ? L.marker(
                                [
                                  element.properties.location.value
                                    .coordinates[1],
                                  element.properties.location.value
                                    .coordinates[0],
                                ],
                                {
                                  icon: this.customIcon,
                                }
                              ).bindPopup(`${element.properties.type}`)
                            : L.marker(
                                [
                                  element.geometry.coordinates[1],
                                  element.geometry.coordinates[0],
                                ],
                                {
                                  icon: this.customIcon,
                                }
                              ).bindPopup(`${element.properties.type}`)
                        )
                        .forEach((element) => element.addTo(this.apiPoints[f]));
                    })
                  );
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
            tesselationResults = [];
          }
        }
      });
    });
  }

  /**
   * Retrieves circle data for specified filters and adds markers to the map.
   * @param body - An object containing city, filter, point, radius end external.
   * external - means whether to search inside or outside the shape.
   */
  public getPointRadiusData(body: any): any {
    return new Promise((resolve, reject) => {
      //cycling once for each voice inside body.filter
      body.filter.forEach((f) => {
        //making a new key in apiPoint with the name of the current filter
        this.apiPoints[f] ? null : (this.apiPoints[f] = L.layerGroup());
        console.log(this.apiPoints);
        const url = `${environment.base_url}/api/multipointradiusdata/`;
        this.http
          .post<any>(
            url,
            {
              city: body.city,
              filter: [f],
              multipoint: body.multipoint,
            },
            {
              headers: new HttpHeaders({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,PATCH,OPTIONS",
              }),
            }
          )
          .subscribe(
            (data) => {
              resolve(
                data.forEach((element) => {
                  element.features
                    .map((element: any) =>
                      element.geometry === null
                        ? L.marker(
                            [
                              element.properties.location.value.coordinates[1],
                              element.properties.location.value.coordinates[0],
                            ],
                            {
                              icon: this.customIcon,
                            }
                          ).bindPopup(`${element.properties.type}`)
                        : L.marker(
                            [
                              element.geometry.coordinates[1],
                              element.geometry.coordinates[0],
                            ],
                            {
                              icon: this.customIcon,
                            }
                          ).bindPopup(`${element.properties.type}`)
                    )
                    .forEach((element) => element.addTo(this.apiPoints[f]));
                })
              );
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
    });
  }

  public storedLayers = [];

  public async saveSearch(queryDetails: any) {
    return new Promise((resolve, reject) => {
      let featuresArray = [];
      for (const filter of queryDetails.filters) {
        //extracting coordinates from apiPoints (which contains all the points obtained from the last search)
        //in alternative to apiPoints I could use overlayMaps from create-layer, which after a research contains the same data of apiPoints
        let coordinates = [];
        for (let obj of Object.entries<any>(this.apiPoints[filter]._layers)) {
          coordinates.push([obj[1]._latlng.lat, obj[1]._latlng.lng]);
        }
        featuresArray.push(
          Object({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [coordinates],
            },
            properties: {
              name: filter,
            },
          })
        );
      }
      const url = `${environment.base_url}/api/document/save/`;
      const body = {
        city: queryDetails.city,
        filter: queryDetails.filters,
        name: queryDetails.queryName,
        description: queryDetails.queryDescription,
        layers: queryDetails.layers,
        requestJson: {
          type: "Polygon/PointRadius/Multipolygon",
          value: queryDetails,
        },
        geojson: {
          type: "Feature",
          features: featuresArray,
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
        .get(`${environment.base_url}/api/document/${id}`)
        .subscribe((data: any) => {
          // Extract the 'filter' property from the API response
          let filter = data.filter;
          filter.forEach((filterName, index) => {
            this.apiPoints[filterName] = L.layerGroup();
            console.log(data);

            // Extract the coordinates of the search results and create markers for each
            let markers = data.geojson.properties.features[
              index
            ].geometry.coordinates[0].map((coordinate: [number, number]) => {
              // Create markers using the custom icon declared at the beginning and bind a popup with the filter name
              return L.marker([coordinate[0], coordinate[1]], {
                icon: this.customIcon,
              }).bindPopup(`${filterName}`);
            });

            // Add markers to the corresponding layer group
            markers.forEach((marker: L.Marker) =>
              marker.addTo(this.apiPoints[filterName])
            );
          });

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
        .get(`${environment.base_url}/api/document/getdocuments`, {
          headers: new HttpHeaders({
            Authorization:
              "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJCQUpfRm04T0tOdXlBaXB2MTA5VElsOENpdHpxWGlSR0FCUHI2NWx4M2c0In0.eyJleHAiOjE2ODMwMzIwOTYsImlhdCI6MTY4MzAzMTc5NiwiYXV0aF90aW1lIjoxNjgzMDMxNzk1LCJqdGkiOiJmNjZlYzg3MC1mMWM5LTQxM2UtODZiZS05ODU3ZGNlZjFlNGQiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODUvYXV0aC9yZWFsbXMvU3BvdHRlZCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNjIzYTUwNi1mODAzLTQ5NjktYTVhMi01Yjk4MjU2NDMxNjciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzcG90dGVkIiwic2Vzc2lvbl9zdGF0ZSI6IjBmMDk3ZTExLTZmYjUtNGNhZC1iZDkzLTMwNjA5ZDZmMmQ3NiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXNwb3R0ZWQiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiIwZjA5N2UxMS02ZmI1LTRjYWQtYmQ5My0zMDYwOWQ2ZjJkNzYiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJSaXRhIEdhZXRhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoicml0YS5nYWV0YUBlbmcuaXQiLCJnaXZlbl9uYW1lIjoiUml0YSIsImZhbWlseV9uYW1lIjoiR2FldGEiLCJlbWFpbCI6InJpdGEuZ2FldGFAZW5nLml0In0.RVBSlrsLL7TRNSxEEXkP1F0RX0cw7cwEbVHPJg9-MNzYzWHDQJE0wDqFgL2u_d_E2I9B1vu5tLbL0pEEUnmnzj5cIsIz4eP2uGbq-0wIG08Xf3eZLQjd8ZvsIact5u_L_Cs400OUMVOsUyuq-B9k39_HevsaMbHIzHpaXiWKur6J77KzIcbg-UQ5sfq11HZMkrZnxNnHWvBJxdzV-ZQiD7Lav-_AGb32ZQ0zIb5sQ2LE-CI2_531LNjXOcHu8vG6wNarJ9XZgFeXfToe9W_y1LFJ1vJbv1RvIazZiXhJlCULbZ1XI0hP-lW1PAi3XonMKcVcT1B6EiGWQy2x3CqzGg",
          }),
        })
        .subscribe((data: any) => {
          //remove leftover voices from previous usage
          this.allProjects = [];
          //insert new entries inside array
          data
            .map((e: any) =>
              Object({
                id: e.id,
                name: e.name,
                description: e.description,
                city: e.city,
                filters: e.filter,
              })
            )
            .forEach((e: any) => this.allProjects.push(e));
          resolve(this.allProjects);
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
        .delete(`${environment.base_url}/api/document/${id}`)
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
    return new Promise((resolve, reject) => {
      let featuresArray = [];
      for (const filter of queryDetails.filters) {
        //extracting coordinates from apiPoints (which contains all the points obtained from the last search)
        //in alternative to apiPoints I could use overlayMaps from create-layer, which after a research contains the same data of apiPoints
        let coordinates = [];
        for (let obj of Object.entries<any>(this.apiPoints[filter]._layers)) {
          coordinates.push([obj[1]._latlng.lat, obj[1]._latlng.lng]);
        }
        featuresArray.push(
          Object({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [coordinates],
            },
            properties: {
              name: filter,
            },
          })
        );
      }
      const url = `${environment.base_url}/api/document/update/`;
      const body = {
        id: queryDetails.id,
        userEmail: '"rita.gaeta@eng.it"',
        userID: '"f623a506-f803-4969-a5a2-5b9825643167"',
        city: queryDetails.city,
        filter: queryDetails.filters,
        name: queryDetails.queryName,
        description: queryDetails.queryDescription,
        layers: queryDetails.layers,
        requestJson: {
          type: "Polygon/PointRadius/Multipolygon",
          value: queryDetails,
        },
        geojson: {
          type: "Feature",
          features: featuresArray,
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
