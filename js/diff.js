
/*
0000000    000  00000000  00000000
000   000  000  000       000     
000   000  000  000000    000000  
000   000  000  000       000     
0000000    000  000       000
 */

(function() {
  var _, cmppath, collect, diff, get, log, noon, sds, sortpath, toplevel;

  _ = require('lodash');

  noon = require('noon');

  sds = require('sds');

  log = console.log;

  toplevel = sds.toplevel;

  sortpath = sds.sortpath;

  collect = sds.collect;

  cmppath = sds.cmppath;

  get = sds.get;

  diff = (function() {
    function diff() {}


    /*
    00     00  000  000   000  000   000   0000000
    000   000  000  0000  000  000   000  000     
    000000000  000  000 0 000  000   000  0000000 
    000 0 000  000  000  0000  000   000       000
    000   000  000  000   000   0000000   0000000
     */

    diff.minus = function(a, b, eql) {
      var ai, bi, r;
      if (eql == null) {
        eql = _.isEqual;
      }
      ai = 0;
      bi = 0;
      r = [];
      while (ai < a.length) {
        while (bi < b.length && cmppath(a[ai][0], b[bi][0]) > 0) {
          bi += 1;
        }
        if (bi >= b.length) {
          break;
        }
        if (!eql(a[ai], b[bi])) {
          r.push(a[ai]);
        }
        ai += 1;
      }
      while (ai < a.length) {
        r.push(a[ai]);
        ai += 1;
      }
      return r;
    };


    /*
    000   000  000   000  000   0000000   000   000
    000   000  0000  000  000  000   000  0000  000
    000   000  000 0 000  000  000   000  000 0 000
    000   000  000  0000  000  000   000  000  0000
     0000000   000   000  000   0000000   000   000
     */

    diff.union = function(a, b) {
      var ai, bi, r;
      ai = 0;
      bi = 0;
      r = [];
      while (ai < a.length) {
        while (bi < b.length && cmppath(a[ai][0], b[bi][0]) > 0) {
          r.push(b[bi]);
          bi += 1;
        }
        if (bi >= b.length) {
          break;
        }
        if (_.isEqual(a[ai], b[bi])) {
          r.push(a[ai]);
          bi += 1;
        } else {
          r.push(a[ai]);
        }
        ai += 1;
      }
      while (ai < a.length) {
        r.push(a[ai]);
        ai += 1;
      }
      while (bi < b.length) {
        r.push(b[bi]);
        bi += 1;
      }
      return r;
    };


    /*
    000  000   000  000000000  00000000  00000000    0000000  00000000   0000000  000000000
    000  0000  000     000     000       000   000  000       000       000          000   
    000  000 0 000     000     0000000   0000000    0000000   0000000   000          000   
    000  000  0000     000     000       000   000       000  000       000          000   
    000  000   000     000     00000000  000   000  0000000   00000000   0000000     000
     */

    diff.intersect = function(a, b, eql) {
      var ai, bi, r;
      if (eql == null) {
        eql = _.isEqual;
      }
      ai = 0;
      bi = 0;
      r = [];
      while (ai < a.length) {
        while (bi < b.length && cmppath(a[ai][0], b[bi][0]) > 0) {
          bi += 1;
        }
        if (bi >= b.length) {
          break;
        }
        if (eql(a[ai], b[bi])) {
          r.push(a[ai]);
        }
        ai += 1;
      }
      return r;
    };


    /*
    000000000  000   000   0000000 
       000     000 0 000  000   000
       000     000000000  000   000
       000     000   000  000   000
       000     00     00   0000000
     */


    /*
     * accepts two objects a and b
     * returns an object
     *
     *   diff: [ array of [keypath, value_a, value_b] for changed values      ]
     *   same: [ array of [keypath, value]            for unchanged values    ]
     *   new:  [ array of [keypath, value_b]          for new values in b     ]
     *   del:  [ array of [keypath, value_a]          for values deleted in b ]
     *
     * the diff array might contain changes at keypath.length > 1
     */

    diff.two = function(a, b) {
      var ca, cb, del, dff, nwb, pc0, sme;
      ca = collect(a);
      cb = collect(b);
      sortpath(ca);
      sortpath(cb);
      pc0 = function(x, y) {
        return x[0][0] === y[0][0];
      };
      nwb = this.minus(cb, ca, pc0);
      del = this.minus(ca, cb, pc0);
      sme = this.intersect(ca, cb);
      dff = this.minus(cb, sme);
      dff = this.minus(dff, nwb);
      dff = this.minus(dff, del);
      return {
        diff: dff.map(function(t) {
          return [t[0], get(a, t[0]), t[1]];
        }),
        "new": toplevel(nwb),
        same: toplevel(sme),
        del: toplevel(del)
      };
    };


    /*
    000000000  000   000  00000000   00000000  00000000
       000     000   000  000   000  000       000     
       000     000000000  0000000    0000000   0000000 
       000     000   000  000   000  000       000     
       000     000   000  000   000  00000000  00000000
     */


    /*
     * accepts three objects a, b and common ancestor c
     * returns an object
     *
     *   diff: [ array of [keypath, value_a, value_b] for conflicting values in a and b                 ]
     *   del:  [ array of [keypath, value_c]          for deleted in (a or b) and unchanged in (b or a) ]
     *   same: [ array of [keypath, value]            for same in a and b or only new in (a or b)       ]
     *
     *   some intermediate results are included:
     * 
     *   c2a:  changes between c and a
     *   c2b:  changes between c and b
     */

    diff.three = function(a, b, c) {
      var ca, cb, cha, chb, del, dff, dla, dlb, keq, sdf, sme, snw, ssm;
      ca = this.two(c, a);
      cb = this.two(c, b);
      keq = function(x, y) {
        return x[0][0] === y[0][0];
      };
      ssm = this.intersect(ca.same, cb.same);
      snw = this.union(ca["new"], cb["new"]);
      snw = snw.filter(function(t) {
        var f, i, len, t2;
        f = 0;
        for (i = 0, len = snw.length; i < len; i++) {
          t2 = snw[i];
          if (t2[0][0] === t[0][0]) {
            f += 1;
          }
        }
        return f === 1;
      });
      sdf = this.intersect(ca.diff, cb.diff);
      cha = this.intersect(cb.same, ca.diff, keq);
      chb = this.intersect(ca.same, cb.diff, keq);
      cha = _.uniqWith(cha.map(function(t) {
        return [t[0], get(a, t[0])];
      }), _.isEqual);
      chb = _.uniqWith(chb.map(function(t) {
        return [t[0], get(b, t[0])];
      }), _.isEqual);
      sdf = sdf.map(function(t) {
        return [t[0], t[2]];
      });
      sme = this.union(this.union(ssm, snw), this.union(sdf, this.union(cha, chb)));
      dff = this.union(this.union(ca.diff, cb.diff), this.union(ca["new"], cb["new"]));
      dff = this.minus(dff, sme, keq);
      dff = toplevel(dff);
      dff = dff.map(function(t) {
        return [t[0], get(a, t[0]), get(b, t[0])];
      });
      dff = _.uniqWith(dff, _.isEqual);
      dla = this.intersect(ca.del, cb.same);
      dlb = this.intersect(cb.del, ca.same);
      del = this.union(dla, dlb);
      return {
        c2a: ca,
        c2b: cb,
        same: sme,
        diff: dff,
        del: del
      };
    };

    return diff;

  })();

  module.exports = diff;

}).call(this);
