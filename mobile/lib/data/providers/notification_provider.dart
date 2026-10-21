import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/notification_model.dart';

final notificationsProvider = FutureProvider.autoDispose<List<NotificationModel>>((ref) async {
  final client = ApiClient();
  final response = await client.dio.get(ApiConstants.notifications);
  final data = response.data;
  if (data is Map<String, dynamic> && data['notifications'] is List) {
    return (data['notifications'] as List)
        .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

final unreadNotificationCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final client = ApiClient();
  final response = await client.dio.get(ApiConstants.notificationUnreadCount);
  if (response.data is Map<String, dynamic> && response.data['unreadCount'] != null) {
    return int.tryParse(response.data['unreadCount'].toString()) ?? 0;
  }
  return 0;
});

