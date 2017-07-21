var request = require('request');
var cheerio = require('cheerio');

class DailyInstall {
    date: string;
    windows: number;
    linux: number;
    osx: number;

    constructor(date: string, windows?: number, linux?: number, osx?: number) {
        this.date = date;
        this.windows = windows;
        this.linux = linux;
        this.osx = osx;
    }

    getTotalDownloads():number {
        return this.windows + this.linux + this.osx;
    }

    getDownloadString(): string {
        return this.date + ": " + this.getTotalDownloads();
    }
}

var installData: (undefined | DailyInstall)[] = [];

var url = 'https://packagecontrol.io/packages/TypeScript';

request(url, function (err, resp, body) {
    if (err) { throw err; }
    let $ = cheerio.load(body);
    //<div id="daily_installs"> <table cellspacing="0"> <tr class="dates"> <td class="none"></td>
    $('#daily_installs th').each(function () {
        const data = $(this).text();
        if (data != "Windows" && data != "OS X" && data != "Linux") {
            installData.push(new DailyInstall(data));
        }
    });
    
    let results: string[] = [];
    $('#daily_installs td').each(function () {
        let string = $(this).text();
        if (string) { // first string is empty, so don't push that
            results.push(string);
        }
    });

    const length = installData.length;
    let count = 0;
    for (let x of results) {
        if (count < results.length / 3) {
            installData[count % (results.length /3)].windows = +x;
        } else if (count < (results.length * 2) / 3) {
            installData[count % (results.length /3)].osx = +x;
        } else {
            installData[count % (results.length /3)].linux = +x;
        }
        count++;
    }

     $('#installs ul.totals li span.installs').each(function () {
        let uniqueDownloads = $(this)[0].attribs["title"];
        console.log("Total unique downloads: " + uniqueDownloads);

    });
 
    console.log("Total Sublime TypeScript plugin downloads per day");
    for (let x of installData) {
        console.log(x.getDownloadString());
    }
});
