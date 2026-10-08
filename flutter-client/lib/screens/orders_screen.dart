import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/order.dart';
import '../providers/order_provider.dart';
import '../providers/printer_provider.dart';
import '../widgets/receipt_preview_dialog.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orderProvider = Provider.of<OrderProvider>(context);
    final printerProvider = Provider.of<PrinterProvider>(context);

    return Column(
      children: [
        // Filter Tabs Header
        Container(
          height: 54,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.white,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildFilterChip(context, 'ALL', 'All Jobs'),
              _buildFilterChip(context, 'PENDING', 'Pending'),
              _buildFilterChip(context, 'IN_PROGRESS', 'In Progress'),
              _buildFilterChip(context, 'READY_FOR_PICKUP', 'Ready'),
              _buildFilterChip(context, 'DELIVERED', 'Delivered'),
            ],
          ),
        ),

        // Main List Body
        Expanded(
          child: orderProvider.isLoading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF1E3A8A)))
              : orderProvider.orders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_rounded, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text('No orders found in queue', style: TextStyle(color: Color(0xFF64748B), fontSize: 16)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () => orderProvider.fetchOrders(),
                      color: const Color(0xFF1E3A8A),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: orderProvider.orders.length,
                        itemBuilder: (context, index) {
                          final order = orderProvider.orders[index];
                          return _buildOrderCard(context, order, printerProvider);
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(BuildContext context, String filterKey, String label) {
    final orderProvider = Provider.of<OrderProvider>(context);
    final isSelected = orderProvider.selectedStatusFilter == filterKey;

    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        selected: isSelected,
        label: Text(label),
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : const Color(0xFF475569),
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        selectedColor: const Color(0xFF1E3A8A),
        backgroundColor: const Color(0xFFF1F5F9),
        checkmarkColor: Colors.white,
        side: BorderSide(color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFFE2E8F0)),
        onSelected: (_) => orderProvider.setFilter(filterKey),
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, ShopOrder order, PrinterProvider printerProvider) {
    return Card(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E3A8A).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF1E3A8A).withValues(alpha: 0.2)),
                        ),
                        child: Text(
                          order.orderNumber,
                          style: const TextStyle(color: Color(0xFF1E3A8A), fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        order.customerName,
                        style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ],
                  ),
                  Text(
                    'Rs.${order.totalAmount.toStringAsFixed(2)}',
                    style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                '${order.items.length} item(s): ${order.items.map((i) => "${i.serviceName} (${i.copies}c)").join(", ")}',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: Text(
                      order.status,
                      style: const TextStyle(color: Color(0xFF334155), fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove_red_eye_outlined, color: Color(0xFF64748B), size: 20),
                        tooltip: 'Preview Receipt',
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (_) => ReceiptPreviewDialog(order: order),
                          );
                        },
                      ),
                      const SizedBox(width: 4),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E3A8A),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.print_rounded, size: 16, color: Colors.white),
                        label: const Text('ePOS Print', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: () async {
                          final res = await printerProvider.printOrder(order);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res.message),
                              backgroundColor: res.success ? Colors.green : Colors.red,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
