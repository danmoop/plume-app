const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const remote = require('electron').remote;
const currentWindow = require('electron').remote.getCurrentWindow();
project = currentWindow.po;
const Sortable = require('sortablejs');

const blankSidebar = require('./model/blank-sidebar');
const sidebar = require('./model/script-sidebar');

if (project.type == "blank")
    getEl('left-sidebar').innerHTML = blankSidebar;
else
    getEl('left-sidebar').innerHTML = '<h3 class="bl">Drag and move your lists to change their order</h3>\n' + sidebar;

loadLists();

getEl('mn').style.margin = "0px";

var buttons = document.getElementsByClassName('mdl-button mdl-js-button mdl-button--icon');

for (var i = 0; i < buttons.length; i++) {
    buttons[i].style.display = "none";
}

var blankList = getEl('Draft_Files');
var actorList = getEl('Actor_Files');
var locationList = getEl('Location_Files');

Sortable.create(blankList);

if (project.type == "book" || project.type == "script") {
    Sortable.create(actorList);
    Sortable.create(locationList);
}

document.getElementById('Draft_Files').getElementsByClassName('li');

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

                    var list = document.createElement("li");
                    list.href = "#/";
                    list.id = proj.lists[i].id;
                    list.style = 'text-overflow: ellipsis; white-space: nowrap;';
                    list.innerHTML = "<i class = 'far fa-file'></i> " + proj.lists[i].title
                    document.getElementById('Draft_Files').appendChild(list);
                }

                for (var w = 0; w < proj.trash.length; w++) {
                    var trashList = document.createElement("li");
                    trashList.href = "#/";
                    trashList.id = proj.trash[w].id;
                    trashList.className = "deletedA";
                    trashList.style = 'text-overflow: ellipsis; white-space: nowrap;';

                    var title = proj.trash[w].title || proj.trash[w].name;

                    trashList.innerHTML = "<i class = 'far fa-file'></i> " + title
                    document.getElementById('Trash_Files').appendChild(trashList);
                }

                for (var w = 0; w < proj.actors.length; w++) {
                    var actorLink = document.createElement("li");
                    actorLink.href = "#/";
                    actorLink.id = proj.actors[w].id;
                    actorLink.className = "ActorA";
                    actorLink.style = 'text-overflow: ellipsis; white-space: nowrap;';
                    actorLink.innerHTML = "<i class='far fa-user'></i> " + proj.actors[w].name
                    document.getElementById('Actor_Files').appendChild(actorLink);
                }

                for (var w = 0; w < proj.places.length; w++) {
                    var actorLink = document.createElement("li");
                    actorLink.href = "#/";
                    actorLink.id = proj.places[w].id;
                    actorLink.className = "PlaceA";
                    actorLink.style = 'text-overflow: ellipsis; white-space: nowrap;';
                    actorLink.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + proj.places[w].name
                    document.getElementById('Location_Files').appendChild(actorLink);
                }
            } else {
                console.log("ERROR CAUGHT");
                loadLists();
            }
        }, 50);
    });
}

getEl('applyChanges').addEventListener('click', function () {
    var draft_files = getEl('Draft_Files').getElementsByTagName('li');


    if(project.type == "book" || project.type == "script")
    {
        var actor_files = getEl('Actor_Files').getElementsByTagName('li');
        var location_files = getEl('Location_Files').getElementsByTagName('li');
    }

    var project_lists = project.lists;
    var project_actors = project.actors;
    var project_locations = project.places;

    var new_lists = [];
    var new_actors = [];
    var new_places = [];

    console.log(project.lists);
    console.log("-------------------");

    //DRAFT
    for (var i = 0; i < draft_files.length; i++) {
        var l_title = draft_files[i].innerText.substr(1);
        var l_id = draft_files[i].id;
        var l_content;

        for (var w = 0; w < project.lists.length; w++) {
            if (l_id == project.lists[w].id)
                l_content = project.lists[w].content;
        }

        var new_list = {
            content: l_content,
            id: l_id,
            title: l_title
        }

        new_lists.push(new_list);
    }

    project.lists = new_lists;

    // ACTORS
    if (project.type == "book" || project.type == "script") {
        for (var i = 0; i < actor_files.length; i++) {
            var l_name = actor_files[i].innerText.substr(1);
            var l_id = actor_files[i].id;
            var l_content;

            for (var w = 0; w < project.actors.length; w++) {
                if (l_id == project.actors[w].id)
                    l_content = project.actors[w].content;
            }

            var new_actor = {
                content: l_content,
                id: l_id,
                name: l_name
            }

            new_actors.push(new_actor);
        }

        project.actors = new_actors;


        // PLACES
        for (var i = 0; i < location_files.length; i++) {
            var l_name = location_files[i].innerText.substr(1);
            var l_id = location_files[i].id;
            var l_content;

            for (var w = 0; w < project.places.length; w++) {
                if (l_id == project.places[w].id)
                    l_content = project.places[w].content;
            }

            var new_place = {
                content: l_content,
                id: l_id,
                name: l_name
            }

            new_places.push(new_place);
        }

        project.places = new_places;
    }

    fs.writeFile(project.pathFile, JSON.stringify(project, null, "\t"), err => {

        if (!err) {
            ipc.send('updateOrder');
        }
    });
});

function getEl(element) {
    return document.getElementById(element);
}
