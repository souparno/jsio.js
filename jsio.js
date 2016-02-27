var jsio = (function clone() {
  var util = {
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
    }
  };

  function jsio(req, exportInto, fromDir, baseLoader) {
    var item = resolveImportRequest(req),
      moduleDef = loadModule(item.from, fromDir, baseLoader),
      newContext = makeContext(moduleDef.directory, baseLoader),
      module = execModuleDef(newContext, moduleDef);

    // add the module to the current context
    if (item.as) {
      // remove trailing/leading dots
      var as = item.as.match(/^\.*(.*?)\.*$/)[1],
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
  };

  jsio.__clone = clone;
  jsio.__cmds = [];
  jsio.__modules = {};

  function execModuleDef(context, moduleDef) {
    var code = "(function (_) { with (_) {" + moduleDef.src + "}});",
      fn = eval(code);

    fn = fn(context);
    return context.exports;

  }

  function makeContext(fromDir, baseLoader) {
    var ctx = {
      exports: {},
      jsio: function(req) {
        jsio(req, ctx, fromDir, baseLoader);
      }
    };

    return ctx;
  }

  jsio.setModules = function(modules) {
    jsio.__modules = modules;
  };

  function loadModule(fromFile, fromDir, baseLoader) {
    if (util.isFunction(baseLoader)) {
      jsio.__modules[fromFile] = baseLoader(fromFile, fromDir);
    }
    return jsio.__modules[fromFile];
  };

  jsio.addCmd = function(fn) {
    jsio.__cmds.push(fn);
  };

  function resolveImportRequest(request) {
    var cmds = jsio.__cmds,
      imports = {};

    for (var index in cmds) {
      imports = cmds[index](request);
      if (!util.isEmpty(imports)) {
        break;
      }
    }
    return imports;
  };

  // import myPackage
  // OR
  // import myPackage as pack
  jsio.addCmd(function(request) {
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
