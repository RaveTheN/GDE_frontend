import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";

import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";
import { __await } from "tslib";

import { saveAs } from "file-saver";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";

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
  //utility to set isFilter on if there are filters already selected
  //then pass them to query filters
  checkAndSetFilters() {
    this.selectedFilters.length === 0
      ? (this.isFilterOn = false)
      : (this.isFilterOn = true);
    this.queryDetails.filters = this.selectedFilters;
  }

  //showing alert when not drawing shape
  isDrawn: boolean = false;
  //alert when not selecting a city
  citySelected: boolean = false;
  //controlling the loading spinner
  loading = false;
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

  //controls for secondform
  nameInput: FormControl;
  descriptionInput: FormControl;

  //object in which to store the data input by the user
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

  //get and store here the coordinates in which to point the center of the map
  centerCityFromApi: any = [];

  constructor(
    private apiServices: ApiService,
    private formBuilder: FormBuilder,

    private translate: TranslateService,
    private router: Router
  ) {}

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
  private initFiltersMap(): void {
    this.map = L.map("map", {
      center: this.centerCityFromApi,
      zoom: 12,
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
        marker: false,
        polyline: false,
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
      center: this.centerCityFromApi,
      zoom: 12,
      layers: [this.osm],
    });

    //layer control lets you select which layers you want to see
    L.control.layers(null, this.overlayMaps).addTo(this.map);

    // Loop through your overlayMaps and add them to the map
    //They will also be set on, in the layer control
    for (const key in this.overlayMaps) {
      if (this.overlayMaps.hasOwnProperty(key)) {
        this.overlayMaps[key].addTo(this.map);
      }
    }
  }

  getCookie(cname: string) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookiesArray = decodedCookie.split(";");
    for (let c of cookiesArray) {
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  switchLanguage(language: string) {
    document.cookie = `language=${language}`;
    this.translate.use(this.getCookie("language"));
  }

  async ngOnInit() {
    this.switchLanguage(this?.getCookie("language"));

    //Form builder for the checkbox in step 1
    this.firstForm = this.formBuilder.group({});

    //controls for name and description saving
    this.nameInput = new FormControl();
    this.descriptionInput = new FormControl();

    //Form builder for saving name and description in step 3
    this.secondForm = this.formBuilder.group({
      nameInput: this.nameInput,
      descriptionInput: this.descriptionInput,
    });

    //subscribe to the value of the apiServices.progress$
    //this way progress will update anytime progress$ changes
    this.apiServices.progress$.subscribe((value) => {
      value < 100
        ? (this.progress = Math.ceil(value))
        : (this.progress = Math.floor(value));
    });

    //store here the data received by the http request
    let data: any;
    let dataFilters: any;
    //initialize the array in which to store the id of the project you are fetching
    //the push it in the array  from localStorage
    let id = [];
    id.push(localStorage.getItem("searchId"));

    try {
      //sets the spinner on
      this.loading = true;
      //fetch the project
      data = await this.apiServices.getSearch(id);
      //ask orion for the filters of the city of the project
      dataFilters = await this.apiServices.getFilters(data.city);

      //sets the spinner of
      this.loading = false;

      //sets center of the map according to the city of the project
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
      //save all the relevant info of the project in queryDetails
      this.queryDetails.id = data.id;
      this.queryDetails.queryName = data.name;
      this.queryDetails.city = data.city;
      this.queryDetails.queryDescription = data.description;

      //push fetch results in this.filters
      dataFilters.forEach((element) => {
        this.filters.push(element);
      });

      //store the filters previosly selected by the user
      data.filter.forEach((e) => {
        this.queryDetails.filters.push(e);
        this.selectedFilters.push(e);
      });

      //initalize an empty object to manage the application of the filters
      let checkBoxValues = {};

      //set each filter has a key of the object, with value true or false
      //the true ones are those that will be checked by default at loading
      this.filters.forEach((filter) => {
        checkBoxValues[filter] = this.queryDetails.filters.includes(filter);
      });

      //pass the object as the new control group of first form
      this.firstForm = this.formBuilder.group(checkBoxValues);

      //then set isFilter on, as we already have filters applied
      this.selectedFilters.length === 0
        ? (this.isFilterOn = false)
        : (this.isFilterOn = true);

      //push all the layers drawn by the user in storedLayers
      data.layers.forEach((e) =>
        this.apiServices.storedLayers.push(JSON.parse(e))
      );

      //clear the map and initialize it
      this.clearMap();
      this.initFiltersMap();
    } catch (error) {
      //set spinner of even if it is an error
      this.loading = false;

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

  //
  dynamicUrl(): string {
    return this.loading
      ? this.apiServices.storedLayers.length > 0
        ? "/pages/edit-layer"
        : "/pages/view-layer"
      : "/pages/view-layer";
  }

  //cleans all process if going back while loading
  onAbort() {
    this.apiServices.ngOnDestroy;
    this.loading = false;
  }

  async onStepChange(event: any) {
    // The event object contains information about the current step and previous step.
    // You can access them as follows:
    this.changeEvent = event;

    switch (this.stepper.selectedIndex) {
      //step 1
      case 0:
        this.queryDetails.polygons = [];
        this.queryDetails.circles = [];
        this.hidingAlerts = true;
        this.checkDrawing();
        this.clearMap();
        setTimeout(() => this.initFiltersMap(), 300);
        break;
      //step 2
      case 1:
        this.clearMap();
        setTimeout(() => this.initFinalMap(), 300);
        break;
      //step 3
      case 2:
        this.nameInput.setValue(this.queryDetails.queryName);
        this.descriptionInput.setValue(this.queryDetails.queryDescription);
    }
  }

  //filters fetched from API
  filters = [];

  //filters selected by the user
  selectedFilters = [];

  onChange(f: string) {
    this.selectedFilters.includes(f)
      ? (this.selectedFilters = this.selectedFilters.filter(
          (filter) => filter !== f
        ))
      : this.selectedFilters.push(f);
    this.checkAndSetFilters();
  }

  /**
   * function called on step 1 submit (selecting filters and drawing areas)
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
   * Submit of step 3 - store drawn areas inside queryDetails,
   * stores in queryDetails the name and description written in the form
   * then calls the update function
   */
  async onThirdSubmit() {
    this.queryDetails.layers = [];
    this.apiServices.storedLayers.forEach((layer) => {
      this.queryDetails.layers.push(JSON.stringify(layer));
    });
    this.queryDetails.queryName = this.secondForm.value.nameInput;
    this.queryDetails.queryDescription = this.secondForm.value.descriptionInput;
    try {
      if (this.queryDetails.queryName.length !== 0) {
        // Make the API call with the prepared data
        await this.apiServices.updateSearch(this.queryDetails);
        this.router.navigate(["pages/available-options"]);
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
