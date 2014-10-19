require 'simplecov'
SimpleCov.start

# require 'logger'
require 'pry'
require 'rack/test'
require 'rspec'
require 'sequel'

RSpec.configure do |config|
    def load_sql(pattern)
      Dir.glob(pattern).sort.each do |filename|
        IO.read(filename).split(/;\n+(?=[^\s])/).map(&:strip).each do |statement|
          DB.execute(statement) unless statement.empty?
        end
      end
    end

    DB = Sequel.connect 'mysql2://root@localhost'
    # DB.loggers << Logger.new(STDOUT) if ENV['DB_VERBOSE']
    DB.execute 'drop database if exists test_deathbot'
    DB.execute 'create database test_deathbot'
    DB.execute 'use test_deathbot'
    load_sql "#{File.dirname(__FILE__)}/../*.sql"

    config.before :each do
        tables = ['scores']
        tables.each do |table|
            DB.execute("truncate table #{table}")
        end
    end

    config.include Rack::Test::Methods

    def app
        App
    end
end

module Rack
    class MockResponse
        def json
            @json ||= JSON.parse(body)
        end
    end
end

ENV['RACK_ENV'] ||= 'test'
require_relative '../app'
