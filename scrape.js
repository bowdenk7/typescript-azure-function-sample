"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var cheerio = require("cheerio");
var bluebird_1 = require("bluebird");
var config = {
    DOCDB_HOST: process.env.DOCDB_HOST || 'https://betting-lines.documents.azure.com:443/',
    DOCDB_AUTH_KEY: process.env.DOCDB_AUTH_KEY || 'WTznEcBUSpV1zKuvSNidYMBd1yuoHJrOR2A0N08DH8gTQOyzShCGWIhf5vhfab4A2aHjbBHEl87JfJbxByAV8g==',
    DATABASE: process.env.DATABASE || 'Betting',
    COLLECTION: process.env.COLLECTION || 'Games'
};
var docDBClient = require('documentdb').DocumentClient;
var docDBConfig = {
    "host": config.DOCDB_HOST,
    "authKey": config.DOCDB_AUTH_KEY,
    "database": { "id": config.DATABASE },
    "collection": { "id": config.COLLECTION }
};
var databaseUrl = "dbs/" + docDBConfig.database.id;
var collectionUrl = databaseUrl + "/colls/" + docDBConfig.collection.id;
var docDB = new docDBClient(docDBConfig.host, { masterKey: docDBConfig.authKey });
var Game = /** @class */ (function () {
    function Game(homeTeam, awayTeam, homeScore, awayScore, lines) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.lines = lines;
        this.id = homeTeam + " vs. " + awayTeam;
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
    //add games to database
    getDatabase().then(function (db) {
        getCollection().then(function (collection) {
            var _loop_1 = function (game) {
                docDB.createDocument(collection._self, game, function (err, document) {
                    if (err) {
                        console.log('Error: createDocument: ' + err);
                    }
                    else {
                        console.log('Success: ' + game.id);
                    }
                });
            };
            for (var _i = 0, games_1 = games; _i < games_1.length; _i++) {
                var game = games_1[_i];
                _loop_1(game);
            }
        }).catch(function (err) {
            console.log('Error: getCollection: ' + err);
        });
    }).catch(function (err) {
        console.log('Error: getDatabase: ' + err);
    });
    console.log(games);
});
function getDatabase() {
    console.log("Getting database: " + docDBConfig.database.id);
    return new bluebird_1.Promise(function (resolve, reject) {
        docDB.readDatabase(databaseUrl, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}
function getCollection() {
    console.log("Getting collection: " + docDBConfig.collection.id);
    return new bluebird_1.Promise(function (resolve, reject) {
        docDB.readCollection(collectionUrl, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}
//# sourceMappingURL=scrape.js.map