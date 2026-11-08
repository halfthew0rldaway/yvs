import 'package:geolocator/geolocator.dart';

/// Resolves the device position for attendance geofencing.
/// Uses a tiered progressive strategy resilient to all conditions (outdoors, deep indoors, concrete roofs):
/// 0. Immediate pre-fetch of lastKnownPosition as a baseline fallback.
/// 1. Try high accuracy (GNSS satellite) with an 8-second timeout.
/// 2. If indoors/timeout, try medium/balanced accuracy (Wi-Fi + cell tower triangulation)
///    with a 6-second timeout.
/// 3. If live fix fails, evaluate baseline cached fix or fresh getLastKnownPosition()
///    (up to 24 hours if valid coords).
/// 4. Final fallback to low accuracy (4s timeout).
/// 5. Absolute fallback: return any cached position rather than failing to null.
Future<Position?> getAttendancePosition() async {
  try {
    if (!await Geolocator.isLocationServiceEnabled()) return null;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return null;
    }

    // Step 0: Immediate pre-fetch of cached position as an instant fallback
    Position? quickCached;
    try {
      quickCached = await Geolocator.getLastKnownPosition();
    } catch (_) {}

    // Step 1: High Accuracy GNSS (8s timeout)
    try {
      final highPos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );
      return highPos;
    } catch (_) {}

    // Step 2: Indoor / Wi-Fi / Cell tower assisted (Medium / Balanced, 6s timeout)
    try {
      final mediumPos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 6),
        ),
      );
      return mediumPos;
    } catch (_) {}

    // Step 3: Check cached position if recent (<= 30 minutes, accuracy <= 350m)
    if (quickCached != null) {
      final age = DateTime.now().difference(quickCached.timestamp);
      if (age <= const Duration(minutes: 30) && quickCached.accuracy <= 350) {
        return quickCached;
      }
    }

    // Step 4: Low accuracy fallback (4s timeout)
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 4),
        ),
      );
    } catch (_) {}

    // Final fallback: any last known position available rather than failing completely
    final fallbackLast = await Geolocator.getLastKnownPosition();
    return fallbackLast ?? quickCached;
  } catch (_) {
    return null;
  }
}
