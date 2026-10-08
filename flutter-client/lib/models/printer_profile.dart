enum EposConnectionMode {
  rawTcp, // ESC/POS Direct Socket (port 9100)
  epsonXml, // Epson ePOS-Print XML HTTP Web Service (port 80 / 8000)
}

enum PaperSize {
  mm80, // 80mm roll (48 chars per line)
  mm58, // 58mm roll (32 chars per line)
}

class PrinterProfile {
  final String ipAddress;
  final int port;
  final EposConnectionMode connectionMode;
  final PaperSize paperSize;
  final bool autoCut;
  final bool openCashDrawer;
  final String headerTitle;
  final String footerMessage;

  PrinterProfile({
    this.ipAddress = '192.168.1.100',
    this.port = 9100,
    this.connectionMode = EposConnectionMode.rawTcp,
    this.paperSize = PaperSize.mm80,
    this.autoCut = true,
    this.openCashDrawer = false,
    this.headerTitle = 'SRM XEROX & PRINT HUB',
    this.footerMessage = 'Thank you for your visit!\nPlease check your prints before leaving.',
  });

  PrinterProfile copyWith({
    String? ipAddress,
    int? port,
    EposConnectionMode? connectionMode,
    PaperSize? paperSize,
    bool? autoCut,
    bool? openCashDrawer,
    String? headerTitle,
    String? footerMessage,
  }) {
    return PrinterProfile(
      ipAddress: ipAddress ?? this.ipAddress,
      port: port ?? this.port,
      connectionMode: connectionMode ?? this.connectionMode,
      paperSize: paperSize ?? this.paperSize,
      autoCut: autoCut ?? this.autoCut,
      openCashDrawer: openCashDrawer ?? this.openCashDrawer,
      headerTitle: headerTitle ?? this.headerTitle,
      footerMessage: footerMessage ?? this.footerMessage,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'ipAddress': ipAddress,
      'port': port,
      'connectionMode': connectionMode.index,
      'paperSize': paperSize.index,
      'autoCut': autoCut,
      'openCashDrawer': openCashDrawer,
      'headerTitle': headerTitle,
      'footerMessage': footerMessage,
    };
  }

  factory PrinterProfile.fromJson(Map<String, dynamic> json) {
    return PrinterProfile(
      ipAddress: json['ipAddress']?.toString() ?? '192.168.1.100',
      port: (json['port'] as num?)?.toInt() ?? 9100,
      connectionMode: EposConnectionMode.values[
          (json['connectionMode'] as num?)?.toInt() ?? 0],
      paperSize: PaperSize.values[
          (json['paperSize'] as num?)?.toInt() ?? 0],
      autoCut: json['autoCut'] ?? true,
      openCashDrawer: json['openCashDrawer'] ?? false,
      headerTitle: json['headerTitle']?.toString() ?? 'SRM XEROX & PRINT HUB',
      footerMessage: json['footerMessage']?.toString() ?? 'Thank you for your visit!',
    );
  }
}
