const prisma = require("../config/database");
const { recordActivity } = require("../services/activityLog.service");

/**
 * Haversine Formula: Menghitung jarak garis lurus antara dua titik koordinat (meter)
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
    const R = 6371e3; // Radius bumi dalam meter
    const phi1 = (Number(lat1) * Math.PI) / 180;
    const phi2 = (Number(lat2) * Math.PI) / 180;
    const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
    const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

/**
 * Normalisasi tanggal ke jam 00:00:00 WIB (Asia/Jakarta) untuk pemetaan unique key (user_id + tanggal)
 */
function getTodayDate(targetDate = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    const [year, month, day] = formatter.format(targetDate).split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Mengambil total menit dari tengah malam sesuai zona waktu WIB (Asia/Jakarta)
 */
function getWibMinutesFromMidnight(d = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
    const [hour, minute] = formatter.format(d).split(":").map(Number);
    return hour * 60 + minute;
}

/**
 * Helper: Ambil atau buat default policy absensi
 */
async function getOrCreatePolicy() {
    let policy = await prisma.attendancePolicy.findFirst();
    if (!policy) {
        policy = await prisma.attendancePolicy.create({
            data: {
                nama_kantor: "Workshop Utama Pekayon",
                latitude: -6.274323,
                longitude: 106.977425,
                radius_meter: 100,
                jam_masuk: "08:30",
                toleransi_menit: 15,
                jam_pulang: "17:00",
                is_geofence_active: true,
                is_selfie_required: true
            }
        });
    }
    return policy;
}

// 1. GET /api/attendance/policy
async function getPolicy(req, res) {
    try {
        const policy = await getOrCreatePolicy();
        return res.json(policy);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat pengaturan absensi", error: error.message });
    }
}

// 2. PUT /api/attendance/policy (Admin only)
async function updatePolicy(req, res) {
    try {
        const {
            nama_kantor,
            latitude,
            longitude,
            radius_meter,
            jam_masuk,
            toleransi_menit,
            jam_pulang,
            is_geofence_active,
            is_selfie_required
        } = req.body;

        const current = await getOrCreatePolicy();
        const updated = await prisma.attendancePolicy.update({
            where: { id: current.id },
            data: {
                nama_kantor: nama_kantor || current.nama_kantor,
                latitude: latitude !== undefined ? parseFloat(latitude) : current.latitude,
                longitude: longitude !== undefined ? parseFloat(longitude) : current.longitude,
                radius_meter: radius_meter !== undefined ? parseInt(radius_meter) : current.radius_meter,
                jam_masuk: jam_masuk || current.jam_masuk,
                toleransi_menit: toleransi_menit !== undefined ? parseInt(toleransi_menit) : current.toleransi_menit,
                jam_pulang: jam_pulang || current.jam_pulang,
                is_geofence_active: is_geofence_active !== undefined ? Boolean(is_geofence_active) : current.is_geofence_active,
                is_selfie_required: is_selfie_required !== undefined ? Boolean(is_selfie_required) : current.is_selfie_required
            }
        });

        await recordActivity({
            userId: req.user.id,
            userNama: req.user.nama,
            action: `Mengubah Kebijakan Presensi & Geofencing (Radius: ${updated.radius_meter}m, Jam Masuk: ${updated.jam_masuk})`,
            entity: "presensi"
        });

        return res.json({ message: "Kebijakan presensi berhasil diperbarui", policy: updated });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memperbarui kebijakan absensi", error: error.message });
    }
}

// 3. GET /api/attendance/today (Status absensi user hari ini)
async function getTodayStatus(req, res) {
    try {
        const userId = req.user.id;
        const today = getTodayDate();
        const policy = await getOrCreatePolicy();

        const record = await prisma.attendanceRecord.findUnique({
            where: {
                user_id_tanggal: {
                    user_id: userId,
                    tanggal: today
                }
            }
        });

        // Cek apakah ada pengajuan izin/cuti yang disetujui untuk hari ini
        const activeLeave = await prisma.leaveRequest.findFirst({
            where: {
                user_id: userId,
                status: "disetujui",
                tgl_mulai: { lte: today },
                tgl_selesai: { gte: today }
            }
        });

        return res.json({
            policy,
            record,
            activeLeave,
            serverTime: new Date()
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat status presensi hari ini", error: error.message });
    }
}

// 4. POST /api/attendance/check-in
async function checkIn(req, res) {
    try {
        const userId = req.user.id;
        const today = getTodayDate();
        const now = new Date();
        const policy = await getOrCreatePolicy();

        // 1. Cek duplikasi Check-In hari ini
        const existing = await prisma.attendanceRecord.findUnique({
            where: {
                user_id_tanggal: {
                    user_id: userId,
                    tanggal: today
                }
            }
        });

        if (existing && existing.jam_masuk) {
            return res.status(400).json({
                message: `Anda sudah melakukan Check-In hari ini pada pukul ${existing.jam_masuk.toLocaleTimeString("id-ID")}`
            });
        }

        // 2. Validasi Geolocation & Geofencing
        const { latitude, longitude, device_info, catatan, is_tugas_luar, alasan_tugas_luar } = req.body;
        const userLat = latitude !== undefined && latitude !== null && latitude !== "" ? parseFloat(latitude) : null;
        const userLon = longitude !== undefined && longitude !== null && longitude !== "" ? parseFloat(longitude) : null;
        const isTugasLuar = is_tugas_luar === "true" || is_tugas_luar === true;
        const cleanAlasanTugasLuar = alasan_tugas_luar ? String(alasan_tugas_luar).trim() : null;

        let distanceMeters = 0;
        let isInRadius = true;
        let statusReview = "valid";

        if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
            distanceMeters = calculateDistanceMeters(userLat, userLon, policy.latitude, policy.longitude);
            isInRadius = distanceMeters <= policy.radius_meter;

            if (policy.is_geofence_active && !isInRadius) {
                if (!isTugasLuar) {
                    return res.status(400).json({
                        message: `Check-In ditolak: Anda berada di luar radius workshop (${distanceMeters} meter dari workshop, batas maksimal ${policy.radius_meter} meter). Jika Anda sedang bertugas di luar (antar unit/jemput sparepart/tugas luar), silakan gunakan opsi Check-In Tugas Luar.`,
                        out_of_radius: true,
                        distanceMeters,
                        maxRadius: policy.radius_meter
                    });
                }

                if (!cleanAlasanTugasLuar) {
                    return res.status(400).json({
                        message: "Alasan atau keterangan penugasan tugas luar wajib diisi saat melakukan presensi di luar radius workshop."
                    });
                }

                statusReview = "menunggu_review";
            }
        } else if (policy.is_geofence_active) {
            if (isTugasLuar && cleanAlasanTugasLuar) {
                isInRadius = false;
                statusReview = "menunggu_review";
            } else {
                return res.status(400).json({
                    message: "Akses GPS wajib diaktifkan untuk melakukan presensi. Silakan izinkan akses lokasi pada browser atau aplikasi perangkat Anda.",
                    out_of_radius: true
                });
            }
        }

        // 3. Validasi Foto Selfie
        let fotoMasukUrl = null;
        if (req.file) {
            fotoMasukUrl = `/uploads/attendance/${req.file.filename}`;
        } else if (policy.is_selfie_required) {
            return res.status(400).json({
                message: "Foto selfie wajib dilampirkan untuk verifikasi kehadiran fisik."
            });
        }

        // 4. Kalkulasi Keterlambatan
        // Policy: jam_masuk "08:30", toleransi 15 menit -> Max on-time: 08:45
        const [targetHour, targetMinute] = policy.jam_masuk.split(":").map(Number);
        const targetMinutesFromMidnight = targetHour * 60 + targetMinute;
        const maxOnTimeMinutes = targetMinutesFromMidnight + (policy.toleransi_menit || 0);

        const currentMinutesFromMidnight = getWibMinutesFromMidnight(now);

        let status = "hadir";
        let menitKeterlambatan = 0;

        if (currentMinutesFromMidnight > maxOnTimeMinutes) {
            status = "terlambat";
            menitKeterlambatan = currentMinutesFromMidnight - targetMinutesFromMidnight;
        }

        // 5. Simpan Record Presensi
        const record = await prisma.attendanceRecord.upsert({
            where: {
                user_id_tanggal: {
                    user_id: userId,
                    tanggal: today
                }
            },
            create: {
                user_id: userId,
                tanggal: today,
                jam_masuk: now,
                status,
                menit_keterlambatan: menitKeterlambatan,
                foto_masuk: fotoMasukUrl,
                latitude_masuk: userLat,
                longitude_masuk: userLon,
                jarak_meter_masuk: distanceMeters,
                is_in_radius_masuk: isInRadius,
                is_tugas_luar: isTugasLuar,
                alasan_tugas_luar: isTugasLuar ? cleanAlasanTugasLuar : null,
                status_review: statusReview,
                method: req.headers["user-agent"]?.includes("Dart") || (device_info && device_info.includes("Companion")) ? "mobile_flutter" : "web_selfie_gps",
                device_info: device_info || req.headers["user-agent"] || null,
                catatan: catatan || null
            },
            update: {
                jam_masuk: now,
                status,
                menit_keterlambatan: menitKeterlambatan,
                foto_masuk: fotoMasukUrl,
                latitude_masuk: userLat,
                longitude_masuk: userLon,
                jarak_meter_masuk: distanceMeters,
                is_in_radius_masuk: isInRadius,
                is_tugas_luar: isTugasLuar,
                alasan_tugas_luar: isTugasLuar ? cleanAlasanTugasLuar : null,
                status_review: statusReview,
                device_info: device_info || req.headers["user-agent"] || null,
                catatan: catatan || null
            }
        });

        // 6. Audit Trail
        const tugasLuarNote = isTugasLuar ? ` [TUGAS LUAR: Menunggu Review Owner, Alasan: ${cleanAlasanTugasLuar}]` : "";
        await recordActivity({
            userId,
            userNama: req.user.nama,
            action: `Check-In Presensi [Status: ${status.toUpperCase()}, Jarak: ${distanceMeters}m, Terlambat: ${menitKeterlambatan} mnt]${tugasLuarNote}`,
            entity: "presensi"
        });

        let successMsg = status === "terlambat" 
            ? `Check-In tercatat (Terlambat ${menitKeterlambatan} menit)` 
            : "Check-In berhasil! Tepat waktu.";
        if (isTugasLuar) {
            successMsg += " (Kategori Tugas Luar: Menunggu verifikasi Superadmin / Owner)";
        }

        return res.status(201).json({
            message: successMsg,
            record
        });
    } catch (error) {
        console.error("Error checkIn:", error);
        return res.status(500).json({ message: "Gagal memproses Check-In", error: error.message });
    }
}

// 5. POST /api/attendance/check-out
async function checkOut(req, res) {
    try {
        const userId = req.user.id;
        const today = getTodayDate();
        const now = new Date();
        const policy = await getOrCreatePolicy();

        // 1. Cek apakah sudah check-in hari ini
        const existing = await prisma.attendanceRecord.findUnique({
            where: {
                user_id_tanggal: {
                    user_id: userId,
                    tanggal: today
                }
            }
        });

        if (!existing || !existing.jam_masuk) {
            return res.status(400).json({
                message: "Anda belum melakukan Check-In hari ini. Harap Check-In terlebih dahulu."
            });
        }

        if (existing.jam_pulang) {
            return res.status(400).json({
                message: `Anda sudah melakukan Check-Out hari ini pada pukul ${existing.jam_pulang.toLocaleTimeString("id-ID")}`
            });
        }

        // 2. Validasi Geolocation & Geofencing
        const { latitude, longitude, catatan, is_tugas_luar, alasan_pulang_cepat } = req.body;
        const userLat = latitude !== undefined && latitude !== null && latitude !== "" ? parseFloat(latitude) : null;
        const userLon = longitude !== undefined && longitude !== null && longitude !== "" ? parseFloat(longitude) : null;
        const isTugasLuar = existing.is_tugas_luar || is_tugas_luar === "true" || is_tugas_luar === true;

        let distanceMeters = 0;
        let isInRadius = true;

        if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
            distanceMeters = calculateDistanceMeters(userLat, userLon, policy.latitude, policy.longitude);
            if (policy.is_geofence_active && distanceMeters > policy.radius_meter) {
                if (!isTugasLuar) {
                    return res.status(400).json({
                        message: `Check-Out ditolak: Anda berada di luar radius workshop (${distanceMeters} meter dari workshop, batas maksimal ${policy.radius_meter} meter).`,
                        out_of_radius: true,
                        distanceMeters,
                        maxRadius: policy.radius_meter
                    });
                }
            }
            isInRadius = distanceMeters <= policy.radius_meter;
        }

        // 3. Foto Selfie Check-Out
        let fotoPulangUrl = null;
        if (req.file) {
            fotoPulangUrl = `/uploads/attendance/${req.file.filename}`;
        }

        // 4. Kalkulasi Durasi Kerja & Pulang Lebih Awal (Wajib Review)
        const durationMinutes = Math.max(0, Math.round((now.getTime() - new Date(existing.jam_masuk).getTime()) / (1000 * 60)));

        const [pulangHour, pulangMinute] = policy.jam_pulang.split(":").map(Number);
        const targetPulangMinutes = pulangHour * 60 + pulangMinute;
        const currentMinutesFromMidnight = getWibMinutesFromMidnight(now);

        const isEarly = currentMinutesFromMidnight < targetPulangMinutes;
        const cleanAlasanEarly = alasan_pulang_cepat ? String(alasan_pulang_cepat).trim() : null;

        if (isEarly && !cleanAlasanEarly) {
            return res.status(400).json({
                message: `Anda melakukan Check-Out lebih awal sebelum jam operasional workshop berakhir (${policy.jam_pulang} WIB). Harap masukkan alasan pulang lebih awal untuk verifikasi Superadmin / Owner.`,
                is_early_checkout: true,
                target_jam_pulang: policy.jam_pulang
            });
        }

        let updatedStatus = existing.status;
        let updatedStatusReview = existing.status_review;

        if (isEarly) {
            updatedStatus = "pulang_cepat";
            updatedStatusReview = "menunggu_review"; // Wajib review Superadmin / Owner
        }

        // Format catatan pulang
        let finalCatatan = existing.catatan || "";
        if (cleanAlasanEarly) {
            const earlyNote = `[PULANG LEBIH AWAL • Jam Normal: ${policy.jam_pulang} WIB] Alasan: ${cleanAlasanEarly}`;
            finalCatatan = finalCatatan ? `${finalCatatan} | ${earlyNote}` : earlyNote;
        }
        if (catatan) {
            finalCatatan = finalCatatan ? `${finalCatatan} | ${catatan}` : catatan;
        }

        // 5. Update Record Presensi
        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: {
                jam_pulang: now,
                durasi_kerja_menit: durationMinutes,
                status: updatedStatus,
                status_review: updatedStatusReview,
                foto_pulang: fotoPulangUrl,
                latitude_pulang: userLat,
                longitude_pulang: userLon,
                jarak_meter_pulang: distanceMeters,
                is_in_radius_pulang: isInRadius,
                catatan: finalCatatan || null
            }
        });

        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;

        const earlyNoteAudit = isEarly ? ` [PULANG LEBIH AWAL: Menunggu Review Owner, Alasan: ${cleanAlasanEarly}]` : "";
        await recordActivity({
            userId,
            userNama: req.user.nama,
            action: `Check-Out Presensi [Durasi: ${hours}j ${mins}m, Status: ${updatedStatus}]${earlyNoteAudit}`,
            entity: "presensi"
        });

        let successMsg = `Check-Out berhasil! Total jam kerja: ${hours} jam ${mins} menit.`;
        if (isEarly) {
            successMsg += " (Kategori Pulang Lebih Awal: Menunggu verifikasi Superadmin / Owner)";
        }

        return res.json({
            message: successMsg,
            record: updatedRecord
        });
    } catch (error) {
        console.error("Error checkOut:", error);
        return res.status(500).json({ message: "Gagal memproses Check-Out", error: error.message });
    }
}

