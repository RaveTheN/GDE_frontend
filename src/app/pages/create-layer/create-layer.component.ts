import { Component, OnInit } from "@angular/core";
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

  // faulty_bench = [
  //   this.stadspark,
  //   this.hobokense_polder,
  //   this.het_rot,
  //   this.kaisaniemen,
  //   this.tahtitornin,
  //   this.luattasari,
  //   this.mendicague,
  //   this.dr_morales,
  //   this.libertad,
  // ];

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
    this.hobokense_polder,
    this.het_rot,
    this.kaisaniemen,
    this.tahtitornin,
    this.luattasari,
    this.mendicague,
    this.dr_morales,
    this.libertad,
  ]);

  //steps of the stepper
  firstForm: FormGroup;
  secondForm: FormGroup;
  thirdForm: FormGroup;

  //Radio options for step !
  options = [
    { value: [60.1699, 24.9384], label: "Helsinki" },
    { value: [51.2213, 4.4051], label: "Antwerp" },
    { value: [43.462776, -3.805], label: "Santander" },
  ];
  option;

  popup = L.popup();

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });

  //map rendering
  private initMap(): void {
    const map = L.map("map", {
      center: this.option,
      zoom: 12,
      layers: [this.osm, this.faulty_bench],
    });

    const layerControl = L.control.layers(null, null).addTo(map);

    layerControl.addOverlay(this.faulty_bench, "Faulty benches");

    // Initialise the FeatureGroup to store editable layers
    var editableLayers = new L.FeatureGroup();
    map.addLayer(editableLayers);

    // Initialise the draw control and pass it the FeatureGroup of editable layers
    var drawControl = new L.Control.Draw({
      edit: { featureGroup: editableLayers },
      position: "topright",
      draw: {
        marker: false,
        polyline: false,
        rectangle: <any>{ showArea: false },
        polygon: false,
        circlemarker: false,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, function (e: any) {
      var layer = e.layer;
      // Do whatever else you need to. (save to db; add to map etc)
      console.log(layer._latlngs);
      editableLayers.addLayer(layer);

      var point = [51.241146, 4.442459];
      const Xp = point[0];
      const Yp = point[1];

      function is_inside(edges, Xp, Yp) {
        let cnt = 0;
        for (let edge of edges) {
          console.log(edge);
        }
      }

      is_inside(layer._latlngs, Xp, Yp);
    });

    // //popup showing cohordinates on click
    // function onclick(e) {
    //   this.popup
    //     .setLatLng(e.latlng)
    //     .setContent("You clicked the map at " + e.latlng.toString())
    //     .openOn(map);
    // }

    // //function to make the popup with the coordinates appear
    // map.on("click", onclick.bind(this));
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    //Step 1 radio validator
    this.firstForm = new FormGroup({
      cityOptions: new FormControl(null, Validators.required),
    });

    this.secondForm = this.fb.group({
      secondCtrl: ["", Validators.required],
    });

    this.thirdForm = this.fb.group({
      thirdCtrl: ["", Validators.required],
    });
  }

  onFirstSubmit() {
    this.firstForm.markAsDirty();
  }

  onSecondSubmit() {
    this.secondForm.markAsDirty();
  }

  onThirdSubmit() {
    this.thirdForm.markAsDirty();
  }

  viewMap() {
    this.initMap();
  }
}
