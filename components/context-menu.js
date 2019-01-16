const { remote } = require('electron');
const { Menu, MenuItem } = remote;
const path = require("path");
let favourites;
const newFile = require("../util/file-operations").newFile;
const removeFile = require("../util/file-operations").removeFile;
const ls = require("../components/navigator").ls;
const $ = require("jquery");

let isFileNavElement;
let fileNavElement;
let rightClickPosition;

const inspectMenuItem = new MenuItem({
  label: 'Inspect Element',
  click: () => {
    remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
  }
});

const addToFavouritesMenuItem = new MenuItem(
  {
    label: 'Add To favourites',
    click: (...args) => {
      favourites.add($(fileNavElement).attr("path").split(path.sep).slice(-1)[0], $(fileNavElement).attr("path"));
    }
  }
);

const removeMenuItem = new MenuItem({label: 'Remove', click: (...args) => { removeFile($(fileNavElement).attr("path")); }});

const newDocumentMenuItem = new MenuItem(
  {
    label: 'New Document',
    click: async (...args) => {
      const success = await newFile();
      if (success) {
        ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
      }
    }
  }
);

const menu = new Menu();
const menuItems = [
  addToFavouritesMenuItem,
  removeMenuItem,
  newDocumentMenuItem,
  inspectMenuItem
];
menuItems.forEach(menuItem => menu.append(menuItem));

function init() {
  favourites = remote.getGlobal("favourites");
  console.log(favourites);
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    rightClickPosition = {x: e.x, y: e.y};
    isFileNavElement = false;
    fileNavElement = undefined;
    let target = e.target;
    if ($(target).is("#file-nav *")) {
      while (target && !$(target).is("tr[path]")) {
        target = target.parentElement;
      }
      if (target) {
        isFileNavElement = true;
        fileNavElement = target;
      }
    }
    if (isFileNavElement) {
      menu.popup(remote.getCurrentWindow())
    }
  }, false);
}

module.exports = {
  init: init
};