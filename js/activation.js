const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;

if(localStorage.getItem("Activated") == "1")
    ipc.send('openMainWin');

document.getElementById('activate').addEventListener('click', function(){

    var key_value = document.getElementById('key_value').value;

    document.getElementById('wait_p').innerHTML = "Wait a little bit...";

    $.get('https://infinite-sea-54652.herokuapp.com/checkkey/' + key_value, function(data){
    
    var success = false;
    
        if(data == "true")
        {
            success = true;

            dialog.showMessageBox({
                message: "Activated successfully!",
                buttons: ['OK']
            }, function (response) {
                if (response === 0) {
                    localStorage.setItem("Activated", "1");
                    ipc.send('openMainWin');
                }
            });
        }

        if(!success)
        {
            dialog.showMessageBox({
                message: "Wrong serial!",
                buttons: ['OK']
            }, function(response){
                if(response === 0){
                    document.getElementById('key_value').value = "";
                    document.getElementById('wait_p').innerHTML = "";
                }
            });
        }
    });

});

document.getElementById('helpbtn').addEventListener('click', function(){
    dialog.showMessageBox({
        message: "If you have problems activating program, please check your connection to the internet or try activate later! Sorry for inconvenience!\n\nIf you continue facing problems, please contact me: \nE-mail: dandurnev0@gmail.com\nTelegram: @Dandurnev",
        buttons: ['OK']
    });
});