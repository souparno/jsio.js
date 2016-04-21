var jsio = (function init(baseLoader) {
  var SLICE = Array.prototype.slice,
    util = {
      isEmpty: function(obj) {
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop))
            return false;
        }
        return true;
      },
      isFunction: function(fn) {
        if (typeof fn == 'function') {
          return true;
        }
        return false;
      },
      removeDots(str) {
        str = str.match(/^\.*(.*?)\.*$/)[1];

        return str;
      },
      bind: function(context, method) {
        var args = SLICE.call(arguments, 2);
        return function() {
          method = (typeof method == 'string' ? context[method] : method);
          return method.apply(context, args.concat(SLICE.call(arguments, 0)));
        };
      }
    },
    commands = [];

  function _require(exportInto, fromDir, request, preprocessors) {
    var item = resolveImportRequest(request),
      moduleDef = loadModule(item.from, fromDir, preprocessors),
      newContext = makeContext(moduleDef),
      module = execModuleDef(newContext, moduleDef),
      path = moduleDef.path;

    if (item.as) {
      var as = util.removeDots(item.as),
        segments = as.split('.'),
        kMax = segments.length - 1,
        c = exportInto;

      // build the object in the context
      for (var k = 0; k < kMax; ++k) {
        var segment = segments[k];
        if (!segment) continue;
        if (!c[segment]) {
          c[segment] = {};
        }
        c = c[segment];
      }
      c[segments[kMax]] = module;
    }
    return module;
  };

  var jsio = util.bind(this, _require, {}, './');
  jsio.__init = init;
  jsio.__require = _require;
  jsio.__srcCache = {};
  jsio.__modules = {};

  jsio.setCache = function(cache) {
    jsio.__srcCache = cache;
  };

  function execModuleDef(context, moduleDef) {
    var code = "(function (_) { with (_) {" + moduleDef.src + "}});",
      fn = eval(code);

    fn(context);
    return context.exports;
  };

  function makeContext(moduleDef) {
    var ctx = {};

    ctx.exports = {};
    ctx.jsio = util.bind(this, _require, ctx, moduleDef.directory);
    ctx.jsio.__jsio = jsio;
    return ctx;
  };

  function loadModule(fromFile, fromDir, preprocessors) {
    if (util.isFunction(baseLoader)) {
      var moduleDef = baseLoader(fromFile, fromDir, preprocessors),
        path = moduleDef.path;

      jsio.__srcCache[fromFile] = moduleDef;
      jsio.__modules[path] = moduleDef;
    }
    return jsio.__srcCache[fromFile];
  };

  function addCmd(fn) {
    commands.push(fn);
  };

  function resolveImportRequest(request) {
    var imports = {};

    for (var index in commands) {
      imports = commands[index](request);
      if (!util.isEmpty(imports)) {
        break;
      }
    }
    return imports;
  };

  // import myPackage
  // OR
  // import myPackage as pack
  addCmd(function(request) {
    var match = request.match(/^\s*import\s+(.*)$/),
      imports = {};

    if (match) {
      match[1].replace(/\s*([\w.\-$]+)(?:\s+as\s+([\w.\-$]+))?,?/g, function(_, from, as) {
        imports = {
          from: from,
          as: as || from
        };
      });
    }
    return imports;
  });

  return jsio;
}());

module.exports = jsio;
