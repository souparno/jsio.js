import packages.util.underscore as _;  

var filename = this.filename.split('.')[0];
var srcTable = {};

function testComment(match) {
    return /\/\//.test(match[1]);
}

function getJsioSrc() {
    var src = jsio.__init.toString(-1);

    if (src.substring(0, 8) == 'function') {
        src = 'var jsio=(' + src + '());';
    }

    return src;
}

function getSrcCache() {
    var str = "{";

    for (var prop in srcTable) {
        str = str + JSON.stringify(prop) + ":" + srcTable[prop] + ",";
    }

    return str.substring(0, str.length - 1) + "}";
}

function updatePreprocessors(preprocessors) {
    if (!_.contains(preprocessors, filename)) {
        preprocessors.push(filename);
    }

    return preprocessors;
}

function replace(raw, p1, p2, p3, p4) {
    return p1 + '' + p4;
}

exports = function (moduleDef, preprocessors, ctx) {
    var regexFuncBody = /^(\(\s*function\s*\([_]+\)\s*\{\s*with\s*\([_]+\)\s*\{)((\s*.*)*)(\s*\}\s*\}\s*\))/gm;
    var regex = /^(.*)jsio\s*\(\s*['"](.+?)['"]\s*(,\s*\{[^}]+\})?\)/gm;
    var match = regex.exec(moduleDef.src);

    if (match && !testComment(match)) {
        exports.run(ctx.jsio, match[2], preprocessors);
    }

    srcTable[moduleDef.modulePath] = moduleDef.src;
    // replaces the function body with ''
    moduleDef.src = moduleDef.src.replace(regexFuncBody, replace);
};

exports.run = function (jsio, request, preprocessors) {
    jsio(request, updatePreprocessors(preprocessors));
};

exports.generateSrc = function (callback) {
    var str = getJsioSrc() + "jsio.setCache(" + getSrcCache() + ");";

    callback(str);
};
