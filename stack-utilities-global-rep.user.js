// ==UserScript==
// @name          SE Global Reputation
// @description   Adds total reputation to global profile graph
// @include       http://stackexchange.com/users/*
// @author        @TimStone
// ==/UserScript==

function inject(f) {
	var script = document.createElement('script');
		script.type = 'text/javascript';
		script.textContent = '(' + f.toString() + ')(jQuery)';

	document.body.appendChild(script);
}

inject(function ($) {
	$(document).ready(function () {
		var container = $('#reputation-container'),
			selector = $('input[name="reputation-accounts"]'),
            day = 24 * 60 * 60 * 1000,
			badge, title;

		if (!container.length) {
			return;
		}

		if (!chart || !chart.series || !chart.series.length) {
			return;
		}
        
        var calculateTotal = true,
            plots = [], offset, series, currentDate, minimumDate,
            reputationTotal = 0, reputationLimited = 0, reputationCurrent;

		for (var i = 0; i < chart.series.length; ++i) {
			if (chart.series[i]) {
				reputationCurrent = chart.series[i].data;
                
                if (calculateTotal) {
                    currentDate = reputationCurrent[0].x;
                    offset = minimumDate ? daysBefore(minimumDate, currentDate) : 0;
                
                    for (var j = 0; j < reputationCurrent.length; ++j) {
                        if (offset + j < 0) {
                            plots.unshift(reputationCurrent[(-offset - j) - 1].y);
                        } else if (offset > -1 || !(offset = 0)) {
                            plots[offset + j] = (plots[offset + j] || 0) + reputationCurrent[j].y;
                        }
                    }
                
                    if (!minimumDate || currentDate < minimumDate) {
                        minimumDate = currentDate;
                    }
                }
                
				reputationCurrent =
						reputationCurrent[reputationCurrent.length - 1].config;

				if (i < 5) {
					reputationLimited += reputationCurrent;
				}
				
				reputationTotal += reputationCurrent;
			}
		}
        
        if (calculateTotal && plots.length) {
            series = chart.addSeries({
                name: 'Network Total',
                pointInterval: day,
                pointStart: minimumDate,
                data: plots,
                visible: showNetworkTotal(),
                events: {
                    legendItemClick: function () {
                        showNetworkTotal(!series.visible);
                    }
                }
            });
            
            $(chart).off('redraw').on('redraw', redraw);
            
            series._hide = series.hide;
            series._show = series.show;
            
            series.hide = function () {
                if (!$('.reputation-loader').length) {
                    series._hide();
                }
            };
            series.show = function () {
                if (!$('.reputation-loader').length) {
                    series._show();
                }
            }
        }
		
		title = document.createElement('span');
		title = $(title);
		badge = document.createElement('div');
		badge.id = 'us-global-reputation';
		badge = $(badge);
		
		title.text('Global Reputation');
		title.css({
			'display': 'block',
			'font-weight': 'bold',
			'margin-bottom': '4px'
		});
		badge.append(title);
		badge.css({
			'opacity': '0.75',
			'background-color': '#FFFFFF',
			'-moz-border-radius': '5px 5px 5px 5px',
			'border-radius': '5px 5px 5px 5px',
			'-moz-box-shadow': '2px 2px 2px #D0D0D0',
			'box-shadow': '2px 2px 2px #D0D0D0',
			'border': '2px solid #707070',
			'position': 'absolute', 
			'top': '15px',
			'left': (chart.plotLeft + 5) + 'px',
			'font-size': '12px',
			'padding': '5px 5px 5px 5px',
			'z-index': '8'
		});
		container.append(badge);
		
		badge.append(document.createElement('span'));
		badge = badge.children('*:last');
		
		selector.change(change);
        redraw();
		change();
		
		function change () {
			var limited = document.getElementById('top-accounts');
			
			limited = limited && limited.checked ?
					reputationLimited : reputationTotal;
			badge.html(format(reputationTotal) + " total, "
					+ format(limited) + " shown");
			badge.find('strong').css('color', '#1E4F93');
		}
        
        function redraw() {
            var visible = 0, topFive = false;
        
            for (var i = 0; i < chart.series.length - 1; ++i) {
                if (!topFive && !chart.series[i].visible) {
                    break;
                }
            
                if (chart.series[i].visible) {
                    ++visible;
                }
                
                if (i === 4) {
                    topFive = true;
                }
            }
            
            if (topFive && visible === 5) {
                selector.filter('#top-accounts').prop('checked', true);
            } else if (visible === chart.series.length - 1) {
                selector.filter('#all-accounts').prop('checked', true);
            } else {
                selector.prop('checked', false);
            }
        }
		
		function format(number) {
			var current, formatted = '';
		
			do {
				current = number % 1000;
				number = Math.floor(number / 1000);
				formatted = current + formatted;
				
				if (number) {
					formatted = (current < 100 ? '0' : '')
							+ (current < 10 ? '0' : '')
							+ formatted;
				}
			} while (number > 0 && (formatted = ',' + formatted))
			
			return '<strong>' + formatted + '</strong>';
		}
        
        function daysBefore(previous, current) {
            return (current - previous) / day;
        }
        
        function showNetworkTotal(show) {
            if (typeof show !== 'undefined') {
                localStorage['us-display-network-graph'] = show;
            }
            
            return localStorage['us-display-network-graph'] == 'true';
        }
	});
});