const UserAgent = require('user-agents');
const sleep = require('../sleep');
const proxy = require('../proxy');
const User = require('../../models/user');
const Post = require('../../models/post');
const rn = require('random-number');
const request = require('request-promise');
let timeouts = 0;
let timeout_seconds = 10;
async function humanize_sleep() {
    // let options = {
    //     min: 3,
    //     max: 15,
    //     integer: true
    // };
    // let sleep_seconds = rn(options);
    // console.log('request humanizing sleep ' + sleep_seconds + ' seconds');
    // await sleep(sleep_seconds);
    return true;
}

async function getEnv(username) {
    var response = await postsRequest('https://www.instagram.com/' + username + '/?__a=1');
    if (response.statusCode == 404) {
        console.log('User not found');
        return false;
    }
    else if (response.statusCode == 0) {
        console.log('Request limit max tries reached');
        return false;
    }

    try {
        user_data = response.data.graphql.user;
    } catch (error) {
        return false;
    }

    var user = new User();
    user.set('captured_at', new Date());
    user.set('network', 'ig');
    user.set('user_id', user_data.id);
    user.set('username', user_data.username);
    user.set('name', user_data.full_name);
    user.set('is_verified', 'is_verified' in user_data && user_data.is_verified);
    user.set('is_private', 'is_private' in user_data && user_data.is_private);
    user.set('thumbnail', user_data.profile_pic_url_hd);
    user.set('about', user_data.biography);
    user.set('followers', parseInt(user_data.edge_followed_by.count));
    user.set('following', parseInt(user_data.edge_follow.count));
    user.set('media', parseInt(user_data.edge_owner_to_timeline_media.count));

    const is_private = user.get('is_private');
    await humanize_sleep();
    return { 'user': user, 'response': response };
}

async function getPosts(username, post_response, date) {
    let all_posts = [];
    if (typeof date == "undefined") {
        date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - 90);
    }

    var url = 'https://www.instagram.com/' + username + '/?__a=1';
    var continue_loop = true;
    var first_request = true;
    var variables_url = {
        'id': '',
        'first': '12',
        'after': ''
    };
    while (continue_loop) {
        console.log('verifying env request received');
        if ((first_request && !post_response) || !first_request) {
            if (first_request) {
                console.log('invalid, making new request');
            }
            post_response = await postsRequest(url);
        }

        if (post_response.status == 404) {
            console.log('User not found');
            return false;
        }
        else if (post_response.status == 404) {
            console.log('Request limit max tries reached');
            return false;
        }

        var post_data = post_response.data;

        if (first_request) {
            variables_url['id'] = post_data.graphql.user.id;
            first_request = false;

            if (!('graphql' in post_data)) {
                break;
            }
            let posts = post_data.graphql.user.edge_owner_to_timeline_media.edges;

            for (var i in posts) {
                var item = posts[i].node;
                var created_at = new Date(item.taken_at_timestamp * 1000);
                var post = new Post();
                var get_publipost = await getPublipost(item.shortcode, post);
                post.set('captured_at', new Date());
                post.set('network', 'ig');
                post.set('user_id', item.owner.id);
                post.set('post_id', item.id);
                post.set('post_type', 'post');
                post.set('media_code', item.shortcode);
                post.set('interaction_type', item.is_video ? 'video' : 'image');
                post.set('created_at', created_at);
                post.set('display_url', item.display_url);
                post.set('thumbnail_url', item.thumbnail_src);
                post.set('likes', item.edge_media_preview_like.count);
                post.set('comments', item.edge_media_to_comment.count);
                post.set('views', 'video_view_count' in item ? item.video_view_count : 0);
                post.set('text', item.edge_media_to_caption.edges.length > 0 ? item.edge_media_to_caption.edges[0].node.text : '');
                post.set('tagged_users', []);
                post.set('owner', item.owner);
                post.set('locations', item.location && item.location !== null ? item.location.name : '');
                post.set('is_publipost', get_publipost);

                all_posts.push(post);
                
                if (created_at.getTime() < date.getTime()) {
                    continue_loop = false;
                    break;
                }
            }

            if (!continue_loop) {
                break;
            }

            if (post_data.graphql.user.edge_owner_to_timeline_media.page_info.has_next_page) {
                variables_url['after'] = post_data.graphql.user.edge_owner_to_timeline_media.page_info.end_cursor;
                let variables_url_str = encodeURIComponent(JSON.stringify(variables_url));
                url = "https://www.instagram.com/graphql/query/?query_hash=42323d64886122307be10013ad2dcc44&variables=" + variables_url_str;
            }
            else {
                break;
            }
        }
        else {
            if (typeof post_data == "undefined" || !('data' in post_data)) {
                break;
            }
            var posts = post_data.data.user.edge_owner_to_timeline_media.edges;
            for (var i in posts) {
                var item = posts[i].node;
                var created_at = new Date(item.taken_at_timestamp * 1000);
                var post = new Post();
                var get_publipost = await getPublipost(item.shortcode, post);
                post.set('captured_at', new Date());
                post.set('network', 'ig');
                post.set('user_id', item.owner.id);
                post.set('post_id', item.id);
                post.set('post_type', 'post');
                post.set('media_code', item.shortcode);
                post.set('interaction_type', item.is_video ? 'video' : 'image');
                post.set('created_at', created_at);
                post.set('display_url', item.display_url);
                post.set('thumbnail_url', item.thumbnail_src);
                post.set('likes', item.edge_media_preview_like.count);
                post.set('comments', item.edge_media_to_comment.count);
                post.set('views', 'video_view_count' in item ? item.video_view_count : 0);
                post.set('text', item.edge_media_to_caption.edges.length > 0 ? item.edge_media_to_caption.edges[0].node.text : '');
                post.set('tagged_users', []);
                post.set('owner', item.owner);
                post.set('locations', item.location && item.location !== null ? item.location.name : '');
                post.set('is_publipost', get_publipost);

                all_posts.push(post);

                if (created_at.getTime() < date.getTime()) {
                    continue_loop = false;
                    break;
                }
            }

            if (!continue_loop) {
                break;
            }

            if (post_data.data.user.edge_owner_to_timeline_media.page_info.has_next_page) {
                variables_url['after'] = post_data.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
                let variables_url_str = encodeURIComponent(JSON.stringify(variables_url));
                url = "https://www.instagram.com/graphql/query/?query_hash=42323d64886122307be10013ad2dcc44&variables=" + variables_url_str;
            }
            else {
                break;
            }
        }
        await humanize_sleep();
    }

    return all_posts;
}

