import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Konfigurasi environment aplikasi mobile.
///
/// Sumber nilai (prioritas tertinggi ke terendah):
///   1. `--dart-define=...`     (CI / build per-environment)
///   2. file `.env`             (flutter_dotenv, dibaca di main.dart)
///   3. fallback default di kelas ini
class AppEnvironment {
  static const String _envName = String.fromEnvironment('APP_ENV');
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _envAssetBaseUrl = String.fromEnvironment('API_ASSET_BASE_URL');

  /// Nama environment aktif: `staging`, `production`, atau `development`.
  /// Nilai ini menjadi bagian dari cache key offline sehingga data antar
  /// environment tidak pernah tercampur.
  static String get name {
    if (_envName.isNotEmpty) return _envName;
    final fromFile = _readEnv('APP_ENV');
    if (fromFile != null && fromFile.trim().isNotEmpty) return fromFile.trim();
    return 'development';
  }

  static bool get isProduction => name == 'production';
  static bool get isStaging => name == 'staging';

  /// Membaca nilai dari `.env` secara aman.
  ///
  /// `dotenv.maybeGet` melempar `NotInitializedError` bila `.env` belum
  /// dimuat (mis. unit test atau build release tanpa asset .env), sehingga
  /// akses harus dibungkus agar aplikasi tidak crash.
  static String? _readEnv(String key) {
    try {
      final value = dotenv.maybeGet(key);
      if (value == null) return null;
      final trimmed = value.trim();
      return trimmed.isEmpty ? null : trimmed;
    } catch (_) {
      return null;
    }
  }
}

class ApiConstants {
  // Base URLs — seluruhnya berasal dari environment (.env / --dart-define).
  static const String _prodBaseUrl = 'https://101.32.127.55.sslip.io/api';
  static const String _stagingBaseUrl = 'https://staging.101.32.127.55.sslip.io/api';

  /// Base URL API yang sedang aktif.
  /// Tidak ada lagi host hardcoded (localhost / 10.0.2.2 / LAN IP) di source.
  static String get baseUrl {
    if (AppEnvironment._envBaseUrl.isNotEmpty) return AppEnvironment._envBaseUrl;
    final fromFile = AppEnvironment._readEnv('API_BASE_URL');
    if (fromFile != null && fromFile.trim().isNotEmpty) return fromFile.trim();
    return AppEnvironment.isProduction ? _prodBaseUrl : _stagingBaseUrl;
  }

  /// Origin publik (tanpa suffix `/api`) untuk meresolve path gambar/upload.
  static String get assetBaseUrl {
    if (AppEnvironment._envAssetBaseUrl.isNotEmpty) return AppEnvironment._envAssetBaseUrl;
    final fromFile = AppEnvironment._readEnv('API_ASSET_BASE_URL');
    if (fromFile != null && fromFile.trim().isNotEmpty) return fromFile.trim();
    return baseUrl.replaceAll(RegExp(r'/api/*$'), '');
  }

  /// Prefix cache offline, dipisah per environment agar data staging
  /// dan production tidak pernah bercampur di perangkat yang sama.
  static String get environmentFingerprint {
    final sanitized = baseUrl.replaceAll(RegExp(r'[^A-Za-z0-9]'), '_');
    return '${AppEnvironment.name}_$sanitized';
  }

  /// Timeout jaringan (detik).
  static int get connectTimeoutSeconds => _intFromEnv('API_CONNECT_TIMEOUT', 30);
  static int get receiveTimeoutSeconds => _intFromEnv('API_RECEIVE_TIMEOUT', 30);

  static int _intFromEnv(String key, int fallback) {
    final raw = AppEnvironment._readEnv(key);
    if (raw == null) return fallback;
    return int.tryParse(raw.trim()) ?? fallback;
  }

  // Auth
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/me';
  static const String updateProfile = '/auth/profile';
  static const String uploadProfilePhoto = '/auth/profile/photo';
  static const String deleteProfilePhoto = '/auth/profile/photo';

  // Dashboard
  static const String teknisiDashboard = '/dashboard/teknisi';
  static const String adminDashboard = '/dashboard/admin';

  // Tiket Servis
  static const String tickets = '/tiket-servis';
  static const String claimGaransi = '/claim-garansi';

  // Diagnosis
  static const String diagnosis = '/diagnosis';

  // Log Perbaikan
  static const String logPerbaikan = '/log-perbaikan';

  // Sparepart
  static const String sparepart = '/sparepart';
  static const String useSparepart = '/sparepart/use';
  static String sparepartReminder(int id) => '/sparepart/$id/reminder-restock';

  // Notifications & Internal Memo
  static const String notifications = '/notifications';
  static const String notificationUnreadCount = '/notifications/unread-count';
  static const String sendNotification = '/notifications/send';
  static const String notificationReadAll = '/notifications/read-all';
  static String notificationRead(int id) => '/notifications/$id/read';

  // Pustaka Wiki Solusi
  static const String repairWiki = '/repair-wiki';
  static const String repairWikiSuggest = '/repair-wiki/suggest';
  static String repairWikiDetail(int id) => '/repair-wiki/$id';

  // Presensi & Absensi (Selfie + GPS Geofencing)
  static const String attendanceToday = '/attendance/today';
  static const String attendanceCheckIn = '/attendance/check-in';
  static const String attendanceCheckOut = '/attendance/check-out';
  static const String attendanceMyHistory = '/attendance/my-history';
  static const String attendancePolicy = '/attendance/policy';

  // Invoice & Serah Terima (Handover)
  static String invoiceDetail(int id) => '/invoice/$id';
  static String invoiceCustomerSignature(int id) => '/invoice/$id/signature';

  // Helpers
  static String ticketDetail(int id) => '/tiket-servis/$id';
  static String ticketReminder(int id) => '/tiket-servis/$id/reminder';
  static String ticketClaimGaransi(int id) => '/tiket-servis/$id/claim-garansi';

  static String resolveImageUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final origin = assetBaseUrl;
    return '$origin${path.startsWith('/') ? '' : '/'}$path';
  }
}

