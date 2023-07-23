const getLang = () => {
    let lang = window.localStorage.getItem("lang");
    if (lang === null || !_SUPPORT_LANGUAGES.includes(lang)) {
        lang = _DEFAULT_LANGUAGE;
        window.localStorage.setItem("lang", lang);
    }

    return lang;
}

const _DEFAULT_LANGUAGE = "vi";
const _SUPPORT_LANGUAGES = ["vi", "en"];
const _LANG = getLang();