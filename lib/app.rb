require 'sinatra'
require 'json'
require 'sequel'


DB = Sequel.connect("mysql2://#{ENV['C9_USER']}@#{ENV['IP']}/c9")




$LEADERBOARDS = [
    # {"foo" => 1, "bar" => 2}
    {"player" => "Nathan", "score" => 9001},
    {"player" => "Brian", "score" => 7777},
    {"player" => "Toby", "score" => -100}
]


class App < Sinatra::Base
    # get '/users' do
    #     return 'Hello, world!'
    # end

    # get '/users/:username' do |username|
    #     return 'Hello, ' + username + '!'
    # end

    set(:public_dir, File.join(File.dirname(__FILE__), '..'))


    get '/leaderboards' do
        return $LEADERBOARDS.to_json
    end

    get '/' do
        index_path = File.join(File.dirname(__FILE__), '..','index.htm')
        return File.read(index_path)
    end
end
