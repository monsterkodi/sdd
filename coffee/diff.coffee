###
0000000    000  00000000  00000000
000   000  000  000       000     
000   000  000  000000    000000  
000   000  000  000       000     
0000000    000  000       000
###

_       = require 'lodash'
noon    = require 'noon'
sds     = require 'sds'

log      = console.log
toplevel = sds.toplevel
sortpath = sds.sortpath
collect  = sds.collect
cmppath  = sds.cmppath
get      = sds.get

class diff
    
    ###
    00     00  000  000   000  000   000   0000000
    000   000  000  0000  000  000   000  000     
    000000000  000  000 0 000  000   000  0000000 
    000 0 000  000  000  0000  000   000       000
    000   000  000  000   000   0000000   0000000 
    ###
    
    @minus: (a, b, eql=_.isEqual) ->

        ai = 0
        bi = 0
        r  = []
        while ai < a.length
            while bi < b.length and cmppath(a[ai][0], b[bi][0]) > 0
                bi += 1
            if  bi >= b.length
                break
            if not eql a[ai], b[bi]
                r.push a[ai]
            ai += 1
            
        while ai < a.length
            r.push a[ai]
            ai += 1
        r
        
    ###
    000   000  000   000  000   0000000   000   000
    000   000  0000  000  000  000   000  0000  000
    000   000  000 0 000  000  000   000  000 0 000
    000   000  000  0000  000  000   000  000  0000
     0000000   000   000  000   0000000   000   000
    ###
        
    @union: (a, b) ->
        
        ai = 0
        bi = 0
        r  = []
        while ai < a.length
            
            while bi < b.length and cmppath(a[ai][0], b[bi][0]) > 0
                r.push b[bi]
                bi += 1
                
            if bi >= b.length 
                break
                
            if _.isEqual a[ai], b[bi]
                r.push a[ai]
                bi += 1
            else
                r.push a[ai]

            ai += 1
        
        while ai < a.length
            r.push a[ai]
            ai += 1

        while bi < b.length
            r.push b[bi]
            bi += 1        
        r 
        
    ###
    000  000   000  000000000  00000000  00000000    0000000  00000000   0000000  000000000
    000  0000  000     000     000       000   000  000       000       000          000   
    000  000 0 000     000     0000000   0000000    0000000   0000000   000          000   
    000  000  0000     000     000       000   000       000  000       000          000   
    000  000   000     000     00000000  000   000  0000000   00000000   0000000     000   
    ###
    
    @intersect: (a, b, eql=_.isEqual) ->

        ai = 0
        bi = 0
        r  = []
        while ai < a.length
            while bi < b.length and cmppath(a[ai][0], b[bi][0]) > 0
                bi += 1
            if bi >= b.length
                break
            if eql a[ai], b[bi]
                r.push a[ai]
            ai += 1
        r
        
    ###
    000000000  000   000   0000000 
       000     000 0 000  000   000
       000     000000000  000   000
       000     000   000  000   000
       000     00     00   0000000 
    ###
    ###
    # accepts two objects a and b
    # returns an object
    #
    #   diff: [ array of [keypath, value_a, value_b] for changed values      ]
    #   same: [ array of [keypath, value]            for unchanged values    ]
    #   new:  [ array of [keypath, value_b]          for new values in b     ]
    #   del:  [ array of [keypath, value_a]          for values deleted in b ]
    #
    # the diff array might contain changes at keypath.length > 1
    ###
    
    @two: (a, b) -> 
        ca = collect a
        cb = collect b
        sortpath ca
        sortpath cb
        pc0 = (x,y) -> x[0][0] == y[0][0]
        nwb = @minus cb, ca, pc0             # new in b
        del = @minus ca, cb, pc0             # deleted in b
        sme = @intersect ca, cb              # unchanged
        dff = @minus cb,  sme                # diff = b - same - new - del
        dff = @minus dff, nwb
        dff = @minus dff, del

        diff: dff.map (t) -> [t[0], get(a, t[0]), t[1]]
        new:  toplevel nwb
        same: toplevel sme
        del:  toplevel del
    
    ###
    000000000  000   000  00000000   00000000  00000000
       000     000   000  000   000  000       000     
       000     000000000  0000000    0000000   0000000 
       000     000   000  000   000  000       000     
       000     000   000  000   000  00000000  00000000
    ###
    ###
    # accepts three objects a, b and common ancestor c
    # returns an object
    #
    #   diff: [ array of [keypath, value_a, value_b] for conflicting values in a and b                 ]
    #   del:  [ array of [keypath, value_c]          for deleted in (a or b) and unchanged in (b or a) ]
    #   same: [ array of [keypath, value]            for same in a and b or only new in (a or b)       ]
    #
    #   some intermediate results are included:
    # 
    #   c2a:  changes between c and a
    #   c2b:  changes between c and b
    ###
                
    @three: (a, b, c) -> 
        ca = @two c, a
        cb = @two c, b
        
        keq = (x,y) -> x[0][0] == y[0][0]
        ssm = @intersect ca.same, cb.same          # same in same
        snw = @union ca.new, cb.new                # new ...
        snw = snw.filter (t) ->                    #     and
            f = 0                                  #     ...
            for t2 in snw                          #     not
                f += 1 if t2[0][0] == t[0][0]      #     ...
            f == 1                                 #     different
        sdf = @intersect ca.diff, cb.diff          # same in diff
        cha = @intersect cb.same, ca.diff, keq     # changed in a
        chb = @intersect ca.same, cb.diff, keq     # changed in b
        cha = _.uniqWith (cha.map (t) -> [t[0], get(a, t[0])]), _.isEqual
        chb = _.uniqWith (chb.map (t) -> [t[0], get(b, t[0])]), _.isEqual
        sdf = sdf.map (t) -> [t[0], t[2]]
        sme = @union @union(ssm, snw), @union(sdf, @union(cha, chb))  # union of sames or changed on one side only
        dff = @union @union(ca.diff, cb.diff), @union(ca.new, cb.new) # diff = union of diff and new
        dff = @minus dff, sme, keq                                    # minus union of sames
        dff = toplevel dff
        dff = dff.map (t) -> [t[0], get(a, t[0]), get(b, t[0])]
        dff = _.uniqWith dff, _.isEqual

        dla = @intersect ca.del, cb.same           # deleted in a and unchanged in b
        dlb = @intersect cb.del, ca.same           # deleted in b and unchanged in a
        del = @union     dla,    dlb               # deleted in b and unchanged in a
                
        c2a:  ca
        c2b:  cb
        same: sme
        diff: dff
        del:  del
                
module.exports = diff
