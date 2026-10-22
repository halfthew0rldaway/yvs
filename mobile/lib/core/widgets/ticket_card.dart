import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/whatsapp_helper.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/tiket_model.dart';

class TicketCard extends StatelessWidget {
  final TiketModel ticket;
  final VoidCallback onTap;
  final VoidCallback? onTakeOver;

  const TicketCard({
    super.key,
    required this.ticket,
    required this.onTap,
    this.onTakeOver,
  });

  String? _getActiveDurationText() {
    if (ticket.status == 'dalam_perbaikan') {
      DateTime? startTime;
      if (ticket.logPerbaikan != null && ticket.logPerbaikan!.isNotEmpty) {
        final repairLogs =
            ticket.logPerbaikan!.where((l) => l.fase == 'Perbaikan').toList();
        if (repairLogs.isNotEmpty && repairLogs.first.createdAt != null) {
          startTime = DateTime.tryParse(repairLogs.first.createdAt!);
        }
      }
      startTime ??= ticket.createdAt != null
          ? DateTime.tryParse(ticket.createdAt!)
          : null;

      if (startTime != null) {
        final elapsed = DateTime.now().difference(startTime);
        if (elapsed.inMinutes < 60) {
          return 'Pengerjaan: ${elapsed.inMinutes} mnt';
        } else if (elapsed.inHours < 24) {
          final hours = elapsed.inHours;
          final mins = elapsed.inMinutes % 60;
          return 'Pengerjaan: ${hours}j ${mins}m';
        } else {
          final days = elapsed.inDays;
          final hours = elapsed.inHours % 24;
          return 'Pengerjaan: ${days}h ${hours}j';
        }
      }
    } else if (ticket.status == 'disetujui') {
      return 'Siap Dieksekusi';
    }
    return null;
  }

