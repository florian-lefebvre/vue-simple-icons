const path = require("path");
const simpleIcons = require("simple-icons");
const pascalCase = require("pascal-case");
const fs = require("fs-extra");
const writtenNumber = require("written-number");

const componentTemplate = (name, title, path, color) =>
  `
  <template>
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="text-color: #${color}">
    <title>${title}</title>
    <path d="${path}"/>
  </svg>
</template>

<script>
export default {
  name: "${name}"
};
</script>
`.trim();

const handleNumbers = (title) => {
  const beginningNumbers = title.replace(/[^\d].*/, "");
  if (beginningNumbers.length) {
    const numberInEnglish = writtenNumber(beginningNumbers, { noAnd: true });
    const numberSlug =
      numberInEnglish
        .toString()
        .split(" ")
        .join("-") + "-";
    title = title.replace(beginningNumbers, numberSlug);
  }
  title = title.split("+").join("Plus");
  title = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return title;
};

const icons = Object.keys(simpleIcons).map((title) => ({
  icon: simpleIcons.get(title),
  pascalCasedComponentName: pascalCase.pascalCase(`${handleNumbers(title)}-icon`),
}));

Promise.all(
  icons.map((e) => {
    const component = componentTemplate(
      e.pascalCasedComponentName,
      e.icon.title,
      e.icon.path,
      e.icon.hex
    );
    const filepath = `./src/lib-components/${e.pascalCasedComponentName}.vue`;
    return fs
      .ensureDir(path.dirname(filepath))
      .then(() => fs.writeFile(filepath, component, "utf8"));
  })
).then(() => {
  const main =
    "/* eslint-disable import/prefer-default-export */ \n" +
    icons
      .map(
        (icon) =>
          `export { default as ${icon.pascalCasedComponentName} } from './${icon.pascalCasedComponentName}.vue'`
      )
      .join("\n\n");
  return fs.outputFile("./src/lib-components/index.js", main, "utf8");
});
