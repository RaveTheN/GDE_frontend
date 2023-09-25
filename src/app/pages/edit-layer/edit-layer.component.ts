import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";
import { __await } from "tslib";
import { GeoJsonObject } from "geojson";

@Component({
  selector: "ngx-edit-layer",
  templateUrl: "./edit-layer.component.html",
  styleUrls: ["./edit-layer.component.scss"],
})
export class EditLayerComponent implements OnInit {
  /**
   * Variables
   */
  //hiding alerts by default
  hidingAlerts: boolean = true;
  //showing alert when not selecting a filter
  isFilterOn: boolean = false;
  //showing alert when not drawing shape
  isDrawn: boolean = false;
  //alert when not selecting a city
  citySelected: boolean = false;

  //forms declaration
  firstForm: FormGroup;
  secondForm: FormGroup;

  //object in which to store the data input by the user
  queryDetails = {
    city: "",
    filters: [],
    polygon: [],
    point: {},
    radius: 0,
    external: true,
    queryName: "",
    queryDescription: "",
    layer: [],
  };

  constructor(private apiServices: ApiService) {}

  /**
   * Step 1 map rendering
   */
  public map: any;

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });

  //map for step 1
  private initFiltersMap(data: any = null): void {
    this.map = L.map("map", {
      center: [60.1699, 24.9384], //!!! Temporary
      zoom: 12,
      layers: [this.osm],
    });

    //layer control lets you select which layers you want to see
    L.control.layers(null, this.overlayMaps).addTo(this.map);

    // Loop through your overlayMaps keys and add them to the map
    for (const key in this.overlayMaps) {
      if (this.overlayMaps.hasOwnProperty(key)) {
        this.overlayMaps[key] = this.overlayMaps[key];
        this.overlayMaps[key].addTo(this.map); // Add each overlay to the map
      }
    }

    // Initialise the FeatureGroup to store editable layers
    var editableLayers = new L.FeatureGroup();
    this.map.addLayer(editableLayers);

    // Initialise the draw control and pass it the FeatureGroup of editable layers
    var drawControl = new L.Control.Draw({
      edit: { featureGroup: editableLayers },
      position: "topright",
      draw: {
        marker: false,
        polyline: false,
        rectangle: <any>{ showArea: false },
        circlemarker: false,
      },
    });
    this.map.addControl(drawControl);

    //initialize function to draw areas inside the map
    this.map.on(L.Draw.Event.CREATED, function (e: any) {
      let drawingLayer = e.layer;
      //layer in which we are going to draw the selecion areas
      editableLayers.addLayer(drawingLayer);
    });

    console.log(data.query);

    let geojsonFeatures: any = JSON.parse(data.query);

    const style: any = {
      color: "#3388ff",
      opacity: 0.5,
      weight: 4,
    };

    var newPolygons = L.geoJSON(null);

    newPolygons = L.geoJSON(geojsonFeatures, {
      style,
    }).addTo(editableLayers);
  }

  /**
   * Check if the keys in the _layers.options are: stroke, color, weight, opacity, fill, fillColor, fillOpacity, clickable.
   * If it does the functions sets 'isDrawn' to true,
   * indicating that drawings are present on the map.
   */
  checkDrawing() {
    let layerCount = 0;

    //the settimout is to make sue that leaflet has added/removed the layers before we are counting them
    setTimeout(() => {
      for (let key in this.map._layers) {
        layerCount++;
      }

      //i must be > 3 as map._layers will always have at least 4 layers, if at least one drawing is present.
      layerCount > 3 ? (this.isDrawn = true) : (this.isDrawn = false);
      console.log("isdrawn: " + this.isDrawn);
      console.log(this.map._layers);
    }, 100);
  }

  // Usage: call checkDrawing() to check if there are drawings on the map.

  /**
   * Step3 map rendering
   */
  public finalMap: L.Map;

  overlayMaps = {};

  //map for step3
  public initFinalMap(): void {
    this.map = L.map("map", {
      center: [60.1699, 24.9384], //!!! Temporary
      zoom: 12,
      layers: [this.osm],
    });

    //layer control lets you select which layers you want to see
    L.control.layers(null, this.overlayMaps).addTo(this.map);

    // Loop through your overlayMaps and add them to the map
    for (const key in this.overlayMaps) {
      if (this.overlayMaps.hasOwnProperty(key)) {
        this.overlayMaps[key] = this.overlayMaps[key];
        this.overlayMaps[key].addTo(this.map); // Add each overlay to the map
      }
    }
  }

  async ngOnInit() {
    let data: any;
    this.firstForm = new FormGroup({
      filters: new FormControl("", Validators.required),
    });
    this.secondForm = new FormGroup({
      projectName: new FormControl(""),
      description: new FormControl(""),
    });

    try {
      data = await this.apiServices.getSearch(this.apiServices.currentId);
      this.initFiltersMap(data);
    } catch (error) {
      // Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  /**
   * Stepper controls
   */

  @ViewChild("stepper")
  stepper: NbStepperComponent;
  changeEvent: NbStepChangeEvent;

  public clearMap() {
    this.map != undefined ? (this.map = this.map.remove()) : null;
  }

  async onStepChange(event: any) {
    // The event object contains information about the current step and previous step.
    // You can access them as follows:
    this.changeEvent = event;

    switch (this.stepper.selectedIndex) {
      case 0:
        this.firstForm.reset();
        this.selectedFilters = [];
        this.queryDetails.polygon = [];
        this.queryDetails.point = {};
        this.queryDetails.radius = 0;
        this.hidingAlerts = true;
        this.isDrawn = true;
        this.isFilterOn = false;
        this.clearMap();
        setTimeout(() => this.initFiltersMap(), 100);
        break;
      case 1:
        this.clearMap();
        setTimeout(() => this.initFinalMap(), 100);
        break;
    }
  }

  //filters checkbox
  //this array serves as a token for the one that will be received from the backend
  filters = ["PointOfInterest", "2", "3"];

  onChange(f: string) {
    this.selectedFilters.includes(f)
      ? (this.selectedFilters = this.selectedFilters.filter(
          (filter) => filter !== f
        ))
      : this.selectedFilters.push(f);
    //set form status to invalid when no filter is selected
    this.selectedFilters.length === 0
      ? (this.isFilterOn = false)
      : (this.isFilterOn = true);
    this.queryDetails.filters = this.selectedFilters;
  }

  selectedFilters = [];

  /**
   * Step1 submit
   */
  async onFirstSubmit() {
    if (this.queryDetails.filters.length !== 0) {
      // Move the stepper.next() call here to ensure it's executed after the API call
      this.isDrawn && this.isFilterOn
        ? this.stepper.next()
        : (this.hidingAlerts = false);
    }
  }

  /**
   * Step2 submit
   */
  onThirdSubmit() {
    this.queryDetails.queryName = this.secondForm.value.projectName;
    this.queryDetails.queryDescription = this.secondForm.value.description;
  }
}
