var fs = require('fs');
var minifier = require('uglify-js');
var bs = require('browser-sync').create();
var exec = require('child_process').exec;

var moduleName = 'ADM-treeView';
var copyRight = [
    '/*',
    '* Demo: http://amirkabirdataminers.github.io/ADM-treeView',
    '*',
    '* @version 1.0.1',
    '*',
    '* © 2016 Amirkabir Data Miners <info@adm-co.net> - www.adm-co.net',
    '*/',
    '',''
].join('\n');

var startCompassCommands = function() {
    var compass = 'compass watch';
    var directories = ['./src', './demo'];
    
    for (var i=0, j=directories.length; i<j; i++)
        exec(compass, {cwd: directories[i]});
}

var minifyMainScript = function () {
    var code = minifier.minify('./dist/' + moduleName + '.js').code;
    fs.writeFile('./dist/min/' + moduleName + '.min.js', copyRight + code, function(err) {
        if(err)
            return console.log(err);

        console.log('[UJ] ' + moduleName + '.js Minified!');
    }); 
}

var startWatchingMainScript = function() {
    fs.watchFile('./dist/' + moduleName + '.js', function() {
        minifyMainScript();
    });
}

var startBrowserSync = function() {
    bs.init({
        ui: false,
        server: {
            baseDir: ['.', './demo'],
            index: 'index.html'
        },
        files: ['./dist/min/*.*', './src/*.html', './demo/index.html', './demo/js/*.js', './demo/stylesheets/*.css']
    });
}



var initialize = function() {
    
    startBrowserSync();
    minifyMainScript(); // Comment line for view mode. 
    startWatchingMainScript(); // Comment line for view mode. 
    startCompassCommands(); // Comment line for view mode. You need to install Ruby Gem, Compass, SASS before
    
}();
