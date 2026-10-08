import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/order.dart';
import '../models/user.dart';
import '../models/bill.dart';

class ApiService {
  final String baseUrl;
  String? authToken;

  ApiService({this.baseUrl = 'http://localhost:5000/api/v1', this.authToken});

  /// Login shop admin
  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$baseUrl${ApiConfig.loginEndpoint}');
    try {
      final response = await http.post(
        url,
        headers: ApiConfig.getHeaders(),
        body: jsonEncode({
          'login_id': email,
          'password': password,
        }),
      );

      final decoded = jsonDecode(response.body);
      final body = decoded is Map ? Map<String, dynamic>.from(decoded) : <String, dynamic>{};

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = body['data'] is Map ? Map<String, dynamic>.from(body['data']) : <String, dynamic>{};
        final Map<String, dynamic> userMap = data['user'] is Map
            ? Map<String, dynamic>.from(data['user'])
            : (body['user'] is Map ? Map<String, dynamic>.from(body['user']) : data);

        final token = (data['accessToken'] ?? data['token'] ?? body['token'] ?? body['accessToken'] ?? 'session_active').toString();

        authToken = token;
        return {
          'success': true,
          'token': token,
          'user': User.fromJson(userMap),
        };
      } else {
        return {
          'success': false,
          'message':
              body['message'] ?? 'Login failed. Please check credentials.',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Unable to connect to server: $e',
      };
    }
  }

  /// Fetch order queue
  Future<List<ShopOrder>> fetchOrders({String? status}) async {
    String endpoint = '$baseUrl${ApiConfig.ordersEndpoint}';
    if (status != null && status.isNotEmpty && status != 'ALL') {
      endpoint += '?status=$status';
    }
    final url = Uri.parse(endpoint);

    try {
      final response = await http.get(
        url,
        headers: ApiConfig.getHeaders(authToken),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final bodyMap = decoded is Map ? Map<String, dynamic>.from(decoded) : <String, dynamic>{};
        final List rawList = bodyMap['data'] as List? ?? bodyMap['orders'] as List? ?? (decoded is List ? decoded : []);
        return rawList.map((item) => ShopOrder.fromJson(item is Map ? item : {})).toList();
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  /// Update order status
  Future<bool> updateOrderStatus(String orderId, String newStatus) async {
    String statusPath = 'in-progress';
    if (newStatus == 'READY_FOR_PICKUP') statusPath = 'ready-for-pickup';
    if (newStatus == 'DELIVERED') statusPath = 'delivered';
    if (newStatus == 'SUBMITTED') statusPath = 'submit';

    final url =
        Uri.parse('$baseUrl${ApiConfig.ordersEndpoint}/$orderId/$statusPath');

    try {
      final response = await http.patch(
        url,
        headers: ApiConfig.getHeaders(authToken),
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      return false;
    }
  }

  /// Fetch bills history
  Future<List<ShopBill>> fetchBills() async {
    final url = Uri.parse('$baseUrl${ApiConfig.billsEndpoint}');
    try {
      final response = await http.get(
        url,
        headers: ApiConfig.getHeaders(authToken),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final bodyMap = decoded is Map ? Map<String, dynamic>.from(decoded) : <String, dynamic>{};
        final List rawList = bodyMap['data'] as List? ?? bodyMap['bills'] as List? ?? (decoded is List ? decoded : []);
        return rawList.map((item) => ShopBill.fromJson(item is Map ? item : {})).toList();
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  /// Fetch daily statistics for admin dashboard
  Future<Map<String, dynamic>> fetchDashboardStats() async {
    final url = Uri.parse('$baseUrl${ApiConfig.dashboardEndpoint}');
    try {
      final response = await http.get(
        url,
        headers: ApiConfig.getHeaders(authToken),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'] ?? body;
      }
    } catch (_) {}

    return {
      'totalOrdersToday': 0,
      'totalRevenueToday': 0.0,
      'pendingJobs': 0,
      'completedJobs': 0,
    };
  }

  /// Create new POS bill
  Future<Map<String, dynamic>> createBill(Map<String, dynamic> billData) async {
    final url = Uri.parse('$baseUrl${ApiConfig.billsEndpoint}');
    try {
      final response = await http.post(
        url,
        headers: ApiConfig.getHeaders(authToken),
        body: jsonEncode(billData),
      );

      final decoded = jsonDecode(response.body);
      final body = decoded is Map ? Map<String, dynamic>.from(decoded) : <String, dynamic>{};

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': body['message'] ?? 'Bill created successfully',
          'bill': body['data'] != null ? ShopBill.fromJson(body['data']) : null,
        };
      } else {
        return {
          'success': false,
          'message': body['message'] ?? 'Failed to create bill',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error creating bill: $e',
      };
    }
  }

  /// Search products and services for billing combobox
  Future<List<Map<String, dynamic>>> searchItems(String query) async {
    if (query.trim().isEmpty) return [];
    final url = Uri.parse('$baseUrl/search?q=${Uri.encodeComponent(query)}');
    try {
      final response = await http.get(
        url,
        headers: ApiConfig.getHeaders(authToken),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final bodyMap = decoded is Map ? Map<String, dynamic>.from(decoded) : <String, dynamic>{};
        final List rawList = bodyMap['data'] as List? ?? (decoded is List ? decoded : []);
        return rawList.map((i) => i is Map ? Map<String, dynamic>.from(i) : <String, dynamic>{}).toList();
      }
    } catch (_) {}
    return [];
  }
}
