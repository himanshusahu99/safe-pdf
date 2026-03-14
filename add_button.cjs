const fs = require('fs');
const path = require('path');

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

const buttonHtml = `\n              <button onClick={() => window.location.reload()} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>`;

walk('d:/safepdf/src/tools', function (err, results) {
    if (err) throw err;
    results.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('Upload New File')) {
            console.log('Already has button:', file);
            return;
        }

        if (content.includes('>👁️ Preview</button>')) {
            content = content.replace('>👁️ Preview</button>', '>👁️ Preview</button>' + buttonHtml);
            fs.writeFileSync(file, content);
            console.log('Updated', file);
        } else {
            console.log('No preview button:', file);
        }
    });
});
