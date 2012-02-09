// ==UserScript==
// @name           Town Hall Digest Parser
// @include        http://chat.stackoverflow.com/rooms/*
// @include        http://chat.meta.stackoverflow.com/rooms/*
// @include        http://chat.stackexchange.com/rooms/*
// ==/UserScript==


inject(function ($) {
    var buttons = {
            answer: create('button', { text: 'Select Answer' }),
            hide: create('button', { text: 'Hide' }),
            question: create('button', { text: 'Select Question' }),
            undo: create('button', { text: 'Undo' })
        },
        cache = {},
        chat = document.getElementById('chat'),
        classes = {
            digest: 'digested',
            hide: 'hideDigest',
            select: 'templateSelect'
        },
        container = create('div', { id: 'templateContainer' }),
        mode = null,
        modes = {
            answer: 1,
            question: 2
        },
        output = create('textarea', { readonly: true }),
        selectClass = 'templateSelect',
        templates = {
            answer:
                '**![${user.name}](${user.gravatar16}) ' +
                '[${user.name}](http://${user.chatProfile}) ' +
                '[answered](http://${permalink}):** ${content}',
            question:
                '## *![${user.name}](${user.gravatar16}) ' +
                '[${user.name}](http://${user.chatProfile}) ' +
                '[asked](http://${permalink}):* ${content}'
        },
        questions = [];
    
    $(chat).delegate('.message', 'click', function () {
        if (mode) {
            var generated = template(this, mode == modes.question ?
                    templates.question : templates.answer);

            if (mode == modes.question) {
                questions.push(this.id);
            
                var children = highlight(this, questions.length);

                generated += '\n\n----\n';
                
                if (children) {
                    children.forEach(function (child) {
                        generated += '\n' + template(child, templates.answer) + '\n';
                    });
                }
            }
            
            output.value = generated;
        }
    });
    buttons.answer.addEventListener('click', function (event) {
        event.stopPropagation();
        return prep(modes.answer);
    });
    buttons.question.addEventListener('click', function (event) {
        event.stopPropagation();
        return prep(modes.question);
    });
    buttons.undo.addEventListener('click', undo);
    buttons.hide.addEventListener('click', hide);
    document.addEventListener('click', clear);
    
    container.appendChild(output);
    container.appendChild(buttons.question);
    container.appendChild(buttons.answer);
    container.appendChild(buttons.hide);
    container.appendChild(buttons.undo);
    
    $(create('a', { id: 'templateClose' })).toggle(
        function () {
            $(container).animate({ right: -415 });
        },
        function () {
            $(container).animate({ right: 0 });
        }
    ).appendTo(container);
    
    document.body.appendChild(container);
    
    function template(message, template) {
        message = $(message);
        
        var userData,
            content = message.find('.content')[0],
            user = message.closest('.messages').prev(),
            reply = message.find('.reply-info'),
            path = user.attr('href'),
            id = path.split('/')[2];
            
        if (cache[id]) {
            userData = cache[id];
        } else {
            userData = {
                name: $.trim(user.find('.username:first').text()),
                gravatar16: user.find('.avatar-16 img').attr('src'),
                chatProfile: location.host + path
            };
            cache[id] = userData;
        }
        
        var contentText = markdownify(content.cloneNode(true));
        
        return template
            .replace(/\${user\.name}/g, userData.name)
            .replace(/\${user\.gravatar16}/g, userData.gravatar16)
            .replace(/\${user\.chatProfile}/g, userData.chatProfile)
            .replace(/\${permalink}/g, location.host + message.find('.action-link').attr('href'))
            .replace(/\${content}/g, contentText.replace(/^@[^\s]+/, ''));
    }
    
    function markdownify(element) {
        if (element.children.length) {
            var first = element.children[0];
        
            if (first.classList.contains('full')) {
                return element.textContent;
            } else if (first.classList.contains('ob-post')) {
                var link = first.querySelector('.ob-post-title > a');
                element = document.createElement('span');
                    
                if (link) {
                    element.appendChild(link);
                }
            }
        
            for (var i = element.children.length - 1; i >= 0; --i) {
                markdownify(element.children[i]);
            }
        }
        
        if (element.parentNode) {
            var format = '';
        
            if (element.tagName === 'B') {
                format = '**%s**';
            } else if (element.tagName === 'I') {
                format = '*%s*';
            } else if (element.tagName === 'A') {
                if (!/\[tag:.*\]/.test(element.innerHTML)) {
                    format = '[%s](' + element.href + ')';
                } else {
                    format = '%s';
                }
            } else if (element.tagName === 'CODE') {
                format = '`%s`';
            } else if (element.tagName === 'SPAN' && element.className === 'ob-post-tag') {
                format = '[tag:%s]';
            } else {
                return;
            }
            
            format = format.replace('%s', element.innerHTML);
            
            element.parentNode.replaceChild(document.createTextNode(format), element);
        } else {
            return element.innerHTML;
        }
    }

    function highlight(root, index, hide) {
        var elements = [];
        
        select(root);
        elements.push.apply(elements,
                document.getElementsByClassName('pid-' + root.id.substr('message-'.length)));
        elements.forEach(select);
        
        return elements.length ? elements : null;
        
        function select(element) {
            element.classList[hide ? 'remove' : 'add']('qs-' + index);
            element.classList[hide ? 'remove' : 'add'](classes.digest);
        }
    }
    
    function undo() {
        var undo = questions.pop(), question;
        output.value = '';
        
        if (undo) {
            question = document.getElementById(undo);
        
            if (question) {
                highlight(question, questions.length + 1, true);
            }
        }
    }
    
    function hide() {
        chat.classList.toggle(classes.hide);
    }
    
    function prep(activeMode) {
        mode = activeMode;
        chat.classList.add(classes.select);
        
        return false;
    }
    
    function clear() {
        mode = null;
        chat.classList.remove(classes.select);
    }
    
    function create(element, attributes) {
        element = document.createElement(element);
        
        if (attributes) {
            if (attributes.text) {
                element.textContent = attributes.text;
                delete element.textContent;
            }
            
            Object.keys(attributes).forEach(function (attribute) {
                element.setAttribute(attribute, attributes[attribute]);
            });
        }
        
        return element;
    }
}, styles());


