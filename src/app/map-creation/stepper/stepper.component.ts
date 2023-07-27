import { Component, OnInit, AfterViewInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import * as L from "leaflet";

@Component({
  selector: "ngx-stepper",
  templateUrl: "stepper.component.html",
  styleUrls: ["stepper.component.scss"],
})
export class StepperComponent implements OnInit {
  //parks cohordinates
  castelnuovo: L.Marker = L.marker([38.13177, 13.35187], {
    icon: new L.Icon.Default(),
  }).bindPopup("Questo è il Giardino Inglese");
  trabia: L.Marker = L.marker([38.1302, 13.34736]).bindPopup(
    "Questa è Villa Trabia"
  );
  giulia: L.Marker = L.marker([38.11367, 13.37579]).bindPopup(
    "Questa è Villa Giulia"
  );
  uditore: L.Marker = L.marker([38.13048, 13.3272]).bindPopup(
    "Questo è Parco Uditore"
  );

  //parks array
  parks = L.layerGroup([
    this.castelnuovo,
    this.trabia,
    this.giulia,
    this.uditore,
  ]);

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 15,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });

  //parks layer selector
  overlayMaps = {
    Parks: this.parks,
  };

  //steps of the stepper
  firstForm: UntypedFormGroup;
  secondForm: UntypedFormGroup;
  thirdForm: UntypedFormGroup;

  message = "";

  private map: any;

  popup = L.popup();

  //popup showing cohordinates on click
  onMapClick(e) {
    this.popup
      .setLatLng(e.latlng)
      .setContent("You clicked the map at " + e.latlng.toString())
      .openOn(this.map);
  }

  //initialize layers compsing the map
  private initMap(): void {
    this.map = L.map("map", {
      center: [38.1157, 13.3615],
      zoom: 10,
      layers: [this.osm, this.parks],
    });

    // const tiles = L.tileLayer(
    //   "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    //   {
    //     maxZoom: 18,
    //     minZoom: 3,
    //     attribution:
    //       '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    //   }
    // );

    // tiles.addTo(this.map);

    const layerControl = L.control
      .layers(null, this.overlayMaps)
      .addTo(this.map);

    layerControl.addOverlay(this.parks, "Parks");
    this.map.on("click", this.onMapClick.bind(this));
  }

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit() {
    this.firstForm = this.fb.group({
      firstCtrl: ["", Validators.required],
    });

    this.secondForm = this.fb.group({
      secondCtrl: ["", Validators.required],
    });

    this.thirdForm = this.fb.group({
      thirdCtrl: ["", Validators.required],
    });
  }

  testFunction() {
    this.message = this.firstForm.value.firstCtrl;
  }

  viewMap() {
    console.log("ashdiuahsiu");
    this.initMap();
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
}
