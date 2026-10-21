import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../tickets/ticket_detail_screen.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _manualInputController = TextEditingController();
  late final MobileScannerController _scannerController;
  late final AnimationController _laserAnimationController;

  bool _isSearching = false;
  bool _hasScanned = false;
  String? _lastDetectedCode;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );

    _laserAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _manualInputController.dispose();
    _scannerController.dispose();
    _laserAnimationController.dispose();
    super.dispose();
  }

  Future<void> _searchAndNavigate(String ticketQuery) async {
    final query = ticketQuery.trim();
    if (query.isEmpty) return;

    HapticFeedback.mediumImpact();
    setState(() {
      _isSearching = true;
      _hasScanned = true;
      _lastDetectedCode = query;
    });

    try {
      final client = ApiClient();
      final res = await client.dio.get(
        ApiConstants.tickets,
        queryParameters: {'search': query},
      );

      if (res.data is List && (res.data as List).isNotEmpty) {
        final firstTicket = (res.data as List).first;
        final int ticketId = firstTicket['id'] is int
            ? firstTicket['id']
            : int.parse(firstTicket['id'].toString());

        HapticFeedback.heavyImpact();
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => TicketDetailScreen(ticketId: ticketId)),
          );
        }
      } else {
        HapticFeedback.vibrate();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.white, size: 20),
                  const SizedBox(width: 10),
                  Expanded(child: Text('Tiket "$query" tidak ditemukan di sistem')),
                ],
              ),
              backgroundColor: AppTheme.error,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
          setState(() {
            _hasScanned = false;
            _isSearching = false;
          });
        }
      }
    } catch (_) {
      HapticFeedback.vibrate();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.wifi_off_rounded, color: Colors.white, size: 20),
                SizedBox(width: 10),
                Expanded(child: Text('Koneksi terganggu saat mencari tiket')),
              ],
            ),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        setState(() {
          _hasScanned = false;
          _isSearching = false;
        });
      }
    }
  }

  void _showManualInputDialog() {
    _manualInputController.text = _manualInputController.text.isEmpty ? 'SRV-${DateTime.now().year}-' : _manualInputController.text;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          decoration: const BoxDecoration(
            color: Color(0xFF131B2E),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(
              top: BorderSide(color: Color(0xFF283044), width: 1.5),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.keyboard_alt_outlined, color: Color(0xFF38BDF8), size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Input Nomor Tiket Manual',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Ketikkan nomor tiket yang tertera pada nota fisik atau label barcode unit.',
                style: TextStyle(fontSize: 12.5, color: Colors.white70),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _manualInputController,
                autofocus: true,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                  hintText: 'Contoh: SRV-2026-001',
                  hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                  prefixIcon: const Icon(Icons.confirmation_number_outlined, color: Color(0xFF38BDF8), size: 20),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear, color: Colors.white38, size: 18),
                    onPressed: () => _manualInputController.clear(),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF334155)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onSubmitted: (val) {
                  Navigator.pop(ctx);
                  _searchAndNavigate(val);
                },
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                  label: const Text('Buka Lembar Kerja Tiket'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  onPressed: () {
                    final text = _manualInputController.text;
                    Navigator.pop(ctx);
                    _searchAndNavigate(text);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final scanBoxSize = (screenSize.width * 0.72).clamp(240.0, 300.0);
    final scanWindow = Rect.fromCenter(
      center: Offset(screenSize.width / 2, screenSize.height * 0.42),
      width: scanBoxSize,
      height: scanBoxSize,
    );

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. MobileScanner Camera View
          MobileScanner(
            controller: _scannerController,
            onDetect: (capture) {
              if (_hasScanned || _isSearching) return;
              final barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null && barcode.rawValue!.isNotEmpty) {
                  _searchAndNavigate(barcode.rawValue!);
                  break;
                }
              }
            },
          ),

          // 2. Custom Painter Cutout & High-tech Laser Reticle
          AnimatedBuilder(
            animation: _laserAnimationController,
            builder: (context, child) {
              return CustomPaint(
                painter: ScannerOverlayPainter(
                  scanWindow: scanWindow,
                  scanProgress: _laserAnimationController.value,
                  isDetected: _hasScanned,
                  cornerColor: const Color(0xFF38BDF8),
                ),
                child: const SizedBox.expand(),
              );
            },
          ),

          // 3. Floating Top Bar
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back Button Glass Pill
                    ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0x66000000),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(color: Colors.white24, width: 0.8),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ),
                      ),
                    ),

                    // Title Badge
                    ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: const Color(0x66000000),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(color: Colors.white24, width: 0.8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.qr_code_scanner_rounded, size: 15, color: Color(0xFF38BDF8)),
                              SizedBox(width: 6),
                              Text(
                                'SCANNER WORKSHOP',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Controls (Torch & Camera Switch)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Flashlight
                        ValueListenableBuilder(
                          valueListenable: _scannerController,
                          builder: (context, state, child) {
                            final isTorchOn = state.torchState == TorchState.on;
                            return ClipRRect(
                              borderRadius: BorderRadius.circular(30),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: isTorchOn ? const Color(0x4DF59E0B) : const Color(0x66000000),
                                    borderRadius: BorderRadius.circular(30),
                                    border: Border.all(
                                      color: isTorchOn ? const Color(0xFFFBBF24) : Colors.white24,
                                      width: 0.8,
                                    ),
                                  ),
                                  child: IconButton(
                                    icon: Icon(
                                      isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                                      color: isTorchOn ? const Color(0xFFFBBF24) : Colors.white,
                                      size: 19,
                                    ),
                                    onPressed: () => _scannerController.toggleTorch(),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        // Flip Camera
                        ClipRRect(
                          borderRadius: BorderRadius.circular(30),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0x66000000),
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(color: Colors.white24, width: 0.8),
                              ),
                              child: IconButton(
                                icon: const Icon(Icons.flip_camera_ios_rounded, color: Colors.white, size: 19),
                                onPressed: () => _scannerController.switchCamera(),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 4. Instructional Badge under Viewfinder
          Positioned(
            top: scanWindow.bottom + 20,
            left: 20,
            right: 20,
            child: Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0x73000000),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Arahkan kamera ke QR Code atau Barcode Tiket',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Struk Servis Pelanggan • Label Barcode Perangkat',
                          style: TextStyle(
                            color: Color(0x99FFFFFF),
                            fontSize: 10.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // 5. Searching / Loading Overlay
          if (_isSearching)
            Container(
              color: const Color(0xB3000000),
              child: Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 22),
                      decoration: BoxDecoration(
                        color: const Color(0xE6131B2E),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF38BDF8), width: 1.2),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 32,
                            height: 32,
                            child: CircularProgressIndicator(
                              color: Color(0xFF38BDF8),
                              strokeWidth: 3,
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Memverifikasi Tiket...',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          if (_lastDetectedCode != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              _lastDetectedCode!,
                              style: const TextStyle(color: Color(0xFF38BDF8), fontFamily: 'monospace', fontSize: 12),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // 6. Bottom Floating Ergonomic Deck (Manual Input Trigger)
          Positioned(
            left: 20,
            right: 20,
            bottom: MediaQuery.of(context).padding.bottom + 16,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xD9131B2E),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12, width: 1),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x66000000),
                        blurRadius: 16,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          color: Color(0x332563EB),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.edit_note_rounded, color: Color(0xFF38BDF8), size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Barcode Rusak / Tidak Terbaca?',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12.5,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Gunakan opsi input kode tiket manual',
                              style: TextStyle(color: Colors.white60, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _showManualInputDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: const Text('Input Manual', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  final Rect scanWindow;
  final Color cornerColor;
  final double scanProgress;
  final bool isDetected;

  static const double cornerLength = 32.0;
  static const double cornerWidth = 4.0;
  static const double cornerRadius = 18.0;

  ScannerOverlayPainter({
    required this.scanWindow,
    this.cornerColor = const Color(0xFF38BDF8),
    this.scanProgress = 0.0,
    this.isDetected = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Dark semi-transparent cutout mask
    final backgroundPath = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final cutoutPath = Path()..addRRect(RRect.fromRectAndRadius(scanWindow, const Radius.circular(cornerRadius)));
    final overlayPath = Path.combine(PathOperation.difference, backgroundPath, cutoutPath);

    final overlayPaint = Paint()..color = const Color(0xB8090E17);
    canvas.drawPath(overlayPath, overlayPaint);

    // 2. Subtle frame border around viewfinder
    final borderPaint = Paint()
      ..color = isDetected ? const Color(0xFF10B981) : const Color(0x2EFFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawRRect(RRect.fromRectAndRadius(scanWindow, const Radius.circular(cornerRadius)), borderPaint);

    // 3. Four Precision Corner Reticles
    final cornerPaint = Paint()
      ..color = isDetected ? const Color(0xFF10B981) : cornerColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = cornerWidth
      ..strokeCap = StrokeCap.round;

    const l = cornerLength;
    final r = scanWindow;

    // Top-left
    canvas.drawPath(
      Path()
        ..moveTo(r.left, r.top + l)
        ..lineTo(r.left, r.top + cornerRadius)
        ..quadraticBezierTo(r.left, r.top, r.left + cornerRadius, r.top)
        ..lineTo(r.left + l, r.top),
      cornerPaint,
    );

    // Top-right
    canvas.drawPath(
      Path()
        ..moveTo(r.right - l, r.top)
        ..lineTo(r.right - cornerRadius, r.top)
        ..quadraticBezierTo(r.right, r.top, r.right, r.top + cornerRadius)
        ..lineTo(r.right, r.top + l),
      cornerPaint,
    );

    // Bottom-left
    canvas.drawPath(
      Path()
        ..moveTo(r.left, r.bottom - l)
        ..lineTo(r.left, r.bottom - cornerRadius)
        ..quadraticBezierTo(r.left, r.bottom, r.left + cornerRadius, r.bottom)
        ..lineTo(r.left + l, r.bottom),
      cornerPaint,
    );

    // Bottom-right
    canvas.drawPath(
      Path()
        ..moveTo(r.right - l, r.bottom)
        ..lineTo(r.right - cornerRadius, r.bottom)
        ..quadraticBezierTo(r.right, r.bottom, r.right, r.bottom - cornerRadius)
        ..lineTo(r.right, r.bottom - l),
      cornerPaint,
    );

    // 4. Center Aiming Crosshair
    final crossPaint = Paint()
      ..color = const Color(0x33FFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    const crossSize = 10.0;
    canvas.drawLine(
      Offset(r.center.dx - crossSize, r.center.dy),
      Offset(r.center.dx + crossSize, r.center.dy),
      crossPaint,
    );
    canvas.drawLine(
      Offset(r.center.dx, r.center.dy - crossSize),
      Offset(r.center.dx, r.center.dy + crossSize),
      crossPaint,
    );

    // 5. Animated Laser Scanline
    if (!isDetected) {
      final lineY = r.top + (r.height * scanProgress);
      final linePaint = Paint()
        ..shader = const LinearGradient(
          colors: [
            Colors.transparent,
            Color(0xD938BDF8),
            Colors.white,
            Color(0xD938BDF8),
            Colors.transparent,
          ],
          stops: [0.0, 0.25, 0.5, 0.75, 1.0],
        ).createShader(Rect.fromLTWH(r.left, lineY - 2, r.width, 4))
        ..strokeWidth = 2.5;

      canvas.drawLine(Offset(r.left + 10, lineY), Offset(r.right - 10, lineY), linePaint);

      // Soft glow aura behind laser
      final auraPaint = Paint()
        ..shader = const RadialGradient(
          colors: [Color(0x3838BDF8), Colors.transparent],
        ).createShader(Rect.fromCenter(center: Offset(r.center.dx, lineY), width: r.width, height: 26));
      canvas.drawRect(Rect.fromLTWH(r.left, lineY - 13, r.width, 26), auraPaint);
    }
  }

  @override
  bool shouldRepaint(covariant ScannerOverlayPainter oldDelegate) {
    return oldDelegate.scanProgress != scanProgress ||
        oldDelegate.isDetected != isDetected ||
        oldDelegate.scanWindow != scanWindow;
  }
}

