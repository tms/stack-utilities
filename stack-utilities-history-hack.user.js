// ==UserScript==
// @name           Review History Plugin Hack
// @description    Disables the History plugin setInterval workaround
// @author         Tim Stone
// @match          http://stackoverflow.com/review*
// @match          http://meta.stackoverflow.com/review*
// @match          http://superuser.com/review*
// @match          http://meta.superuser.com/review*
// @match          http://serverfault.com/review*
// @match          http://meta.serverfault.com/review*
// @match          http://askubuntu.com/review*
// @match          http://meta.askubuntu.com/review*
// @match          http://*.stackexchange.com/review*
// @match          http://answers.onstartups.com/review*
// @match          http://meta.answers.onstartups.com/review*
// @match          http://stackapps.com/review*
// ==/UserScript==

function inject(f) {
	var script = document.createElement('script');
		script.type = 'text/javascript';
		script.textContent = '(' + f.toString() + ')()';

	document.body.appendChild(script);
}

inject(function () {
    StackExchange.using('review', function () {
        var list;

        if (History && (list = History.intervalList) && list.length) {
            clearInterval(list.shift());
        }
    });
});
