const fs = require('fs');
const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const shell = require('electron').shell;

document.getElementById('watchCourse').addEventListener('click', function () {
	ipc.send('watchCrashCourse');
});

document.getElementById('create_blank').addEventListener('click', function () {
	createProject("blank");
});

document.getElementById('create_script').addEventListener('click', function(){
	createProject("script");
});

document.getElementById('create_book').addEventListener('click', function(){
	createProject("book");
});

document.getElementById('open_group').addEventListener('click', function(){
	shell.openExternal('https://t.me/plumechannel');
});

document.getElementById('open_channel').addEventListener('click', function(){
	shell.openExternal('https://t.me/joinchat/Ag8KXRHtTjAd8flPfd6tsw');
});

document.getElementById('open_tutors').addEventListener('click', function(){
	shell.openExternal('https://www.youtube.com/playlist?list=PLndCM0LCIU0glV_hrsCG8xva6dUX_o4uh');
});

function createProject(projectType)
{
	dialog.showSaveDialog({
		filters: [
			{
				name: 'Plume Project',
				extensions: ['plume']
			}
		]
	}, function (fileName) {

		let splittedPath = fileName.split("\\");
		let projectName = splittedPath[splittedPath.length - 1];

		let project = {
			type: projectType,
			filename: projectName.split(".")[0],
			actors: [],
			places: [],
			notes: [],
			shortStory: "",
			lists: [],
			trash: [],
			pathFile: fileName
		};

		console.log(fileName);

		fs.writeFile(fileName, JSON.stringify(project), function (err) {
			if (err) dialog.showErrorBox("Error", err);
			else {
				dialog.showMessageBox({
					message: "Created successfully to " + fileName,
					buttons: ['OK']
				}, function (response) {
					if (response === 0)
						ipc.send('openEditor_Blank', project);
				});
			}
		});
	});
}

document.getElementById('open_plume').addEventListener('click', function () {
	dialog.showOpenDialog({
		filters: [

			{
				name: 'Plume Project',
				extensions: ['plume']
			}

		]
	}, function (fileName) {
		fs.readFile(fileName[0], function (err, data) {
			let project = JSON.parse(data);
				
			project.pathFile = fileName.toString();
			
			ipc.send('openEditor_Blank', project, fileName);
		});
	});
});