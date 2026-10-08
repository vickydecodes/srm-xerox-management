# SRM Xerox Admin - Flutter Client (ePOS Thermal Printing)

Cross-platform Flutter application for **SRM Xerox & Digital Print Center** shop admins. Built for **Android Tablets/Phones** and **Windows Desktop**.

## Key Features

1. **ePOS Thermal Printing Engine**:
   - **ESC/POS Direct TCP Socket** (Port 9100) support for thermal printers (Epson TM-T88, TM-T20, TVS, Xprinter, etc.).
   - **Epson ePOS-Print XML HTTP** service protocol support.
   - 80mm & 58mm thermal paper formatting with custom header/footer, cashier info, line item breakdown, subtotal, GST/Total, and auto paper cut.
   - Built-in **Receipt Visual Preview Dialog** prior to sending print jobs.
   - **Printer Connectivity Test** & **1-Tap Test Receipt Printing**.

2. **Live Order Queue & Status Workflow**:
   - Auto-refreshing order stream (Pending, In Progress, Ready for Pickup, Delivered).
   - Xerox Job Specifications breakdown: Paper size (A4, A3), Copies, Pages, Color/BW, Duplex (Double-sided) / Simplex.
   - Quick status update actions directly from order cards or details view.

3. **Shop Admin Authentication**:
   - Secure login integrated with backend APIs.
   - Configurable Backend Host URL for local dev or remote production servers.

---

## Folder Structure

```text
admin_app/
├── lib/
│   ├── config/
│   │   ├── api_config.dart          # Backend API endpoint configuration
│   │   └── printer_config.dart      # Thermal printer profile defaults
│   ├── models/
│   │   ├── user.dart                # Admin authentication model
│   │   ├── order.dart               # Order & Print item specification model
│   │   └── printer_profile.dart     # ePOS printer profile model
│   ├── services/
│   │   ├── api_service.dart          # Backend HTTP client
│   │   └── epos_printer_service.dart # ESC/POS & Epson ePOS XML printer engine
│   ├── providers/
│   │   ├── auth_provider.dart       # Auth state management
│   │   ├── order_provider.dart      # Live order queue provider
│   │   └── printer_provider.dart    # ePOS printer provider & profile persistence
│   ├── screens/
│   │   ├── login_screen.dart        # Admin authentication screen
│   │   ├── dashboard_screen.dart    # Main dashboard shell
│   │   ├── orders_screen.dart       # Live order queue
│   │   ├── order_detail_screen.dart # Order specs & print action
│   │   └── printer_settings_screen.dart # ePOS setup & connection test
│   └── widgets/
│       └── receipt_preview_dialog.dart # Visual receipt preview dialog
├── pubspec.yaml
└── README.md
```

---

## Quick Start & Setup

### Prerequisites
- [Flutter SDK](https://flutter.dev/docs/get-started/install) (`>= 3.0.0`)
- Android Studio / Android SDK (for Android builds) or Visual Studio C++ Build Tools (for Windows Desktop builds)

### 1. Install Dependencies
```bash
cd admin_app
flutter pub get
```

### 2. Run on Windows Desktop
```bash
flutter run -d windows
```

### 3. Run on Android Device / Tablet
```bash
flutter run -d android
```

### 4. Build Production Binaries

- **Android APK**:
  ```bash
  flutter build apk --release
  ```
- **Windows Executable**:
  ```bash
  flutter build windows --release
  ```

---

## ePOS Thermal Printer Setup Guide

1. Connect your ESC/POS thermal printer (e.g. Epson TM-T88 / TM-T20 / Xprinter) to your local network via Ethernet or Wi-Fi.
2. Open the **SRM Xerox Admin App** and navigate to **ePOS Printer** settings tab.
3. Enter the Printer's IP Address (e.g. `192.168.1.100`) and Port (`9100` for raw TCP socket, or `80` for Epson XML).
4. Select paper width (**80mm** or **58mm**).
5. Click **Test Printer Connection** to verify reachability.
6. Click **Print Test Page** to test paper feeding and auto-cutting.
