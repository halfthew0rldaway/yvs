import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/wiki_model.dart';
import '../tickets/ticket_detail_screen.dart';

class WikiDetailScreen extends StatelessWidget {
  final WikiModel wiki;

  const WikiDetailScreen({super.key, required this.wiki});

  @override
  Widget build(BuildContext context) {
    Color difficultyColor;
    switch (wiki.tingkatKesulitan.toLowerCase()) {
      case 'mudah':
        difficultyColor = AppTheme.success;
        break;
      case 'menengah':
        difficultyColor = AppTheme.primary;
        break;
      case 'mahir':
      case 'sulit':
        difficultyColor = AppTheme.error;
        break;
      default:
        difficultyColor = AppTheme.textSecondary;
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Detail Panduan SOP'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A0F172A),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges Row
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Text(
                          wiki.kategori,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: difficultyColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: difficultyColor.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          wiki.tingkatKesulitan,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: difficultyColor,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified, size: 12, color: Color(0xFF059669)),
                            const SizedBox(width: 4),
                            Text(
                              '${wiki.tingkatSukses}% Sukses',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF047857),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (wiki.estimasiWaktu != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.background,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.schedule, size: 12, color: AppTheme.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                wiki.estimasiWaktu!,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    wiki.judul,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Device compatibility
                  Row(
                    children: [
                      const Icon(Icons.laptop_chromebook, size: 15, color: AppTheme.primary),
                      const SizedBox(width: 6),
                      Text(
                        'Kompatibilitas: ${wiki.brandName} ${wiki.modelSeri ?? '(Semua Model)'}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Author
                  Row(
                    children: [
                      const Icon(Icons.person_outline, size: 15, color: AppTheme.textMuted),
                      const SizedBox(width: 6),
                      Text(
                        'Ditulis oleh ${wiki.authorName}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Gejala & Tanda Kerusakan
            _buildSection(
              title: 'Gejala & Indikasi Kerusakan',
              icon: Icons.warning_amber_rounded,
              iconColor: AppTheme.warning,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Text(
                  wiki.gejala,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF92400E),
                    height: 1.4,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Kemungkinan Penyebab
            if (wiki.penyebab != null && wiki.penyebab!.isNotEmpty) ...[
              _buildSection(
                title: 'Akar Masalah (Root Cause)',
                icon: Icons.search,
                iconColor: AppTheme.primary,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Text(
                    wiki.penyebab!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textPrimary,
                      height: 1.4,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Komponen Terkait
            if (wiki.komponenTerkait != null && wiki.komponenTerkait!.isNotEmpty) ...[
              _buildSection(
                title: 'Komponen / IC Terkait',
                icon: Icons.memory,
                iconColor: AppTheme.indigo,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Text(
                    wiki.komponenTerkait!,
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Solusi & Langkah Pengerjaan
            _buildSection(
              title: 'Langkah Penanganan (SOP Standar)',
              icon: Icons.checklist_rounded,
              iconColor: AppTheme.success,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.border),
                ),
                child: SelectableText(
                  wiki.solusiLangkah,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: AppTheme.textPrimary,
                    height: 1.6,
                  ),
                ),
              ),
            ),

            // Sumber Tiket Referensi
            if (wiki.sumberTiketId != null) ...[
              const SizedBox(height: 16),
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TicketDetailScreen(ticketId: wiki.sumberTiketId!),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.history_edu_outlined, color: AppTheme.primary),
                      SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Studi Kasus Tiket Servis',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                            Text(
                              'Lihat rekam medis dan log teknisi yang menyelesaikan kasus ini',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.primary),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required Color iconColor,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: iconColor),
            const SizedBox(width: 6),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
