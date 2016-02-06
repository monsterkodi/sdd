_      = require 'lodash'
assert = require 'assert'
chai   = require 'chai'
sds    = require 'sds'
sdd    = require '../'

expect = chai.expect
chai.should()

describe 'module interface', ->
    
    it 'should implement diff',       -> _.isFunction(sdd.diff        ).should.be.true

###
0000000    000  00000000  00000000
000   000  000  000       000     
000   000  000  000000    000000  
000   000  000  000       000     
0000000    000  000       000     
###

describe 'diff', ->
    
    it 'should minus', -> 
        
        expect sdd.diff.minus [[['a'], 1], [['b'], 2], [['d'], 3]], [[['b'], 2]], (x,y) -> x[0][0] == y[0][0]
        .to.eql [ [ [ 'a' ], 1 ], [ [ 'd' ], 3 ] ]

        expect sdd.diff.minus [[['m'], 1], [['o'], 2], [['p'], 3]], [[['m'], 2], [['p'], 2], [['q'], 2]], (x,y) -> x[0][0] == y[0][0]
        .to.eql [ [ [ 'o' ], 2 ] ]

        expect sdd.diff.minus [
            [['m'], 2]
            [['o'], 2]
            [['p'], 2]
        ],[
            [['m'], 2] 
            [['p'], 2] 
            [['q'], 2]
        ], (x,y) -> x[0][0] == y[0][0]
        .to.eql [ [ [ 'o' ], 2 ] ]

    it 'should implement diff.two'  , -> _.isFunction(sdd.diff.two  ).should.be.true
    it 'should implement diff.three', -> _.isFunction(sdd.diff.three).should.be.true

    c = 
        p:  [1,3]
        q:  
            x: 1
            y: 2
        r:  1
        s:  'sss'
        v:  0
        x:  8
        z:  7
        m: -5
        
    a =
        m:  5
        o:  1
        p:  [1,2,3]
        q:  
            x: 1
            y: 2
        r:  null
        s:  "s!s"
        t:  
            x: 1
            z: 3
        u:  
            x: 4
        x:  8
        y:  9
        z:  7
    
    b =
        p:  [1,3,2]
        q:  
            y: 2
            x: 1
        s:  "sss"
        t: 
            x: 'a'
            y: 2
        u:  
            x: 1
        y:  9
        x:  8
        m:  5

    dtra = [
        [['m'], 5               ]
        [['o'], 1               ]
        [['p'],     [1, 2, 3]   ]
        [['p' , 0] , 1          ]
        [['p' , 1] , 2          ]
        [['p' , 2] , 3          ]
        [['q'], {x: 1, y: 2}    ]
        [['q' , 'x'] , 1        ]
        [['q' , 'y'] , 2        ]
        [['r'], null            ]
        [['s'], "s!s"           ]
        [['t'], {x: 1, z: 3}    ]
        [['t' , 'x'] , 1        ]
        [['t' , 'z'] , 3        ]
        [['u'], x: 4            ]
        [['u' , 'x'] , 4        ]
        [['x'], 8               ]
        [['y'], 9               ]
        [['z'], 7               ]
        ]    
                    
    c2a =
        diff:   [   [ [ 'm' ],     -5, 5              ]
                    [ [ 'p' ], [1, 3], [ 1, 2, 3 ]    ]
                    [ [ 'p'  , 1 ]  ,         3, 2    ] 
                    [ [ 'r' ],     1, null            ]
                    [ [ 's' ], 'sss', 's!s'           ] ]
        same:   [   [ [ 'q' ], { x: 1, y: 2 }         ]
                    [ [ 'x' ], 8                      ]
                    [ [ 'z' ], 7                      ] ]
        new:    [   [ [ 'o' ], 1                      ]
                    [ [ 't' ], { x: 1    , z: 3 }     ]
                    [ [ 'u' ], { x: 4 }               ]
                    [ [ 'y' ], 9                      ] ]
        del:    [   [ [ 'v' ], 0                      ] ]

    c2b = 
        diff:   [   [ [ 'm' ],     -5, 5            ]
                    [ [ 'p' ], [ 1, 3 ], [ 1, 3, 2 ] ] ]
        same:   [   [ [ 'q' ], { x: 1, y: 2 }       ]
                    [ [ 's' ], 'sss'                ]
                    [ [ 'x' ], 8                    ] ]
        new:    [   [ [ 't' ], { x: 'a', y: 2 }     ]
                    [ [ 'u' ], { x: 1 }             ]
                    [ [ 'y' ], 9                    ] ]
        del:    [   [ [ 'r' ], 1                    ]
                    [ [ 'v' ], 0                    ]
                    [ [ 'z' ], 7                    ] ]
    
    a2b = sdd.diff.two a, b
                
    it 'should diff two', -> 
        
        expect sdd.diff.two c, a
        .to.eql c2a
    
        expect sdd.diff.two c, b
        .to.eql c2b
    
        expect sdd.diff.two a, a
        .to.eql 
            same: dtra.filter (t) -> t[0].length == 1
            diff: []
            new:  []
            del:  []
            
    it 'should diff three', -> 
    
        expect sdd.diff.three a, b, c
        .to.eql 
            c2a:    c2a
            c2b:    c2b
            diff: [ [ [ 'p' ], [ 1, 2, 3 ], [ 1, 3, 2 ]         ]
                    [ [ 'r' ], null, undefined                  ]
                    [ [ 't' ], { x: 1, z: 3 }, { x: 'a', y: 2 } ]
                    [ [ 'u' ], { x: 4 }, { x: 1 }               ] ]
            same: [ [ [ 'm' ], 5                                ]
                    [ [ 'o' ], 1                                ]
                    [ [ 'q' ], { x: 1, y: 2 }                   ]
                    [ [ 's' ], 's!s'                            ]
                    [ [ 'x' ], 8                                ] 
                    [ [ 'y' ], 9                                ] ]
            del:  [ [ [ 'z' ], 7                                ] ]
            
    
    it 'should diff three a a a', -> 
    
        expect sdd.diff.three a, a, a
        .to.eql 
            c2a:  sdd.diff.two a, a
            c2b:  sdd.diff.two a, a
            diff: []
            del:  []
            same: sds.sortpath sds.toplevel sds.collect a
    
    it 'should diff three a a b', -> 
    
        expect sdd.diff.three a, b, a
        .to.eql 
            c2a:  sdd.diff.two a, a
            c2b:  sdd.diff.two a, b
            diff: []
            del:  a2b.del
            same: sds.sortpath sds.toplevel sds.collect(b)
    

