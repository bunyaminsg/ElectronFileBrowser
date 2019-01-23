const os = require("os");
const path = require("path");

const OS = {
  LINUX: 1,
  WINDOWS: 2,
  MAC: 3,
  OTHER: -1
};

exports.OS = OS;

function getOS () {
  if (/^win/i.test(process.platform)) {
    return OS.WINDOWS;
  } else if (/^darwin/i.test(process.platform)) {
    return OS.MAC;
  } else if (/^linux/i.test(process.platform)) {
    return OS.LINUX;
  } else {
    return OS.OTHER;
  }
}

exports.getOS = getOS;

exports.getAppDataFolder = () => {
  switch (getOS()) {
    case OS.WINDOWS:
      return path.join(os.homedir(), "AppData", "Local", "ElectronFileBrowser");
    case OS.MAC:
      return path.join(os.homedir(), "Library", "Application Support", "ElectronFileBrowser");
    case OS.LINUX:
    case OS.OTHER:
      return path.join(os.homedir(), ".config", "ElectronFileBrowser");
  }
};
