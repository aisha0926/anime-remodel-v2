require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const https = require("https")
const ejs = require('ejs');
const _ = require('lodash');
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const port = 8000;

//Callbacks are bad. Refrain from using them if at all possible
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_ATLAS, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const animeSchema = new mongoose.Schema({
    name: String
});

const Anime = mongoose.model("Anime", animeSchema);

const userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    dob: String,
    list: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Anime'
    }]
});

const User = mongoose.model("User", userSchema);

var watchListArray = [];

var userName = "";

//Middleware. Gets called before request, good for validation
const checkUser = async (req, res, next) => {
    //If you have a username then. Populate = Getting the list of the user.
    //User has a reference of the anime ID, and populate GETS the document that's attached to that user.
    //So populate is doing something like anime.findOne({_id: objectId}) then replacing the objectId in the list with the found document
    const user = await User.findOne({ username: userName }).populate('list');

    if (!user) return res.redirect('/credentials/login');

    const namesArr = user.list.map(anime => anime.name);
    //Works the same as unshift. Takes the entire array and reverses the order
    watchListArray = namesArr.reverse();
    //next() - Goes to the next function
    //"cannot set headers to the client after they're sent" - Tried to give multiple responses to the user/client
    return next();
};

app.get("/", checkUser, (req, res) => {
    const animeUrl = ['https://api.jikan.moe/v3/top/anime/1/tv', 'https://api.jikan.moe/v3/top/manga/1/manhwa'];

    https.get(animeUrl[0], (response) => {
        var text = '';

        response.on('data', (data) => {
            text += data;
        });

        response.on('end', () => {
            let parsingData = JSON.parse(text);

            https.get(animeUrl[1], (response) => {
                var text = '';
                response.on('data', (data) => {
                    text += data;
                });

                response.on('end', () => {
                    let url2Data = JSON.parse(text);
                    parsingData["top2"] = url2Data;

                    console.log(watchListArray);

                    return res.render("home", {
                        data: parsingData, data2: parsingData["top2"],
                        breadcrumbs: [],
                        animeList: watchListArray, user: userName
                    });
                });
            });
        });
    })
});

app.post("/", (req, res) => {
    console.log(req.body);
    const query = _.lowerCase(req.body.searchbar);
    const url = 'https://api.jikan.moe/v3/search/anime?q=' + query + '&page=1'
    const startDate = [];
    const endDate = [];

    https.get(url, (response) => {
        var text = '';
        response.on('data', (data) => {
            text += data;
        });

        response.on('end', () => {
            const parseData = JSON.parse(text);
            for (let i = 0; i < parseData.results.length; i++) {
                var date = new Date(parseData.results[i].start_date);
                console.log(date.toDateString());
                var endDateParse = new Date(parseData.results[i].end_date);
                if (date !== null && endDateParse !== null) {
                    startDate.push(date.toDateString());
                    endDate.push(endDateParse.toDateString());
                } else {
                    startDate.push("N/A");
                    endDate.push("N/A");
                }
            }

            return res.render("results", {
                data: parseData, genre: false, seasons: false,
                tabName: query, genreContent: true, startingDate: startDate, endingDate: endDate,
                animeList: watchListArray, user: userName
            });
        });
    })
});

app.get("/anime", checkUser, (req, res) => {
    const url = 'https://api.jikan.moe/v3/top/anime/1/tv';

    https.get(url, (response) => {
        var text = '';
        response.on('data', (data) => {
            text += data;
        });

        response.on('end', () => {
            let parsingData = JSON.parse(text);
            console.log(watchListArray);

            return res.render("top", {
                data: parsingData, page: 1, tabName:
                    'Top Anime', genre: false, seasons: false, genreContent: false
                , seasonYear: '', seasonName: '', category: 'tv',
                breadcrumbs: [{ name: 'Home', route: '/' }, { name: 'Anime', route: '/anime' }],
                animeList: watchListArray, user: userName
            });
        });
    })
});

app.get("/anime/:page/:topCategory/:tabName", checkUser, (req, res) => {
    const page = req.params.page;
    const category = req.params.topCategory;
    const tabName = req.params.tabName;

    const url = 'https://api.jikan.moe/v3/top/anime/' + page + '/' + category;

    https.get(url, (response) => {
        var text = '';
        response.on('data', (data) => {
            text += data;
        });

        response.on('end', () => {
            let parsingData = JSON.parse(text);

            let breadcrumbs = [{ name: 'Home', route: '/' }, { name: 'Anime', route: '/anime' }];
            if (tabName)
                breadcrumbs.push({ name: tabName, route: '' })

            return res.render("top", {
                data: parsingData, page: parseInt(page), category: category,
                tabName: tabName, genre: false, seasons: false,
                genreContent: false, seasonYear: '',
                seasonName: '',
                breadcrumbs: breadcrumbs,
                animeList: watchListArray, user: userName
            });
        });
    })
});

async function genreRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            var data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data)
            });
        })
    });
}

