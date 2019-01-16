const { remote } = require('electron');
const { Menu, MenuItem } = remote;
const trash = require('trash');

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
      console.log(fileNavElement)
      const fav = {id: "item-" + favourites.length,
        name: $(fileNavElement).attr("path").split(path.sep).slice(-1)[0],
        path: $(fileNavElement).attr("path"),
        icon: "star"
      };
      favourites.push(fav);
      $("#favourites .menu").append(`<a data-tooltip="${fav.path}" data-position="right center" class="item" id="fav-${fav.id}"><i class="${fav.icon} icon"></i>${fav.name}</a>`);
      //$("#favourites").dropdown();
      $(`#fav-${fav.id}`).on("click", () => { ls(fav.path, hideHidden); });
    }
  }
);

const removeMenuItem = new MenuItem(
  {
    label: 'Remove',
    click: (...args) => {
      const pathToRemove = $(fileNavElement).attr("path");

    }
  }
);

const newDocumentMenuItem = new MenuItem(
  {
    label: 'New Document',
    click: (...args) => {
      $("#file-nav tbody").append(`<tr id="nfn-wrapper"><td id="new-file-name" colspan="999" contentEditable="true"></td></tr>`);
      $("#new-file-name").focus();
      $("#new-file-name")
        .on("blur", (e) => {
          e.preventDefault();
          $("#new-file-name").focus();
        })
        .on("keyup", async (e) => {
          e.preventDefault();
          switch (e.key.toLowerCase()) {
            case 'enter':
              const filePath = path.join(currentDir, $("#new-file-name").html().replace(/^([^<]*).*$/, "$1"));
              fs.writeFile(filePath, "", async (err) => {
                if (err) {
                  showError(err);
                }
                $("#nfn-wrapper").remove();
                await ls(currentDir, hideHidden);
                $(`tr[path="${filePath}"]`).focus();
              });
              break;
            case 'escape':
              $("#nfn-wrapper").remove();
              break;
            default:

          }
        });
    }
  }
);

const menu = new Menu()
const menuItems = [
  addToFavouritesMenuItem,
  removeMenuItem,
  newDocumentMenuItem,
  inspectMenuItem
];
menuItems.forEach(menuItem => menu.append(menuItem));

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  rightClickPosition = {x: e.x, y: e.y}
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
}, false)
