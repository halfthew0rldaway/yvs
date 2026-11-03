class UserModel {
  final int id;
  final String nama;
  final String email;
  final String role;
  final String? fotoProfile;

  UserModel({
    required this.id,
    required this.nama,
    required this.email,
    required this.role,
    this.fotoProfile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      nama: json['nama']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'teknisi',
      fotoProfile: json['foto_profile']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'nama': nama,
    'email': email,
    'role': role,
    'foto_profile': fotoProfile,
  };
}
