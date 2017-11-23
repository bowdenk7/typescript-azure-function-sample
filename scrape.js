"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var cheerio = require("cheerio");
var Game = /** @class */ (function () {
    function Game(homeTeam, awayTeam, homeScore, awayScore, lines) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.lines = lines;
    }
    return Game;
}());
var url = 'http://www.donbest.com/nfl/odds/spreads/20171119.html';
request(url, function (err, resp, body) {
    if (err) {
        throw err;
    }
    var $ = cheerio.load(body);
    var games = [];
    $('tr').each(function () {
        var data = $(this).text();
        if ($(this)[0].children[2] && !($(this)[0].children[2].children[0].data == "Team")) {
            var awayTeam = $(this)[0].children[2].children[0].children[0].children[0].children[0].data;
            var homeTeam = $(this)[0].children[2].children[0].children[2].children[0].children[0].data;
            var awayScore = parseFloat($(this)[0].children[4].children[0].children[0].children[0].data);
            var homeScore = parseFloat($(this)[0].children[4].children[1].children[0].children[0].data);
            var lineNames = ["Westgate", "Mirage", "Station", "Pinnacle", "SIA", "SBG", "BetUS", "BetPhoenix",
                "EasyStreet", "Bovada", "Jazz", "Sportsbet", "BookMaker", "DSI", "AceSport"];
            var lines = [];
            for (var i = 0; i < lineNames.length; i++) {
                var lineData = {
                    name: lineNames[i],
                    awayLine: parseFloat($(this)[0].children[6 + i].children[0].children[0].data.split("\n")[0]),
                    awayOdds: parseFloat($(this)[0].children[6 + i].children[0].children[0].data.split("\n")[1].trim()),
                    homeline: parseFloat($(this)[0].children[6 + i].children[1].children[0].data.split("\n")[0]),
                    homeOdds: parseFloat($(this)[0].children[6 + i].children[1].children[0].data.split("\n")[1].trim())
                };
                lines.push(lineData);
            }
            games.push(new Game(homeTeam, awayTeam, homeScore, awayScore, lines));
        }
    });
    console.log(games);
});
//# sourceMappingURL=scrape.js.map