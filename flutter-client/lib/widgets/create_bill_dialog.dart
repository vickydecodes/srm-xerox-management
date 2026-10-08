import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/bill.dart';
import '../providers/printer_provider.dart';
import '../services/api_service.dart';

class CreateBillDialog extends StatefulWidget {
  final ApiService apiService;
  final VoidCallback onBillCreated;

  const CreateBillDialog({
    super.key,
    required this.apiService,
    required this.onBillCreated,
  });

  @override
  State<CreateBillDialog> createState() => _CreateBillDialogState();
}

class _CreateBillDialogState extends State<CreateBillDialog> {
  final _formKey = GlobalKey<FormState>();
  final _customerNameController = TextEditingController(text: 'Walk-in Customer');
  final _customerPhoneController = TextEditingController();

  String _paymentMethod = 'CASH';
  bool _isLoading = false;

  final List<Map<String, dynamic>> _items = [
    {
      'name': TextEditingController(text: 'A4 B/W Copy'),
      'quantity': TextEditingController(text: '1'),
      'price': TextEditingController(text: '2.00'),
    }
  ];

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    for (var item in _items) {
      item['name'].dispose();
      item['quantity'].dispose();
      item['price'].dispose();
    }
    super.dispose();
  }

  void _addItem() {
    setState(() {
      _items.add({
        'name': TextEditingController(text: 'A4 Color Print'),
        'quantity': TextEditingController(text: '1'),
        'price': TextEditingController(text: '10.00'),
      });
    });
  }

  void _removeItem(int index) {
    if (_items.length > 1) {
      setState(() {
        final item = _items.removeAt(index);
        item['name'].dispose();
        item['quantity'].dispose();
        item['price'].dispose();
      });
    }
  }

  double get _totalAmount {
    double total = 0.0;
    for (var item in _items) {
      final qty = int.tryParse(item['quantity'].text.trim()) ?? 0;
      final price = double.tryParse(item['price'].text.trim()) ?? 0.0;
      total += (qty * price);
    }
    return total;
  }

  Future<void> _submitBill({bool printAfter = false}) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final itemList = _items.map((item) {
      final name = item['name'].text.trim();
      final qty = int.tryParse(item['quantity'].text.trim()) ?? 1;
      final price = double.tryParse(item['price'].text.trim()) ?? 0.0;
      return {
        'name': name,
        'quantity': qty,
        'price': price,
        'total': qty * price,
      };
    }).toList();

    final payload = {
      'customerName': _customerNameController.text.trim(),
      'customerPhone': _customerPhoneController.text.trim(),
      'paymentMethod': _paymentMethod,
      'items': itemList,
      'discount': 0,
      'tax': 0,
      'total': _totalAmount,
    };

    final result = await widget.apiService.createBill(payload);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success']) {
      widget.onBillCreated();
      final createdBill = result['bill'] as ShopBill?;

      if (printAfter && createdBill != null) {
        final printerProvider = Provider.of<PrinterProvider>(context, listen: false);
        final printRes = await printerProvider.printOrder(createdBill.toShopOrder());
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(printRes.message),
              backgroundColor: printRes.success ? Colors.green : Colors.red,
            ),
          );
        }
      }

      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bill created successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Failed to create bill'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      title: const Row(
        children: [
          Icon(Icons.point_of_sale_rounded, color: Color(0xFF1E3A8A)),
          SizedBox(width: 10),
          Text(
            'Create New POS Bill',
            style: TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 440,
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _customerNameController,
                        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                        decoration: InputDecoration(
                          labelText: 'Customer Name',
                          labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                          filled: true,
                          fillColor: const Color(0xFFF1F5F9),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _customerPhoneController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                        decoration: InputDecoration(
                          labelText: 'Phone (Optional)',
                          labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                          filled: true,
                          fillColor: const Color(0xFFF1F5F9),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _paymentMethod,
                  dropdownColor: Colors.white,
                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Payment Method',
                    labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'CASH', child: Text('Cash Payment')),
                    DropdownMenuItem(value: 'UPI', child: Text('UPI / QR Scanner')),
                    DropdownMenuItem(value: 'CARD', child: Text('Debit / Credit Card')),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _paymentMethod = val);
                  },
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'BILL ITEMS',
                      style: TextStyle(
                        color: Color(0xFF1E3A8A),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _addItem,
                      icon: const Icon(Icons.add, size: 16, color: Color(0xFF1E3A8A)),
                      label: const Text('Add Item', style: TextStyle(color: Color(0xFF1E3A8A), fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ..._items.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final item = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 4,
                          child: TextFormField(
                            controller: item['name'],
                            onChanged: (_) => setState(() {}),
                            style: const TextStyle(color: Color(0xFF0F172A), fontSize: 12),
                            decoration: InputDecoration(
                              hintText: 'Item / Service',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: item['quantity'],
                            keyboardType: TextInputType.number,
                            onChanged: (_) => setState(() {}),
                            style: const TextStyle(color: Color(0xFF0F172A), fontSize: 12),
                            decoration: InputDecoration(
                              hintText: 'Qty',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: item['price'],
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            onChanged: (_) => setState(() {}),
                            style: const TextStyle(color: Color(0xFF0F172A), fontSize: 12),
                            decoration: InputDecoration(
                              hintText: 'Price',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                          onPressed: () => _removeItem(idx),
                        ),
                      ],
                    ),
                  );
                }),
                const Divider(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Amount:', style: TextStyle(color: Color(0xFF0F172A), fontSize: 15, fontWeight: FontWeight.bold)),
                    Text(
                      'Rs.${_totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(color: Color(0xFF059669), fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
        ),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF1E3A8A),
            side: const BorderSide(color: Color(0xFF1E3A8A)),
          ),
          icon: const Icon(Icons.save_rounded, size: 16),
          label: const Text('Save Only'),
          onPressed: _isLoading ? null : () => _submitBill(printAfter: false),
        ),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1E3A8A),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          ),
          icon: const Icon(Icons.print_rounded, size: 16, color: Colors.white),
          label: const Text('Save & ePOS Print', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          onPressed: _isLoading ? null : () => _submitBill(printAfter: true),
        ),
      ],
    );
  }
}