app.get("/genre", async (req, res) => {
    let receivedData = [];
    for (let i = 1; i <= 43; i++) {
        // const url = "https://api.jikan.moe/v3/genre/anime/" + i + "/1";
        const url = "https://api.jikan.moe/v3/genre/manga/" + i + "/1";

        var is_valid = false;
        while (is_valid == false) {
            try {
                // Variable that will receive the data
                let receiveData = await genreRequest(url);
                var stop = new Date().getTime();
                while (new Date().getTime() < stop + 500) {
                    ;
                }

                let parseData = JSON.parse(receiveData);
                var test = '';
                test += parseData.mal_url.name;

                if (parseData && parseData.mal_url && parseData.mal_url.hasOwnProperty('name')) {
                    let replaceMalName = test.replace("Anime", "");
                    // console.log(replaceMalName);
                    receivedData.push({ mal_id: parseData.mal_url.mal_id, mal_name: replaceMalName, mal_count: parseData.item_count });
                    is_valid = true;
                    console.log(receivedData);
                } else {
                    console.log("ELSE STATEMENT");
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    res.render("genre", {
        data: receivedData,
        animeList: watchListArray
    });
});

app.get("/genre2", checkUser, (req, res) => {
    const genre = ["", 'Action', 'Adventure', 'Cars', 'Comedy', 'Dementia', 'Demons', 'Mystery', 'Drama',
        'Ecchi', 'Fantasy', 'Game', 'Hentai', 'Historical', 'Horror', 'Kids',
        'Magic', 'Martial Arts', 'Mecha', 'Music', 'Parody', 'Samurai', 'Romance', 'School', 'Sci-Fi', 'Shoujo',
        'Shoujo Ai', 'Shounen', 'Shounen Ai', 'Space', 'Sports', 'Super Power', 'Vampire', 'Yaoi', 'Yuri',
        'Harem', 'Slice of life', 'Supernatural', 'Military',
        'Police', 'Psychological', 'Thriller', 'Seinen',
        'Josei']

    const manga = ["", 'Action', 'Adventure', 'Cars', 'Comedy', 'Dementia', 'Demons', 'Mystery', 'Drama',
        'Ecchi', 'Fantasy', 'Game', 'Hentai', 'Historical', 'Horror', 'Kids',
        'Magic', 'Martial Arts', 'Mecha', 'Music', 'Parody', 'Samurai', 'Romance', 'School', 'Sci-Fi', 'Shoujo',
        'Shoujo Ai', 'Shounen', 'Shounen Ai', 'Space', 'Sports', 'Super Power', 'Vampire', 'Yaoi', 'Yuri',
        'Harem', 'Slice of life', 'Supernatural', 'Military',
        'Police', 'Psychological', 'Thriller', 'Seinen',
        'Josei']


    let breadcrumbs = [{ name: 'Home', route: '/' }, { name: 'Genre', route: '/genre2', user: userName }];

    return res.render("genre", {
        data: genre, manga: manga, breadcrumbs: breadcrumbs,
        animeList: watchListArray, user: userName
    });
});

app.get("/genre/:type/:genreID", checkUser, (req, res) => {
    const type = req.params.type;
    console.log(type);
    const genreID = req.params.genreID;
    const url = "https://api.jikan.moe/v3/genre/" + type + "/" + genreID + "/1";

    https.get(url, (response) => {
        var text = '';
        response.on('data', (data) => {
            text += data;
        });

        response.on('end', () => {
            const parsingData = JSON.parse(text);
            var test = '';
            test += parsingData.mal_url.name;
            // console.log(parsingData);
            let replaceMalName = test.replace("Anime", "");
            let breadcrumbs = [{ name: 'Home', route: '/' }, { name: 'Genre', route: '/genre2' }];
            if (type)
                breadcrumbs.push({ name: replaceMalName, route: '' })
            // console.log(parsingData);
            return res.render('genreContent', {
                data: parsingData,
                tabName: replaceMalName, genre: false,
                seasons: false, genreContent: true, seasonYear: '',
                seasonName: '',
                breadcrumbs: breadcrumbs,
                animeList: watchListArray, user: userName
            });
        });
    });
});

app.get("/seasons", checkUser, (req, res) => {
    let day = date();

    const season = day.slice(0, 1).toUpperCase();
    const remaining = day.slice(1, day.length).toLowerCase();

    const url = 'https://api.jikan.moe/v3/season/2021/' + day;

    https.get(url, (response) => {
        var text = '';
        response.on('data', (data) => {
            text += data;
        });

        response.on('end', () => {
            const parseData = JSON.parse(text);
            let breadcrumbs = [{ name: 'Home', route: '/' }, { name: 'Seasons', route: '' }];

            return res.render("genreContent", {
                data: parseData, genre: false,
                tabName: season + remaining, seasons: true,
                seasonYear: 2021, seasonName: day,
                breadcrumbs: breadcrumbs,
                animeList: watchListArray, user: userName
            });
        });
    });
});

app.get("/seasons/:season/:year", checkUser, (req, res) => {
    const season = req.params.season;
    const year = req.params.year;
    const fullUrl = 'https://api.jikan.moe/v3/season/' + year + '/' + season;

    https.get(fullUrl, (response) => {
        var text = '';
        response.on('data', (data) => {
            text += data;
        });
        response.on('end', () => {
            const tabName = season.slice(0, 1).toUpperCase() + season.slice(1, season.length).toLowerCase();
            const parseData = JSON.parse(text);

            let breadcrumbs = [{ name: 'Home', route: '/' }, { name: 'Seasons', route: '/seasons' }];
            if (tabName)
                breadcrumbs.push({ name: tabName, route: '' })

            return res.render('genreContent', {
                data: parseData,
                genre: false,
                tabName: tabName,
                seasons: true,
                seasonName: season,
                seasonYear: year,
                breadcrumbs: breadcrumbs,
                animeList: watchListArray, user: userName
            });
        });
    });
});

app.get("/schedule/:day", checkUser, (req, res) => {
    const getDay = req.params.day;
    const url = 'https://api.jikan.moe/v3/schedule/' + getDay;

    https.get(url, (response) => {
        var data = '';
        response.on('data', (chunks) => {
            data += chunks;
        });

        response.on('end', () => {
            const parseData = JSON.parse(data);
            var dayData = "";

            switch (getDay) {
                case 'monday':
                    dayData = parseData.monday;
                    break;
                case 'tuesday':
                    dayData = parseData.tuesday;
                    break;
                case 'wednesday':
                    dayData = parseData.wednesday;
                    break;
                case 'thursday':
                    dayData = parseData.thursday;
                    break;
                case 'friday':
                    dayData = parseData.friday;
                    break;
                case 'saturday':
                    dayData = parseData.saturday;
                    break;
                case 'sunday':
                    dayData = parseData.sunday;
                    break;
                default:
                    dayData = 'Error';
                    break;
            }
            let breadcrumbs = [{ name: 'Home', route: '/' }, { name: 'Seasons', route: '/seasons' }];
            if (getDay)
                breadcrumbs.push({ name: getDay, route: '' })

            return res.render('genreContent', {
                data: dayData,
                genre: false,
                tabName: getDay.slice(0, 1).toUpperCase() + getDay.slice(1, getDay.length).toLowerCase(),
                seasons: true,
                seasonName: '',
                seasonYear: '',
                breadcrumbs: breadcrumbs,
                animeList: watchListArray, user: userName
            });
        });
    });

});

/*
    1. Display list based on username
        1. Verify username - Display at the top? Then check if name at the top
                            exists in db? If it exists then find all lists
                            associated with the name?
*/
app.post("/animelist", checkUser, async (req, res) => {
    const animeName = req.body.animeList;
    let path = req.body.urlPath;

    const anime = await Anime.create({
        name: animeName
    });

    //Passing reference of the document. Updating the user list and pushing a reference the new item created
    User.findOneAndUpdate({ username: userName }, { $push: { list: anime } }, { new: true })
        .then(response => console.log(response));

    return res.redirect(path);
});

app.get("/credentials/:type", (req, res) => {
    const type = req.params.type;

    return res.render('credentials', {
        genre: false,
        seasons: true,
        type: type,
        success: false, user: ""
    });
});

app.post("/credentials/:type", (req, res) => {
    const type = req.params.type;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const dob = req.body.dob;

    //Find if username exists already first
    //If it doesn't exist, enter new entrty
    if (type !== "login") {
        User.findOne({ username: username }, (err, results) => {
            if (!results) {
                if (password.length < 2 | password.length > 16) {
                    console.log("Password length " + password.length);
                    return res.render("credentials", {
                        type: type, success: true, user: "",
                        error: "Password cannot be less than 2 and more than 16 characters"
                    });
                } else {
                    const user = new User({
                        email: email,
                        username: username,
                        password: password,
                        dob: dob
                    });
                    // console.log(results.username);
                    // userName = results.username;
                    user.save();
                    return res.redirect("/credentials/login");
                }
            } else
                return res.render("credentials", { type: "login", success: true, user: results.username, error: "" });
        });
    } else {
        User.findOne({ username: username, password: password }, (err, results) => {
            console.log(results);
            //One liner if statement can be clamped into 1. Better code syntax
            if (!results) {
                return res.render('credentials', {
                    genre: false,
                    seasons: true,
                    type: type,
                    success: true, user: "", error: "User doesn't exist, please sign up!"
                });
            } else {
                userName = results.username;
                return res.redirect("/");
            }
        });
    }
});

app.get("/logout", (req, res) => {
    userName = "";
    res.redirect("/credentials/login");
});

app.get("/about", (req, res) => {
    return res.render("about", { user: userName });
});


app.listen(process.env.PORT || port, function () {
    console.log("Listening to " + port);
});