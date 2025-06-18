/* jshint node: true, browser: false, es3: false */

'use strict';
const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function( grunt ) {
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    require('load-grunt-tasks')(grunt);
	// First register the "default" task, so it can be analyzed by other tasks.
	// grunt.registerTask( 'default', [ 'jshint:git', 'jscs:git' ] );

	// Files that will be ignored by the "jscs" and "jshint" tasks.


	// Basic configuration which will be overloaded by the tasks.
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
        config: {
            folder: 'editorDist',
            distFolder: 'dev/builder/release/ckeditor',
            ip: 'http://127.0.0.1',
            port: 8080,
            livereload: 35741,
            // 版本号
            version:(new Date()).getTime()
  
          },
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        connect: {
            server: {
                options: {
                    // 经过测试 connect插件会依照base的定义顺序检索文件
                    // 这意味着如果存在相同文件，定义在前面的会优先返回
                    base: ['.'],
                    port: '8080',
                    open: '<%= config.ip+ ":" +config.port %>/hmEditor/demo/index.html',
                    hostname: '*',
                    livereload: '<%= config.livereload%>',
                    middleware: function(connect, options, middlewares) {
                        // inject a custom middleware into the array of default middlewares 
                        middlewares.unshift(function(req, res, next) {
                        // if (req.url !== '/hello/world') return next();
                        // res.end('Hello, world from port #' + options.port + '!');
                            if(/^\/emr-print\//.test(req.url)){
                                createProxyMiddleware({ target: 'http://172.16.8.21:9091/', changeOrigin: true })(req, res, next);
                            }else if(/^\/songshan\//.test(req.url)){
                                console.log(req.url);
                                createProxyMiddleware({ target: 'http://127.0.0.1:3048/', changeOrigin: true ,
                                pathRewrite: {
                                    '^/songshan': '', // remove base path
                                } 
                                })(req, res, next);
                            }else{
                                return next();
                            }
                        });
                      return middlewares;
                    }
                }
            }
        },
        copy: {
            baseInfo: {
                expand: true,
                flatten: true,
                src: ['<%= config.folder %>/js/base.min.js'],
                dest: '<%= config.folder %>/',
                filter: 'isFile'
            },
            editorDist: {
                expand: true,
                cwd: '<%= config.folder %>',
                src: '**/*',
                dest: '<%= config.distFolder+"/"+config.folder %>',
            },
            demo: {
                expand: true,
                cwd: 'hmEditor/demo',
                src: '**/*',
                dest: '<%= config.distFolder+"/"+config.folder %>/demo',
            },
        },
        concat: {
            options: {
                stripBanners: true,
                banner: '<%= banner %>'
            },
            js: {
                src: ['<%= config.folder %>/js/*.js'],
                dest: '<%= config.folder %>/all.min.js'
            },
            css: {
                src: ['<%= config.folder %>/css/*.css'],
                dest: '<%= config.folder %>/all.min.css'
            },
        },
        uglify: {
            options: {
                ie8: true,
                mangle: true,//{ except: ['jQuery', 'Backbone', '_', 'Cdss'] }
                banner: '<%= banner %>'
            },
            mtilTask: {
                files: [{
                    '<%= config.distFolder %>/index.js': ['index.js']
                }, {
                    expand: true,
                    cwd: 'src',
                    src: '**/*.js',
                    dest: '<%= config.distFolder %>/src'
                }, {
                    expand: true,
                    cwd: 'hmEditor/iframe',
                    src: '**/*.js',
                    dest: '<%= config.distFolder %>/editorDist/iframe'
                }]
            }
        },
        watch: {
            options: {
                // livereload: '<%= config.livereload%>'
            },
            component: {
                files: ["hmEditor/iframe/*.js","hmEditor/extensions/**/tpl/*.html",
                    "hmEditor/extensions/**/js/*","hmEditor/extensions/**/css/*"],
                tasks: ["component", 'copy:baseInfo','clean:baseInfo',"concat:js","concat:css"]
            },
            
        },
        /**
         *  清理目录
         */
        clean: {
            release: ['<%= config.folder %>'],
            baseInfo: ['<%= config.folder %>/js/base.min.js'],
            after:['<%= config.folder %>/css/*.less'],
            dist:['<%= config.distFolder %>/<%= config.folder %>']
        }
	} );

	// Finally load the tasks.
    /**
     * 开发模式
     */
    grunt.registerTask('def_test', function () {
        grunt.task.run([
            'clean', 
            'component',
            'clean:after',
            'copy:baseInfo',
            'clean:baseInfo',
            'concat:js',
            'concat:css',
            // 'connect:server',
            'watch'
        ]);
    });
    /**
     * 构建模式
     */
    grunt.registerTask('release', function () {
        grunt.task.run([
            'clean', 
            'component:dist',
            'clean:after',
            'copy:baseInfo',
            'clean:baseInfo',
            'concat:js',
            'concat:css',
            'copy:editorDist',
            'copy:demo',
            'uglify:mtilTask'
        ]);
    });


    /**
     * 通用组件处理
     */
    grunt.registerTask('component', function(target) {
        // 要处理的根目录
        var rootdir = 'hmEditor/extensions';
        //处理后将结果文件存放的目录
        var resultdir = grunt.config('config.folder');
        // 构建组件 
        buildComponentDir(target, rootdir, resultdir);
    });
    /**
     * 构建指定模块组件
     * @param target registerTask 子任务名称
     * @param rootdir 组件的根目录，如：app/component
     * @param resultdir 处理后的结果文件存放目录，如：release目录
     */
    function buildComponentDir(target, rootdir, resultdir,parent){
        //__dirname 项目根路径
        //获取当前项目指定目录下的所有子目录
        var base = path.join(__dirname, rootdir);
        var paths = fs.readdirSync(base);
        paths.forEach(function(name) {
            //name为modules目录下所有子模块
            var stats = fs.statSync(path.join(base, name));
            //确保目录 是想要的
            if (/^[^.]/.test(name) && stats.isDirectory()) {
                var taskArr = []; // 要执行的任务数组
                var titleName = parent?(parent+'_'+name):name ;
                var taskName = titleName + 'js'; // 任务名（分js 和 css）
                //--------- 处理JS文件 ----------------
                var singleJsModule = util.format('%s/js/%s.js', resultdir, titleName);
                (function() {
                    var tplname = "$" +titleName + "_tpl";
                    // 压缩html
                    grunt.config(util.format('htmlmin.%s', taskName), {
                        options: {                       
                            removeComments: true,
                            collapseWhitespace: true
                        },
                        files: [{
                            expand: true,
                            cwd: util.format(rootdir+'/%s/tpl', name),
                            src: '**/*.html',
                            dest: util.format(rootdir+'/%s/tpl/tmp', name)
                        }]
                    });
                    // 将当前模块里的
                    // 模板合并在一起
                    grunt.config(util.format('htmlConvert.%s', tplname), {
                        options: {
                            rename:function (moduleName) {
                                return moduleName.replace('../'+rootdir+'/', '').replace('/tmp', '').replace('.html', '');
                            }
                        },
                        src: [util.format(rootdir+'/%s/tpl/tmp/*.html', name)],
                        dest: singleJsModule
                    });
                    // 合并模块内部脚本以及相关模板
                    // 经过html2js,现在singleJsModule是模板内容,再次合并它并保存产生期望内容
                    grunt.config(util.format('concat.%s', taskName), {
                        src: [singleJsModule, rootdir+'/'+name+'/module.js', rootdir+'/' + name + '/js/*.js'],
                        dest: singleJsModule
                    });
                    // 清除临时文件
                    grunt.config(util.format('clean.%s', taskName), {
                        src: [util.format(rootdir+'/%s/tpl/tmp', name)]
                    });

                    // 添加要执行的任务 Task
                    taskArr.push(util.format('htmlmin:%s', taskName));
                    taskArr.push(util.format('htmlConvert:%s', tplname));
                    taskArr.push(util.format('concat:%s', taskName));
                    taskArr.push(util.format('clean:%s', taskName));
                })();

                // --------- 处理CSS文件 ----------------
                var singleLessModule = util.format('%s/css/%s.less', resultdir, titleName);
                (function() {

                    taskName = titleName + 'css';

                    //合并相关less文件
                    grunt.config(util.format('concat.%s', taskName), {
                        src: [rootdir+'/' + name + '/css/*.less'],
                        dest: singleLessModule
                    });
                    //解析less文件
                    grunt.config(util.format('less.%s', taskName), {
                        options:{
                            // ieCompat:true
                        },
                        src: [singleLessModule],
                        dest: singleLessModule.replace('.less', '.css')
                    });
                    //autoprefixer处理浏览器兼容样式
                    grunt.config(util.format('autoprefixer.%s', taskName), {
                        options: {
                            browsers: [
                                'last 2 version', 'Firefox >= 20', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'
                            ]
                        },
                        files: [{
                            expand: true,
                            cwd: resultdir+'/css',
                            src: '**/*.css',
                            dest: resultdir+'/css'
                        }]
                    });
                    // 添加要执行的任务 Task
                    taskArr.push(util.format('concat:%s', taskName));
                    taskArr.push(util.format('less:%s', taskName));
                    taskArr.push(util.format('autoprefixer:%s', taskName));

                })();
                //执行当前任务
                grunt.task.run(taskArr);

                // 发布上线压缩代码
                var singleCssModule = singleLessModule.replace('.less', '.css');
                (function() {
                    // 是否是构建工程
                    var jsTask = name + 'djs';
                    var cssTask = name + 'dcss';
                    if (target === 'dist') {
                        // 压缩代码
                        grunt.config(util.format('uglify.%s', jsTask), {
                            src: singleJsModule,
                            dest: singleJsModule
                        });
                        // 压缩代码CSS
                        grunt.config(util.format('cssmin.%s', cssTask), {
                            options: {
                                banner: '<%= banner %>',
                                compatibility: 'ie7', //设置兼容模式
                                noAdvanced: true //取消高级特性
                            },
                            files: [{
                                src: singleCssModule,
                                dest: singleCssModule
                            }]
                        });
                        // 执行task
                        grunt.task.run([
                            util.format('uglify:%s', jsTask),
                            util.format('cssmin:%s', cssTask)
                        ]);
                    }
                    // 重命名JS
                    grunt.config(util.format('rename.%s', jsTask), {
                        src: singleJsModule,
                        dest: singleJsModule.replace(/js$/, 'min.js')
                    });
                    // 重命名CSS
                    grunt.config(util.format('rename.%s', cssTask), {
                        src: singleCssModule,
                        dest: singleCssModule.replace(/css$/, 'min.css')
                    });
                    //执行task
                    grunt.task.run([
                        util.format('rename:%s', jsTask),
                        util.format('rename:%s', cssTask)
                    ]);
                })();

            }
            var childPath = rootdir+'/'+name+'/component';
            if(fs.existsSync(path.join(__dirname,childPath))){
                buildComponentDir(target,childPath,resultdir,name)
            }
        });
    }
};
