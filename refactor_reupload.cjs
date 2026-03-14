const fs = require('fs');
const path = require('path');

const toolsDir = 'd:/love-pdf/src/tools';

const walk = function (dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    if (file.endsWith('.tsx')) results.push(file);
                    next();
                }
            });
        })();
    });
};

walk(toolsDir, function (err, results) {
    if (err) throw err;
    results.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');

        let accept = '.pdf';
        let multiple = false;
        let uploaderMatch = content.match(/<FileUploader[^>]*accept=(['"])(.*?)\1/);
        if (uploaderMatch) accept = uploaderMatch[2];
        if (content.match(/<FileUploader[^>]*multiple/)) multiple = true;

        let handlerMatch = content.match(/onFilesSelected={([^}]+)}/);
        if (!handlerMatch) return;
        let handler = handlerMatch[1]; // e.g. handleFileSelected

        const triggerLogic = `() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '${accept}'; ${multiple ? 'input.multiple = true;' : ''} input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) ${handler}(Array.from(f)); }; input.click(); }`;

        let changed = false;

        // 1. Replace window.location.reload()
        if (content.includes('window.location.reload()')) {
            content = content.replace(/\(\) => window\.location\.reload\(\)/g, triggerLogic);
            changed = true;
        }

        // 2. Add Change File button
        if (!file.includes('ComparePdfs') && !file.includes('MergePdf') && !file.includes('shared')) {
            const titleRegex = /(<h3 className=\{styles\.sectionTitle\}>[^{]*\{file\.name\}[^<]*<\/h3>)/;
            if (!content.includes('>Change File</button>') && titleRegex.test(content)) {
                content = content.replace(titleRegex, `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              $1
              <button 
                onClick={${triggerLogic}} 
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Change File
              </button>
            </div>`);
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(file, content);
            console.log('Updated', path.basename(file));
        }
    });
});
