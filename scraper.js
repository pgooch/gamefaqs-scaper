// For the CLI
const clear    = require('clear');
const chalk    = require('chalk');
const argv     = require('minimist')(process.argv.slice(2));
const ora      = require('ora');

// For the scraping work
const fetch     = require('node-fetch');
const cheerio   = require('cheerio')
const camelCase = require('camelcase');
const fs        = require('fs');

// Variables that will be needed later
let saveTo = './no-save-location-provided.json';
let masterList = {};
let masterIdList = new Set(); // This array stores every title we have found so far, prevents scraping the same game multiple times because it has a different regional name.
let scrapeURL = ['https://gamefaqs.gamespot.com/',null,'/category/999-all','?page=',0]; // null replace in beginScrape, page incremented as we go
let pages = -1;
const resultsPerPage = 100; // This is not something apparently customizable, it is only used for the progress bar.

// Prepare the spinner for when it is needed
const spinner = ora('');

module.exports.beginScrape = (platform,saveLocation) => {
	// Update the scrape URL with the platform chunk and save location provided
	scrapeURL[1] = platform;
	saveTo = saveLocation;

	// Give the user some feedback
	console.log(chalk.cyan('Scraping titles, entry point: ')+scrapeURL.slice(0,3).join(''));
	spinner.start();

	// Call the function that will actually be doing the bulk of the work
	scrapePage();
}

// The handles the "all categories / all games" pages, not individual titles.
scrapePage = async() => {
	updateScrapeMessage();
	fetch(scrapeURL.join(''),{}).then((response)=>{
	  return response.text();
	}).then(async(page)=>{
		const $ = cheerio.load(page)
		// If this is the first page then grab some details for better messages
		if(pages<0){
		 	pages = parseInt($('.paginate > li:first-child').text().split(' ').reverse()[0]);
		 	if(isNaN(pages)){ pages = 1; }// There is no pagination on platforms without pages
  			updateScrapeMessage();
		}
		// The links contain both the title we are looking for and the
		let titles = $('.results .rtitle a');
		for(let i=0; i<titles.length; i++){
		 	// Check if this titels ID is already in the list
		 	let titleId = parseInt(titles[i].attribs.href.match(/.*\/(\d+).*/)[1]);
		 	if(masterIdList.has(titleId)){
		 		spinner.text = 'Skipping '+titles[i].children[0].data+', already scraped'
		 	}else{
		  	spinner.text = titles[i].children[0].data;
		 		await scrapeTitle(scrapeURL[0]+titles[i].attribs.href.substr(1)+'/data');
		 	}
		}
		// Now that we are done with this page we can go onto the next or save if it was the last one
		if(scrapeURL[4]==pages-1){
			spinner.succeed(`Complete! Scraped ${masterList.length} titles.`)
			fs.writeFileSync(saveTo,JSON.stringify(masterList, null, 2));
			console.log('Scraped data saved to: '+saveTo);
			process.exit(0);
		}else{
			scrapeURL[4]++;
			scrapePage();
		}
	})
}

// This is a helper function that will format and update the spinner message as requested
updateScrapeMessage = () => {
	if(pages < 0){
		spinner.prefixText = `Scraping first page`
	}else{
		spinner.prefixText = `Scraping page ${scrapeURL[4]+1} of ${pages}`
	}
}

// This will scrape a single title page (presuming it's sent one) and grab everything thats not nailed down.
scrapeTitle = async(url) => {
	// Determin the GameFAQs ID from the provided URL and see if we have an entry for it
	const gameFAQsID = url.match(/.*\/(\d+).*/)[1];
	if(masterList[gameFAQsID]!==undefined){
		return false; // if we have it skip it, no need for unecessary calls
	}else{
		masterList[gameFAQsID] = {gameFaqsId:parseInt(gameFAQsID),releaseData:[]}
	}

	// Load the page and get it ready for parsing
	let response = await fetch(url,{});
	let page = await response.text();
	const $ = cheerio.load(page)

	// We re-use this variable throught the scraping process
	let workingData = {};

	// Start filling it with data, starting with the release data
	let releaseData = $('.pod_titledata').next().find('tbody tr');
	for(let i=0; i<releaseData.length; i+=2){
		workingData = {
			title:       $(releaseData[i]).find('.ctitle').text(),
			region:      $(releaseData[i+1]).find('.cregion').text(),
			publisher:   $(releaseData[i+1]).find('.datacompany').text(),
			productID:   $(releaseData[i+1]).find('.datapid')[0].children[0].data,
			UPC:         $(releaseData[i+1]).find('.datapid')[1].children[0].data,
			releaseDate: $(releaseData[i+1]).find('.cdate').text(),
			rating:      $(releaseData[i+1]).find('.datarating').text(),
		}
		// Clean it and save it and reset the working data for the next entry
		masterList[gameFAQsID].releaseData.push(dataCleaner(workingData))
		workingData = {};
	}

	// Description
	masterList[gameFAQsID].description = $('.game_desc').text().trim();

	// Game Detail  and Title Data data (some information repeated, Game Details is pulled first since Genre comes out better formatted in the title data)
	let gameDetails = $('.pod_gameinfo_left ul li');;
	for(let i=0; i<gameDetails.length; i++){
		workingData[$(gameDetails[i]).find('b').text()] = $(gameDetails[i]).find(':not(b)').text();//.children[0].data;
	}
	let titleData = $('.pod_titledata .body dl > *');
	for(let i=0; i<titleData.length; i+=2){
		workingData[$(titleData[i]).text()] = $(titleData[i+1]).text();//.children[0].data;
	}
	masterList[gameFAQsID].titleDetail = dataCleaner(workingData);
	workingData = {};

	// The metacritic score (if there is one)
	if($('.metacritic .score').text()===""){
		masterList[gameFAQsID].metacriticScore = null
	}else{
		masterList[gameFAQsID].metacriticScore = parseInt($('.metacritic .score').text())
	}
	
	// The single bit of game trivia that shows
	masterList[gameFAQsID].trivia = $('p.trivia').text().trim() == "" ? null : $('p.trivia').text().trim()

	// Games you may like
	let youMayLikeData = $('.pod_related a');
	for(let i=0; i<youMayLikeData.length; i++){
		workingData[$(youMayLikeData[i])[0].attribs.href.match(/.*\/(\d+).*/)[1]] = $(youMayLikeData[i]).find('h3').text();
	}
	masterList[gameFAQsID].gamesYouMayLike = dataCleaner(workingData);

	// Before we leave this and move on to the next title lets add the title to the set so we can potentially skip items next time
	masterIdList.add(masterList[gameFAQsID].gameFaqsId);
}

// This cleans objects data and keys and returns it, used mostly to trim whitespace and make empty fields null
dataCleaner = (dataToClean) => {
	let cleanedData = {};
	Object.keys(dataToClean).forEach((key)=>{
		let cleanedKey = camelCase(key.trim().replace(/[()]/g,'').replace(/:$/g,'')); // Remove ()'s and any trailing : from the key
		let cleanedValue = dataToClean[key].trim()
		if(cleanedValue===''){
			cleanedValue = null
		}
		cleanedData[cleanedKey] = cleanedValue
	})
	return cleanedData;
}
