import 'package:flutter/material.dart';
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

class _QrScannerScreenState extends State<QrScannerScreen> {
  final TextEditingController _manualInputController = TextEditingController();
  final MobileScannerController _scannerController = MobileScannerController();
  bool _isSearching = false;
  bool _hasScanned = false;

  @override
  void dispose() {
    _manualInputController.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _searchAndNavigate(String ticketQuery) async {
    final query = ticketQuery.trim();
    if (query.isEmpty) return;

    setState(() => _isSearching = true);
    try {
      final client = ApiClient();
      final res = await client.dio.get(
        ApiConstants.tickets,
        queryParameters: {'search': query},
      );

      if (res.data is List && (res.data as List).isNotEmpty) {
        final firstTicket = (res.data as List).first;
        final int ticketId = firstTicket['id'] is int ? firstTicket['id'] : int.parse(firstTicket['id'].toString());

        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => TicketDetailScreen(ticketId: ticketId)),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Tiket "$query" tidak ditemukan'),
              backgroundColor: AppTheme.error,
            ),
          );
          setState(() {
            _hasScanned = false;
            _isSearching = false;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal mencari tiket'), backgroundColor: AppTheme.error),
        );
        setState(() {
          _hasScanned = false;
          _isSearching = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR / Barcode Tiket'),
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _scannerController,
              builder: (context, state, child) {
                switch (state.torchState) {
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: AppTheme.warning);
                  case TorchState.off:
                  case TorchState.auto:
                  default:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                }
              },
            ),
            onPressed: () => _scannerController.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch_outlined),
            onPressed: () => _scannerController.switchCamera(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Camera Viewfinder using mobile_scanner
          Expanded(
            flex: 3,
            child: Stack(
              alignment: Alignment.center,
              children: [
                MobileScanner(
                  controller: _scannerController,
                  onDetect: (capture) {
                    if (_hasScanned || _isSearching) return;
                    final List<Barcode> barcodes = capture.barcodes;
                    for (final barcode in barcodes) {
                      if (barcode.rawValue != null && barcode.rawValue!.isNotEmpty) {
                        _hasScanned = true;
                        _searchAndNavigate(barcode.rawValue!);
                        break;
                      }
                    }
                  },
                ),
                Container(
                  width: 240,
                  height: 240,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.accent, width: 2.5),
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                if (_isSearching)
                  Container(
                    color: Colors.black54,
                    child: const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(color: Colors.white),
                          SizedBox(height: 12),
                          Text('Membuka tiket...', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Manual Entry Fallback
          Expanded(
            flex: 2,
            child: Container(
              color: AppTheme.surface,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Atau Masukkan Nomor Tiket Manual',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _manualInputController,
                          decoration: const InputDecoration(
                            hintText: 'Contoh: SRV-2026-0001',
                            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                          onSubmitted: _searchAndNavigate,
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isSearching ? null : () => _searchAndNavigate(_manualInputController.text),
                        child: _isSearching
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Buka'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
