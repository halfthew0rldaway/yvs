const test = require("node:test");
const assert = require("node:assert/strict");
const { validateSubmission } = require("../../src/controllers/customer-registration.controller");

const complete = {
    nama: "Budi Santoso", nomor_telepon: "+62 812-3456-7890", alamat: "Jl. Raya Pekayon 25",
    jenis_perangkat: "laptop", merek: "asus", model: "VivoBook 14",
    keluhan: "Laptop tidak dapat menyala setelah tombol power ditekan",
    harapan: "Data tetap aman"
};

test("QR registration maps customer and device fields to canonical database values", () => {
    const result = validateSubmission(complete);
    assert.equal(result.nama, "Budi Santoso");
    assert.equal(result.nomor_telepon, "081234567890");
    assert.equal(result.jenis_perangkat, "Laptop");
    assert.equal(result.merek, "ASUS");
    assert.equal(result.keluhan, complete.keluhan);
    assert.equal(validateSubmission({ ...complete, serial_number: "CUSTOMER-INPUT" }).serial_number, undefined);
});

test("QR registration requires address, device category and a useful complaint", () => {
    assert.equal(validateSubmission({ ...complete, alamat: "" }), "Alamat wajib diisi");
    assert.equal(validateSubmission({ ...complete, jenis_perangkat: "" }), "Jenis perangkat wajib diisi");
    assert.equal(validateSubmission({ ...complete, keluhan: "rusak" }), "Keluhan harus 10-1000 karakter");
});

test("QR registration validates device and contact limits before review", () => {
    assert.equal(validateSubmission({ ...complete, nomor_telepon: "123" }), "Nomor telepon tidak valid");
    assert.equal(validateSubmission({ ...complete, merek: "" }), "Merek perangkat wajib diisi (maksimal 100 karakter)");
    assert.equal(validateSubmission({ ...complete, harapan: "x".repeat(1001) }), "Harapan maksimal 1000 karakter");
});
