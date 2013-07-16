var fs = require('fs');
var async = require('async');
module.exports = function(grunt) {
	var templateThings = function(){
		var ver = process.versions.node.split('.')[1];
		var opt;
		if(ver === '10'){
			opt = {encoding :'utf8'};
		}else{
			opt = 'utf8';
		}
		var done = this.async();
		var which = ['object'];
		var dealwith = function(input,callback){
			var parent = './src/workers/'+input+'.js';
			var child = './src/workers/worker.'+input+'.js';
			var temp = './src/workers/temp.'+input+'.js';
			async.map([parent,child], function(path,cb){
				fs.readFile(path,opt,cb);
			}, function(err, results){
				var parent = results[0];
				var child = results[1];
				var replacedChild = "['"+child.replace(/\$\$(.+?)\$\$/,function(a,b){
					return "',"+b+",'";
				}).replace(/\n/gm,'')+"']";
				var out = parent .replace(/\$\$fObj\$\$/,replacedChild);
				fs.writeFile(temp,out,opt,function(){console.log('done')},callback);
			});
		};
		async.map(which,dealwith,function(err){
			done(true);
		});
	};
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			browser: {
				options:{
					banner:'/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>*/\n/*!(c)2013 Calvin Metcalf @license MIT https://github.com/calvinmetcalf/communist */\n/*!Includes Promiscuous (c)2013 Ruben Verborgh @license MIT https://github.com/RubenVerborgh/promiscuous*/\n/*!Includes Material from setImmediate Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola @license MIT https://github.com/NobleJS/setImmediate */\n',
					mangle: {
						except: ['Communist']
					}
				},
				src: 'dist/<%= pkg.name %>.js',
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		concat: {
		 
			browser: { 
				options: {
					banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>*/\n/*!©2013 Calvin Metcalf @license MIT https://github.com/calvinmetcalf/communist */\n',
					seperator:";\n",
					footer : 'c.version = "<%= pkg.version %>";\n})(this);}'
				},
				files: {'dist/<%= pkg.name %>.js':['src/IE.js','src/setImmediate.js','src/promiscuous.js','src/all.js','src/utils.js','src/single.js','src/general.js','src/workers/multiuse.js','src/fakeWorkers.js','src/temp/object.js','src/queue.js','src/reducer.js','src/mapreduce.incremental.js','src/mapreduce.nonincremental.js','src/wrapup.js']}
			}
		},mocha_phantomjs: {
		all: {
			options: {
				urls: [
						"http://"+process.env.IP+":8080/test/index.html",
					"http://"+process.env.IP+":8080/test/index.min.html"
				]
			}
		}
	},
		connect: {
			server: {
				options: {
					port: 8080,
					base: '.'
				}
			}
		},
	jshint: {
		options:{
			multistr:true,
			expr:true,
			trailing:true,
			eqeqeq:true,
			curly:true
		},
		beforeconcat: ['src/*.js'],
		afterconcat: ['dist/communist.js']
	},
	"saucelabs-mocha":{
		options:{
			username:"calvinmetcalf",
			key: "f288b74b-589a-4fb4-9e65-d8b6ddd09d0e",
			concurrency:3,
			build: process.env.TRAVIS_JOB_ID
		},
		big:{
			options:{
				browsers: [
					{
						browserName: 'firefox',
						platform: 'linux',
						version: '21'
					},{
						browserName: "chrome",
						platform: "OS X 10.8"
					},{
						browserName: "safari",
						platform: "OS X 10.8",
						version:'6'
					},{
						browserName: "safari",
						platform: "OS X 10.6",
						version:'5'
					},{
						browserName: "iphone",
						platform: "OS X 10.8",
						version:'6'
					}, {
						browserName: 'internet explorer',
						platform: 'WIN8',
						version: '10'
					}, {
						browserName: 'opera',
						platform: 'linux',
						version: '12'
					},{
						browserName: 'safari',
						platform: 'win7',
						version: '5'
					},{
						browserName: 'chrome',
						platform: 'XP'
					}
				],
				urls:[
					"http://127.0.0.1:8080/test/index.html",
					"http://127.0.0.1:8080/test/index.min.html"
				]
			}
		},
		shim:{
			options:{
				browsers: [
					{
						browserName: 'internet explorer',
						platform: 'WIN8',
						version: '10'
					},{
						browserName: 'opera',
						platform: 'linux',
						version: '12'
					},{
						browserName: 'opera',
						platform: 'win7',
						version: '12'
					},{
						browserName: 'safari',
						platform: 'win7',
						version: '5'
					}
				],
			urls:[
					"http://127.0.0.1:8080/test/index.shim.html"
				]
			}
		},
		legacy:{
			options:{
				browsers: [
					{
						browserName: 'internet explorer',
						platform: 'WIN7',
						version: '9'
					},{
						browserName: 'chrome',
						platform: 'linux'
					}
				],
			urls:[
					"http://127.0.0.1:8080/test/index.leg.html"
				]
			}
		}
	},
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-mocha-phantomjs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.registerTask('template',templateThings);
	grunt.registerTask('sauce',['connect','saucelabs-mocha:big','saucelabs-mocha:shim','saucelabs-mocha:legacy']);
	grunt.registerTask('server',['connect']);
	grunt.registerTask('browser',['concat:browser','uglify:browser']);
	grunt.registerTask('lint',['jshint:afterconcat']);
	grunt.registerTask('testing', ['connect', 'mocha_phantomjs']);
	grunt.registerTask('test', ['lint','sauce']);
	grunt.registerTask('build', ['template','browser']);
	grunt.registerTask('default', ['build','test']);
	grunt.registerTask('c9', ['build','lint','testing']);

};
