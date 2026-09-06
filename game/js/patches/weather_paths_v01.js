/* WEATHER_PATHS_v01 — path-crossing weather math.

   Extends the weather system so a storm doesn't only cripple routes with the
   storm city as an endpoint — it also cuts demand on routes whose great-circle
   flight path passes near the storm (overflight). Endpoint routes stay at
   full closure (mod=0); overflight routes get a softer 15% cut.

   Uses proper cross-track distance (perpendicular from the storm to the great
   circle arc between the two endpoints), with an along-track bounds check so
   only storms actually between the endpoints qualify — a storm past LAX on a
   JFK→LAX route doesn't count as "overflown."

   Consumed by:
     • game.js timedDemandMod  → applies the overflight demand cut
     • game.js routeDisruptions → shows an OVERFLIGHT badge on affected routes

   Public API:
     AEWX.routePathPassesNear(fromCode, toCode, stormCode, radiusKm) → bool
     AEWX.OVERFLIGHT_MOD       → the demand multiplier applied to overflown routes
     AEWX.OVERFLIGHT_RADIUS_KM → the storm radius used for overflight detection
*/
(function () {
  'use strict';
  if (window.AEWeatherPathsV01) return;
  window.AEWeatherPathsV01 = true;

  var EARTH_R_KM = 6371;
  var OVERFLIGHT_RADIUS_KM = 800;   // typical storm system radius
  var OVERFLIGHT_MOD = 0.85;        // 15% demand cut on overflight (softer than 0=closed)

  function toRad(d) { return d * Math.PI / 180; }

  /**
   * Does the great-circle path from→to pass within `radiusKm` of stormCode?
   * Cross-track distance = perpendicular distance from storm to the great circle.
   * Also verifies the storm falls between endpoints (positive along-track < total).
   */
  function routePathPassesNear(fromCode, toCode, stormCode, radiusKm) {
    var C = window.CITIES;
    if (!C || !C[fromCode] || !C[toCode] || !C[stormCode]) return false;
    if (fromCode === stormCode || toCode === stormCode) return false;

    var lat1 = toRad(C[fromCode].lat),  lon1 = toRad(C[fromCode].lon);
    var lat2 = toRad(C[toCode].lat),    lon2 = toRad(C[toCode].lon);
    var lat3 = toRad(C[stormCode].lat), lon3 = toRad(C[stormCode].lon);

    // Bearing 1 → 2
    var y12 = Math.sin(lon2 - lon1) * Math.cos(lat2);
    var x12 = Math.cos(lat1) * Math.sin(lat2)
            - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    var th12 = Math.atan2(y12, x12);

    // Bearing 1 → 3
    var y13 = Math.sin(lon3 - lon1) * Math.cos(lat3);
    var x13 = Math.cos(lat1) * Math.sin(lat3)
            - Math.sin(lat1) * Math.cos(lat3) * Math.cos(lon3 - lon1);
    var th13 = Math.atan2(y13, x13);

    // Haversine distances 1→2 and 1→3
    var d12 = haversine(lat1, lon1, lat2, lon2);
    var d13 = haversine(lat1, lon1, lat3, lon3);
    if (d12 <= 0) return false;

    // Cross-track: perpendicular from point 3 to great circle 1→2
    var dxt = Math.asin(Math.sin(d13 / EARTH_R_KM) * Math.sin(th13 - th12)) * EARTH_R_KM;
    var crossTrack = Math.abs(dxt);
    if (crossTrack > (radiusKm || OVERFLIGHT_RADIUS_KM)) return false;

    // Along-track: how far along the 1→2 path is the storm?
    var ratio = Math.cos(d13 / EARTH_R_KM) / Math.cos(crossTrack / EARTH_R_KM);
    var dat = Math.acos(Math.max(-1, Math.min(1, ratio))) * EARTH_R_KM;
    return dat > 0 && dat < d12;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    var dLat = lat2 - lat1, dLon = lon2 - lon1;
    var a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  window.AEWX = {
    routePathPassesNear: routePathPassesNear,
    OVERFLIGHT_MOD: OVERFLIGHT_MOD,
    OVERFLIGHT_RADIUS_KM: OVERFLIGHT_RADIUS_KM
  };
})();
