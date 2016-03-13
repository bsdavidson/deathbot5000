// To Use:
// Add to your JS file:
// SS.scoreServer = 'http://simplescore.herokuapp.com';
// SS.gameId = 'DB5K';
// SS.serverId = '320B';

// add the simplescore.js file before your existing scripts in your index.html.

// In your game code:
// Get existing scores -  var scores = SS.getScores();
// Submit New score - SS.submitScore(playerName, score);

(function() {
  var SS = window.SS = {
    currentScores: [],
    submitScore: function(player, score) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open('POST', SS.scoreServer + '/api/scores', true);
      xmlhttp.setRequestHeader('Content-type',
                               'application/x-www-form-urlencoded');
      xmlhttp.send('serverId=' + SS.serverId + '&gameId=' + SS.gameId +
                   '&playerName=' + player + '&score=' + score);
    },
    getScores: function(maxScores) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          SS.scores = xmlhttp.responseText;
          SS.scores = JSON.parse(SS.scores);
          SS.currentScores = SS._returnTable();
          // TODO: Figure out wtf
          SS.currentScores.sort(function(a, b) {
            return a.score - b.score;
          });
          if (SS.currentScores.length > maxScores) {
            var del = SS.currentScores.length - maxScores;
            console.log('cutting!', del);
            SS.currentScores.splice(0, del);
            console.log(SS.currentScores.length);
          }
          SS.currentScores.sort(function(a, b) {
            return b.score - a.score;
          });
          console.log(SS.currentScores);
        }
      };
      xmlhttp.open('GET', SS.scoreServer + '/api/scores/' + SS.serverId +
        '/game/' + SS.gameId + '?t=' + Math.random(), true);
      xmlhttp.send();
    },
    _returnTable: function() {
      var scoreArray = [];
      for (var key in SS.scores) {
        if (SS.scores.hasOwnProperty(key)) {
          var obj = SS.scores[key];
          scoreArray.push({'name': obj.playerName, 'score': obj.score});
        }
      }
      return scoreArray;
    }
  };
})();
