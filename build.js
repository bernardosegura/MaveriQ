const asar = require('@electron/asar');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Ruta al archivo zip
const zPath = path.join(__dirname, 'extras/base-v31.2.1.zip'); 
const zMQPath = path.join(__dirname, 'extras/MaveriQ.zip'); 
const bPath = path.join(__dirname, 'build'); // Ruta de la carpeta destino

console.log("Iniciando construcción...");
console.log('0%');
if (fs.existsSync(bPath)) {
    fs.rmSync(bPath, { recursive: true, force: true });
} 
fs.mkdirSync(bPath, { recursive: true });
    
console.log('10%');
const zip = new AdmZip(zPath);
zip.extractAllTo(bPath, true); 

const mQ = new AdmZip(zMQPath);
mQ.extractAllTo(bPath, true);

console.log('60%');
fs.rmSync(path.join(bPath, 'resources',"default_app.asar"), { force: true });
//fs.renameSync(path.join(bPath, 'electron'), path.join(bPath, 'MaveriQ'));

console.log('70%');
fs.mkdirSync(path.join(bPath, 'resources',"app"), { recursive: true });    
fs.copyFileSync(path.join(__dirname, 'icon.png'), path.join(bPath, 'resources',"app",'icon.png'));
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(bPath, 'resources',"app",'index.html'));
fs.copyFileSync(path.join(__dirname, 'index.js'), path.join(bPath, 'resources',"app",'index.js'));
fs.copyFileSync(path.join(__dirname, 'main.js'), path.join(bPath, 'resources',"app",'main.js'));
fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(bPath, 'resources',"app",'package.json'));
fs.copyFileSync(path.join(__dirname, 'preload.js'), path.join(bPath, 'resources',"app",'preload.js'));

console.log('80%');
asar.createPackage(path.join(bPath, 'resources',"app"), path.join(bPath, 'resources',"app.asar")).then(() => {
    fs.rmSync(path.join(bPath, 'resources',"app"), { recursive: true, force: true });
    fs.copyFileSync(path.join(__dirname, 'maveriqSO.json'), path.join(bPath, 'maveriqSO.json'));
    console.log('100%');
    console.log('Construcción completa con exito en ' + bPath);
});