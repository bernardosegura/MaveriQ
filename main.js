const { app,ipcMain,BrowserWindow, globalShortcut } = require('electron');
let win = null;
let isdev = (__dirname.indexOf("app.asar") === -1)?true:false; 


function createWindow() {
  const path = require('path');
  win = new BrowserWindow({
    width: 933,
    height: (291+180+62+73),
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      //enableRemoteModule: false,
    },
    autoHideMenuBar: true,
    resizable: isdev,
    //maximizable: false,
    icon: path.join(__dirname, 'icon.png')
  });
  win.loadFile('index.html');
  
  if(!isdev)
    globalShortcut.register('CommandOrControl+Shift+I', () => {
          return false;
      });   
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
  event.returnValue = require('fs').existsSync(arg);
});

ipcMain.on('process_usb', (event, args) => {
  event.returnValue = processUSB(args[0], args[1], args[2], args[3]);
});

ipcMain.on('get_name_disk', (event, args) => {
  event.returnValue = getNameDisk(args[0]);
});

ipcMain.on('crear_disk', (event, args) => {
  crearDisk(args[0],args[1]);
});


function processUSB(disp, metodo,pswd,callback) {
  let fileConnect = disp.replace(/_/g,"/").replace(disp.split("_")[0],"");
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
    try{
      if(execSync(command).toString().startsWith(usr))
        return true;
      else
        return false;
    }catch(err){
      return false
    }
    return resp;
}

function playOS(cmd) {
    const { exec } = require('child_process');
    exec('echo "'+ cmd[0] +'" | sudo -E -S ' + cmd[1] + '&>/dev/null', (error, stdout, stderr) => {});
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
      log(stderr.replace("\n"," ").replace(/'/g,"\\'"));
    }
    if(stdout){
      log(stdout.replace("\n"," ").replace(/'/g,"\\'"));
    }
  });
}

function log(mensaje){
  win.webContents.executeJavaScript("log('"+mensaje+"');");
}