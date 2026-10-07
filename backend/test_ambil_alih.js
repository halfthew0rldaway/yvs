const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const id = 11; // Check db for an unassigned ticket
        const teknisi_id = 2; 
        
        const updated = await prisma.tiketServis.update({
            where: { id },
            data: {
                status: undefined,
                teknisi_id: teknisi_id !== undefined ? (teknisi_id ? Number(teknisi_id) : null) : undefined,
                keluhan: undefined,
            },
        });
        console.log("Success:", updated);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
