const { app,ipcMain,BrowserWindow, globalShortcut, Menu } = require('electron');
let win = null;
let isdev = (__dirname.indexOf("app.asar") === -1)?true:false; 
let virtiofsdFile = "drivers/virtiofsd";

const menu = [
  {
    label: 'Limpiar Bios',
    submenu: [
      {
        label: 'X64',
        accelerator: 'CmdOrCtrl+L', // Atajo de teclado
        click: (menuItem, browserWindow, event) => {
          const fs = require('fs');
          log('Validando datos de bios x64');
          if(fs.existsSync("bios/x64/OVMF.fd")){
            if(fs.existsSync("bios/x64/OVMF_VARS.fd")){
              fs.unlinkSync('bios/x64/OVMF_VARS.fd');
            }
            fs.copyFileSync('bios/x64/OVMF.fd', 'bios/x64/OVMF_VARS.fd');
            msgBox('Proceso finalizado con éxito');
            log('Proceso finalizado con éxito'); 
          }else{
            msgBox('Se requiere <b>OVMF_VARS.fd</b> para <b>bios x64</b>');
            log('Se requiere OVMF_VARS.fd para bios x64');
          }
        }
      }

    ]
  },
{
    label: 'USB',
    submenu: [
      {
        label: 'Conectar...',
        accelerator: 'CmdOrCtrl+W', // Atajo de teclado
        click: (menuItem, browserWindow, event) => {
          win.webContents.executeJavaScript("conectUSB();");
        }
      },
      {
        label: 'Desconectar...',
        accelerator: 'CmdOrCtrl+Q', // Atajo de teclado
        click: (menuItem, browserWindow, event) => {
          win.webContents.executeJavaScript("desconectUSB();");
        }
      },
      {
        label: 'Actualizar...',
        accelerator: 'CmdOrCtrl+U', // Atajo de teclado
        click: (menuItem, browserWindow, event) => {
          win.webContents.executeJavaScript("uptUSBDev();");

        }
      },
    ]
  }];

function msgBox(message){
  let msg = "document.getElementById('dialog-alert-mensaje').innerHTML = \""+message+"\"; openDialog('dialog-alert');";  
  win.webContents.executeJavaScript(msg);
}

function createWindow() {
  const path = require('path');
  win = new BrowserWindow({
    width: 1050,
    height: 952,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      //enableRemoteModule: false,
    },
    autoHideMenuBar: false,
    resizable: isdev,
    //maximizable: false,
    icon: path.join(__dirname, 'icon.png')
  });
  win.loadFile('index.html');
  
  if(isdev)
      globalShortcut.register('CommandOrControl+Shift+I', () => {
          //return false;
          win.webContents.openDevTools();
      }); 
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));     
}

app.whenReady().then(createWindow);     

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('close-app', (event, arg) => {
  app.quit();
});

