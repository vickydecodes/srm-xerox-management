import 'order.dart';

class ShopBill {
  final String id;
  final String billNumber;
  final String status; // PAID, UNPAID, CANCELLED
  final String paymentMethod; // CASH, UPI, CREDIT
  final double subtotal;
  final double tax;
  final double discount;
  final double total;
  final DateTime createdAt;
  final List<OrderItem> items;

  ShopBill({
    required this.id,
    required this.billNumber,
    required this.status,
    required this.paymentMethod,
    required this.subtotal,
    required this.tax,
    required this.discount,
    required this.total,
    required this.createdAt,
    required this.items,
  });

  factory ShopBill.fromJson(Map<dynamic, dynamic> jsonMap) {
    final json = Map<String, dynamic>.from(jsonMap);
    var rawItems = json['items'] as List? ?? [];
    List<OrderItem> parsedItems = rawItems.map((i) => OrderItem.fromJson(i is Map ? i : {})).toList();

    return ShopBill(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      billNumber: json['code']?.toString() ?? json['billNumber']?.toString() ?? 'BILL-${json['id']}',
      status: json['status']?.toString().toUpperCase() ?? 'PAID',
      paymentMethod: json['paymentMethod']?.toString().toUpperCase() ?? 'CASH',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      items: parsedItems,
    );
  }

  /// Converts Bill to ShopOrder for thermal printing reusing receipt preview dialog & epos printer service
  ShopOrder toShopOrder() {
    return ShopOrder(
      id: id,
      orderNumber: billNumber,
      customerName: 'Counter Customer',
      customerPhone: 'N/A',
      status: status,
      paymentStatus: status,
      paymentMethod: paymentMethod,
      totalAmount: total,
      taxAmount: tax,
      createdAt: createdAt,
      items: items,
      notes: 'Bill Receipt #$billNumber',
    );
  }
}
