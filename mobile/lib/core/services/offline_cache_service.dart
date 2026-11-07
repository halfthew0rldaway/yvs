import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class CachedResponse<T> {
  final T data;
  final DateTime timestamp;
  final bool isFromCache;

  CachedResponse({
    required this.data,
    required this.timestamp,
    required this.isFromCache,
  });

  String get formattedTime {
    final now = DateTime.now();
    final diff = now.difference(timestamp);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} mnt lalu';
    if (diff.inHours < 24) return '${diff.inHours} jam lalu';
    return '${timestamp.day}/${timestamp.month} ${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}

class OfflineCacheService {
  static const String _basePrefix = 'servio_cache_';
  static const String _baseTimePrefix = 'servio_cache_time_';

  /// Prefix efektif yang sudah di-scope ke environment aktif.
  /// Contoh: `servio_cache_staging_https___staging_101_32_127_55_sslip_io_api_`
  static String get _prefix => '$_basePrefix${ApiConstants.environmentFingerprint}_';
  static String get _timePrefix => '$_baseTimePrefix${ApiConstants.environmentFingerprint}_';

  /// Hapus cache milik environment LAIN (mis. sisa production) agar
  /// perangkat tidak pernah menampilkan data dari backend yang berbeda.
  /// Cache milik environment aktif tetap dipertahankan.
  static Future<void> clearForeignEnvironments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentPrefix = _prefix;
      final currentTimePrefix = _timePrefix;

      final staleKeys = prefs.getKeys().where((k) {
        final isCacheKey = k.startsWith(_basePrefix) || k.startsWith(_baseTimePrefix);
        if (!isCacheKey) return false;
        return !k.startsWith(currentPrefix) && !k.startsWith(currentTimePrefix);
      }).toList();

      for (final k in staleKeys) {
        await prefs.remove(k);
      }
    } catch (_) {}
  }

  /// Simpan response data JSON ke SharedPreferences
  static Future<void> setCache(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = jsonEncode(data);
      await prefs.setString('$_prefix$key', jsonString);
      await prefs.setString('$_timePrefix$key', DateTime.now().toIso8601String());
    } catch (_) {
      // Abaikan error penyimpanan cache agar tidak menghentikan alur utama
    }
  }

  /// Ambil cache JSON dari SharedPreferences
  static Future<CachedResponse<dynamic>?> getCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString('$_prefix$key');
      final timeString = prefs.getString('$_timePrefix$key');

      if (jsonString == null || jsonString.isEmpty) return null;

      final data = jsonDecode(jsonString);
      final timestamp = timeString != null ? DateTime.tryParse(timeString) ?? DateTime.now() : DateTime.now();

      return CachedResponse(
        data: data,
        timestamp: timestamp,
        isFromCache: true,
      );
    } catch (_) {
      return null;
    }
  }

  /// Hapus cache tertentu
  static Future<void> removeCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_prefix$key');
      await prefs.remove('$_timePrefix$key');
    } catch (_) {}
  }

  /// Hapus seluruh cache offline Serv.io
  static Future<void> clearAllCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith(_prefix) || k.startsWith(_timePrefix));
      for (final k in keys) {
        await prefs.remove(k);
      }
    } catch (_) {}
  }
}

