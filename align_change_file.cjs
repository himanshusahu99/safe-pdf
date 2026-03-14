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

walk('d:/safepdf/src/tools', function (err, results) {
    if (err) throw err;
    results.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');

        // Finding exactly what we just inserted in the previous script step
        const targetString = "justifyContent: 'space-between'";
        if (content.includes(targetString)) {
            content = content.replace(targetString, "gap: '12px'");
            fs.writeFileSync(file, content);
            console.log('Updated', path.basename(file));
        }
    });
});
