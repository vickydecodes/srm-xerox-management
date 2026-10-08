import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/bill.dart';
import '../providers/printer_provider.dart';
import '../services/api_service.dart';
import '../widgets/receipt_preview_dialog.dart';
import 'create_bill_screen.dart';

class BillsScreen extends StatefulWidget {
  final ApiService apiService;

  const BillsScreen({super.key, required this.apiService});

  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  List<ShopBill> _bills = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBills();
  }

  Future<void> _loadBills() async {
    setState(() => _isLoading = true);
    final fetched = await widget.apiService.fetchBills();
    setState(() {
      _bills = fetched;
      _isLoading = false;
    });
  }

  void _openCreateBillScreen() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const CreateBillScreen()),
    );
    if (created == true) {
      _loadBills();
    }
  }

  @override
  Widget build(BuildContext context) {
    final printerProvider = Provider.of<PrinterProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreateBillScreen,
        backgroundColor: const Color(0xFF1E3A8A),
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'Create POS Bill',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          // Action Bar Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Bills & Thermal Receipts History',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E3A8A),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.add_rounded, size: 18, color: Colors.white),
                  label: const Text(
                    '+ Create Bill',
                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  onPressed: _openCreateBillScreen,
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF1E3A8A)))
                : _bills.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long_rounded, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            const Text('No bills found in history', style: TextStyle(color: Color(0xFF64748B), fontSize: 16)),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1E3A8A),
                              ),
                              icon: const Icon(Icons.add, color: Colors.white),
                              label: const Text('Create First Bill', style: TextStyle(color: Colors.white)),
                              onPressed: _openCreateBillScreen,
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadBills,
                        color: const Color(0xFF1E3A8A),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _bills.length,
                          itemBuilder: (context, index) {
                            final bill = _bills[index];
                            return Card(
                              color: Colors.white,
                              margin: const EdgeInsets.only(bottom: 12),
                              elevation: 1,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
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
                                                border: Border.all(color: const Color(0xFF1E3A8A).withValues(alpha: 0.3)),
                                              ),
                                              child: Text(
                                                bill.billNumber,
                                                style: const TextStyle(color: Color(0xFF1E3A8A), fontWeight: FontWeight.bold, fontSize: 13),
                                              ),
                                            ),
                                            const SizedBox(width: 10),
                                            Text(
                                              DateFormat('dd MMM yyyy, hh:mm a').format(bill.createdAt),
                                              style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                                            ),
                                          ],
                                        ),
                                        Text(
                                          'Rs.${bill.total.toStringAsFixed(2)}',
                                          style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 16),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      'Payment: ${bill.paymentMethod} | Status: ${bill.status}',
                                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        OutlinedButton.icon(
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: const Color(0xFF0F172A),
                                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                                          ),
                                          icon: const Icon(Icons.remove_red_eye_outlined, size: 16),
                                          label: const Text('Preview Thermal', style: TextStyle(fontSize: 12)),
                                          onPressed: () {
                                            showDialog(
                                              context: context,
                                              builder: (_) => ReceiptPreviewDialog(order: bill.toShopOrder()),
                                            );
                                          },
                                        ),
                                        const SizedBox(width: 10),
                                        ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF1E3A8A),
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          ),
                                          icon: const Icon(Icons.print_rounded, size: 16, color: Colors.white),
                                          label: const Text('ePOS Print Bill', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                          onPressed: () async {
                                            final res = await printerProvider.printOrder(bill.toShopOrder());
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
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
