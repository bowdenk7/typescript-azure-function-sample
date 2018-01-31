import * as rp from 'request-promise';
import * as cheerio from 'cheerio';
import { start } from 'repl';
import * as moment from 'moment';
var util = require('util');

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// local
//const mongoUri = 'mongodb://localhost/Betting';

//heroku
const mongoUri = "";

mongoose.set('debug', true);

const gameSchema = new mongoose.Schema(
    {
        date: Date,
        dateString: String,
        homeTeam: String,
        awayTeam: String,
        homeScore: String,
        awayScore: String,
        lines: Array
    },
    {
        collection: 'Games'
    }
);

const GameModel = mongoose.model('Game', gameSchema);

interface Line {
    name: string,
    awayLine: number,
    awayOdds: number,
    homeline: number,
    homeOdds: number
}

class Game {
    id: string;
    constructor(
        public date: Date,
        public dateString: string,
        public homeTeam: string, 
        public awayTeam: string, 
        public homeScore: number, 
        public awayScore: number, 
        public lines: Line[]
    ) {
        //this.id = homeTeam + " vs. " + awayTeam;
    }
}

var baseUrl = 'http://www.donbest.com/nfl/odds/spreads/';

async function scrapeBettingLines(dates) {
    let allGames: Game[] = [];
    for (let date of dates) {
        let url = baseUrl + date + ".html";
        let games = await scrapeGameLinesFromUrl(url, date);
        allGames = allGames.concat(games);
    }
    console.log("Done scraping.");

    console.log(`Saving ${allGames.length} games to database`);
    await saveGames(allGames);
    console.log("All done.");
}

let dates = getDateStrings('20171124', 30);
console.log(`Fetching scores and lines from ${prettyPrintDate(dates[dates.length - 1])} to ${prettyPrintDate(dates[0])}`)

scrapeBettingLines(dates);


/**
 * 
 * @param startDate string date in the format: YYYYMMDD eg: '20171119'
 * @param numberDays number of days fetch counting backward from start date
 */
function getDateStrings(startDate, numberDays) {
    let dates: string[] = [];

    for (let i = 0; i < numberDays+1; i++) {
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
function prettyPrintDate(date: string) {
    return moment(date, "YYYYMMDD").format("MM-DD-YYYY");
}

async function scrapeGameLinesFromUrl(url: string, date: string): Promise<Game[]> {
    console.log("Fetching data from: " + url);
    let body: any = await rp(url);
    
    let $ = cheerio.load(body);
    let games: Game[] = [];
    $('tr').each(function () {
        const data = $(this).text();

        if ($(this)[0].children[2] && !($(this)[0].children[2].children[0].data == "Team")) { //ghetto way of detecting that our row is not a header
            const awayTeam = $(this)[0].children[2].children[0].children[0].children[0].children[0].data;
            const homeTeam = $(this)[0].children[2].children[0].children[2].children[0].children[0].data;
            const awayScore = parseFloat($(this)[0].children[4].children[0].children[0].children[0].data);
            const homeScore = parseFloat($(this)[0].children[4].children[1].children[0].children[0].data);
            const lineNames = ["Westgate", "Mirage", "Station", "Pinnacle", "SIA", "SBG", "BetUS", "BetPhoenix",
                "EasyStreet", "Bovada", "Jazz", "Sportsbet", "BookMaker", "DSI", "AceSport"];
            let lines: Line[] = [];
            for (let i = 0; i < lineNames.length; i++) {
                let lineData: Line = {
                    name: lineNames[i],
                    awayLine: parseFloat($(this)[0].children[6 + i].children[0].children[0].data.split("\n")[0]),
                    awayOdds: parseFloat($(this)[0].children[6 + i].children[0].children[0].data.split("\n")[1].trim()),
                    homeline: parseFloat($(this)[0].children[6 + i].children[1].children[0].data.split("\n")[0]),
                    homeOdds: parseFloat($(this)[0].children[6 + i].children[1].children[0].data.split("\n")[1].trim())
                }

                lines.push(lineData);
            }
            let momentDate = moment(date, "YYYYMMDD");
            games.push(new Game(momentDate.toDate(), momentDate.format("MM-DD-YYYY"), homeTeam, awayTeam, homeScore, awayScore, lines));
        }
    });
    return games;
}

async function saveGames(games: Game[]) {
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
}