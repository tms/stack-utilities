// ==UserScript==
// @name         SE Chat Onebox Link Hack
// @description  Quickfix for http://meta.stackexchange.com/q/238869
// @match        *://chat.meta.stackexchange.com/*
// @match        *://chat.stackoverflow.com/*
// @match        *://chat.stackexchange.com/*
// @author       @TimStone
// ==/UserScript==

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector;
}

document.body.addEventListener('mousedown', function (event) {
    var target = event.target;

    if (target.tagName === 'A' 
            && !target.classList.contains('fixed')
            && (target.matches('.onebox a.roomname') || target.matches('.onebox .ob-post-title a'))) {
        var href = target.getAttribute('href'),
            match = /^(\/\/(?:[a-z]+\.){0,2}(?:stack(?:exchange|overflow|apps)|superuser|serverfault|askubuntu)\.com){2}/.exec(href);
            
        if (match) {
            target.setAttribute('href', href.substring(href.indexOf(match[1])));
        }
            
        target.classList.add('fixed');
    }
});