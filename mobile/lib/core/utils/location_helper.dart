import 'package:geolocator/geolocator.dart';

/// Resolves the device position for attendance geofencing.
/// Uses a tiered progressive strategy:
/// 1. Try high accuracy (GNSS satellite) with an 8-second timeout.
/// 2. If indoors/timeout, try medium/balanced accuracy (Wi-Fi + cell tower triangulation)
///    with a 6-second timeout (fast and reliable indoors).
/// 3. If live fix fails, fallback to getLastKnownPosition() if fresh (up to 15 minutes,
///    accuracy <= 250m).
/// 4. Final fallback to low accuracy (3s timeout).
/// Always passes the recorded position with accuracy to the backend, where the geofence
/// is widened by the reported accuracy uncertainty.
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
    // Under concrete workshop roof, Wi-Fi SSID / Google Location Accuracy works much faster
    try {
      final mediumPos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 6),
        ),
      );
      return mediumPos;
    } catch (_) {}

    // Step 3: Cached recent fix (up to 15 minutes, accuracy <= 250m)
    try {
      final last = await Geolocator.getLastKnownPosition();
      if (last != null) {
        final age = DateTime.now().difference(last.timestamp);
        if (age <= const Duration(minutes: 15) && last.accuracy <= 250) {
          return last;
        }
      }
    } catch (_) {}

    // Step 4: Low accuracy fallback as last resort (3s timeout)
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 3),
        ),
      );
    } catch (_) {}

    // Final fallback: any last known position available
    final fallbackLast = await Geolocator.getLastKnownPosition();
    return fallbackLast;
  } catch (_) {
    return null;
  }
}
