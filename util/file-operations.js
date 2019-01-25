const trash = require('trash');
const path = require("path");
const fs = require("fs");
const showError = require("./common").showError;
const promisify = require("./common").promisify;
const { remote } = require('electron');
const os = require("os");
const promptUser = require("./common").promptUser;
const {getAppDataFolder} = require("./operating-system");
const {runVisual} = require('./bash');
const $ = require("jquery");

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

async function getFileNameInput(elem) {
  return new Promise(resolve => {
    const row = `<tr id="nfn-wrapper"><td id="new-file-name" colspan="999" contentEditable="true"></td></tr>`;
    if (elem && $(elem).is("tr")) $(row).insertAfter(elem);
    else $("#file-nav").find("tbody").append(row);
    const $newFileName = $("#new-file-name");
    $newFileName.focus();
    $newFileName
      .on("blur", (e) => {
        e.preventDefault();
        $("#new-file-name").focus();
      })
      .on("keyup", async (e) => {
        e.preventDefault();
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
            resolve($newFileName.html().replace(/^([^<]*).*$/, "$1"));
            $("#nfn-wrapper").remove();
            break;
          case 'escape':
            $("#nfn-wrapper").remove();
            resolve(undefined);
            break;
          default:
        }
      });
  });
}

async function newFile(elem) {
  const name = await getFileNameInput(elem);
  if (!name) return [false];
  const filePath = path.join(remote.getGlobal("current_dir"), name);
  return new Promise(resolve => {
    fs.writeFile(filePath, "", async (err) => {
      if (err) {
        showError(err);
        resolve([false, filePath]);
      } else {
        resolve([true, filePath]);
      }
    });
  });
}

async function newFolder(elem) {
  const name = await getFileNameInput(elem);
  if (!name) return [false];
  const folderPath = path.join(remote.getGlobal("current_dir"), name);
  return new Promise(resolve => {
    fs.mkdir(folderPath, (err) => {
      if (err) {
        showError(err);
        resolve([false, folderPath]);
      } else {
        resolve([true, folderPath]);
      }
    });
  });
}

function openBashModal() {
  closeBashModal();
  $("body").append(`<div id="bash-modal" class="ui modal"><div class="scrolling content"><pre style="white-space: pre-wrap"></pre></content></div>`);
  const $outputModal = $("#bash-modal");
  $outputModal.modal({closable: false});
  $outputModal.modal('show');
}

function closeBashModal() {
  const $outputModal = $("#bash-modal");
  if ($outputModal.length) {
    $outputModal.append(`<div class="actions"><button id="close-bash-modal" class="ui primary button">OK</button></div>`);
    $("#close-bash-modal").on("click", () => {
      $outputModal.modal("hide");
      $outputModal.remove();
    });
  }
}

function creatorFromTemplate(type, fileManipulator, onComplete) {
  if (!fileManipulator) fileManipulator = _ => _;
  return async (name) => {
    if (!name) { return [false]; }
    openBashModal();
    const $outputModal = $("#bash-modal");
    const $outputPanel = $outputModal.find(".content > pre");
    $outputPanel.append(`<b>Creating project: ${name}</b><br>`);
    try {
      const templatePath = path.join(__dirname, "..", "templates", type);
      const outPath = path.join(remote.getGlobal("current_dir"), name);
      fs.mkdirSync(outPath);
      $outputPanel.append(`<b style="color: green">Created: ${outPath}</b><br>`);
      const files = fs.readdirSync(templatePath)
        .map(filePath => fileManipulator(filePath, fs.readFileSync(path.join(templatePath, filePath), "utf-8"))(name))
        .forEach(f => {
          fs.writeFileSync(path.join(outPath, f[0]), f[1], "utf-8");
          $outputPanel.append(`<b style="color: green">Created: ${path.join(outPath, f[0])}</b><br>`);
        });
      if (onComplete) {
        await onComplete(name, outPath);
      }
      closeBashModal();
      return [true, outPath];
    } catch (err) {
      $outputPanel.append(`<b style="color: red">Created: ${err}</b><br>`);
      closeBashModal();
      return [false];
    }
  };
}

