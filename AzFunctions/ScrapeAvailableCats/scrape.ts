import * as rp from 'request-promise';
import * as cheerio from 'cheerio';
import { start } from 'repl';
import { Model, MongooseDocument } from 'mongoose';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const mongoUri = "mongodb://bowden:bowden@ds046867.mlab.com:46867/catcity";
mongoose.set('debug', true);
const catSchema = new mongoose.Schema({ catId: String }, { collection: 'ToAnalyze' });
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
}

