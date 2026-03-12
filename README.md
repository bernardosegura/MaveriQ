# <img src="https://github.com/bernardosegura/MaveriQ/blob/master/icon.png" style="width: 40px; height: 40px;" /> MaveriQ
FrontEnd basico para la ejecución de máquinas virtuales preconfiguradas mediante un archivo de configuración con el motor de qemu.
Impulsado por NodeJS (v20.15.0) y Electrón (v31.2.1).

# Sistemas Preconfigurados
1. __Instalacion para Windows 11 x64__
2. __Windows 11 x64__
3. __macOS Big Sur (11.0) intel__ *proximamente

Siéntase libre de jugar con estas configuraciones y agregar las propias si así lo desea. El archivo de configuración es maveriqSO.json.

# Pasos para instalar windows 11
1. __Crear Disco Virtual__ desde le opción de la aplicación.
2. __Iniciar el tpm por Software__ desde le opción de la aplicación.
3. __Ejecuta Instalar Windows 11__ desde le opción de la aplicación, colocando el nombre del disco creado y la ruta de la ISO de Windows 11.
4. __Inicia el instalador de Windows__ Si no carga la ISO automáticamente la BIOS, accede con F2 y en el menú de arranque selecciona el cd 1.
5. __Seleccionar Disco__ al llegar ha este apartado, se deben cargar los drivers de almacenamiento de virtio, selecciona cargar drivers y posteriormente el cd he ir a la ruta de __viostor/w11/amd64__

# Alternar entre Sistemas Operativos
Al intercambiar discos virtuales, es importante realizar una limpieza de la BIOS. Este procedimiento asegura que el nuevo sistema operativo sea reconocido de forma inmediata y automática. __Importante__: Si no se realiza este paso, se deberá configurar manualmente los parámetros de arranque dentro de la máquina virtual para que identifique el nuevo volumen. Se recomienda utilizar la función __"Limpiar BIOS"__ para automatizar este proceso.

# Compartir Directorio con Windows Virtual
Para que __Windows Virtualizado__ reconozca el directorio compartido, es necesario instalar [winfsp](https://winfsp.dev/) (instalar solo el Core) y de __virtio-win__ instalar __Viofs__, una vez instalado el driver __Viofs__, es impórtate que el servicio __VirtIO-FS__ se encuentre ejecutándose correctamente para poder acceder sin problema al directorio compartido.
   
# Ejecución del código fuente
```bash
npm start
```
# Construir binario apartir del código fuente
```bash
npm run build
```
