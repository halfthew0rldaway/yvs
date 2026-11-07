import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/network/api_client.dart';
import 'core/services/offline_cache_service.dart';
import 'core/theme/app_theme.dart';
import 'data/providers/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/navigation/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Muat konfigurasi environment (.env) SEBELUM ApiClient dibuat,
  // agar baseUrl & timeout sudah benar sejak request pertama.
  await _loadEnvironment();

  // Bersihkan cache offline milik environment lain (mis. sisa data production
  // di perangkat yang kini diarahkan ke staging) supaya tidak ada
  // ketidaksesuaian data antar environment.
  await OfflineCacheService.clearForeignEnvironments();

  try {
    await initializeDateFormatting('id_ID', null);
  } catch (_) {}

  runApp(
    const ProviderScope(
      child: ServioCompanionApp(),
    ),
  );
}

/// Membaca file `.env`. Diabaikan dengan aman jika file tidak tersedia
/// (mis. build release tanpa menyertakan .env) — ApiConstants akan memakai
/// `--dart-define` atau nilai default.
Future<void> _loadEnvironment() async {
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // Lanjutkan dengan --dart-define / default.
  }

  // Pastikan ApiClient memakai baseUrl & timeout hasil pembacaan env.
  ApiClient().applyEnvironmentConfig();
}

class ServioCompanionApp extends ConsumerWidget {
  const ServioCompanionApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      title: 'Serv.io Companion',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: authState.isAuthenticated ? const MainNavigationScreen() : const LoginScreen(),
    );
  }
}
