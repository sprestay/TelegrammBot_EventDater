const User = require('../models/User');
const fetch = require('node-fetch');

/// Добавить условие, что не в парах

async function look_who_likes(current) {
    let users = await User.find({
        likes: {$in: [current.id]},
        gender: !current.gender,
    });
    return users;
}

async function look_by_events(current) {
    let users = await User.find({
        gender: !current.gender,
        $or: [
            {event: {$in: current.event}}, 
            {cinema: {$in: current.cinema}}, 
            {place: {$in: current.place}},
        ]
    });
    return users;
}


function people_search(current) {
    if (current.gender)
        return look_by_events(current);
    else
        return look_who_likes(current);
}

async function get_description(type, events) {
    let base_url = null;
    if (['cinema','event','place'].indexOf(type) == -1)
        return 'wrong request';

    switch(type) {
        case('cinema'):
            base_url = 'https://kudago.com/public-api/v1.4/movies/';
            break;
        case('event'):
            base_url = 'https://kudago.com/public-api/v1.4/events/';
            break;
        case('place'):
            base_url = 'https://kudago.com/public-api/v1.4/places/';
            break;
    }

    let data = await Promise.all(events.map(event => {
        let url = new URL(base_url + event.toString() + '/');
        url.search = new URLSearchParams({
            lang: 'ru',
            fields:'title'
        });
        return fetch(url).then(res => res.json()).then(res => res.title);
    }));
    return "<b>" + data.join('\n') + "</b>\n";
};


module.exports = { people_search, get_description };