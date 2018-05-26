const electron = require('electron')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = require('electron').ipcMain;
const Menu = require('electron').Menu;
const dialog = require('electron').dialog;
const fs = require('fs');
const globalShortcut = require('electron').globalShortcut;

let mainWindow;
let editorWindow;

app.on('ready', function createWindow () 
{
	mainWindow = new BrowserWindow({width: 1268, height: 768, minWidth: 1000, minHeight: 768});
	mainWindow.loadURL('file://' + __dirname + '/index.html');
});

app.on('window-all-closed', function(){
	app.quit();
});

ipc.on('watchCrashCourse', function(event)
{
	let courseWin = new BrowserWindow({width: 1268, height: 768});
	courseWin.setMenu(null);
	courseWin.loadURL('https://www.youtube.com/embed/vJbKAUVWVM4?autoplay=1');
});

ipc.on('openEditor_Blank', function(event, project)
{

	editorWindow = new BrowserWindow({width: 1268, height: 768, minWidth: 1000, minHeight: 768});
	editorWindow.plumeProject = project;
	editorWindow.loadURL('file://' + __dirname + '/sections/editor.html');

	//editorWindow.toggleDevTools();
	//editorWindow.maximize();
	mainWindow.close();
});

ipc.on('openMainPage', function(){
	mainWindow = new BrowserWindow({width: 1268, height: 768, minWidth: 1000, minHeight: 768});

	mainWindow.loadURL('file://' + __dirname + '/index.html');

	editorWindow.close();
});

ipc.on('appExit', function(event){
	editorWindow.removeAllListeners('close');
	editorWindow.close();
	app.quit();
});

ipc.on('window_Max', function(event){
	editorWindow.maximize();
});

ipc.on('openSettings', function(event){
	let settingsWindow;

	settingsWindow = new BrowserWindow({width: 900, height: 600});

	settingsWindow.loadURL('file://' + __dirname + '/sections/settings.html');
});

ipc.on('openOrganizer', function(event, projectObject){
	organizerWindow = new BrowserWindow({width: 600, height: 900});

	organizerWindow.po = projectObject;

	organizerWindow.loadURL('file://' + __dirname + '/sections/organizeLists.html');

});

ipc.on('openSaveToPDFWindow', function(event){
	toPDFWin = new BrowserWindow({width: 600, height: 600});

	toPDFWin.loadURL('file://' + __dirname + '/sections/toPDF.html');
});

ipc.on('updateOrder', function(event){
	organizerWindow.close();

    globalShortcut.unregister('ctrl+s');
	editorWindow.reload();

	editorWindow.focus();
});

ipc.on('applyPDFValues', function(event, data){
	console.log(data);

	editorWindow.webContents.send('confirmSaveToPDF', data);

	toPDFWin.close();
});

ipc.on('minimize_win', function(event){
	editorWindow.setSize(1268, 768);
});

ipc.on('print-that-pdf', function(event){
	dialog.showSaveDialog({
		filters: [
			{
				name: 'PDF',
				extensions: ['pdf']
			}
		]
	}, function (fileName) {
		editorWindow.webContents.printToPDF({}, function(err, data){
			fs.writeFile(fileName, data, function(err){
				if(!err)
				{
					dialog.showMessageBox({
						message: 'PDF document saved to ' + fileName,
						buttons: ['OK']
					});
				}
			});
		});

		globalShortcut.unregister('ctrl+s');
		editorWindow.reload();
	});
});