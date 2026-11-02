import 'package:flutter_test/flutter_test.dart';
import 'package:servio_companion/data/providers/attendance_provider.dart';

void main() {
  test('AttendanceStatus.fromMap correctly parses standard check-in', () {
    final Map<String, dynamic> data = {
      'serverTime': '2026-11-02T08:30:00.000Z',
      'record': {
        'id': 10,
        'jam_masuk': '2026-11-02T08:25:00.000Z',
        'jam_pulang': null,
        'status': 'hadir',
        'is_tugas_luar': false,
        'status_review': 'valid',
      }
    };

    final status = AttendanceStatus.fromMap(data);

    expect(status.hasCheckedIn, isTrue);
    expect(status.hasCheckedOut, isFalse);
    expect(status.status, 'hadir');
    expect(status.isTugasLuar, isFalse);
    expect(status.statusReview, 'valid');
  });

  test('AttendanceStatus.fromMap correctly parses Tugas Luar check-in awaiting owner review', () {
    final Map<String, dynamic> data = {
      'serverTime': '2026-11-02T08:45:00.000Z',
      'record': {
        'id': 11,
        'jam_masuk': '2026-11-02T08:40:00.000Z',
        'jam_pulang': null,
        'status': 'hadir',
        'is_tugas_luar': true,
        'alasan_tugas_luar': 'Mengantar laptop Asus servis ke pelanggan di Pekayon',
        'status_review': 'menunggu_review',
      }
    };

    final status = AttendanceStatus.fromMap(data);

    expect(status.hasCheckedIn, isTrue);
    expect(status.hasCheckedOut, isFalse);
    expect(status.isTugasLuar, isTrue);
    expect(status.statusReview, 'menunggu_review');
    expect(status.alasanTugasLuar, 'Mengantar laptop Asus servis ke pelanggan di Pekayon');
  });
}
