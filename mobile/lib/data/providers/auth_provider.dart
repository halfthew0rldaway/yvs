import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../data/models/user_model.dart';

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? errorMessage;
  final bool isAuthenticated;

  AuthState({
    this.user,
    this.isLoading = false,
    this.errorMessage,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? errorMessage,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthNotifier() : super(AuthState()) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);
    try {
      final token = await _storage.read(key: 'jwt_token');
      final userJsonStr = await _storage.read(key: 'user_data');

      if (token != null && token.isNotEmpty && userJsonStr != null) {
        final userData = UserModel.fromJson(jsonDecode(userJsonStr));
        state = state.copyWith(
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        );

        // Fetch latest profile in background
        try {
          final res = await _apiClient.dio.get(ApiConstants.profile);
          if (res.data != null) {
            final freshUser = UserModel.fromJson(res.data);
            await _storage.write(key: 'user_data', value: jsonEncode(freshUser.toJson()));
            state = state.copyWith(user: freshUser);
          }
        } on DioException catch (e) {
          if (e.response?.statusCode == 401) {
            await logout();
            return;
          }
        } catch (_) {}
      } else {
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, isAuthenticated: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.login,
        data: {'email': email.trim(), 'password': password},
      );

      final data = response.data;
      final token = data['token']?.toString() ?? '';
      final user = UserModel.fromJson(data['user']);

      await _apiClient.setToken(token);
      await _storage.write(key: 'user_data', value: jsonEncode(user.toJson()));

      state = state.copyWith(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );
      return true;
    } on DioException catch (e) {
      String msg = 'Gagal masuk. Periksa email atau password.';
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        msg = e.response!.data['message'].toString();
      }
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, errorMessage: 'Gagal menghubungi server.');
      return false;
    }
  }

  Future<String?> updateProfile({
    required String nama,
    required String email,
    String? currentPassword,
    String? newPassword,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final Map<String, dynamic> body = {
        'nama': nama.trim(),
        'email': email.trim(),
      };
      if (currentPassword != null && currentPassword.isNotEmpty) {
        body['currentPassword'] = currentPassword;
      }
      if (newPassword != null && newPassword.isNotEmpty) {
        body['newPassword'] = newPassword;
      }

      final res = await _apiClient.dio.put(
        ApiConstants.updateProfile,
        data: body,
      );

      final data = res.data;
      if (data != null && data['user'] != null) {
        final freshUser = UserModel.fromJson(data['user']);
        await _storage.write(key: 'user_data', value: jsonEncode(freshUser.toJson()));
        state = state.copyWith(user: freshUser, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
      return null;
    } on DioException catch (e) {
      String msg = 'Gagal memperbarui profil.';
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        msg = e.response!.data['message'].toString();
      }
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return msg;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Terjadi kesalahan sistem.');
      return 'Terjadi kesalahan sistem.';
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.dio.post(ApiConstants.logout);
    } catch (_) {}
    await _apiClient.clearToken();
    await _storage.delete(key: 'user_data');
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
