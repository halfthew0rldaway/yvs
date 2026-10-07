const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrate() {
    console.log("Starting migration...");
    const spareparts = await prisma.sparepart.findMany();
    
    // Known brands
    const brandNames = [
        "Acer", "ADATA", "AMD", "Arctic", "ASUS", "Canon", 
        "Cooler Master", "Corsair", "Crucial", "DeepCool", 
        "Dell", "Epson", "FSP", "Gigabyte", "HP", "Intel", 
        "Kingston", "Lenovo", "Logitech", "MSI", "Samsung", 
        "Seagate", "Team", "TP-Link", "WD", "Lexar", "Toshiba", "Fantech", "UGREEN", "ORICO", "SanDisk"
    ];

    // Ensure brands exist
    for (const name of brandNames) {
        await prisma.brand.upsert({
            where: { nama: name },
            update: {},
            create: { nama: name }
        });
    }

    const brands = await prisma.brand.findMany();
    const brandMap = new Map();
    for (const b of brands) {
        brandMap.set(b.nama.toLowerCase(), b);
    }

    for (const sp of spareparts) {
        let matchedBrand = null;
        let newName = sp.nama;

        // Find the longest matching brand at the start of the string
        for (const brand of brands) {
            const regex = new RegExp("^" + brand.nama + "\\s+", "i");
            if (regex.test(sp.nama)) {
                if (!matchedBrand || brand.nama.length > matchedBrand.nama.length) {
                    matchedBrand = brand;
                }
            }
        }

        if (matchedBrand) {
            const regex = new RegExp("^" + matchedBrand.nama + "\\s+", "i");
            newName = sp.nama.replace(regex, "");
        } else {
            // Fallback for Custom Build or unknown brands
            const genericBrand = await prisma.brand.upsert({
                where: { nama: "Lainnya" },
                update: {},
                create: { nama: "Lainnya" }
            });
            matchedBrand = genericBrand;
        }

        await prisma.sparepart.update({
            where: { id: sp.id },
            data: {
                brand_id: matchedBrand.id,
                nama: newName
            }
        });
        console.log("Migrated: " + sp.nama + " -> [" + matchedBrand.nama + "] " + newName);
    }

    console.log("Migration complete!");
    process.exit(0);
}

migrate();
