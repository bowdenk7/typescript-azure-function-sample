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
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const mongoUri = "mongodb://bowden:bowden@ds046867.mlab.com:46867/catcity";
mongoose.set('debug', true);
const catSchema = new mongoose.Schema({ catId: String }, { collection: 'ToAnalyze' });
const CatModel = mongoose.model('CatId', catSchema);
function scrapeAvailableCatIds(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let catIds = [];
        var url = 'http://ws.petango.com/webservices/adoptablesearch/wsAdoptableAnimals.aspx?species=Cat&sex=A&agegroup=All&location=&site=&onhold=A&orderby=Name&colnum=3&authkey=rswvwk3aji0702itbbfvf25a7gg8qko33npo05jeic12q66vd2';
        context.log("Fetching data from: " + url);
        let body = yield rp(url);
        let $ = cheerio.load(body);
        $('.list-animal-id').each(function () {
            catIds.push($(this).text());
        });
        context.log("Done scraping ids.");
        context.log(`Saving ${catIds.length} cats to database`);
        yield saveCats(catIds, context);
        context.log("All done.");
    });
}
exports.scrapeAvailableCatIds = scrapeAvailableCatIds;
function saveCats(ids, context) {
    return __awaiter(this, void 0, void 0, function* () {
        mongoose.connect(mongoUri, { useMongoClient: true }, function (err) {
            if (err) {
                context.log(err);
                return;
            }
            context.log("Client DB: connected");
            for (let id of ids) {
                let newCat = {
                    catId: id
                };
                CatModel.update({ catId: id }, newCat, { upsert: true, setDefaultsOnInsert: true }, (err) => {
                    if (err) {
                        context.log(err);
                    }
                    context.log('done');
                });
            }
        });
    });
}
//# sourceMappingURL=scrape.js.map