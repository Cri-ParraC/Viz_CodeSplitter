//=============================================================================
// Viz_CodeSplitter.js [MZ] (v1.0.1)
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [MZ] (v1.0.0)
 * @author Vizcacha
 * @url https://github.com/Cri-ParraC/Viz_CodeSplitter
 * @help Viz_CodeSplitter.js [MZ] (v1.0.0)
 * ----------------------------------------------------------------------------
 *
 */

(() => {
  "use strict";

  console.info("Viz_CodeSplitter.js [MZ] (v1.0.1)");

  globalThis.Imported ??= {};
  globalThis.Imported.Viz_CodeSplitter = 1.0;

  try {
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

    if (rmmzFileNames.length === 0)
      throw new Error('No RMMZ files found to process');

    const scriptsByFileName = {};

    rmmzFileNames.forEach((fileName) => {
      const filePath = path.join(jsPath, fileName);
      const fileData = fs.readFileSync(filePath, 'utf8');
      const fileExtension = path.extname(fileName);
      const fileBaseName = path.basename(fileName, fileExtension);
      const directoryPath = path.join(jsPath, fileBaseName);

      fs.mkdirSync(directoryPath, { recursive: true });

      const headerMatches = fileData.match(new RegExp(`^(${classDivider}\\n.*?\\n${classDivider})`, 'm'));

      if (headerMatches == null)
        throw new Error("Header not found in " + fileName);

      const splitClassesNames = [];

      if (fileName === 'rmmz_core.js') {
        const jsExtensions = fileData.split(sectionDivider)[1].trimEnd() + '\n';
        const content = headerMatches[1] + '\n' + sectionDivider + jsExtensions;
        fs.writeFileSync(path.join(directoryPath, 'JsExtensions' + '.js'), content);
        splitClassesNames.push('JsExtensions');
      }

      const splitSections = fileData.split(sectionDivider).filter((splitClass) => {
        const firstLine = splitClass.trim().split('\n')[0].trim();
        return firstLine.startsWith('// ') || firstLine.startsWith('/**');
      });

      const splitClasses = splitSections.map((splitClass) => sectionDivider + splitClass.trimEnd() + '\n');

      splitClasses.forEach((splitClass) => {
        const constructorMatch = splitClass.match(/function\s+([A-Za-z0-9_]+)\s*\(/);

        if (constructorMatch != null) {
          const content = headerMatches[1] + '\n\n' + splitClass;
          fs.writeFileSync(path.join(directoryPath, constructorMatch[1] + '.js'), content);
          splitClassesNames.push(constructorMatch[1]);
        }
      });

      scriptsByFileName[fileBaseName] = splitClassesNames;
    });

    const mainPath = path.join(jsPath, 'main.js');
    let mainData = fs.readFileSync(mainPath, 'utf8');

    for (const fileName in scriptsByFileName) {
      const scriptUrl = `    "js/${fileName}.js",`;

      if (mainData.includes(scriptUrl)) {
        const scriptUrlsByFileName = scriptsByFileName[fileName].map((className) =>
          `    "js/${fileName}/${className}.js"`);
        mainData = mainData.replace(scriptUrl, scriptUrlsByFileName.join(',\n') + ',\n');
      }
    }
    fs.writeFileSync(mainPath, mainData);
  } catch (error) {
    console.error("An error occurred while splitting the code");
    console.error(error.stack ?? error.message);
  }

})();