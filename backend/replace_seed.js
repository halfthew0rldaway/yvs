const fs = require('fs');

const newSpareparts = `    const sparepartData = [
        // Memory
        { kategori: "Laptop, AIO", nama: "Kingston SO-DIMM DDR4 8GB 3200MHz", stok: 24, harga: 320000 },
        { kategori: "Laptop, AIO", nama: "Crucial SO-DIMM DDR4 16GB 3200MHz", stok: 12, harga: 650000 },
        { kategori: "Laptop, AIO", nama: "Samsung SO-DIMM DDR3L 8GB", stok: 8, harga: 210000 },
        { kategori: "Desktop", nama: "Kingston DIMM DDR4 8GB 3200MHz", stok: 18, harga: 310000 },
        { kategori: "Desktop", nama: "Corsair Vengeance LPX DDR4 16GB", stok: 10, harga: 720000 },
        { kategori: "Desktop", nama: "Team Elite DIMM DDR3 8GB", stok: 6, harga: 195000 },
        { kategori: "Laptop, AIO", nama: "ADATA SO-DIMM DDR4 8GB 2666MHz", stok: 15, harga: 300000 },
        { kategori: "Laptop, AIO", nama: "SK Hynix SO-DIMM DDR4 16GB 3200MHz", stok: 9, harga: 630000 },
        
        // SSD
        { kategori: "Laptop, Desktop, AIO", nama: "Kingston A400 240GB SATA", stok: 35, harga: 280000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Kingston A400 480GB SATA", stok: 20, harga: 450000 },
        { kategori: "Laptop, Desktop, AIO", nama: "WD Green 240GB SATA", stok: 28, harga: 295000 },
        { kategori: "Laptop, Desktop, AIO", nama: "WD Blue 500GB SATA", stok: 14, harga: 580000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Samsung 870 EVO 500GB", stok: 10, harga: 850000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Crucial BX500 240GB", stok: 22, harga: 275000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Team CX2 512GB", stok: 15, harga: 430000 },
        { kategori: "Laptop, Desktop", nama: "Kingston NV3 500GB NVMe", stok: 18, harga: 590000 },
        { kategori: "Laptop, Desktop", nama: "WD SN580 1TB NVMe", stok: 8, harga: 1100000 },
        { kategori: "Laptop, Desktop", nama: "Lexar NM620 512GB", stok: 12, harga: 550000 },
        
        // HDD
        { kategori: "Desktop", nama: "WD Blue 1TB", stok: 10, harga: 680000 },
        { kategori: "Desktop", nama: "WD Blue 2TB", stok: 6, harga: 950000 },
        { kategori: "Desktop", nama: "Seagate Barracuda 1TB", stok: 15, harga: 670000 },
        { kategori: "Desktop", nama: "Seagate Barracuda 2TB", stok: 8, harga: 930000 },
        { kategori: "Desktop", nama: "Toshiba P300 1TB", stok: 5, harga: 650000 },
        
        // Motherboard
        { kategori: "Desktop", nama: "ASUS H61M-K", stok: 4, harga: 450000 },
        { kategori: "Desktop", nama: "Gigabyte H61M-S1", stok: 3, harga: 430000 },
        { kategori: "Desktop", nama: "ASUS H81M-K", stok: 5, harga: 550000 },
        { kategori: "Desktop", nama: "Gigabyte H81M-DS2", stok: 4, harga: 540000 },
        { kategori: "Desktop", nama: "ASUS B85M-G", stok: 3, harga: 650000 },
        { kategori: "Desktop", nama: "MSI H110M PRO-VH", stok: 6, harga: 750000 },
        { kategori: "Desktop", nama: "ASUS H110M-K", stok: 5, harga: 770000 },
        { kategori: "Desktop", nama: "ASUS H310M-K", stok: 7, harga: 850000 },
        { kategori: "Desktop", nama: "Gigabyte H410M", stok: 8, harga: 950000 },
        { kategori: "Desktop", nama: "ASUS PRIME H510M-E", stok: 6, harga: 1150000 },
        { kategori: "Desktop", nama: "ASUS A320M-K", stok: 5, harga: 720000 },
        { kategori: "Desktop", nama: "MSI A320M PRO", stok: 4, harga: 700000 },
        { kategori: "Desktop", nama: "Gigabyte B450M DS3H", stok: 6, harga: 1150000 },
        { kategori: "Desktop", nama: "ASUS PRIME B450M-A II", stok: 5, harga: 1250000 },
        { kategori: "Desktop", nama: "MSI B550M PRO-VDH", stok: 3, harga: 1650000 },
        
        // Processor
        { kategori: "Desktop", nama: "Intel Core i3-3220", stok: 5, harga: 150000 },
        { kategori: "Desktop", nama: "Intel Core i5-3470", stok: 6, harga: 250000 },
        { kategori: "Desktop", nama: "Intel Core i5-4570", stok: 4, harga: 350000 },
        { kategori: "Desktop", nama: "Intel Core i7-3770", stok: 3, harga: 650000 },
        { kategori: "Desktop", nama: "Intel Core i3-10100F", stok: 8, harga: 1050000 },
        { kategori: "Desktop", nama: "Intel Core i5-10400F", stok: 6, harga: 1450000 },
        { kategori: "Desktop", nama: "Intel Core i5-12400F", stok: 5, harga: 2150000 },
        { kategori: "Desktop", nama: "AMD Ryzen 3 3200G", stok: 4, harga: 1100000 },
        { kategori: "Desktop", nama: "AMD Ryzen 5 3400G", stok: 3, harga: 1400000 },
        { kategori: "Desktop", nama: "AMD Ryzen 5 5600G", stok: 5, harga: 2050000 },
        { kategori: "Desktop", nama: "AMD Ryzen 5 5600", stok: 6, harga: 2150000 },
        
        // Laptop Battery
        { kategori: "Laptop", nama: "ASUS X441 Battery", stok: 8, harga: 350000 },
        { kategori: "Laptop", nama: "ASUS A456 Battery", stok: 6, harga: 380000 },
        { kategori: "Laptop", nama: "Acer Aspire E5 Battery", stok: 7, harga: 320000 },
        { kategori: "Laptop", nama: "Acer ES1 Battery", stok: 5, harga: 300000 },
        { kategori: "Laptop", nama: "Lenovo IdeaPad 320 Battery", stok: 10, harga: 350000 },
        { kategori: "Laptop", nama: "Lenovo G40 Battery", stok: 4, harga: 280000 },
        { kategori: "Laptop", nama: "HP 14 Series Battery", stok: 8, harga: 360000 },
        { kategori: "Laptop", nama: "Dell Inspiron 3467 Battery", stok: 3, harga: 420000 },
        
        // Laptop Charger
        { kategori: "Laptop", nama: "ASUS 19V 3.42A Original", stok: 12, harga: 250000 },
        { kategori: "Laptop", nama: "ASUS 19V 2.37A", stok: 15, harga: 220000 },
        { kategori: "Laptop", nama: "Lenovo Slim Tip 65W", stok: 18, harga: 230000 },
        { kategori: "Laptop", nama: "HP Blue Tip 65W", stok: 14, harga: 240000 },
        { kategori: "Laptop", nama: "Dell 65W", stok: 6, harga: 260000 },
        { kategori: "Laptop", nama: "Acer 65W", stok: 10, harga: 210000 },
        
        // Keyboard Laptop
        { kategori: "Laptop", nama: "Keyboard ASUS X441", stok: 12, harga: 150000 },
        { kategori: "Laptop", nama: "Keyboard Acer Aspire E5", stok: 8, harga: 160000 },
        { kategori: "Laptop", nama: "Keyboard Lenovo IdeaPad 320", stok: 15, harga: 145000 },
        { kategori: "Laptop", nama: "Keyboard HP 14", stok: 10, harga: 170000 },
        { kategori: "Laptop", nama: "Keyboard Dell Inspiron 3467", stok: 5, harga: 190000 },
        
        // LCD Laptop
        { kategori: "Laptop", nama: "LCD 14\" Slim 30 Pin", stok: 15, harga: 750000 },
        { kategori: "Laptop", nama: "LCD 15.6\" Slim 30 Pin", stok: 8, harga: 950000 },
        { kategori: "Laptop", nama: "LCD IPS 15.6\" FHD", stok: 5, harga: 1250000 },
        
        // Cooling
        { kategori: "Desktop", nama: "DeepCool GAMMAXX 400 V2", stok: 12, harga: 280000 },
        { kategori: "Desktop", nama: "Intel Stock Cooler LGA115x", stok: 20, harga: 50000 },
        { kategori: "Desktop", nama: "AMD Wraith Stealth", stok: 15, harga: 85000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Thermal Paste GD900", stok: 40, harga: 35000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Arctic MX-4 4g", stok: 25, harga: 125000 },
        
        // PSU
        { kategori: "Desktop", nama: "FSP HV PRO 550W", stok: 8, harga: 680000 },
        { kategori: "Desktop", nama: "Cooler Master MWE 550 Bronze", stok: 6, harga: 750000 },
        { kategori: "Desktop", nama: "Corsair CV550", stok: 5, harga: 820000 },
        { kategori: "Desktop", nama: "Corsair CV650", stok: 4, harga: 980000 },
        { kategori: "Desktop", nama: "DeepCool PK550D", stok: 7, harga: 690000 },
        { kategori: "Desktop", nama: "MSI MAG A550BN", stok: 5, harga: 720000 },
        { kategori: "Desktop", nama: "VenomRX 500W", stok: 12, harga: 350000 },
        { kategori: "Desktop", nama: "Digital Alliance 450W", stok: 10, harga: 450000 },
        
        // VGA
        { kategori: "Desktop", nama: "GTX 1050 Ti 4GB", stok: 3, harga: 1250000 },
        { kategori: "Desktop", nama: "GTX 1650 4GB", stok: 5, harga: 1850000 },
        { kategori: "Desktop", nama: "RX 570 4GB", stok: 4, harga: 1100000 },
        { kategori: "Desktop", nama: "RX 580 8GB", stok: 6, harga: 1450000 },
        
        // WiFi
        { kategori: "Desktop", nama: "TP-Link TL-WN781ND", stok: 15, harga: 125000 },
        { kategori: "Desktop", nama: "TP-Link Archer T4E", stok: 8, harga: 350000 },
        { kategori: "Laptop, Desktop", nama: "Intel AX200 M.2", stok: 10, harga: 280000 },
        { kategori: "Laptop, Desktop", nama: "Intel AX210 M.2", stok: 6, harga: 350000 },
        { kategori: "Laptop, Desktop, AIO", nama: "USB WiFi TP-Link T2U Nano", stok: 20, harga: 145000 },
        
        // Networking
        { kategori: "Laptop, Desktop, AIO", nama: "RJ45 Connector CAT6", stok: 100, harga: 2000 },
        { kategori: "Laptop, Desktop, AIO", nama: "LAN Cable CAT6 10m", stok: 15, harga: 85000 },
        { kategori: "Laptop, Desktop, AIO", nama: "LAN Cable CAT6 20m", stok: 10, harga: 150000 },
        { kategori: "Desktop", nama: "Gigabit PCIe LAN Card", stok: 8, harga: 120000 },
        
        // Printer
        { kategori: "Printer", nama: "Epson L3110 Roller Kit", stok: 12, harga: 85000 },
        { kategori: "Printer", nama: "Epson L120 Roller", stok: 15, harga: 75000 },
        { kategori: "Printer", nama: "Canon G2010 Printhead", stok: 3, harga: 550000 },
        { kategori: "Printer", nama: "Canon MP287 Cartridge PG-810", stok: 8, harga: 280000 },
        { kategori: "Printer", nama: "Canon MP287 Cartridge CL-811", stok: 6, harga: 320000 },
        { kategori: "Printer", nama: "Epson L3110 Waste Ink Pad", stok: 20, harga: 45000 },
        { kategori: "Printer", nama: "Epson L3110 Encoder Strip", stok: 10, harga: 55000 },
        
        // Accessories
        { kategori: "Laptop, Desktop, AIO", nama: "Logitech B100 USB Mouse", stok: 30, harga: 65000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Logitech M171 Wireless Mouse", stok: 25, harga: 145000 },
        { kategori: "Desktop, AIO", nama: "Logitech K120 Keyboard", stok: 20, harga: 115000 },
        { kategori: "Desktop, AIO", nama: "Fantech K511 Keyboard", stok: 15, harga: 185000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Fantech WG9 Wireless Mouse", stok: 18, harga: 165000 },
        { kategori: "Laptop, Desktop, AIO", nama: "UGREEN SATA to USB Adapter", stok: 10, harga: 125000 },
        { kategori: "Laptop, Desktop, AIO", nama: "ORICO HDD Enclosure 2.5\\\"", stok: 14, harga: 95000 },
        { kategori: "Laptop, Desktop, AIO", nama: "USB Hub 4 Port", stok: 22, harga: 45000 },
        { kategori: "Laptop, Desktop, AIO", nama: "HDMI Cable 2 Meter", stok: 28, harga: 35000 },
        { kategori: "Desktop, AIO", nama: "DisplayPort Cable", stok: 12, harga: 75000 },
        { kategori: "Desktop, AIO", nama: "VGA Cable", stok: 15, harga: 30000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Mouse Pad", stok: 40, harga: 20000 },
        { kategori: "Laptop", nama: "Laptop Cooling Pad", stok: 16, harga: 125000 },
        { kategori: "Laptop, Desktop, AIO", nama: "External DVD Drive", stok: 5, harga: 220000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Flashdisk SanDisk 64GB", stok: 25, harga: 85000 },
        { kategori: "Laptop, Desktop, AIO", nama: "Flashdisk Kingston 128GB", stok: 15, harga: 145000 }
    ];`;

let content = fs.readFileSync('seed.js', 'utf8');

// Replace the array block
const regex = /const sparepartData = \[\s*\{[\s\S]*?\];/;
content = content.replace(regex, newSpareparts);

// Fix the hardcoded index in Penggunaan Sparepart
// Old: sparepart_id: spareparts[6].id // Power supply 550W
// New: sparepart_id: spareparts.find(s => s.nama.includes("PSU") || s.nama.includes("Power") || s.nama.includes("FSP") || s.nama.includes("DeepCool PK550D") || s.nama.includes("550W")).id
content = content.replace(
    /sparepart_id:\s*spareparts\[6\]\.id,\s*\/\/\s*Power\s*supply\s*550W/g,
    'sparepart_id: spareparts.find(s => s.nama.includes("550W") && s.kategori.includes("Desktop")).id,'
);

// We should also replace the admin email back to what the user had, so it doesn't get overwritten!
content = content.replace('admin@workshop.com', '411231088@mahasiswa.undira.ac.id');
content = content.replace('admin@workshop.com', '411231088@mahasiswa.undira.ac.id'); // Replace in console log as well

fs.writeFileSync('seed.js', content);
console.log("Updated seed.js");
