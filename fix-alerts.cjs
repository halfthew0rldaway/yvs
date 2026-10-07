const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replace alert( with toast.error(
            // Since most of the alerts were errors based on previous grep.
            // Some might be success, but let's check manually if there's any success alert.
            // Previously: alert(err.response?.data?.message || "Terjadi kesalahan")
            content = content.replace(/alert\(/g, 'toast.error(');

            if (content !== original) {
                // we must also import toast if it doesn't exist
                if (!content.includes("import toast from 'react-hot-toast'")) {
                    content = `import toast from 'react-hot-toast';\n` + content;
                }
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

processDir('/run/media/bleu/DATA/dev/tb-pemrograman-fullstack/frontend/src/pages');
