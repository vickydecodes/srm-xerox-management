import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/bill.dart';
import '../providers/auth_provider.dart';
import '../providers/printer_provider.dart';

class CreateBillScreen extends StatefulWidget {
  const CreateBillScreen({super.key});

  @override
  State<CreateBillScreen> createState() => _CreateBillScreenState();
}

class _CreateBillScreenState extends State<CreateBillScreen> {
  final _formKey = GlobalKey<FormState>();
  final _customerNameController = TextEditingController(text: 'Walk-in Customer');
  final _customerPhoneController = TextEditingController();
  final _discountController = TextEditingController(text: '0');
  final _taxController = TextEditingController(text: '0');
  final _searchController = TextEditingController();

  String _paymentMethod = 'cash';
  String _paymentStatus = 'paid';
  bool _isLoading = false;
  bool _isSearching = false;
  Timer? _debounceTimer;

  List<Map<String, dynamic>> _searchResults = [];
  bool _showSearchResults = false;

  final List<Map<String, dynamic>> _presetServices = [
    {'name': 'A4 B/W Xerox', 'price': 2.0, 'type': 'Service'},
    {'name': 'A4 Color Print', 'price': 10.0, 'type': 'Service'},
    {'name': 'A3 B/W Print', 'price': 5.0, 'type': 'Service'},
    {'name': 'A3 Color Print', 'price': 20.0, 'type': 'Service'},
    {'name': 'Spiral Binding', 'price': 35.0, 'type': 'Service'},
    {'name': 'Soft Binding', 'price': 50.0, 'type': 'Service'},
    {'name': 'Hardcover Project Binding', 'price': 150.0, 'type': 'Service'},
    {'name': 'Document Lamination', 'price': 25.0, 'type': 'Service'},
    {'name': 'ID Card Printing', 'price': 40.0, 'type': 'Product'},
    {'name': 'Glossy Photo Print (4x6)', 'price': 30.0, 'type': 'Service'},
  ];

