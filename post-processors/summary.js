const argv       = require('minimist')(process.argv.slice(2));
const fs         = require('fs');
const asciichart = require ('asciichart');

// define things used below
const maximum_output_width = 72;
const bar_parts = ['█','▉','▊','▋','▌','▍','▎','▏'];

// You can override this for easier development with nodemon
// argv._[0] = '../gamefaqs_ps_scrape_2020-11-8.json';

// These aren't as spiffy as the scraper, there only to get some basic ideas from the data.
// Perhaps, if there is enouhg use for this, I can make a menu and the like for it or integrate into the scrapper.
if(argv._[0]===undefined && argv._[1]!==undefined){
	console.log('Post processors take 1 variable, the path to a JSON file scrapped by the scraper, and nothing else.')
	process.exit(0);
}

// Let the user know what were doing, and start loading
console.log('Generating summary of scapped data')
console.log('Loading:',argv._[0]);
let rawdata = fs.readFileSync(argv._[0]);
let titles = JSON.parse(rawdata);

// Parse the file
summaryData = {
	uniqueEntries: 0,
	uniqueReleases: 0,
	releases: {
		byRegion: {},
		byYear: {},
		byPublisher: {},
		byRating: {},
	},
	byDevelopers: {},
	byTopGenre: {},
	byMetacriticScore: {},
	byFranchise: {},
	byEsrbDescriptors: {},
	byLocalPlayers: {},
	mostGamesYouMayLike: {},
}
console.log('Gathering summary from data.')
Object.keys(titles).forEach((gameFAQsId)=>{

	// uniqueEntries
	summaryData.uniqueEntries++;

	// Loop through the releases
	titles[gameFAQsId].releaseData.forEach((release)=>{
		// releases master number
		summaryData.uniqueReleases++;
		// Region
		if( summaryData.releases.byRegion[release.region]===undefined ){ summaryData.releases.byRegion[release.region]=0; }
		summaryData.releases.byRegion[release.region]++;
		// Year
		let year = parseInt(release.releaseDate.match(/\d{2}$|\d{4}/g));
		if(isNaN(year)){
			year = null
		}else if(year<100){
			if(year<50){
				year += 2000
			}else{
				year += 1900
			}
		}
		if( summaryData.releases.byYear[year]===undefined ){ summaryData.releases.byYear[year]=0; }
		summaryData.releases.byYear[year]++;
		// Publisher
		if( summaryData.releases.byPublisher[release.publisher]===undefined ){ summaryData.releases.byPublisher[release.publisher]=0; }
		summaryData.releases.byPublisher[release.publisher]++;
		// Rating
		if( summaryData.releases.byRating[release.rating]===undefined ){ summaryData.releases.byRating[release.rating]=0; }
		summaryData.releases.byRating[release.rating]++;
	})

	// Get developer
	let developer = titles[gameFAQsId].titleDetail.developer;
	if(developer===undefined){
		developer = titles[gameFAQsId].titleDetail['developer/publisher'];
	}
	if( summaryData.byDevelopers[developer]===undefined ){ summaryData.byDevelopers[developer]=0; }
	summaryData.byDevelopers[developer]++;

	// Get Genre
	let genre = titles[gameFAQsId].titleDetail.genre.split('>')[0].trim();
	if( summaryData.byTopGenre[genre]===undefined ){ summaryData.byTopGenre[genre]=0; }
	summaryData.byTopGenre[genre]++;

	// Handle metacritic score
	let score = titles[gameFAQsId].metacriticScore
	if( summaryData.byMetacriticScore[score]===undefined ){ summaryData.byMetacriticScore[score]=0; }
	summaryData.byMetacriticScore[score]++;

	// franchise
	let franchise = titles[gameFAQsId].titleDetail.franchise
	if( summaryData.byFranchise[franchise]===undefined ){ summaryData.byFranchise[franchise]=0; }
	summaryData.byFranchise[franchise]++;

	// esrb descriptors
	let descriptors = titles[gameFAQsId].titleDetail.esrbDescriptors
	if(descriptors!==undefined){
		descriptors = descriptors.split(', ')
		descriptors.forEach((descriptor)=>{
			if( summaryData.byEsrbDescriptors[descriptor]===undefined ){ summaryData.byEsrbDescriptors[descriptor]=0; }
			summaryData.byEsrbDescriptors[descriptor]++;
		})
	}

	// local players
	let players = titles[gameFAQsId].titleDetail.localPlayers
	if( summaryData.byLocalPlayers[players]===undefined ){ summaryData.byLocalPlayers[players]=0; }
	summaryData.byLocalPlayers[players]++;

	// Games You May Like Summary
	Object.keys(titles[gameFAQsId].gamesYouMayLike).forEach((likedGameFAQsId)=>{
		let game = titles[gameFAQsId].gamesYouMayLike[likedGameFAQsId]
		if( summaryData.mostGamesYouMayLike[game]===undefined ){ summaryData.mostGamesYouMayLike[game]=0; }
		summaryData.mostGamesYouMayLike[game]++;

	});
})

// Now we can take that summary and generate a text file
console.log('Generating summary output.')
let output = `Summary of ${argv._[0]}

Found ${summaryData.uniqueEntries.toLocaleString()} titles accross ${summaryData.uniqueReleases.toLocaleString()} releases.

`;

