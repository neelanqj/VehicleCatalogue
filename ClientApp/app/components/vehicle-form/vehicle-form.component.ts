import * as _ from 'underscore';
import { Component, OnInit } from '@angular/core';
import { ToastyService } from "ng2-toasty";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable } from "rxjs/Observable";
import { SaveVehicle, Vehicle } from '../../models/vehicle';
import { VehicleService } from '../../services/vehicle.service';
import 'rxjs/add/Observable/forkJoin';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.css']
})
export class VehicleFormComponent implements OnInit {
  makes: any[];
  models: any[];
  features: any[];
  vehicle: SaveVehicle={
    id:0,
    makeId:0,
    modelId:0,
    isRegistered:false,
    features:[],
    contact: {
      name:'',
      email:'',
      phone:''
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService, 
    private toastyService: ToastyService) { 
      route.params.subscribe(p => {
        this.vehicle.id = +p['id'] || 0;
      });
    }

  ngOnInit() {
    var sources = [
      this.vehicleService.getMakes(),
      this.vehicleService.getFeatures()
    ];

    if (this.vehicle.id)
      sources.push(this.vehicleService.getVehicle(this.vehicle.id));

    Observable.forkJoin(sources).subscribe(data=>{
      this.makes = data[0];
      this.features = data[1];

      if (this.vehicle.id){
        this.setVehicle(data[2]);
        this.populateModels();
      }
    }, err => {
      if(err.status == 404)
        this.router.navigate(['/home']);
    });
/*
    .subscribe(v=>{
      this.vehicle=v;
    }, err => {
      if(err.status == 404)
        this.router.navigate(['/home']);
    });
    .subscribe(makes => this.makes = makes);
    .subscribe(features => this.features = features);
*/  
}
  private setVehicle(v: Vehicle){
    this.vehicle.id = v.id;
    this.vehicle.modelId = v.make.id;
    this.vehicle.makeId = v.make.id;
    this.vehicle.isRegistered= v.isRegistered;
    this.vehicle.contact = v.contact;
    this.vehicle.features = _.pluck(v.features, 'id');
  }
  private populateModels(){
    var selectedMake = this.makes.find(model => model.id == this.vehicle.makeId);
    this.models= selectedMake ? selectedMake.models : [];

  }
  onMakeChange(){
    // console.log("VEHICLE", this.vehicle);
    this.populateModels();
    delete this.vehicle.modelId;
  }

  onFeatureToggle(featureId,$event){
      if($event.target.checked)
        this.vehicle.features.push(featureId);
      else{
        var index=this.vehicle.features.indexOf(featureId);
        this.vehicle.features.splice(index,1);
      }

  }

  submit(){
    if(this.vehicle.id){
      this.vehicleService.update(this.vehicle)
        .subscribe(v => {
          this.toastyService.success({
            title: 'success',
            msg:'The vehicle was successfully updated.',
            theme:'bootstrap',
            showClose:true,
            timeout: 5000
          });
        });
    } else {
      this.vehicleService.create(this.vehicle)
        .subscribe(x => console.log(x));
    }
  }

  delete(){
    if(confirm("Are you sure?")){
      this.vehicleService.delete(this.vehicle.id)
        .subscribe(x=>{
          this.router.navigate(['/home']);
        });
    }
  }
}
