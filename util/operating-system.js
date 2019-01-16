const OS = {
  LINUX: 1,
  WINDOWS: 2,
  MAC: 3,
  OTHER: -1
};

exports.OS = OS;

exports.getOS = () => {
  if (/^win/i.test(process.platform)) {
    return OS.WINDOWS;
  } else if (/^darwin/i.test(process.platform)) {
    return OS.MAC;
  } else if (/^linux/i.test(process.platform)) {
    return OS.LINUX;
  } else {
    return OS.OTHER;
  }
};