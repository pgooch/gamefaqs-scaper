const argv         = require('minimist')(process.argv.slice(2));
const fs           = require('fs');
const asciichart   = require ('asciichart');
const chrono       = require('chrono-node');
const ObjectsToCsv = require('objects-to-csv');

// This is the order the regions will be favored in, all overs will be at the end
// There is a secondary sort by date that will grab the first release for titles with numerous releases
let regionFavorability = ['US','EU','AU','JP']
let finalList = [];

// You can override this for easier development with nodemon
// argv._[0] = '../gamefaqs_ps_scrape_2020-11-8.json';

// These aren't as spiffy as the scraper, there only to get some basic ideas from the data.
// Perhaps, if there is enouhg use for this, I can make a menu and the like for it or integrate into the scrapper.
if(argv._[0]===undefined && argv._[1]!==undefined){
	console.log('Post processors take 1 variable, the path to a JSON file scrapped by the scraper, and nothing else.')
	process.exit(0);
}

// Let the user know what were doing, and start loading
console.log('Creating a list of games, favored by region, without duplicates. ')
console.log('Loading:',argv._[0]);
let rawdata = fs.readFileSync(argv._[0]);
let titles = JSON.parse(rawdata);

// Loop through the favorability list and grab all the results in the most favorable region
console.log('Processing data...');
Object.keys(titles).forEach((gameFAQsId)=>{
	let releases = titles[gameFAQsId].releaseData
	// If there is only 1 then this is really simple
	if(releases.length==1){
		finalList.push(releases[0])
	}else{

		// Lets Cycle through and grab the one that looks most interesting
		let possibilities = [];
		regionFavorability.forEach((region)=>{
			if(possibilities.length==0){
				releases.forEach((release)=>{
					if(release.region==region){
						possibilities.push(release)
					}
				})
			}
		})
		// If it was not released in a region we have in out favorability just put it in
		if(possibilities.length==0){
			possibilities = releases;
		}

		// We might be done here.
		if(possibilities.length==1){
			finalList.push(possibilities[0])
		}else{
			// We could go deeper and filter by date but it seems to be that way already
			finalList.push(possibilities[0])
		}
	}
});

finalList.sort((a,b)=>{
	if(a.title < b.title) { return -1; }
    if(a.title > b.title) { return 1; }
    return 0;

})

// Save it
// const csv = new ObjectsToCsv(finalList);
// let saveTo = argv._[0].replace('.json','_sorted_list.csv');
// console.log('Saving list to',saveTo);
// fs.writeFileSync(saveTo,csv.toString())
// csv.toDisk(saveTo);
// console.log('Done.');
// process.exit(0);

async function save(){
	let saveData = await new ObjectsToCsv(finalList).toString();
	let saveTo = argv._[0].replace('.json','_sorted_list.csv');
	fs.writeFileSync(saveTo,saveData)
}
save();