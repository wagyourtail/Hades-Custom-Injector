const {app, BrowserWindow, Menu} = require('electron');
const path = require('path');
const url = require('url');
const shell = require('electron').shell;
const ipc = require('electron').ipcMain;

let win;

global.dir = require('path').resolve(process.argv[process.argv.length-1]);


function createWindow() {
    win  = new BrowserWindow({frame:false,width:420, height:600, webPreferences:{allowRunningInsecureContent: true,nodeIntegration: true}});

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'html/index.html'),
        protocol:'file',
        slashes: true
    }));


    //win.setFullScreen(true);
    //win.setResizable(false);
    
    win.on('closed', () => {
        win = null;
    });
    
    /*
    win.webContents.executeJavaScript(`
    topbarLoad.src = "file:///${path.join(__dirname, 'src/html/topbar.html').split("\\").join("/")}";
    imageviewLoad.src = "file:///${path.join(__dirname, 'src/html/imageview.html').split("\\").join("/")}";
    `)


    /*
    let menu = Menu.buildFromTemplate([{
        label: 'Menu',
        submenu: [
            {label: 'Adjust Notification Value'},
            {type:'separator'},
            {
                label: 'CoinMarketCap',
                click() {
                    shell.openExternal("http://coinmarketcap.com");
                }
            },
            {type:'separator'},
            {
                label: 'Exit',
                click() {
                    app.quit();
                }
            }
        ]
    }])
    Menu.setApplicationMenu(menu);
    */
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});