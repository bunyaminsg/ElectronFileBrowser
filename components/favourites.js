const { remote } = require("electron");
const os = require("os");
const path = require("path");
const $ = require("jquery");
const ls = require("./navigator").ls;
const uuid = require("uuid");

const favourites = [];

function add(name, path) {
  const fav = {
    id: uuid.v4(),
    name: name,
    path: path,
    icon: "star"
  };
  favourites.push(fav);
  $("#favourites").find(".menu").append(`<a data-tooltip="${fav.path}" data-position="right center" class="item" id="fav-${fav.id}"><i class="${fav.icon} icon"></i>${fav.name}</a>`);
  //$("#favourites").dropdown();
  $(`#fav-${fav.id}`).on("click", () => { ls(fav.path, remote.getGlobal("hideHidden")); });
}

function init() {
  favourites.splice(0,0,...[
    {id: "root", name: "Root", path: remote.getGlobal("root_dir"), icon: "hdd outline"},
    {id: "home", name: "Home", path: os.homedir(), icon: "home"},
    {id: "desktop", name: "Desktop", path: path.join(os.homedir(), "Desktop"), icon: "desktop"},
    {id: "downloads", name: "Downloads", path: path.join(os.homedir(), "Downloads"), icon: "download"}
  ]);
  $("#favourites").find(".menu").html(favourites.map(fav => `<a class="item" id="fav-${fav.id}"><i class="${fav.icon} icon"></i>${fav.name}</a>`));
  favourites.forEach(fav => $(`#fav-${fav.id}`).on("click", () => { ls(fav.path, remote.getGlobal("hideHidden")); }));
}

module.exports = {
  favourites: favourites,
  add: add,
  init: init
};
