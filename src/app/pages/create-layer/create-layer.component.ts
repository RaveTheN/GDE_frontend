import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import * as L from "leaflet";
import "leaflet-draw";
import "leaflet-editable";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";
import { __await } from "tslib";
import { TranslateService } from "@ngx-translate/core";
import { saveAs } from "file-saver";

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
  //areas
  areas: any[] = [
    { id: 1, display: "Alppila" },
    { id: 2, display: "Ruoholahti" },
    { id: 3, display: "Lauttasaari" },
  ];

  //forms declaration
  firstForm: FormGroup;
  secondForm: FormGroup;
  thirdForm: FormGroup;

  //object in which to store the data input by the user
  queryDetails = {
    city: "",
    center: [],
    filters: [],
    polygons: [],
    circles: [],
    queryName: "",
    queryDescription: "",
    layers: [],
  };

  /**
   * Step 1 - radio options
   */
  options = [
    { value: [[60.1699, 24.9384], "Helsinki"], label: "Helsinki" },
    { value: [[51.0501, 3.7303], "Flanders"], label: "Flanders" },
    { value: [[43.462776, -3.805], "Santander"], label: "Santander" },
  ];
  option: any;

  constructor(
    private apiServices: ApiService,
    private translate: TranslateService
  ) {
    translate.setDefaultLang("en");
  }

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
      center: this.option[0],
      zoom: 14,
      layers: [this.osm],
    });

    // Initialise the FeatureGroup to store editable layers
    var editableLayers = new L.FeatureGroup();
    this.map.addLayer(editableLayers);

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
    this.map.on("draw:created", function (e: any) {
      let drawingLayer = e.layer;
      //layer in which we are going to draw the selecion areas
      editableLayers.addLayer(drawingLayer);
    });

    this.apiServices.storedLayers.forEach((element) => {
      const style: any = {
        color: "#3388ff",
        opacity: 0.5,
        weight: 4,
      };

      L.geoJSON(element, {
        style,
        pointToLayer(feature, latlng) {
          if (feature.properties.radius) {
            return new L.Circle(latlng, feature.properties.radius);
          }
        },
        onEachFeature(feature, layer) {
          layer.addTo(editableLayers);
        },
      });

      this.isDrawn = true;
      this.apiServices.storedLayers = [];
    });
  }

  /**
   * Check if the number  of layers is higher than 3.
   * In a map without any other kind of layers (eg: markers, circlemarkers),
   * it confirms the presence of drawings created by the user
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
      // console.log("isdrawn: " + this.isDrawn);
    }, 100);
  }

  // Usage: call checkDrawing() to check if there are drawings on the map.

  /**
   * Checks inside the layers created by leaflet. If criteria are met,
   * stores them in an array.
   */
  saveDrawings() {
    this.apiServices.storedLayers = [];
    Object.values(this.map._layers).forEach((e: any) => {
      if (
        e instanceof L.Circle ||
        e instanceof L.Polygon ||
        e instanceof L.Polyline
      ) {
        //check: if the layer is from a circle, store the radius
        const json = e.toGeoJSON();

        if (e instanceof L.Circle) {
          json.properties.radius = e.getRadius();
        }

        //add layer only if it is not already stored
        if (!this.apiServices.storedLayers.includes(json)) {
          this.apiServices.storedLayers.push(json);
          console.log(JSON.stringify(json));
        }
      }
    });
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
      zoom: 14,
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

  onStepChange(event: any) {
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
        this.queryDetails.polygons = [];
        this.queryDetails.circles = [];
        this.isDrawn = false;
        this.hidingAlerts = true;
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
    this.queryDetails.center = this.option[0];
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
    this.queryDetails.polygons = [];
    this.overlayMaps = {};
    this.apiServices.apiPoints = {};
    this.isDrawn && this.isFilterOn && this.saveDrawings();
    for (layer of this.apiServices.storedLayers) {
      // For polygons, layer._latlngs[i] is an array of LatLngs objects
      if (!layer.properties.radius) {
        let polygonArray = [];
        // Flatten the nested array and push edges to the polygon array
        for (const coordinate of layer.geometry.coordinates.flat()) {
          const edge = {
            latitude: coordinate[1],
            longitude: coordinate[0],
          };
          polygonArray.push(edge);
        }

        this.queryDetails.polygons.push(polygonArray);
      } else {
        this.queryDetails.circles.push(
          Object({
            point: {
              latitude: layer.geometry.coordinates[1],
              longitude: layer.geometry.coordinates[0],
            },
            radius: layer.properties.radius,
            external: false,
          })
        );
      }
    }
    try {
      if (this.queryDetails.circles.length !== 0) {
        await this.apiServices.getPointRadiusData({
          city: this.queryDetails.city,
          filter: this.queryDetails.filters,
          multipoint: this.queryDetails.circles,
        });
      }
      if (this.queryDetails.polygons.length !== 0) {
        // Make the API call with the prepared data
        await this.apiServices.getPolygonData({
          city: this.queryDetails.city,
          filter: this.queryDetails.filters,
          polygon: this.queryDetails.polygons,
        });
      }

      Object.entries(this.apiServices.apiPoints).forEach((element: any) => {
        console.log(element);
        let filterName = element[0];
        this.overlayMaps[filterName]
          ? Object.assign(
              this.overlayMaps[filterName]._layers,
              element[1]._layers
            )
          : (this.overlayMaps[filterName] = element[1]);
      });

      this.isDrawn && this.isFilterOn
        ? this.stepper.next()
        : (this.hidingAlerts = false);
    } catch (error) {
      // Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  /**
   * Step3 submit
   */
  onThirdSubmit() {
    this.apiServices.storedLayers.forEach((layer) => {
      this.queryDetails.layers.push(JSON.stringify(layer));
    });
  }

  /**
   * Step4 submit
   */
  async onFourthSubmit() {
    this.queryDetails.queryName = this.thirdForm.value.projectName;
    this.queryDetails.queryDescription = this.thirdForm.value.description;
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

  /**
   * File loading
   */

  fileData = [];
  fileUpload(event) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileExtension = file.name.split(".").pop();
      if (fileExtension !== "geojson") {
      }
      //leggo i dati dal file
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileData[0] = e.target.result as string;
        var geojsonLayer = JSON.parse(this.fileData[0]);
        this.apiServices.storedLayers.push(geojsonLayer);
        this.clearMap();
        setTimeout(() => this.initFiltersMap(), 100);
      };
      reader.readAsText(file);
    }
  }

  saveFile() {
    this.saveDrawings();
    const geoJsonFile = { type: "FeatureCollection", features: [] };
    this.apiServices.storedLayers.forEach((feature) => {
      geoJsonFile.features.push(feature);
    });
    const blob = new Blob([JSON.stringify(geoJsonFile)], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, `${this.option[1]}.geojson`);
  }
}
