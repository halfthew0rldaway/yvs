import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/offline_banner.dart';
import '../../data/providers/attendance_provider.dart';
import '../../data/providers/auth_provider.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  DateTime _currentTime = DateTime.now();
  Timer? _timer;

  Map<String, dynamic>? _todayStatus;
  List<dynamic> _myHistory = [];
  bool _isLoading = true;
  bool _isActionLoading = false;
  bool _isFromCache = false;
  String _cachedTime = '';

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _currentTime = DateTime.now());
    });
    _loadAttendanceData();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadAttendanceData({bool forceRefresh = false}) async {
    setState(() => _isLoading = true);
    try {
      final client = ApiClient();

      // 1. Load today status
      final statusRes = await client.getWithCache(
        ApiConstants.attendanceToday,
        forceRefresh: forceRefresh,
      );

      // 2. Load my history (7 days)
      try {
        final historyRes = await client.getWithCache(
          ApiConstants.attendanceMyHistory,
          queryParameters: {'limit': '7'},
          forceRefresh: forceRefresh,
        );
        if (historyRes.data is Map && historyRes.data['records'] is List) {
          _myHistory = historyRes.data['records'] as List;
        } else if (historyRes.data is List) {
          _myHistory = historyRes.data as List;
        }
      } catch (_) {}

      if (mounted) {
        setState(() {
          _todayStatus = statusRes.data is Map<String, dynamic> ? statusRes.data as Map<String, dynamic> : null;
          _isFromCache = statusRes.isFromCache;
          _cachedTime = statusRes.formattedTime;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        // Only show notification if it's an actual unexpected error, not 404 (endpoint pending sync)
        if (e is DioException && e.response?.statusCode != 404) {
          final String errorMsg = (e.response?.data is Map && e.response?.data['message'] != null)
              ? e.response!.data['message'].toString()
              : 'Gagal memuat status presensi terbaru';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMsg),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    }
  }

  Future<void> _handleCheckIn({bool isTugasLuar = false, String? alasanTugasLuar}) async {
    HapticFeedback.mediumImpact();

    // 1. Ambil foto selfie via kamera depan
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 80,
      maxWidth: 1024,
    );

    if (photo == null) return;

    setState(() => _isActionLoading = true);
    try {
      final client = ApiClient();
      final formMap = <String, dynamic>{
        'foto': await MultipartFile.fromFile(photo.path, filename: 'selfie_masuk_${DateTime.now().millisecondsSinceEpoch}.jpg'),
        'device_info': 'Serv.io Companion Mobile App',
      };

      if (isTugasLuar) {
        formMap['is_tugas_luar'] = 'true';
        if (alasanTugasLuar != null && alasanTugasLuar.trim().isNotEmpty) {
          formMap['alasan_tugas_luar'] = alasanTugasLuar.trim();
        }
      }

      final formData = FormData.fromMap(formMap);

      await client.dio.post(ApiConstants.attendanceCheckIn, data: formData);

      HapticFeedback.heavyImpact();
      if (mounted) {
        final successMsg = isTugasLuar
            ? 'Check-In Tugas Luar berhasil diajukan dan menunggu verifikasi Owner.'
            : 'Check-In berhasil tercatat!';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text(successMsg)),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        _loadAttendanceData(forceRefresh: true);
        ref.invalidate(attendanceStatusProvider);
      }
    } catch (e) {
      if (mounted) {
        String msg = 'Gagal melakukan check-in.';
        bool isOutOfRadius = false;
        if (e is DioException && e.response?.data is Map) {
          final data = e.response!.data as Map;
          if (data['message'] != null) {
            msg = data['message'].toString();
          }
          if (data['out_of_radius'] == true) {
            isOutOfRadius = true;
          }
        }

        if (isOutOfRadius && !isTugasLuar) {
          _promptTugasLuarModal(reason: msg);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(msg),
              backgroundColor: AppTheme.error,
            ),
          );
        }
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  void _promptTugasLuarModal({String? reason}) {
    final TextEditingController reasonController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.location_off_rounded, color: Color(0xFFD97706), size: 22),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Check-In Tugas Luar / Lapangan',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      Text(
                        'Di luar radius kantor workshop Pekayon',
                        style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: const Text(
                'Anda berada di luar radius workshop. Jika sedang bertugas (antar unit pelanggan sebelum jam 9, ambil sparepart, servis di lokasi), silakan masukkan alasan penugasan untuk diverifikasi oleh Superadmin / Owner.',
                style: TextStyle(fontSize: 12, height: 1.4, color: Color(0xFF92400E)),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Alasan / Keterangan Tugas Luar *',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: reasonController,
              maxLines: 3,
              style: const TextStyle(fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Contoh: Mengantar unit laptop servis ke pelanggan sebelum jam 9...',
                hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Batal', style: TextStyle(color: AppTheme.textSecondary)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD97706),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.camera_alt_rounded, size: 16),
                    label: const Text('Ambil Selfie & Kirim', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      final text = reasonController.text.trim();
                      if (text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Alasan tugas luar wajib diisi!'),
                            backgroundColor: AppTheme.error,
                          ),
                        );
                        return;
                      }
                      Navigator.pop(ctx);
                      _handleCheckIn(isTugasLuar: true, alasanTugasLuar: text);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleCheckOut() async {
    HapticFeedback.mediumImpact();

    // 1. Cek apakah check-out lebih awal dari jam pulang operasional workshop
    final policy = _todayStatus?['policy'] as Map<String, dynamic>?;
    final jamPulangStr = policy?['jam_pulang']?.toString() ?? '17:00';
    final parts = jamPulangStr.split(':');
    final targetPulangMinutes = (int.tryParse(parts[0]) ?? 17) * 60 + (parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0);
    final currentMinutes = _currentTime.hour * 60 + _currentTime.minute;
    final isEarly = currentMinutes < targetPulangMinutes;

    if (isEarly) {
      _promptEarlyCheckOutModal(jamPulangStr);
      return;
    }

    // Konfirmasi check-out normal
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Konfirmasi Check-Out', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        content: const Text(
          'Apakah Anda yakin ingin melakukan Check-Out pulang sekarang?',
          style: TextStyle(fontSize: 13, color: AppTheme.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Ya, Check-Out'),
          ),
        ],
      ),
    );

    if (confirm != true) return;
    _executeCheckOut();
  }

  void _promptEarlyCheckOutModal(String jamPulangStr) {
    final TextEditingController reasonController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.access_time_filled_rounded, color: Color(0xFFD97706), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Konfirmasi Pulang Lebih Awal',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      Text(
                        'Sebelum jam operasional workshop ($jamPulangStr WIB)',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Text(
                'Anda melakukan Check-Out sebelum jam operasional workshop berakhir ($jamPulangStr WIB). Sesuai SOP, kepulangan lebih awal wajib menyertakan alasan yang jelas dan wajib diverifikasi oleh Superadmin / Owner.',
                style: const TextStyle(fontSize: 12, height: 1.4, color: Color(0xFF92400E)),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Alasan Pulang Lebih Awal *',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: reasonController,
              maxLines: 3,
              style: const TextStyle(fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Contoh: Keperluan keluarga mendadak / Kondisi kurang sehat / Antar unit ke luar kota...',
                hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  'Urusan Keluarga',
                  'Kurang Sehat / Sakit',
                  'Tugas Luar / Dinas',
                  'Izin Pimpinan',
                ].map((chip) => Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ActionChip(
                    label: Text(chip, style: const TextStyle(fontSize: 11)),
                    backgroundColor: const Color(0xFFF1F5F9),
                    onPressed: () {
                      reasonController.text = chip;
                    },
                  ),
                )).toList(),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Batal', style: TextStyle(color: AppTheme.textSecondary)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD97706),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.camera_alt_rounded, size: 16),
                    label: const Text('Selfie & Ajukan Pulang', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      final text = reasonController.text.trim();
                      if (text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Alasan pulang lebih awal wajib diisi!'),
                            backgroundColor: AppTheme.error,
                          ),
                        );
                        return;
                      }
                      Navigator.pop(ctx);
                      _executeCheckOut(alasanPulangCepat: text);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _executeCheckOut({String? alasanPulangCepat}) async {
    // Ambil foto selfie check-out
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 80,
      maxWidth: 1024,
    );

    if (photo == null) return;

    setState(() => _isActionLoading = true);
    try {
      final client = ApiClient();
      final map = <String, dynamic>{
        'foto': await MultipartFile.fromFile(photo.path, filename: 'selfie_pulang_${DateTime.now().millisecondsSinceEpoch}.jpg'),
      };
      if (alasanPulangCepat != null && alasanPulangCepat.isNotEmpty) {
        map['alasan_pulang_cepat'] = alasanPulangCepat;
      }
      final formData = FormData.fromMap(map);

      await client.dio.post(ApiConstants.attendanceCheckOut, data: formData);

      HapticFeedback.heavyImpact();
      if (mounted) {
        final successMsg = alasanPulangCepat != null
            ? 'Check-Out Pulang Lebih Awal diajukan dan menunggu verifikasi Owner.'
            : 'Check-Out selesai. Selamat beristirahat!';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text(successMsg)),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        _loadAttendanceData(forceRefresh: true);
        ref.invalidate(attendanceStatusProvider);
      }
    } catch (e) {
      if (mounted) {
        String msg = 'Gagal melakukan check-out.';
        if (e is DioException && e.response?.data is Map && e.response?.data['message'] != null) {
          msg = e.response?.data['message'].toString() ?? msg;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      return DateFormat('HH:mm').format(dt);
    } catch (_) {
      return '-';
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    final record = _todayStatus?['record'] as Map<String, dynamic>?;
    final policy = _todayStatus?['policy'] as Map<String, dynamic>?;
    final activeLeave = _todayStatus?['activeLeave'] as Map<String, dynamic>?;

    final bool hasCheckedIn = record != null && record['jam_masuk'] != null;
    final bool hasCheckedOut = record != null && record['jam_pulang'] != null;

    final clockTimeStr = DateFormat('HH:mm:ss').format(_currentTime);
    final dateStr = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(_currentTime);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.pin_drop_rounded, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Presensi Workshop',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                Text(
                  'Selfie & Geofencing GPS',
                  style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadAttendanceData(forceRefresh: true),
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // Offline Banner jika membaca dari cache
            if (_isFromCache)
              OfflineBanner(
                cachedTime: _cachedTime,
                onRefresh: () => _loadAttendanceData(forceRefresh: true),
                isSyncing: _isLoading,
              ),

            // Live Digital Clock & Date Header Card
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    user?.nama ?? 'Karyawan',
                    style: const TextStyle(
                      color: Color(0xFF93C5FD),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    clockTimeStr,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    dateStr,
                    style: const TextStyle(color: Color(0xFFBFDBFE), fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.location_on_rounded, size: 13, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              '${policy?['nama_kantor'] ?? "Workshop Pekayon"} (Radius ${policy?['radius_meter'] ?? 100}m)',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Jl. Raya Pekayon No.25, RT.004/RW.001, Pekayon Jaya, Bekasi Selatan',
                          style: TextStyle(color: Color(0xFFE0E7FF), fontSize: 10),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Status Kehadiran Hari Ini
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 30),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (activeLeave != null)
              // Sedang Cuti / Izin Aktif
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.event_available_rounded, color: Color(0xFF0284C7), size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Status: Sedang ${activeLeave['tipe']?.toString().toUpperCase()}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0369A1)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Alasan: ${activeLeave['alasan'] ?? "-"}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF0284C7)),
                    ),
                    Text(
                      'Durasi: ${activeLeave['jumlah_hari'] ?? 1} hari kerja',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF0369A1), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.border),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x060F172A),
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Status Presensi Hari Ini',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 12),

                    // Banner Status Review (Tugas Luar / Pulang Lebih Awal)
                    if (record != null && (record['is_tugas_luar'] == true || record['is_tugas_luar'] == 1 || record['status'] == 'pulang_cepat' || record['status_review'] == 'menunggu_review')) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: record['status_review'] == 'valid'
                              ? const Color(0xFFECFDF5)
                              : record['status_review'] == 'ditolak'
                                  ? const Color(0xFFFFF1F2)
                                  : const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: record['status_review'] == 'valid'
                                ? const Color(0xFFA7F3D0)
                                : record['status_review'] == 'ditolak'
                                    ? const Color(0xFFFECDD3)
                                    : const Color(0xFFFDE68A),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              record['status_review'] == 'valid'
                                  ? Icons.check_circle_rounded
                                  : record['status_review'] == 'ditolak'
                                      ? Icons.cancel_rounded
                                      : Icons.schedule_rounded,
                              size: 18,
                              color: record['status_review'] == 'valid'
                                  ? const Color(0xFF059669)
                                  : record['status_review'] == 'ditolak'
                                      ? const Color(0xFFE11D48)
                                      : const Color(0xFFD97706),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    record['status'] == 'pulang_cepat'
                                        ? (record['status_review'] == 'valid'
                                            ? 'Pulang Lebih Awal Disetujui Owner'
                                            : record['status_review'] == 'ditolak'
                                                ? 'Izin Pulang Lebih Awal Ditolak'
                                                : 'Pulang Lebih Awal • Menunggu Review Owner')
                                        : (record['status_review'] == 'valid'
                                            ? 'Tugas Luar Disetujui Owner'
                                            : record['status_review'] == 'ditolak'
                                                ? 'Presensi Tugas Luar Ditolak'
                                                : 'Tugas Luar • Menunggu Review Owner'),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: record['status_review'] == 'valid'
                                          ? const Color(0xFF065F46)
                                          : record['status_review'] == 'ditolak'
                                              ? const Color(0xFF9F1239)
                                              : const Color(0xFF92400E),
                                    ),
                                  ),
                                  if (record['alasan_tugas_luar'] != null)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        'Alasan: ${record['alasan_tugas_luar']}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: record['status_review'] == 'valid'
                                              ? const Color(0xFF047857)
                                              : record['status_review'] == 'ditolak'
                                                  ? const Color(0xFFBE123C)
                                                  : const Color(0xFFB45309),
                                        ),
                                      ),
                                    ),
                                  if (record['catatan'] != null && record['status'] == 'pulang_cepat')
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        '${record['catatan']}',
                                        style: const TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                                      ),
                                    ),
                                  if (record['catatan_review'] != null)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        'Catatan Owner: ${record['catatan_review']}',
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // Grid Info Jam Masuk & Pulang
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Jam Masuk', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                const SizedBox(height: 2),
                                Text(
                                  hasCheckedIn ? '${_formatTime(record['jam_masuk'])} WIB' : '--:--',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: hasCheckedIn ? const Color(0xFF10B981) : AppTheme.textMuted,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                if (hasCheckedIn && record['status'] == 'terlambat')
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      'Terlambat ${record['menit_keterlambatan']} mnt',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.error, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Jam Pulang', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                const SizedBox(height: 2),
                                Text(
                                  hasCheckedOut ? '${_formatTime(record['jam_pulang'])} WIB' : '--:--',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: hasCheckedOut ? const Color(0xFF3B82F6) : AppTheme.textMuted,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                if (hasCheckedOut && record['durasi_kerja_menit'] != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      'Durasi: ${(record['durasi_kerja_menit'] / 60).floor()}j ${record['durasi_kerja_menit'] % 60}m',
                                      style: const TextStyle(fontSize: 10, color: Color(0xFF0369A1), fontWeight: FontWeight.bold),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Action Buttons (Check-In or Check-Out)
                    if (!hasCheckedIn) ...[
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _isActionLoading ? null : _handleCheckIn,
                          icon: const Icon(Icons.camera_alt_rounded, size: 18),
                          label: const Text('Ambil Selfie Check-In Masuk'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Center(
                          child: TextButton.icon(
                            onPressed: _isActionLoading ? null : () => _promptTugasLuarModal(),
                            icon: const Icon(Icons.map_rounded, size: 15, color: Color(0xFFD97706)),
                            label: const Text(
                              'Sedang bertugas di luar workshop? Check-In Tugas Luar',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFFD97706),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ]
                    else if (!hasCheckedOut)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _isActionLoading ? null : _handleCheckOut,
                          icon: const Icon(Icons.exit_to_app_rounded, size: 18),
                          label: const Text('Check-Out Pulang'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE11D48), // Rose 600
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(12),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Presensi hari ini telah lengkap.',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF047857),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            const SizedBox(height: 20),

            // Riwayat Presensi 7 Hari Terakhir
            const Text(
              'Riwayat Presensi Terakhir',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 10),

            if (_myHistory.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Text(
                  'Belum ada rekaman riwayat presensi.',
                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              )
            else
              ..._myHistory.map((rec) {
                final dateRaw = rec['tanggal']?.toString() ?? '';
                final status = rec['status']?.toString() ?? 'hadir';
                final masuk = _formatTime(rec['jam_masuk']?.toString());
                final pulang = _formatTime(rec['jam_pulang']?.toString());

                Color statusColor = const Color(0xFF10B981);
                Color statusBg = const Color(0xFFECFDF5);
                String statusLabel = 'Hadir';

                if (status == 'terlambat') {
                  statusColor = const Color(0xFFE11D48);
                  statusBg = const Color(0xFFFFF1F2);
                  statusLabel = 'Terlambat';
                } else if (status == 'izin' || status == 'cuti') {
                  statusColor = const Color(0xFF0284C7);
                  statusBg = const Color(0xFFF0F9FF);
                  statusLabel = status.toUpperCase();
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dateRaw.split('T')[0],
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Masuk: $masuk  •  Pulang: $pulang',
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: statusColor),
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

