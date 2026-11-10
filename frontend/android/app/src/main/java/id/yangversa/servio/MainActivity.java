package id.yangversa.servio;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "YangversaPrinter";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // 1. Force the status bar and navigation bar to be opaque white with dark icons
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.WHITE);
        window.setNavigationBarColor(Color.WHITE);

        // 2. Set light status bar & navigation bar appearance (dark text / icons)
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(true);
            controller.setAppearanceLightNavigationBars(true);
        }

        // 3. Physically pad the root content view so the WebView NEVER clips into system bars
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
                Insets systemBars = insets.getInsets(
                    WindowInsetsCompat.Type.statusBars() | 
                    WindowInsetsCompat.Type.navigationBars() | 
                    WindowInsetsCompat.Type.displayCutout()
                );
                v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }

        // 4. Setup WebView settings and native printing bridge
        setupPrinterBridge();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupPrinterBridge();
    }

    private void setupPrinterBridge() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        WebView.setWebContentsDebuggingEnabled(true);
        WebSettings webSettings = webView.getSettings();
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webView.clearCache(true);

        // Native Android Print & Share Bridge
        webView.addJavascriptInterface(new Object() {

            /**
             * Direct Native Print Spooler (Android 4.4 - Android 16)
             * Opens the official system print dialog where user can print to any printer
             * or choose "Simpan sebagai PDF" (Save as PDF).
             */
            @JavascriptInterface
            public void print(final String docName) {
                runOnUiThread(() -> {
                    try {
                        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                        if (printManager != null && getBridge() != null && getBridge().getWebView() != null) {
                            String jobName = (docName != null && !docName.trim().isEmpty())
                                ? docName.trim()
                                : "Faktur Yangversa Computer";

                            PrintDocumentAdapter printAdapter = getBridge().getWebView().createPrintDocumentAdapter(jobName);
                            PrintAttributes printAttributes = new PrintAttributes.Builder()
                                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                                .build();

                            printManager.print(jobName, printAdapter, printAttributes);
                        } else {
                            Toast.makeText(MainActivity.this, "Layanan Cetak Android tidak tersedia.", Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error invoking Android PrintManager", e);
                        Toast.makeText(MainActivity.this, "Gagal membuka dialog cetak: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
            }

            /**
             * Save and Share PDF via Android FileProvider & Intent Chooser
             * Bypasses the 1MB IPC Intent limit by writing to a cache file and passing a content:// URI.
             */
            @JavascriptInterface
            public void sharePdf(final String base64Data, final String filename) {
                runOnUiThread(() -> {
                    try {
                        File pdfFile = writeBase64ToFile(base64Data, filename);
                        if (pdfFile == null || !pdfFile.exists()) {
                            Toast.makeText(MainActivity.this, "Gagal memproses file PDF.", Toast.LENGTH_SHORT).show();
                            return;
                        }

                        Uri fileUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getApplicationContext().getPackageName() + ".fileprovider",
                            pdfFile
                        );

                        Intent shareIntent = new Intent(Intent.ACTION_SEND);
                        shareIntent.setType("application/pdf");
                        shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
                        shareIntent.putExtra(Intent.EXTRA_SUBJECT, filename);
                        shareIntent.putExtra(Intent.EXTRA_TEXT, "Lampiran dokumen resmi dari Yangversa Computer.");
                        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                        Intent chooser = Intent.createChooser(shareIntent, "Cetak / Bagikan Dokumen PDF");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(chooser);
                    } catch (Exception e) {
                        Log.e(TAG, "Error sharing PDF file", e);
                        Toast.makeText(MainActivity.this, "Gagal membagikan PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
            }

            /**
             * Save PDF directly and open in PDF Viewer
             */
            @JavascriptInterface
            public void savePdf(final String base64Data, final String filename) {
                runOnUiThread(() -> {
                    try {
                        File pdfFile = writeBase64ToFile(base64Data, filename);
                        if (pdfFile == null || !pdfFile.exists()) {
                            Toast.makeText(MainActivity.this, "Gagal memproses file PDF.", Toast.LENGTH_SHORT).show();
                            return;
                        }

                        Uri fileUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getApplicationContext().getPackageName() + ".fileprovider",
                            pdfFile
                        );

                        Intent viewIntent = new Intent(Intent.ACTION_VIEW);
                        viewIntent.setDataAndType(fileUri, "application/pdf");
                        viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        viewIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                        Intent chooser = Intent.createChooser(viewIntent, "Buka Dokumen PDF");
                        startActivity(chooser);
                    } catch (Exception e) {
                        Log.e(TAG, "Error opening PDF file", e);
                        Toast.makeText(MainActivity.this, "Gagal membuka PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
            }

        }, "AndroidPrinter");
    }

    /**
     * Helper to write Base64 data (with or without data:application/pdf prefix) to a file
     */
    private File writeBase64ToFile(String base64Data, String filename) {
        if (base64Data == null || base64Data.trim().isEmpty()) {
            return null;
        }

        try {
            String cleanBase64 = base64Data;
            int commaIdx = cleanBase64.indexOf(",");
            if (commaIdx != -1) {
                cleanBase64 = cleanBase64.substring(commaIdx + 1);
            }
            cleanBase64 = cleanBase64.replaceAll("\\s+", "");

            byte[] pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

            String safeName = (filename != null && !filename.trim().isEmpty())
                ? filename.trim().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "Dokumen-Yangversa.pdf";

            if (!safeName.toLowerCase().endsWith(".pdf")) {
                safeName += ".pdf";
            }

            File dir = new File(getCacheDir(), "documents");
            if (!dir.exists()) {
                dir.mkdirs();
            }

            File outputFile = new File(dir, safeName);
            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                fos.write(pdfBytes);
                fos.flush();
            }

            return outputFile;
        } catch (Exception e) {
            Log.e(TAG, "Failed to decode and write PDF bytes", e);
            return null;
        }
    }
}