async function findHashtags(text) {
    var regexp = /\B\#\w\w+\b/g
    result = text.match(regexp);
    return result;
}

async function getPublipost(post_code, post) {
    console.log('Getting publipost info...');
    try {
        var request_publipost = await postsRequest('https://www.instagram.com/p/' + post_code + '/?__a=1');
        if (typeof request_publipost == "undefined") {
            return;
        }

        if (!('data' in request_publipost)) {
            return;
        }

        if (!('graphql' in request_publipost.data)) {
            return;
        }

        var sponsor_username = request_publipost.data.graphql.shortcode_media.edge_media_to_sponsor_user.edges;
        var caption_post = request_publipost.data.graphql.shortcode_media.edge_media_to_caption;
        if (sponsor_username.length > 0) 
        {
            console.log('Getting sponsor username...');
            post.set('sponsor_username', sponsor_username[0].node.sponsor['username']);
            return true;
        }

        var caption = caption_post.edges.length > 0 ? caption_post.edges[0].node['text'] : '';
        var found_hashtags = await findHashtags(caption);        
        var publi_hashtags = ['#ad', '#advertising', '#publi', '#sponsored', '#publicidade', '#publidaalegria', '#publidadiva', '#publidajosy', '#publidamaju', '#publisincera', '#publisincero'];
        if (found_hashtags === null) {
            return false;
        }
        else 
        {
            console.log('Getting # publipost info...');
            for (let i in found_hashtags) 
            {
                var found_tag = found_hashtags[i];
                if (publi_hashtags.indexOf(found_tag) > -1) 
                {
                    post.set('sponsor_username', caption);
                    return true;
                }
            }
        }

        console.log('Finished getting publi info.');
        return false;
    } catch (error) 
    {
        console.log('error on gettin publipost info');
        console.log(error);

        return false
    }
}

