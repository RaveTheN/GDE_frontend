import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import "@turf/turf";
import "turf-inside";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";
import { ApiService } from "../../services/api.service";

@Component({
  selector: "ngx-create-layer",
  templateUrl: "./create-layer.component.html",
  styleUrls: ["./create-layer.component.scss"],
})
export class CreateLayerComponent implements OnInit {
  customIcon = L.icon({
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/88/Map_marker.svg",

    iconSize: [15, 35], // size of the icon
  });

  //forms declaration
  firstForm: FormGroup;
  secondForm: FormGroup;
  thirdForm: FormGroup;

  //Radio options for step 1
  options = [
    { value: [[60.1699, 24.9384], "Helsinki"], label: "Helsinki" },
    { value: [[51.2213, 4.4051], "Antwerp"], label: "Antwerp" },
    { value: [[43.462776, -3.805], "Santander"], label: "Santander" },
  ];
  option: any;

  popup = L.popup();

  //filter's map rendering ---------------------------------------------------------------->
  public map: any;

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });

  private initFiltersMap(): void {
    this.map = L.map("map", {
      center: this.option[0],
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
        polyline: false,
        marker: false,
        rectangle: <any>{ showArea: false },
        circlemarker: false,
      },
    });
    this.map.addControl(drawControl);

    //when drawing area in the map
    this.map.on(L.Draw.Event.CREATED, function (e: any) {
      var layer = e.layer;
      //layer in which we are going to draw the selecion areas
      editableLayers.addLayer(layer);

      //empty array, for storing polygons' edges' coordinates
      let edges = [];

      // For polygons, layer._latlngs[i] is an array of LatLngs objects
      if (Array.isArray(layer._latlngs)) {
        for (let i = 0; i < layer._latlngs.length; i++) {
          for (let j = 0; j < layer._latlngs[i].length; j++) {
            const edge = {
              latitude: layer._latlngs[i][j].lat,
              longitude: layer._latlngs[i][j].lng,
            };
            edges.push(edge);
            // edges can then be stored and pushed to backend
          }
          const edge = {
            latitude: layer._latlngs[0][0].lat,
            longitude: layer._latlngs[0][0].lng,
          };
          edges.push(edge);
        }
      } else {
        console.log(layer);
      }
    });
  }

  constructor(private apiServices: ApiService) {}

  //object in which to store the data input by the user--------------------------->
  queryDetails = {
    city: "",
    filters: [],
    polygon: [],
    queryName: "",
    queryDescription: "",
  };

  //final map rendering---------------------------------------------------------->
  public finalMap: L.Map;

  overlayMaps = {};

  public initFinalMap(): void {
    this.map = L.map("map", {
      center: this.option[0],
      zoom: 12,
      layers: [this.osm],
    });

    //layer control lets you select which layers you want to see
    const layerControl = L.control
      .layers(null, this.overlayMaps)
      .addTo(this.map);
  }

  addMapLayers() {
    this.queryDetails.filters.forEach((element) => {});
  }

  //OnInit----------------------------------------------------------------------->
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

  //Stepper controls---------------------------------------------------------------->

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
      case 1:
        this.clearMap();
        setTimeout(() => this.initFiltersMap(), 100);
        break;
      case 2:
        this.clearMap();
        setTimeout(() => this.initFinalMap(), 100);
        break;
    }
  }

  //variable for: controlling the loading spinner
  loading = false;
  //variable for: alert when not selecting a city
  citySelected: boolean = true;

  async onFirstSubmit() {
    this.citySelected = false;
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

  //variable for: alert when not selecting a filter
  filterSelected: boolean = true;

  async onSecondSubmit() {
    var layer: any;
    for (layer of Object.values(this.map._layers)) {
      // For polygons, layer._latlngs[i] is an array of LatLngs objects
      if (Array.isArray(layer._latlngs)) {
        for (let i = 0; i < layer._latlngs.length; i++) {
          for (let j = 0; j < layer._latlngs[i].length; j++) {
            //here I am repeating the first point, as RN it only works like this, and only making triangles
            const edge = {
              latitude: layer._latlngs[i][j].lat,
              longitude: layer._latlngs[i][j].lng,
            };
            this.queryDetails.polygon.push(edge);
            // edges can then be stored and pushed to backend
          }
        }
        const firstEdge = {
          latitude: layer._latlngs[0][0].lat,
          longitude: layer._latlngs[0][0].lng,
        };
        this.queryDetails.polygon.push(firstEdge);
      }
    }
    this.filterSelected = false;
    try {
      if (
        this.queryDetails.filters.length !== 0 &&
        this.queryDetails.polygon.length !== 0
      ) {
        await this.apiServices.getPolygonData({
          city: this.queryDetails.city,
          filter: this.queryDetails.filters,
          polygon: this.queryDetails.polygon,
        });
        this.overlayMaps[this.queryDetails.filters[0]] =
          this.apiServices.apiPoints.points;
        this.apiServices.apiPoints = {
          points: L.layerGroup(),
        };
        console.log(this.overlayMaps);
      }
      //here I empty the polygon array (in case I'll want to reuse it)
      this.queryDetails.polygon = [];

      this.stepper.next();
    } catch (error) {
      this.loading = false;
      //Show a message in case of error
      console.error("API call failed:", error);
    }
  }

  onThirdSubmit() {
    this.queryDetails.queryName = this.thirdForm.value.projectName;
    this.queryDetails.queryDescription = this.thirdForm.value.description;
  }

  //filters checkbox---------------------------------------------------------------->

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
      ? this.secondForm.setErrors({ invalid: true })
      : null;
    this.queryDetails.filters = this.selectedFilters;
  }

  selectedFilters = [];
}
