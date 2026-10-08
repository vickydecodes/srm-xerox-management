import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import '../config/api_config.dart';
import '../models/order.dart';
import '../models/printer_profile.dart';

class EposPrinterResult {
  final bool success;
  final String message;

  EposPrinterResult({required this.success, required this.message});
}

class EposPrinterService {
  /// Test network printer connectivity
  static Future<EposPrinterResult> testConnection(PrinterProfile profile) async {
    try {
      if (profile.connectionMode == EposConnectionMode.rawTcp) {
        final socket = await Socket.connect(profile.ipAddress, profile.port,
            timeout: const Duration(seconds: 4));
        socket.destroy();
        return EposPrinterResult(
          success: true,
          message: 'Connected successfully to ${profile.ipAddress}:${profile.port}',
        );
      } else {
        final url = Uri.parse('http://${profile.ipAddress}:${profile.port}/cgi-bin/epos/service.cgi');
        final response = await http.get(url).timeout(const Duration(seconds: 4));
        if (response.statusCode >= 200 && response.statusCode < 500) {
          return EposPrinterResult(
            success: true,
            message: 'Epson ePOS Web Service responded on ${profile.ipAddress}:${profile.port}',
          );
        } else {
          return EposPrinterResult(
            success: false,
            message: 'HTTP Status ${response.statusCode} from printer',
          );
        }
      }
    } catch (e) {
      return EposPrinterResult(
        success: false,
        message: 'Printer unreachable at ${profile.ipAddress}:${profile.port} ($e)',
      );
    }
  }

  /// Send order receipt to ePOS thermal printer
  static Future<EposPrinterResult> printOrderReceipt({
    required ShopOrder order,
    required PrinterProfile profile,
  }) async {
    if (profile.connectionMode == EposConnectionMode.rawTcp) {
      return _printViaRawTcp(order, profile);
    } else {
      return _printViaEpsonXml(order, profile);
    }
  }

  /// Print test receipt
  static Future<EposPrinterResult> printTestReceipt(PrinterProfile profile) async {
    final testOrder = ShopOrder(
      id: 'TEST-001',
      orderNumber: 'TEST-9999',
      customerName: 'Demo Customer',
      customerPhone: '9876543210',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      totalAmount: 150.0,
      taxAmount: 0.0,
      createdAt: DateTime.now(),
      items: [
        OrderItem(
          id: '1',
          serviceName: 'A4 B/W Document Print',
          copies: 2,
          pages: 25,
          paperSize: 'A4',
          isColour: false,
          isDoubleSided: true,
          unitPrice: 2.0,
          totalPrice: 100.0,
        ),
        OrderItem(
          id: '2',
          serviceName: 'Soft Binding',
          copies: 1,
          pages: 1,
          paperSize: 'A4',
          isColour: false,
          isDoubleSided: false,
          unitPrice: 50.0,
          totalPrice: 50.0,
        ),
      ],
      notes: 'Test print from SRM Xerox Admin App',
    );

    return printOrderReceipt(order: testOrder, profile: profile);
  }

  // ==========================================
  // ESC/POS DIRECT TCP SOCKET ENGINE (PORT 9100)
  // ==========================================
  static Future<EposPrinterResult> _printViaRawTcp(
    ShopOrder order,
    PrinterProfile profile,
  ) async {
    Socket? socket;
    try {
      socket = await Socket.connect(profile.ipAddress, profile.port,
          timeout: const Duration(seconds: 5));

      final bytes = _generateEscPosBytes(order, profile);
      socket.add(bytes);
      await socket.flush();
      await Future.delayed(const Duration(milliseconds: 500));
      await socket.close();

      return EposPrinterResult(
        success: true,
        message: 'Receipt printed successfully on ${profile.ipAddress}',
      );
    } catch (e) {
      return EposPrinterResult(
        success: false,
        message: 'ePOS Print Failed: $e',
      );
    } finally {
      socket?.destroy();
    }
  }

