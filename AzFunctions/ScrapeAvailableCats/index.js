var scrape = require("./scrape");

module.exports = function (context) {
    context.log('JavaScript timer trigger function ran!');
    scrape.scrapeAvailableCatIds(context).then(() => {
        context.log("Done scraping cats!");
        context.done();
    }).catch((err) => {
        context.log("Error scraping cats: " + err);
        context.done();  
    });
};