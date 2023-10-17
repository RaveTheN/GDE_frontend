import { Component, OnInit, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";

import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";
import { __await } from "tslib";

import { saveAs } from "file-saver";

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
  //controlling the loading spinner
  loading = false;
  //areas
  areas: any[] = [
    { id: 1, display: "Alppila" },
    { id: 2, display: "Ruoholahti" },
    { id: 3, display: "Lauttasaari" },
  ];

  //forms declaration
  firstForm: FormGroup;
  secondForm: FormGroup;

  nameInput: FormControl;
  descriptionInput: FormControl;

  queryDetails = {
    id: "",
    city: "",
    filters: [],
    polygons: [],
    circles: [],
    queryName: "",
    queryDescription: "",
    layers: [],
  };

  constructor(
    private apiServices: ApiService,
    private formBuilder: FormBuilder
  ) {
    this.firstForm = new FormGroup({
      filters: new FormControl("", Validators.required),
    });

    this.nameInput = new FormControl();
    this.descriptionInput = new FormControl();

    this.secondForm = this.formBuilder.group({
      nameInput: this.nameInput,
      descriptionInput: this.descriptionInput,
    });
  }

  centerCityFromApi: any = [];

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
      center: this.centerCityFromApi,
      zoom: 12,
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
        marker: false,
        polyline: false,
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
          console.log(feature);
          layer.addTo(editableLayers);
        },
      });

      this.isDrawn = true;
      this.apiServices.storedLayers = [];
    });
  }

  /**
   * Check
   */
  checkDrawing() {
    let layerCount = 0;

    //the settimout is to make sue that leaflet has added/removed the layers before we are counting them
    setTimeout(() => {
      this.map.eachLayer(function () {
        layerCount++;
      });

      //i must be > 3 as map._layers will always have at least 4 layers, if at least one drawing is present.
      layerCount > 3 ? (this.isDrawn = true) : (this.isDrawn = false);
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
        }
      }
    });
  }

  /**
   * Step3 map rendering
   */
  public finalMap: L.Map;

  overlayMaps = {};

  //map for step3
  public initFinalMap(): void {
    this.map = L.map("map", {
      center: this.centerCityFromApi,
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

    try {
      this.loading = true;
      data = await this.apiServices.getSearch(this.apiServices.currentId);
      await this.apiServices.getFilters(data.city);

      this.loading = false;
      //pushing fetch results in this.filters
      this.apiServices.apiFilters.forEach((element) => {
        this.filters.push(element);
      });
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
      this.queryDetails.id = data.id;
      this.queryDetails.queryName = data.name;
      this.queryDetails.city = data.city;
      this.queryDetails.queryDescription = data.description;
      data.filter.forEach((e) => this.queryDetails.filters.push(e));
      data.layers.forEach((e) =>
        this.apiServices.storedLayers.push(JSON.parse(e))
      );

      this.initFiltersMap(data);
    } catch (error) {
      // Show a message in case of error
      this.loading = false;
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
        this.queryDetails.polygons = [];
        this.queryDetails.circles = [];
        this.hidingAlerts = true;
        this.checkDrawing();
        this.isFilterOn = false;
        this.clearMap();
        setTimeout(() => this.initFiltersMap(), 300);
        break;
      case 1:
        this.clearMap();
        setTimeout(() => this.initFinalMap(), 300);
        break;
      case 2:
        this.nameInput.setValue(this.queryDetails.queryName);
        this.descriptionInput.setValue(this.queryDetails.queryDescription);
    }
  }

  //filters checkbox
  //this array serves as a token for the one that will be received from the backend
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
   * Step1 submit
   */
  async onFirstSubmit() {
    var layer: any;
    this.overlayMaps = {};
    this.apiServices.apiPoints = {};
    this.isDrawn && this.isFilterOn && this.saveDrawings();
    for (layer of this.apiServices.storedLayers) {
      // For polygons, layer._latlngs[i] is an array of LatLngs objects
      if (!layer.properties.radius) {
        this.queryDetails.polygons.push(1);
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
      this.loading = true;
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
        });
      }

      Object.entries(this.apiServices.apiPoints).forEach((element: any) => {
        console.log(element);
        let filterName = element[0];
        this.overlayMaps[filterName]
          ? this.overlayMaps[filterName].addLayers(element[1].getLayers())
          : (this.overlayMaps[filterName] = element[1]);
      });

      this.loading = false;
      this.isDrawn && this.isFilterOn
        ? this.stepper.next()
        : (this.hidingAlerts = false);
    } catch (error) {
      // Show a message in case of error
      this.loading = false;
      console.error("API call failed:", error);
    }
  }

  /**
   * Step2 submit
   */
  async onThirdSubmit() {
    this.apiServices.storedLayers.forEach((layer) => {
      this.queryDetails.layers.push(JSON.stringify(layer));
    });
    this.queryDetails.queryName = this.secondForm.value.nameInput;
    this.queryDetails.queryDescription = this.secondForm.value.descriptionInput;
    try {
      if (this.queryDetails.queryName.length !== 0) {
        // Make the API call with the prepared data
        await this.apiServices.updateSearch(this.queryDetails);
      }
    } catch (error) {
      // Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  /**
   * File importing and exporting
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
    saveAs(blob, `${this.queryDetails.city}.geojson`);
  }
}
