const { ipcRenderer,contextBridge } = require('electron');
const { execSync } = require("child_process");

contextBridge.exposeInMainWorld('electronAPI', {
  checklsusb: () => (execSync("command -v lsusb | wc -l").toString() == 1)?true:false,
  checkqemu: () => (execSync("command -v qemu-system-x86_64 | wc -l").toString() == 1)?true:false,
  checkqemuimg: () => (execSync("command -v qemu-img | wc -l").toString() == 1)?true:false,
  //checksocat: () => (execSync("command -v socat | wc -l").toString() == 1)?true:false,
  lsusb: () =>{ let usbdev = execSync('lsusb').toString().split("\n").filter(elemento => (!elemento.includes("Linux Foundation") && elemento != ''));
          let deviceUSB = [];
          for (var i = 0; i < usbdev.length; i++) {
            let usbD = usbdev[i].split(" ");
            let desc = "";
            for (var j = 6; j < usbD.length; j++) {
              desc += usbD[j] + " ";
            }
            deviceUSB.push({bus: usbD[1],addr: usbD[3].replace(":",""), desc: desc.trim()});
          } return deviceUSB;},


  exit: () => ipcRenderer.send("close-app"),
  getVersion: () => ipcRenderer.sendSync("version-app"),
  getUser: () => ipcRenderer.sendSync("user-app"),
  getOS: () => ipcRenderer.sendSync("os-app"),
  validaPswd: (usr,pswd) => ipcRenderer.sendSync("valida-pswd",[usr,pswd]),
  playOS: (pwd,cmd) => ipcRenderer.send("play-os",[pwd,cmd]),
  validaPlayOS: (os) => ipcRenderer.sendSync("valida-play-os",os),
  processUSB: (disp,metodo,pswd,callback) => ipcRenderer.sendSync("process_usb",[disp,metodo,pswd,callback]),
  getNameDisk:(name) => ipcRenderer.sendSync("get_name_disk",[name]),
  crearDisk:(disk,size) => ipcRenderer.send("crear_disk",[disk,size]),
});
