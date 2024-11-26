const { exec,execSync } = require("child_process");
let setlsusb = (execSync("command -v lsusb | wc -l").toString() == 1)?true:false;
let setqemu = (execSync("command -v qemu-system-x86_64 | wc -l").toString() == 1)?true:false;


if(setlsusb){
	 let usbdev = execSync('lsusb').toString().split("\n").filter(elemento => (!elemento.includes("Linux Foundation") && elemento != ''));
	 let deviceUSB = [];
	 for (var i = 0; i < usbdev.length; i++) {
	 	let usbD = usbdev[i].split(" ");
	 	let desc = "";
	 	for (var j = 6; j < usbD.length; j++) {
	 		desc += usbD[j] + " ";
	 	}
	 	deviceUSB.push({bus: usbD[1],addr: usbD[3].replace(":",""), desc: desc.trim()});
	 }
	 console.log(deviceUSB);
}
