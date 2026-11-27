const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// Load real database module so we can stub Prisma methods in-memory without a live MySQL server
const prisma = require("../../src/config/database");
const { PERMISSIONS } = require("../../src/config/permissions");
const tiketController = require("../../src/controllers/tiket-servis.controller");
const diagnosisController = require("../../src/controllers/diagnosis.controller");
const sparepartController = require("../../src/controllers/sparepart.controller");
const invoiceController = require("../../src/controllers/invoice.controller");
const trackingController = require("../../src/controllers/tracking.controller");
const dashboardController = require("../../src/controllers/dashboard.controller");
const userController = require("../../src/controllers/user.controller");

function makeRes() {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        set() {
            return this;
        },
    };
    return res;
}

function makeAuth(role = "admin", extraPerms = []) {
    const all = PERMISSIONS.map((p) => p[0]);
    if (role === "superadmin") {
        return { is_super_admin: true, permissions: all };
    }
    if (role === "teknisi") {
        const techPerms = [
            "dashboard.view",
            "tickets.view",
            "tickets.claim",
            "tickets.diagnosis",
            "tickets.repair",
            "tickets.qc",
            "inventory.view",
            ...extraPerms,
        ];
        return { is_super_admin: false, permissions: techPerms };
    }
    return { is_super_admin: false, permissions: [...all, ...extraPerms] };
}

function matchesWhere(row, where) {
    if (!where || Object.keys(where).length === 0) return true;
    for (const [key, cond] of Object.entries(where)) {
        if (key === "AND") {
            if (!cond.every((c) => matchesWhere(row, c))) return false;
            continue;
        }
        if (key === "OR") {
            if (!cond.some((c) => matchesWhere(row, c))) return false;
            continue;
        }
        if (cond === undefined) continue;
        const val = row[key];
        if (cond === null) {
            if (val !== null && val !== undefined) return false;
            continue;
        }
        if (typeof cond === "object" && !(cond instanceof Date)) {
            if ("not" in cond) {
                if (cond.not === null ? (val === null || val === undefined) : val === cond.not) return false;
            }
            if ("in" in cond && !cond.in.includes(val)) return false;
            if ("notIn" in cond && cond.notIn.includes(val)) return false;
            if ("gt" in cond && !(val > cond.gt)) return false;
            if ("gte" in cond && !(val >= cond.gte)) return false;
            if ("lt" in cond && !(val < cond.lt)) return false;
            if ("lte" in cond && !(val <= cond.lte)) return false;
            if ("contains" in cond && !String(val || "").toLowerCase().includes(String(cond.contains).toLowerCase())) {
                return false;
            }
            if ("startsWith" in cond && !String(val || "").startsWith(String(cond.startsWith))) {
                return false;
            }
            continue;
        }
        if (val !== cond) return false;
    }
    return true;
}

/**
 * Stateful in-memory Prisma harness for deterministic A-to-Z business-flow verification.
 * Runs real Express controller logic end-to-end without requiring a live MySQL instance.
 */
