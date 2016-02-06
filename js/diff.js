
/*
0000000    000  00000000  00000000
000   000  000  000       000     
000   000  000  000000    000000  
000   000  000  000       000     
0000000    000  000       000
 */

(function() {
  var _, cmppath, collect, diff, get, log, noon, profile, sds, sortpath, toplevel;

  _ = require('lodash');

  noon = require('noon');

  sds = require('sds');

  log = console.log;

  toplevel = sds.toplevel;

  sortpath = sds.sortpath;

  collect = sds.collect;

  cmppath = sds.cmppath;

  get = sds.get;

  profile = require('./profile');

  diff = (function() {
    function diff() {}

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
     *   diff: [ list of [keypath, value_a, value_b] for changed values      ]
     *   same: [ list of [keypath, value]            for unchanged values    ]
     *   new:  [ list of [keypath, value_b]          for new values in b     ]
     *   del:  [ list of [keypath, value_a]          for values deleted in b ]
     *
     * the diff list might contain changes at keypath.length > 1
     */

    diff.two = function(c, a) {
      var dac, dff, nac, pc0, sme, ta, tc, und;
      tc = collect(c);
      ta = collect(a);
      tc = sortpath(tc);
      ta = sortpath(ta);
      pc0 = function(x, y) {
        return x[0][0] === y[0][0];
      };
      nac = this.minus(ta, tc, pc0);
      dac = this.minus(tc, ta, pc0);
      und = this.union(nac, dac);
      sme = this.intersect(tc, ta);
      dff = this.union(tc, ta);
      dff = this.minus(dff, und);
      dff = this.minus(dff, sme);
      dff = this.minus(dff, tc);
      return {
        diff: dff.map(function(t) {
          return [t[0], get(c, t[0]), t[1]];
        }),
        "new": toplevel(nac),
        same: toplevel(sme),
        del: toplevel(dac)
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
     *   diff: [ list of [keypath, value_a, value_b] for conflicting values in a and b                 ]
     *   del:  [ list of [keypath, value_c]          for deleted in (a or b) and unchanged in (b or a) ]
     *   same: [ list of [keypath, value]            for same in a and b or only new in (a or b)       ]
     *
     *   some intermediate results are included:
     * 
     *   c2a:  changes between c and a
     *   c2b:  changes between c and b
     *   a2b:  changes between a and b
     *   b2a:  changes between b and a
     */

    diff.three = function(a, b, c) {
      var ab, ba, ca, cb, cha, chb, del, dff, dla, dlb, keq, sdf, sme, snw, ssm;
      ca = this.two(c, a);
      cb = this.two(c, b);
      ab = this.two(a, b);
      ba = this.two(b, a);
      keq = function(x, y) {
        return x[0][0] === y[0][0];
      };
      ssm = _.intersectionWith(ca.same, cb.same, _.isEqual);
      snw = _.unionWith(ca["new"], cb["new"], _.isEqual);
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
      sdf = _.intersectionWith(ca.diff, cb.diff, _.isEqual);
      cha = _.intersectionWith(cb.same, ca.diff, keq);
      chb = _.intersectionWith(ca.same, cb.diff, keq);
      cha = _.uniqWith(cha.map(function(t) {
        return [t[0], get(a, t[0])];
      }), _.isEqual);
      chb = _.uniqWith(chb.map(function(t) {
        return [t[0], get(b, t[0])];
      }), _.isEqual);
      sdf = sdf.map(function(t) {
        return [t[0], t[2]];
      });
      sme = _.unionWith(ssm, snw, sdf, cha, chb, _.isEqual);
      dff = _.unionWith(ca.diff, cb.diff, ca["new"], cb["new"], _.isEqual);
      dff = _.differenceWith(dff, sme, keq);
      dff = toplevel(dff);
      dff = dff.map(function(t) {
        return [t[0], get(a, t[0]), get(b, t[0])];
      });
      dff = _.uniqWith(dff, _.isEqual);
      dla = _.intersectionWith(ca.del, cb.same, _.isEqual);
      dlb = _.intersectionWith(cb.del, ca.same, _.isEqual);
      del = _.unionWith(dla, dlb, _.isEqual);
      return {
        c2a: ca,
        c2b: cb,
        a2b: ab,
        b2a: ba,
        same: sortpath(sme),
        diff: sortpath(dff),
        del: del
      };
    };

    return diff;

  })();

  module.exports = diff;

}).call(this);
