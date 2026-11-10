const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Haversine implementation as used in backend/src/controllers/attendance.controller.js
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
    const R = 6371e3;
    const phi1 = (Number(lat1) * Math.PI) / 180;
    const phi2 = (Number(lat2) * Math.PI) / 180;
    const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

function calculateEffectiveRadius(baseRadius, rawAccuracy) {
    const accuracyMeters = rawAccuracy !== null && !isNaN(rawAccuracy) && rawAccuracy > 0
        ? Math.min(Math.round(rawAccuracy), 200)
        : 0;
    return baseRadius + accuracyMeters;
}

function evaluateLateStatus(wibHours, wibMinutes, jamMasukStr = "09:00", toleransiMenit = 15) {
    const [targetH, targetM] = jamMasukStr.split(":").map(Number);
    const cutoffMinutes = targetH * 60 + targetM + toleransiMenit;
    const currentMinutes = wibHours * 60 + wibMinutes;
    const isLate = currentMinutes > cutoffMinutes;
    const lateMinutes = isLate ? currentMinutes - cutoffMinutes : 0;
    return { isLate, lateMinutes };
}

describe("WB-GEO: Haversine Geofencing & Attendance Verification", () => {
    const WORKSHOP_LAT = -6.26064;
    const WORKSHOP_LON = 106.98744;
    const BASE_RADIUS = 500;

    test("WB-GEO-001: calculateDistanceMeters returns 0 for exact workshop coordinates", () => {
        const distance = calculateDistanceMeters(WORKSHOP_LAT, WORKSHOP_LON, WORKSHOP_LAT, WORKSHOP_LON);
        assert.equal(distance, 0);
    });

    test("WB-GEO-002: Boundary check inside radius (499 meters) allows check-in", () => {
        // Offset latitude by ~0.00449 degrees corresponds to ~499 meters north
        const lat499m = WORKSHOP_LAT + 0.00449;
        const distance = calculateDistanceMeters(lat499m, WORKSHOP_LON, WORKSHOP_LAT, WORKSHOP_LON);
        assert.ok(distance <= BASE_RADIUS, `Expected <= 500m, got ${distance}m`);
        const effectiveRadius = calculateEffectiveRadius(BASE_RADIUS, 0);
        assert.equal(distance <= effectiveRadius, true);
    });

    test("WB-GEO-003: Boundary check exact radius (500 meters) allows check-in", () => {
        const lat500m = WORKSHOP_LAT + 0.00450;
        const distance = calculateDistanceMeters(lat500m, WORKSHOP_LON, WORKSHOP_LAT, WORKSHOP_LON);
        const effectiveRadius = calculateEffectiveRadius(BASE_RADIUS, 0);
        assert.ok(distance <= effectiveRadius, `Expected <= ${effectiveRadius}m, got ${distance}m`);
    });

    test("WB-GEO-004: Boundary check outside radius (501+ meters) rejects check-in without tugas luar", () => {
        const latOutside = WORKSHOP_LAT + 0.00550; // ~612 meters
        const distance = calculateDistanceMeters(latOutside, WORKSHOP_LON, WORKSHOP_LAT, WORKSHOP_LON);
        const effectiveRadius = calculateEffectiveRadius(BASE_RADIUS, 0);
        assert.ok(distance > effectiveRadius, `Expected > ${effectiveRadius}m, got ${distance}m`);
        assert.equal(distance <= effectiveRadius, false);
    });

    test("WB-GEO-005: GPS accuracy buffer widens effective boundary up to reported accuracy", () => {
        const effectiveRadius = calculateEffectiveRadius(500, 75);
        assert.equal(effectiveRadius, 575);
    });

    test("WB-GEO-006: GPS accuracy buffer is strictly capped at 200m against spoofing", () => {
        const effectiveRadius = calculateEffectiveRadius(500, 1500); // 1500m reported
        assert.equal(effectiveRadius, 700); // 500 + capped 200 = 700
    });

    test("WB-GEO-007: Late status is triggered at 09:16 WIB (1 minute late after 15 min tolerance)", () => {
        const check0915 = evaluateLateStatus(9, 15, "09:00", 15);
        assert.equal(check0915.isLate, false);
        assert.equal(check0915.lateMinutes, 0);

        const check0916 = evaluateLateStatus(9, 16, "09:00", 15);
        assert.equal(check0916.isLate, true);
        assert.equal(check0916.lateMinutes, 1);
    });
});
