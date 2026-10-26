class CampusBuilder extends AIController {
 airports=null; vehicles=null; destinations=null;
}
function CampusBuilder::Require(ok,msg){if(!ok){AILog.Error("CAMPUS_FAIL "+msg+" error="+AIError.GetLastErrorString());throw msg;}}
function CampusBuilder::Tile(s,x,y){return AIMap.GetTileIndex(s.x+x,s.y+y);}
function CampusBuilder::Road(s,x1,y1,x2,y2){this.Require(AIRoad.BuildRoad(this.Tile(s,x1,y1),this.Tile(s,x2,y2)),"road "+s.name+" "+x1+","+y1+" to "+x2+","+y2);}
function CampusBuilder::Industry(s,id,x,y){local ty=AIIndustryType.ResolveNewGRFID(0x48435031,id);this.Require(AIIndustryType.IsValidIndustryType(ty),"industry type "+id);this.Require(AIIndustryType.BuildIndustry(ty,this.Tile(s,x,y)),"build lodging/support "+s.name+" id="+id);AILog.Info("CAMPUS_INDUSTRY "+s.name+" type="+id+" tile="+this.Tile(s,x,y));}
function CampusBuilder::Rail(s,x,y,track){this.Require(AIRail.BuildRailTrack(this.Tile(s,x,y),track),"rail "+s.name+" "+x+","+y);}
function CampusBuilder::Loop(s,x1,y1,x2,y2,sid,hotel_sid,stationx,len){
 this.Require(AIRail.BuildRailStation(this.Tile(s,stationx,y1),AIRail.RAILTRACK_NE_SW,1,len,sid),"airport rail platform");
 this.Require(AIRail.BuildRailStation(this.Tile(s,stationx,y2),AIRail.RAILTRACK_NE_SW,1,len,hotel_sid),"hotel rail platform");
 local hs=AIStation.GetStationID(this.Tile(s,stationx,y2));
 for(local x=x1+1;x<x2;x++){if(x<stationx||x>=stationx+len){this.Rail(s,x,y1,AIRail.RAILTRACK_NE_SW);this.Rail(s,x,y2,AIRail.RAILTRACK_NE_SW);}}
 for(local y=y1+1;y<y2;y++){this.Rail(s,x1,y,AIRail.RAILTRACK_NW_SE);this.Rail(s,x2,y,AIRail.RAILTRACK_NW_SE);}
 this.Rail(s,x1,y1,AIRail.RAILTRACK_SW_SE);this.Rail(s,x2,y1,AIRail.RAILTRACK_NE_SE);
 this.Rail(s,x2,y2,AIRail.RAILTRACK_NW_NE);this.Rail(s,x1,y2,AIRail.RAILTRACK_NW_SW);
 return hs;
}
function CampusBuilder::Engine(kind,cargo,rail=-1){
 local engines=AIEngineList(kind);local best=-1;local score=-1;
 foreach(e,u in engines){if(!AIEngine.IsBuildable(e)||!AIEngine.CanRefitCargo(e,cargo))continue;
  if(kind==AIVehicle.VT_RAIL&&(AIEngine.IsWagon(e)||!AIRail.TrainHasPowerOnRail(AIEngine.GetRailType(e),rail)||AIEngine.GetCapacity(e)>200))continue;
  if(kind==AIVehicle.VT_AIR&&AIEngine.GetPlaneType(e)==AIAirport.PT_HELICOPTER)continue;
  // Depot construction and the operational test check the existing road set's compatibility.
  local sc=AIEngine.GetMaxSpeed(e)+AIEngine.GetCapacity(e);if(sc>score){best=e;score=sc;}
 }
 if(best<0&&kind==AIVehicle.VT_ROAD){foreach(e,u in engines)if(AIEngine.IsBuildable(e)&&AIEngine.CanRefitCargo(e,cargo))AILog.Info("CAMPUS_ROAD_ENGINE "+e+" "+AIEngine.GetName(e)+" road="+AIEngine.GetRoadType(e)+" target="+AIRoad.GetCurrentRoadType());}
 return best;
}
function CampusBuilder::Vehicle(depot,kind,cargo,targets,name,rail=-1){
 local e=this.Engine(kind,cargo,rail);
 if(kind==AIVehicle.VT_RAIL&&e<0){
  local bestspeed=0;foreach(k,u in AIEngineList(kind)){if(AIEngine.IsBuildable(k)&&!AIEngine.IsWagon(k)&&AIRail.TrainHasPowerOnRail(AIEngine.GetRailType(k),rail)&&AIEngine.GetMaxSpeed(k)>bestspeed){e=k;bestspeed=AIEngine.GetMaxSpeed(k);}}
 }
 this.Require(e>=0,"engine available "+name);
 AILog.Info("CAMPUS_ENGINE "+name+" engine="+e+" "+AIEngine.GetName(e));
 local v=AIEngine.CanRefitCargo(e,cargo)?AIVehicle.BuildVehicleWithRefit(depot,e,cargo):AIVehicle.BuildVehicle(depot,e);
 if(!AIVehicle.IsValidVehicle(v)){
  foreach(k,u in AIEngineList(kind)){
   if(!AIEngine.IsBuildable(k)||k==e||!AIEngine.CanRefitCargo(k,cargo))continue;
   if(kind==AIVehicle.VT_RAIL&&(AIEngine.IsWagon(k)||!AIRail.TrainHasPowerOnRail(AIEngine.GetRailType(k),rail)))continue;
   v=AIVehicle.BuildVehicleWithRefit(depot,k,cargo);if(AIVehicle.IsValidVehicle(v)){e=k;break;}
  }
 }
 this.Require(AIVehicle.IsValidVehicle(v),"vehicle "+name);
 if(kind==AIVehicle.VT_RAIL&&AIVehicle.GetCapacity(v,cargo)==0){
  local wagon=-1;foreach(k,u in AIEngineList(kind)){if(AIEngine.IsBuildable(k)&&AIEngine.IsWagon(k)&&AIEngine.CanRefitCargo(k,cargo)&&AIRail.TrainCanRunOnRail(AIEngine.GetRailType(k),rail)){wagon=k;break;}}
  if(wagon<0){foreach(k,u in AIEngineList(kind))if(AIEngine.CanRefitCargo(k,cargo)||AIEngine.GetCargoType(k)==cargo)AILog.Info("CAMPUS_MAIL_ENGINE "+k+" "+AIEngine.GetName(k)+" build="+AIEngine.IsBuildable(k)+" rail="+AIEngine.GetRailType(k)+" wagon="+AIEngine.IsWagon(k));}
  this.Require(wagon>=0,"wagon "+name);local w=AIVehicle.BuildVehicleWithRefit(depot,wagon,cargo);this.Require(AIVehicle.IsValidVehicle(w),"build wagon");this.Require(AIVehicle.MoveWagon(w,0,v,0),"attach wagon");
 }
 this.Require(AIVehicle.GetCapacity(v,cargo)>0,"cargo capacity "+name);
 this.Require(AIVehicle.SetName(v,name),"vehicle name");
 foreach(t in targets)this.Require(AIOrder.AppendOrder(v,t,AIOrder.OF_NONE),"order "+name);
 this.Require(AIVehicle.StartStopVehicle(v),"start "+name);
 this.vehicles.append(v);this.destinations[v]<-{};foreach(t in targets)this.destinations[v][AIStation.GetStationID(t)]<-0;
 AILog.Info("CAMPUS_VEHICLE id="+v+" kind="+kind+" cargo="+cargo+" name="+name);
 return v;
}
function CampusBuilder::Start(){
 this.SetCommandDelay(1);this.airports=[];this.vehicles=[];this.destinations={};
 local sites = CAMPUS_SITES;
 local pass=-1,mail=-1;foreach(c,u in AICargoList()){if(AICargo.GetCargoLabel(c)=="PASS")pass=c;if(AICargo.GetCargoLabel(c)=="MAIL")mail=c;}
 this.Require(pass>=0&&mail>=0,"passenger/mail cargos");
 local rt=-1;foreach(r,u in AIRailTypeList()){if(rt<0||r<rt)rt=r;}this.Require(rt>=0,"rail available");AIRail.SetCurrentRailType(rt);
 local road=-1;foreach(r,u in AIRoadTypeList(AIRoad.ROADTRAMTYPES_ROAD)){if(road<0||r<road)road=r;}this.Require(road>=0,"road available");AIRoad.SetCurrentRoadType(road);
 AILog.Info("CAMPUS_BUILD_BEGIN");
 foreach(s in sites){
  local airport=this.Tile(s,3,3);this.Require(AIAirport.BuildAirport(airport,s.airport_type,AIStation.STATION_NEW),"airport "+s.name);local sid=AIStation.GetStationID(airport);AIStation.SetName(sid,s.name+" Airport Campus");this.airports.append(airport);
  this.Industry(s,0,11,3);this.Industry(s,1,18,3);this.Industry(s,2,18,12);this.Industry(s,3,11,24);this.Industry(s,4,11,18);this.Industry(s,5,11,21);
  foreach(p in [[0x48544b02,11,12],[0x48544b03,18,18]]){local ty=AIObjectType.ResolveNewGRFID(p[0],0);this.Require(AIObjectType.BuildObject(ty,0,this.Tile(s,p[1],p[2])),"park "+s.name);}
  this.Road(s,0,1,26,1);this.Road(s,26,1,26,26);this.Road(s,26,26,0,26);this.Road(s,0,26,0,1);
  this.Road(s,0,10,26,10);this.Road(s,16,1,16,26);this.Road(s,10,10,10,26);
  local bus=this.Tile(s,6,10),hotelbus=this.Tile(s,16,20),truck=this.Tile(s,10,24);
  this.Require(AIRoad.BuildDriveThroughRoadStation(bus,this.Tile(s,7,10),AIRoad.ROADVEHTYPE_BUS,sid),"airport bus");
  this.Require(AIRoad.BuildDriveThroughRoadStation(this.Tile(s,16,5),this.Tile(s,16,6),AIRoad.ROADVEHTYPE_BUS,sid),"hotel arrivals bus");
  this.Require(AIRoad.BuildDriveThroughRoadStation(hotelbus,this.Tile(s,16,21),AIRoad.ROADVEHTYPE_BUS,AIStation.STATION_NEW),"resort bus");local hs=AIStation.GetStationID(hotelbus);AIStation.SetName(hs,s.name+" Hotels and Resort");
  this.Require(AIRoad.BuildDriveThroughRoadStation(truck,this.Tile(s,10,25),AIRoad.ROADVEHTYPE_TRUCK,hs),"mail depot stop");
  this.Require(AIRoad.BuildDriveThroughRoadStation(this.Tile(s,10,11),this.Tile(s,10,12),AIRoad.ROADVEHTYPE_TRUCK,sid),"airport mail stop");
  this.Require(AIRoad.BuildRoadDepot(this.Tile(s,13,9),this.Tile(s,13,10)),"road depot");
  this.Loop(s,2,12,9,23,sid,hs,3,6);this.Loop(s,3,15,8,20,sid,hs,4,4);
  this.Require(AIRail.BuildRailDepot(this.Tile(s,1,14),this.Tile(s,2,14)),"passenger rail depot");this.Rail(s,2,14,AIRail.RAILTRACK_NW_NE);this.Rail(s,2,14,AIRail.RAILTRACK_NE_SE);
  this.Require(AIRail.BuildRailDepot(this.Tile(s,5,17),this.Tile(s,4,17)),"mail rail depot");this.Rail(s,4,17,AIRail.RAILTRACK_NE_SW);this.Rail(s,3,17,AIRail.RAILTRACK_NW_SW);this.Rail(s,3,17,AIRail.RAILTRACK_SW_SE);
  this.Vehicle(this.Tile(s,1,14),AIVehicle.VT_RAIL,pass,[this.Tile(s,3,12),this.Tile(s,3,23)],s.name+" Airport Express",rt);
  this.Vehicle(this.Tile(s,5,17),AIVehicle.VT_RAIL,pass,[this.Tile(s,4,15),this.Tile(s,4,20)],s.name+" Resort Shuttle",rt);
  for(local k=0;k<2;k++)this.Vehicle(this.Tile(s,13,9),AIVehicle.VT_ROAD,pass,[bus,hotelbus],s.name+" Hotel Bus "+(k+1));
  this.Vehicle(this.Tile(s,13,9),AIVehicle.VT_ROAD,mail,[this.Tile(s,10,11),truck],s.name+" Mail Van");
  foreach(pair in s.connection)this.Require(AIRoad.BuildRoad(pair[0],pair[1])||AIError.GetLastError()==AIError.ERR_ALREADY_BUILT,"city road connection "+s.name+" tile="+pair[0]);
  AILog.Info("CAMPUS_BUILT "+s.name+" station="+sid+" resort_station="+hs);
 }
 for(local i=0;i<3;i++){local targets=[];for(local j=1;j<=3;j++)targets.append(this.airports[(i+j)%3]);for(local k=0;k<2;k++)this.Vehicle(AIAirport.GetHangarOfAirport(this.airports[i]),AIVehicle.VT_AIR,k==0?pass:mail,targets,sites[i].name+(k==0?" Campus Air":" Air Mail"));}
 AILog.Info("CAMPUS_SETUP_PASS campuses=3 hotels=6 resorts=3 parks=6 support=9 vehicles="+this.vehicles.len());
 local previous={};foreach(v in this.vehicles)previous[v]<--1;
 local elapsed=0;local reported=false;
 while(true){
  foreach(v in this.vehicles){this.Require(AIVehicle.IsValidVehicle(v),"vehicle survived");this.Require(AIVehicle.GetState(v)!=AIVehicle.VS_CRASHED,"vehicle crash "+v);
   if(AIVehicle.GetState(v)==AIVehicle.VS_AT_STATION){local sid=AIStation.GetStationID(AIVehicle.GetLocation(v));if(sid in this.destinations[v]&&previous[v]!=sid){this.destinations[v][sid]++;previous[v]=sid;AILog.Info("CAMPUS_ARRIVAL vehicle="+v+" station="+sid+" count="+this.destinations[v][sid]);}}
  }
  local all=true;foreach(v,st in this.destinations)foreach(sid,n in st)if(n<1)all=false;
  if(all&&!reported){AILog.Info("CAMPUS_OPERATION_PASS all_21_vehicles_visited_all_ordered_stations");reported=true;}
  this.Sleep(16);elapsed+=16;
  if(elapsed%4000==0){foreach(v,st in this.destinations)foreach(sid,n in st)if(n<1)AILog.Info("CAMPUS_PENDING vehicle="+v+" station="+sid);}
 }
}
