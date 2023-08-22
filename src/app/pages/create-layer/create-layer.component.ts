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

  //esempio vecchi marker
  // stadspark: L.Marker = L.marker([51.21227, 4.41433], {
  //   icon: this.customIcon,
  // }).bindPopup("This is Stadspark");

  // stadspark = [51.21227, 4.41433];
  // hobokense_polder = [51.19121, 4.34971];
  // het_rot = [51.22318, 4.36092];
  // kaisaniemen = [60.174718, 24.949741];
  // tahtitornin = [60.162666, 24.950495];
  // luattasari = [60.162292, 24.883466];
  // mendicague = [43.463164, -3.826884];
  // dr_morales = [43.45525, -3.838943];
  // libertad = [43.470762, -3.808859];

  //list of parks
  stadspark: L.Marker = L.marker([51.21227, 4.41433], {
    icon: this.customIcon,
  }).bindPopup("This is Stadspark");
  hobokense_polder: L.Marker = L.marker([51.19121, 4.34971], {
    icon: this.customIcon,
  }).bindPopup("This is Hobokense Polder");
  het_rot: L.Marker = L.marker([51.22318, 4.36092], {
    icon: this.customIcon,
  }).bindPopup("This is Het Rat");
  kaisaniemen: L.Marker = L.marker([60.174718, 24.949741], {
    icon: this.customIcon,
  }).bindPopup("Kaisaniemen");
  tahtitornin: L.Marker = L.marker([60.162666, 24.950495], {
    icon: this.customIcon,
  }).bindPopup("Tahtitornin");
  luattasari: L.Marker = L.marker([60.162292, 24.883466], {
    icon: this.customIcon,
  }).bindPopup("Luattasari");
  mendicague: L.Marker = L.marker([43.463164, -3.826884], {
    icon: this.customIcon,
  }).bindPopup("Mendicague");
  dr_morales: L.Marker = L.marker([43.45525, -3.838943], {
    icon: this.customIcon,
  }).bindPopup("Parque del dr. Morales");
  libertad: L.Marker = L.marker([43.470762, -3.808859], {
    icon: this.customIcon,
  }).bindPopup("Caje de la libertad");

  private faulty_bench: L.LayerGroup = L.layerGroup([
    this.stadspark,
    this.kaisaniemen,
    this.mendicague,
  ]);

  private parks: L.LayerGroup = L.layerGroup([
    this.hobokense_polder,
    this.tahtitornin,
    this.dr_morales,
  ]);

  private churches: L.LayerGroup = L.layerGroup([
    this.het_rot,
    this.luattasari,
    this.libertad,
  ]);

  //forms declaration
  firstForm: FormGroup;
  secondForm: FormGroup;
  thirdForm: FormGroup;

  //Radio options for step 1
  options = [
    { value: [60.1699, 24.9384], label: "Helsinki" },
    { value: [51.2213, 4.4051], label: "Antwerp" },
    { value: [43.462776, -3.805], label: "Santander" },
  ];
  option: any;

  popup = L.popup();

  //filter's map rendering ---------------------------------------------------------------->
  private map: L.Map;

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });

  private initFiltersMap(): void {
    this.map = L.map("map", {
      center: this.option,
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

      var point = [51.21227, 4.41433];

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
        console.log(pointInsidePolygon(point, edges));
      } else {
        console.log(pointInsideCircle(point, layer._latlng, layer._radius));
      }

      //questa parte non è necessaria poiché verrà fatta in backend
      function pointInsidePolygon(point, polygon) {
        // Extract x and y coordinates of the point
        const x = point[0];
        const y = point[1];

        // Initialize a variable to keep track of the number of intersections
        let numIntersections = 0;

        // Iterate through each edge of the polygon
        for (let i = 0; i < polygon.length; i++) {
          const p1 = polygon[i];
          const p2 = polygon[(i + 1) % polygon.length];

          // Check if the point is on the same y-coordinate as the edge
          if (y > Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y)) {
            // Check if the point is to the left of the edge (use cross product)
            const crossProduct =
              (x - p1.x) / (p2.x - p1.x) - (y - p1.y) / (p2.y - p1.y);
            if (crossProduct < 0) {
              numIntersections++;
            }
          }
        }

        // If the number of intersections is odd, the point is inside the polygon
        return numIntersections % 2 === 1;
      }

      function pointInsideCircle(point, circleCenter, radius) {
        const pointX = point[0];
        const pointY = point[1];
        const { lat: centerX, lng: centerY } = circleCenter;

        // Calculate the distance between the point and the center of the circle
        const distance = Math.sqrt(
          (pointX - centerX) ** 2 + (pointY - centerY) ** 2
        );

        // Check if the distance is less than the radius
        return distance * 1000 <= radius;
      }

      //da qui devo prendere le aree disegnate
      //console.log(editableLayers);
    });

    // //popup showing cohordinates on click
    // function onclick(e) {
    //   this.popup
    //     .setLatLng(e.latlng)
    //     .setContent("You clicked the map at " + e.latlng.toString())
    //     .openOn(this.map);
    // }

    // //function to make the popup with the coordinates appear
    // this.map.on("click", onclick.bind(this));
  }

  constructor(private fb: FormBuilder) {}

  //final map rendering---------------------------------------------------------->
  public finalMap: L.Map;

  public initFinalMap(): void {
    this.map = L.map("map", {
      center: this.option,
      zoom: 12,
      layers: [this.osm],
    });

    //layer control lets you select which layers you want to see
    const layerControl = L.control.layers(null, null).addTo(this.map);

    this.projectDetails.filters.forEach((element) => {
      layerControl.addOverlay(element[0], element[1]);

      //adding layers so that it is default active in the layerControl
      this.map.addLayer(element[0]);
    });

    // Initialise the FeatureGroup to store editable layers
    var editableLayers = new L.FeatureGroup();
    this.map.addLayer(editableLayers);
  }

  //object in which to store the data input by the user--------------------------->
  projectDetails: {
    city: string;
    projectName: string;
    description: string;
    filters: number[] | string[];
  } = {
    city: "",
    projectName: "",
    description: "",
    filters: [],
  };

  //OnInit----------------------------------------------------------------------->
  ngOnInit() {
    //Step 1 radio validator
    this.firstForm = new FormGroup({
      cityOptions: new FormControl(null, Validators.required),
    });

    this.secondForm = this.fb.group({});

    this.thirdForm = new FormGroup({
      projectName: new FormControl("", Validators.required),
      description: new FormControl(""),
    });
  }

  //
  onFirstSubmit() {
    this.firstForm.markAsPending();

    console.log(this.firstForm.status);
  }

  onSecondSubmit() {
    this.projectDetails.filters = this.selectedFilters;
    console.log(this.projectDetails);
  }

  onThirdSubmit() {
    this.projectDetails.projectName = this.firstForm.value.projectName;
    this.projectDetails.description = this.firstForm.value.description;
  }

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
  filters = [
    [this.parks, "parks"],
    [this.churches, "churches"],
    [this.faulty_bench, "Faulty benches"],
  ];

  onChange(f: string) {
    this.selectedFilters.includes(f)
      ? (this.selectedFilters = this.selectedFilters.filter(
          (filter) => filter !== f
        ))
      : this.selectedFilters.push(f);
    console.log(this.selectedFilters);
  }

  selectedFilters = [];
}
