// Runnable self-check for the geofence tolerance rule in
// backend/src/controllers/attendance.controller.js (checkIn).
// Run: node backend/geofence_check.js
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (Number(lat1) * Math.PI) / 180;
    const phi2 = (Number(lat2) * Math.PI) / 180;
    const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const policy = { latitude: -6.274323, longitude: 106.977425, radius_meter: 100 };

function effectiveRadius(radius, rawAccuracy) {
    const a = rawAccuracy !== undefined && rawAccuracy !== "" ? parseFloat(rawAccuracy) : null;
    const acc = a !== null && !isNaN(a) && a > 0 ? Math.min(Math.round(a), 200) : 0;
    return radius + acc;
}

function inRadius(distance, radius, accuracy) {
    return distance <= effectiveRadius(radius, accuracy);
}

const cases = [
    // [label, distanceMeters, accuracy, expectedInRadius]
    ["dead centre, no accuracy sent", 0, undefined, true],
    ["40 m away, accurate fix", 40, 10, true],
    ["90 m away, +/-120 m fix -> tolerated", 90, 120, true],
    ["95 m away, medium fix +/-150 m -> tolerated", 95, 150, true],
    ["300 m away, accurate fix -> rejected", 300, 10, false],
    ["260 m away, +/-150 m fix -> rejected", 260, 150, false],
    ["huge bogus accuracy is capped at +200 m", 350, 99999, false],
    ["150 m away, zero/absent accuracy -> rejected", 150, 0, false],
];

let failures = 0;
for (const [label, distance, accuracy, expected] of cases) {
    const actual = inRadius(distance, policy.radius_meter, accuracy);
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}  (in=${actual}, expected=${expected})`);
}

// Haversine sanity: one degree of latitude ~111 km.
const oneDegLat = calculateDistanceMeters(0, 0, 1, 0);
const haversineOk = Math.abs(oneDegLat - 111195) < 200;

if (!haversineOk) failures++;
console.log(`${haversineOk ? "PASS" : "FAIL"}  haversine 1 deg latitude = ${oneDegLat} m`);

if (failures > 0) {
    console.error(`\n${failures} geofence check(s) failed`);
    process.exit(1);
}
console.log("\nAll geofence checks passed");
