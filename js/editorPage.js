const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const fs = require('fs');
const Menu = require('electron').remote.Menu;
const blankSidebar = require('./model/blank-sidebar');
const scriptSidebar = require('./model/script-sidebar');
var currentWindow = require('electron').remote.getCurrentWindow();
var globalShortcut = require('electron').remote.globalShortcut;
const shell = require('electron').remote.shell;

const jsPDF = require('jspdf');
const html2pdf = require('html2pdf.js');
const html2canvas = require('html2canvas');

globalShortcut.register('ctrl+s', function () {

    fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
        if (err) dialog.showErrorBox(err);

        popupSave("Saved!");
    });
});

rl = function () {
    globalShortcut.unregister('ctrl+s');
    location.reload();
}

const blankMenu = [{
	label: 'File',
	submenu: [{
			label: 'Create new / Open project',
			click() {

				popupSave('Saved!');

				fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
					if (err) dialog.showErrorBox(err);
				});

				setTimeout(function () {
					globalShortcut.unregister('ctrl+s');
					ipc.send('openMainPage');
				}, 100);
			}
		},
		{
			label: 'Save all',
			click() {
				fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
					if (err) dialog.showErrorBox(err);
				});

				popupSave('Saved!');
			}
		},
		{
			label: 'Open project directory',
			click() {
				var directory = '';

				var strs = project.pathFile.split("\\");

				for (var i = 0; i < strs.length - 1; i++) {
					directory = directory + strs[i] + "\\";
				}

				shell.openItem(directory);
			}
		},
		{
			label: 'Exit',
			click() {
				ipc.send('appExit');
			}
		}
	]
},
{
	label: 'Lists',
	submenu: [{
		label: 'Reorder lists',
		click() {
			ipc.send('openOrganizer', project);
			ipc.send('sendToOrganizer');
		}
	}]
},
{
	label: 'View',
	submenu: [{
			label: 'Maximize window',
			click() {
				ipc.send('window_Max');
			}
		},
		{
			label: 'Refresh window',
			click() {
				popupSave('Saved!');

				fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
					if (!err) rl();
				});
			}
		}
	]
},
{
	label: 'Export',
	submenu: [{
			label: 'To PDF',
			click() {
				if (typeof quill !== 'undefined')
				{
					ipc.send('minimize_win');
					saveToPDF();
				}
				else {
					ipc.send('minimize_win');
					getEl(project.lists[0].id).click();
					saveToPDF();
				}
			}
		},
		{
			label: 'To TXT',
			click() {
				dialog.showSaveDialog({
					filters: [{
						name: 'TXT File',
						extensions: ['txt']
					}]
				}, function (fileName) {

					var content = '';

					var lists = project.lists;

					for (var i = 0; i < lists.length; i++) {
						content = content + lists[i].content;
					}

					if (typeof quill === 'undefined')
						getEl(project.lists[0].id).click();

					quill.clipboard.dangerouslyPasteHTML(content);

					fs.writeFile(fileName, quill.container.firstChild.innerText, err => {
						if (!err) {
							quill.clipboard.dangerouslyPasteHTML(chosenList.content);
							dialog.showMessageBox({
								message: "Saved as TXT to " + fileName,
								buttons: ['OK']
							}, function (response) {
								if (response === 0) {
									hideEditor();
								}
							});
						}
					});
				});
			}
		}
	]
},
{
	label: 'Print',
	submenu: [{
			label: 'Print this list only',
			click() {
				if (typeof quill !== 'undefined') {


					var quill_element = document.getElementsByClassName("ql-editor")[0];

					var finalDoc = document.createElement('div');

					finalDoc.appendChild(quill_element);

					document.body.innerHTML = "";
					document.body.appendChild(finalDoc);

					window.print();

					rl();
				} else
					dialog.showErrorBox("Choose any list at first", "");
			}
		},
		{
			label: 'Print entire document',
			click() {

				var pages = [];

				for (var i = 0; i < project.lists.length; i++) {
					document.getElementById(project.lists[i].id).click();
					var quill_element = document.getElementsByClassName("ql-editor")[0];
					pages.push(quill_element);
				}
				hideEditor();
				var finalDoc = document.createElement('div');

				for (var q = 0; q < pages.length; q++) {
					finalDoc.appendChild(pages[q]);
				}

				document.body.innerHTML = "";

				document.body.appendChild(finalDoc);

				window.print();

				rl();
			}
		}
	]
}
]

