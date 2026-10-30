// Preset Jabatan Standar KEOS KomputerAwet / Serv.io
export const JOB_PRESETS = [
    {
        id: "teknisi_software",
        label: "Teknisi Software & OS",
        icon: "Laptop",
        departemen: "Teknisi",
        tipe_kerja: "Full Time",
        lokasi: "Workshop Utama",
        gaji_min: 2500000,
        gaji_max: 3800000,
        deskripsi: `• Melakukan instalasi clean OS (Windows 10/11, Linux, macOS) dengan partisi GPT/MBR yang rapi.
• Melakukan backup data pelanggan secara aman dan terverifikasi sebelum tindakan instalasi.
• Mengatasi crash software, bluescreen (BSOD), driver conflict, serta infeksi malware/virus.
• Melakukan optimasi startup, debloating, dan setting performa laptop/PC kerja & gaming.
• Wajib menjalankan Standar 8-Point Quality Control (QC) Serv.io sebelum unit diserahkan.`,
        kualifikasi: `• Pendidikan minimal SMK TKJ / Rekayasa Perangkat Lunak / Otodidak Berpengalaman.
• Memiliki troubleshooting mindset yang logis dan teliti (bukan sekadar coba-coba).
• Menjunjung tinggi integritas kerahasiaan data pribadi pelanggan (Zero Data Breach).
• Mampu bekerja sesuai SOP kerja dan ramah berkoordinasi dengan frontliner & customer.
• Nilai tambah jika memahami flashing BIOS dan konfigurasi software mikrokontroler.`,
    },
    {
        id: "teknisi_hardware",
        label: "Teknisi Hardware & Motherboard",
        icon: "Cpu",
        departemen: "Teknisi",
        tipe_kerja: "Full Time",
        lokasi: "Workshop Utama",
        gaji_min: 3000000,
        gaji_max: 5000000,
        deskripsi: `• Melakukan diagnosa motherboard level komponen (short circuit, VCore, 3V/5V power rail, IC charging).
• Membaca dan menganalisis skematik & boardview laptop/PC desktop.
• Melakukan penyolderan mikro (micro-soldering), reballing chipset, penggantian port I/O, USB-C, dan socket.
• Melakukan deep cleaning sistem pendingin & repasting pasta thermal dengan takaran dan teknik presisi.
• Memperbaiki kerusakan engsel casing laptop patah dengan metode penguatan baut tanam rapi.`,
        kualifikasi: `• Pendidikan minimal SMK Elektronika / Otodidak dengan jam terbang servis motherboard minimal 1 tahun.
• Terampil menggunakan multitester digital, power supply DC variabel, solder station, dan hot air blower.
• Memahami prinsip proteksi muatan elektrostatik (ESD) dan keselamatan kerja bengkel komputer.
• Teliti, sabar, rapi dalam penataan baut & komponen kecil milik pelanggan.
• Memiliki kemauan belajar tinggi pada teknologi motherboard laptop seri terbaru.`,
    },
    {
        id: "frontdesk_cs",
        label: "Frontdesk & Service Advisor (CS)",
        icon: "Headphones",
        departemen: "Frontliner",
        tipe_kerja: "Full Time",
        lokasi: "Workshop Utama",
        gaji_min: 2300000,
        gaji_max: 3500000,
        deskripsi: `• Menyambut pelanggan datang dengan standar 3S (Senyum, Salam, Sapa) dan profesional.
• Mendengarkan keluhan kerusakan pelanggan secara aktif (Active Listening) dan memetakan cacat fisik di Defect Map.
• Menerbitkan bukti tanda terima servis resmi (BPBS) dan menjelaskan estimasi waktu & biaya diagnosa secara transparan.
• Memberikan update progres pengerjaan servis kepada pelanggan melalui WhatsApp CRM Serv.io.
• Melayani serah terima unit selesai, mengarahkan tanda tangan digital, dan memproses kasir/invoice.`,
        kualifikasi: `• Pria / Wanita, usia maksimal 28 tahun.
• Berpenampilan rapi, bersih, dan mematuhi SOP Grooming perusahaan.
• Komunikasi ramah, empati tinggi, serta mampu menjelaskan bahasa teknis komputer secara sederhana kepada pelanggan awam.
• Jujur, teliti dalam pencatatan transaksi kas, dan terbiasa mengoperasikan komputer/web app.
• Pengalaman di bidang Customer Service, Kasir, atau Hospitality menjadi nilai tambah utama.`,
    },
    {
        id: "admin_operasional",
        label: "Admin Kasir & Stok Inventaris",
        icon: "Layers",
        departemen: "Operasional",
        tipe_kerja: "Full Time",
        lokasi: "Workshop Utama",
        gaji_min: 2200000,
        gaji_max: 3300000,
        deskripsi: `• Bertanggung jawab atas pencatatan stok sparepart masuk dan keluar di workshop (metode FIFO).
• Melakukan stock opname berkala dan mengontrol batas minimum pemesanan ulang (Reorder Point).
• Mengelola klaim retur suku cadang cacat ke distributor (Supplier RMA Management).
• Mencatat pembukuan kas harian, rekonsiliasi pembayaran QRIS/Transfer, dan pelaporan keuangan berkala.
• Menjaga ketersediaan perlengkapan administrasi dan nota workshop.`,
        kualifikasi: `• Pendidikan minimal SMK Akuntansi / Administrasi Perkantoran / SMA / D3.
• Teliti terhadap angka, rapi dalam pengarsipan nota dan faktur belanja toko.
• Menguasai pengoperasian dasar Microsoft Excel / Google Sheets dan aplikasi kasir POS.
• Disiplin, berintegritas tinggi, dan tidak mudah ceroboh dalam penghitungan uang kas.`,
    },
    {
        id: "magang_junior",
        label: "Teknisi Magang / Junior Apprentice",
        icon: "Sparkles",
        departemen: "Teknisi",
        tipe_kerja: "Magang",
        lokasi: "Workshop Utama",
        gaji_min: 1000000,
        gaji_max: 1800000,
        deskripsi: `• Mengikuti program pelatihan intensif Standar Operasional KEOS (Grooming, QC 8 Titik, K3 ESD).
• Mendampingi teknisi senior dalam proses bongkar-pasang laptop dan PC desktop.
• Membantu proses deep cleaning fan, casing, keyboard, dan penggantian pasta thermal.
• Membantu proses instalasi sistem operasi dan pengujian perangkat pasca servis.`,
        kualifikasi: `• Terbuka untuk siswa/mahasiswa aktif SMK TKJ / Elektronika atau Fresh Graduate yang ingin belajar serius.
• Memiliki antusiasme tinggi terhadap dunia hardware & komputer.
• Rajin, jujur, mau dibimbing, dan memiliki rasa ingin tahu yang besar.
• Uang saku bulanan + sertifikat magang resmi + kesempatan diangkat menjadi staf tetap.`,
    }
];

