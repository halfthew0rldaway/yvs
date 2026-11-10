# Core Business Workflows

## 1. Service Ticket Processing
- Intake (`diterima`): Frontman captures device details, physical defect map, deposited accessories, and initial condition photos. Generates printable BPBS.
- Technical Diagnosis (`didiagnosis`): Technician records technical faults, internal photos, cost estimate, and required parts.
- Customer Confirmation (`menunggu_persetujuan` -> `disetujui`): Quotation approved.
- Repair (`dalam_perbaikan`): Technician performs hardware servicing, records used spare parts, logs actions in `LogPerbaikan`.
- Quality Control (`selesai`): 10-point hardware check (screen, ports, audio, keyboard, temperature), completion photos.
- Billing & Pickup (`diambil`): Invoice generated with digital stamp/signature, printed via `AndroidPrinter` or exported as high-res PDF.

## 2. Attendance & Geofencing
- Workshop Location: Jl. Raya Pekayon No. 25, Bekasi Selatan (`-6.26064, 106.98744`).
- Radius: Exact 500 meters.
- Distance calculation uses Haversine formula with high-accuracy GPS acquisition.
- If distance <= 500m: On-site attendance with selfie photo capture.
- If distance > 500m: External task reporting mandatory (activity reason + selfie).

## 3. CRM & Retention Recall
- Automatic identification of devices serviced 180 to 365+ days ago.
- Pre-filled WhatsApp templates for maintenance service (dust cleaning, thermal paste replacement).
- See related details in `mem:database`.
