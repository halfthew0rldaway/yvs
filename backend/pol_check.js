const prisma = require('./src/config/database');
(async () => {
  const p = await prisma.attendancePolicy.findMany();
  console.log('POLICY:', JSON.stringify(p, null, 2));
  const recs = await prisma.attendanceRecord.findMany({ orderBy: { id: 'desc' }, take: 8 });
  console.log('RECORDS:', JSON.stringify(recs.map(r => ({ id: r.id, tgl: r.tanggal, masuk: r.jam_masuk })), null, 2));
  await prisma.$disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