  final List<Map<String, dynamic>> _items = [
    {
      'name': TextEditingController(text: 'A4 B/W Xerox'),
      'quantity': TextEditingController(text: '1'),
      'price': TextEditingController(text: '2.00'),
    }
  ];

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _discountController.dispose();
    _taxController.dispose();
    _searchController.dispose();
    _debounceTimer?.cancel();
    for (var item in _items) {
      item['name'].dispose();
      item['quantity'].dispose();
      item['price'].dispose();
    }
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _showSearchResults = false;
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    _debounceTimer = Timer(const Duration(milliseconds: 300), () async {
      final apiService = Provider.of<AuthProvider>(context, listen: false).apiService;
      final remoteResults = await apiService.searchItems(query.trim());

      final localResults = _presetServices.where((s) {
        return s['name'].toString().toLowerCase().contains(query.trim().toLowerCase());
      }).toList();

      final Map<String, Map<String, dynamic>> merged = {};
      for (var item in localResults) {
        merged[item['name'].toString().toLowerCase()] = item;
      }
      for (var item in remoteResults) {
        final name = (item['name'] ?? item['title'] ?? '').toString();
        if (name.isNotEmpty) {
          merged[name.toLowerCase()] = {
            'name': name,
            'price': double.tryParse((item['price'] ?? item['unitPrice'] ?? 0).toString()) ?? 0.0,
            'type': (item['type'] ?? 'Product').toString(),
          };
        }
      }

      if (mounted) {
        setState(() {
          _searchResults = merged.values.toList();
          _showSearchResults = true;
          _isSearching = false;
        });
      }
    });
  }

  void _addOrIncrementItem(String name, double price) {
    setState(() {
      final existingIndex = _items.indexWhere(
        (i) => i['name'].text.trim().toLowerCase() == name.toLowerCase(),
      );

      if (existingIndex > -1) {
        final currentQty = int.tryParse(_items[existingIndex]['quantity'].text.trim()) ?? 1;
        _items[existingIndex]['quantity'].text = (currentQty + 1).toString();
      } else {
        _items.add({
          'name': TextEditingController(text: name),
          'quantity': TextEditingController(text: '1'),
          'price': TextEditingController(text: price.toStringAsFixed(2)),
        });
      }

      _searchController.clear();
      _showSearchResults = false;
      _searchResults = [];
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

  double get _subtotal {
    double sum = 0.0;
    for (var item in _items) {
      final qty = int.tryParse(item['quantity'].text.trim()) ?? 0;
      final price = double.tryParse(item['price'].text.trim()) ?? 0.0;
      sum += (qty * price);
    }
    return sum;
  }

  double get _discount => double.tryParse(_discountController.text.trim()) ?? 0.0;
  double get _tax => double.tryParse(_taxController.text.trim()) ?? 0.0;

  double get _grandTotal {
    final net = _subtotal - _discount + _tax;
    return net < 0 ? 0.0 : net;
  }

  Future<void> _submitBill({bool printAfter = false}) async {
    if (!_formKey.currentState!.validate()) return;
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one item to the bill')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final apiService = Provider.of<AuthProvider>(context, listen: false).apiService;

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
      'paymentMethod': _paymentMethod.toUpperCase(),
      'status': _paymentStatus.toUpperCase(),
      'items': itemList,
      'discount': _discount,
      'tax': _tax,
      'subtotal': _subtotal,
      'total': _grandTotal,
    };

    final result = await apiService.createBill(payload);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success']) {
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

      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bill generated successfully!'),
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
    final isDesktop = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A),
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'POS Billing Desk — Create Bill',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              'SRM Xerox Center Digital Invoicing',
              style: TextStyle(color: Color(0xFF93C5FD), fontSize: 12),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            tooltip: 'Clear Form',
            onPressed: () {
              setState(() {
                _customerNameController.text = 'Walk-in Customer';
                _customerPhoneController.clear();
                _discountController.text = '0';
                _taxController.text = '0';
                _searchController.clear();
                _searchResults.clear();
                _showSearchResults = false;
                _items.clear();
                _items.add({
                  'name': TextEditingController(text: 'A4 B/W Xerox'),
                  'quantity': TextEditingController(text: '1'),
                  'price': TextEditingController(text: '2.00'),
                });
              });
            },
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: isDesktop ? _buildDesktopLayout() : _buildMobileLayout(),
        ),
      ),
    );
  }

  Widget _buildDesktopLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Left Column: Items & Payment (Flex 2)
        Expanded(
          flex: 2,
          child: Column(
            children: [
              _buildCustomerInfoCard(),
              const SizedBox(height: 20),
              _buildBillingItemsCard(),
              const SizedBox(height: 20),
              _buildPaymentMethodCard(),
            ],
          ),
        ),
        const SizedBox(width: 24),
        // Right Column: Summary & Actions (Flex 1)
        Expanded(
          flex: 1,
          child: _buildInvoiceSummaryCard(),
        ),
      ],
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      children: [
        _buildCustomerInfoCard(),
        const SizedBox(height: 16),
        _buildBillingItemsCard(),
        const SizedBox(height: 16),
        _buildPaymentMethodCard(),
        const SizedBox(height: 16),
        _buildInvoiceSummaryCard(),
      ],
    );
  }

  // Card 1: Customer Information
  Widget _buildCustomerInfoCard() {
    return Card(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.person_outline_rounded, color: Color(0xFF1E3A8A), size: 20),
                SizedBox(width: 8),
                Text(
                  'Customer Details',
                  style: TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _customerNameController,
                    style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                    decoration: InputDecoration(
                      labelText: 'Customer Name',
                      labelStyle: const TextStyle(color: Color(0xFF64748B)),
                      prefixIcon: const Icon(Icons.person, color: Color(0xFF1E3A8A)),
                      filled: true,
                      fillColor: const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _customerPhoneController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                    decoration: InputDecoration(
                      labelText: 'Phone Number (Optional)',
                      labelStyle: const TextStyle(color: Color(0xFF64748B)),
                      prefixIcon: const Icon(Icons.phone, color: Color(0xFF1E3A8A)),
                      filled: true,
                      fillColor: const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Card 2: Billing Items with SEARCHABLE COMBOBOX
  Widget _buildBillingItemsCard() {
    return Card(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.shopping_bag_outlined, color: Color(0xFF1E3A8A), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Billing Items',
                      style: TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E3A8A),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.add, size: 16, color: Colors.white),
                  label: const Text('Add Custom Row', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  onPressed: () => _addOrIncrementItem('Custom Service Item', 5.00),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // SEARCH & ADD PRODUCTS / SERVICES COMBOBOX (Matches Web App)
            const Text(
              'SEARCH AND ADD PRODUCTS / SERVICES',
              style: TextStyle(color: Color(0xFF1E3A8A), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8),
            ),
            const SizedBox(height: 6),
            Column(
              children: [
                TextFormField(
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                  style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search product or service by name (e.g. A4, Xerox, Binding)...',
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF1E3A8A)),
                    suffixIcon: _isSearching
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: Padding(
                              padding: EdgeInsets.all(10.0),
                              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF1E3A8A)),
                            ),
                          )
                        : (_searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, color: Colors.grey, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  _onSearchChanged('');
                                },
                              )
                            : null),
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF1E3A8A), width: 2),
                    ),
                  ),
                ),

                // Search Results Dropdown Overlay Card
                if (_showSearchResults && _searchResults.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    constraints: const BoxConstraints(maxHeight: 220),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1E3A8A), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: _searchResults.length,
                      separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFE2E8F0)),
                      itemBuilder: (context, idx) {
                        final res = _searchResults[idx];
                        final name = res['name'] as String;
                        final price = (res['price'] as num).toDouble();
                        final type = res['type'] as String? ?? 'Service';

                        return ListTile(
                          dense: true,
                          leading: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Icon(
                              type == 'Product' ? Icons.inventory_2_outlined : Icons.print_outlined,
                              size: 18,
                              color: const Color(0xFF1E3A8A),
                            ),
                          ),
                          title: Text(name, style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 13)),
                          subtitle: Text(type.toUpperCase(), style: const TextStyle(color: Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.w600)),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Rs.${price.toStringAsFixed(2)}',
                                style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.add_circle, color: Color(0xFF1E3A8A), size: 20),
                            ],
                          ),
                          onTap: () => _addOrIncrementItem(name, price),
                        );
                      },
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 16),
            const Text(
              'QUICK PRESETS',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildPresetChip('A4 B/W Copy (Rs.2)', 'A4 B/W Xerox', 2.0),
                _buildPresetChip('A4 Color Print (Rs.10)', 'A4 Color Print', 10.0),
                _buildPresetChip('A3 B/W Print (Rs.5)', 'A3 B/W Print', 5.0),
                _buildPresetChip('Spiral Binding (Rs.35)', 'Spiral Binding', 35.0),
                _buildPresetChip('Soft Binding (Rs.50)', 'Soft Binding', 50.0),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(color: Color(0xFFE2E8F0)),
            const SizedBox(height: 10),

            // Item Headers
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4.0),
              child: Row(
                children: [
                  Expanded(flex: 4, child: Text('Item Description', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold))),
                  Expanded(flex: 2, child: Text('Quantity', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                  Expanded(flex: 2, child: Text('Unit Price (Rs)', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold))),
                  Expanded(flex: 2, child: Text('Item Total', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold), textAlign: TextAlign.right)),
                  SizedBox(width: 40),
                ],
              ),
            ),
            const SizedBox(height: 8),

            ..._items.asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value;
              final qty = int.tryParse(item['quantity'].text.trim()) ?? 0;
              final price = double.tryParse(item['price'].text.trim()) ?? 0.0;
              final itemTotal = qty * price;

              return Padding(
                padding: const EdgeInsets.only(bottom: 10.0),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      // Item Name
                      Expanded(
                        flex: 4,
                        child: TextFormField(
                          controller: item['name'],
                          onChanged: (_) => setState(() {}),
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.w600),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            fillColor: Colors.white,
                            filled: true,
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Quantity with +/- buttons
                      Expanded(
                        flex: 2,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            InkWell(
                              onTap: () {
                                if (qty > 1) {
                                  item['quantity'].text = (qty - 1).toString();
                                  setState(() {});
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: const Icon(Icons.remove, size: 14, color: Color(0xFF0F172A)),
                              ),
                            ),
                            Container(
                              width: 36,
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              child: TextFormField(
                                controller: item['quantity'],
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                onChanged: (_) => setState(() {}),
                                style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.bold),
                                decoration: const InputDecoration(
                                  isDense: true,
                                  contentPadding: EdgeInsets.symmetric(vertical: 6),
                                  fillColor: Colors.white,
                                  filled: true,
                                  border: OutlineInputBorder(),
                                ),
                              ),
                            ),
                            InkWell(
                              onTap: () {
                                item['quantity'].text = (qty + 1).toString();
                                setState(() {});
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: const Icon(Icons.add, size: 14, color: Color(0xFF0F172A)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Unit Price
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: item['price'],
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          onChanged: (_) => setState(() {}),
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                          decoration: const InputDecoration(
                            isDense: true,
                            prefixText: 'Rs.',
                            contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            fillColor: Colors.white,
                            filled: true,
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Item Total
                      Expanded(
                        flex: 2,
                        child: Text(
                          'Rs.${itemTotal.toStringAsFixed(2)}',
                          textAlign: TextAlign.right,
                          style: const TextStyle(color: Color(0xFF1E3A8A), fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                        tooltip: 'Remove Item',
                        onPressed: () => _removeItem(idx),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildPresetChip(String label, String name, double price) {
    return InkWell(
      onTap: () => _addOrIncrementItem(name, price),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.add_circle_outline, size: 14, color: Color(0xFF1E3A8A)),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(color: Color(0xFF1E3A8A), fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  // Card 3: Payment Method
  Widget _buildPaymentMethodCard() {
    return Card(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.account_balance_wallet_outlined, color: Color(0xFF1E3A8A), size: 20),
                SizedBox(width: 8),
                Text(
                  'Payment Method',
                  style: TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildPaymentTile('cash', 'Cash Payment', Icons.payments_outlined, Colors.green)),
                const SizedBox(width: 12),
                Expanded(child: _buildPaymentTile('upi', 'UPI / GPay / PhonePe', Icons.qr_code_scanner_rounded, Colors.purple)),
                const SizedBox(width: 12),
                Expanded(child: _buildPaymentTile('card', 'Debit / Credit Card', Icons.credit_card_rounded, Colors.blue)),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Payment Status', style: TextStyle(color: Color(0xFF0F172A), fontSize: 14, fontWeight: FontWeight.bold)),
                subtitle: Text(
                  _paymentStatus == 'paid' ? 'Marked as FULLY PAID' : 'Marked as UNPAID / PENDING',
                  style: TextStyle(
                    color: _paymentStatus == 'paid' ? const Color(0xFF16A34A) : Colors.amber.shade800,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                value: _paymentStatus == 'paid',
                activeThumbColor: const Color(0xFF16A34A),
                onChanged: (val) {
                  setState(() => _paymentStatus = val ? 'paid' : 'unpaid');
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentTile(String value, String label, IconData icon, Color iconColor) {
    final isSelected = _paymentMethod == value;
    return InkWell(
      onTap: () => setState(() => _paymentMethod = value),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 28, color: isSelected ? const Color(0xFF1E3A8A) : iconColor),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isSelected ? const Color(0xFF1E3A8A) : const Color(0xFF475569),
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Card 4: Invoice Summary (Sidebar)
  Widget _buildInvoiceSummaryCard() {
    return Card(
      color: Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF1E3A8A), width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.receipt_rounded, color: Color(0xFF1E3A8A), size: 22),
                SizedBox(width: 8),
                Text(
                  'Invoice Summary',
                  style: TextStyle(color: Color(0xFF1E3A8A), fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Subtotal
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Subtotal:', style: TextStyle(color: Color(0xFF64748B), fontSize: 14, fontWeight: FontWeight.w500)),
                Text('Rs.${_subtotal.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF0F172A), fontSize: 15, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 14),

            // Discount Input
            TextFormField(
              controller: _discountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              onChanged: (_) => setState(() {}),
              style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
              decoration: const InputDecoration(
                labelText: 'Discount Amount (Rs)',
                labelStyle: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                prefixText: '- Rs.',
                filled: true,
                fillColor: Color(0xFFF8FAFC),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),

            // Tax Input
            TextFormField(
              controller: _taxController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              onChanged: (_) => setState(() {}),
              style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
              decoration: const InputDecoration(
                labelText: 'Tax Amount (Rs)',
                labelStyle: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                prefixText: '+ Rs.',
                filled: true,
                fillColor: Color(0xFFF8FAFC),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            const Divider(color: Color(0xFFCBD5E1), thickness: 1),
            const SizedBox(height: 10),

            // Grand Total
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                const Text('Grand Total:', style: TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.bold)),
                Text(
                  'Rs.${_grandTotal.toStringAsFixed(2)}',
                  style: const TextStyle(color: Color(0xFF1E3A8A), fontSize: 26, fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Action Buttons
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF1E3A8A),
                  side: const BorderSide(color: Color(0xFF1E3A8A), width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.save_outlined, size: 18),
                label: const Text('Save Invoice Only', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                onPressed: _isLoading ? null : () => _submitBill(printAfter: false),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E3A8A),
                  elevation: 3,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.print_rounded, size: 20, color: Colors.white),
                label: const Text('GENERATE & ePOS PRINT', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                onPressed: _isLoading ? null : () => _submitBill(printAfter: true),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
