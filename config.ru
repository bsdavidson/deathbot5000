# UpperCamelCase -- modules, classes (File, Array, Enumerable)
# UPPER_CASE_UNDERSCORE -- constants, enforced by ruby
# lower_underscore -- functions, variables
# $prefixed_varibles -- globals
# @foo -- same as saying this.foo

lib_path = File.dirname(File.absolute_path(__FILE__))
$LOAD_PATH << lib_path

require 'sequel'
unless ENV['RACK_ENV'] == 'test'
    DB = Sequel.connect('mysql2://root@localhost/deathbot')
end

require 'app'
run App
