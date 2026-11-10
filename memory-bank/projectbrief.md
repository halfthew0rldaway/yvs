# Project Brief: Yangversa Computer (YVS) Management & ERP System

## Core Goal
Provide a comprehensive, high-reliability enterprise ERP, service workshop management, CRM, inventory, and HR attendance platform for Yangversa Computer repair workshop.

## Key Requirements & Scope
1. **Service Workshop Lifecycle**:
   - Customer and device registration with physical defect mapper and accessories checklist.
   - Comprehensive intake documentation with photo evidence.
   - Technician diagnostic workflow, cost estimation, and customer approval tracking.
   - Repair logging with timeline tracking.
   - Automated spare part stock deductions when parts are assigned to a ticket.
   - 10-point Quality Control (QC) verification checklist before unit handover.
   - Printable receipts (BPBS - Bukti Penerimaan Barang Servis) and official invoices.

2. **Inventory & Procurement (Spare Parts & RMA)**:
   - SKU, barcode/QR code generation and label printing for spare parts.
   - Cost price vs selling price tracking with low-stock alerts.
   - Supplier directory and restock purchase logging.
   - Defective spare part tracking and Return Merchandise Authorization (Supplier RMA).

3. **Invoicing & Finance**:
   - Multi-item service invoices with DP (down payment), discounts, and tax support.
   - Digital stamp and signature integration.
   - Universal printing: Native Android Print Spooler on Android, high-res PDF export on desktop and mobile web.

4. **HR & Attendance**:
   - GPS-geofenced mobile attendance with exact 500-meter radius around Jl. Raya Pekayon No. 25.
   - High-accuracy geolocation validation preventing false out-of-boundary flags.
   - On-site vs external duty activity reporting.
   - Live selfie photo capture verification and attendance review/approval workflow.

5. **Client Portal & Retention CRM**:
   - Public service tracking by ticket number and phone number without login required.
   - Automated maintenance reminders (6-month and 1-year cycles) with WhatsApp message generation.

6. **Offline-First & Mobile Capability**:
   - Capacitor Android native application (`id.yangversa.servio`).
   - SWR IndexedDB client caching for instant offline page browsing.
   - Offline mutation queuing and background sync upon reconnection.
   - Zero-overlap, non-intrusive connectivity status handling.
