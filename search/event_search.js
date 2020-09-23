const fetch = require('node-fetch');

async function event_searcher(city, page = 1) {
    let url = new URL('https://kudago.com/public-api/v1.2/events/');
    url.search = new URLSearchParams({
        lang: 'ru',
        location: city,
        fields: 'id,images,title,price,description,tags',
        actual_since: Date.now() / 1000,
        actual_until: Date.now() / 1000 + 604800, // + неделя
        page_size: 5,
        page: page,
    });

    const res = await fetch(url).then(res => res.json()).catch(err => console.log("ERROR", err));

    return res;
}

async function cinema_searcher(city, page = 1) {
    let url = new URL('https://kudago.com/public-api/v1.2/movies/');
    url.search = new URLSearchParams({
        lang: 'ru',
        location: city,
        fields: 'id,title,description,genres,year,stars,director,imdb_url,images',
        actual_since: Date.now() / 1000,
        actual_until: Date.now() / 1000 + 604800, // + неделя
        page_size: 5,
        page: page,
    });

    const res = await fetch(url).then(res => res.json()).catch(err => console.log("ERROR", err));

    return res;
}

async function walk_searcher(city, page = 1) {
    let url = new URL('https://kudago.com/public-api/v1.4/places/');
    url.search = new URLSearchParams({
        lang: 'ru',
        location: city,
        fields: 'id,title,short_title,address,description,foreign_url,images,phone,tags',
        categories: 'sights,prirodnyj-zapovednik,photo-places,park,palace,homesteads,fountain,dogs,attractions,animal-shelters',
        page_size: 5,
        page: page,
    });

    const res = await fetch(url).then(res => res.json()).catch(err => console.log("ERROR", err));

    return res;
}

async function restaurants_search(city, page = 1) {
    let url = new URL('https://kudago.com/public-api/v1.4/places/');
    url.search = new URLSearchParams({
        lang: 'ru',
        location: city,
        fields: 'id,title,short_title,address,description,foreign_url,images,phone,tags',
        categories: 'restaurants,bar,anticafe,brewery',
        page_size: 5,
        page: page,
    });

    const res = await fetch(url).then(res => res.json()).catch(err => console.log("ERROR", err));

    return res;
}

module.exports = {event_searcher, cinema_searcher, walk_searcher, restaurants_search}