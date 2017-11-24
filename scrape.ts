import * as request from 'request';
import * as cheerio from 'cheerio';
import {Promise} from 'bluebird';

const config = {
    DOCDB_HOST: process.env.DOCDB_HOST || 'https://betting-lines.documents.azure.com:443/',
    DOCDB_AUTH_KEY: process.env.DOCDB_AUTH_KEY || 'WTznEcBUSpV1zKuvSNidYMBd1yuoHJrOR2A0N08DH8gTQOyzShCGWIhf5vhfab4A2aHjbBHEl87JfJbxByAV8g==',
    DATABASE: process.env.DATABASE || 'Betting',
    COLLECTION: process.env.COLLECTION || 'Games'
}

var docDBClient = require('documentdb').DocumentClient;
var docDBConfig = {
    "host": config.DOCDB_HOST,
    "authKey": config.DOCDB_AUTH_KEY,
    "database": { "id": config.DATABASE },
    "collection": { "id": config.COLLECTION }
};

var databaseUrl = `dbs/${docDBConfig.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${docDBConfig.collection.id}`;

var docDB = new docDBClient(docDBConfig.host, { masterKey: docDBConfig.authKey });

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
        public homeTeam: string, 
        public awayTeam: string, 
        public homeScore: number, 
        public awayScore: number, 
        public lines: Line[]
    ) {
        this.id = homeTeam + " vs. " + awayTeam;
    }
}

var url = 'http://www.donbest.com/nfl/odds/spreads/20171119.html';

request(url, function (err, resp, body) {
    if (err) { throw err; }
    let $ = cheerio.load(body);
    let games: Game[] = [];
    $('tr').each(function() {
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
            games.push(new Game(homeTeam, awayTeam, homeScore, awayScore, lines));
        }
    });

    //add games to database
    getDatabase().then((db) => {
        getCollection().then((collection:any) => {
            for (let game of games) {
                docDB.createDocument(collection._self, game, function (err, document) {
                    if (err) {
                        console.log('Error: createDocument: ' + err);
                    } else {
                        console.log('Success: ' + game.id);
                    }
                });
            }
        }).catch((err) => {
            console.log('Error: getCollection: ' + err);
        });
    }).catch((err) => {
        console.log('Error: getDatabase: ' + err);
    });
    console.log(games);
});

function getDatabase() {
    console.log(`Getting database: ${docDBConfig.database.id}`);
    return new Promise((resolve, reject) => {
        docDB.readDatabase(databaseUrl, (err, result) => {
            if (err) { reject(err); }
            else { resolve(result); }
        });
    });
}

function getCollection() {
    console.log(`Getting collection: ${docDBConfig.collection.id}`);
    return new Promise((resolve, reject) => {
        docDB.readCollection(collectionUrl, (err, result) => {
            if (err) { reject(err); } 
            else { resolve(result); }
        });
    });
}
