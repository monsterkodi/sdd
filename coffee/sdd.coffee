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
    diff        . ? show only conflicting values     . = false
    same        . ? show only unchanged values       . = false
    new         . ? show only new values             . = false
    del         . ? show only deleted values         . = false . - D
    path        . ? show as list of path value pairs . = false
    output      . ? the file to write or stdout
    colors      . ? output with ansi colors          . = true . - C
    
version     #{require("#{__dirname}/../package.json").version}
"""

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

out = (s) ->
    outfile = args.output
    if outfile?
        require('mkpath').sync path.dirname outfile
        try
            require('write-file-atomic') outfile, s, (err) ->
                if err
                    log "can't write #{outfile.bold.yellow}".bold.red
                    log 'err', err
                else
                    log "wrote #{outfile.bold.white}".gray
        catch err
            log "can't write #{outfile.bold.yellow}".bold.red
            log 'err', err
    else
        log s

###
0000000    000  00000000  00000000
000   000  000  000       000     
000   000  000  000000    000000  
000   000  000  000       000     
0000000    000  000       000     
###

# log args
# log data

if args.c? and not args.two
    r = diff.three data.a, data.b, data.c
    r = r.diff if args.diff
    r = r.del  if args.del
    r = r.same if args.same

    for k in ['b2a', 'a2b', 'c2a', 'c2b']
        delete r[k]

    out noon.stringify r, colors: true

else if args.a? and args.b?
    
    r = diff.two data.a, data.b
    r = r.diff if args.diff
    r = r.del  if args.del
    r = r.same if args.same
    
    out noon.stringify r, colors: true
    