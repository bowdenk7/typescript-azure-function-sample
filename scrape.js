"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rp = require("request-promise");
const cheerio = require("cheerio");
const moment = require("moment");
var util = require('util');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// local
//const mongoUri = 'mongodb://localhost/Betting';
//heroku
const mongoUri = "mongodb://bowden:bowden@ds121456.mlab.com:21456/heroku_27vbtgss";
mongoose.set('debug', true);
const gameSchema = new mongoose.Schema({
    date: Date,
    dateString: String,
    homeTeam: String,
    awayTeam: String,
    homeScore: String,
    awayScore: String,
    lines: Array
}, {
    collection: 'Games'
});
const GameModel = mongoose.model('Game', gameSchema);
class Game {
    constructor(date, dateString, homeTeam, awayTeam, homeScore, awayScore, lines) {
        this.date = date;
        this.dateString = dateString;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.lines = lines;
        //this.id = homeTeam + " vs. " + awayTeam;
    }
}
var baseUrl = 'http://www.donbest.com/nfl/odds/spreads/';
function scrapeBettingLines(dates) {
    return __awaiter(this, void 0, void 0, function* () {
        let allGames = [];
        for (let date of dates) {
            let url = baseUrl + date + ".html";
            let games = yield scrapeGameLinesFromUrl(url, date);
            allGames = allGames.concat(games);
        }
        console.log("Done scraping.");
        console.log(`Saving ${allGames.length} games to database`);
        yield saveGames(allGames);
        console.log("All done.");
    });
}
let dates = getDateStrings('20171124', 30);
console.log(`Fetching scores and lines from ${prettyPrintDate(dates[dates.length - 1])} to ${prettyPrintDate(dates[0])}`);
scrapeBettingLines(dates);
/**
 *
 * @param startDate string date in the format: YYYYMMDD eg: '20171119'
 * @param numberDays number of days fetch counting backward from start date
 */
function getDateStrings(startDate, numberDays) {
    let dates = [];
    for (let i = 0; i < numberDays + 1; i++) {
        dates.push(moment(startDate, "YYYYMMDD").subtract(i, 'days').format("YYYYMMDD"));
    }
    let year = startDate;
    let month = startDate;
    let day = startDate;
    return dates;
}
/**
 * Prints a YYYYMMDD date as DD-MM-YYYY
 */
function prettyPrintDate(date) {
    return moment(date, "YYYYMMDD").format("MM-DD-YYYY");
}
function scrapeGameLinesFromUrl(url, date) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Fetching data from: " + url);
        let body = yield rp(url);
        let $ = cheerio.load(body);
        let games = [];
        $('tr').each(function () {
            const data = $(this).text();
            if ($(this)[0].children[2] && !($(this)[0].children[2].children[0].data == "Team")) {
                const awayTeam = $(this)[0].children[2].children[0].children[0].children[0].children[0].data;
                const homeTeam = $(this)[0].children[2].children[0].children[2].children[0].children[0].data;
                const awayScore = parseFloat($(this)[0].children[4].children[0].children[0].children[0].data);
                const homeScore = parseFloat($(this)[0].children[4].children[1].children[0].children[0].data);
                const lineNames = ["Westgate", "Mirage", "Station", "Pinnacle", "SIA", "SBG", "BetUS", "BetPhoenix",
                    "EasyStreet", "Bovada", "Jazz", "Sportsbet", "BookMaker", "DSI", "AceSport"];
                let lines = [];
                for (let i = 0; i < lineNames.length; i++) {
                    let lineData = {
                        name: lineNames[i],
                        awayLine: parseFloat($(this)[0].children[6 + i].children[0].children[0].data.split("\n")[0]),
                        awayOdds: parseFloat($(this)[0].children[6 + i].children[0].children[0].data.split("\n")[1].trim()),
                        homeline: parseFloat($(this)[0].children[6 + i].children[1].children[0].data.split("\n")[0]),
                        homeOdds: parseFloat($(this)[0].children[6 + i].children[1].children[0].data.split("\n")[1].trim())
                    };
                    lines.push(lineData);
                }
                let momentDate = moment(date, "YYYYMMDD");
                games.push(new Game(momentDate.toDate(), momentDate.format("MM-DD-YYYY"), homeTeam, awayTeam, homeScore, awayScore, lines));
            }
        });
        return games;
    });
}
function saveGames(games) {
    return __awaiter(this, void 0, void 0, function* () {
        mongoose.connect(mongoUri, { useMongoClient: true }, function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Client DB: connected");
            for (let game of games) {
                let gameModel = new GameModel({
                    homeTeam: game.homeTeam,
                    awayTeam: game.awayTeam,
                    homeScore: game.homeScore,
                    awayScore: game.awayScore,
                    lines: game.lines
                });
                gameModel.save((err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('done');
                });
            }
        });
    });
}
//# sourceMappingURL=scrape.js.map