window.onload = function () {

    Menu.setApplicationMenu(Menu.buildFromTemplate(blankMenu));

    initialize();

    fs.readFile(project.pathFile, function (err, data) {
        project.lists = JSON.parse(data.toString()).lists;
    });

    document.getElementById('listNameInput').style.display = "none";

    loadLists();

    document.getElementById('add_draft').addEventListener('click', function () {
        lists = project.lists;

        var list = {
            title: "Untitled",
            content: '',
            id: "list_" + makeid()
        }

        lists.push(list);

        project.lists = lists;

        fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
            if (err) dialog.showErrorBox(err);

            popupSave("Created!");
        });

        setTimeout(function () {
            loadLists();
        }, 50);
    });

    if (project.type == "script" || project.type == "book") {
        document.getElementById('add_actor').addEventListener('click', function () {

            var actors = project.actors;

            var actor = {
                name: "Unnamed",
                content: '',
                id: "actor_" + makeid()
            }

            actors.push(actor);

            project.actors = actors;

            popupSave("Created!");

            setTimeout(function () {
                loadLists();
            }, 50);
        });

        getEl('add_place').addEventListener('click', function () {
            var places = project.places;

            var place = {
                name: 'Uncharted',
                content: '',
                id: 'place_' + makeid()
            }

            places.push(place);

            project.places = places;

            popupSave("Created!");

            setTimeout(function () {
                loadLists();
            }, 50);
        });
    }

    document.querySelector("#Trash_Files").addEventListener('click', function (e) {

        var listOnClickId = e.target.closest("a").id;

        getEl('demo-menu-lower-right').style.display = "none";

        for (var i = 0; i < project.trash.length; i++) {
            if (listOnClickId == project.trash[i].id) {
                createEditor(project.trash[i], "trash");
            }
        }
    });

    document.querySelector("#Draft_Files").addEventListener('click', function (e) {

        if (typeof quill !== 'undefined' && quill.container != undefined && chosenList != null)
            chosenList.content = quill.container.firstChild.innerHTML;

        for (var i = 0; i < project.lists.length; i++) {
            if (chosenList != null && chosenList.id == project.lists[i].id)
                project.lists[i].content = chosenList.content;
        }

        fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
            if (err) dialog.showErrorBox(err);
        });

        var listOnClickId = e.target.closest("a").id;

        for (var i = 0; i < project.lists.length; i++) {
            if (listOnClickId == project.lists[i].id) {
                createEditor(project.lists[i], "draft");
                getEl('demo-menu-lower-right').style.display = "block";
            }
        }

        getEl('actionList').innerHTML = '';
        var deleteLi = document.createElement('li');
        deleteLi.className = "mdl-menu__item";
        deleteLi.innerHTML = "Delete <b>" + chosenList.title + "</b>";

        deleteLi.addEventListener('click', function () {

            dialog.showMessageBox({
                type: 'question',
                buttons: ['Yes', 'No'],
                title: 'Confirm',
                message: 'Do you really want to delele this list?'
            }, function (response) {
                if (response === 0) {
                    var lists = project.lists;
                    for (var i = 0; i < lists.length; i++) {
                        if (lists[i].id == chosenList.id) {
                            lists.splice(i, 1);
                            project.lists = lists;

                            var trash = project.trash;

                            trash.push(chosenList);

                            project.trash = trash;

                            document.getElementById('projectTitle').click();
                            getEl('actionList').innerHTML = '';

                            fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
                                if (!err) {
                                    loadLists();
                                    hideEditor();
                                    chosenList = null;
                                }
                            });
                        }
                    }
                } else {
                    document.getElementById('projectTitle').click();
                    //getEl('actionList').innerHTML = '';
                }
            });
        });

        getEl('actionList').appendChild(deleteLi);

        quill.on('text-change', function (delta, source) {
            setWordsNSymbolCount();
        });

        setWordsNSymbolCount();
    });

    if (project.type == "book" || project.type == "script") {
        document.querySelector("#Actor_Files").addEventListener('click', function (e) {
            if (typeof quill !== 'undefined' && quill.container != undefined && chosenList != null)
                chosenList.content = quill.container.firstChild.innerHTML;

            for (var i = 0; i < project.actors.length; i++) {
                if (chosenList != null && chosenList.id == project.actors[i].id)
                    project.actors[i].content = chosenList.content;
            }

            fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
                if (err) dialog.showErrorBox(err);
            });

            var listOnClickId = e.target.closest("a").id;

            for (var i = 0; i < project.actors.length; i++) {
                if (listOnClickId == project.actors[i].id) {
                    createEditor(project.actors[i], "draft");
                    getEl('demo-menu-lower-right').style.display = "block";
                }
            }

            getEl('actionList').innerHTML = '';
            var deleteLi = document.createElement('li');
            deleteLi.className = "mdl-menu__item";
            deleteLi.innerHTML = "Delete <b>" + chosenList.name + "</b>";

            deleteLi.addEventListener('click', function () {

                dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    title: 'Confirm',
                    message: 'Do you really want to delele this list?'
                }, function (response) {
                    if (response === 0) {
                        var actors = project.actors;
                        for (var i = 0; i < actors.length; i++) {
                            if (actors[i].id == chosenList.id) {
                                actors.splice(i, 1);
                                project.actors = actors;

                                var trash = project.trash;

                                trash.push(chosenList);

                                project.trash = trash;

                                document.getElementById('projectTitle').click();
                                getEl('actionList').innerHTML = '';

                                fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
                                    if (!err) {
                                        loadLists();
                                        hideEditor();
                                        chosenList = null;
                                    }
                                });
                            }
                        }
                    } else {
                        document.getElementById('projectTitle').click();
                        //getEl('actionList').innerHTML = '';
                    }
                });
            });

            getEl('actionList').appendChild(deleteLi);

            quill.on('text-change', function (delta, source) {
                setWordsNSymbolCount();
            });

            setWordsNSymbolCount();
        });

        document.querySelector("#Location_Files").addEventListener('click', function (e) {
            if (typeof quill !== 'undefined' && quill.container != undefined && chosenList != null)
                chosenList.content = quill.container.firstChild.innerHTML;

            for (var i = 0; i < project.places.length; i++) {
                if (chosenList != null && chosenList.id == project.places[i].id)
                    project.places[i].content = chosenList.content;
            }

            fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
                if (err) dialog.showErrorBox(err);
            });

            var listOnClickId = e.target.closest("a").id;

            for (var i = 0; i < project.places.length; i++) {
                if (listOnClickId == project.places[i].id) {
                    createEditor(project.places[i], "draft");
                    getEl('demo-menu-lower-right').style.display = "block";
                }
            }

            getEl('actionList').innerHTML = '';
            var deleteLi = document.createElement('li');
            deleteLi.className = "mdl-menu__item";
            deleteLi.innerHTML = "Delete <b>" + chosenList.name + "</b>";

            deleteLi.addEventListener('click', function () {

                dialog.showMessageBox({
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    title: 'Confirm',
                    message: 'Do you really want to delele this list?'
                }, function (response) {
                    if (response === 0) {
                        var places = project.places;
                        for (var i = 0; i < places.length; i++) {
                            if (places[i].id == chosenList.id) {
                                places.splice(i, 1);
                                project.places = places;

                                var trash = project.trash;

                                trash.push(chosenList);

                                project.trash = trash;

                                document.getElementById('projectTitle').click();
                                getEl('actionList').innerHTML = '';

                                fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
                                    if (!err) {
                                        loadLists();
                                        hideEditor();
                                        chosenList = null;
                                    }
                                });
                            }
                        }
                    } else {
                        document.getElementById('projectTitle').click();
                        //getEl('actionList').innerHTML = '';
                    }
                });
            });

            getEl('actionList').appendChild(deleteLi);

            quill.on('text-change', function (delta, source) {
                setWordsNSymbolCount();
            });

            setWordsNSymbolCount();
        });
    }

    $("#Actor_Files").mousedown(function (ev) {
        if (ev.which == 3) {

            var name;
            var id;

            for (var i = 0; i < project.actors.length; i++) {
                if (ev.target.closest('a').id == project.actors[i].id) {

                    name = project.actors[i].name;
                    id = project.actors[i].id;

                    console.log("Name: " + name + "\n" + "ID: " + id);
                }
            }
        }
    });

}

