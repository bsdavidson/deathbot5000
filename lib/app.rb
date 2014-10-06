require 'sinatra'
require 'json'
require 'sequel'


#DB = Sequel.connect("mysql2://#{ENV['C9_USER']}@#{ENV['IP']}/c9")

SELECT_SCORES_SQL = 'select * from scores order by score desc'
SELECT_SCORE_SQL = 'select * from scores where id = :id limit 1'
INSERT_SCORE_SQL = 'insert into scores (player, score, created_on) values (:player, :score, from_unixtime(:created_on))'


class App < Sinatra::Base
    set(:public_dir, File.join(File.dirname(__FILE__), '..'))

    get '/leaderboards' do
        return DB[SELECT_SCORES_SQL].all.to_json
    end

    post '/leaderboards' do
        player = params['player']
        score = params['score']
        created_on = Time.now.to_i
        id = DB[INSERT_SCORE_SQL, {
            :player => player,
            :score => score,
            :created_on => created_on
        }].insert
        score = DB[SELECT_SCORE_SQL, {:id => id}].first
        return score.to_json
    end

    get '/' do
        index_path = File.join(File.dirname(__FILE__), '..','index.html')
        return File.read(index_path)
    end
end
