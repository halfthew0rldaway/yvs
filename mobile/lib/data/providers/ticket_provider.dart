import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/tiket_model.dart';
import '../models/sparepart_model.dart';
import '../models/wiki_model.dart';

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

class SlaSummaryData {
  final int totalActive;
  final int expressCount;
  final int overdueCount;
  final int warningCount;
  final int onTrackCount;
  final int pendingApprovalCount;

  SlaSummaryData({
    required this.totalActive,
    required this.expressCount,
    required this.overdueCount,
    required this.warningCount,
    required this.onTrackCount,
    required this.pendingApprovalCount,
  });

  factory SlaSummaryData.fromJson(Map<String, dynamic> json) {
    return SlaSummaryData(
      totalActive: json['totalActive'] is int ? json['totalActive'] : int.tryParse(json['totalActive']?.toString() ?? '0') ?? 0,
      expressCount: json['expressCount'] is int ? json['expressCount'] : int.tryParse(json['expressCount']?.toString() ?? '0') ?? 0,
      overdueCount: json['overdueCount'] is int ? json['overdueCount'] : int.tryParse(json['overdueCount']?.toString() ?? '0') ?? 0,
      warningCount: json['warningCount'] is int ? json['warningCount'] : int.tryParse(json['warningCount']?.toString() ?? '0') ?? 0,
      onTrackCount: json['onTrackCount'] is int ? json['onTrackCount'] : int.tryParse(json['onTrackCount']?.toString() ?? '0') ?? 0,
      pendingApprovalCount: json['pendingApprovalCount'] is int ? json['pendingApprovalCount'] : int.tryParse(json['pendingApprovalCount']?.toString() ?? '0') ?? 0,
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
  final int expressCount;
  final int overdueCount;
  final List<ChartDataItem> chartData;
  final List<TiketModel> activeTickets;
  final List<SparepartModel> sparepartHampirHabis;
  final SlaSummaryData slaSummary;

  DashboardData({
    required this.tiketDitugaskan,
    required this.tiketTersedia,
    required this.menungguDiagnosis,
    required this.dalamPerbaikan,
    required this.tiketSelesai,
    required this.expressCount,
    required this.overdueCount,
    required this.chartData,
    required this.activeTickets,
    required this.sparepartHampirHabis,
    required this.slaSummary,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    List<TiketModel> activeList = [];
    if (json['activeTickets'] is List) {
      for (final item in json['activeTickets'] as List) {
        try {
          if (item is Map<String, dynamic>) {
            activeList.add(TiketModel.fromJson(item));
          }
        } catch (_) {}
      }
    }

    List<ChartDataItem> chartList = [];
    if (json['chartData'] is List) {
      for (final item in json['chartData'] as List) {
        try {
          if (item is Map<String, dynamic>) {
            chartList.add(ChartDataItem.fromJson(item));
          }
        } catch (_) {}
      }
    }

    List<SparepartModel> lowStockParts = [];
    if (json['sparepartHampirHabis'] is List) {
      for (final item in json['sparepartHampirHabis'] as List) {
        try {
          if (item is Map<String, dynamic>) {
            lowStockParts.add(SparepartModel.fromJson(item));
          }
        } catch (_) {}
      }
    }

    SlaSummaryData sla;
    if (json['slaSummary'] is Map<String, dynamic>) {
      sla = SlaSummaryData.fromJson(json['slaSummary']);
    } else {
      sla = SlaSummaryData(
        totalActive: activeList.length,
        expressCount: json['expressCount'] is int ? json['expressCount'] : 0,
        overdueCount: json['overdueCount'] is int ? json['overdueCount'] : 0,
        warningCount: 0,
        onTrackCount: 0,
        pendingApprovalCount: 0,
      );
    }

    return DashboardData(
      tiketDitugaskan: json['tiketDitugaskan'] is int ? json['tiketDitugaskan'] : int.tryParse(json['tiketDitugaskan']?.toString() ?? '0') ?? 0,
      tiketTersedia: json['tiketTersedia'] is int ? json['tiketTersedia'] : int.tryParse(json['tiketTersedia']?.toString() ?? '0') ?? 0,
      menungguDiagnosis: json['menungguDiagnosis'] is int ? json['menungguDiagnosis'] : int.tryParse(json['menungguDiagnosis']?.toString() ?? '0') ?? 0,
      dalamPerbaikan: json['dalamPerbaikan'] is int ? json['dalamPerbaikan'] : int.tryParse(json['dalamPerbaikan']?.toString() ?? '0') ?? 0,
      tiketSelesai: json['tiketSelesai'] is int ? json['tiketSelesai'] : int.tryParse(json['tiketSelesai']?.toString() ?? '0') ?? 0,
      expressCount: json['expressCount'] is int ? json['expressCount'] : int.tryParse(json['expressCount']?.toString() ?? '0') ?? 0,
      overdueCount: json['overdueCount'] is int ? json['overdueCount'] : int.tryParse(json['overdueCount']?.toString() ?? '0') ?? 0,
      chartData: chartList,
      activeTickets: activeList,
      sparepartHampirHabis: lowStockParts,
      slaSummary: sla,
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
  final String? slaUrgency; // 'overdue' | 'warning'
  final String? slaPaket; // 'express' | 'reguler'

  const TicketFilterState({
    this.status = 'all',
    this.searchQuery = '',
    this.onlyMyTickets = true,
    this.slaUrgency,
    this.slaPaket,
  });

  TicketFilterState copyWith({
    String? status,
    String? searchQuery,
    bool? onlyMyTickets,
    String? slaUrgency,
    String? slaPaket,
    bool clearSlaFilters = false,
  }) {
    return TicketFilterState(
      status: status ?? this.status,
      searchQuery: searchQuery ?? this.searchQuery,
      onlyMyTickets: onlyMyTickets ?? this.onlyMyTickets,
      slaUrgency: clearSlaFilters ? null : (slaUrgency ?? this.slaUrgency),
      slaPaket: clearSlaFilters ? null : (slaPaket ?? this.slaPaket),
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
  if (filter.slaUrgency != null) {
    queryParams['sla_urgency'] = filter.slaUrgency;
  }
  if (filter.slaPaket != null) {
    queryParams['sla_paket'] = filter.slaPaket;
  }

  final response = await client.dio.get(
    ApiConstants.tickets,
    queryParameters: queryParams,
  );

  if (response.data is List) {
    final list = (response.data as List)
        .map((item) => TiketModel.fromJson(item))
        .toList();
    return list;
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

// Filter state for Wiki
class WikiFilterState {
  final String search;
  final String kategori;

  const WikiFilterState({this.search = '', this.kategori = 'Semua'});

  WikiFilterState copyWith({String? search, String? kategori}) {
    return WikiFilterState(
      search: search ?? this.search,
      kategori: kategori ?? this.kategori,
    );
  }
}

final wikiFilterProvider = StateProvider<WikiFilterState>((ref) => const WikiFilterState());

// Repair Wiki List Provider
final wikisProvider = FutureProvider.autoDispose<List<WikiModel>>((ref) async {
  final client = ApiClient();
  final filter = ref.watch(wikiFilterProvider);

  final Map<String, dynamic> query = {};
  if (filter.search.isNotEmpty) query['search'] = filter.search;
  if (filter.kategori != 'Semua') query['kategori'] = filter.kategori;

  final response = await client.dio.get(ApiConstants.repairWiki, queryParameters: query);
  if (response.data is List) {
    return (response.data as List).map((i) => WikiModel.fromJson(i)).toList();
  } else if (response.data is Map && response.data['data'] is List) {
    return (response.data['data'] as List).map((i) => WikiModel.fromJson(i)).toList();
  }
  return [];
});

// Suggested Wiki Provider for Ticket
final suggestedWikiProvider = FutureProvider.family.autoDispose<List<WikiModel>, ({String? merek, String? model})>((ref, arg) async {
  final client = ApiClient();
  final query = <String, dynamic>{};
  if (arg.merek != null && arg.merek!.isNotEmpty) query['merek'] = arg.merek;
  if (arg.model != null && arg.model!.isNotEmpty) query['model'] = arg.model;

  if (query.isEmpty) return [];

  try {
    final response = await client.dio.get(ApiConstants.repairWikiSuggest, queryParameters: query);
    if (response.data is List) {
      return (response.data as List).map((i) => WikiModel.fromJson(i)).toList();
    }
  } catch (_) {}
  return [];
});