ipcMain.on('version-app', (event, arg) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('user-app', (event, arg) => {
  event.returnValue = require("os").userInfo().username;
});

ipcMain.on('os-app', (event, arg) => {
  let dir = __dirname.replace("resources/app.asar","").replace("resources/app","");
  event.returnValue = JSON.parse(require('fs').readFileSync(require('path').join(dir,'maveriqSO.json'), 'utf8'));
});

ipcMain.on('valida-pswd', (event, args) => {
  event.returnValue = validatePassword(args[0], args[1]);
});

ipcMain.on('play-os', (event, args) => {
  playOS(args);
});

ipcMain.on('valida-play-os', (event, arg) => {
  event.returnValue = require('fs').existsSync("/tmp/"+arg);
});

ipcMain.on('process_usb', (event, args) => {
  event.returnValue = processUSB(args[0], args[1], args[2], args[3]);
});

ipcMain.on('get_name_disk', (event, name) => {
  event.returnValue = getNameDisk(name);
});

ipcMain.on('crear_disk', (event, args) => {
  crearDisk(args[0],args[1]);
});

ipcMain.on('create-swtpm', (event, sock) => {
  createSWTPM(sock);
});

ipcMain.on('create_drive_virtio', (event, file) => {
  createVirtIO(file);
});

ipcMain.on('get_disks', (event) => {
  event.returnValue = getDisks();
});

ipcMain.on('up_virtiofsd', (event, args) => {
  upVirtiofsd(args[0],args[1]);
});

ipcMain.on('optimizar_disk', (event, args) => {
  optimizarDisk(args[0],args[1],args[2]);
});

function processUSB(disp, metodo,pswd,callback) {
  let fileConnect = disp.replace(/_/g,"/tmp/").replace(disp.split("_")[0],"");
  let address = {bus:disp.split("_")[0].split(":")[0], dev: disp.split("_")[0].split(":")[1]};
  let name = "usb"+disp.split("_")[0].replace(":","");
  const net = require('net');
  const fs = require('fs');
  const os = require('os');
  const socketPath = fileConnect;
  const userInfo = os.userInfo();
  const stats = fs.statSync(socketPath);
  
  if (stats.uid !== userInfo.uid) {
      const { execSync } = require('child_process');
      const command = `echo "${pswd}" | sudo -E -S chown ${userInfo.uid}:${userInfo.gid} ${socketPath} 2>/dev/null`;
      execSync(command);
  } 

  if(metodo.split(":")[0] == "add"){
    const client = net.createConnection(socketPath, () => {
        let tBus = (metodo.split(":")[1] == "on")? ",bus=xhci.0":"";

        client.write("device_add usb-host"+tBus+",hostbus="+parseInt(address.bus)+",hostaddr="+parseInt(address.dev)+",id="+name+'\n');
        if(callback)
            win.webContents.executeJavaScript(callback +'({status: 0,mensaje:"conecto"});');
        client.end();  
      //console.log("device_add usb-host"+tBus+",hostbus="+parseInt(address.bus)+",hostaddr="+parseInt(address.dev)+",id="+name);
    });

  }

  if(metodo.split(":")[0] == "del"){
      const client = net.createConnection(socketPath, () => {
        client.write("device_del "+name+'\n');
        if(callback)
            win.webContents.executeJavaScript(callback +'({status: 0,mensaje:"desconecto"});');
       client.end();
       //console.log("device_del "+name);   
    });
  }
    
  return true;  
}

function validatePassword(usr, pswd) {
    const { execSync } = require('child_process');
    const command = `echo "${pswd}" | su -c "whoami" - ${usr} 2>/dev/null`;
    
    preVirtiofsd(pswd);
    try{
      if(execSync(command).toString().startsWith(usr)){
        return true;
      }
      else
        return false;
    }catch(err){
      return false
    }
}

function preVirtiofsd(pswd){
  const { exec } = require('child_process');
  const command = `echo "${pswd}" | sudo -E -S chmod +x ${virtiofsdFile} 2>/dev/null`;
  exec(command, (error, stdout, stderr) => {});
}

function upVirtiofsd(pswd,source){
  const { exec } = require('child_process');
  const command = `echo "${pswd}" | sudo -E -S ${virtiofsdFile} --socket-path="/tmp/vfs.sock" -o source="${source}" >/tmp/virtiofsd.log 2>&1 &`;
  exec(command, (error, stdout, stderr) => {});
  //sudo pkill virtiofsd
  //upVirtiofsd(pswd,"../Win10_MV/mv_windows_10/datos_compartidos/");
}

function playOS(cmd) {
    const { exec } = require('child_process');
    exec('echo "'+ cmd[0] +'" | sudo -E -S ' + cmd[1] + '&>/dev/null', (error, stdout, stderr) => {

      if(stderr){
        msgBox("<b>Error</b>: favor de revisar log en <b>Reporte de Actividades</b>.");
        log(stderr.replace(/\n/g,"</br>").replace(/'/g,"\\'"));
        exec('echo "'+ cmd[0] +'" | sudo -E -S rm /tmp/' + cmd[2], (error, stdout, stderr) => {});
      }
      win.webContents.executeJavaScript('document.getElementById("SisOpe").value = -1; loadInf();'); 
    });
}

function getNameDisk(name){
  const fs = require('fs');
  let idSSD = 1;
  let newName = name;

  if(!fs.existsSync("disks"))
    fs.mkdirSync("disks");
  
  while(fs.existsSync("disks/"+newName+".qcow2")){
    newName = name + idSSD; 
    idSSD++;
  }

  return newName+".qcow2";
}

function crearDisk(disk,size){
  const { exec } = require('child_process');
  exec('qemu-img create -f qcow2 disks/' + disk + " " + size, (error, stdout, stderr) => {
    if(stderr){
      msgBox("<b>Error</b>: favor de revisar log en <b>Reporte de Actividades</b>.");
      log(stderr.replace(/\n/g,"</br>").replace(/'/g,"\\'"));
    }
    if(stdout){
      log(stdout.replace("\n"," ").replace(/'/g,"\\'"));
    }
  });
}

function log(mensaje){
  win.webContents.executeJavaScript("log('"+mensaje+"');");
}

function createSWTPM(sock) {
  const fs = require('fs');
  const { exec } = require('child_process');

  if(!fs.existsSync(sock)){
    let nSock = sock.split("/")[sock.split("/").length-1];
    let path = sock.substring(0,(sock.length-nSock.length));
    let cmd = "swtpm socket --tpmstate dir="+path+" --ctrl type=unixio,path="+sock+" --tpm2";
    log("Creando socket: "+ sock +" tipo: tpm2");
    exec(cmd, (error, stdout, stderr) => {
      if(stderr){
        msgBox("<b>Error</b>: favor de revisar log en <b>Reporte de Actividades</b>.");
        log(stderr.replace(/\n/g,"</br>").replace(/'/g,"\\'"));
      }
      if(stdout){
        log(stdout.replace(/\n/g,"</br>").replace(/'/g,"\\'"));
      }
    });
  }else{
    msgBox("Ya se encuentra en ejecución swptm en el socket: "+ sock);
    log("Ya se encuentra en ejecución swptm en el socket: "+ sock);
  }
}

function createVirtIO(file) {
    const { exec } = require('child_process');
    const fs = require('fs');
    let cmd = "cat ";
    let tFVIO = 0;
    for (var i = 1; i < 7; i++) {
      cmd += file+"_"+ i +" ";
      if(fs.existsSync(file+"_"+ i)){
        tFVIO++;
      }
      if(tFVIO == 6){
        exec(cmd + "> " + file, (error, stdout, stderr) => {});
      }
    }
}

function getDisks(){
  const fs = require('fs');
  let nameDisks = [];

  if(!fs.existsSync("disks"))
    return nameDisks;
  
  nameDisks = fs.readdirSync("disks/");
  return nameDisks;
}

function optimizarDisk(disk,compress,guardarcomo){
  const { spawn,exec } = require('child_process');
  let convert = '';
  let pathDisk = 'disks/';

  if(compress)
    convert = spawn("qemu-img",['convert','-c','-p','-S','4k','-f','qcow2','-O','qcow2',pathDisk+disk,((guardarcomo == "")?pathDisk+disk+".tmp":pathDisk+guardarcomo)]);
  else
    convert = spawn("qemu-img",['convert','-p','-S','4k','-f','qcow2','-O','qcow2',pathDisk+disk,((guardarcomo == "")?pathDisk+disk+".tmp":pathDisk+guardarcomo)]);

  convert.stdout.on('data', (data)=>{
    let porcentaje = data.toString().replace(/[^0-9.]/g, '');
    porcentaje = porcentaje.split(".");
    porcentaje = porcentaje[0];
    updatePorcentaje(porcentaje);
  });

  convert.stderr.on('data', (data)=>{
      msgBox("<b>Error</b>: favor de revisar log en <b>Reporte de Actividades</b>.");
      log(data.toString().replace(/\n/g,"</br>").replace(/'/g,"\\'"));
  });

  convert.on('exit', code => {
        if(guardarcomo == ""){
          exec('rm '+ pathDisk+disk + ' && mv '+ pathDisk+disk+".tmp "+ pathDisk+disk, (error, stdout, stderr) => { finalizarOptimizacionDiscos(); });
        }else
          finalizarOptimizacionDiscos();
  });
}

function updatePorcentaje(porcentaje){
  win.webContents.executeJavaScript("colocarPorcentaje("+porcentaje+");");
}

function finalizarOptimizacionDiscos(){
  win.webContents.executeJavaScript("resetOptDiscos();");
}