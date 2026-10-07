const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [from, to] of replacements) {
        content = content.split(from).join(to);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated', filePath);
    }
}

replaceInFile('frontend/index.html', [
    ['<title>Repair Workshop System</title>', '<title>Serv.io</title>']
]);

replaceInFile('frontend/src/components/Layout.jsx', [
    ['RepairWorkshop', 'Serv.io']
]);

replaceInFile('frontend/src/pages/tracking/Tracking.jsx', [
    ['RepairWorkshop', 'Serv.io']
]);

replaceInFile('frontend/src/pages/Login.jsx', [
    ['🔧 Repair Workshop', 'Serv.io'],
    ['Sistem Manajemen Bengkel', 'Sistem Manajemen Servis'],
    ['🛠️', ''],
    ['📊', ''],
    ['🚀', '']
]);

replaceInFile('backend/src/app.js', [
    ['Computer Repair Workshop API - Running', 'Serv.io API - Running']
]);
