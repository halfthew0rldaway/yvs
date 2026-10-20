import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/tiket_model.dart';
import '../models/sparepart_model.dart';

class ChartDataItem {
  final String name;
  final int value;

  ChartDataItem({required this.name, required this.value});

  factory ChartDataItem.fromJson(Map<String, dynamic> json) {
    return ChartDataItem(
      name: json['name']?.toString() ?? '',
      value: json['value'] is int ? json['value'] : int.tryParse(json['value']?.toString() ?? '0') ?? 0,
    );
  }
}

// Dashboard Data Model
class DashboardData {
  final int tiketDitugaskan;
  final int tiketTersedia;
  final int menungguDiagnosis;
  final int dalamPerbaikan;
  final int tiketSelesai;
  final List<ChartDataItem> chartData;
  final List<TiketModel> activeTickets;

  DashboardData({
    required this.tiketDitugaskan,
    required this.tiketTersedia,
    required this.menungguDiagnosis,
    required this.dalamPerbaikan,
    required this.tiketSelesai,
    required this.chartData,
    required this.activeTickets,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    List<TiketModel> activeList = [];
    if (json['activeTickets'] is List) {
      activeList = (json['activeTickets'] as List)
          .map((item) => TiketModel.fromJson(item))
          .toList();
    }

    List<ChartDataItem> chartList = [];
    if (json['chartData'] is List) {
      chartList = (json['chartData'] as List)
          .map((item) => ChartDataItem.fromJson(item))
          .toList();
    }

    return DashboardData(
      tiketDitugaskan: json['tiketDitugaskan'] is int ? json['tiketDitugaskan'] : int.tryParse(json['tiketDitugaskan']?.toString() ?? '0') ?? 0,
      tiketTersedia: json['tiketTersedia'] is int ? json['tiketTersedia'] : int.tryParse(json['tiketTersedia']?.toString() ?? '0') ?? 0,
      menungguDiagnosis: json['menungguDiagnosis'] is int ? json['menungguDiagnosis'] : int.tryParse(json['menungguDiagnosis']?.toString() ?? '0') ?? 0,
      dalamPerbaikan: json['dalamPerbaikan'] is int ? json['dalamPerbaikan'] : int.tryParse(json['dalamPerbaikan']?.toString() ?? '0') ?? 0,
      tiketSelesai: json['tiketSelesai'] is int ? json['tiketSelesai'] : int.tryParse(json['tiketSelesai']?.toString() ?? '0') ?? 0,
      chartData: chartList,
      activeTickets: activeList,
    );
  }
}

// Technician Dashboard Provider
final dashboardProvider = FutureProvider.autoDispose<DashboardData>((ref) async {
  final client = ApiClient();
  final response = await client.dio.get(ApiConstants.teknisiDashboard);
  return DashboardData.fromJson(response.data);
});

// Tiket List Filter State
class TicketFilterState {
  final String status;
  final String searchQuery;
  final bool onlyMyTickets;

  const TicketFilterState({
    this.status = 'all',
    this.searchQuery = '',
    this.onlyMyTickets = true,
  });

  TicketFilterState copyWith({
    String? status,
    String? searchQuery,
    bool? onlyMyTickets,
  }) {
    return TicketFilterState(
      status: status ?? this.status,
      searchQuery: searchQuery ?? this.searchQuery,
      onlyMyTickets: onlyMyTickets ?? this.onlyMyTickets,
    );
  }
}

final ticketFilterProvider = StateProvider<TicketFilterState>((ref) {
  return const TicketFilterState();
});

// All Tickets Provider with Query Filtering
final ticketsProvider = FutureProvider.autoDispose<List<TiketModel>>((ref) async {
  final client = ApiClient();
  final filter = ref.watch(ticketFilterProvider);
  
  final Map<String, dynamic> queryParams = {};
  if (filter.status != 'all') {
    queryParams['status'] = filter.status;
  }
  if (filter.searchQuery.isNotEmpty) {
    queryParams['search'] = filter.searchQuery;
  }

  final response = await client.dio.get(
    ApiConstants.tickets,
    queryParameters: queryParams,
  );

  if (response.data is List) {
    return (response.data as List)
        .map((item) => TiketModel.fromJson(item))
        .toList();
  }
  return [];
});

// Single Ticket Detail Provider
final ticketDetailProvider = FutureProvider.family.autoDispose<TiketModel, int>((ref, ticketId) async {
  final client = ApiClient();
  final response = await client.dio.get('${ApiConstants.tickets}/$ticketId');
  return TiketModel.fromJson(response.data);
});

// Spareparts Inventory Provider
final sparepartsProvider = FutureProvider.autoDispose<List<SparepartModel>>((ref) async {
  final client = ApiClient();
  final response = await client.dio.get(ApiConstants.sparepart);
  if (response.data is List) {
    return (response.data as List)
        .map((item) => SparepartModel.fromJson(item))
        .toList();
  }
  return [];
});