  // ==========================================
  // EPSON ePOS-PRINT XML OVER HTTP ENGINE
  // ==========================================
  static Future<EposPrinterResult> _printViaEpsonXml(
    ShopOrder order,
    PrinterProfile profile,
  ) async {
    try {
      final xmlContent = _generateEpsonXmlPayload(order, profile);
      final url = Uri.parse(
          'http://${profile.ipAddress}:${profile.port}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000');

      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              'SOAPAction': '""',
            },
            body: xmlContent,
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200 && response.body.contains('success="true"')) {
        return EposPrinterResult(
          success: true,
          message: 'Epson ePOS XML print submitted successfully',
        );
      } else {
        return EposPrinterResult(
          success: false,
          message: 'Printer XML error: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      return EposPrinterResult(
        success: false,
        message: 'Epson ePOS XML HTTP Exception: $e',
      );
    }
  }

  // ==========================================
  // ESC/POS COMMAND GENERATOR (BINARY BUFFER)
  // ==========================================
  static List<int> _generateEscPosBytes(ShopOrder order, PrinterProfile profile) {
    final List<int> bytes = [];

    final int maxChars = profile.paperSize == PaperSize.mm80 ? 48 : 32;

    // ESC @ - Initialize printer
    bytes.addAll([0x1B, 0x40]);

    // Cash drawer open pulse if configured (ESC p 0 25 250)
    if (profile.openCashDrawer) {
      bytes.addAll([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    }

    // Alignment: Center (ESC a 1)
    bytes.addAll([0x1B, 0x61, 0x01]);

    // Header Double Height & Double Width (GS ! 0x33)
    bytes.addAll([0x1D, 0x21, 0x11]);
    bytes.addAll(utf8.encode('${profile.headerTitle}\n'));

    // Normal Text (GS ! 0x00)
    bytes.addAll([0x1D, 0x21, 0x00]);
    bytes.addAll(utf8.encode('Xerox & Digital Printing Center\n'));
    bytes.addAll(utf8.encode('------------------------------------------------\n'.substring(0, maxChars)));

    // Order Info
    bytes.addAll([0x1B, 0x61, 0x00]); // Left Align
    bytes.addAll(utf8.encode('Receipt #: ${order.orderNumber}\n'));
    bytes.addAll(utf8.encode('Date:     ${DateFormat('dd-MMM-yyyy hh:mm a').format(order.createdAt)}\n'));
    bytes.addAll(utf8.encode('Customer: ${order.customerName}\n'));
    bytes.addAll(utf8.encode('Phone:    ${order.customerPhone}\n'));
    bytes.addAll(utf8.encode('Status:   ${order.status} | Pay: ${order.paymentMethod}\n'));
    bytes.addAll(utf8.encode('------------------------------------------------\n'.substring(0, maxChars)));

    // Table Header
    String colHeader = profile.paperSize == PaperSize.mm80
        ? _padRight('Item Description', 26) + _padLeft('Qty/Pgs', 10) + _padLeft('Amount', 12)
        : _padRight('Item', 16) + _padLeft('Qty', 6) + _padLeft('Amt', 10);
    bytes.addAll([0x1B, 0x45, 0x01]); // Bold ON
    bytes.addAll(utf8.encode('$colHeader\n'));
    bytes.addAll([0x1B, 0x45, 0x00]); // Bold OFF

    bytes.addAll(utf8.encode('------------------------------------------------\n'.substring(0, maxChars)));

    // Table Items
    for (var item in order.items) {
      String detailsStr = '${item.paperSize} ${item.isColour ? 'CLR' : 'B/W'} ${item.isDoubleSided ? 'Duplex' : 'Simplex'}';
      String nameLine = '${item.serviceName} ($detailsStr)';
      String qtyStr = '${item.copies}c x ${item.pages}p';
      String priceStr = 'Rs.${item.totalPrice.toStringAsFixed(2)}';

      if (profile.paperSize == PaperSize.mm80) {
        if (nameLine.length > 25) {
          bytes.addAll(utf8.encode('${nameLine.substring(0, 25)}\n'));
          String subLine = '  ${_padRight(nameLine.substring(25), 24)}${_padLeft(qtyStr, 10)}${_padLeft(priceStr, 12)}';
          bytes.addAll(utf8.encode('$subLine\n'));
        } else {
          String line = _padRight(nameLine, 26) + _padLeft(qtyStr, 10) + _padLeft(priceStr, 12);
          bytes.addAll(utf8.encode('$line\n'));
        }
      } else {
        String line = _padRight(item.serviceName, 16) + _padLeft('${item.copies}c', 6) + _padLeft(priceStr, 10);
        bytes.addAll(utf8.encode('$line\n'));
      }
    }

    bytes.addAll(utf8.encode('------------------------------------------------\n'.substring(0, maxChars)));

    // Total Amount (Double Height, Center/Right)
    bytes.addAll([0x1B, 0x45, 0x01]); // Bold
    String totalLine = _padRight('TOTAL AMOUNT:', maxChars - 14) + _padLeft('Rs.${order.totalAmount.toStringAsFixed(2)}', 14);
    bytes.addAll(utf8.encode('$totalLine\n'));
    bytes.addAll([0x1B, 0x45, 0x00]); // Bold OFF

    bytes.addAll(utf8.encode('------------------------------------------------\n'.substring(0, maxChars)));

    // Footer Message (Center Align)
    bytes.addAll([0x1B, 0x61, 0x01]);
    bytes.addAll(utf8.encode('${profile.footerMessage}\n'));
    bytes.addAll(utf8.encode('Scan to Verify Bill:\n'));

    final String verifyUrl = '${ApiConfig.webVerificationUrl}/verify/${order.id}';
    final List<int> qrDataBytes = utf8.encode(verifyUrl);
    final int storeLen = qrDataBytes.length + 3;

    // ESC/POS Native QR Code Commands
    bytes.addAll([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]); // Model 2
    bytes.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06]); // Size 6
    bytes.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]); // Error Correction Level M
    bytes.addAll([0x1D, 0x28, 0x6B, storeLen % 256, storeLen ~/ 256, 0x31, 0x50, 0x30]); // Store Data
    bytes.addAll(qrDataBytes);
    bytes.addAll([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]); // Print QR

    bytes.addAll(utf8.encode('\n\n'));

    // Feed lines & Auto-cut (GS V 66 0)
    if (profile.autoCut) {
      bytes.addAll([0x1D, 0x56, 0x42, 0x03]); // Feed 3 lines & Cut paper
    } else {
      bytes.addAll(utf8.encode('\n\n\n\n'));
    }

    return bytes;
  }

  // ==========================================
  // EPSON ePOS-PRINT XML PAYLOAD GENERATOR
  // ==========================================
  static String _generateEpsonXmlPayload(ShopOrder order, PrinterProfile profile) {
    final String verifyUrl = '${ApiConfig.webVerificationUrl}/verify/${order.id}';
    StringBuffer xml = StringBuffer();
    xml.writeln('<?xml version="1.0" encoding="utf-8"?>');
    xml.writeln('<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">');
    xml.writeln('<s:Body>');
    xml.writeln('<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">');

    // Header
    xml.writeln('<text align="center" width="2" height="2"/>');
    xml.writeln('<text>${_escapeXml(profile.headerTitle)}&#10;</text>');
    xml.writeln('<text width="1" height="1"/>');
    xml.writeln('<text>Xerox &amp; Print Hub&#10;</text>');
    xml.writeln('<text>----------------------------------------&#10;</text>');

    // Order Info
    xml.writeln('<text align="left"/>');
    xml.writeln('<text>Receipt #: ${_escapeXml(order.orderNumber)}&#10;</text>');
    xml.writeln('<text>Customer:  ${_escapeXml(order.customerName)}&#10;</text>');
    xml.writeln('<text>Date:      ${DateFormat('yyyy-MM-dd HH:mm').format(order.createdAt)}&#10;</text>');
    xml.writeln('<text>----------------------------------------&#10;</text>');

    // Items
    for (var item in order.items) {
      xml.writeln('<text>${_escapeXml(item.serviceName)} x${item.copies}  Rs.${item.totalPrice.toStringAsFixed(2)}&#10;</text>');
    }

    xml.writeln('<text>----------------------------------------&#10;</text>');
    xml.writeln('<text align="right" width="2" height="2"/>');
    xml.writeln('<text>Total: Rs.${order.totalAmount.toStringAsFixed(2)}&#10;</text>');
    xml.writeln('<text width="1" height="1" align="center"/>');
    xml.writeln('<text>${_escapeXml(profile.footerMessage)}&#10;</text>');
    xml.writeln('<text>Scan to Verify Bill&#10;</text>');
    xml.writeln('<symbol type="qrcode" model="model2" level="level_m" width="4" height="4" align="center">${_escapeXml(verifyUrl)}</symbol>');
    xml.writeln('<text>&#10;&#10;</text>');

    if (profile.autoCut) {
      xml.writeln('<cut type="feed"/>');
    }

    xml.writeln('</epos-print>');
    xml.writeln('</s:Body>');
    xml.writeln('</s:Envelope>');
    return xml.toString();
  }

  static String _padRight(String str, int len) {
    if (str.length >= len) return str.substring(0, len);
    return str + ' ' * (len - str.length);
  }

  static String _padLeft(String str, int len) {
    if (str.length >= len) return str.substring(0, len);
    return ' ' * (len - str.length) + str;
  }

  static String _escapeXml(String text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
  }
}
