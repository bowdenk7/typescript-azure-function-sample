import * as rp from 'request-promise';
import * as cheerio from 'cheerio';
import { start } from 'repl';
import { Model, MongooseDocument } from 'mongoose';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const mongoUri = "mongodb://bowden:bowden@ds046867.mlab.com:46867/catcity";
mongoose.set('debug', true);
mongoose.connect(mongoUri, { useMongoClient: true });

interface Cat {
    catId: string;
    created: Date;
    imageUrls?: string[];
    name?: string;
    breed?: string;
    age?: string;
    gender?: string;
    size?: string;
    site?: string;
    location?: string;
    stage?: string;
    description?: string;
}

const catSchema = new mongoose.Schema(
    {
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
    },
    { collection: 'ToAnalyze' });
const CatModel = mongoose.model('CatId', catSchema);

export async function scrapeAvailableCatIds(context) {
    let catIds: string[] = [];
    var url = 'http://ws.petango.com/webservices/adoptablesearch/wsAdoptableAnimals.aspx?species=Cat&sex=A&agegroup=All&location=&site=&onhold=A&orderby=Name&colnum=3&authkey=rswvwk3aji0702itbbfvf25a7gg8qko33npo05jeic12q66vd2';
    context.log("Fetching data from: " + url);
    let body: any = await rp(url);
    let $ = cheerio.load(body);
    
    $('.list-animal-id').each(function () {
        catIds.push($(this).text());
    });

    context.log("Done scraping ids.");

    context.log(`Saving ${catIds.length} cats to database`);
    await saveCats(catIds, context);
    context.log("All done.");
}

async function saveCats(ids: string[], context) {
    for (let id of ids) {
        let newCat = {
            catId: id
        };

        let result = await CatModel.findOneAndUpdate({ catId: id }, newCat, {upsert: true, new: true, setDefaultsOnInsert: true});
        if (result.description) {
            context.log("Fetching cat details for cat: " + result.catId);
            await getAndSaveCatDetails(result.catId, context);
        }
    }
}

async function getAndSaveCatDetails(catId: string, context) {
    var url = `http://ws.petango.com/webservices/adoptablesearch/wsAdoptableAnimalDetails.aspx?id=${catId}`;
    context.log("Fetching cat details from from: " + url);
    let body: any = await rp(url);
    let $ = cheerio.load(body);

    let images = [$("#imgAnimalPhoto")[0].attribs['src'].split("//")[1]];
    if ($("#lnkPhoto2")[0] && $("#lnkPhoto2")[0].attribs['href']) {
        images.push([$("#lnkPhoto2")[0].attribs['href'].split("//")[1]]);
    }
    if ($("#lnkPhoto3")[0] && $("#lnkPhoto3")[0].attribs['href']) {
        images.push([$("#lnkPhoto3")[0].attribs['href'].split("//")[1]]);
    }

    let catInfo: Partial<Cat> = {
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
    }

    let result = await CatModel.findOneAndUpdate({ catId: catId }, catInfo, { upsert: true });

}