import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// Modal dialog that allows users to pan, pinch-to-zoom, and rotate their photo
/// within a circular crop mask before saving as their profile picture.
class PhotoAdjustDialog extends StatefulWidget {
  final File imageFile;
  final Future<void> Function(List<int> bytes) onConfirm;

  const PhotoAdjustDialog({
    super.key,
    required this.imageFile,
    required this.onConfirm,
  });

  @override
  State<PhotoAdjustDialog> createState() => _PhotoAdjustDialogState();
}

class _PhotoAdjustDialogState extends State<PhotoAdjustDialog> {
  final GlobalKey _cropKey = GlobalKey();
  final TransformationController _transformController = TransformationController();
  int _quarterTurns = 0;
  double _zoomLevel = 1.0;
  bool _isProcessing = false;

  @override
  void dispose() {
    _transformController.dispose();
    super.dispose();
  }

  void _rotateClockwise() {
    HapticFeedback.selectionClick();
    setState(() {
      _quarterTurns = (_quarterTurns + 1) % 4;
    });
  }

  void _resetTransform() {
    HapticFeedback.selectionClick();
    setState(() {
      _quarterTurns = 0;
      _zoomLevel = 1.0;
      _transformController.value = Matrix4.identity();
    });
  }

  void _onSliderZoomChanged(double value) {
    setState(() {
      _zoomLevel = value;
      // Scale from center
      final matrix = Matrix4.diagonal3Values(value, value, 1.0);
      _transformController.value = matrix;
    });
  }

  Future<void> _handleConfirm() async {
    HapticFeedback.mediumImpact();
    setState(() => _isProcessing = true);

    try {
      // Find the render object bounded by the circular crop
      final boundary = _cropKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        throw Exception('Tidak dapat memproses area gambar');
      }

      // Render at 2.5x pixel ratio for high-DPI crisp avatar
      final ui.Image image = await boundary.toImage(pixelRatio: 2.5);
      final ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) {
        throw Exception('Gagal mengonversi gambar');
      }

      final bytes = byteData.buffer.asUint8List();
      await widget.onConfirm(bytes);

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const double viewportSize = 280.0;
    const double circleDiameter = 240.0;

    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 380),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.crop_rotate_rounded, color: AppTheme.primary, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Sesuaikan Foto',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          ),
                          Text(
                            'Geser & perbesar posisi foto',
                            style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: _isProcessing ? null : () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    color: AppTheme.textSecondary,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Interactive Viewport with Circular Mask
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: viewportSize,
                  height: viewportSize,
                  color: const Color(0xFF0F172A),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // The captured region inside circular boundary
                      RepaintBoundary(
                        key: _cropKey,
                        child: ClipOval(
                          child: SizedBox(
                            width: circleDiameter,
                            height: circleDiameter,
                            child: InteractiveViewer(
                              transformationController: _transformController,
                              minScale: 1.0,
                              maxScale: 4.0,
                              boundaryMargin: const EdgeInsets.all(120),
                              child: Center(
                                child: RotatedBox(
                                  quarterTurns: _quarterTurns,
                                  child: Image.file(
                                    widget.imageFile,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Outer circular vignette border ring
                      IgnorePointer(
                        child: Container(
                          width: circleDiameter,
                          height: circleDiameter,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withValues(alpha: 0.85), width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0F172A).withValues(alpha: 0.65),
                                spreadRadius: 40,
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Subtle hint badge
                      Positioned(
                        bottom: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.touch_app_outlined, size: 12, color: Colors.white70),
                              SizedBox(width: 4),
                              Text(
                                'Geser untuk memposisikan',
                                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Zoom Slider & Tools
              Row(
                children: [
                  const Icon(Icons.zoom_out_rounded, size: 18, color: AppTheme.textSecondary),
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                        overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                        activeTrackColor: AppTheme.primary,
                        thumbColor: AppTheme.primary,
                        inactiveTrackColor: const Color(0xFFE2E8F0),
                        trackHeight: 3,
                      ),
                      child: Slider(
                        value: _zoomLevel,
                        min: 1.0,
                        max: 3.0,
                        onChanged: _isProcessing ? null : _onSliderZoomChanged,
                      ),
                    ),
                  ),
                  const Icon(Icons.zoom_in_rounded, size: 18, color: AppTheme.textSecondary),
                ],
              ),

              // Action Toolbar (Rotate, Reset)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.rotate_right_rounded, size: 16, color: AppTheme.textPrimary),
                    label: const Text('Putar 90°', style: TextStyle(fontSize: 11.5, color: AppTheme.textPrimary)),
                    onPressed: _isProcessing ? null : _rotateClockwise,
                  ),
                  const SizedBox(width: 10),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.refresh_rounded, size: 16, color: AppTheme.textSecondary),
                    label: const Text('Reset', style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary)),
                    onPressed: _isProcessing ? null : _resetTransform,
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Bottom Confirmation Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: _isProcessing ? null : () => Navigator.pop(context),
                      child: const Text('Batal', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textSecondary)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      onPressed: _isProcessing ? null : _handleConfirm,
                      child: _isProcessing
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Terapkan Foto', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
