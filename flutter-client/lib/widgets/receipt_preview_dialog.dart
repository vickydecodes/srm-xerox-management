import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../config/api_config.dart';
import '../models/order.dart';
import '../models/printer_profile.dart';
import '../providers/printer_provider.dart';

class ReceiptPreviewDialog extends StatelessWidget {
  final ShopOrder order;

  const ReceiptPreviewDialog({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final printerProvider = Provider.of<PrinterProvider>(context);
    final profile = printerProvider.profile;
    final verifyUrl = '${ApiConfig.webVerificationUrl}/verify/${order.id}';

    return AlertDialog(
      backgroundColor: const Color(0xFFFFFFFF),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Thermal Receipt Preview',
            style: TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.bold),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.grey),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Container(
          width: profile.paperSize == PaperSize.mm80 ? 340 : 260,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFDF5), // Thermal paper background style
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                profile.headerTitle,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Courier',
                ),
                textAlign: TextAlign.center,
              ),
              const Text(
                'Xerox & Digital Print Center',
                style: TextStyle(color: Colors.black87, fontSize: 11, fontFamily: 'Courier'),
              ),
              const Divider(color: Colors.black54, thickness: 1),
              Align(
                alignment: Alignment.centerLeft,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Receipt #: ${order.orderNumber}', style: const TextStyle(color: Colors.black, fontSize: 12, fontFamily: 'Courier', fontWeight: FontWeight.bold)),
                    Text('Date: ${DateFormat('dd-MMM-yyyy hh:mm a').format(order.createdAt)}', style: const TextStyle(color: Colors.black, fontSize: 11, fontFamily: 'Courier')),
                    Text('Customer: ${order.customerName}', style: const TextStyle(color: Colors.black, fontSize: 11, fontFamily: 'Courier')),
                    Text('Phone: ${order.customerPhone}', style: const TextStyle(color: Colors.black, fontSize: 11, fontFamily: 'Courier')),
                    Text('Pay Mode: ${order.paymentMethod}', style: const TextStyle(color: Colors.black, fontSize: 11, fontFamily: 'Courier')),
                  ],
                ),
              ),
              const Divider(color: Colors.black54, thickness: 1),
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Item / Specs', style: TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Courier')),
                  Text('Qty', style: TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Courier')),
                  Text('Price', style: TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Courier')),
                ],
              ),
              const Divider(color: Colors.black38, thickness: 1),
              ...order.items.map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(
                        '${item.serviceName}\n(${item.paperSize} ${item.isColour ? 'CLR' : 'B/W'})',
                        style: const TextStyle(color: Colors.black87, fontSize: 11, fontFamily: 'Courier'),
                      ),
                    ),
                    Expanded(
                      flex: 1,
                      child: Text(
                        '${item.copies}c',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.black87, fontSize: 11, fontFamily: 'Courier'),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Text(
                        'Rs.${item.totalPrice.toStringAsFixed(2)}',
                        textAlign: TextAlign.right,
                        style: const TextStyle(color: Colors.black87, fontSize: 11, fontFamily: 'Courier'),
                      ),
                    ),
                  ],
                ),
              )),
              const Divider(color: Colors.black54, thickness: 1),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('TOTAL:', style: TextStyle(color: Colors.black, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Courier')),
                  Text('Rs.${order.totalAmount.toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Courier')),
                ],
              ),
              const Divider(color: Colors.black54, thickness: 1),
              const SizedBox(height: 6),
              Text(
                profile.footerMessage,
                style: const TextStyle(color: Colors.black54, fontSize: 10, fontFamily: 'Courier', fontStyle: FontStyle.italic),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                '--- SCAN TO VERIFY BILL ---',
                style: TextStyle(color: Colors.black87, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Courier'),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: Colors.black26),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: QrImageView(
                  data: verifyUrl,
                  version: QrVersions.auto,
                  size: 110.0,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
        ),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1E3A8A),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
          icon: const Icon(Icons.print, color: Colors.white),
          label: const Text('Print Now via ePOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          onPressed: () async {
            final messenger = ScaffoldMessenger.of(context);
            Navigator.of(context).pop();
            final result = await printerProvider.printOrder(order);
            messenger.showSnackBar(
              SnackBar(
                content: Text(result.message),
                backgroundColor: result.success ? Colors.green : Colors.red,
                duration: const Duration(seconds: 4),
              ),
            );
          },
        ),
      ],
    );
  }
}
