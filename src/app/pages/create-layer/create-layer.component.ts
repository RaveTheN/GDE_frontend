import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";
import { __await } from "tslib";

@Component({
  selector: "ngx-create-layer",
  templateUrl: "./create-layer.component.html",
  styleUrls: ["./create-layer.component.scss"],
})
export class CreateLayerComponent implements OnInit {
  /**
   * Variables
   */
  //hiding alerts by default
  hidingAlerts: boolean = true;
  //showing alert when not selecting a filter
  isFilterOn: boolean = false;
  //showing alert when not drawing shape
  isDrawn: boolean = false;
  //controlling the loading spinner
  loading = false;
  //alert when not selecting a city
  citySelected: boolean = false;

  //forms declaration
  firstForm: FormGroup;
  secondForm: FormGroup;
  thirdForm: FormGroup;

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
  };

  /**
   * Step 1 - radio options
   */
  options = [
    { value: [[60.1699, 24.9384], "Helsinki"], label: "Helsinki" },
    { value: [[51.2213, 4.4051], "Antwerp"], label: "Antwerp" },
    { value: [[43.462776, -3.805], "Santander"], label: "Santander" },
  ];
  option: any;

  constructor(private apiServices: ApiService) {}

  /**
   * Step 2 map rendering
   */
  public map: any;

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });

  //map for step 2
  private initFiltersMap(): void {
    this.map = L.map("map", {
      //center: this.option[0],
      center: [60.1699, 24.9384], //set to Helsinki for developing purposes
      zoom: 12,
      layers: [this.osm],
    });

    // Initialise the FeatureGroup to store editable layers
    var editableLayers = new L.FeatureGroup();
    this.map.addLayer(editableLayers);

    console.log(editableLayers);

    this.apiServices.currentLayer.forEach((element) =>
      editableLayers.addLayer(element)
    );

    console.log(editableLayers);

    // Initialise the draw control and pass it the FeatureGroup of editable layers
    var drawControl = new L.Control.Draw({
      edit: { featureGroup: editableLayers },
      position: "topright",
      draw: {
        polyline: false,
        marker: false,
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
  }

  /**
   * Check if the keys in the _layers.options are: stroke, color, weight, opacity, fill, fillColor, fillOpacity, clickable.
   * If it does the functions sets 'isDrawn' to true,
   * indicating that drawings are present on the map.
   */
  checkDrawing() {
    //the settimout is to make sue that leaflet has added/removed the layers before we are checking them
    setTimeout(() => {
      Object.values(this.map._layers).forEach(
        (e: any) =>
          (this.isDrawn =
            Object.keys(e.options).toString() ===
            "stroke,color,weight,opacity,fill,fillColor,fillOpacity,clickable")
      );
      console.log(`isDrawn: ${this.isDrawn}`);
    }, 100);
  }

  // Usage: call checkDrawing() to check if there are drawings on the map.

  saveDrawings() {
    Object.values(this.map._layers).forEach(
      (e: any) =>
        Object.keys(e.options).toString() ===
          "stroke,color,weight,opacity,fill,fillColor,fillOpacity,clickable" &&
        this.apiServices.currentLayer.push(e)
    );
    console.log(this.apiServices.currentLayer);
  }

  /**
   * Step3 map rendering
   */
  public finalMap: L.Map;

  overlayMaps: any = {};

  //map for step3
  public initFinalMap(): void {
    this.map = L.map("map", {
      center: this.option[0],
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
  }

  ngOnInit() {
    //Step 1 radio validator
    this.firstForm = new FormGroup({
      cityOptions: new FormControl(null, Validators.required),
    });

    this.secondForm = new FormGroup({
      filters: new FormControl("", Validators.required),
    });
    this.thirdForm = new FormGroup({
      projectName: new FormControl(""),
      description: new FormControl(""),
    });
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
        //emptying filters everytime the city selection step renders
        this.filters = [];
        break;
      case 1:
        this.secondForm.reset();
        this.selectedFilters = [];
        this.queryDetails.polygon = [];
        this.queryDetails.point = {};
        this.queryDetails.radius = 0;
        this.hidingAlerts = true;
        this.isDrawn = false;
        this.isFilterOn = false;
        this.clearMap();
        setTimeout(() => this.initFiltersMap(), 100);
        break;
      case 2:
        this.clearMap();
        setTimeout(() => this.initFinalMap(), 100);
        break;
    }
  }

  /**
   * Step1 submit
   */
  async onFirstSubmit() {
    this.citySelected = true;
    this.queryDetails.city = this.option[1];
    if (this.queryDetails.city !== "" && this.firstForm.status !== "INVALID") {
      this.loading = true;
      try {
        await this.apiServices.getFilters(this.queryDetails.city);
        //pushing fetch results in this.filters
        this.apiServices.apiFilters.forEach((element) => {
          this.filters.push(element);
        });
        //go to step 2
        this.stepper.next();
        this.loading = false;
      } catch (error) {
        this.loading = false;
        //Show a message in case of error
        console.error("API call failed:", error);
      }
    }
  }

  //filters checkbox
  filters = [];

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
   * Step2 submit
   */
  async onSecondSubmit() {
    var layer: any;
    this.queryDetails.polygon = [];
    this.apiServices.apiPoints = {};
    console.log(this.map._layers);
    for (layer of Object.values(this.map._layers)) {
      // For polygons, layer._latlngs[i] is an array of LatLngs objects
      if (Array.isArray(layer._latlngs)) {
        // Flatten the nested array and push edges to the polygon array
        for (const latlng of layer._latlngs.flat()) {
          const edge = {
            latitude: latlng.lat,
            longitude: latlng.lng,
          };
          this.queryDetails.polygon.push(edge);
        }
      } else if (layer._latlng && layer._radius) {
        this.queryDetails.point = layer._latlng;
        this.queryDetails.radius = layer._radius;

        console.log(
          "This is a circle: " +
            this.queryDetails.point +
            " " +
            this.queryDetails.radius
        );
      }
    }
    // Push the first edge again to complete the polygon
    if (this.queryDetails.polygon?.[0]) {
      const firstEdge = {
        latitude: this.queryDetails.polygon[0].latitude,
        longitude: this.queryDetails.polygon[0].longitude,
      };
      this.queryDetails.polygon.push(firstEdge);
    }
    console.log(this.queryDetails.polygon);

    try {
      if (
        this.queryDetails.filters.length !== 0 &&
        this.queryDetails.polygon.length !== 0
      ) {
        // Make the API call with the prepared data
        await this.apiServices.getPolygonData({
          city: this.queryDetails.city,
          filter: this.queryDetails.filters,
          polygon: this.queryDetails.polygon,
        });

        this.overlayMaps = this.apiServices.apiPoints;
      } else if (
        this.queryDetails.filters.length !== 0 &&
        Object.keys(this.queryDetails.point).length !== 0 &&
        this.queryDetails.radius !== 0
      ) {
        await this.apiServices.getPointRadiusData({
          city: this.queryDetails.city,
          filter: this.queryDetails.filters,
          point: this.queryDetails.point,
          radius: this.queryDetails.radius,
          external: true,
        });

        this.overlayMaps = this.apiServices.apiPoints;
        console.log(this.overlayMaps);
      }
      this.saveDrawings();
      this.isDrawn && this.isFilterOn
        ? this.stepper.next()
        : (this.hidingAlerts = false);
    } catch (error) {
      this.loading = false;
      // Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  /**
   * Step3 submit
   */
  onThirdSubmit() {
    console.log(this.queryDetails);
  }

  /**
   * Step4 submit
   */
  async onFourthSubmit() {
    this.queryDetails.queryName = this.thirdForm.value.projectName;
    this.queryDetails.queryDescription = this.thirdForm.value.description;
    console.log(this.queryDetails);
    try {
      if (this.queryDetails.queryName.length !== 0) {
        // Make the API call with the prepared data
        await this.apiServices.saveSearch(this.queryDetails);
      }
    } catch (error) {
      this.loading = false;
      // Show a message in case of error
      console.error("API call failed:", error);
    }
  }
}
