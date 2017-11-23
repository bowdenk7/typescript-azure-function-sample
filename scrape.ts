import * as request from 'request';
import * as cheerio from 'cheerio';


interface Line {
    name: string,
    awayLine: number,
    awayOdds: number,
    homeline: number,
    homeOdds: number
}

class Game {
    constructor(
        public homeTeam: string, 
        public awayTeam: string, 
        public homeScore: number, 
        public awayScore: number, 
        public lines: Line[]
    ) {}
}

var url = 'http://www.donbest.com/nfl/odds/spreads/20171119.html';

request(url, function (err, resp, body) {
    if (err) { throw err; }
    let $ = cheerio.load(body);
    let games = [];
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
    console.log(games);
});
