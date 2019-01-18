const { remote } = require("electron");
const os = require("os");
const path = require("path");
const $ = require("jquery");
const ls = require("./navigator").ls;
const uuid = require("uuid");
const showError = require("../util/common").showError;
const {readAppDataFile, writeAppDataFile} = require("../util/file-operations");

const [err, savedFavourites] = readAppDataFile("favourites.json", true);
let _favourites = err ? [
  {id: "root", name: "Root", path: remote.getGlobal("root_dir"), icon: "hdd outline"},
  {id: "home", name: "Home", path: os.homedir(), icon: "home"},
  {id: "desktop", name: "Desktop", path: path.join(os.homedir(), "Desktop"), icon: "desktop"},
  {id: "downloads", name: "Downloads", path: path.join(os.homedir(), "Downloads"), icon: "download"}
] : savedFavourites;

if (err) {
  writeAppDataFile("favourites.json", _favourites).then((_err) => {
    if (_err) showError(_err);
  });
}

function add(name, path) {
  const fav = {
    id: uuid.v4(),
    name: name,
    path: path,
    icon: "star"
  };
  _favourites.push(fav);
  $("#favourites").find(".menu").append(`<a data-tooltip="${fav.path}" data-position="right center" class="item" id="fav-${fav.id}"><i class="${fav.icon} icon"></i>${fav.name}</a>`);
  //$("#favourites").dropdown();
  $(`#fav-${fav.id}`).on("click", () => { ls(fav.path, remote.getGlobal("hideHidden")); });
  writeAppDataFile("favourites.json", _favourites).then((_err) => {
    if (_err) showError(_err);
  });
}

function remove(fav) {
  $(`#fav-${fav.id}`).remove();
  _favourites.splice(_favourites.indexOf(fav), 1);
  writeAppDataFile("favourites.json", _favourites).then((_err) => {
    if (_err) showError(_err);
  });
}

function init() {
  $("#favourites").find(".menu").html(_favourites.map(fav => `<a class="item" id="fav-${fav.id}"><i class="${fav.icon} icon"></i>${fav.name}</a>`));
  _favourites.forEach(fav => $(`#fav-${fav.id}`).on("click", () => { ls(fav.path, remote.getGlobal("hideHidden")); }));
}

module.exports = {
  favourites: _favourites,
  add: add,
  remove: remove,
  init: init
};
