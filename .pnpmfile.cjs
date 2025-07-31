// .pnpmfile.cjs
function readPackage(pkg) {
  if (pkg.name === "better-sqlite3") {
    pkg.requiresBuild = true;
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
