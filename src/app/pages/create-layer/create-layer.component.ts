import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import * as L from "leaflet";

@Component({
  selector: "ngx-create-layer",
  templateUrl: "./create-layer.component.html",
  styleUrls: ["./create-layer.component.scss"],
})
export class CreateLayerComponent implements OnInit {
  //list of parks

  stadspark: L.Marker = L.marker([51.21227, 4.41433], {
    icon: new L.Icon.Default(),
  }).bindPopup("This is Stadspark");
  hobokense_polder: L.Marker = L.marker([51.19121, 4.34971]).bindPopup(
    "This is Hobokense Polder"
  );
  het_rat: L.Marker = L.marker([51.22318, 4.36092]).bindPopup(
    "This is Het Rat"
  );
  uditore: L.Marker = L.marker([38.13048, 13.3272]).bindPopup(
    "Questo è Parco Uditore"
  );

  parks = L.layerGroup([]);

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

  private map;

  popup = L.popup();

  //popup showing cohordinates on click
  onMapClick(e) {
    this.popup
      .setLatLng(e.latlng)
      .setContent("You clicked the map at " + e.latlng.toString())
      .openOn(this.map);
  }

  //map rendering
  private initMap(): void {
    this.map = L.map("map", {
      center: this.option,
      zoom: 13,
    });

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(this.map);

    //function to make the popup with the coordinates appear
    this.map.on("click", this.onMapClick.bind(this));
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