async function postsRequest(url) {
    if (timeouts >= 10) {
        timeouts = 0;
        return {
            'statusCode': 0,
            'response': {}
        };
    }
    try {
        var cookies = [
            // 'sessionid=18605749724%3AicgOXuUPE5dS7Z%3A12;',
            // 'sessionid=18668209838%3Ah13ldmB2ZL7AxE%3A23',
            // 'sessionid= 15649269666%3AyWQMgtxqAjWo70%3A17;',
            // 'sessionid=18668209838%3Aaq6lj0xghGNZNv%3A7;',
            // 'sessionid=15649269666%3A7U4ckImvzSPjCh%3A21;',
            // 'sessionid=15649269666%3Azvptey0Tnm8Mjm%3A21;',
            // 'sessionid=18668209838%3A3NencH7xoS3AI4%3A14;',
            // 'sessionid=18656670651%3A4fjfrIoOWwg5Uy%3A5;',
            '',
            // 'rur=PRN; csrftoken=dJH9hsszhqUb2usV76gfre0RfMYUValr; mid=XWQugwAEAAGcdz3JQxyKvNIUmVVS',
        ];

        let options = {
            min: 0,
            max: cookies.length - 1,
            integer: true
        };
        let cookie_index = rn(options);
        let cookie = cookies[cookie_index]
        console.log('defining cookie: ', cookie);

        var user_agents = [
            new UserAgent({ deviceCategory: 'mobile' }).userAgent,
            // 'Instagram 26.0.0.10.86 Android(24 / 7.0; 640dpi; 1440x2560; samsung; SM - G930F; herolte; samsungexynos8890; en_US)',
            // 'Instagram 26.0.0.10.86 Android(24 / 7.0; 640dpi; 1440x2560; HUAWEI; LON - L29; HWLON; hi3660; en_US)',
            // 'Instagram 26.0.0.10.86 Android(24 / 7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US)',
            // 'Instagram 26.0.0.10.86 Android(23 / 6.0.1; 640dpi; 1440x2392; LGE / lge; RS988; h1; h1; en_US)',
            // 'Instagram 26.0.0.10.86 Android(23 / 6.0.1; 640dpi; 1440x2560; ZTE; ZTE A2017U; ailsa_ii; qcom; en_US)',
            // 'Instagram 26.0.0.10.86 Android(23 / 6.0.1; 640dpi; 1440x2560; samsung; SM - G935; hero2lte; samsungexynos8890; en_US)',
            // new UserAgent({ deviceCategory: 'mobile' }).userAgent,
        ];

        let useragent_options = {
            min: 0,
            max: user_agents.length - 1,
            integer: true
        };
        let useragent_index = rn(useragent_options);

        var user_agent = user_agents[useragent_index];
        console.log('defining user-agent: ', user_agent);
        let proxy_agent = proxy.proxy_random();
        // let proxy_agent = 'http://lum-customer-airfluencers-zone-datacenter_001:cm13jwqrwyag@zproxy.lum-superproxy.io:22225';
        const config = {
            'resolveWithFullResponse': true,
            'url': url,
            // 'url' : 'http://lumtest.com/myip.json',
            'headers': {
                'Content-Type': 'application/json',
                'User-Agent': user_agent,
                'cookie': cookie
            },
            //'proxy': proxy_agent,
        };

        // var response = await axios.get(url, config);
        var response = await request(config);
        try {
            response['data'] = JSON.parse(response.body);
        } catch (error) {
            response['data'] = response.body;
        }

        let timeout_options = {
            min: 3,
            max: 15,
            integer: true
        };
        timeout_seconds = rn(timeout_options);
        // timeout_seconds = 0;
        if (typeof response.data == 'string') {
            timeouts++;
            console.log('REQUEST TIMEOUT!!! request limit reached, waiting ' + (timeouts * timeout_seconds) + ' seconds');
            sleep(timeouts * timeout_seconds);
            return await postsRequest(url);
        }
        timeouts = 0;
    } catch (error) {
        if (error.statusCode == 429 || error.statusCode == 407) {
            timeouts++;
            console.log('REQUEST TIMEOUT!!! request limit reached, waiting ' + (timeouts * timeout_seconds) + ' seconds');
            sleep(timeouts * timeout_seconds);
            return await postsRequest(url);
        }
        else if (error.statusCode !== 404) {
            console.log(error.statusCode);
            console.log(error);
        }
        else
        {
            console.log(error.statusCode)
        }

        return error;
    }

    timeouts = 0;
    return response;
}


module.exports = {
    getEnv,
    getPosts
};
