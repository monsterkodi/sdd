
/*
 0000000  0000000    0000000  
000       000   000  000   000
0000000   000   000  000   000
     000  000   000  000   000
0000000   0000000    0000000
 */

(function() {
  var _, args, colors, data, diff, err, f, fs, i, j, k, l, len, len1, len2, log, noon, out, path, r, ref, ref1, ref2, ref3;

  _ = require('lodash');

  fs = require('fs');

  path = require('path');

  colors = require('colors');

  noon = require('noon');

  diff = require('./diff');

  log = console.log;


  /*
   0000000   00000000    0000000    0000000
  000   000  000   000  000        000     
  000000000  0000000    000  0000  0000000 
  000   000  000   000  000   000       000
  000   000  000   000   0000000   0000000
   */

  args = require('karg')("sdd\n    files       . ? the files to diff                . **\n    a           . ? first file\n    b           . ? second file\n    c           . ? common ancestor file\n    diff        . ? show only conflicting values     . = false\n    same        . ? show only unchanged values       . = false\n    new         . ? show only new values             . = false\n    del         . ? show only deleted values         . = false . - D\n    path        . ? show as list of path value pairs . = false\n    output      . ? the file to write or stdout\n    colors      . ? output with ansi colors          . = true . - C\n    \nversion     " + (require(__dirname + "/../package.json").version));


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

  out = function(s) {
    var error, outfile;
    outfile = args.output;
    if (outfile != null) {
      require('mkpath').sync(path.dirname(outfile));
      try {
        return require('write-file-atomic')(outfile, s, function(err) {
          if (err) {
            log(("can't write " + outfile.bold.yellow).bold.red);
            return log('err', err);
          } else {
            return log(("wrote " + outfile.bold.white).gray);
          }
        });
      } catch (error) {
        err = error;
        log(("can't write " + outfile.bold.yellow).bold.red);
        return log('err', err);
      }
    } else {
      return log(s);
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
    if (args.diff) {
      r = r.diff;
    }
    if (args.del) {
      r = r.del;
    }
    if (args.same) {
      r = r.same;
    }
    ref3 = ['b2a', 'a2b', 'c2a', 'c2b'];
    for (l = 0, len2 = ref3.length; l < len2; l++) {
      k = ref3[l];
      delete r[k];
    }
    out(noon.stringify(r, {
      colors: true
    }));
  } else if ((args.a != null) && (args.b != null)) {
    r = diff.two(data.a, data.b);
    if (args.diff) {
      r = r.diff;
    }
    if (args.del) {
      r = r.del;
    }
    if (args.same) {
      r = r.same;
    }
    out(noon.stringify(r, {
      colors: true
    }));
  }

}).call(this);