// 6. GET /api/attendance/my-history (Riwayat pribadi user)
async function getMyHistory(req, res) {
    try {
        const userId = req.user.id;
        const { bulan, tahun } = req.query;

        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan ? parseInt(bulan) : new Date().getMonth() + 1;

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        const records = await prisma.attendanceRecord.findMany({
            where: {
                user_id: userId,
                tanggal: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { tanggal: "desc" }
        });

        // Hitung ringkasan statistik
        let totalHadir = 0;
        let totalTerlambat = 0;
        let totalMenitTerlambat = 0;
        let totalMenitKerja = 0;

        records.forEach(r => {
            if (r.status === "hadir" || r.status === "pulang_cepat") totalHadir++;
            if (r.status === "terlambat") {
                totalHadir++;
                totalTerlambat++;
                totalMenitTerlambat += r.menit_keterlambatan;
            }
            totalMenitKerja += r.durasi_kerja_menit;
        });

        return res.json({
            records,
            stats: {
                totalHadir,
                totalTerlambat,
                totalMenitTerlambat,
                totalJamKerja: (totalMenitKerja / 60).toFixed(1)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat riwayat presensi", error: error.message });
    }
}

// 7. GET /api/attendance/daily-all (Admin & Pimpinan: Monitoring Presensi Harian Semua Karyawan)
async function getDailyAll(req, res) {
    try {
        const { tanggal } = req.query;
        const targetDate = tanggal ? getTodayDate(new Date(tanggal)) : getTodayDate();
        const policy = await getOrCreatePolicy();

        // Ambil semua karyawan aktif (admin & teknisi)
        const users = await prisma.user.findMany({
            select: {
                id: true,
                nama: true,
                email: true,
                role: true,
                foto_profile: true
            },
            orderBy: [{ role: "asc" }, { nama: "asc" }]
        });

        // Ambil presensi hari target
        const records = await prisma.attendanceRecord.findMany({
            where: { tanggal: targetDate },
            include: {
                adjusted_by: { select: { id: true, nama: true } }
            }
        });

        const recordMap = new Map();
        records.forEach(r => recordMap.set(r.user_id, r));

        // Ambil izin yang aktif di hari target
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: "disetujui",
                tgl_mulai: { lte: targetDate },
                tgl_selesai: { gte: targetDate }
            }
        });
        const leaveMap = new Map();
        leaves.forEach(l => leaveMap.set(l.user_id, l));

        let countHadir = 0;
        let countTerlambat = 0;
        let countIzin = 0;
        let countBelumAbsen = 0;

        const attendanceList = users.map(u => {
            const att = recordMap.get(u.id);
            const leave = leaveMap.get(u.id);

            let statusDisplay = "Belum Absen";
            if (att) {
                statusDisplay = att.status;
                if (att.status === "hadir" || att.status === "pulang_cepat") countHadir++;
                if (att.status === "terlambat") { countHadir++; countTerlambat++; }
            } else if (leave) {
                statusDisplay = leave.tipe; // cuti, izin, sakit
                countIzin++;
            } else {
                countBelumAbsen++;
            }

            return {
                user: u,
                attendance: att || null,
                leave: leave || null,
                statusDisplay
            };
        });

        return res.json({
            tanggal: targetDate,
            policy,
            stats: {
                totalKaryawan: users.length,
                hadir: countHadir,
                terlambat: countTerlambat,
                izin: countIzin,
                belumAbsen: countBelumAbsen
            },
            list: attendanceList
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat rekap presensi harian", error: error.message });
    }
}

// 8. GET /api/attendance/recap (Admin: Rekapitulasi Bulanan untuk Payroll)
async function getMonthlyRecap(req, res) {
    try {
        const { bulan, tahun } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan ? parseInt(bulan) : new Date().getMonth() + 1;

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        const users = await prisma.user.findMany({
            select: { id: true, nama: true, email: true, role: true, foto_profile: true },
            orderBy: [{ role: "asc" }, { nama: "asc" }]
        });

        const records = await prisma.attendanceRecord.findMany({
            where: {
                tanggal: { gte: startDate, lte: endDate }
            }
        });

        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: "disetujui",
                tgl_mulai: { lte: endDate },
                tgl_selesai: { gte: startDate }
            }
        });

        const recap = users.map(u => {
            const userRecords = records.filter(r => r.user_id === u.id);
            const userLeaves = leaves.filter(l => l.user_id === u.id);

            let hadirCount = 0;
            let terlambatCount = 0;
            let totalMenitTelat = 0;
            let totalMenitKerja = 0;

            userRecords.forEach(r => {
                if (r.status === "hadir" || r.status === "pulang_cepat") hadirCount++;
                if (r.status === "terlambat") {
                    hadirCount++;
                    terlambatCount++;
                    totalMenitTelat += r.menit_keterlambatan;
                }
                totalMenitKerja += r.durasi_kerja_menit;
            });

            let cutiCount = 0;
            let sakitCount = 0;
            let izinCount = 0;

            userLeaves.forEach(l => {
                if (l.tipe === "cuti") cutiCount += l.jumlah_hari;
                else if (l.tipe === "sakit") sakitCount += l.jumlah_hari;
                else izinCount += l.jumlah_hari;
            });

            return {
                user: u,
                hadir: hadirCount,
                terlambat: terlambatCount,
                menitKeterlambatan: totalMenitTelat,
                jamKerja: (totalMenitKerja / 60).toFixed(1),
                cuti: cutiCount,
                sakit: sakitCount,
                izin: izinCount,
                totalRecords: userRecords.length
            };
        });

        return res.json({
            periode: { bulan: currentMonth, tahun: currentYear },
            recap
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat rekap bulanan", error: error.message });
    }
}

// 9. POST /api/attendance/adjust (Admin only: Koreksi Presensi dengan Catatan Audit Anti-Fraud)
async function adjustAttendance(req, res) {
    try {
        const { record_id, user_id, tanggal, jam_masuk, jam_pulang, status, alasan_adjustment } = req.body;

        if (!alasan_adjustment || !alasan_adjustment.trim()) {
            return res.status(400).json({ message: "Alasan koreksi absensi wajib diisi sebagai rekam jejak audit!" });
        }

        const cleanAlasan = alasan_adjustment.trim();
        let targetDate = tanggal ? getTodayDate(new Date(tanggal)) : getTodayDate();

        let existingRecord = null;
        if (record_id) {
            existingRecord = await prisma.attendanceRecord.findUnique({
                where: { id: parseInt(record_id) }
            });
            if (existingRecord && existingRecord.tanggal) {
                targetDate = existingRecord.tanggal;
            }
        }

        const parseTimeOrDateTime = (val, baseDate) => {
            if (val === null || val === "") return null;
            if (typeof val === "string" && val.length <= 8 && val.includes(":")) {
                const d = new Date(baseDate);
                const parts = val.split(":");
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const s = parts[2] ? parseInt(parts[2], 10) : 0;
                d.setHours(h, m, s, 0);
                return d;
            }
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? null : parsed;
        };

        const parsedMasuk = jam_masuk !== undefined ? parseTimeOrDateTime(jam_masuk, targetDate) : undefined;
        const parsedPulang = jam_pulang !== undefined ? parseTimeOrDateTime(jam_pulang, targetDate) : undefined;

        // Hitung durasi kerja jika masuk & pulang ada
        let durasiMenit = undefined;
        if (parsedMasuk && parsedPulang && parsedPulang > parsedMasuk) {
            durasiMenit = Math.round((parsedPulang.getTime() - parsedMasuk.getTime()) / (1000 * 60));
        } else if (status === "izin" || status === "sakit" || status === "alfa") {
            durasiMenit = 0;
        }

        let record;
        if (record_id) {
            record = await prisma.attendanceRecord.update({
                where: { id: parseInt(record_id) },
                data: {
                    ...(parsedMasuk !== undefined && { jam_masuk: parsedMasuk }),
                    ...(parsedPulang !== undefined && { jam_pulang: parsedPulang }),
                    ...(status && { status }),
                    ...(durasiMenit !== undefined && { durasi_kerja_menit: durasiMenit }),
                    is_adjusted: true,
                    adjusted_by_id: req.user.id,
                    alasan_adjustment: cleanAlasan
                },
                include: { user: true }
            });
        } else if (user_id && targetDate) {
            record = await prisma.attendanceRecord.upsert({
                where: {
                    user_id_tanggal: {
                        user_id: parseInt(user_id),
                        tanggal: targetDate
                    }
                },
                create: {
                    user_id: parseInt(user_id),
                    tanggal: targetDate,
                    jam_masuk: parsedMasuk !== undefined ? parsedMasuk : (status === "hadir" ? targetDate : null),
                    jam_pulang: parsedPulang !== undefined ? parsedPulang : null,
                    status: status || "hadir",
                    method: "manual_adjustment",
                    durasi_kerja_menit: durasiMenit || 0,
                    is_adjusted: true,
                    adjusted_by_id: req.user.id,
                    alasan_adjustment: cleanAlasan
                },
                update: {
                    ...(parsedMasuk !== undefined && { jam_masuk: parsedMasuk }),
                    ...(parsedPulang !== undefined && { jam_pulang: parsedPulang }),
                    ...(status && { status }),
                    ...(durasiMenit !== undefined && { durasi_kerja_menit: durasiMenit }),
                    is_adjusted: true,
                    adjusted_by_id: req.user.id,
                    alasan_adjustment: cleanAlasan
                },
                include: { user: true }
            });
        } else {
            return res.status(400).json({ message: "Parameter koreksi tidak lengkap." });
        }

        await recordActivity({
            userId: req.user.id,
            userNama: req.user.nama,
            action: `Koreksi Presensi Karyawan #${record.user_id} (${record.user.nama}) [Alasan: ${cleanAlasan}]`,
            entity: "presensi"
        });

        return res.json({ message: "Presensi berhasil dikoreksi", record });
    } catch (error) {
        return res.status(500).json({ message: "Gagal mengoreksi presensi", error: error.message });
    }
}

// 9b. POST /api/attendance/adjust-bulk (Admin only: Koreksi Presensi Massal / Bulk dengan Catatan Audit Anti-Fraud)
async function adjustAttendanceBulk(req, res) {
    try {
        const { user_ids, tanggal, jam_masuk, jam_pulang, status, alasan_adjustment, items } = req.body;

        if (!alasan_adjustment || !alasan_adjustment.trim()) {
            return res.status(400).json({ message: "Alasan koreksi absensi massal wajib diisi sebagai rekam jejak audit!" });
        }

        const cleanAlasan = alasan_adjustment.trim();
        const targetDate = tanggal ? getTodayDate(new Date(tanggal)) : getTodayDate();

        const parseTimeOrDateTime = (val, baseDate) => {
            if (val === null || val === "") return null;
            if (typeof val === "string" && val.length <= 8 && val.includes(":")) {
                const d = new Date(baseDate);
                const parts = val.split(":");
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const s = parts[2] ? parseInt(parts[2], 10) : 0;
                d.setHours(h, m, s, 0);
                return d;
            }
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? null : parsed;
        };

        let targetUserIds = [];
        if (Array.isArray(user_ids) && user_ids.length > 0) {
            targetUserIds = user_ids.map(id => parseInt(id));
        } else if (Array.isArray(items) && items.length > 0) {
            targetUserIds = items.map(i => parseInt(i.user_id));
        }

        if (targetUserIds.length === 0) {
            return res.status(400).json({ message: "Pilih minimal 1 karyawan untuk melakukan koreksi massal!" });
        }

        const parsedMasukDefault = jam_masuk !== undefined ? parseTimeOrDateTime(jam_masuk, targetDate) : undefined;
        const parsedPulangDefault = jam_pulang !== undefined ? parseTimeOrDateTime(jam_pulang, targetDate) : undefined;

        let durasiMenitDefault = undefined;
        if (parsedMasukDefault && parsedPulangDefault && parsedPulangDefault > parsedMasukDefault) {
            durasiMenitDefault = Math.round((parsedPulangDefault.getTime() - parsedMasukDefault.getTime()) / (1000 * 60));
        } else if (status === "izin" || status === "sakit" || status === "alfa") {
            durasiMenitDefault = 0;
        }

        const updatedRecords = [];
        for (const uid of targetUserIds) {
            const itemOverride = Array.isArray(items) ? items.find(i => parseInt(i.user_id) === uid) : null;
            const itemStatus = itemOverride?.status || status || "hadir";
            const itemMasuk = itemOverride?.jam_masuk !== undefined ? parseTimeOrDateTime(itemOverride.jam_masuk, targetDate) : parsedMasukDefault;
            const itemPulang = itemOverride?.jam_pulang !== undefined ? parseTimeOrDateTime(itemOverride.jam_pulang, targetDate) : parsedPulangDefault;

            let durasi = durasiMenitDefault;
            if (itemMasuk && itemPulang && itemPulang > itemMasuk) {
                durasi = Math.round((itemPulang.getTime() - itemMasuk.getTime()) / (1000 * 60));
            } else if (itemStatus === "izin" || itemStatus === "sakit" || itemStatus === "alfa") {
                durasi = 0;
            }

            const rec = await prisma.attendanceRecord.upsert({
                where: {
                    user_id_tanggal: {
                        user_id: uid,
                        tanggal: targetDate
                    }
                },
                create: {
                    user_id: uid,
                    tanggal: targetDate,
                    jam_masuk: itemMasuk !== undefined ? itemMasuk : (itemStatus === "hadir" ? targetDate : null),
                    jam_pulang: itemPulang !== undefined ? itemPulang : null,
                    status: itemStatus,
                    method: "manual_adjustment_bulk",
                    durasi_kerja_menit: durasi || 0,
                    is_adjusted: true,
                    adjusted_by_id: req.user.id,
                    alasan_adjustment: cleanAlasan
                },
                update: {
                    ...(itemMasuk !== undefined && { jam_masuk: itemMasuk }),
                    ...(itemPulang !== undefined && { jam_pulang: itemPulang }),
                    ...(itemStatus && { status: itemStatus }),
                    ...(durasi !== undefined && { durasi_kerja_menit: durasi }),
                    is_adjusted: true,
                    adjusted_by_id: req.user.id,
                    alasan_adjustment: cleanAlasan
                },
                include: { user: { select: { id: true, nama: true, role: true } } }
            });

            updatedRecords.push(rec);
        }

        await recordActivity({
            userId: req.user.id,
            userNama: req.user.nama,
            action: `Koreksi Presensi Massal (${updatedRecords.length} karyawan) [Status: ${status || "campuran"}, Alasan: ${cleanAlasan}]`,
            entity: "presensi"
        });

        return res.json({
            message: `Berhasil mengoreksi presensi ${updatedRecords.length} karyawan secara massal!`,
            count: updatedRecords.length,
            records: updatedRecords
        });
    } catch (error) {
        console.error("Gagal koreksi presensi massal:", error);
        return res.status(500).json({ message: "Gagal mengoreksi presensi massal", error: error.message });
    }
}

// 10. LEAVE / PERMISSION CONTROLLERS
// GET /api/attendance/leaves
async function getLeaves(req, res) {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin" || req.user.role === "pimpinan";

        const where = {};
        if (!isAdmin) {
            where.user_id = userId;
        }

        const leaves = await prisma.leaveRequest.findMany({
            where,
            include: {
                user: { select: { id: true, nama: true, role: true, foto_profile: true } },
                approved_by: { select: { id: true, nama: true } }
            },
            orderBy: { created_at: "desc" }
        });

        return res.json(leaves);
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat daftar pengajuan izin", error: error.message });
    }
}

// POST /api/attendance/leaves
async function createLeave(req, res) {
    try {
        const userId = req.user.id;
        const { tipe, tgl_mulai, tgl_selesai, alasan } = req.body;

        if (!tipe || !tgl_mulai || !tgl_selesai || !alasan) {
            return res.status(400).json({ message: "Tipe izin, tanggal mulai, tanggal selesai, dan alasan wajib diisi!" });
        }

        const start = getTodayDate(new Date(tgl_mulai));
        const end = getTodayDate(new Date(tgl_selesai));

        if (end < start) {
            return res.status(400).json({ message: "Tanggal selesai tidak boleh sebelum tanggal mulai." });
        }

        // Hitung jumlah hari
        const diffTime = Math.abs(end - start);
        const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        let lampiranUrl = null;
        if (req.file) {
            lampiranUrl = `/uploads/leaves/${req.file.filename}`;
        }

        const leave = await prisma.leaveRequest.create({
            data: {
                user_id: userId,
                tipe,
                tgl_mulai: start,
                tgl_selesai: end,
                jumlah_hari: jumlahHari,
                alasan: alasan.trim(),
                lampiran_url: lampiranUrl,
                status: "menunggu"
            },
            include: { user: true }
        });

        await recordActivity({
            userId,
            userNama: req.user.nama,
            action: `Mengajukan Permohonan ${tipe.toUpperCase()} (${jumlahHari} Hari: ${tgl_mulai} s.d ${tgl_selesai})`,
            entity: "presensi"
        });

        return res.status(201).json({ message: "Pengajuan berhasil dikirim dan menunggu persetujuan", leave });
    } catch (error) {
        return res.status(500).json({ message: "Gagal mengajukan izin", error: error.message });
    }
}

// PUT /api/attendance/leaves/:id/review (Admin only: Approve/Reject)
async function reviewLeave(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { status, catatan_approver } = req.body;

        if (!status || !["disetujui", "ditolak"].includes(status)) {
            return res.status(400).json({ message: "Status harus 'disetujui' atau 'ditolak'." });
        }

        const leave = await prisma.leaveRequest.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!leave) {
            return res.status(404).json({ message: "Pengajuan izin tidak ditemukan" });
        }

        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                catatan_approver: catatan_approver ? catatan_approver.trim() : null,
                approved_by_id: req.user.id,
                approved_at: new Date()
            }
        });

        await recordActivity({
            userId: req.user.id,
            userNama: req.user.nama,
            action: `${status === "disetujui" ? "Menyetujui" : "Menolak"} Pengajuan ${leave.tipe.toUpperCase()} #${id} (${leave.user.nama})`,
            entity: "presensi"
        });

        return res.json({ message: `Pengajuan izin berhasil ${status}`, leave: updated });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memproses persetujuan izin", error: error.message });
    }
}