function styles() {
    var styles = {
		'#templateContainer': {
			'width': '390px',
			'position': 'fixed',
			'background': '#efefef',
			'padding': '10px 10px 10px 30px',
			'font-family': 'Arial',
			'top': 0,
			'right': 0,
			'z-index': 100000
		},
		'#templateContainer textarea': {
			'width': '100%',
			'height': '250px',
			'padding': '4px',
			'margin-bottom': '10px',
			'display': 'block'
		},
		'#templateContainer button': {
			'margin-right': '5px'
		},
		'#chat.templateSelect .message:hover': {
			'cursor': 'crosshair',
			'background-color': 'rgba(0, 0, 0, 0.2)'
		},
		'#templateClose': {
			'position': 'absolute',
			'top': 0,
			'bottom': 0,
			'left': 0,
			'width': '12px',
			'cursor': 'pointer',
			'background': '#ccc'
		},
		'#templateClose:hover': {
			'background': '#999'
		},
        '#chat.hideDigest .message.digested': {
            'display': 'none'
        }
	};
    
    var colours = [
        '980000', 'FF0000', 'FF9900', '00FF00', '00FFFF', '4A86E8', 'FFE5AC', '9900FF',
        'FF00FF', 'CC4125', 'E06666', 'F6B26B', '93C47D', '76A5AF', '6D9EEB', '6FA8DC',
        '8E7CC3', 'C27BA0', '990000', 'B45F06', 'BF9000', '38761D', '285BAC', '741B47',
        'EDDF7B', '52FF8F', '21CBFF', 'FF5F01', 'B4F1FF', 'E2FF89', 'D571FF', 'FF9999',
        '4ABE73', '79E2D8', 'BC3AFF', '0000FF', '85200C', '351C75', '134F5C'
    ];
    
    for (var i = 0; i < colours.length; ++i) {
        styles['#chat .message.qs-' + (i + 1)] = {
            'background-color': '#' + colours[i]
        };
    }
    
    return styles;
}

function inject(f, s) {
    var script = document.createElement('script'),
        style = document.createElement('style'),
        styleContent = '';
    
    script.type = "text/javascript";
    script.textContent = "(" + f.toString() + ")(jQuery)";
    
    document.body.appendChild(script);
    
    style.type = "text/css";
    
    Object.keys(s).forEach(function (key) {
        styleContent += key + ' {';
        
        Object.keys(s[key]).forEach(function (key) {
            styleContent += key + ':' + this[key] + ';';
        }, s[key]);
        
        styleContent += '}\n';
    });
    
    style.textContent = styleContent;
    document.getElementsByTagName('head')[0].appendChild(style);
}