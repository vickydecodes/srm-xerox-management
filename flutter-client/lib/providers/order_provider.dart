import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class OrderProvider with ChangeNotifier {
  final ApiService apiService;

  List<ShopOrder> _orders = [];
  bool _isLoading = false;
  String _selectedStatusFilter = 'ALL';
  String? _errorMessage;
  Timer? _pollingTimer;

  List<ShopOrder> get orders => _orders;
  bool get isLoading => _isLoading;
  String get selectedStatusFilter => _selectedStatusFilter;
  String? get errorMessage => _errorMessage;

  OrderProvider({required this.apiService}) {
    fetchOrders();
    _startPolling();
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      fetchOrders(silent: true);
    });
  }

  void setFilter(String status) {
    _selectedStatusFilter = status;
    fetchOrders();
  }

  Future<void> fetchOrders({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final fetched = await apiService.fetchOrders(
        status: _selectedStatusFilter == 'ALL' ? null : _selectedStatusFilter,
      );
      _orders = fetched;
      _errorMessage = null;
    } catch (e) {
      if (!silent) {
        _errorMessage = 'Failed to load orders: $e';
      }
    } finally {
      if (!silent) {
        _isLoading = false;
      }
      notifyListeners();
    }
  }

  Future<bool> updateStatus(String orderId, String newStatus) async {
    final success = await apiService.updateOrderStatus(orderId, newStatus);
    if (success) {
      await fetchOrders(silent: true);
    }
    return success;
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}
