import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";
import { __await } from "tslib";

@Component({
  selector: "ngx-view-layer",
  templateUrl: "./view-layer.component.html",
  styleUrls: ["./view-layer.component.scss"],
})
export class ViewLayerComponent implements OnInit {
  constructor() {}

  /**
   * map rendering
   */

  public map: any;

  overlayMaps = {};

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });

  public initMap(): void {
    this.map = L.map("map", {
      center: [60.1699, 24.9384],
      zoom: 12,
      layers: [this.osm],
    });

    //layer control lets you select which layers you want to see
    const layerControl = L.control
      .layers(null, this.overlayMaps)
      .addTo(this.map);

    // Loop through your overlayMaps and add them to the map
    for (const key in this.overlayMaps) {
      if (this.overlayMaps.hasOwnProperty(key)) {
        this.overlayMaps[key] = this.overlayMaps[key];
        this.overlayMaps[key].addTo(this.map); // Add each overlay to the map
      }
    }
  }

  ngOnInit(): void {
    this.initMap();
  }
}
