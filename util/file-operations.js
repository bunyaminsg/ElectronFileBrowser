const trash = require('trash');

exports.removeFile = function(pathToRemove) {
  trash([pathToRemove]).then((trashPath) => {
    // trashPath => [{ "path": <path_to_file_in_trash>, "info": <path_to_info_of_file_in_trash> }
    // console.log(trashPath);
    favourites.forEach((fav, i, arr) => {
      if (fav.path === pathToRemove) {
        arr.splice(i, 1);
      }
    });
    $(`*[path=${pathToRemove}]`).remove();
  }, (err) => {
    showError(err);
  });
}

exports.getDrives = async function() {
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
