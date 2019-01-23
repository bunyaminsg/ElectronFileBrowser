const { remote } = require('electron');
const { Menu, MenuItem } = remote;
const path = require("path");
const newFile = require("../util/file-operations").newFile;
const removeFile = require("../util/file-operations").removeFile;
const createProject = require("../util/file-operations").createProject;
const ls = require("../components/navigator").ls;
const $ = require("jquery");
const renameFile = require("../util/file-operations").renameFile;
const newFolder = require("../util/file-operations").newFolder;
const {getOS, OS} = require("../util/operating-system");
const os = require("os");
const fs = require("fs");

let isFileNavElement;
let targetElement;
let rightClickPosition;

async function ls_n_focus(success, newPath) {
  if (success) {
    await ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
    $("#file-nav").find(`tr[path="${newPath}"]`).focus();
  }
}

/** Navigator Menu **/
const projectTemplates = [];
try {
  const nodeModules = fs.readdirSync((getOS() === OS.WINDOWS) ? path.join(os.homedir(), "AppData", "npm", "node_modules") : "/usr/local/lib/node_modules");
  console.log(nodeModules);
  if (nodeModules.indexOf("@angular") > -1) projectTemplates.push(new MenuItem({label: "Angular", click: async () => ls_n_focus(...await createProject(targetElement, "angular"))}));
  if (nodeModules.indexOf("ionic") > -1) projectTemplates.push(new MenuItem({label: "Ionic", click: async () => ls_n_focus(...await createProject(targetElement, "ionic"))}));
} catch (err) { console.log(err); }
projectTemplates.push(new MenuItem({label: "C++", click: async () => ls_n_focus(...await createProject(targetElement, "cpp"))}));
projectTemplates.push(new MenuItem({label: "Electron", click: async () => ls_n_focus(...await createProject(targetElement, "electron"))}));
const projectMenuItem = new MenuItem({label: "Project", submenu: projectTemplates});

const isNavigatorElement = (elem) => $(elem).is("#file-nav *");

const inspectMenuItem = new MenuItem({label: 'Inspect Element', click: () => remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)});
const addToFavouritesMenuItem = new MenuItem({label: 'Add to Favourites', click: (...args) => remote.getGlobal("providers").favourites.add($(targetElement).attr("path").split(path.sep).slice(-1)[0], $(targetElement).attr("path"))});
const removeMenuItem = new MenuItem({label: 'Delete', click: (...args) => removeFile($(targetElement).attr("path"))});
const newDocumentMenuItem = new MenuItem({label: 'Document', click: async (...args) => ls_n_focus(...await newFile(targetElement))});
const newFolderMenuItem = new MenuItem({label: 'Folder', click: async (...args) => ls_n_focus(...await newFolder(targetElement))});
const newMenuItem = new MenuItem({label: 'New', submenu: [newDocumentMenuItem, newFolderMenuItem].concat(projectTemplates.length ? [projectMenuItem] : [])})
const renameMenuItem = new MenuItem({label: 'Rename', click: async (...args) => ls_n_focus(...await renameFile(targetElement))});
const navigatorMenuItems = [
  newMenuItem,
  renameMenuItem,
  removeMenuItem,
  addToFavouritesMenuItem,
  inspectMenuItem
];
const navigatorMenu = new Menu();
navigatorMenuItems.forEach(menuItem => navigatorMenu.append(menuItem));

/** Folder Navigator Menu **/
const isFolderElement = (elem) => $(elem).is("#file-nav-wrapper");
const folderMenuItems = [
  newMenuItem,
  addToFavouritesMenuItem,
  inspectMenuItem
];
const folderMenu = new Menu();
folderMenuItems.forEach(menuItem => folderMenu.append(menuItem));

/** Favourites Menu **/

const isFavouritesElement = (elem) => $(elem).is("#favourites *");

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
    let targetSelector;
    let targetMenu;
    if (isNavigatorElement(target)) { targetSelector = "tr[path]"; targetMenu = navigatorMenu; }
    else if (isFavouritesElement(target)) { targetSelector = "[id|=fav]"; targetMenu = favouritesMenu; }
    else if (isFolderElement(target)) { targetSelector = "#file-nav-wrapper"; targetMenu = folderMenu; }
    else return;
    while (target && !$(target).is(targetSelector)) target = target.parentElement;
    if (target) { targetElement = target; targetMenu.popup(remote.getCurrentWindow()); }
  }, false);
}

module.exports = {
  init: init
};
