// ==UserScript==
// @name           MSO Reputation Helper
// @description    Shows reputation of the user on Stack Overflow/Network
// @author         Tim Stone
// @match          http://meta.stackoverflow.com/*
// ==/UserScript==

function inject(f) {
	var script = document.createElement('script');
		script.type = 'text/javascript';
		script.textContent = '(' + f.toString() + ')(jQuery)';

	document.body.appendChild(script);
}

inject(function ($) {
    var styles =
        '.us-rep-block {' +
            'padding-left: 37px;' +
            'margin-top: 3px;' +
            'margin-bottom: 6px;' +
        '}' +
        '.us-rep-block .reps {' +
            'font-weight: bold;' +
        '}' +
        '.us-rep-block .mod {' +
            'font-weight: bold;' +
            'font-size: 110%;' +
            'margin-left: 4px;' +
        '}' +
        '.us-rep-block > span:first-child {' +
            'background: transparent none no-repeat scroll right center;' +
            'padding-right: 20px' +
        '}' +
        '.us-rep-block.se > span:first-child {' +
            'background-image: url("http://cdn.sstatic.net/stackexchange/img/favicon.ico");' +
        '}' +
        '.us-rep-block.so > span:first-child {' +
            'background-image: url("http://cdn.sstatic.net/stackoverflow/img/favicon.ico");' +
        '}' +
        '.us-rep-block-switch {' +
            'background: transparent url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAxMS8wMi8xMikcdKwAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzVxteM2AAABQElEQVQokY3SvWtTARTG4SeppMWp+IHQUV0sZPEf0EFcJDo6uFW4h5rBQQsFXQV3cTgO4uTmIERQpNjBOVsRocExYEAQikgIXpcbuL2Etu/8/s57vlplWaorIk7jFs5jBT/wOTMP6r52A9rGd9zBhQq8jU8Rcb/ubZVlKSI6SCxjMzN/NwpexjP8wqPM/DNPfFhBRROCzNzPzLs4g3v1Vq/jcXOOBXqBaxGx2mou5yj1+/33s9lsDX+XxuPxqcFgsNzr9WbHgaPR6OxkMlnLzButoih0Op3dbrf7vCiKjydNb2N3Op22h8Ph0xP3XIGbmJRl+eA4c0SsR8QHaGfmN3zBk4hYOQI6h5d4N0+EN/iJjIhLC6AreIWvmfma6nNqhg1sYQ/7+IerWMd2Zr6dexfeMSJu4iKWqgI7mXnoXP8Bx3Z6GnFNW4UAAAAASUVORK5CYII=") no-repeat scroll right center;' +
            'float: right;' +
            'height: 14px;' +
            'width: 14px;' +
            'margin-right: 6px;' +
            'cursor: pointer;' +
        '}',
        apiKey = 'NcxAQF0apwduF8cqRPUjzQ((',
        userFilter = '!6XcKLmWTZRdly',
        accountFilter = '!*M6jb6HDGrkQMXWA',
        cacheName = 'us-mso-reps-cache',
        cacheExpiration = 30 * 60 * 1000;
        
    var owner = $('.post-signature.owner');
    
    if (!owner.length) {
        return;
    }
    
    var user = (owner.find('.user-details > a').attr('href') || '').match(/\/(\d+)(?:\/[^\/]+)?$/);
    
    if (!user) {
        return;
    }
    
    user = user[1];
        
    var style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = styles;
        
    document.head.appendChild(style);
    
    var accept = owner.find('.accept-rate').detach();
    
    if (accept.length) {
        accept = {
            title: accept.attr('title'),
            text: accept.text(),
            classes: accept.prop('className').replace('accept-rate', '')
        };
    } else {
        accept = {};
    }
    
    var cache = localStorage[cacheName], cachedReputation;
        cache = cache ? JSON.parse(cache) : {};
        
    if ((cachedReputation = cache['u' + user]) && cachedReputation.updated < Date.now() - cacheExpiration) {
        cachedReputation = null;
    }
    
    var container = $(
        '<div class="us-rep-block">' +
            '<span title="toggle display" class="us-rep-block-switch"></span>' +
        '</div>'
    ).appendTo(owner);
    var display = $('<span class="us-rep-block-display"></span>').prependTo(container);
    
    container.find('.us-rep-block-switch').on('click', (function () {
        var counter = -1, offset = accept.text ? 1 : 0, reputation;
        
        function save(queriedReputation) {
            reputation = queriedReputation;
            cache['u' + user] = reputation;
            localStorage[cacheName] = JSON.stringify(cache);
            
            change(reputation);
        }
        
        function change(reputation) {
            container.toggleClass('so', counter === offset);
            container.toggleClass('se', counter === (1 + offset));
            
            if (counter === offset || counter === (1 + offset)) {
                if (!reputation) {
                    display.text('loading...');
                    display.attr('title', 'loading reputation information');
                    display.prop('className', '');
                
                    getReputation(save);
                    
                    return;
                }
            
                if (counter === offset) {
                    display.text(repNumber(reputation.so));
                    display.attr('title', 'reputation on Stack Overflow ' + reputation.so);
                } else {
                    display.text(repNumber(reputation.total));
                    display.attr('title', 'reputation network-wide ' + reputation.total);
                    
                    if (reputation.isModerator) {
                        display.append('<span class="mod" title="moderator on another site">&#9830;</span>');
                    }
                }

                display.prop('className', 'reps');
            } else {
                display.text(accept.text);
                display.prop('className', accept.classes);
                display.attr('title', accept.title);
            }
        }
        
        return function () {
            counter = (counter + 1) % (2 + offset);
            change(reputation || cachedReputation);
        };
    })()).trigger('click');
    
    Object.keys(cache).forEach(function (key) {
        if (cache[key].updated < Date.now() - cacheExpiration) {
            delete cache[key];
        }
    });
    
    localStorage[cacheName] = JSON.stringify(cache);
    
    function getReputation(callback) {
        var reputation = {
            total: 0,
            so: 0,
            updated: 0
        };
    
        $.get('https://api.stackexchange.com/2.1/users/' + user + '?site=meta.stackoverflow&filter=' + userFilter + '&key=' + apiKey, function (response) {
            if (!(response = cleanResponse(response))) {
                return callback(reputation);
            }
            
            $.get('https://api.stackexchange.com/2.1/users/' + response.items[0].account_id + '/associated?pagesize=100&filter=' + accountFilter + '&key=' + apiKey, function (response) {
                if (!(response = cleanResponse(response))) {
                    return callback(reputation);
                }
                
                reputation.updated = Date.now();
                
                for (var i = 0; i < response.items.length; ++i) {
                    var account = response.items[i];
                    
                    reputation.total += account.reputation;
                    
                    if (account.user_type === 'moderator' && account.site_name !== 'Meta Stack Overflow' && account.site_name !== 'Stack Overflow') {
                        reputation.isModerator = true;
                    }
                    
                    if (account.site_name === 'Stack Overflow') {
                        reputation.so = account.reputation;
                    }
                }
                
                callback(reputation);
            });
        });
    }
    
    function cleanResponse(response) {
        // Go home Firefox you are drunk
        if (typeof(response) === 'string') {
            response = JSON.parse(response);
        }
        
        return !response.items || !response.items.length ? false : response;
    }
    
    function repNumber(a) {
        if (1E4 > a)
            return a;
        if (1E5 > a) {
            var e = Math.floor(Math.round(a / 100) / 10), a = Math.round((a - 1E3 * e) / 100);
            return e + (0 < a ? "." + a : "") + "k"
        }
        return Math.round(a / 1E3) + "k"
    }
});