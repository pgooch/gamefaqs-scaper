const clear    = require('clear');
const chalk    = require('chalk');
const argv     = require('minimist')(process.argv.slice(2));

// Created just for this project
const { settingsSelector } = require('./settingSelector');
const { beginScrape } = require('./scraper');

// Prepare some things some of which may be needed later
let platform = '';
let saveLocation = '';

// When using npm run dev it sets a special argument that triggers these to be used
if(argv.usedevelopersplatform!==undefined){
  platform = 'n64';
  saveLocation = `./gamefaqs_${platform}_scrape_${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.json`;
}

// Try to load the parameters into the working variables (if we aren't in dev mode).
if(platform==='' && argv.p != undefined){
  platform = argv.p;
}
if(saveLocation==='' && argv.s != undefined){
  saveLocation = argv.s;
}

// We are officially ready to start
clear();
console.log(chalk.cyan.bold('GameFAQs Scraper'))

// If we don't have a platform lets get one by scraping the site for a list of available ones.
if(platform == ''){
  (async () => {
    settings = await settingsSelector();
    beginScrape(settings.platform,settings.saveLocation);
  })();
}else{
  beginScrape(platform,saveLocation);
}
