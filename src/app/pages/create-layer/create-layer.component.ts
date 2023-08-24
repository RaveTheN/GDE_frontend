import { Component, OnInit, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";

import * as L from "leaflet";
import "../../../../node_modules/leaflet-draw/dist/leaflet.draw-src.js";
import "@turf/turf";
import "turf-inside";
import { NbStepChangeEvent, NbStepperComponent } from "@nebular/theme";

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

  public stocazzo = 0;

  //filter's map rendering ---------------------------------------------------------------->
  private map: L.Map;

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

    var circleArea = {
      point: { latitude: "", longitude: "" },
      radius: 0,
    };

    this.stocazzo = 2;

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

      if (Array.isArray(layer._latlngs)) {
        // For polygons, layer._latlngs[i] is an array of LatLngs objects
        for (let i = 0; i < layer._latlngs.length; i++) {
          for (let j = 0; j < layer._latlngs[i].length; j++) {
            const edge = {
              x: layer._latlngs[i][j].lat,
              y: layer._latlngs[i][j].lng,
            };
            edges.push(edge);
            // edges can then be stored and pushed to backend
          }
        }
        console.log(layer._latlngs);
        console.log();
      } else {
        console.log(layer._latlng);
        circleArea.point.latitude = layer._latlng.lat;
        circleArea.point.longitude = layer._latlng.lng;
        circleArea.radius = layer._radius;
        console.log(circleArea);
      }

      console.log(editableLayers);
    });
  }

  constructor(private fb: FormBuilder) {}

  //object in which to store the data input by the user--------------------------->
  queryDetails = {
    city: "",
    filters: [],
    point: {},
  };

  //final map rendering---------------------------------------------------------->
  public finalMap: L.Map;

  public initFinalMap(): void {
    this.map = L.map("map", {
      center: this.option[0],
      zoom: 12,
      layers: [this.osm],
    });

    //layer control lets you select which layers you want to see
    const layerControl = L.control.layers(null, null).addTo(this.map);

    this.queryDetails.filters.forEach((element) => {
      layerControl.addOverlay(element[0], element[1]);

      //adding layers so that it is default active in the layerControl
      this.map.addLayer(element[0]);
    });

    // Initialise the FeatureGroup to store editable layers
    var editableLayers = new L.FeatureGroup();
    this.map.addLayer(editableLayers);
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
      projectName: new FormControl("", Validators.required),
      description: new FormControl(""),
    });
  }

  //functions activated clicking the buttons------------------------------------->

  //variable to hide the alert when selecting a city
  citySelected: boolean = true;
  onFirstSubmit() {
    this.citySelected = false;
    this.queryDetails.city = this.option[1];
    console.log(this.queryDetails);
  }

  //variable to hide the alert when selecting a filter
  filterSelected: boolean = true;
  onSecondSubmit() {
    console.log(this.map);
    this.filterSelected = false;
    this.queryDetails.filters = this.selectedFilters;
    console.log(this.queryDetails);
  }

  onThirdSubmit() {}

  //Stepper controls---------------------------------------------------------------->

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

  //filters checkbox---------------------------------------------------------------->

  //this array serves as a token for the one that will be received from the backend
  filters = ["AirQualityObserved"];

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
    console.log(this.secondForm.status);
  }

  selectedFilters = [];
}
