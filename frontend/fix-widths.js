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
            content = content.replace(/className="max-w-2xl mx-auto /g, 'className="w-full ');
            content = content.replace(/className="max-w-3xl mx-auto /g, 'className="w-full ');
            content = content.replace(/className="max-w-4xl mx-auto /g, 'className="w-full ');
            content = content.replace(/className="max-w-5xl mx-auto /g, 'className="w-full ');
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

processDir('/run/media/bleu/DATA/dev/tb-pemrograman-fullstack/frontend/src/pages');
