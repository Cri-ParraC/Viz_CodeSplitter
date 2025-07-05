// Usando Node 14

const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', '..');
const jsPathFileNames = fs.readdirSync(jsPath);

if (jsPathFileNames.length === 0)
  throw new Error('No files found in jsPath');

const classDivider = "//" + '='.repeat(77);
const sectionDivider = "//" + '-'.repeat(77);

const rmmzFileNames = jsPathFileNames.filter((fileName) => {
  return fileName.startsWith('rmmz_') && fileName.endsWith('.js');
});

const scriptsByFileName = {};

rmmzFileNames.forEach((fileName) => {
  const filePath = path.join(jsPath, fileName);
  const fileData = fs.readFileSync(filePath, 'utf8');
  const fileExtension = path.extname(fileName);
  const fileBaseName = path.basename(fileName, fileExtension);
  const directoryPath = path.join(jsPath, fileBaseName);

  fs.mkdirSync(directoryPath, { recursive: true });

  const headerMatches = fileData.match(new RegExp(`^(${classDivider}\\n.*?\\n${classDivider})`, 'm'));

  if (headerMatches != null && headerMatches[1].includes(fileName)) {
    fs.writeFileSync(path.join(jsPath, "_" + fileName), headerMatches[1]);
  }

  if (fileName === 'rmmz_core.js') {
    return; // tiene una estructura diferente, se omite por el momento
  }

  const splitSections = fileData.split(sectionDivider).filter((splitClass) => {
    const lines = splitClass.trim().split('\n');
    return lines.length > 0 && lines[0].trim().startsWith('// ');
  });

  const splitClasses = splitSections.map((splitClass) => sectionDivider + splitClass.trimEnd() + "\n");

  const splitClassesNames = [];

  splitClasses.forEach((splitClass) => {
    const constructorMatch = splitClass.match(/function\s+([A-Za-z0-9_]+)\s*\(/);

    if (constructorMatch != null) {
      console.log(constructorMatch[1]);
      fs.writeFileSync(path.join(directoryPath, constructorMatch[1] + '.js'), splitClass);
      splitClassesNames.push(constructorMatch[1]);
    }
  });

  scriptsByFileName[fileBaseName] = splitClassesNames;

});

const mainPath = path.join(jsPath, 'main.js');
let mainData = fs.readFileSync(mainPath, 'utf8');

for (const fileName in scriptsByFileName) {
  const scriptUrl = `    "js/${fileName}.js",`;
  console.log('scriptUrl:', scriptUrl);
  if (mainData.includes(scriptUrl)) {
    const scriptUrlsByFileName = scriptsByFileName[fileName].map((className) => `    "js/${fileName}/${className}.js"`);
    mainData = mainData.replace(scriptUrl, scriptUrlsByFileName.join(',\n'));
  }
}
console.log('mainData:', mainData);