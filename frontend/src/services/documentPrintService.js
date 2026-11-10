/**
 * Universal Document Print & PDF Export Engine
 * 
 * Works seamlessly across:
 * - Capacitor Android (APK): Native AndroidPrinter bridge to OS Print Spooler (Android 4.4 up to Android 16)
 *   + FileProvider Native PDF sharing & saving
 * - Desktop Browser: Direct window.print() + Direct PDF Download
 * - Mobile Browser / PWA: High-res PDF Download + Save as PDF
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { isNativePlatform } from "./nativeServices";
import toast from "react-hot-toast";

export const DocumentPrintService = {
    /**
     * Generate high-quality A4 PDF from a DOM element using html2canvas + jsPDF
     * @param {HTMLElement|string} target - DOM Element or element ID
     * @param {Object} options - Export options
     * @returns {Promise<jsPDF>}
     */
    async generatePdf(target, options = {}) {
        let element = null;
        if (typeof target === "string") {
            element = document.getElementById(target);
        } else if (target instanceof HTMLElement) {
            element = target;
        }

        if (!element) {
            // Fallback: try finding printable containers by class/id
            element = document.querySelector("#printable-invoice-modal-content") ||
                      document.querySelector(".printable-invoice-modal") || 
                      document.querySelector("#printable-invoice-detail") || 
                      document.querySelector("#printable-bpbs") || 
                      document.querySelector("#warranty-certificate-document");
        }

        if (!element) {
            throw new Error("Elemen dokumen tidak ditemukan untuk dicetak.");
        }

        const {
            filename = "Dokumen-Yangversa.pdf",
            scale = 2, // 2x for crisp 300dpi retina resolution
            orientation = "landscape", // default landscape for continuous form / half-A4
            format = "a5", // default A5 (210x148mm = half A4 continuous form)
            marginMm = 0
        } = options;

        const canvas = await html2canvas(element, {
            scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
            windowWidth: 1024,
            onclone: (clonedDoc) => {
                const targetId = typeof target === "string" ? target : null;
                if (targetId) {
                    const clonedEl = clonedDoc.getElementById(targetId);
                    if (clonedEl) {
                        clonedEl.style.display = "block";
                        clonedEl.style.visibility = "visible";
                    }
                }
            }
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        // Determine target dimensions
        // For continuous form / half-A4 invoices: width is 210mm (landscape), height adapts tightly to content
        const isLandscape = orientation === "landscape";
        const standardWidth = isLandscape ? 210 : 148;
        const contentWidth = standardWidth - (marginMm * 2);
        const contentHeight = (canvas.height * contentWidth) / canvas.width;

        // Auto-fit height to content so there is zero trailing blank space/gap at the bottom
        const fitHeight = options.fitContentHeight ?? true;
        const pageHeight = fitHeight 
            ? Math.max(Math.round(contentHeight + (marginMm * 2)), 45)
            : (isLandscape ? 148 : 210);

        // In jsPDF format parameter: [height, width] for landscape mode
        const pdfFormat = isLandscape ? [pageHeight, standardWidth] : [standardWidth, pageHeight];
        const pdf = new jsPDF({
            orientation,
            unit: "mm",
            format: pdfFormat
        });

        const pdfHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = contentHeight;
        let position = marginMm;

        // First page
        pdf.addImage(imgData, "JPEG", marginMm, position, contentWidth, contentHeight, undefined, "FAST");
        heightLeft -= (pdfHeight - marginMm * 2);

        // Additional pages if needed
        while (heightLeft > 5) {
            position = heightLeft - contentHeight;
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", marginMm, position, contentWidth, contentHeight, undefined, "FAST");
            heightLeft -= pdfHeight;
        }

        return pdf;
    },

    /**
     * Export and download PDF directly to user's device
     */
    async downloadPdf(target, filename = "Faktur-Yangversa.pdf", options = {}) {
        const toastId = toast.loading("Membuat dokumen PDF berkualitas tinggi...");
        try {
            const pdf = await this.generatePdf(target, { filename, ...options });

            // 1. If running on Android Capacitor with native FileProvider bridge
            if (typeof window !== "undefined" && window.AndroidPrinter && typeof window.AndroidPrinter.sharePdf === "function") {
                const base64Data = pdf.output("datauristring");
                window.AndroidPrinter.sharePdf(base64Data, filename);
                toast.success("Dokumen PDF siap dibagikan / dicetak!", { id: toastId });
                return true;
            }

            // 2. Standard Web / Desktop Download trigger
            pdf.save(filename);

            // Also create blob download fallback for mobile webviews
            try {
                const blob = pdf.output("blob");
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = filename;
                a.style.display = "none";
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                }, 1500);
            } catch {
                // Ignore if standard save already triggered
            }

            toast.success("Dokumen PDF berhasil diunduh!", { id: toastId });
            return true;
        } catch (err) {
            console.error("[PrintService] Download PDF error:", err);
            toast.error("Gagal membuat file PDF: " + (err.message || "Unknown error"), { id: toastId });
            return false;
        }
    },

    /**
     * Smart Print / Export Action:
     * - On Android App (Capacitor): Uses native AndroidPrinter bridge to launch OS Print Spooler (Save as PDF / Printer)
     * - On Desktop: Launches standard window.print()
     * - Fallback: Generates high-res A4 PDF via jsPDF and saves
     */
    async printOrShareDocument(target, {
        filename = "Faktur-Yangversa.pdf",
        title = "Faktur Servis Yangversa Computer",
        text = "Berikut lampiran faktur resmi pembayaran servis Yangversa Computer.",
        preferDirectPrint = true
    } = {}) {
        // 1. Android Capacitor Native Print Bridge (Opens official Android Print Spooler on Android 4.4 - 16)
        if (typeof window !== "undefined" && window.AndroidPrinter && typeof window.AndroidPrinter.print === "function") {
            try {
                const docTitle = title || filename.replace(/\.pdf$/i, "");
                window.AndroidPrinter.print(docTitle);
                return true;
            } catch (nativeErr) {
                console.warn("[PrintService] AndroidPrinter bridge failed, falling back to PDF generator:", nativeErr);
            }
        }

        // 2. Desktop Browser Direct Print
        const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile && typeof window !== "undefined" && typeof window.print === "function" && preferDirectPrint) {
            try {
                window.print();
                return true;
            } catch {
                // Fallback to PDF export
            }
        }

        // 3. Client-Side High-Res PDF Generator Fallback (Mobile Web / PWA)
        return await this.downloadPdf(target, filename);
    }
};

export default DocumentPrintService;
