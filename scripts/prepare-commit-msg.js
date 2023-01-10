const fs = require("fs")
var sgf = require("staged-git-files");
const rootPrefixes = new Set()
const prefixes = new Set()
const editmsg = ".git/COMMIT_EDITMSG"
let msg = fs.readFileSync(editmsg, "utf8")
let args = [];
let prefix = "";

async function abort(err) {
  console.log(err);
  process.exit(1);
}

msg.split(/[\s]+/)
  .slice(1)
  .filter(Boolean)
  .map(arg => { if (arg.startsWith("--")) args.push(arg.replaceAll('--', '')) })

sgf(async function (err, res) {
  if (err) abort(err);
  res.forEach(element => {
    const filePath = element.filename.split('/').slice(1, -1)[0];
    if (filePath) {
      rootPrefixes.add(element.filename.split('/')[0])
      prefixes.add(element.filename.split('/')[1])
    } else {
      rootPrefixes.add("root")
    }
  });

  if (!args.includes('force')) {
    if (prefixes.size > 1 || rootPrefixes.size > 1)
      abort("Only single-project commits allowed");
  } else {
    console.warn("Forcing commit");
  }

  if(args.includes('force'))
    msg = msg.replace('--force', '');

  const rootPrefix = [...rootPrefixes.values()].join(", ")

  if (prefixes.size)
    prefix = ` (${[...prefixes.values()].sort().join(", ")})`;

  fs.writeFileSync(editmsg, `[${rootPrefix}]${prefix} ${msg}`);

});
