class DidDocument {
  final String id;
  final String did;
  final String owner;
  final String status; // 'pending', 'approved', 'rejected'
  final Map<String, dynamic> content;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? approvedBy;
  final DateTime? approvedAt;
  final String? rejectedBy;
  final DateTime? rejectedAt;
  final String? rejectionReason;

  DidDocument({
    required this.id,
    required this.did,
    required this.owner,
    required this.status,
    required this.content,
    required this.createdAt,
    this.updatedAt,
    this.approvedBy,
    this.approvedAt,
    this.rejectedBy,
    this.rejectedAt,
    this.rejectionReason,
  });

  factory DidDocument.fromJson(Map<String, dynamic> json) {
    return DidDocument(
      id: json['id'] ?? '',
      did: json['did'] ?? '',
      owner: json['owner'] ?? '',
      status: json['status'] ?? 'pending',
      content: json['content'] ?? {},
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      approvedBy: json['approvedBy'],
      approvedAt: json['approvedAt'] != null ? DateTime.parse(json['approvedAt']) : null,
      rejectedBy: json['rejectedBy'],
      rejectedAt: json['rejectedAt'] != null ? DateTime.parse(json['rejectedAt']) : null,
      rejectionReason: json['rejectionReason'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'did': did,
      'owner': owner,
      'status': status,
      'content': content,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'approvedBy': approvedBy,
      'approvedAt': approvedAt?.toIso8601String(),
      'rejectedBy': rejectedBy,
      'rejectedAt': rejectedAt?.toIso8601String(),
      'rejectionReason': rejectionReason,
    };
  }

  DidDocument copyWith({
    String? id,
    String? did,
    String? owner,
    String? status,
    Map<String, dynamic>? content,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? approvedBy,
    DateTime? approvedAt,
    String? rejectedBy,
    DateTime? rejectedAt,
    String? rejectionReason,
  }) {
    return DidDocument(
      id: id ?? this.id,
      did: did ?? this.did,
      owner: owner ?? this.owner,
      status: status ?? this.status,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedAt: approvedAt ?? this.approvedAt,
      rejectedBy: rejectedBy ?? this.rejectedBy,
      rejectedAt: rejectedAt ?? this.rejectedAt,
      rejectionReason: rejectionReason ?? this.rejectionReason,
    );
  }
}
