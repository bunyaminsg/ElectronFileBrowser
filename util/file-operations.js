const trash = require('trash');
const path = require("path");
const fs = require("fs");
const showError = require("./common").showError;
const promisify = require("./common").promisify;
const { remote } = require('electron');
const os = require("os");
const promptUser = require("./common").promptUser;
const {getAppDataFolder} = require("./operating-system");

function writeFile(file_path, data, sync) {
  if (sync) {
    try {
      fs.writeFileSync(file_path, JSON.stringify(data), "utf-8");
      return undefined;
    } catch (err) {
      return err;
    }
  } else {
    return new Promise(resolve => fs.writeFile(file_path, JSON.stringify(data), "utf-8", (err) => {
      resolve(err);
    }));
  }
}

function readFile(file_path, sync) {
  if (sync) {
    try {
      const data = fs.readFileSync(file_path, "utf-8");
      return [undefined, JSON.parse(data)];
    } catch (err) {
      return [err];
    }
  } else {
    return new Promise(resolve => fs.readFile(file_path, "utf-8", (err, data) => {
      resolve([err, JSON.parse(data)]);
    }));
  }
}

function writeAppDataFile(filename, data, sync) {
  const appDataFolder = getAppDataFolder();
  if (!fs.existsSync(appDataFolder)) {
    fs.mkdirSync(appDataFolder);
  }
  return writeFile(path.join(appDataFolder, filename), data, sync);
}

function readAppDataFile(filename, sync) {
  const appDataFolder = getAppDataFolder();
  return readFile(path.join(appDataFolder, filename), sync);
}

function removeFile(pathToRemove) {
  promptUser("Delete " + pathToRemove, "Are you sure?", ["No", "Yes"]).then((i) => {
    if (parseInt("" + i, 10) === 1) {
      trash([pathToRemove]).then((trashPath) => {
        // trashPath => [{ "path": <path_to_file_in_trash>, "info": <path_to_info_of_file_in_trash> }
        // console.log(trashPath);
        remote.getGlobal("providers").favourites.favourites.forEach((fav) => {
          if (fav.path === pathToRemove) {
            remote.getGlobal("providers").favourites.remove(fav);
          }
        });
        $(`[path]`).each(function () {
          if ($(this).attr("path") === pathToRemove) {
            $(this).remove();
          }
        });
      }, (err) => {
        showError(err);
      });
    }
  });
}

async function newFile() {
  return new Promise(success => {
    $("#file-nav").find("tbody").append(`<tr id="nfn-wrapper"><td id="new-file-name" colspan="999" contentEditable="true"></td></tr>`);
    const $newFileName = $("#new-file-name");
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
          case 'escape':
            $newFileName.off("blur");
            $newFileName.off("keyup");
            break;
          default:
        }
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
  getDrives: getDrives,
  writeAppDataFile: writeAppDataFile,
  readAppDataFile: readAppDataFile
};
