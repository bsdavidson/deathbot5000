require_relative './spec_helper'

describe 'Leaderboards' do
    describe 'GET /leaderboards' do
        it 'should return a list of score' do
            sql = 'INSERT INTO scores (player, score, created_on) VALUES (?, ?, ?)'
            DB[sql, 'Toby', 9001, '2014-01-02 00:00:00'].insert
            DB[sql, 'Jindo', 75, '2014-01-01 00:00:00'].insert
            DB[sql, 'Buster', -1, '2014-01-03 00:00:00'].insert
            get '/leaderboards'
            expect(last_response.status).to eq(200)
            expect(last_response.json).to eq([
                {'id' => 1, 'player' => 'Toby', 'score' => 9001, 'created_on' => '2014-01-02 00:00:00 -0600'},
                {'id' => 2, 'player' => 'Jindo', 'score' => 75, 'created_on' => '2014-01-01 00:00:00 -0600'},
                {'id' => 3, 'player' => 'Buster', 'score' => -1, 'created_on' => '2014-01-03 00:00:00 -0600'}
            ])
        end
    end

    describe 'POST /leaderboards' do
        it ('should add a score and return the results') do
            created_on = Time.parse('2014-01-02 00:00:00 UTC')
            expect(Time).to receive(:now).at_least(:once).and_return(created_on)
            post '/leaderboards', {'player' => 'Pooh', 'score' => 999999}
            expect(last_response.json).to eq({
                'id' => 1,
                'player' => 'Pooh',
                'score' => 999999,
                'created_on' => '2014-01-02 00:00:00 -0600'
            })
        end
    end
end