const cli = {
  angular: ["ng new $name"],
  ionic: ["ionic start $name blank"],
  cpp: creatorFromTemplate("cpp", (fileName, fileContent) => {
    return (name) => [
      fileName.replace(/\$name/g, name),
      fileContent.replace(/\$name/g, fileName.endsWith("cpp") ? name : name.replace(/\./g, "_").toUpperCase())
    ];
  }),
  electron: creatorFromTemplate("electron", (fileName, fileContent) => {
    return (name) => [
      fileName.replace(/\$name/g, name),
      fileContent.replace(/\$nameLowerCase/g, name.toLowerCase()).replace(/\$name/g, name)
    ];
  }, async (name, outputPath) => {
    await runVisual("npm", ["install", "--prefix", outputPath], 1, 2);
    return;
  })
}

async function createProject(elem, type) {
  const name = await getFileNameInput(elem);
  if (!name) return [false];
  if (!cli[type]) { showError(type + " CLI not found."); return [false]; };
  if (Array.isArray(cli[type])) {
    try {
      cli[type].forEach(async (cmd, index, all) => {
        const command = cmd.split(" ")[0];
        const args = cmd.replace(/\$name/g, name).split(" ").slice(1);
        await runVisual(command, args, index, all.length - 1);
      });
      return [true, path.join(__dirname, name)];
    } catch (err) {
      showError(err);
      return [false];
    }
  } else if (typeof cli[type] === 'function') {
    return await cli[type](name);
  }
}

async function renameFile(elem) {
  const $elem = $(elem);
  const $fileNameCol = $($elem.find("td")[0]);
  const $icon = $fileNameCol.find("i.icon");
  const $iconClone = $icon.clone();
  const oldPath = $elem.attr("path");
  const filePath = $elem.attr("path").split(path.sep).slice(0,-1);
  const fileName = $elem.attr("path").split(path.sep).slice(-1)[0];
  $icon.remove();
  $fileNameCol.attr("contentEditable", true);
  $fileNameCol.focus();

  return new Promise(resolve => {
    const _rename = () => {
      $fileNameCol.off("blur");
      $fileNameCol.off("keyup");
      $fileNameCol.removeAttr("contentEditable");
      const newFileName = $fileNameCol.html()
        .replace(/^([^<]*).*$/, "$1")
        .replace('\n', '')
        .trim();
      const newPath = path.join(...filePath, newFileName);
      $elem.attr("path", newPath);
      $fileNameCol.html("");
      $fileNameCol.append($iconClone);
      $fileNameCol.append(newFileName);
      $elem.css("pointer-events", "auto");
      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          showError(err);
          _revert();
        } else {
          resolve([true, newPath]);
          remote.getGlobal("providers").favourites.favourites.forEach((fav) => {
            if (fav.path === oldPath) {
              remote.getGlobal("providers").favourites.remove(fav);
              remote.getGlobal("providers").favourites.add(newFileName, newPath);
            }
          });
        }
      });
    };
    const _revert = () => {
      $fileNameCol.removeAttr("contentEditable");
      $fileNameCol.html("");
      $fileNameCol.append($iconClone);
      $fileNameCol.append(fileName);
      $fileNameCol.off("blur");
      $fileNameCol.off("keyup");
      $elem.attr("path", oldPath);
      $elem.css("pointer-events", "auto");
      resolve([false]);
    };
    $elem.css("pointer-events", "none");
    $fileNameCol
      .on("blur", () => $fileNameCol.focus())
      .on("keyup", async (e) => {
        e.preventDefault();
        switch (e.key.toLowerCase()) {
          case 'enter':
            _rename();
            break;
          case 'escape':
            _revert();
            break;
          default:
        }
      })
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
  readAppDataFile: readAppDataFile,
  newFolder: newFolder,
  renameFile: renameFile,
  createProject: createProject
};
