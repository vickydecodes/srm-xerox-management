import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/order.dart';
import '../providers/order_provider.dart';
import '../providers/printer_provider.dart';
import '../widgets/receipt_preview_dialog.dart';

class OrderDetailScreen extends StatelessWidget {
  final ShopOrder order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final orderProvider = Provider.of<OrderProvider>(context);
    final printerProvider = Provider.of<PrinterProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A),
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text('Order #${order.orderNumber}',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.print_rounded, color: Colors.white),
            tooltip: 'Print ePOS Receipt',
            onPressed: () {
              showDialog(
                context: context,
                builder: (_) => ReceiptPreviewDialog(order: order),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color:
                          _getStatusColor(order.status).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(_getStatusIcon(order.status),
                        color: _getStatusColor(order.status), size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Status: ${order.status}',
                          style: TextStyle(
                            color: _getStatusColor(order.status),
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Payment: ${order.paymentStatus} (${order.paymentMethod})',
                          style:
                              const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    'Rs.${order.totalAmount.toStringAsFixed(2)}',
                    style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 20,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            _buildSectionTitle('CUSTOMER DETAILS'),
            const SizedBox(height: 10),
            Card(
              color: Colors.white,
              elevation: 1,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: Color(0xFFE2E8F0))),
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFF1E3A8A),
                  child: Icon(Icons.person, color: Colors.white),
                ),
                title: Text(order.customerName,
                    style: const TextStyle(
                        color: Color(0xFF0F172A), fontWeight: FontWeight.bold)),
                subtitle: Text(
                    'Phone: ${order.customerPhone}\nCreated: ${DateFormat('dd MMM yyyy, hh:mm a').format(order.createdAt)}',
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ),
            ),

            const SizedBox(height: 24),
            _buildSectionTitle('XEROX & PRINT ITEMS SPECIFICATION'),
            const SizedBox(height: 10),
            ...order.items.map((item) => Card(
                  color: Colors.white,
                  elevation: 1,
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: const BorderSide(color: Color(0xFFE2E8F0))),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              item.serviceName,
                              style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Rs.${item.totalPrice.toStringAsFixed(2)}',
                              style: const TextStyle(
                                  color: Color(0xFF1E3A8A),
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildChip(Icons.numbers, '${item.copies} Copies'),
                            _buildChip(
                                Icons.auto_stories, '${item.pages} Pages'),
                            _buildChip(Icons.aspect_ratio, item.paperSize),
                            _buildChip(
                              Icons.palette,
                              item.isColour ? 'Colour Print' : 'B/W Laser',
                              color: item.isColour
                                  ? Colors.amber.shade800
                                  : Colors.blueGrey,
                            ),
                            _buildChip(
                              Icons.flip,
                              item.isDoubleSided
                                  ? 'Double-sided (Duplex)'
                                  : 'Single-sided (Simplex)',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )),

            const SizedBox(height: 24),
            _buildSectionTitle('ORDER ACTIONS'),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.play_arrow_rounded,
                        color: Colors.white),
                    label: const Text('IN PROGRESS',
                        style: TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold)),
                    onPressed: () async {
                      final ok = await orderProvider.updateStatus(
                          order.id, 'IN_PROGRESS');
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                            content: Text(ok
                                ? 'Order set to In Progress'
                                : 'Failed to update status')),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0D9488),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.check_circle_outline,
                        color: Colors.white),
                    label: const Text('READY FOR PICKUP',
                        style: TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold)),
                    onPressed: () async {
                      final ok = await orderProvider.updateStatus(
                          order.id, 'READY_FOR_PICKUP');
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                            content: Text(ok
                                ? 'Order set to Ready for Pickup'
                                : 'Failed to update status')),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E3A8A),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.print_rounded, color: Colors.white),
                label: const Text('PRINT ePOS RECEIPT & CUT PAPER',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold)),
                onPressed: () async {
                  final result = await printerProvider.printOrder(order);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result.message),
                      backgroundColor:
                          result.success ? Colors.green : Colors.red,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF1E3A8A),
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildChip(IconData icon, String label, {Color color = const Color(0xFF64748B)}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(label,
              style: const TextStyle(color: Color(0xFF334155), fontSize: 12)),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange.shade800;
      case 'IN_PROGRESS':
        return const Color(0xFF2563EB);
      case 'READY_FOR_PICKUP':
        return const Color(0xFF0D9488);
      case 'DELIVERED':
        return const Color(0xFF16A34A);
      default:
        return const Color(0xFF64748B);
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'PENDING':
        return Icons.hourglass_top_rounded;
      case 'IN_PROGRESS':
        return Icons.print;
      case 'READY_FOR_PICKUP':
        return Icons.shopping_bag_outlined;
      case 'DELIVERED':
        return Icons.check_circle_rounded;
      default:
        return Icons.info_outline;
    }
  }
}
