# GameFAQs List Scraper

This script will rip a complete list of titles from a specified platform from GameFAQs. This was created to ensure I have a list of every game, without needless regional duplicates, for an everdrive, but there's sure to be other use as well.

## Running the scrapper
The first thing your going to need to do is install all dependencies with `npm install`, then once that is complete the simplest way to to navigate into the repo directory and run 
```
npm start
```
It will gather a list of platforms from the site and ask you where you would like to save it. 

If your automating something you can run this in a non-interactive mode by passing the platform short name (found in the GameFAQs url, i.e. gamespot.com/**nes**/563433-the-legend-of-zelda) and a save location with the -p and -s arguments respectively
```
node index.js -p nes -s all-nes-games.json
```
Running the scrip will take some time, as it scrapes in a strictly linear fashion to avoid flooding their servers with requests.

## The output
Data is saves in a large JSON array. Below is a theoretically complete listing. Most listings are missing data on some field. Missing fields _should_ be null or an empty array.

```
...
  "563433": {
    "gameFaqsId": 563433,
    "releaseData": [
      {
        "title": "The Legend of Zelda",
        "region": "US",
        "publisher": "Nintendo",
        "productId": "NES-ZL-USA",
        "upc": "045496630324",
        "releaseDate": "08/22/87",
        "rating": null // Predates ESRB ratings
      },
	  ...
    ],
    "description": "Welcome to the Legend of Zelda. Where the only sound you'll hear is your own heart pounding as you race through forests, lakes, mountains and dungeonous mazes in an attempt to restore peace to the land of Hyrule. Along the way you'll be challenged by Tektites, Wizzrobes and an endless array of ruthless creatures who'll stop at nothing to prevent you from finding the lost fragments of the Triforce of Wisdom. But don't despair. With a little luck and a lot of courage, you'll conquer your adversaries, unite the Triforce fragments and unravel the mystery of the Legend of Zelda.",
    "titleDetail": {
      "platform": "NES",
      "genre": "Action Adventure > Open-World",
      "developer/publisher": "Nintendo",
      "release": "August 22, 1987",
      "alsoKnownAs": "Zelda no Densetsu 1: The Hyrule Fantasy (JP), Zelda no Densetsu 1 (JP), A Lenda de Zelda (SA)",
      "franchise": "Legend of Zelda",
      "developer": "Nintendo",
      "esrbDescriptors": "Mild Fantasy Violence",
      "localPlayers": "1 Player",
      "wikipediaEn": "https://en.wikipedia.org/wiki/The_Legend_of_Zelda_(1986_video_game)"
    },
    "metacriticScore": null, // a numeric value, mostly only on new releases
    "trivia": "Your money or your life.",
    "gamesYouMayLike": { // These are the suggestions GameFAQs makes
      "519689": "Metroid",
      "587144": "Blaster Master",
      "587179": "Castlevania II: Simon's Quest",
      "587219": "Deadly Towers",
      "587594": "Rygar"
    }
  },

...
```
The data should be easy to work with and contains pretty much everything that is found on the "Data" page of a game with the exception of the price on Amazon. This is ommited because it is not in the back source, it loads in later via a javascript and that seemed like more effort than it was worth considering what I wanted this for.

## post-processors
The post-processors directory contains some scripts that will use the data created by the scraper. These are mostly for testing and to achieve the goals I had, but they will also work as a good jumping off point for working with the data yourself.

All post processors run in the same way;
```
node processorName.js path/to/scrape-file.json
```
Drag and drop is your friend here. The generated files will be saved next to the source file with a different name. 

### singleList
Generated a CSV with every game only listed one based on release order and regional preference. What this means is that if a game was released under 3 different names in 3 different regions it will only show on this list one, in the most preferred regions name.

### summary
This generates a simple text doc summarizing the data in the json file as well as listing out the tops in various fields. Used to check the sanity of the data. Don't let modern releases on old platforms fool you, people are still making things for them.