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
    catId: string,
    imageUrl?: string,
    name?: string,
    breed?: string,
    age?: string,
    gender?: string,
    size?: string,
    site?: string,
    location?: string,
    stage?: string
}

const catSchema = new mongoose.Schema(
    {
        catId: String,
        imageUrl: String,
        name: String,
        breed: String,
        age: String,
        gender: String,
        size: String,
        site: String,
        location: String,
        stage: String
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
        let result = await CatModel.findOneAndUpdate({ catId: id }, newCat, {upsert: true});
        //let result = await CatModel.update({ catId: id }, newCat, { upsert: true, setDefaultsOnInsert: true });
        if (!result.imgUrl) {
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

    let catInfo: Cat = {
        catId: catId,
        imageUrl: $("#imgAnimalPhoto")[0].attribs['src'].split("//")[1],
        name: $('.detail-animal-name')[0].children[1].children[0].data,
        breed: $('#trBreed')[0].children[3].children[1].children[0].data,
        age: $('#trAge')[0].children[3].children[1].children[0].data,
        gender: $('#trSex')[0].children[3].children[1].children[0].data,
        size: $('#trSize')[0].children[3].children[1].children[0].data,
        site: $('#trSite')[0].children[3].children[1].children[0].data,
        location: $('#trLocation')[0].children[3].children[1].children[0].data,
        stage: $('#trStage')[0].children[3].children[1].children[0].data
    }

    let result = await CatModel.findOneAndUpdate({ catId: catId }, catInfo, { upsert: true });

}