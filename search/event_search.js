const fetch = require('node-fetch');
const { rejects } = require('assert');

async function event_searcher(by, query, filters) {
    let url = new URL('https://kudago.com/public-api/v1.2/events/');
    url.search = new URLSearchParams({
        location: filters.city,
        fields: 'images,title,id,price,description,tags',
        is_free: filters.free,
        categories: by,
        actual_since: Date.now() / 1000,
        actual_until: Date.now() / 1000 + 604800, // + неделя
    });

    const res = await fetch(url).then(res => res.json()).catch(err => console.log("ERROR", err));
    const data = res.results.filter((item) => item.title.toLowerCase().indexOf(query.toLowerCase()) != -1);

    return data;
}

function categories_searcher() {
    let url = new URL('https://kudago.com/public-api/v1.2/event-categories/?lang=ru');
    fetch(url).then((response) => response.json()).then((res) => {
        console.log(res);
    }).catch((err) => console.log("ERROR", err));

}


// console.log(event_searcher(by='', query='илон', filters={city: 'msk', free: false}));
module.exports = {event_searcher, categories_searcher}