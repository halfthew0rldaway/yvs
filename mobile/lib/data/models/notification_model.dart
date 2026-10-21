class NotificationModel {
  final int id;
  final String? recipientRole;
  final int? userId;
  final int? senderId;
  final String senderNama;
  final String tipe;
  final String judul;
  final String pesan;
  final String? link;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    this.recipientRole,
    this.userId,
    this.senderId,
    required this.senderNama,
    required this.tipe,
    required this.judul,
    required this.pesan,
    this.link,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      recipientRole: json['recipient_role']?.toString(),
      userId: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id']?.toString() ?? ''),
      senderId: json['sender_id'] is int ? json['sender_id'] : int.tryParse(json['sender_id']?.toString() ?? ''),
      senderNama: json['sender_nama']?.toString() ?? 'Sistem',
      tipe: json['tipe']?.toString() ?? 'info',
      judul: json['judul']?.toString() ?? 'Pemberitahuan',
      pesan: json['pesan']?.toString() ?? '',
      link: json['link']?.toString(),
      isRead: json['is_read'] == true || json['is_read'] == 1,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

