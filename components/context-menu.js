const { remote } = require('electron');
const { Menu, MenuItem } = remote;
const path = require("path");
const newFile = require("../util/file-operations").newFile;
const removeFile = require("../util/file-operations").removeFile;
const ls = require("../components/navigator").ls;
const $ = require("jquery");
const renameFile = require("../util/file-operations").renameFile;
const newFolder = require("../util/file-operations").newFolder;

let isFileNavElement;
let targetElement;
let rightClickPosition;

const inspectMenuItem = new MenuItem({
  label: 'Inspect Element',
  click: () => {
    remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
  }
});

const addToFavouritesMenuItem = new MenuItem(
  {
    label: 'Add to Favourites',
    click: (...args) => {
      remote.getGlobal("providers").favourites.add($(targetElement).attr("path").split(path.sep).slice(-1)[0], $(targetElement).attr("path"));
    }
  }
);

const removeMenuItem = new MenuItem({label: 'Delete', click: (...args) => { removeFile($(targetElement).attr("path")); }});

const newDocumentMenuItem = new MenuItem(
  {
    label: 'New Document',
    click: async (...args) => {
      const [success, newPath] = await newFile(targetElement);
      if (success) {
        await ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
        $("#file-nav").find(`tr[path="${newPath}"]`).focus();
      }
    }
  }
);

const newFolderMenuItem = new MenuItem(
  {
    label: 'New Folder',
    click: async (...args) => {
      const [success, newPath] = await newFolder(targetElement);
      if (success) {
        await ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
        $("#file-nav").find(`tr[path="${newPath}"]`).focus();
      }
    }
  }
);

const renameMenuItem = new MenuItem(
  {
    label: 'Rename',
    click: async (...args) => {
      const success = await renameFile(targetElement);
      // if (success) {
      //   ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
      // }
    }
  }
);

const navigatorMenu = new Menu();
const navigatorMenuItems = [
  newFolderMenuItem,
  newDocumentMenuItem,
  addToFavouritesMenuItem,
  renameMenuItem,
  removeMenuItem,
  inspectMenuItem
];
navigatorMenuItems.forEach(menuItem => navigatorMenu.append(menuItem));

const removeFromFavouritesMenuItem = new MenuItem(
  {
    label: 'Remove from Favourites',
    click: (...args) => {
      const favourites = remote.getGlobal("providers").favourites;
      favourites.remove(
        favourites.favourites.filter(fav => `fav-${fav.id}` === $(targetElement).attr("id"))[0]
      );
    }
  }
);

const favouritesMenu = new Menu();
const favouritesMenuItems = [
  removeFromFavouritesMenuItem
];
favouritesMenuItems.forEach(menuItem => favouritesMenu.append(menuItem));

function init() {
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    rightClickPosition = {x: e.x, y: e.y};
    targetElement = undefined;
    let target = e.target;
    if ($(target).is("#file-nav *")) {
      while (target && !$(target).is("tr[path]")) {
        target = target.parentElement;
      }
      if (target) {
        isFileNavElement = true;
        targetElement = target;
        navigatorMenu.popup(remote.getCurrentWindow())
      }
    } else if ($(target).is("#favourites *")) {
      while (target && !$(target).is('[id|=fav]')) {
        target = target.parentElement;
      }
      if (target) {
        isFileNavElement = true;
        targetElement = target;
        favouritesMenu.popup(remote.getCurrentWindow())
      }
    }
  }, false);
}

module.exports = {
  init: init
};