function createStatefulPrismaMock() {
    const db = {
        users: [
            { id: 1, nama: "Admin YVS", username: "admin", email: "admin@yvs.local", role: "admin", is_super_admin: true, foto_profile: null, created_at: new Date("2026-01-01T00:00:00Z") },
            { id: 2, nama: "Budi Teknisi", username: "budi", email: "budi@yvs.local", role: "teknisi", is_super_admin: false, foto_profile: null, created_at: new Date("2026-01-01T00:00:00Z") },
        ],
        customers: [
            { id: 10, nama: "Rizka Elinda", nomor_telepon: "081234567890", alamat: "Pekayon Bekasi", tipe_kepribadian: "Ramah", is_active: true, deleted_at: null, created_at: new Date("2026-01-10T00:00:00Z") },
        ],
        perangkats: [
            { id: 20, customer_id: 10, jenis_perangkat: "Laptop", merek: "Lenovo", model: "ThinkPad X1 Carbon", serial_number: "PF3K991234", created_at: new Date("2026-01-10T00:00:00Z") },
        ],
        tikets: [],
        diagnoses: [],
        logs: [],
        spareparts: [
            { id: 30, nama: "SSD NVMe 512GB", kategori: "Storage", brand_id: 1, brand: { id: 1, nama: "Kingston" }, stok: 5, harga: 650000, harga_beli: 480000, is_active: true },
        ],
        penggunaanSparepart: [],
        invoices: [],
        promotions: [
            {
                id: 40,
                kode_promo: "HEMATJASA20",
                nama_promo: "Diskon Jasa 20% Express",
                tipe_diskon: "persen",
                nilai_diskon: 20,
                cakupan_diskon: "jasa",
                maksimal_diskon: 100000,
                minimal_transaksi: 200000,
                kategori_perangkat: "Semua",
                tipe_tiket: "Semua",
                tanggal_mulai: new Date("2026-01-01T00:00:00Z"),
                tanggal_selesai: new Date("2027-12-31T23:59:59Z"),
                kuota_total: 10,
                kuota_terpakai: 0,
                satu_kali_per_pelanggan: true,
                tampil_di_tracking: true,
                is_active: true,
                saluran_promosi: "WhatsApp",
            },
        ],
        loaners: [],
        notifications: [],
        activityLogs: [],
        wikis: [],
    };

    let seq = 100;
    const nextId = () => ++seq;

    const hydratePerangkat = (p) => {
        if (!p) return null;
        return { ...p, customer: db.customers.find((c) => c.id === p.customer_id) || null };
    };

    const hydrateUsage = (u) => ({
        ...u,
        sparepart: db.spareparts.find((s) => s.id === u.sparepart_id) || null,
    });

    const hydrateInvoice = (inv) => {
        if (!inv) return null;
        const t = db.tikets.find((x) => x.id === inv.tiket_id) || null;
        return {
            ...inv,
            promotion: inv.promotion_id ? db.promotions.find((p) => p.id === inv.promotion_id) || null : null,
            tiket: t
                ? {
                      ...t,
                      perangkat: hydratePerangkat(db.perangkats.find((p) => p.id === t.perangkat_id)),
                      penggunaan_sparepart: db.penggunaanSparepart.filter((u) => u.tiket_id === t.id).map(hydrateUsage),
                      teknisi: db.users.find((u) => u.id === t.teknisi_id) || null,
                  }
                : null,
        };
    };

    const hydrateTiket = (t) => {
        if (!t) return null;
        const inv = db.invoices.find((i) => i.tiket_id === t.id) || null;
        return {
            ...t,
            perangkat: hydratePerangkat(db.perangkats.find((p) => p.id === t.perangkat_id)),
            teknisi: db.users.find((u) => u.id === t.teknisi_id) || null,
            diagnosis: db.diagnoses.find((d) => d.tiket_id === t.id) || null,
            log_perbaikan: db.logs.filter((l) => l.tiket_id === t.id),
            penggunaan_sparepart: db.penggunaanSparepart.filter((u) => u.tiket_id === t.id).map(hydrateUsage),
            invoice: inv ? { ...inv, promotion: inv.promotion_id ? db.promotions.find((p) => p.id === inv.promotion_id) || null : null } : null,
        };
    };

    const mock = {
        db,
        $transaction: async (fn) => fn(mock),
        customer: {
            count: async () => db.customers.length,
            findUnique: async ({ where }) => db.customers.find((c) => matchesWhere(c, where)) || null,
        },
        perangkat: {
            count: async () => db.perangkats.length,
            findUnique: async ({ where }) => hydratePerangkat(db.perangkats.find((p) => matchesWhere(p, where))),
        },
        user: {
            findUnique: async ({ where }) => db.users.find((u) => matchesWhere(u, where)) || null,
            findMany: async () =>
                db.users
                    .filter((u) => u.role === "teknisi")
                    .map((u) => ({
                        ...u,
                        tiket_servis: db.tikets.filter((t) => t.teknisi_id === u.id).map(hydrateTiket),
                    })),
        },
        tiketServis: {
            count: async ({ where } = {}) => db.tikets.filter((t) => matchesWhere(t, where)).length,
            findUnique: async ({ where }) => hydrateTiket(db.tikets.find((t) => matchesWhere(t, where))),
            findFirst: async ({ where, orderBy } = {}) => {
                let list = db.tikets.filter((t) => matchesWhere(t, where));
                if (orderBy?.id === "desc") list = [...list].sort((a, b) => b.id - a.id);
                return hydrateTiket(list[0] || null);
            },
            findMany: async ({ where, take } = {}) => {
                let list = db.tikets.filter((t) => matchesWhere(t, where)).map(hydrateTiket);
                if (take) list = list.slice(0, take);
                return list;
            },
            groupBy: async ({ where } = {}) => {
                const counts = new Map();
                for (const t of db.tikets.filter((x) => matchesWhere(x, where))) {
                    counts.set(t.status, (counts.get(t.status) || 0) + 1);
                }
                return Array.from(counts.entries()).map(([status, c]) => ({ status, _count: { _all: c } }));
            },
            create: async ({ data }) => {
                const row = {
                    id: nextId(),
                    created_at: new Date(),
                    completed_at: null,
                    tgl_diambil: null,
                    garansi_berakhir_at: null,
                    durasi_garansi: "1 Bulan",
                    disetujui_at: null,
                    rating_teknisi: null,
                    rating_submitted_at: null,
                    is_garansi_claim: false,
                    checklist_qc: null,
                    foto_handover: null,
                    ...data,
                };
                db.tikets.push(row);
                return hydrateTiket(row);
            },
            update: async ({ where, data }) => {
                const row = db.tikets.find((t) => matchesWhere(t, where));
                if (!row) throw new Error("Tiket not found");
                for (const [k, v] of Object.entries(data)) {
                    if (v !== undefined) row[k] = v;
                }
                return hydrateTiket(row);
            },
        },
        diagnosis: {
            findUnique: async ({ where }) => db.diagnoses.find((d) => matchesWhere(d, where)) || null,
            findMany: async () => db.diagnoses,
            create: async ({ data }) => {
                const row = { id: nextId(), created_at: new Date(), ...data };
                db.diagnoses.push(row);
                return row;
            },
        },
        logPerbaikan: {
            findFirst: async ({ where }) => db.logs.find((l) => matchesWhere(l, where)) || null,
            create: async ({ data }) => {
                const row = { id: nextId(), created_at: new Date(), ...data };
                db.logs.push(row);
                return row;
            },
        },
        sparepart: {
            findUnique: async ({ where }) => db.spareparts.find((s) => matchesWhere(s, where)) || null,
            findMany: async ({ where } = {}) => db.spareparts.filter((s) => matchesWhere(s, where)),
            update: async ({ where, data }) => {
                const row = db.spareparts.find((s) => matchesWhere(s, where));
                if (!row) throw new Error("Sparepart not found");
                for (const [k, v] of Object.entries(data)) {
                    if (v && typeof v === "object" && "decrement" in v) row[k] -= v.decrement;
                    else if (v && typeof v === "object" && "increment" in v) row[k] += v.increment;
                    else if (v !== undefined) row[k] = v;
                }
                return row;
            },
        },
        penggunaanSparepart: {
            findUnique: async ({ where }) => {
                const row = db.penggunaanSparepart.find((u) => matchesWhere(u, where));
                if (!row) return null;
                return {
                    ...hydrateUsage(row),
                    tiket: db.tikets.find((t) => t.id === row.tiket_id) || null,
                };
            },
            findMany: async ({ where } = {}) =>
                db.penggunaanSparepart.filter((u) => matchesWhere(u, where)).map(hydrateUsage),
            upsert: async ({ where, update, create }) => {
                const key = where.tiket_id_sparepart_id;
                let row = db.penggunaanSparepart.find(
                    (u) => u.tiket_id === key.tiket_id && u.sparepart_id === key.sparepart_id
                );
                if (row) {
                    if (update.jumlah?.increment) row.jumlah += update.jumlah.increment;
                } else {
                    row = { id: nextId(), ...create };
                    db.penggunaanSparepart.push(row);
                }
                return hydrateUsage(row);
            },
            delete: async ({ where }) => {
                const idx = db.penggunaanSparepart.findIndex((u) => matchesWhere(u, where));
                if (idx >= 0) db.penggunaanSparepart.splice(idx, 1);
            },
        },
        invoice: {
            findUnique: async ({ where }) => hydrateInvoice(db.invoices.find((i) => matchesWhere(i, where))),
            findFirst: async ({ where }) => {
                const found = db.invoices.find((i) => {
                    if (where.promotion_id && i.promotion_id !== where.promotion_id) return false;
                    const t = db.tikets.find((x) => x.id === i.tiket_id);
                    if (where.tiket?.status?.not && t?.status === where.tiket.status.not) return false;
                    if (where.tiket?.perangkat?.customer_id && t) {
                        const dev = db.perangkats.find((p) => p.id === t.perangkat_id);
                        if (dev?.customer_id !== where.tiket.perangkat.customer_id) return false;
                    }
                    return true;
                });
                return hydrateInvoice(found || null);
            },
            findMany: async ({ where } = {}) => db.invoices.filter((i) => matchesWhere(i, where)).map(hydrateInvoice),
            aggregate: async ({ where } = {}) => {
                const sum = db.invoices
                    .filter((i) => matchesWhere(i, where))
                    .reduce((acc, i) => acc + (i.total_biaya || 0), 0);
                return { _sum: { total_biaya: sum } };
            },
            create: async ({ data }) => {
                const row = { id: nextId(), created_at: new Date(), ttd_customer: null, ttd_admin: null, ...data };
                db.invoices.push(row);
                return hydrateInvoice(row);
            },
            update: async ({ where, data }) => {
                const row = db.invoices.find((i) => matchesWhere(i, where));
                if (!row) throw new Error("Invoice not found");
                for (const [k, v] of Object.entries(data)) {
                    if (v !== undefined) row[k] = v;
                }
                return hydrateInvoice(row);
            },
        },
        promotion: {
            findUnique: async ({ where }) => db.promotions.find((p) => matchesWhere(p, where)) || null,
            findMany: async ({ where } = {}) => db.promotions.filter((p) => matchesWhere(p, where)),
            updateMany: async ({ where, data }) => {
                let count = 0;
                for (const p of db.promotions) {
                    if (where.id !== undefined && p.id !== where.id) continue;
                    if (where.is_active !== undefined && p.is_active !== where.is_active) continue;
                    if (where.kuota_terpakai?.lt !== undefined && !(p.kuota_terpakai < where.kuota_terpakai.lt)) continue;
                    if (where.kuota_terpakai?.gt !== undefined && !(p.kuota_terpakai > where.kuota_terpakai.gt)) continue;
                    if (data.kuota_terpakai?.increment) p.kuota_terpakai += data.kuota_terpakai.increment;
                    if (data.kuota_terpakai?.decrement) p.kuota_terpakai -= data.kuota_terpakai.decrement;
                    count++;
                }
                return { count };
            },
        },
        loanerRecord: {
            findFirst: async ({ where }) => db.loaners.find((l) => matchesWhere(l, where)) || null,
        },
        notification: {
            create: async ({ data }) => {
                const row = { id: nextId(), created_at: new Date(), ...data };
                db.notifications.push(row);
                return row;
            },
        },
        activityLog: {
            findMany: async () => db.activityLogs,
            create: async ({ data }) => {
                const row = { id: nextId(), created_at: new Date(), ...data };
                db.activityLogs.push(row);
                return row;
            },
        },
        repairWiki: {
            count: async () => db.wikis.length,
        },
        customerRegistration: {
            findFirst: async () => null,
            updateMany: async () => ({ count: 0 }),
        },
    };

    return mock;
}

