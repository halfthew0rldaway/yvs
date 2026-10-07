// Menghasilkan nomor tiket unik: SRV-TAHUN-XXX
function generateNomorTiket(sequence) {
    const year = new Date().getFullYear();
    const num = String(sequence).padStart(3, "0");
    return `SRV-${year}-${num}`;
}

module.exports = { generateNomorTiket };
