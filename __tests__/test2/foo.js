import .foo as foo;

exports.hello = function () {
  console.log("hello from foo");
};

foo.hello();

