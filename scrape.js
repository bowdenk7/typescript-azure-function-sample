var request = require('request');
var cheerio = require('cheerio');
var DailyInstall = (function () {
    function DailyInstall(date, windows, linux, osx) {
        this.date = date;
        this.windows = windows;
        this.linux = linux;
        this.osx = osx;
    }
    DailyInstall.prototype.getTotalDownloads = function () {
        return this.windows + this.linux + this.osx;
    };
    DailyInstall.prototype.getDownloadString = function () {
        return this.date + ": " + this.getTotalDownloads();
    };
    return DailyInstall;
}());
var installData = [];
var url = 'https://packagecontrol.io/packages/TypeScript';
request(url, function (err, resp, body) {
    if (err) {
        throw err;
    }
    var $ = cheerio.load(body);
    //<div id="daily_installs"> <table cellspacing="0"> <tr class="dates"> <td class="none"></td>
    $('#daily_installs th').each(function () {
        var data = $(this).text();
        if (data != "Windows" && data != "OS X" && data != "Linux") {
            installData.push(new DailyInstall(data));
        }
    });
    var results = [];
    $('#daily_installs td').each(function () {
        var string = $(this).text();
        if (string) {
            results.push(string);
        }
    });
    var length = installData.length;
    var count = 0;
    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
        var x = results_1[_i];
        if (count < results.length / 3) {
            installData[count % (results.length / 3)].windows = +x;
        }
        else if (count < (results.length * 2) / 3) {
            installData[count % (results.length / 3)].osx = +x;
        }
        else {
            installData[count % (results.length / 3)].linux = +x;
        }
        count++;
    }
    $('#installs ul.totals li span.installs').each(function () {
        var uniqueDownloads = $(this)[0].attribs["title"];
        console.log("Total unique downloads: " + uniqueDownloads);
    });
    console.log("Total Sublime TypeScript plugin downloads per day");
    for (var _a = 0, installData_1 = installData; _a < installData_1.length; _a++) {
        var x = installData_1[_a];
        console.log(x.getDownloadString());
    }
});
//# sourceMappingURL=scrape.js.map