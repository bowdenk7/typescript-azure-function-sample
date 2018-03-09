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
const dotenv = require("dotenv");
;
dotenv.config({ path: "./.env" });
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const mongoUri = "mongodb://sample:sample@ds012538.mlab.com:12538/catcity-sample";
mongoose.set('debug', true);
//console.log("Env var: "+ process.env["MONGODB_URI"]);  couldn't get this to work with local.settings.json
mongoose.connect(mongoUri, { useMongoClient: true });
const catSchema = new mongoose.Schema({
    catId: String,
    created: { type: Date, default: Date.now },
    imageUrls: [String],
    name: String,
    breed: String,
    age: String,
    gender: String,
    size: String,
    site: String,
    location: String,
    stage: String,
    description: String
}, { collection: 'ToAnalyze' });
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
        context.log(`Updating available statuses`);
        yield updateAvailableStatus(catIds);
        context.log("All done.");
    });
}
exports.scrapeAvailableCatIds = scrapeAvailableCatIds;
function saveCats(ids, context) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let id of ids) {
            let newCat = {
                catId: id
            };
            let result = yield CatModel.findOneAndUpdate({ catId: id }, newCat, { upsert: true, new: true, setDefaultsOnInsert: true });
            context.log("Fetching cat details for cat: " + result.catId);
            yield getAndSaveCatDetails(result.catId, context);
        }
    });
}
function updateAvailableStatus(catIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield CatModel.find({ stage: "Available" });
        for (let cat of results) {
            if (catIds.indexOf(cat.catId) == -1) {
                let result = yield CatModel.findOneAndUpdate({ catId: cat.catId }, { stage: "Adopted" });
            }
        }
    });
}
function getAndSaveCatDetails(catId, context) {
    return __awaiter(this, void 0, void 0, function* () {
        var url = `http://ws.petango.com/webservices/adoptablesearch/wsAdoptableAnimalDetails.aspx?id=${catId}`;
        context.log("Fetching cat details from from: " + url);
        let body = yield rp(url);
        let $ = cheerio.load(body);
        let images = [$("#imgAnimalPhoto")[0].attribs['src'].split("//")[1]];
        if ($("#lnkPhoto2")[0] && $("#lnkPhoto2")[0].attribs['href']) {
            images.push([$("#lnkPhoto2")[0].attribs['href'].split("//")[1]]);
        }
        if ($("#lnkPhoto3")[0] && $("#lnkPhoto3")[0].attribs['href']) {
            images.push([$("#lnkPhoto3")[0].attribs['href'].split("//")[1]]);
        }
        let catInfo = {
            catId: catId,
            imageUrls: images,
            name: $('.detail-animal-name')[0].children[1].children[0].data,
            breed: $('#trBreed')[0].children[3].children[1].children[0].data,
            age: $('#trAge')[0].children[3].children[1].children[0].data,
            gender: $('#trSex')[0].children[3].children[1].children[0].data,
            size: $('#trSize')[0].children[3].children[1].children[0].data,
            site: $('#trSite')[0].children[3].children[1].children[0].data,
            location: $('#trLocation')[0].children[3].children[1].children[0].data,
            stage: $('#trStage')[0].children[3].children[1].children[0].data,
            description: $('#lbDescription')[0].children[0] ? $('#lbDescription')[0].children[0].data : ""
        };
        let result = yield CatModel.findOneAndUpdate({ catId: catId }, catInfo, { upsert: true });
    });
}
//# sourceMappingURL=scrape.js.map