function initialize() {

    var fonts = ['sofia', 'roboto', 'lato', 'serif', 'sans-serif', 'Inconsolata', 'Pacifico'];
    var Font = Quill.import('formats/font');
    Font.whitelist = fonts;
    Quill.register(Font, true);

    project = currentWindow.plumeProject;
    lists = project.lists;
    document.title = "PLUME - " + project.filename;
    chosenList = "none";
    var sbar = document.createElement("div");

    if (project.type == "blank")
        sbar.innerHTML = blankSidebar;
    else if (project.type == "script" || project.type == "book")
        sbar.innerHTML = scriptSidebar;

    var quill;
    document.getElementById('left-sidebar').appendChild(sbar);

    document.getElementById('projectTitle').innerHTML = project.filename;
}

function loadLists() {
    getEl('Draft_Files').innerHTML = ''; // Clear the contents ( to prevent displaying the same elements )
    getEl('Trash_Files').innerHTML = '';

    if (project.type == "script" || project.type == "book") {
        getEl('Actor_Files').innerHTML = '';
        getEl('Location_Files').innerHTML = '';
    }

    fs.readFile(project.pathFile, function (err, data) {

        setTimeout(function () {
            if (data.toString() != '') {

                try {
                    var proj = JSON.parse(data.toString());
                } catch (err) {
                    console.log("ERROR: " + err);
                }

                for (var i = 0; i < proj.lists.length; i++) {

                    var list = document.createElement("a");
                    list.href = "#/";
                    list.id = proj.lists[i].id;
                    list.style = 'text-overflow: ellipsis; white-space: nowrap;';
                    list.innerHTML = "<li><i class = 'far fa-file'></i> " + proj.lists[i].title + "</li>"
                    document.getElementById('Draft_Files').appendChild(list);
                }

                for (var w = 0; w < proj.trash.length; w++) {
                    var trashList = document.createElement("a");
                    trashList.href = "#/";
                    trashList.id = proj.trash[w].id;
                    trashList.className = "deletedA";
                    trashList.style = 'text-overflow: ellipsis; white-space: nowrap;';

                    var title = proj.trash[w].title || proj.trash[w].name;

                    trashList.innerHTML = "<li><i class = 'far fa-file'></i> " + title + "</li>"
                    document.getElementById('Trash_Files').appendChild(trashList);
                }

                for (var w = 0; w < proj.actors.length; w++) {
                    var actorLink = document.createElement("a");
                    actorLink.href = "#/";
                    actorLink.id = proj.actors[w].id;
                    actorLink.className = "ActorA";
                    actorLink.style = 'text-overflow: ellipsis; white-space: nowrap;';
                    actorLink.innerHTML = "<li><i class='far fa-user'></i> " + proj.actors[w].name + "</li>"
                    document.getElementById('Actor_Files').appendChild(actorLink);
                }

                for (var w = 0; w < proj.places.length; w++) {
                    var actorLink = document.createElement("a");
                    actorLink.href = "#/";
                    actorLink.id = proj.places[w].id;
                    actorLink.className = "PlaceA";
                    actorLink.style = 'text-overflow: ellipsis; white-space: nowrap;';
                    actorLink.innerHTML = '<li><i class="fas fa-map-marker-alt"></i> ' + proj.places[w].name + "</li>"
                    document.getElementById('Location_Files').appendChild(actorLink);
                }
            } else {
                console.log("ERROR CAUGHT");
                loadLists();
            }
        }, 50);
    });
}

