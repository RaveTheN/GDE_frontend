import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import * as L from "leaflet";
import "leaflet-draw";
import "leaflet-editable";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";
import { __await } from "tslib";
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
  //utility to set isFilter on if there are filters already selected
  checkAndSetFilters() {
    this.selectedFilters.length === 0
      ? (this.isFilterOn = false)
      : (this.isFilterOn = true);
    this.queryDetails.filters = this.selectedFilters;
  }
  //showing alert when not drawing shape
  isDrawn: boolean = false;
  //controlling the loading spinner
  loading = false;
  //alert when not selecting a city
  citySelected: boolean = false;
  //areas - these are not shown atm
  areas: any[] = [
    { id: 1, display: "Alppila" },
    { id: 2, display: "Ruoholahti" },
    { id: 3, display: "Lauttasaari" },
  ];

  //utility for clearing the map from previous instances that might have left traces
  public clearMap() {
    this.map != undefined ? (this.map = this.map.remove()) : null;
  }

  //contols progress of the loading bar
  @Input() progress: number = 0;

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
  //option takes the value of one of the element of the array options - check the radio group in the html
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
      center: this.option[0],
      zoom: 14,
      layers: [this.osm],
    });

    // Initialise the FeatureGroup to store editable layers and add them to the map
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

    //this function gets called whenever we draw something on the map
    this.map.on("draw:created", function (e: any) {
      let drawingLayer = e.layer;
      //and then the drawn layer will get stored in editableLayers
      editableLayers.addLayer(drawingLayer);
    });

    //for each drawn area saved in storedLayer
    this.apiServices.storedLayers.forEach((element) => {
      //style and color of the shapes that are shown on the map
      const style: any = {
        color: "#3388ff",
        opacity: 0.5,
        weight: 4,
      };

      L.geoJSON(element, {
        style,
        //returns a circle if element has radius in the properties
        pointToLayer(feature, latlng) {
          if (feature.properties.radius) {
            return new L.Circle(latlng, feature.properties.radius);
          }
        },
        //then add them to the map, in editableLayers
        onEachFeature(feature, layer) {
          layer.addTo(editableLayers);
        },
      });

      //set it like a shape has been already drawn
      this.isDrawn = true;
      //empty the variable in which the layers are stored
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

  //store here the layers to be added to the map
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
    //They will also be set on, in the layer control
    for (const key in this.overlayMaps) {
      if (this.overlayMaps.hasOwnProperty(key)) {
        this.overlayMaps[key].addTo(this.map);
      }
    }
  }

  ngOnInit() {
    //Form group and control for the radio selection in step 1
    this.firstForm = new FormGroup({
      cityOptions: new FormControl(null, Validators.required),
    });

    //Form group and control for the checkbox in step 2
    this.secondForm = new FormGroup({
      filters: new FormControl("", Validators.required),
    });

    //Form group and controls for saving name and description in the form in step 3
    this.thirdForm = new FormGroup({
      nameInput: new FormControl("", Validators.required),
      descriptionInput: new FormControl(""),
    });

    //subscribe to the value of the apiServices.progress$
    //this way progress will update anytime progress$ changes
    this.apiServices.progress$.subscribe((value) => {
      value < 100
        ? (this.progress = Math.ceil(value))
        : (this.progress = Math.floor(value));
    });
  }

  /**
   * Stepper controls
   */

  @ViewChild("stepper")
  stepper: NbStepperComponent;
  changeEvent: NbStepChangeEvent;

  onStepChange(event: any) {
    // The event object contains information about the current step and previous step.
    // You can access them as follows:
    this.changeEvent = event;

    switch (this.stepper.selectedIndex) {
      //step 1
      case 0:
        //emptying filters everytime the city selection step renders
        this.filters = [];
        this.loading = false;
        this.apiServices.ngOnDestroy();
        break;
      //step 2
      case 1:
        this.queryDetails.polygons = [];
        this.queryDetails.circles = [];
        this.checkAndSetFilters();
        this.isDrawn = false;
        this.hidingAlerts = true;
        this.clearMap();
        setTimeout(() => this.initFiltersMap(), 300);
        break;
      //step 3
      case 2:
        this.clearMap();
        setTimeout(() => this.initFinalMap(), 300);
        break;
      //step 4
      //do nothing
    }
  }

  /**
   * functions called on step 1 submit (selecting region)
   */

  async onFirstSubmit() {
    //string for selected city
    let cityString = this.option[1];
    //coordinates of the point we want to center the map to (inside the city)
    let cityCoordinates = this.option[0];
    this.citySelected = true;
    this.queryDetails.city = cityString;
    this.queryDetails.center = cityCoordinates;
    if (this.queryDetails.city !== "" && this.firstForm.status !== "INVALID") {
      //loading true = spinner on
      this.loading = true;

      //store here the data received by the http request
      let data: any;
      try {
        //ask orion the filters for the selected city
        data = await this.apiServices.getFilters(this.queryDetails.city);
        //pushing fetch results in this.filters
        data.forEach((element) => {
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

  //filters fetched from API
  filters = [];

  //filters selected by the user
  selectedFilters = [];

  //called everytime the user checks a box
  //f = filter
  onChange(f: string) {
    this.selectedFilters.includes(f)
      ? (this.selectedFilters = this.selectedFilters.filter(
          (filter) => filter !== f
        ))
      : this.selectedFilters.push(f);
    this.checkAndSetFilters();
  }

  /**
   * function called on step 2 submit (selecting filters and drawing areas)
   */
  async onSecondSubmit() {
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
      this.apiServices.totalProgress = 0;
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
   * Submit of step 3 - store drawn areas inside queryDetails
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
    this.queryDetails.queryName = this.thirdForm.value.nameInput;
    this.queryDetails.queryDescription = this.thirdForm.value.descriptionInput;
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
    saveAs(blob, `${this.option[1]}.geojson`);
  }
}
