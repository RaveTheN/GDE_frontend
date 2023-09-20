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

  // Define the OpenStreetMap (osm) layer.
  private osm: L.TileLayer = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }
  );

  constructor(private apiServices: ApiService) {}

  /**
   * Initializes the map.
   */
  private initMap(): void {
    this.map = L.map("map", {
      center: [60.1699, 24.9384],
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
    try {
      // Fetch data from the API.
      await this.apiServices.getSearch(this.apiServices.currentId);
      this.overlayMaps = this.apiServices.apiPoints;
    } catch (error) {
      // Handle API call failure.
      console.error("API call failed:", error);
    }

    // Initialize the map after fetching data.
    this.initMap();
  }
}