function popupSave(msg) {
    var notification = document.querySelector('.mdl-js-snackbar');
    var data = {
        message: msg,
        timeout: 1000
    };
    notification.MaterialSnackbar.showSnackbar(data);

    if (typeof quill !== 'undefined')
        if (quill.container != undefined)
            if (chosenList != null)
                chosenList.content = quill.container.firstChild.innerHTML;

    for (var i = 0; i < project.lists.length; i++) {
        if (chosenList != null && chosenList.id == project.lists[i].id)
            project.lists[i].content = chosenList.content;
    }

    fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
        if (err) dialog.showErrorBox(err);
    });
}

function createEditor(list, type) {
    getEl('stats').style.display = "block";
    getEl('projectTitle').style.borderRight = "3px solid #fff";
    getEl('projectTitle').style.paddingRight = "25px";

    var editorDoc = document.createElement("div");
    editorDoc.id = "editor";
    chosenList = list;

    document.getElementById('content').innerHTML = '';
    document.getElementById('content').appendChild(editorDoc);

    if (getEl(chosenList.id).parentElement.id == "Trash_Files") {
        document.getElementById('listName').value = (list.title || list.name) + "(Deleted)";
        getEl('listName').readOnly = true;
        getEl('stats').style.display = "none";
        getEl('recover').style.display = "block";
    } else {
        document.getElementById('listName').value = list.title || list.name;
        getEl('listName').readOnly = false;
        getEl('stats').style.display = "block";
        getEl('recover').style.display = "none";
    }

    var toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote' /*, 'code-block'*/ ],
        [{
            'header': 1
        }, {
            'header': 2
        }],
        [{
            'list': 'ordered'
        }, {
            'list': 'bullet'
        }],
        [{
            'script': 'sub'
        }, {
            'script': 'super'
        }],
        [{
            'direction': 'rtl'
        }],
        [{
            'size': ['small', false, 'large', 'huge']
        }],
        [{
            'header': [1, 2, 3, 4, 5, 6, false]
        }],
        [{
            'color': []
        }, {
            'background': []
        }],
        [{
            'font': ['sofia', 'roboto', 'lato', 'serif', 'sans-serif', 'Inconsolata', 'Pacifico']
        }],
        [{
            'align': []
        }]
    ];
    quill = new Quill('#editor', {
        modules: {
            toolbar: toolbarOptions,
            clipboard: {
                matchVisual: false
            }
        },
        theme: 'snow'
    });

    quill.clipboard.dangerouslyPasteHTML(list.content);

    document.getElementById('listNameInput').style.display = "block";

    resizeEditor();
}

