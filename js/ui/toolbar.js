"use strict";
/**
 * @class  elFinder toolbar
 *
 * @author Dmitry (dio) Levashov
 **/
$.fn.elfindertoolbar = function(fm, opts) {
	this.not('.elfinder-toolbar').each(function() {
		var commands = fm._commands,
			self     = $(this).addClass('ui-helper-clearfix ui-widget-header ui-corner-top elfinder-toolbar'),
			options  = {
				// default options
				autoHideUA: ['Mobile']
			},
			filter   = function(opts) {
				return $.map(opts, function(v) {
					if ($.isPlainObject(v)) {
						options = $.extend(options, v);
						return null;
					}
					return [v];
				});
			},
			panels   = filter(opts || []),
			dispre   = null,
			uiCmdMapPrev = '',
			l, i, cmd, panel, button, swipeHandle;
		
		self.prev().length && self.parent().prepend(this);

		var render = function(disabled){
			var name;
			self.empty();
			l = panels.length;
			while (l--) {
				if (panels[l]) {
					panel = $('<div class="ui-widget-content ui-corner-all elfinder-buttonset"/>');
					i = panels[l].length;
					while (i--) {
						name = panels[l][i];
						if ((!disabled || $.inArray(name, disabled) === -1) && (cmd = commands[name])) {
							button = 'elfinder'+cmd.options.ui;
							$.fn[button] && panel.prepend($('<div/>')[button](cmd));
						}
					}
					
					panel.children().length && self.prepend(panel);
					panel.children(':gt(0)').before('<span class="ui-widget-content elfinder-toolbar-button-separator"/>');

				}
			}
			
			(! self.data('swipeClose') && self.children().length)? self.show() : self.hide();
			self.trigger('load');
		};
		
		render();
		
		fm.bind('open sync', function(){
			var repCmds = [],
			disabled = fm.option('disabled');

			if (!dispre || dispre.toString() !== disabled.sort().toString()) {
				render(disabled && disabled.length? disabled : null);
			}
			dispre = disabled.concat().sort();

			if (uiCmdMapPrev !== JSON.stringify(fm.commandMap)) {
				uiCmdMapPrev = JSON.stringify(fm.commandMap);
				if (Object.keys(fm.commandMap).length) {
					$.each(fm.commandMap, function(from, to){
						var cmd = fm._commands[to],
						button = cmd? 'elfinder'+cmd.options.ui : null;
						if (button && $.fn[button]) {
							repCmds.push(from);
							var btn = $('div.elfinder-buttonset div.elfinder-button').has('span.elfinder-button-icon-'+from);
							if (btn.length && !btn.next().has('span.elfinder-button-icon-'+to).length) {
								btn.after($('<div/>')[button](fm._commands[to]).data('origin', from));
								btn.hide();
							}
						}
					});
				}
				// reset toolbar
				$.each($('div.elfinder-button'), function(){
					var origin = $(this).data('origin');
					if (origin && $.inArray(origin, repCmds) == -1) {
						$('span.elfinder-button-icon-'+$(this).data('origin')).parent().show();
						$(this).remove();
					}
				});
			}
		});
		
		if (fm.UA.Touch) {
			fm.bind('load', function() {
				swipeHandle = $('<div class="elfinder-toolbar-swipe-handle"/>').appendTo(fm.getUI());
				if (swipeHandle.css('pointer-events') !== 'none') {
					swipeHandle.remove();
					swipeHandle = null;
				}
			})
			.one('open', function() {
				if (options.autoHideUA && options.autoHideUA.length > 0) {
					if ($.map(options.autoHideUA, function(v){ return fm.UA[v]? true : null; }).length) {
						setTimeout(function() {
							self.stop(true, true).trigger('toggle', {duration: 500});
						}, 500);
					}
				}
			});
			
			self.on('toggle', function(e, data) {
				var wz    = fm.getUI('workzone'),
					toshow= self.is(':hidden'),
					wzh   = wz.height(),
					h     = self.height(),
					tbh   = self.outerHeight(true),
					delta = tbh - h,
					opt   = $.extend({
						step: function(now) {
							wz.height(wzh + (toshow? (now + delta) * -1 : h - now));
							fm.trigger('resize');
						},
						always: function() {
							wz.height(wzh + (toshow? self.outerHeight(true) * -1 : tbh));
							fm.trigger('resize');
							if (swipeHandle) {
								if (toshow) {
									swipeHandle.stop(true, true).hide();
								} else {
									swipeHandle.height(data.handleH? data.handleH : '');
									fm.resources.blink(swipeHandle, 'slowonce');
								}
							}
						}
					}, data);
				self.data('swipeClose', ! toshow).animate({height : 'toggle'}, opt);
			});
		}
	});
	

	
	return this;
};
