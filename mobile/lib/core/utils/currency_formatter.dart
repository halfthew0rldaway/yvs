import 'package:intl/intl.dart';

class CurrencyFormatter {
  static const List<String> _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  static String formatRupiah(num? amount) {
    if (amount == null) return 'Rp 0';
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }

  static String formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      final parsed = date is DateTime ? date : DateTime.parse(date.toString()).toLocal();
      final day = parsed.day;
      final month = _months[parsed.month - 1];
      final year = parsed.year;
      final hour = parsed.hour.toString().padLeft(2, '0');
      final minute = parsed.minute.toString().padLeft(2, '0');
      return '$day $month $year, $hour:$minute';
    } catch (_) {
      return date.toString();
    }
  }

  static String formatHeaderDateTime(DateTime dt) {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const monthsFull = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    final dayName = days[dt.weekday - 1];
    final monthName = monthsFull[dt.month - 1];
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute • $dayName, ${dt.day} $monthName';
  }

  static String formatDateOnly(dynamic date) {
    if (date == null) return '-';
    try {
      final parsed = date is DateTime ? date : DateTime.parse(date.toString()).toLocal();
      final day = parsed.day;
      final month = _months[parsed.month - 1];
      final year = parsed.year;
      return '$day $month $year';
    } catch (_) {
      return date.toString();
    }
  }
}