document.getElementById('listName').addEventListener('change', function () {
    for (var i = 0; i < project.lists.length; i++) {
        if (chosenList.id == project.lists[i].id) {
            project.lists[i].title = document.getElementById('listName').value;

            setTimeout(function () {
                fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
                    if (err) dialog.showErrorBox(err);
                });
            }, 50);

            document.getElementById(chosenList.id).click();
        }
    }

    for (var i = 0; i < project.actors.length; i++) {
        if (chosenList.id == project.actors[i].id) {
            project.actors[i].name = document.getElementById('listName').value;

            setTimeout(function () {
                fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
                    if (err) dialog.showErrorBox(err);
                });
            }, 50);

            document.getElementById(chosenList.id).click();
        }
    }

    for (var i = 0; i < project.places.length; i++) {
        if (chosenList.id == project.places[i].id) {
            project.places[i].name = document.getElementById('listName').value;

            setTimeout(function () {
                fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), function (err) {
                    if (err) dialog.showErrorBox(err);
                });
            }, 50);

            document.getElementById(chosenList.id).click();
        }
    }

    loadLists();
});

getEl('recoverBtn').addEventListener('click', function () {
    var lists = project.lists;
    var trash = project.trash;
    var actors = project.actors;
    var places = project.places;

    for (var i = 0; i < trash.length; i++) {
        if (chosenList.id == trash[i].id && typeof chosenList.title !== 'undefined') {
            lists.push(trash[i]);
            trash.splice(i, 1);

            project.lists = lists;
            project.trash = trash;

            fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {

            });

            loadLists();

            hideEditor();
        }

        if (chosenList.id == trash[i].id && typeof chosenList.name !== 'undefined') {

            if (chosenList.id.substring(0, 6).includes("actor"))
                actors.push(trash[i]);
            if (chosenList.id.substring(0, 6).includes("place"))
                places.push(trash[i]);

            trash.splice(i, 1);

            project.actors = actors;
            project.trash = trash;
            project.places = places;

            fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {

            });

            loadLists();

            hideEditor();
        }
    }

});

