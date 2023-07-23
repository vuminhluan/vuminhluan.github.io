const translate = (nodes, objLang) => {
    nodes.forEach((node) => {
        const keyI18n = node.getAttribute("data-i18n");
        const translatedText = objLang[keyI18n] ? objLang[keyI18n] : keyI18n;
        node.innerHTML = translatedText;
    })
}

const nodeList = document.querySelectorAll("[data-i18n]");

fetch("../../i18n/"+_LANG+".json")
.then(data => data.json())
.then(dataLang => {
    console.log(dataLang);
    translate(nodeList, dataLang);
}).catch(() => {
    console.log("Could not load " + _LANG + ".json");
});