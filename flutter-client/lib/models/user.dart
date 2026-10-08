class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? branchId;
  final String? shopName;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.branchId,
    this.shopName,
  });

  factory User.fromJson(Map<dynamic, dynamic> jsonMap) {
    final json = Map<String, dynamic>.from(jsonMap);
    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['username']?.toString() ?? 'Admin',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'ADMIN',
      branchId: json['branchId']?.toString(),
      shopName: json['shopName']?.toString() ?? (json['branch'] is Map ? json['branch']['name']?.toString() : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'branchId': branchId,
      'shopName': shopName,
    };
  }
}
