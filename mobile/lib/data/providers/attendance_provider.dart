import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../features/attendance/attendance_screen.dart';

/// Model representing user's today attendance status.
class AttendanceStatus {
  final bool hasCheckedIn;
  final bool hasCheckedOut;
  final String? jamMasuk;
  final String? jamPulang;
  final String? status; // 'tepat_waktu', 'terlambat', etc.
  final DateTime? serverTime;
  final Map<String, dynamic>? rawRecord;
  final bool isTugasLuar;
  final String? statusReview; // 'valid', 'menunggu_review', 'ditolak'
  final String? alasanTugasLuar;

  const AttendanceStatus({
    this.hasCheckedIn = false,
    this.hasCheckedOut = false,
    this.jamMasuk,
    this.jamPulang,
    this.status,
    this.serverTime,
    this.rawRecord,
    this.isTugasLuar = false,
    this.statusReview,
    this.alasanTugasLuar,
  });

  factory AttendanceStatus.fromMap(Map<String, dynamic> data) {
    final record = data['record'] as Map<String, dynamic>?;
    final serverTimeStr = data['serverTime']?.toString();
    final serverTime = serverTimeStr != null ? DateTime.tryParse(serverTimeStr) : null;

    if (record == null) {
      return AttendanceStatus(serverTime: serverTime);
    }

    final jamMasuk = record['jam_masuk']?.toString();
    final jamPulang = record['jam_pulang']?.toString();
    final status = record['status']?.toString();
    final isTugasLuar = record['is_tugas_luar'] == true || record['is_tugas_luar'] == 1;
    final statusReview = record['status_review']?.toString();
    final alasanTugasLuar = record['alasan_tugas_luar']?.toString();

    return AttendanceStatus(
      hasCheckedIn: jamMasuk != null && jamMasuk.isNotEmpty,
      hasCheckedOut: jamPulang != null && jamPulang.isNotEmpty,
      jamMasuk: jamMasuk,
      jamPulang: jamPulang,
      status: status,
      serverTime: serverTime,
      rawRecord: record,
      isTugasLuar: isTugasLuar,
      statusReview: statusReview,
      alasanTugasLuar: alasanTugasLuar,
    );
  }
}

/// Riverpod provider for today's attendance status.
final attendanceStatusProvider = FutureProvider<AttendanceStatus>((ref) async {
  final client = ApiClient();
  try {
    final res = await client.getWithCache(
      ApiConstants.attendanceToday,
      forceRefresh: true,
    );
    if (res.data is Map<String, dynamic>) {
      return AttendanceStatus.fromMap(res.data as Map<String, dynamic>);
    }
  } catch (_) {}
  return const AttendanceStatus();
});

/// Guard utility to enforce workshop operational discipline.
/// Restricts Create, Update, and Delete (C, U, D) operations if user has not checked in today.
class AttendanceGuard {
  /// Verifies if user has checked in today.
  /// If NOT checked in, displays an informative dialog blocking the CUD action
  /// and directs the user to [AttendanceScreen].
  /// Returns `true` if action is permitted, `false` if blocked.
  static bool verifyOrPrompt(
    BuildContext context,
    WidgetRef ref, {
    String actionName = 'melakukan tindakan ini',
  }) {
    final attendance = ref.read(attendanceStatusProvider).valueOrNull;
    final hasCheckedIn = attendance?.hasCheckedIn ?? false;

    if (hasCheckedIn) {
      return true;
    }

    HapticFeedback.vibrate();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.lock_clock_rounded, color: Color(0xFFD97706), size: 24),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Presensi Diperlukan',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Anda belum melakukan Check-In hari ini. Sesuai SOP Workshop, Anda hanya memiliki hak akses baca (Read-Only) dan tidak dapat $actionName sebelum melakukan presensi kehadiran.',
              style: const TextStyle(fontSize: 13, height: 1.4, color: Color(0xFF475569)),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Color(0xFF2563EB), size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Lakukan Check-In sekarang (Selfie & GPS) untuk mengaktifkan seluruh izin pengerjaan tiket.',
                      style: TextStyle(fontSize: 11.5, color: Color(0xFF1D4ED8)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Nanti Saja', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: const Icon(Icons.login_rounded, size: 18),
            label: const Text('Check-In Sekarang'),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AttendanceScreen()),
              );
            },
          ),
        ],
      ),
    );

    return false;
  }
}
