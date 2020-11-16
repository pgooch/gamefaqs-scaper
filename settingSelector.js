const inquirer = require('inquirer');
const ora      = require('ora');
const chalk    = require('chalk');
const fetch    = require('node-fetch');
const cheerio  = require('cheerio')

let platforms = [];
let selectedPlatform = '';

module.exports.settingsSelector = async() => {
  console.log(chalk.cyan('You can pass a platforms short name, found in the GameFAQs URI, with the -p argument and a save location with the -s argument to skip this step.'))
  const spinner = ora('Loading a list of platforms, one moment.').start();
  
  // Load the list of platforms from the all platforms page
  let response = await fetch('https://gamefaqs.gamespot.com/games/systems',{});
  let page = await response.text();

  // Scrape the platforms from the page and store lsthem for inquirers use
  const $ = cheerio.load(page)
  $('.main_content .pod .foot a').each((index, el)=>{
    platforms.push({
      name: el.children[0].data,
      value: el.attribs.href.substr(1),
    })
  })
  // Lets sort that list
  platforms.sort((a,b)=>{
    if(a.name.toUpperCase() < b.name.toUpperCase()){ return -1; }
    if(a.name.toUpperCase() > b.name.toUpperCase()){ return 1;  }
    return 0;
  })

  // Stop the spinner call the platform selector
  spinner.succeed(`Found ${platforms.length} platforms to chose from.`);
  let answer = await inquirer.prompt([{
    type: 'list',
    loop: false,
    name: 'platform',
    message: "Select a Platform.",
    choices: platforms,
  },{
    type: 'string',
    name: 'saveLocation',
    message: "Where would you like to save?",
    default: (ans) => {
      let date = new Date();
      return `./gamefaqs_${ans.platform}_scrape_${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.json`
    },
  }])
  return answer;
}
