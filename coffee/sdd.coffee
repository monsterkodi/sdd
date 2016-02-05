###
 0000000  0000000    0000000  
000       000   000  000   000
0000000   000   000  000   000
     000  000   000  000   000
0000000   0000000    0000000  
###

_      = require 'lodash'
fs     = require 'fs'
path   = require 'path'
colors = require 'colors'
noon   = require 'noon'
sds    = require 'sds'
diff   = require './diff'
log    = console.log

###
 0000000   00000000    0000000    0000000
000   000  000   000  000        000     
000000000  0000000    000  0000  0000000 
000   000  000   000  000   000       000
000   000  000   000   0000000   0000000 
###

args = require('karg') """
sdd
    files       . ? the files to diff                . **
    a           . ? first file
    b           . ? second file
    c           . ? common ancestor file
    diff        . ? show conflicting values          . = true
    same        . ? show unchanged values            . = false
    new         . ? show new values                  . = false
    del         . ? show deleted values              . = false . - D
    long        . ? show all values                  . = false
    two         . ? use diff two (c is ignored)      . = false
    pathlist    . ? show as list of path value pairs . = false
    colors      . ? output with ansi colors          . = true . - C
    output      . ? the file to write or stdout
    
version     #{require("#{__dirname}/../package.json").version}
"""

args.diff = args.same = args.new = args.del = true if args.long

###
00000000  00000000   00000000    0000000   00000000 
000       000   000  000   000  000   000  000   000
0000000   0000000    0000000    000   000  0000000  
000       000   000  000   000  000   000  000   000
00000000  000   000  000   000   0000000   000   000
###

err = (msg) ->
    log ("\n"+msg+"\n").red
    process.exit()
    
while args.files? and args.files.length > 0
    f = args.files.shift()
    if not args.a?
        args.a = f 
    else if not args.b?
        args.b = f
    else if not args.c?
        args.c = f

if not args.a? and not args.b?
    err 'no input files provided!'

for f in [args.a, args.b, args.c]
    if f? and not fs.existsSync f
        err "can't find file: #{f.yellow.bold}"

###
0000000     0000000   000000000   0000000 
000   000  000   000     000     000   000
000   000  000000000     000     000000000
000   000  000   000     000     000   000
0000000    000   000     000     000   000
###

data = {}
for k in ['a', 'b', 'c']
    if args[k]?
        data[k] = noon.load args[k] 
        if not data[k].constructor.name in ['Array', 'Object']
            err "no structure in file: #{args[k].yellow.bold}"

###
 0000000   000   000  000000000
000   000  000   000     000   
000   000  000   000     000   
000   000  000   000     000   
 0000000    0000000      000   
###

out = (r) ->

    for k in ['b2a', 'a2b', 'c2a', 'c2b']
        delete r[k] if r?[k]?
    
    omit = _.keys(r).filter (k) -> not args[k]
    f = _.omit r, omit
    
    o = {}
    for cn, cl of f
        if args.pathlist
            o[cn] = {}
            for pv in cl
                o[cn][pv[0].join '.'] = pv.slice 1
        else
            o[cn] = sds.objectify cl
    
    if args.output? and args.output not in noon.extnames
        noon.save args.output, o
    else
        log noon.stringify o, colors: args.colors, ext: args.output

###
0000000    000  00000000  00000000
000   000  000  000       000     
000   000  000  000000    000000  
000   000  000  000       000     
0000000    000  000       000     
###

if args.c? and not args.two
    r = diff.three data.a, data.b, data.c

else if args.a? and args.b?
    
    r = diff.two data.a, data.b
    
out r
    