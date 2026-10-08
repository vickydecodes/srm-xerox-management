import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/printer_profile.dart';
import '../providers/printer_provider.dart';

class PrinterSettingsScreen extends StatefulWidget {
  const PrinterSettingsScreen({super.key});

  @override
  State<PrinterSettingsScreen> createState() => _PrinterSettingsScreenState();
}

class _PrinterSettingsScreenState extends State<PrinterSettingsScreen> {
  late TextEditingController _ipController;
  late TextEditingController _portController;
  late TextEditingController _headerController;
  late TextEditingController _footerController;

  late EposConnectionMode _mode;
  late PaperSize _paperSize;
  late bool _autoCut;
  late bool _openCashDrawer;

  @override
  void initState() {
    super.initState();
    final profile =
        Provider.of<PrinterProvider>(context, listen: false).profile;
    _ipController = TextEditingController(text: profile.ipAddress);
    _portController = TextEditingController(text: profile.port.toString());
    _headerController = TextEditingController(text: profile.headerTitle);
    _footerController = TextEditingController(text: profile.footerMessage);

    _mode = profile.connectionMode;
    _paperSize = profile.paperSize;
    _autoCut = profile.autoCut;
    _openCashDrawer = profile.openCashDrawer;
  }

  @override
  Widget build(BuildContext context) {
    final printerProvider = Provider.of<PrinterProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E3A8A),
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('ePOS Printer Setup',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.network_check_rounded,
                color: Colors.white),
            tooltip: 'Test Printer Connection',
            onPressed: printerProvider.isTesting
                ? null
                : () async {
                    _saveProfile(context);
                    final res = await printerProvider.testConnection();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(res.message),
                        backgroundColor:
                            res.success ? Colors.green : Colors.red,
                      ),
                    );
                  },
          ),
          IconButton(
            icon: const Icon(Icons.print_rounded, color: Colors.white),
            tooltip: 'Print Test Page',
            onPressed: printerProvider.isPrinting
                ? null
                : () async {
                    _saveProfile(context);
                    final res = await printerProvider.printTestPage();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(res.message),
                        backgroundColor:
                            res.success ? Colors.green : Colors.red,
                      ),
                    );
                  },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status bar
            if (printerProvider.lastStatusMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: printerProvider.lastStatusSuccess
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: printerProvider.lastStatusSuccess
                        ? Colors.green
                        : Colors.red,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      printerProvider.lastStatusSuccess
                          ? Icons.check_circle_rounded
                          : Icons.error_outline_rounded,
                      color: printerProvider.lastStatusSuccess
                          ? Colors.green.shade800
                          : Colors.red.shade800,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        printerProvider.lastStatusMessage!,
                        style: TextStyle(
                          color: printerProvider.lastStatusSuccess
                              ? const Color(0xFF166534)
                              : const Color(0xFF991B1B),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            _buildSectionHeader('NETWORK & CONNECTION'),
            const SizedBox(height: 12),
            Card(
              color: Colors.white,
              elevation: 1,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFFE2E8F0))),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    TextFormField(
                      controller: _ipController,
                      style: const TextStyle(color: Color(0xFF0F172A)),
                      decoration: const InputDecoration(
                        labelText: 'Printer IP Address',
                        labelStyle: TextStyle(color: Color(0xFF64748B)),
                        prefixIcon: Icon(Icons.router_rounded,
                            color: Color(0xFF1E3A8A)),
                        filled: true,
                        fillColor: Color(0xFFF1F5F9),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _portController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Color(0xFF0F172A)),
                      decoration: const InputDecoration(
                        labelText:
                            'Port (9100 for Raw Socket, 80/8000 for Epson XML)',
                        labelStyle: TextStyle(color: Color(0xFF64748B)),
                        prefixIcon: Icon(Icons.settings_ethernet_rounded,
                            color: Color(0xFF1E3A8A)),
                        filled: true,
                        fillColor: Color(0xFFF1F5F9),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<EposConnectionMode>(
                      initialValue: _mode,
                      dropdownColor: Colors.white,
                      style: const TextStyle(color: Color(0xFF0F172A)),
                      decoration: const InputDecoration(
                        labelText: 'ePOS Protocol Mode',
                        labelStyle: TextStyle(color: Color(0xFF64748B)),
                        prefixIcon: Icon(Icons.alt_route_rounded,
                            color: Color(0xFF1E3A8A)),
                        filled: true,
                        fillColor: Color(0xFFF1F5F9),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: EposConnectionMode.rawTcp,
                          child:
                              Text('ESC/POS Direct Network Socket (Port 9100)'),
                        ),
                        DropdownMenuItem(
                          value: EposConnectionMode.epsonXml,
                          child:
                              Text('Epson ePOS-Print XML (HTTP Web Service)'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _mode = val;
                            _portController.text =
                                val == EposConnectionMode.rawTcp
                                    ? '9100'
                                    : '80';
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            _buildSectionHeader('PAPER & HARDWARE SPECIFICATIONS'),
            const SizedBox(height: 12),
            Card(
              color: Colors.white,
              elevation: 1,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFFE2E8F0))),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    DropdownButtonFormField<PaperSize>(
                      initialValue: _paperSize,
                      dropdownColor: Colors.white,
                      style: const TextStyle(color: Color(0xFF0F172A)),
                      decoration: const InputDecoration(
                        labelText: 'Thermal Paper Width',
                        labelStyle: TextStyle(color: Color(0xFF64748B)),
                        prefixIcon: Icon(Icons.insert_drive_file_rounded,
                            color: Color(0xFF1E3A8A)),
                        filled: true,
                        fillColor: Color(0xFFF1F5F9),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: PaperSize.mm80,
                          child: Text('80mm Standard Thermal Roll (48 cols)'),
                        ),
                        DropdownMenuItem(
                          value: PaperSize.mm58,
                          child: Text('58mm Mini Thermal Roll (32 cols)'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _paperSize = val);
                      },
                    ),
                    SwitchListTile(
                      title: const Text('Auto Paper Cut after print',
                          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600)),
                      subtitle: const Text(
                          'Sends ESC/POS guillotine cut command',
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                      value: _autoCut,
                      activeThumbColor: const Color(0xFF1E3A8A),
                      onChanged: (val) => setState(() => _autoCut = val),
                    ),
                    SwitchListTile(
                      title: const Text('Open Cash Drawer pulse',
                          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600)),
                      subtitle: const Text(
                          'Triggers cash drawer RJ11 pin on print',
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                      value: _openCashDrawer,
                      activeThumbColor: const Color(0xFF1E3A8A),
                      onChanged: (val) => setState(() => _openCashDrawer = val),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            _buildSectionHeader('RECEIPT CUSTOMIZATION'),
            const SizedBox(height: 12),
            Card(
              color: Colors.white,
              elevation: 1,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFFE2E8F0))),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    TextFormField(
                      controller: _headerController,
                      style: const TextStyle(color: Color(0xFF0F172A)),
                      decoration: const InputDecoration(
                        labelText: 'Store Header Title',
                        labelStyle: TextStyle(color: Color(0xFF64748B)),
                        filled: true,
                        fillColor: Color(0xFFF1F5F9),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _footerController,
                      style: const TextStyle(color: Color(0xFF0F172A)),
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Footer Thank You Message',
                        labelStyle: TextStyle(color: Color(0xFF64748B)),
                        filled: true,
                        fillColor: Color(0xFFF1F5F9),
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E3A8A),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.save_rounded, color: Colors.white),
                label: const Text('SAVE PRINTER CONFIGURATION',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1)),
                onPressed: () {
                  _saveProfile(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('ePOS Printer settings saved!'),
                        backgroundColor: Colors.green),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _saveProfile(BuildContext context) {
    final provider = Provider.of<PrinterProvider>(context, listen: false);
    final updated = provider.profile.copyWith(
      ipAddress: _ipController.text.trim(),
      port: int.tryParse(_portController.text.trim()) ?? 9100,
      connectionMode: _mode,
      paperSize: _paperSize,
      autoCut: _autoCut,
      openCashDrawer: _openCashDrawer,
      headerTitle: _headerController.text.trim(),
      footerMessage: _footerController.text.trim(),
    );
    provider.updateProfile(updated);
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF1E3A8A),
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    );
  }
}
