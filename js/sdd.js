
/*
 0000000  0000000    0000000  
000       000   000  000   000
0000000   000   000  000   000
     000  000   000  000   000
0000000   0000000    0000000
 */

(function() {
  var _, args, colors, data, diff, err, f, fs, i, j, k, len, len1, log, noon, out, path, r, ref, ref1, ref2, sds,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('lodash');

  fs = require('fs');

  path = require('path');

  colors = require('colors');

  noon = require('noon');

  sds = require('sds');

  diff = require('./diff');

  log = console.log;


  /*
   0000000   00000000    0000000    0000000
  000   000  000   000  000        000     
  000000000  0000000    000  0000  0000000 
  000   000  000   000  000   000       000
  000   000  000   000   0000000   0000000
   */

  args = require('karg')("sdd\n    files       . ? the files to diff                . **\n    a           . ? first file\n    b           . ? second file\n    c           . ? common ancestor file\n    diff        . ? show conflicting values          . = true\n    same        . ? show unchanged values            . = false\n    new         . ? show new values                  . = false\n    del         . ? show deleted values              . = false . - D\n    long        . ? show all values                  . = false\n    two         . ? use diff two (c is ignored)      . = false\n    pathlist    . ? show as list of path value pairs . = false\n    colors      . ? output with ansi colors          . = true  . - C\n    output      . ? the file to write or stdout\n    \nversion     " + (require(__dirname + "/../package.json").version));

  if (args.long) {
    args.diff = args.same = args["new"] = args.del = true;
  }


  /*
  00000000  00000000   00000000    0000000   00000000 
  000       000   000  000   000  000   000  000   000
  0000000   0000000    0000000    000   000  0000000  
  000       000   000  000   000  000   000  000   000
  00000000  000   000  000   000   0000000   000   000
   */

  err = function(msg) {
    log(("\n" + msg + "\n").red);
    return process.exit();
  };

  while ((args.files != null) && args.files.length > 0) {
    f = args.files.shift();
    if (args.a == null) {
      args.a = f;
    } else if (args.b == null) {
      args.b = f;
    } else if (args.c == null) {
      args.c = f;
    }
  }

  if ((args.a == null) && (args.b == null)) {
    err('no input files provided!');
  }

  ref = [args.a, args.b, args.c];
  for (i = 0, len = ref.length; i < len; i++) {
    f = ref[i];
    if ((f != null) && !fs.existsSync(f)) {
      err("can't find file: " + f.yellow.bold);
    }
  }


  /*
  0000000     0000000   000000000   0000000 
  000   000  000   000     000     000   000
  000   000  000000000     000     000000000
  000   000  000   000     000     000   000
  0000000    000   000     000     000   000
   */

  data = {};

  ref1 = ['a', 'b', 'c'];
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    k = ref1[j];
    if (args[k] != null) {
      data[k] = noon.load(args[k]);
      if ((ref2 = !data[k].constructor.name) === 'Array' || ref2 === 'Object') {
        err("no structure in file: " + args[k].yellow.bold);
      }
    }
  }


  /*
   0000000   000   000  000000000
  000   000  000   000     000   
  000   000  000   000     000   
  000   000  000   000     000   
   0000000    0000000      000
   */

  out = function(r) {
    var cl, cn, l, len2, len3, m, o, omit, pv, ref3, ref4;
    ref3 = ['b2a', 'a2b', 'c2a', 'c2b'];
    for (l = 0, len2 = ref3.length; l < len2; l++) {
      k = ref3[l];
      if ((r != null ? r[k] : void 0) != null) {
        delete r[k];
      }
    }
    omit = _.keys(r).filter(function(k) {
      return !args[k];
    });
    f = _.omit(r, omit);
    o = {};
    for (cn in f) {
      cl = f[cn];
      if (args.pathlist) {
        o[cn] = {};
        for (m = 0, len3 = cl.length; m < len3; m++) {
          pv = cl[m];
          o[cn][pv[0].join('.')] = pv.slice(1);
        }
      } else {
        o[cn] = sds.objectify(cl);
      }
    }
    if ((args.output != null) && (ref4 = args.output, indexOf.call(noon.extnames, ref4) < 0)) {
      return noon.save(args.output, o);
    } else {
      return log(noon.stringify(o, {
        colors: args.colors,
        ext: args.output
      }));
    }
  };


  /*
  0000000    000  00000000  00000000
  000   000  000  000       000     
  000   000  000  000000    000000  
  000   000  000  000       000     
  0000000    000  000       000
   */

  if ((args.c != null) && !args.two) {
    r = diff.three(data.a, data.b, data.c);
  } else if ((args.a != null) && (args.b != null)) {
    r = diff.two(data.a, data.b);
  }

  out(r);

}).call(this);
