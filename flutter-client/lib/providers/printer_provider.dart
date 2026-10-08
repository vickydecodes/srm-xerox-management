import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/order.dart';
import '../models/printer_profile.dart';
import '../services/epos_printer_service.dart';

class PrinterProvider with ChangeNotifier {
  PrinterProfile _profile = PrinterProfile();
  bool _isPrinting = false;
  bool _isTesting = false;
  String? _lastStatusMessage;
  bool _lastStatusSuccess = true;

  PrinterProfile get profile => _profile;
  bool get isPrinting => _isPrinting;
  bool get isTesting => _isTesting;
  String? get lastStatusMessage => _lastStatusMessage;
  bool get lastStatusSuccess => _lastStatusSuccess;

  PrinterProvider() {
    _loadPrinterProfile();
  }

  Future<void> _loadPrinterProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString('epos_printer_profile');
    if (jsonString != null) {
      try {
        _profile = PrinterProfile.fromJson(jsonDecode(jsonString));
      } catch (e) {
        _profile = PrinterProfile();
      }
    }
    notifyListeners();
  }

  Future<void> updateProfile(PrinterProfile newProfile) async {
    _profile = newProfile;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('epos_printer_profile', jsonEncode(newProfile.toJson()));
  }

  Future<EposPrinterResult> testConnection() async {
    _isTesting = true;
    _lastStatusMessage = 'Testing connection to ${_profile.ipAddress}:${_profile.port}...';
    notifyListeners();

    final result = await EposPrinterService.testConnection(_profile);

    _isTesting = false;
    _lastStatusSuccess = result.success;
    _lastStatusMessage = result.message;
    notifyListeners();

    return result;
  }

  Future<EposPrinterResult> printOrder(ShopOrder order) async {
    _isPrinting = true;
    _lastStatusMessage = 'Sending ESC/POS print job to ${_profile.ipAddress}...';
    notifyListeners();

    final result = await EposPrinterService.printOrderReceipt(
      order: order,
      profile: _profile,
    );

    _isPrinting = false;
    _lastStatusSuccess = result.success;
    _lastStatusMessage = result.message;
    notifyListeners();

    return result;
  }

  Future<EposPrinterResult> printTestPage() async {
    _isPrinting = true;
    _lastStatusMessage = 'Sending test receipt to ${_profile.ipAddress}...';
    notifyListeners();

    final result = await EposPrinterService.printTestReceipt(_profile);

    _isPrinting = false;
    _lastStatusSuccess = result.success;
    _lastStatusMessage = result.message;
    notifyListeners();

    return result;
  }
}
