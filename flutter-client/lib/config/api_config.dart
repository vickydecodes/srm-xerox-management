class ApiConfig {
  static String baseUrl = 'http://localhost:5000/api/v1'; // Default localhost backend URL
  static String webBaseUrl = 'http://localhost:5175'; // Web verification frontend host

  static String get webVerificationUrl {
    try {
      final uri = Uri.parse(baseUrl);
      final host = (uri.host.isNotEmpty && uri.host != '0.0.0.0') ? uri.host : 'localhost';
      return 'http://$host:5175';
    } catch (_) {
      return webBaseUrl;
    }
  }
  
  static const String loginEndpoint = '/auths/login';
  static const String ordersEndpoint = '/orders';
  static const String billsEndpoint = '/bills';
  static const String dashboardEndpoint = '/dashboards/shop-admin';

  static Map<String, String> getHeaders([String? token]) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
}