// 11. GET /api/attendance/pending-reviews (Admin & Pimpinan / Owner: Review Presensi Tugas Luar & Pulang Lebih Awal)
async function getPendingReviews(req, res) {
    try {
        const { status_filter } = req.query; // 'menunggu_review' | 'all' | 'valid' | 'ditolak'
        
        // Entitas yang memerlukan peninjauan: Kategori Tugas Luar ATAU Pulang Cepat ATAU status_review menunggu_review
        const baseReviewCondition = {
            OR: [
                { is_tugas_luar: true },
                { status: "pulang_cepat" },
                { status_review: "menunggu_review" }
            ]
        };

        let where = { ...baseReviewCondition };

        if (status_filter && status_filter !== "all") {
            where = {
                AND: [
                    baseReviewCondition,
                    { status_review: status_filter }
                ]
            };
        } else if (!status_filter) {
            where = {
                AND: [
                    baseReviewCondition,
                    { status_review: "menunggu_review" }
                ]
            };
        }

        const list = await prisma.attendanceRecord.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        nama: true,
                        email: true,
                        role: true,
                        foto_profile: true
                    }
                },
                reviewed_by: {
                    select: {
                        id: true,
                        nama: true
                    }
                }
            },
            orderBy: [
                { tanggal: "desc" },
                { jam_masuk: "desc" }
            ]
        });

        const pendingCount = await prisma.attendanceRecord.count({
            where: {
                AND: [
                    baseReviewCondition,
                    { status_review: "menunggu_review" }
                ]
            }
        });

        return res.json({
            pendingCount,
            list
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat daftar review presensi", error: error.message });
    }
}

