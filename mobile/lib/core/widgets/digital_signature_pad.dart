import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SignatureController extends ChangeNotifier {
  final List<List<Offset>> _strokes = [];
  List<Offset> _currentStroke = [];

  List<List<Offset>> get strokes => _strokes;
  bool get isEmpty => _strokes.isEmpty && _currentStroke.isEmpty;
  bool get isNotEmpty => !isEmpty;

  void addPoint(Offset point) {
    _currentStroke.add(point);
    notifyListeners();
  }

  void endStroke() {
    if (_currentStroke.isNotEmpty) {
      _strokes.add(List.from(_currentStroke));
      _currentStroke = [];
      notifyListeners();
    }
  }

  void clear() {
    _strokes.clear();
    _currentStroke.clear();
    notifyListeners();
  }

  /// Ekspor goresan tanda tangan menjadi data URI Base64 PNG ('data:image/png;base64,...')
  Future<String?> toBase64Png({double width = 400, double height = 200}) async {
    if (isEmpty) return null;

    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, width, height));

    final paint = Paint()
      ..color = const Color(0xFF0F172A) // Slate 900
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke;

    for (final stroke in _strokes) {
      if (stroke.length > 1) {
        final path = Path();
        path.moveTo(stroke.first.dx, stroke.first.dy);
        for (int i = 1; i < stroke.length; i++) {
          path.lineTo(stroke[i].dx, stroke[i].dy);
        }
        canvas.drawPath(path, paint);
      } else if (stroke.length == 1) {
        canvas.drawCircle(stroke.first, 2.0, paint);
      }
    }

    final picture = recorder.endRecording();
    final img = await picture.toImage(width.toInt(), height.toInt());
    final byteData = await img.toByteData(format: ui.ImageByteFormat.png);

    if (byteData == null) return null;
    final bytes = byteData.buffer.asUint8List();
    final base64String = base64Encode(bytes);
    return 'data:image/png;base64,$base64String';
  }
}

class DigitalSignaturePad extends StatefulWidget {
  final SignatureController controller;
  final double height;
  final String label;

  const DigitalSignaturePad({
    super.key,
    required this.controller,
    this.height = 180,
    this.label = 'Tanda tangan digital penerima (gunakan jari)',
  });

  @override
  State<DigitalSignaturePad> createState() => _DigitalSignaturePadState();
}

class _DigitalSignaturePadState extends State<DigitalSignaturePad> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onSignatureChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onSignatureChanged);
    super.dispose();
  }

  void _onSignatureChanged() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
            ),
            if (widget.controller.isNotEmpty)
              InkWell(
                onTap: () => widget.controller.clear(),
                borderRadius: BorderRadius.circular(6),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.refresh_rounded, size: 14, color: AppTheme.error),
                      SizedBox(width: 4),
                      Text(
                        'Ulangi',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.error,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          height: widget.height,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: widget.controller.isNotEmpty ? AppTheme.primary : AppTheme.border,
              width: 1.5,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x060F172A),
                blurRadius: 4,
                offset: Offset(0, 1),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: Stack(
              children: [
                // Background dashed baseline
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 35,
                  child: Container(
                    height: 1,
                    color: const Color(0xFFE2E8F0),
                  ),
                ),

                // Placeholder watermark if empty
                if (widget.controller.isEmpty)
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.draw_outlined,
                          size: 32,
                          color: Colors.slate.shade300,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Goreskan tanda tangan pelanggan di sini',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.slate.shade400,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Gesture capture canvas
                GestureDetector(
                  onPanDown: (details) {
                    widget.controller.addPoint(details.localPosition);
                  },
                  onPanUpdate: (details) {
                    widget.controller.addPoint(details.localPosition);
                  },
                  onPanEnd: (_) {
                    widget.controller.endStroke();
                  },
                  child: CustomPaint(
                    painter: _SignaturePainter(widget.controller),
                    size: Size.infinite,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final SignatureController controller;

  _SignaturePainter(this.controller);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0F172A)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = 3.2
      ..style = PaintingStyle.stroke;

    for (final stroke in controller.strokes) {
      if (stroke.length > 1) {
        final path = Path();
        path.moveTo(stroke.first.dx, stroke.first.dy);
        for (int i = 1; i < stroke.length; i++) {
          path.lineTo(stroke[i].dx, stroke[i].dy);
        }
        canvas.drawPath(path, paint);
      } else if (stroke.length == 1) {
        canvas.drawCircle(stroke.first, 1.8, paint);
      }
    }

    if (controller._currentStroke.isNotEmpty) {
      final stroke = controller._currentStroke;
      if (stroke.length > 1) {
        final path = Path();
        path.moveTo(stroke.first.dx, stroke.first.dy);
        for (int i = 1; i < stroke.length; i++) {
          path.lineTo(stroke[i].dx, stroke[i].dy);
        }
        canvas.drawPath(path, paint);
      } else if (stroke.length == 1) {
        canvas.drawCircle(stroke.first, 1.8, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}