// Breakdown by region
let byRegionSorted = Object.fromEntries(
	Object.entries(summaryData.releases.byRegion).sort(([,a],[,b]) => b-a)
);
output += `Releases by region`+"\n"+makeSimpleChart(byRegionSorted)+"\n\n"

// Breakdown by release year
let byReleaseYear = Object.fromEntries(
	Object.entries(summaryData.releases.byYear).sort(([,a],[,b]) => b-a)
);
delete byReleaseYear.null
output += `Releases by Year`+"\n"+makeSimpleChart(byReleaseYear,'And '+summaryData.releases.byYear.null+' releases without dates.')+"\n\n";

// List top publishers and developers
output += listTopRows('Most prolific publishers; ',summaryData.releases.byPublisher,5)+"\n\n";
let byDevelopers = summaryData.byDevelopers;
delete byDevelopers.undefined;
delete byDevelopers.Various;
output += listTopRows('Most prolific developers; ',summaryData.byDevelopers,5)+"\n\n";

// Top Genres
output += listTopRows('Most prolific genres; ',summaryData.byTopGenre,3)+"\n\n";

// Metacritic Scores
let byMetacritic = Object.fromEntries(
	Object.entries(summaryData.byMetacriticScore).sort(([,a],[,b]) => b-a)
);
delete byMetacritic.null
output += `Metacritic Score Breakdown`+"\n"+makeSimpleChart(byMetacritic,'And '+summaryData.byMetacriticScore.null.toLocaleString()+' releases without metacritic scores.')+"\n\n"

// Franchise representation
let byFranchise = Object.fromEntries(
	Object.entries(summaryData.byFranchise).sort(([,a],[,b]) => b-a)
);
delete byFranchise.undefined
output += listTopRows('Most represented franchises; ',byFranchise,2)+"\n\n";

// Esrb Descriptors
let byEsrbDescriptors = Object.fromEntries(
	Object.entries(summaryData.byEsrbDescriptors).sort(([,a],[,b]) => b-a)
);
delete byEsrbDescriptors['No Descriptors']
output += listTopRows('Most common ESRB descriptors; ',byEsrbDescriptors,3)+"\n\n";

// local player count
let localPlayersCleaned = {};
Object.keys(summaryData.byLocalPlayers).forEach((key)=>{
	localPlayersCleaned[key.replace(' or more','+').replace(/.*(\d+\+?) (Players?).+/,'$1 $2')] = summaryData.byLocalPlayers[key]
})
delete localPlayersCleaned.undefined
let localPlayers = Object.fromEntries(
	Object.entries(localPlayersCleaned).sort(([a,],[b,]) => {
		return parseInt(a.replace(/[^\d+]/,''))-parseInt(b.replace(/[^\d+]/,''))
	})
);
output += `Player Count Breakdown`+"\n"+makeSimpleChart(localPlayers,'And '+summaryData.byLocalPlayers.undefined.toLocaleString()+' titles without local player data.')+"\n\n"

// I guess now we can save
let saveTo = argv._[0].replace('.json','_summary.txt');
console.log('Saving summery to',saveTo);
fs.writeFileSync(saveTo,output);
console.log('Done.');
process.exit(0);

/*
	Helper functions to make the output easier
*/

function makeSimpleChart(sorted,alignedNote){
	// Generate a list of formatted keys, tracking longest key and highest value
	let longestKey = 0;
	let highestValue = 0;
	let niceKeys = [];
	Object.keys(sorted).forEach((key)=>{
		let formattedKey = key+' ('+sorted[key].toLocaleString()+') ';
		longestKey = Math.max(longestKey,formattedKey.length)
		highestValue = Math.max(highestValue,sorted[key])
		niceKeys.push(formattedKey)
	})
	let maximumBarLength = maximum_output_width-longestKey;

	// Start building out the chart
	let output = [];
	Object.keys(sorted).forEach((key,index)=>{
		let thisLineFullBars = (sorted[key]/highestValue)*maximumBarLength;
		let thisLineFullCap = bar_parts[7-Math.round(((((sorted[key]/highestValue)*maximumBarLength)%1)*100)/(100/7))];
		let thisLine = niceKeys[index].padStart(longestKey,' ')+(bar_parts[0].repeat(thisLineFullBars))+thisLineFullCap;
		output.push(thisLine)
	})

	// add the note
	if(alignedNote!==undefined){
		output.push(''.padStart(longestKey,' ')+alignedNote)
	}

	return output.join("\n")
}

function listTopRows(label,obj,rows){

	// Sort the object
	let objSorted = Object.fromEntries(
		Object.entries(obj).sort(([,a],[,b]) => b-a)
	);

	// Create a place where we can store the generated list
	let output = [label];
	let outputLine = 0;

	// Loop through the object
	let keys = Object.keys(objSorted);
	for(let i=0; i<keys.length; i++){
		let thisEntry = keys[i]+' ('+objSorted[keys[i]].toLocaleString()+'), ';

		// Check if there is room on this line
		if(output[outputLine].length+thisEntry.length > maximum_output_width){
			if(outputLine<rows-1){
				outputLine++;
				output[outputLine] = '';
			}else{ // must be done were out of lines
				i += keys.length
			}
		}

		// add the line
		output[outputLine] += thisEntry;
	}

	// remove the trailing , and replace it with a . then output
	output[output.length-1] = output[output.length-1].substr(0,output[output.length-1].length-2)+'.'
	return output.join("\n")
}