// 12. PUT /api/attendance/:id/review (Admin & Pimpinan / Owner: Setujui atau Tolak Presensi Tugas Luar)
async function reviewAttendance(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { status_review, catatan_review } = req.body;

        if (!status_review || !["valid", "ditolak"].includes(status_review)) {
            return res.status(400).json({ message: "Status review harus bernilai 'valid' (disetujui) atau 'ditolak'." });
        }

        const existing = await prisma.attendanceRecord.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!existing) {
            return res.status(404).json({ message: "Data presensi tidak ditemukan." });
        }

        const updated = await prisma.attendanceRecord.update({
            where: { id },
            data: {
                status_review,
                reviewed_by_id: req.user.id,
                reviewed_at: new Date(),
                catatan_review: catatan_review ? catatan_review.trim() : null
            },
            include: {
                user: { select: { id: true, nama: true, email: true, role: true } },
                reviewed_by: { select: { id: true, nama: true } }
            }
        });

        const decisionText = status_review === "valid" ? "MENYETUJUI (VALID)" : "MENOLAK (TIDAK VALID)";

        await recordActivity({
            userId: req.user.id,
            userNama: req.user.nama,
            action: `${decisionText} Presensi Tugas Luar #${id} Karyawan ${existing.user.nama} (Tgl: ${existing.tanggal.toISOString().split("T")[0]})`,
            entity: "presensi"
        });

        return res.json({
            message: `Presensi tugas luar karyawan ${existing.user.nama} berhasil ${status_review === "valid" ? "disetujui (valid)" : "ditolak"}.`,
            record: updated
        });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memproses review presensi", error: error.message });
    }
}

module.exports = {
    getPolicy,
    updatePolicy,
    getTodayStatus,
    checkIn,
    checkOut,
    getMyHistory,
    getDailyAll,
    getMonthlyRecap,
    adjustAttendance,
    adjustAttendanceBulk,
    getLeaves,
    createLeave,
    reviewLeave,
    getPendingReviews,
    reviewAttendance
};