// Generate copy-ready text formatted for WhatsApp, Glints, Jobstreet, or Social Media
export function generateBroadcastText(job, companyName = "KomputerAwet / Yangversa Computer", customContact = "") {
    if (!job) return "";

    const formatCurrency = (val) => {
        if (!val) return "Negotiable";
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
    };

    const gajiText = job.gaji_min > 0 
        ? `${formatCurrency(job.gaji_min)} - ${formatCurrency(job.gaji_max)} / bulan`
        : "Kompetitif / Sesuai Pengalaman";

    // Clean phone number for WhatsApp link
    const rawPhone = customContact || job.nomor_kontak || "";
    let cleanDigits = rawPhone.replace(/\D/g, "");
    if (cleanDigits.startsWith("0")) {
        cleanDigits = "62" + cleanDigits.slice(1);
    } else if (cleanDigits.startsWith("8")) {
        cleanDigits = "62" + cleanDigits;
    }
    const waLink = cleanDigits ? `wa.me/${cleanDigits}` : "wa.me/628123456789";
    const phoneLabel = rawPhone ? rawPhone : "0812-3456-7890 (WhatsApp HR)";

    return `*INFORMASI LOWONGAN KERJA: ${job.judul_posisi.toUpperCase()}*
• Perusahaan: ${companyName}
• Lokasi: ${job.lokasi || "Workshop Utama"} (${job.tipe_kerja || "Full Time"})
• Departemen: ${job.departemen || "Teknisi"}
• Estimasi Gaji: ${gajiText}

━━━━━━━━━━━━━━━━━━━━━━━━━━
*DESKRIPSI & TANGGUNG JAWAB:*
${job.deskripsi || "- Bertanggung jawab sesuai posisi pekerjaan."}

━━━━━━━━━━━━━━━━━━━━━━━━━━
*KUALIFIKASI & SYARAT:*
${job.kualifikasi || "- Disiplin, jujur, dan memiliki motivasi kerja tinggi."}

━━━━━━━━━━━━━━━━━━━━━━━━━━
*BENEFIT & FASILITAS:*
• Gaji pokok + Insentif performa unit servis
• Lingkungan kerja modern & workshop ber-AC
• Sistem kerja terstruktur (SOP & sistem Serv.io)
• Akses modul training & pengembangan karir tim

━━━━━━━━━━━━━━━━━━━━━━━━━━
*CARA MELAMAR:*
Kirimkan CV / Biodata singkat Anda langsung ke WhatsApp kami:
• Narahubung / HR: ${phoneLabel}
• Link Pendaftaran Cepat: ${waLink}?text=Halo%20Admin,%20saya%20ingin%20melamar%20posisi%20${encodeURIComponent(job.judul_posisi)}
Atau datang langsung membawa berkas CV ke Workshop ${companyName}.

*Lowongan ini tidak dipungut biaya apapun (GRATIS). Silakan bagikan ke rekan atau kerabat yang membutuhkan!*`;
}

