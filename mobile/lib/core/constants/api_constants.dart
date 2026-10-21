class ApiConstants {
  // Base URLs
  // Live Production VPS Backend
  static const String baseUrl = 'https://101.32.127.55.nip.io/api';
  static const String localUrl = 'http://127.0.0.1:5001/api';
  static const String emulatorUrl = 'http://10.0.2.2:5001/api';
  static const String lanUrl = 'http://192.168.18.131:5001/api';

  // Auth
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/me';
  static const String updateProfile = '/auth/profile';

  // Dashboard
  static const String teknisiDashboard = '/dashboard/teknisi';

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

  // Pustaka Wiki Solusi
  static const String repairWiki = '/repair-wiki';
  static const String repairWikiSuggest = '/repair-wiki/suggest';
  static String repairWikiDetail(int id) => '/repair-wiki/$id';

  // Helpers
  static String ticketDetail(int id) => '/tiket-servis/$id';
  static String ticketReminder(int id) => '/tiket-servis/$id/reminder';
  static String ticketClaimGaransi(int id) => '/tiket-servis/$id/claim-garansi';

  static String resolveImageUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final baseWithoutApi = baseUrl.replaceAll('/api', '');
    return '$baseWithoutApi${path.startsWith('/') ? '' : '/'}$path';
  }
}

