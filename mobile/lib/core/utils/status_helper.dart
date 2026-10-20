import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatusHelper {
  static const Map<String, String> labels = {
    'diterima': 'Diterima',
    'didiagnosis': 'Didiagnosis',
    'menunggu_persetujuan': 'Menunggu Persetujuan',
    'disetujui': 'Disetujui',
    'dalam_perbaikan': 'Dalam Perbaikan',
    'selesai': 'Selesai',
    'diambil': 'Diambil',
    'dibatalkan': 'Dibatalkan',
  };

  static String getLabel(String? status) {
    if (status == null) return '-';
    return labels[status.toLowerCase()] ?? status;
  }

  static Color getBackgroundColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'diterima':
        return AppTheme.infoBg;
      case 'didiagnosis':
        return AppTheme.purpleBg;
      case 'menunggu_persetujuan':
        return AppTheme.warningBg;
      case 'disetujui':
        return AppTheme.successBg;
      case 'dalam_perbaikan':
        return AppTheme.indigoBg;
      case 'selesai':
        return AppTheme.successBg;
      case 'diambil':
        return const Color(0xFFF1F5F9);
      case 'dibatalkan':
        return AppTheme.errorBg;
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  static Color getBorderColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'diterima':
        return AppTheme.infoBorder;
      case 'didiagnosis':
        return AppTheme.purpleBorder;
      case 'menunggu_persetujuan':
        return AppTheme.warningBorder;
      case 'disetujui':
        return AppTheme.successBorder;
      case 'dalam_perbaikan':
        return AppTheme.indigoBorder;
      case 'selesai':
        return AppTheme.successBorder;
      case 'diambil':
        return AppTheme.border;
      case 'dibatalkan':
        return AppTheme.errorBorder;
      default:
        return AppTheme.border;
    }
  }

  static Color getTextColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'diterima':
        return AppTheme.infoText;
      case 'didiagnosis':
        return AppTheme.purpleText;
      case 'menunggu_persetujuan':
        return AppTheme.warningText;
      case 'disetujui':
        return AppTheme.successText;
      case 'dalam_perbaikan':
        return AppTheme.indigoText;
      case 'selesai':
        return AppTheme.successText;
      case 'diambil':
        return AppTheme.textSecondary;
      case 'dibatalkan':
        return AppTheme.errorText;
      default:
        return AppTheme.textSecondary;
    }
  }
}