getEl('deleteForever').addEventListener('click', function () {

    dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Do you really want to delele this list forever?'
    }, function (response) {
        if (response === 0) {
            var trash = project.trash;

            for (var i = 0; i < trash.length; i++) {
                if (chosenList.id == trash[i].id) {
                    trash.splice(i, 1);
                    project.trash = trash;

                    fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {
                        if (!err) {
                            hideEditor();
                            loadLists();
                        }
                    });
                }
            }
        } else {
            document.getElementById('projectTitle').click();
            getEl('actionList').innerHTML = '';
        }
    });
});

function resizeEditor() {

    if (document.getElementById("editor") != null) {
        document.getElementById("editor").style.height = window.innerHeight - 117 + "px";
        window.onresize = function () {
            document.getElementById("editor").style.height = window.innerHeight - 117 + "px";
        }
    }
}

function hideEditor() {

    getEl('recover').style.display = "none";
    getEl('stats').style.display = "none";
    getEl('projectTitle').style.border = "none";
    getEl('demo-menu-lower-right').style.display = "none";

    document.getElementById('content').innerHTML = `
    <div style="width: 90%; margin: 0px auto; text-align: center; margin-top: 25%;">
        <span class="fz-20">Looks like there is nothing here yet. Get started by creating / opening blank file on the left sidebar!</span>
    </div>`;

    document.getElementById('listNameInput').style.display = "none";
    document.getElementById('listName').value = '';
}

function getEl(element) {
    var el = document.getElementById(element);

    return el;
}

function makeid() {
    var text = '';
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 20; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function setWordsNSymbolCount() {
    getEl('wordCount').innerHTML = "Words: <b> " + getWords() + "</b>,";
    getEl('symbolCount').innerHTML = "Symbols: <b> " + getSymbols() + "</b>";
}

function getSymbols() {
    return quill.container.innerText.length - 1;
}

function getWords() {

    if (quill.container.innerText.trim().split(/\s+/)[0] != '')
        return quill.container.innerText.trim().split(/\s+/).length;
    else
        return 0;
}

function saveToPDF() {

    var pages = [];

    for (var i = 0; i < project.lists.length; i++) {
        document.getElementById(project.lists[i].id).click();
        var quill_element = document.getElementsByClassName("ql-editor")[0];
        pages.push(quill_element);
    }
    hideEditor();
    var finalDoc = document.createElement('div');

    for (var q = 0; q < pages.length; q++) {
        finalDoc.appendChild(pages[q]);
    }

    //var html_cont = document.getElementsByClassName("ql-editor")[0];
    var pdf = new jsPDF('p', 'pt', 'a4');

    document.body.innerHTML = "";

    document.body.appendChild(finalDoc);

    ipc.send('print-that-pdf');
}

$('#listName').keypress(function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
    }
});