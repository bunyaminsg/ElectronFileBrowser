const trash = require('trash');
const path = require("path");
const fs = require("fs");
const showError = require("./common").showError;
const { remote } = require('electron');

function removeFile(pathToRemove) {
  trash([pathToRemove]).then((trashPath) => {
    // trashPath => [{ "path": <path_to_file_in_trash>, "info": <path_to_info_of_file_in_trash> }
    // console.log(trashPath);
    remote.getGlobal("favourites").favourites.forEach((fav, i, arr) => {
      if (fav.path === pathToRemove) {
        arr.splice(i, 1);
      }
    });
    $(`*[path=${pathToRemove}]`).remove();
  }, (err) => {
    showError(err);
  });
}

async function newFile() {
  return new Promise(success => {
    const $newFileName = $("#new-file-name");
    $("#file-nav").find("tbody").append(`<tr id="nfn-wrapper"><td id="new-file-name" colspan="999" contentEditable="true"></td></tr>`);
    $newFileName.focus();
    $newFileName
      .on("blur", (e) => {
        e.preventDefault();
        $("#new-file-name").focus();
      })
      .on("keyup", async (e) => {
        e.preventDefault();
        console.log(e);
        switch (e.key.toLowerCase()) {
          case 'enter':
            const filePath = path.join(remote.getGlobal("current_dir"), $newFileName.html().replace(/^([^<]*).*$/, "$1"));
            fs.writeFile(filePath, "", async (err) => {
              if (err) {
                showError(err);
                success(false);
              } else {
                success(true);
              }
              $("#nfn-wrapper").remove();
              $(`tr[path="${filePath}"]`).focus();
            });
            break;
          case 'escape':
            $("#nfn-wrapper").remove();
            success(false);
            break;
          default:
        }
      });
  });
}

async function getDrives() {
  const drives = [];
  if (!/^linux/i.test(process.platform)) return [];
  const [rd_err, files] = await promisify(fs.readdir, [path.join('/media/', os.userInfo().username)]);
  if (!rd_err && files) {
    drives.push(...files.map(file => {
      return {
        label: file.length > 12 ? file.substring(0, 9) + '...' : file,
        path: path.join('/media/', os.userInfo().username, file)
      };
    }))
  }
  const [rd_err2, files2] = await promisify(fs.readdir, ['/mnt']);
  if (!rd_err2 && files2) {
    drives.push(...files2.map(file => {
      return {
        label: file.length > 12 ? file.substring(0, 9) + '...' : file,
        path: path.join('/mnt/', file)
      };
    }))
  }
  return drives;
}

module.exports = {
  removeFile: removeFile,
  newFile: newFile,
  getDrives: getDrives
};