/* jshint node:true */

'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        jshint: {
            berzerk: {
                files: {
                    src: ['js/**/*.js']
                }
            }
        },
        watch: {
            berzerk: {
                files: ['js/**/*.js'],
                tasks: ['jshint'],
                options: {
                    spawn: false
                }
            }
        }
    });
};
