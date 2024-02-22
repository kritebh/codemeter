const fs = require("fs/promises");
const path = require("path");
const readline = require("readline");
const Table = require("cli-table3");
const { mediaFilesToSkip } = require("../fileMap.js");
let countDetails = {};

async function readFilesRecursive(directoryPath, skipFolder) {
  try {
    const files = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(directoryPath, file.name);

      if (file.isDirectory() && !skipFolder.includes(file.name)) {
        await readFilesRecursive(filePath, skipFolder);
      }

      if (file.isFile()) {
        let noOfLines = await countLines(filePath);
        let ext = filePath.split(".").at(-1);
        if (mediaFilesToSkip.includes(ext)) {
          continue;
        }
        if (countDetails[ext]) {
          countDetails[ext] = {
            fileCount: countDetails[ext].fileCount + 1,
            noOfLines: countDetails[ext].noOfLines + noOfLines,
          };
        } else {
          countDetails[ext] = {
            fileCount: 1,
            noOfLines,
          };
        }
      }
    }
  } catch (err) {
    if (err?.code === "ENOENT") {
      return console.error("The specified directory does not exist:", err);
    }
    console.error("Error during reading directory:", err);
  }
}

async function countLines(filePath) {
  try {
    const file = await fs.open(filePath);
    const fileStream = file.createReadStream();
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineCount = 0;

    for await (const line of rl) {
      lineCount++;
    }
    return lineCount;
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

async function calculate(directoryPath, skipFolder) {
  await readFilesRecursive(directoryPath, skipFolder);
  return countDetails;
}

async function print(directoryPath, skipFolder) {
  let countDetails = await calculate(directoryPath, skipFolder);

  if (Object.keys(countDetails).length > 0) {
    const table = new Table({
      head: ["Languages", "Files", "Code"],
      style: {
        head: ["green"],
      },
    });

    let totalFiles = 0;
    let totalCode = 0;

    Object.entries(countDetails).forEach(([fileType, data]) => {
      table.push([fileType, data.fileCount, data.noOfLines]);
      totalFiles += data.fileCount;
      totalCode += data.noOfLines;
    });

    table.push(["Total", totalFiles, totalCode]);

    console.log(table.toString());
  } else {
    console.log("No files found in the specified directory.");
  }
}

module.exports = {
  print,
};
