class AirportPackTest extends AIController {
    airports = null;
    vehicles = null;
    visits = null;
    restored = false;
    last_station = null;
}

function AirportPackTest::Save() {
    return {airports = this.airports, vehicles = this.vehicles, visits = this.visits};
}
function AirportPackTest::Load(version, data) {
    this.airports = data.airports;
    this.vehicles = data.vehicles;
    this.visits = data.visits;
    this.restored = true;
}
function AirportPackTest::Require(ok, message) {
    if (!ok) {
        AILog.Error("AIRPORT_TEST_FAIL " + message + " error=" + AIError.GetLastErrorString());
        throw message;
    }
}
function AirportPackTest::Start() {
    this.SetCommandDelay(1);
    if (!this.restored) {
        AICompany.SetName("Airport Validation");
        this.airports = [];
        this.vehicles = [];
        this.visits = {};
        local types = [AIAirport.AT_LARGE, AIAirport.AT_METROPOLITAN, AIAirport.AT_INTERNATIONAL, AIAirport.AT_INTERCON];
        local points = [[24,24], [50,24], [24,50], [50,50]];
        local names = ["Metro City", "Grand City", "Skyline City", "Major Grand Union"];
        for (local i = 0; i < 4; i++) {
            local t = AIMap.GetTileIndex(points[i][0], points[i][1]);
            this.Require(AIAirport.IsValidAirportType(types[i]), "airport available " + names[i]);
            this.Require(AIAirport.BuildAirport(t, types[i], AIStation.STATION_NEW), "build " + names[i]);
            local sid = AIStation.GetStationID(t);
            AIStation.SetName(sid, names[i]);
            this.airports.append(t);
            this.visits[sid] <- 0;
            this.Require(AIAirport.GetNumHangars(t) >= 1, "hangar " + names[i]);
            AILog.Info("AIRPORT_BUILT index=" + i + " type=" + AIAirport.GetAirportType(t) + " xy=" + points[i][0] + "," + points[i][1]
                + " size=" + AIAirport.GetAirportWidth(types[i]) + "x" + AIAirport.GetAirportHeight(types[i])
                + " hangars=" + AIAirport.GetNumHangars(t) + " station=" + sid);
        }
        local engines = AIEngineList(AIVehicle.VT_AIR);
        local jet = -1;
        local small = -1;
        local heli = -1;
        foreach (e, unused in engines) {
            if (!AIEngine.IsBuildable(e)) continue;
            local kind = AIEngine.GetPlaneType(e);
            if (kind == AIAirport.PT_BIG_PLANE && jet < 0) jet = e;
            if (kind == AIAirport.PT_SMALL_PLANE && small < 0) small = e;
            if (kind == AIAirport.PT_HELICOPTER && heli < 0) heli = e;
        }
        this.Require(jet >= 0 && small >= 0 && heli >= 0, "all three aircraft classes available");
        for (local i = 0; i < 12; i++) {
            local e = i < 8 ? jet : (i < 10 ? small : heli);
            local home = i % 4;
            local vehicle = AIVehicle.BuildVehicle(AIAirport.GetHangarOfAirport(this.airports[home]), e);
            this.Require(AIVehicle.IsValidVehicle(vehicle), "build aircraft " + i);
            for (local j = 1; j <= 4; j++) {
                local target = (home + j) % 4;
                this.Require(AIOrder.AppendOrder(vehicle, this.airports[target], AIOrder.OF_NONE), "add order");
            }
            this.Require(AIVehicle.StartStopVehicle(vehicle), "launch aircraft");
            this.vehicles.append(vehicle);
            AILog.Info("AIRCRAFT_BUILT vehicle=" + vehicle + " plane_type=" + AIEngine.GetPlaneType(e));
        }
        AILog.Info("AIRPORT_TEST_SETUP_PASS airports=4 aircraft=12");
    } else {
        this.Require(this.airports.len() == 4 && this.vehicles.len() == 12, "saved airport and aircraft counts");
        foreach (tile in this.airports) this.Require(AIAirport.IsAirportTile(tile), "airport restored");
        foreach (v in this.vehicles) this.Require(AIVehicle.IsValidVehicle(v), "aircraft restored");
        AILog.Info("AIRPORT_RELOAD_PASS airports=4 aircraft=12");
    }
    this.last_station = {};
    foreach (v in this.vehicles) this.last_station[v] <- -1;
    local pass = false;
    local elapsed = 0;
    while (true) {
        foreach (v in this.vehicles) {
            this.Require(AIVehicle.IsValidVehicle(v), "aircraft remains valid");
            this.Require(AIVehicle.GetState(v) != AIVehicle.VS_CRASHED, "aircraft has not crashed");
            if (AIVehicle.GetState(v) == AIVehicle.VS_AT_STATION) {
                local sid = AIStation.GetStationID(AIVehicle.GetLocation(v));
                if (sid in this.visits && this.last_station[v] != sid) {
                    this.visits[sid]++;
                    this.last_station[v] = sid;
                    if (this.visits[sid] == 1 || this.visits[sid] == 10)
                        AILog.Info("AIRPORT_VISITS station=" + sid + " completed_arrivals=" + this.visits[sid]);
                }
            }
        }
        local all = true;
        foreach (sid, count in this.visits) if (count < 10) all = false;
        if (all && !pass) {
            AILog.Info("AIRPORT_FLIGHT_PASS all_four_airports_at_least_10_arrivals aircraft=12");
            pass = true;
        }
        this.Sleep(8);
        elapsed += 8;
        if (elapsed % 8000 == 0) {
            foreach (sid, count in this.visits) AILog.Info("AIRPORT_PROGRESS station=" + sid + " arrivals=" + count);
        }
    }
}
