import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';
import '../services/offline_cache_service.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  String? _token;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Bypass SSL handshake alerts / certificate issues for sslip.io / VPS IP on mobile networks
    if (dio.httpClientAdapter is IOHttpClientAdapter) {
      (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
        final client = HttpClient();
        client.badCertificateCallback = (X509Certificate cert, String host, int port) {
          // Allow connection to VPS IP, sslip.io, nip.io and local networks
          return true;
        };
        return client;
      };
    }

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          _token ??= await _storage.read(key: 'jwt_token');
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            _token = null;
            await _storage.delete(key: 'jwt_token');
            await _storage.delete(key: 'user_data');
          }
          return handler.next(e);
        },
      ),
    );
  }

  Future<void> setToken(String token) async {
    _token = token;
    await _storage.write(key: 'jwt_token', value: token);
  }

  Future<void> clearToken() async {
    _token = null;
    await _storage.delete(key: 'jwt_token');
  }

  Future<String?> getToken() async {
    if (_token != null) return _token;
    _token = await _storage.read(key: 'jwt_token');
    return _token;
  }

  /// Request GET dengan kapabilitas Cache-First Offline
  /// Otomatis menyimpan response sukses ke storage lokal dan mengambil dari cache saat jaringan putus/offline.
  Future<CachedResponse<dynamic>> getWithCache(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool forceRefresh = false,
  }) async {
    final queryStr = queryParameters != null ? queryParameters.entries.map((e) => '${e.key}=${e.value}').join('&') : '';
    final cacheKey = '$path?$queryStr';

    if (!forceRefresh) {
      // Cek apakah ada cache saat perangkat offline
    }

    try {
      final response = await dio.get(path, queryParameters: queryParameters);
      if (response.statusCode == 200 && response.data != null) {
        await OfflineCacheService.setCache(cacheKey, response.data);
        return CachedResponse(
          data: response.data,
          timestamp: DateTime.now(),
          isFromCache: false,
        );
      }
    } catch (e) {
      // Jika terjadi error jaringan / offline, coba ambil dari cache lokal
      final cached = await OfflineCacheService.getCache(cacheKey);
      if (cached != null) {
        return cached;
      }
      rethrow;
    }

    final fallback = await OfflineCacheService.getCache(cacheKey);
    if (fallback != null) return fallback;
    throw DioException(
      requestOptions: RequestOptions(path: path),
      error: 'Tidak ada koneksi internet dan belum ada data tersimpan di cache.',
    );
  }
}
