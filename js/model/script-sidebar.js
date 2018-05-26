sidebar = `<nav class="mdl-navigation" id="mn" style="margin-left: 25px;">
<li>
    <i class="far fa-file-alt"></i> Draft
    <button class="mdl-button mdl-js-button mdl-button--icon" id="add_draft" style="float:right;
    margin-top: -7px;">
        <i class="material-icons">add</i>
    </button>
</li>
<ul id="Draft_Files">

</ul>


<li>
<i class="far fa-user-circle"></i> Actors
    <button class="mdl-button mdl-js-button mdl-button--icon" id="add_actor" style="float:right;
    margin-top: -7px;">
        <i class="material-icons">add</i>
    </button>
</li>
<ul id="Actor_Files">

</ul>

<li>
<i class="far fa-map"></i> Places
    <button class="mdl-button mdl-js-button mdl-button--icon" id="add_place" style="float:right;
    margin-top: -7px;">
        <i class="material-icons">add</i>
    </button>
</li>
<ul id="Location_Files">

</ul>

<li>
    <i class="far fa-trash-alt"></i> Trash
</li>
<ul id="Trash_Files">

</ul>
</nav>`;

module.exports = sidebar;