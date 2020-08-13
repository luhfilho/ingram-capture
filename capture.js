var argv = require('minimist')(process.argv.slice(2));
const userCapture = require('./libs/capture/user');
const sleep = require('./libs/sleep');

async function main() {
    console.log(argv)
    if (!'username' in argv) {
        console.log('username argument is required');
        return;
    }
    let username = argv['username'];
    await do_capture(username);
}


async function do_capture(username) {
    console.log('Starting getting new user job');
    console.log('Starting job with https://instagram.com/' + username);

    console.log('Getting user env data');
    let user_item = await userCapture.getEnv(username);

    if (!user_item) {
        console.log('user not found');
        return;
    }

    const is_private = user_item.user.get('is_private')
    if (is_private) {
        console.log('private user!');
        return;
    }

    console.log('=== USER DATA ===')
    console.log(user_item.user.dump);


    console.log('Getting user posts data');

    let date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 3);
    console.log('capture until => ', date);

    let posts = await userCapture.getPosts(username, user_item.response, date);

    if (!posts) {
        console.log('user not found')
        return;
    }

    console.log('total posts => ', posts.length);

    for(let j in posts)
    {
        let post = posts[j];

        console.log(post)
        console.log(' ');
        sleep(0.5);
    }
}


//starting command
main();