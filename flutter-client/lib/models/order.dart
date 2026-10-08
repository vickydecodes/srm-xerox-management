class OrderItem {
  final String id;
  final String serviceName;
  final int copies;
  final int pages;
  final String paperSize; // e.g. A4, A3, Legal
  final bool isColour;
  final bool isDoubleSided;
  final double unitPrice;
  final double totalPrice;

  OrderItem({
    required this.id,
    required this.serviceName,
    required this.copies,
    required this.pages,
    required this.paperSize,
    required this.isColour,
    required this.isDoubleSided,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<dynamic, dynamic> jsonMap) {
    final json = Map<String, dynamic>.from(jsonMap);
    final String name = json['name']?.toString() ?? json['serviceName']?.toString() ?? json['title']?.toString() ?? 'Print Item';
    final int qty = (json['quantity'] as num?)?.toInt() ?? (json['copies'] as num?)?.toInt() ?? (json['qty'] as num?)?.toInt() ?? 1;
    final int pgs = (json['pages'] as num?)?.toInt() ?? 1;
    final double price = (json['price'] as num?)?.toDouble() ?? (json['unitPrice'] as num?)?.toDouble() ?? (json['rate'] as num?)?.toDouble() ?? 0.0;
    final double tot = (json['total'] as num?)?.toDouble() ?? (json['totalPrice'] as num?)?.toDouble() ?? (json['amount'] as num?)?.toDouble() ?? (price * qty);

    return OrderItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      serviceName: name,
      copies: qty,
      pages: pgs,
      paperSize: json['paperSize']?.toString() ?? json['pageSize']?.toString() ?? 'A4',
      isColour: json['isColour'] == true || json['colour'] == true || name.toLowerCase().contains('colour') || name.toLowerCase().contains('color'),
      isDoubleSided: json['isDoubleSided'] == true || json['duplex'] == true || name.toLowerCase().contains('double'),
      unitPrice: price,
      totalPrice: tot,
    );
  }
}

class ShopOrder {
  final String id;
  final String orderNumber;
  final String customerName;
  final String customerPhone;
  final String status; // PENDING, IN_PROGRESS, READY_FOR_PICKUP, DELIVERED, CANCELLED
  final String paymentStatus; // UNPAID, PAID, CREDIT
  final String paymentMethod; // CASH, UPI, CREDIT
  final double totalAmount;
  final double taxAmount;
  final DateTime createdAt;
  final List<OrderItem> items;
  final String? documentUrl;
  final String? notes;

  ShopOrder({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.customerPhone,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.totalAmount,
    required this.taxAmount,
    required this.createdAt,
    required this.items,
    this.documentUrl,
    this.notes,
  });

  factory ShopOrder.fromJson(Map<dynamic, dynamic> jsonMap) {
    final json = Map<String, dynamic>.from(jsonMap);
    var rawItems = json['items'] as List? ?? json['orderItems'] as List? ?? [];
    List<OrderItem> parsedItems = rawItems.map((i) => OrderItem.fromJson(i is Map ? i : {})).toList();

    final userMap = json['user'] is Map ? Map<String, dynamic>.from(json['user']) : null;
    final createdByMap = json['createdBy'] is Map ? Map<String, dynamic>.from(json['createdBy']) : null;

    double calculatedTotal = (json['totalAmount'] as num?)?.toDouble() 
        ?? (json['total'] as num?)?.toDouble() 
        ?? (json['subtotal'] as num?)?.toDouble() 
        ?? 0.0;

    if (calculatedTotal == 0.0 && parsedItems.isNotEmpty) {
      calculatedTotal = parsedItems.fold(0.0, (sum, i) => sum + i.totalPrice);
    }

    return ShopOrder(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      orderNumber: json['code']?.toString() ?? json['orderNumber']?.toString() ?? 'ORD-${json['id']}',
      customerName: json['customerName']?.toString() ?? userMap?['name']?.toString() ?? createdByMap?['name']?.toString() ?? 'Walk-in Customer',
      customerPhone: json['customerPhone']?.toString() ?? userMap?['phone']?.toString() ?? createdByMap?['phone']?.toString() ?? 'N/A',
      status: json['status']?.toString().toUpperCase() ?? 'PENDING',
      paymentStatus: json['paymentStatus']?.toString().toUpperCase() ?? 'UNPAID',
      paymentMethod: json['paymentMethod']?.toString().toUpperCase() ?? 'CASH',
      totalAmount: calculatedTotal,
      taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? (json['tax'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      items: parsedItems,
      documentUrl: json['documentUrl']?.toString() ?? json['fileUrl']?.toString(),
      notes: json['purpose']?.toString() ?? json['notes']?.toString(),
    );
  }
}
