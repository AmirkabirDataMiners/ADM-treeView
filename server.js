var fs = require('fs');
var minifier = require('uglify-js');
var bs = require('browser-sync').create();
var exec = require('child_process').exec;

var moduleName = 'ADM-treeView';
var version = '1.2.0';

var copyRight = 
`/*
* Demo: http://amirkabirdataminers.github.io/ADM-treeView
*
* @version ${version}
*
* © 2017 Amirkabir Data Miners <info@adm-co.net> - www.adm-co.net
*/\n\n`;


var updateInFilesVersion = function() {
    ['./package.json', './bower.json'].map((path) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) throw err;
            data = JSON.parse(data);
            data.version = version;        
            fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
        });
    });

    fs.readFile('./README.md', 'utf8', (err, data) => {
        if (err) throw err;
        data = data.replace(/\/(npm|bower)-v([0-9.]*)-/g, function(match,type,v) {
            return ['/',type,'-v',version,'-'].join('');
        })
        fs.writeFile('./README.md', data, 'utf8');
    });
}

var startCompassCommands = () => {
    var compass = 'compass watch';
    var directories = ['./src', './demo'];

    for (var i=0, j=directories.length; i<j; i++)
        exec(compass, {cwd: directories[i]});
}

var minifyMainScript = () => {
    var code = minifier.minify('./dist/' + moduleName + '.js').code;
    fs.writeFile('./dist/min/' + moduleName + '.min.js', copyRight + code, (err) => {
        if(err)
            return console.log(err);

        console.log('[UJ] ' + moduleName + '.js Minified!');
    }); 
}

var startWatchingMainScript = () => {
    fs.watchFile('./dist/' + moduleName + '.js', () => {
        minifyMainScript();
    });
}

var startBrowserSync = () => {
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
    updateInFilesVersion();
    startBrowserSync();
    minifyMainScript(); // Comment line for view mode. 
    startWatchingMainScript(); // Comment line for view mode. 
    startCompassCommands(); // Comment line for view mode. You need to install Ruby Gem, Compass, SASS before
    //nodemon -e js --ignore dist/
}();
