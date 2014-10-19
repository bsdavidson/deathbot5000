# UpperCamelCase -- modules, classes (File, Array, Enumerable)
# UPPER_CASE_UNDERSCORE -- constants, enforced by ruby
# lower_underscore -- functions, variables
# $prefixed_varibles -- globals
# @foo -- same as saying this.foo

lib_path = File.dirname(File.absolute_path(__FILE__))
$LOAD_PATH << lib_path

require 'sequel'
database_url = case ENV['RACK_ENV']
when 'production'
    ENV['CLEARDB_DATABASE_URL'].gsub(/^mysql:/, 'mysql2:')
when 'development'
    'mysql2://root@localhost/deathbot'
end

DB = Sequel.connect(database_url) if database_url

require 'app'
run App
