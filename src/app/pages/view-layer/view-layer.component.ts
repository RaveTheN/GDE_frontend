import { Component, OnInit } from "@angular/core";
import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { ApiService } from "../../services/api.service";

@Component({
  selector: "ngx-view-layer",
  templateUrl: "./view-layer.component.html",
  styleUrls: ["./view-layer.component.scss"],
})
export class ViewLayerComponent implements OnInit {
  // Define map and overlayMaps as class properties with appropriate types.
  private map: L.Map;
  private overlayMaps: { [key: string]: L.Layer } = {};
  //controls spinner
  loading: boolean = false;

  // Define the OpenStreetMap (osm) layer.
  private osm: L.TileLayer = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }
  );

  constructor(private apiServices: ApiService) {}

  centerCityFromApi: any = [];
  /**
   * Initializes the map.
   */
  private initMap(): void {
    this.map = L.map("map", {
      center: this.centerCityFromApi,
      zoom: 12,
      layers: [this.osm],
    });

    // Layer control lets you select which layers you want to see.
    L.control.layers(null, this.overlayMaps).addTo(this.map);

    // Add each overlay to the map.
    for (const key in this.overlayMaps) {
      if (this.overlayMaps.hasOwnProperty(key)) {
        this.overlayMaps[key].addTo(this.map);
      }
    }
  }

  /**
   * Initializes the component.
   */
  async ngOnInit() {
    this.loading = false;
    this.apiServices.ngOnDestroy();
    let id = [];
    id.push(localStorage.getItem("searchId"));
    try {
      this.loading = true;
      // Fetch data from the API.
      let data: any = await this.apiServices.getSearch(id);
      this.overlayMaps = this.apiServices.apiPoints;
      this.loading = false;
      switch (data.city) {
        case "Helsinki":
          this.centerCityFromApi = [60.1699, 24.9384];
          break;
        case "Santander":
          this.centerCityFromApi = [43.462776, -3.805];
          break;
        case "Flanders":
          this.centerCityFromApi = [51.0501, 3.7303];
          break;
      }
    } catch (error) {
      // Handle API call failure.
      this.loading = false;
      console.error("API call failed:", error);
    }

    // Initialize the map after fetching data.
    this.initMap();
  }
}
