'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      styles: {
        files: 'static/less/**/*.less',
        tasks: ['less'],
        options: {
          interrupt: true,
        },
      },
    },

    copy: {
      dist: {
        files: [{
          src: 'node_modules/trumbowyg/dist/ui/icons.svg',
          dest: 'static/images/icons.svg',
          flatten: true,
          filter: 'isFile',
        }],
      },
    },

    less: {
      dist: {
        options: {
          paths: ['node_modules/semantic-ui-less'],
        },
        files: {
          'static/css/app.css': 'static/less/app.less',
        }
      },
    },

    concat: {
      options: {
        separator: ';',
      },
      js: {
        src: [
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/clipboard/dist/clipboard.min.js',
          'node_modules/trumbowyg/dist/trumbowyg.min.js',
          'node_modules/semantic-ui-less/definitions/**/*.js',
        ],
        dest: 'static/js/bundle.js',
      },
      css: {
        src: [
          'node_modules/trumbowyg/dist/ui/trumbowyg.min.css',
        ],
        dest: 'static/css/bundle.css',
      },
    },

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['less', 'copy', 'concat']);
};
