const rn = require('random-number');
function proxy_random()
{
    var proxies = [
        '',
    ];
    let options_proxy = {
        min: 0,
        max: proxies.length - 1,
        integer: true
    };

    let proxy_index = rn(options_proxy);
    let proxy = proxies[proxy_index]
    var super_proxy = proxies[proxy_index];

    console.log('defining proxy: ', super_proxy);

    return super_proxy;
}

module.exports = {proxy_random};