  String? _getSlaRemainingText() {
    if (ticket.targetSelesaiAt == null ||
        ticket.status == 'selesai' ||
        ticket.status == 'diambil' ||
        ticket.status == 'dibatalkan') {
      return null;
    }
    try {
      final target = DateTime.parse(ticket.targetSelesaiAt!);
      final diff = target.difference(DateTime.now());
      if (diff.isNegative) {
        final overdueMins = diff.inMinutes.abs();
        if (overdueMins < 60) return 'Terlewat ${overdueMins}m';
        final overdueHours = diff.inHours.abs();
        return 'Terlewat ${overdueHours}j';
      } else {
        if (diff.inMinutes < 60) return 'Sisa SLA: ${diff.inMinutes}m';
        final hours = diff.inHours;
        final mins = diff.inMinutes % 60;
        if (hours < 24) return 'Sisa SLA: ${hours}j ${mins}m';
        return 'Sisa SLA: ${diff.inDays}h';
      }
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final device = ticket.perangkat;
    final customer = device?.customer;
    final isUnassigned = ticket.teknisiId == null && ticket.teknisi == null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Ticket Number & Status / SLA Badges
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Row(
                      children: [
                        Text(
                          '#${ticket.nomorTiket}',
                          style: GoogleFonts.jetBrainsMono(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: AppTheme.textPrimary,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        StatusBadge(status: ticket.status),
                        if (ticket.isOverdue) ...[
                          const SizedBox(width: 5),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: AppTheme.errorBg,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.errorBorder),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.alarm, size: 12, color: AppTheme.error),
                                const SizedBox(width: 3),
                                Text(
                                  ticket.slaLabel ?? 'OVERDUE',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.error,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else if (ticket.isExpress) ...[
                          const SizedBox(width: 5),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFFDE68A)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.bolt, size: 12, color: Color(0xFFD97706)),
                                SizedBox(width: 2),
                                Text(
                                  'EXPRESS',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF92400E),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Device details + Serial Number Chip
                Row(
                  children: [
                    const Icon(Icons.laptop_chromebook_rounded, size: 16, color: AppTheme.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${device?.merek ?? ''} ${device?.model ?? ''}'.trim(),
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (device?.serialNumber != null && device!.serialNumber!.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.background,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: AppTheme.borderLight),
                        ),
                        child: Text(
                          'SN: ${device.serialNumber}',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 10,
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 6),

                // Customer info + WhatsApp Contact Button
                Row(
                  children: [
                    const Icon(Icons.person_outline, size: 15, color: AppTheme.textMuted),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        customer?.nama ?? '-',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (customer != null && customer.nomorTelepon.isNotEmpty && customer.nomorTelepon != '-')
                      InkWell(
                        onTap: () {
                          WhatsAppHelper.openChat(
                            customer.nomorTelepon,
                            message: 'Halo kak ${customer.nama}, saya teknisi dari Serv.io Workshop mengenai tiket perbaikan unit ${ticket.nomorTiket} (${device?.merek ?? ''} ${device?.model ?? ''}).',
                          );
                        },
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.chat_bubble_outline_rounded, size: 12, color: Color(0xFF059669)),
                              SizedBox(width: 4),
                              Text(
                                'WhatsApp',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF047857),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),

                // Active Repair / Ready Duration Banner
                Builder(
                  builder: (_) {
                    final activeDuration = _getActiveDurationText();
                    final slaRemaining = _getSlaRemainingText();
                    if (activeDuration == null) return const SizedBox.shrink();

                    final isRepairing = ticket.status == 'dalam_perbaikan';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                        decoration: BoxDecoration(
                          color: isRepairing ? const Color(0xFFEFF6FF) : const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isRepairing ? const Color(0xFFBFDBFE) : const Color(0xFFBBF7D0),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isRepairing ? Icons.play_circle_outline_rounded : Icons.task_alt_rounded,
                              size: 13,
                              color: isRepairing ? AppTheme.primary : const Color(0xFF16A34A),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              activeDuration,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isRepairing ? AppTheme.primary : const Color(0xFF15803D),
                              ),
                            ),
                            if (slaRemaining != null) ...[
                              const SizedBox(width: 6),
                              Container(
                                width: 3,
                                height: 3,
                                decoration: const BoxDecoration(
                                  color: AppTheme.textMuted,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                slaRemaining,
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                  color: ticket.isOverdue ? AppTheme.error : AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),

                // Issue summary
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ticket.keluhan,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                          height: 1.4,
                        ),
                      ),
                      if (ticket.status == 'menunggu_persetujuan' && ticket.diagnosis != null) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.request_quote_outlined, size: 13, color: AppTheme.primary),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  'Estimasi ${CurrencyFormatter.formatRupiah(ticket.diagnosis!.estimasiBiaya)} (Menunggu ACC)',
                                  style: const TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // Unassigned Take-Over Banner
                if (isUnassigned) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded, size: 16, color: Color(0xFFD97706)),
                        const SizedBox(width: 6),
                        const Expanded(
                          child: Text(
                            'Belum ada teknisi',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ),
                        if (onTakeOver != null)
                          InkWell(
                            onTap: onTakeOver,
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFFCD34D)),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.pan_tool_outlined, size: 12, color: Color(0xFFB45309)),
                                  SizedBox(width: 4),
                                  Text(
                                    'Ambil Alih',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF92400E),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 8),

                // Footer: Date & Technician info
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined, size: 12, color: AppTheme.textMuted),
                          const SizedBox(width: 4),
                          Text(
                            CurrencyFormatter.formatDateOnly(ticket.createdAt),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textMuted,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text('•', style: TextStyle(color: AppTheme.border, fontSize: 12)),
                          const SizedBox(width: 6),
                          const Icon(Icons.engineering_outlined, size: 13, color: AppTheme.primary),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              ticket.teknisiNama,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isUnassigned ? AppTheme.textMuted : AppTheme.primary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 16, color: AppTheme.textMuted),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
