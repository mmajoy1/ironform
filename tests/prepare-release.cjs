const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const write = (name, text) => fs.writeFileSync(path.join(root, name), text);
const html = read('forge/index.html').replace('Forge preview', 'Forge').replace('FORGE PREVIEW', 'FORGE');
write('forge/index.html', html);
write('index.html', html.replaceAll('href="./assets/', 'href="./forge/assets/').replace('href="./app.css"', 'href="./forge/app.css"').replace('src="./app.js"', 'src="./forge/app.js"'));
const manifest = JSON.parse(read('forge/manifest.webmanifest'));
manifest.name = 'IRONFORM Forge';
write('forge/manifest.webmanifest', JSON.stringify(manifest) + '\n');
// Preserve the original installed app identity and launch URL.
write('manifest.webmanifest', JSON.stringify({...manifest, id:'./?v=20261001b', short_name:'IRONFORM', start_url:'./?v=20261001b', icons:manifest.icons.map(icon=>({...icon,src:'./icon.svg'}))}) + '\n');
fs.copyFileSync(path.join(root, 'forge/assets/icon.svg'), path.join(root, 'icon.svg'));