describe("E2E-A2Z: Full Workshop Business Flow, KPI Sync & Post-Handover Retention", () => {
    it("verifies Intake -> Diagnosis -> Public ACC -> Parts -> QC -> Invoice/Promo -> Handover -> KPI -> Post-Service CRM", async () => {
        const mock = createStatefulPrismaMock();
        const originals = {};
        const keys = [
            "$transaction",
            "customer",
            "perangkat",
            "user",
            "tiketServis",
            "diagnosis",
            "logPerbaikan",
            "sparepart",
            "penggunaanSparepart",
            "invoice",
            "promotion",
            "loanerRecord",
            "notification",
            "activityLog",
            "repairWiki",
            "customerRegistration",
        ];

        for (const k of keys) {
            originals[k] = prisma[k];
            prisma[k] = mock[k];
        }

        try {
            const adminUser = { id: 1, nama: "Admin YVS", role: "admin" };
            const techUser = { id: 2, nama: "Budi Teknisi", role: "teknisi" };

            // =================================================================
            // STAGE A: INTAKE (Barang & Jasa Masuk)
            // =================================================================
            const resIntake = makeRes();
            await tiketController.create(
                {
                    user: adminUser,
                    authorization: makeAuth("admin"),
                    body: {
                        perangkat_id: 20,
                        teknisi_id: 2,
                        keluhan: "Laptop overheat & SSD tidak terdeteksi",
                        kelengkapan: "Unit + Charger USB-C 65W + Tas",
                        kelengkapan_detail: JSON.stringify([{ label: "Charger 65W", checked: true }, { label: "Tas", checked: true }]),
                        sla_paket: "express",
                    },
                },
                resIntake
            );
            assert.equal(resIntake.statusCode, 201, `Intake failed: ${JSON.stringify(resIntake.body)}`);
            const tiketId = resIntake.body.data.id;
            const nomorTiket = resIntake.body.data.nomor_tiket;
            assert.equal(resIntake.body.data.status, "diterima");
            assert.equal(resIntake.body.data.sla_paket, "express");
            assert.ok(resIntake.body.data.target_pengecekan_at, "SLA pengecekan must be set at intake");

            // Backdate created_at by 12 hours so KPI turnaround duration is measurably > 0
            mock.db.tikets[0].created_at = new Date(Date.now() - 12 * 3600 * 1000);

            // =================================================================
            // STAGE B: DIAGNOSIS -> PUBLIC ACC -> REPAIR & PARTS -> QC -> SELESAI
            // =================================================================
            const resDiag = makeRes();
            await diagnosisController.create(
                {
                    user: techUser,
                    authorization: makeAuth("teknisi"),
                    body: {
                        tiket_id: tiketId,
                        masalah: "SSD NVMe rusak & pasta termal kering",
                        solusi: "Ganti SSD NVMe 512GB + Deep Clean & Repaste",
                        estimasi_biaya: 900000,
                    },
                },
                resDiag
            );
            assert.equal(resDiag.statusCode, 201);
            assert.equal(mock.db.tikets[0].status, "didiagnosis");
            assert.ok(mock.db.logs.some((l) => l.tiket_id === tiketId && l.fase === "Diagnosis"));

            // Transition to menunggu_persetujuan (pauses SLA until customer ACC)
            const resWaitAcc = makeRes();
            await tiketController.update(
                {
                    params: { id: String(tiketId) },
                    user: adminUser,
                    authorization: makeAuth("admin"),
                    body: { status: "menunggu_persetujuan" },
                },
                resWaitAcc
            );
            assert.equal(resWaitAcc.statusCode, 200);
            assert.equal(mock.db.tikets[0].status, "menunggu_persetujuan");

            // Public customer approval with wrong 4-digit WA must fail with 403
            const resBadAcc = makeRes();
            await trackingController.respondDiagnosisApproval(
                { body: { nomorTiket, action: "approve", phone_last4: "0000" } },
                resBadAcc
            );
            assert.equal(resBadAcc.statusCode, 403);

            // Public customer approval with valid 4-digit WA transitions to disetujui + starts SLA pengerjaan
            const resGoodAcc = makeRes();
            await trackingController.respondDiagnosisApproval(
                { body: { nomorTiket, action: "approve", phone_last4: "7890" } },
                resGoodAcc
            );
            assert.equal(resGoodAcc.statusCode, 200);
            assert.equal(mock.db.tikets[0].status, "disetujui");
            assert.ok(mock.db.tikets[0].disetujui_at, "disetujui_at must be stamped on online ACC");
            assert.ok(mock.db.tikets[0].target_selesai_at, "target_selesai_at must be computed on online ACC");

            // Technician starts repair
            const resRepair = makeRes();
            await tiketController.update(
                {
                    params: { id: String(tiketId) },
                    user: techUser,
                    authorization: makeAuth("teknisi"),
                    body: { status: "dalam_perbaikan" },
                },
                resRepair
            );
            assert.equal(resRepair.statusCode, 200);

            // Technician consumes 1x SSD NVMe 512GB (stok 5 -> 4)
            const resUsePart = makeRes();
            await sparepartController.use(
                {
                    user: techUser,
                    authorization: makeAuth("teknisi"),
                    body: { tiket_id: tiketId, sparepart_id: 30, jumlah: 1 },
                },
                resUsePart
            );
            assert.equal(resUsePart.statusCode, 201);
            assert.equal(mock.db.spareparts[0].stok, 4, "Inventory stock must decrement atomically");

            // Finishing without repair log must be blocked
            const resNoLogFinish = makeRes();
            await tiketController.update(
                {
                    params: { id: String(tiketId) },
                    user: techUser,
                    authorization: makeAuth("teknisi"),
                    body: { status: "selesai" },
                },
                resNoLogFinish
            );
            assert.equal(resNoLogFinish.statusCode, 400);

            // Add repair log & complete with passed QC
            mock.db.logs.push({ id: 999, tiket_id: tiketId, fase: "Perbaikan", catatan: "Ganti SSD & install OS selesai" });
            const resFinish = makeRes();
            await tiketController.update(
                {
                    params: { id: String(tiketId) },
                    user: techUser,
                    authorization: makeAuth("teknisi"),
                    body: { status: "selesai", checklist_qc: { passed_qc: true } },
                },
                resFinish
            );
            assert.equal(resFinish.statusCode, 200);
            assert.ok(mock.db.tikets[0].completed_at, "completed_at must be set when status becomes selesai");

            // =================================================================
            // STAGE C: INVOICING (HPP-SAFE PROMO) & HANDOVER INTERLOCKS
            // =================================================================
            // Handover BEFORE invoice creation must be blocked
            const resNoInvHandover = makeRes();
            await tiketController.update(
                {
                    params: { id: String(tiketId) },
                    user: adminUser,
                    authorization: makeAuth("admin"),
                    body: { status: "diambil" },
                },
                resNoInvHandover
            );
            assert.equal(resNoInvHandover.statusCode, 400);

            // Create invoice with jasa-only 20% promo (jasa 250k -> 50k disc; sparepart 650k untouched -> total 850k)
            const resInv = makeRes();
            await invoiceController.create(
                {
                    user: adminUser,
                    authorization: makeAuth("admin"),
                    body: {
                        tiket_id: tiketId,
                        biaya_jasa: 250000,
                        kode_promo: "HEMATJASA20",
                        nominal_dp: 850000,
                        metode_pembayaran: "QRIS",
                    },
                },
                resInv
            );
            assert.equal(resInv.statusCode, 201, `Invoice failed: ${JSON.stringify(resInv.body)}`);
            assert.equal(resInv.body.data.biaya_sparepart, 650000);
            assert.equal(resInv.body.data.diskon, 50000, "Promo 20% jasa-only must not discount sparepart HPP");
            assert.equal(resInv.body.data.total_biaya, 850000);
            assert.equal(resInv.body.data.status_pembayaran, "lunas");
            assert.equal(mock.db.promotions[0].kuota_terpakai, 1, "Promo quota must increment on invoice creation");

            // Public customer self-signature (Sign-to-Unlock)
            const resSign = makeRes();
            await trackingController.signCustomerInvoice(
                {
                    body: {
                        nomorTiket,
                        phone_last4: "7890",
                        signature: "data:image/png;base64,iVBORw0KGgo=",
                        signer_nama: "Rizka Elinda",
                    },
                },
                resSign
            );
            assert.equal(resSign.statusCode, 200);

            // Second signature attempt must be blocked (immutability)
            const resSignDup = makeRes();
            await trackingController.signCustomerInvoice(
                {
                    body: {
                        nomorTiket,
                        phone_last4: "7890",
                        signature: "data:image/png;base64,iVBORw0KGgo=",
                    },
                },
                resSignDup
            );
            assert.equal(resSignDup.statusCode, 400);

            // Active loaner interlock must block handover
            mock.db.loaners.push({ id: 50, tiket_id: tiketId, status: "aktif", loaner_device: { kode_unit: "LOAN-01", nama: "ThinkPad Backup" } });
            const resLoanerBlock = makeRes();
            await tiketController.update(
                {
                    params: { id: String(tiketId) },
                    user: adminUser,
                    authorization: makeAuth("admin"),
                    body: { status: "diambil" },
                },
                resLoanerBlock
            );
            assert.equal(resLoanerBlock.statusCode, 400);

            // Return loaner & execute handover selesai -> diambil
            mock.db.loaners[0].status = "dikembalikan";
            const completedAtBeforeHandover = mock.db.tikets[0].completed_at;
            const resHandover = makeRes();
            await tiketController.update(
                {
                    params: { id: String(tiketId) },
                    user: adminUser,
                    authorization: makeAuth("admin"),
                    body: { status: "diambil", nama_penerima: "Rizka Elinda" },
                },
                resHandover
            );
            assert.equal(resHandover.statusCode, 200);
            assert.equal(mock.db.tikets[0].status, "diambil");
            assert.ok(mock.db.tikets[0].tgl_diambil, "tgl_diambil must be set on handover");
            assert.ok(mock.db.tikets[0].garansi_berakhir_at, "garansi_berakhir_at must be set on handover");
            assert.equal(
                mock.db.tikets[0].completed_at,
                completedAtBeforeHandover,
                "CRITICAL KPI SYNC: transitioning selesai -> diambil MUST preserve completed_at"
            );

            // =================================================================
            // STAGE D: TECHNICIAN & ADMIN KPI SYNC + PUBLIC CSAT RATING
            // =================================================================
            const resRating = makeRes();
            await trackingController.submitRating(
                { body: { nomorTiket, rating: 5, phone_last4: "7890" } },
                resRating
            );
            assert.equal(resRating.statusCode, 200);
            assert.equal(mock.db.tikets[0].rating_teknisi, 5);

            // Admin dashboard KPI check
            const resAdminDash = makeRes();
            await dashboardController.adminDashboard({ user: adminUser, authorization: makeAuth("admin") }, resAdminDash);
            assert.equal(resAdminDash.statusCode, 200);
            assert.equal(resAdminDash.body.tiketSelesai, 1);
            assert.equal(resAdminDash.body.totalTiketSelesaiDihitung, 1, "Picked-up ticket must count in Admin avg completion KPI");
            assert.ok(resAdminDash.body.rataRataHari > 0, "Admin rataRataHari must be > 0 for completed/picked-up ticket");
            assert.equal(resAdminDash.body.pendapatanBulanIni, 850000);

            // Technician dashboard KPI check
            const resTechDash = makeRes();
            await dashboardController.teknisiDashboard({ user: techUser, authorization: makeAuth("teknisi") }, resTechDash);
            assert.equal(resTechDash.statusCode, 200);
            assert.equal(resTechDash.body.tiketSelesai, 1);
            assert.ok(resTechDash.body.rataRataDurasiHari > 0, "Technician rataRataDurasiHari must include picked-up tickets");
            assert.equal(resTechDash.body.rataRataCsat, 5);
            assert.equal(resTechDash.body.totalRatedTickets, 1);

            // User performance analytics check
            const resTechPerf = makeRes();
            await userController.getTechnicianPerformance({ user: adminUser, authorization: makeAuth("admin") }, resTechPerf);
            assert.equal(resTechPerf.statusCode, 200);
            const budiKpi = resTechPerf.body.find((u) => u.id === 2);
            assert.ok(budiKpi, "Technician Budi must appear in getTechnicianPerformance");
            assert.equal(budiKpi.completedCount, 1);
            assert.equal(budiKpi.totalRevenue, 850000);
            assert.ok(budiKpi.avgRepairHours >= 11.5, `Expected ~12h repair duration, got ${budiKpi.avgRepairHours}`);
            assert.equal(budiKpi.avgRating, 5);

            // =================================================================
            // STAGE E: POST-HANDOVER WARRANTY EXPIRY & 6-MONTH MAINTENANCE RECALL
            // =================================================================
            // Seed an H-3 expiring warranty ticket & a 7-month-old maintenance recall ticket
            const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 3600 * 1000);
            const twentySevenDaysAgo = new Date(Date.now() - 27 * 24 * 3600 * 1000);
            mock.db.tikets.push({
                id: 801,
                nomor_tiket: "SRV-2026-W01",
                perangkat_id: 20,
                teknisi_id: 2,
                keluhan: "Ganti keyboard",
                status: "diambil",
                created_at: twentySevenDaysAgo,
                completed_at: twentySevenDaysAgo,
                tgl_diambil: twentySevenDaysAgo,
                durasi_garansi: "1 Bulan",
                garansi_berakhir_at: threeDaysFromNow,
                is_garansi_claim: false,
            });

            const sevenMonthsAgo = new Date(Date.now() - 215 * 24 * 3600 * 1000);
            mock.db.tikets.push({
                id: 802,
                nomor_tiket: "SRV-2026-M01",
                perangkat_id: 20,
                teknisi_id: 2,
                keluhan: "Laptop overheat kipas berdebu",
                kategori_perbaikan: "Thermal / Overheat",
                status: "diambil",
                created_at: sevenMonthsAgo,
                completed_at: sevenMonthsAgo,
                tgl_diambil: sevenMonthsAgo,
                durasi_garansi: "1 Bulan",
                garansi_berakhir_at: new Date(sevenMonthsAgo.getTime() + 30 * 24 * 3600 * 1000),
                is_garansi_claim: false,
            });

            const resExpWarranty = makeRes();
            await tiketController.getExpiringWarranties({ user: adminUser, authorization: makeAuth("admin") }, resExpWarranty);
            assert.equal(resExpWarranty.statusCode, 200);
            assert.ok(
                resExpWarranty.body.some((t) => t.nomor_tiket === "SRV-2026-W01"),
                "H-3 warranty ticket must surface in CRM expiring warranties queue"
            );

            const resMaint = makeRes();
            await tiketController.getMaintenanceDue(
                { query: { minMonths: "6" }, user: adminUser, authorization: makeAuth("admin") },
                resMaint
            );
            assert.equal(resMaint.statusCode, 200);
            const recallItem = resMaint.body.items.find((i) => i.nomor_tiket === "SRV-2026-M01");
            assert.ok(recallItem, "7-month-old picked-up ticket must surface in Maintenance Recall CRM");
            assert.equal(recallItem.urgency, "routine_6m");

            // =================================================================
            // STAGE F: CANCELLATION STOCK & PROMO QUOTA ROLLBACK
            // =================================================================
            mock.db.tikets.push({
                id: 803,
                nomor_tiket: "SRV-2026-C01",
                perangkat_id: 20,
                teknisi_id: 2,
                keluhan: "Batal servis",
                status: "dalam_perbaikan",
                created_at: new Date(),
            });
            mock.db.spareparts[0].stok = 3;
            mock.db.penggunaanSparepart.push({ id: 901, tiket_id: 803, sparepart_id: 30, jumlah: 1 });
            mock.db.invoices.push({
                id: 902,
                tiket_id: 803,
                biaya_jasa: 250000,
                biaya_sparepart: 650000,
                diskon: 50000,
                promotion_id: 40,
                total_biaya: 850000,
                status_pembayaran: "belum_lunas",
                created_at: new Date(),
            });
            mock.db.promotions[0].kuota_terpakai = 2;

            const resCancel = makeRes();
            await tiketController.update(
                {
                    params: { id: "803" },
                    user: adminUser,
                    authorization: makeAuth("admin"),
                    body: { status: "dibatalkan", alasan_batal: "Batal atas permintaan pelanggan" },
                },
                resCancel
            );
            assert.equal(resCancel.statusCode, 200);
            assert.equal(mock.db.spareparts[0].stok, 4, "Cancelling ticket must restore sparepart stock");
            assert.equal(mock.db.promotions[0].kuota_terpakai, 1, "Cancelling ticket must restore promo quota");
        } finally {
            for (const k of keys) {
                prisma[k] = originals[k];
            }
        }
    });
});
