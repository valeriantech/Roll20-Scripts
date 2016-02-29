// JavaScript source code
/*  ############################################################### */
/*  SplitArgs */
/*  ############################################################### */
/**
 * Splits a string into arguments using some separator. If no separator is
 * given, whitespace will be used. Most importantly, quotes in the original
 * string will allow you to group delimited tokens. Single and double quotes
 * can be nested one level.
 * 
 * As a convenience, this function has been added to the String prototype,
 * letting you treat it like a function of the string object.  
 * 
 * Example:

on('chat:message', function(msg) {
    var command, params;
    
    params = msg.content.splitArgs();
    command = params.shift().substring(1);
    
    // msg.content: !command with parameters, "including 'with quotes'"
    // command: command
    // params: ["with", "parameters,", "including 'with quotes'"]
});     
 */
var bshields = bshields || {};
bshields.splitArgs = (function () {
    'use strict';

    var version = 1.0;

    function splitArgs(input, separator) {
        var singleQuoteOpen = false,
            doubleQuoteOpen = false,
            tokenBuffer = [],
            ret = [],
            arr = input.split(''),
            element, i, matches;
        separator = separator || /\s/g;

        for (i = 0; i < arr.length; i++) {
            element = arr[i];
            matches = element.match(separator);
            if (element === '\'') {
                if (!doubleQuoteOpen) {
                    singleQuoteOpen = !singleQuoteOpen;
                    continue;
                }
            } else if (element === '"') {
                if (!singleQuoteOpen) {
                    doubleQuoteOpen = !doubleQuoteOpen;
                    continue;
                }
            }

            if (!singleQuoteOpen && !doubleQuoteOpen) {
                if (matches) {
                    if (tokenBuffer && tokenBuffer.length > 0) {
                        ret.push(tokenBuffer.join(''));
                        tokenBuffer = [];
                    }
                } else {
                    tokenBuffer.push(element);
                }
            } else if (singleQuoteOpen || doubleQuoteOpen) {
                tokenBuffer.push(element);
            }
        }
        if (tokenBuffer && tokenBuffer.length > 0) {
            ret.push(tokenBuffer.join(''));
        }

        return ret;
    }

    return splitArgs;
}());

String.prototype.splitArgs = String.prototype.splitArgs || function (separator) {
    return bshields.splitArgs(this, separator);
};


/*  ############################################################### */
/*  Torch */
/*  ############################################################### */
// GIST: https://gist.github.com/shdwjk/342cb67457936702fd8a

var Torch = Torch || (function () {
    'use strict';

    var version = 0.7,
        schemaVersion = 0.21,
    	flickerURL = 'https://s3.amazonaws.com/files.d20.io/images/4277467/iQYjFOsYC5JsuOPUCI9RGA/thumb.png?1401938659',
		flickerPeriod = 2000,
		flickerDeltaLocation = 2,
		flickerDeltaRadius = 0.1,
		flickerInterval = false,
		commands = [
            { command: '!torch', usage: "[help] <radius> <dim_radius> <others_players> <angle>", description: "" },
            { command: '!snuff', usage: "[help]", description: "" },
            { command: '!daytime', usage: "[help]", description: "" },
            { command: '!nighttime', usage: "[help]", description: "" },
            { command: '!flicker-on', usage: "[help] <radius> <dim_radius> <others_players> <angle>", description: "" },
            { command: '!flicker-off', usage: "[help]", description: "" }
		],
	    fixNewObj = function (obj) {
	        var p = obj.changed._fbpath;
	        if (p) {
	            new_p = p.replace(/([^\/]*\/){4}/, "/");
	            obj.fbpath = new_p;
	        }
	        return obj;
	    },

	    ch = function (c) {
	        var entities = {
	            '<': 'lt',
	            '>': 'gt',
	            "'": '#39',
	            '@': '#64',
	            '{': '#123',
	            '|': '#124',
	            '}': '#125',
	            '[': '#91',
	            ']': '#93',
	            '"': 'quot',
	            '-': 'mdash',
	            ' ': 'nbsp'
	        };

	        if (_.has(entities, c)) {
	            return ('&' + entities[c] + ';');
	        }
	        return '';
	    },

	    showHelp = function () {
	        var output = "/w gm ";
	        output += '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">';
	        output += '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">';
	        output += 'Torch v' + version;
	        output += '</div>';
	        output += '<div style="padding-left:10px;margin-bottom:3px;">';
	        output += '<p>Torch provides commands for managing dynamic lighting.  Supplying a first argument of <b>help</b> to any of the commands displays this help message, as will calling !torch or !snuff with nothing supplied or selected.</p>';
	        output += '<p>Torch now supports <b><i>Jack Taylor</i></b> inspired flickering lights.  Flicker lights are only active on pages where a player is (GMs, drag yourself to other pages if you don' + ch("'") + 't want to move the party.) and are persisted in the state.  Flicker lights can be used in addition to regular lights as they are implemented on a separate invisible token that follows the nomal token.  Tokens for flicker lights that have been removed are stored on the GM layer in the upper left corner and can be removed if desired.  They will be reused if a new flicker light is requested.</p>';
	        output += '</div>';
	        output += '<b>Commands</b>';
	        output += '<div style="padding-left:10px;">';
	        output += '<b><span style="font-family: serif;">!torch ' + ch('[') + ch('<') + 'Radius' + ch('>') + ' ' + ch('[') + ch('<') + 'Dim Start' + ch('>') + ' ' + ch('[') + ch('<') + 'All Players' + ch('>') + '  ' + ch('[') + ch('<') + 'Token ID' + ch('>') + ' ... ' + ch(']') + ch(']') + ch(']') + ch(']') + '</span></b>';
	        output += '<div style="padding-left: 10px;padding-right:20px">';
	        output += '<p>Sets the light for the selected/supplied tokens.  Only GMs can supply token ids to adjust.</p>';
	        output += '<p><b>Note:</b> If you are using multiple ' + ch('@') + ch('{') + 'target' + ch('|') + 'token_id' + ch('}') + ' calls in a macro, and need to adjust light on fewer than the supplied number of arguments, simply select the same token several times.  The duplicates will be removed.</p>';
	        output += '<ul>';
	        output += '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">';
	        output += '<b><span style="font-family: serif;">' + ch('<') + 'Radius' + ch('>') + '</span></b> ' + ch('-') + ' The radius that the light extends to. (Default: 40)';
	        output += '</li> ';
	        output += '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">';
	        output += '<b><span style="font-family: serif;">' + ch('<') + 'Dim Start' + ch('>') + '</span></b> ' + ch('-') + ' The radius at which the light begins to dim. (Default: Half of Radius )';
	        output += '</li> ';
	        output += '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">';
	        output += '<b><span style="font-family: serif;">' + ch('<') + 'All Players' + ch('>') + '</span></b> ' + ch('-') + ' Should all players see the light, or only the controlling players (Darkvision, etc). Specify one of <i>1, on, yes, true, sure, yup, or -</i> for yes, anything else for no.  (Default: yes)'
	        output += '</li> ';
	        output += '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">';
	        output += '<b><span style="font-family: serif;">' + ch('<') + 'Token ID' + ch('>') + '</span></b> ' + ch('-') + ' A Token ID, usually supplied with something like ' + ch('@') + ch('{') + 'target' + ch('|') + 'Target 1' + ch('|') + 'token_id' + ch('}') + '.';
	        output += '</li> ';
	        output += '</ul>';
	        output += '</div>';
	        output += '<b><span style="font-family: serif;">!snuff ' + ch('[') + ch('<') + 'Token ID' + ch('>') + ' ... ' + ch(']') + '</span></b>';
	        output += '<div style="padding-left: 10px;padding-right:20px">';
	        output += '<p>Turns off light for the selected/supplied tokens. Only GMs can supply token ids to adjust.</p>';
	        output += '<p><b>Note:</b> If you are using multiple ' + ch('@') + ch('{') + 'target' + ch('|') + 'token_id' + ch('}') + ' calls in a macro, and need to adjust light on fewer than the supplied number of arguments, simply select the same token several times.  The duplicates will be removed.</p>';
	        output += '<ul>';
	        output += '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">';
	        output += '<b><span style="font-family: serif;">' + ch('<') + 'Token ID' + ch('>') + '</span></b> ' + ch('-') + ' A Token ID, usually supplied with something like ' + ch('@') + ch('{') + 'target' + ch('|') + 'Target 1' + ch('|') + 'token_id' + ch('}') + '.';
	        output += '</li> ';
	        output += '</ul>';
	        output += '</div>';
	        output += '<b><span style="font-family: serif;">!flicker-on ' + ch('[') + ch('<') + 'Radius' + ch('>') + ' ' + ch('[') + ch('<') + 'Dim Start' + ch('>') + ' ' + ch('[') + ch('<') + 'All Players' + ch('>') + '  ' + ch('[') + ch('<') + 'Token ID' + ch('>') + ' ... ' + ch(']') + ch(']') + ch(']') + ch(']') + '</span></b>';
	        output += '<div style="padding-left: 10px;padding-right:20px">';
	        output += '<p>Behaves identically to !torch, save that it creates a flickering light.</p>';
	        output += '</div>';
	        output += '<b><span style="font-family: serif;">!flicker-off ' + ch('[') + ch('<') + 'Token ID' + ch('>') + ' ... ' + ch(']') + '</span></b>';
	        output += '<div style="padding-left: 10px;padding-right:20px">';
	        output += '<p>Behaves idntically to !snuff, save that it affects the flickering light.</p>';
	        output += '</div>';
	        output += '<b><span style="font-family: serif;">!daytime ' + ch('[') + ch('<') + 'Token ID' + ch('>') + ch(']') + '</span></b>';
	        output += '<div style="padding-left: 10px;padding-right:20px">';
	        output += '<p>Turns off dynamic lighting for the current player page, or the page of the selected/supplied token.</p>';
	        output += '<ul>';
	        output += '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">';
	        output += '<b><span style="font-family: serif;">' + ch('<') + 'Token ID' + ch('>') + '</span></b> ' + ch('-') + ' A Token ID, usually supplied with something like ' + ch('@') + ch('{') + 'target' + ch('|') + 'Target 1' + ch('|') + 'token_id' + ch('}') + '.';
	        output += '</li> ';
	        output += '</ul>';
	        output += '</div>';
	        output += '<b><span style="font-family: serif;">!nighttime ' + ch('[') + ch('<') + 'Token ID' + ch('>') + ch(']') + '</span></b>';
	        output += '<div style="padding-left: 10px;padding-right:20px">';
	        output += '<p>Turns on dynamic lighting for the current player page, or the page of the selected/supplied token.</p>';
	        output += '<ul>';
	        output += '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">';
	        output += '<b><span style="font-family: serif;">' + ch('<') + 'Token ID' + ch('>') + '</span></b> ' + ch('-') + ' A Token ID, usually supplied with something like ' + ch('@') + ch('{') + 'target' + ch('|') + 'Target 1' + ch('|') + 'token_id' + ch('}') + '.';
	        output += '</li> ';
	        output += '</ul>';
	        output += '</div>';
	        output += '</div>';
	        output += '</div>';
	        sendChat('', output);
	    },
	    setFlicker = function (o, r, d, p, a) {
	        var found = _.findWhere(state.Torch.flickers, { parent: o.id }),
			    fobj;
	        //log(o + " " + r + " " + d + " " + p + " " + a + " (ORDPA)");
	        if (found) {
	            fobj = getObj('graphic', found.id);
	            if (fobj) {
	                fobj.set({
	                    layer: 'objects',
	                    showname: false,
	                    aura1_radius: '',
	                    showplayers_aura1: false,
	                    light_radius: r,
	                    light_dimradius: d,
	                    light_otherplayers: p,
	                    light_angle: a
	                });
	            } else {
	                delete state.Torch.flickers[found.id];
	            }
	        }

	        if (!fobj) {
	            found = _.findWhere(state.Torch.flickers, { page: o.get('pageid'), active: false });
	            while (!fobj && found) {
	                fobj = getObj('graphic', found.id);
	                if (fobj) {
	                    fobj.set({
	                        layer: 'objects',
	                        showname: false,
	                        aura1_radius: '',
	                        showplayers_aura1: false,
	                        light_radius: r,
	                        light_dimradius: d,
	                        light_otherplayers: p,
	                        light_angle: a
	                    });
	                } else {
	                    delete state.Torch.flickers[found.id];
	                    found = _.findWhere(state.Torch.flickers, { page: o.get('pageid'), active: false });
	                }
	            }
	        }

	        if (!fobj) {
	            // new flicker
	            fobj = fixNewObj(createObj('graphic', {
	                imgsrc: flickerURL,
	                subtype: 'token',
	                name: 'Flicker',
	                pageid: o.get('pageid'),
	                width: 70,
	                height: 70,
	                top: o.get('top'),
	                left: o.get('left'),
	                layer: 'objects',
	                light_radius: r,
	                light_dimradius: d,
	                light_otherplayers: p,
	                light_angle: a
	            }));
	        }
	        toBack(fobj);
	        state.Torch.flickers[fobj.id] = {
	            id: fobj.id,
	            parent: o.id,
	            active: true,
	            page: o.get('pageid'),
	            light_radius: r,
	            light_dimradius: d
	        };
	        log(state.Torch);
	        log("^^^ state.Torch");
	    },

	    clearFlicker = function (fid) {
	        var f = getObj('graphic', fid);
	        if (f) {
	            f.set({
	                aura1_radius: 1,
	                aura1_square: false,
	                aura1_color: '#ffbd00',
	                showplayers_aura1: false,
	                light_radius: '',
	                ligh_dimradius: '',
	                light_angle: '',
	                light_otherplayers: false,
	                showname: true,
	                top: 70,
	                left: 70,
	                layer: 'gmlayer'
	            });
	        }
	        state.Torch.flickers[fid].active = false;
	    },

	    handleInput = function (args, msg) {
	        var radius, dim_radius, angle, other_players, page, obj, objs = [];

	        switch (args[0]) {
	            case '!torch':
	                if ('help' === args[1] || (!_.has(msg, 'selected') && args.length < 5)) {
	                    showHelp();
	                    return;
	                }
	                radius = parseInt(args[1], 10) || 40;
	                dim_radius = parseInt(args[2], 10) || (radius / 2);
	                other_players = _.contains([1, '1', 'on', 'yes', 'true', 'sure', 'yup', '-'], args[3] || 1);
	                angle = parseInt(args[4], 10) || 360;

	                if (isGM(msg.playerid)) {
	                    _.chain(args)
						    .rest(4)
						    .uniq()
						    .map(function (t) {
						        return getObj('graphic', t);
						    })
						    .reject(_.isUndefined)
						    .each(function (t) {
						        t.set({
						            light_radius: radius,
						            light_dimradius: dim_radius,
						            light_otherplayers: other_players,
						            light_angle: angle
						        });
						    });
	                }

	                _.each(msg.selected, function (o) {
	                    getObj(o._type, o._id).set({
	                        light_radius: radius,
	                        light_dimradius: dim_radius,
	                        light_otherplayers: other_players,
	                        light_angle: angle
	                    });
	                });
	                break;

	            case '!snuff':
	                if ('help' === args[1] || (!_.has(msg, 'selected') && args.length < 2)) {
	                    showHelp();
	                    return;
	                }

	                if (isGM(msg.playerid)) {
	                    _.chain(args)
						    .rest(1)
						    .uniq()
						    .map(function (t) {
						        return getObj('graphic', t);
						    })
						    .reject(_.isUndefined)
						    .each(function (t) {
						        t.set({
						            light_radius: '',
						            light_dimradius: '',
						            light_angle: '',
						            light_otherplayers: false
						        });
						    });
	                }
	                _.each(msg.selected, function (o) {
	                    getObj(o._type, o._id).set({
	                        light_radius: '',
	                        light_dimradius: '',
	                        light_angle: '',
	                        light_otherplayers: false
	                    });
	                });
	                break;

	            case '!daytime':
	                if ('help' === args[1]) {
	                    showHelp();
	                    return;
	                }
	                if (isGM(msg.playerid)) {
	                    if (msg.selected) {
	                        obj = getObj('graphic', msg.selected[0]._id);
	                    } else if (args[1]) {
	                        obj = getObj('graphic', args[1]);
	                    }
	                    page = getObj('page', (obj && obj.get('pageid')) || Campaign().get('playerpageid'));

	                    if (page) {
	                        log(page);
	                        page.set({
	                            showlighting: false
	                        });
	                        sendChat('', '/w gm It is now <b>Daytime</b> on ' + page.get('name') + '!');
	                    }
	                }
	                break;

	            case '!nighttime':
	                if ('help' === args[1]) {
	                    showHelp();
	                    return;
	                }
	                if (isGM(msg.playerid)) {
	                    if (msg.selected) {
	                        obj = getObj('graphic', msg.selected[0]._id);
	                    } else if (args[1]) {
	                        obj = getObj('graphic', args[1]);
	                    }
	                    page = getObj('page', (obj && obj.get('pageid')) || Campaign().get('playerpageid'));

	                    if (page) {
	                        page.set({
	                            showlighting: true
	                        });
	                        sendChat('', '/w gm It is now <b>Nighttime</b> on ' + page.get('name') + '!');
	                    }
	                }
	                break;

	            case '!flicker-on':
	                if ('help' === args[1] || (!_.has(msg, 'selected') && args.length < 5)) {
	                    showHelp();
	                    return;
	                }
	                radius = parseInt(args[1], 10) || 40;
	                dim_radius = parseInt(args[2], 10) || (radius / 2);
	                other_players = _.contains([1, '1', 'on', 'yes', 'true', 'sure', 'yup', '-'], args[3] || 1);
	                angle = parseInt(args[4], 10) || 360;

	                if (isGM(msg.playerid)) {
	                    objs = _.chain(args)
						    .rest(4)
						    .uniq()
						    .map(function (t) {
						        return getObj('graphic', t);
						    })
						    .reject(_.isUndefined)
						    .value();
	                }

	                _.each(_.union(objs, _.map(msg.selected, function (o) {
	                    return getObj(o._type, o._id);
	                })), function (o) {
	                    setFlicker(o, radius, dim_radius, other_players, angle);
	                });

	                break;

	            case '!flicker-off':
	                if ('help' === args[1] || (!_.has(msg, 'selected') && args.length < 2)) {
	                    showHelp();
	                    return;
	                }

	                if (isGM(msg.playerid)) {
	                    objs = _.chain(args)
						    .rest(1)
						    .uniq()
						    .value();
	                }
	                objs = _.union(objs, _.pluck(msg.selected, '_id'));
	                _.each(state.Torch.flickers, function (f) {
	                    if (_.contains(objs, f.parent)) {
	                        clearFlicker(f.id);
	                    }
	                });
	                break;

	        }
	    },
	    animateFlicker = function () {
	        var pages = _.union([Campaign().get('playerpageid')], _.values(Campaign().get('playerspecificpages')));

	        _.chain(state.Torch.flickers)
			    .where({ active: true })
			    .filter(function (o) {
			        return _.contains(pages, o.page);
			    })
			    .each(function (fdata) {
			        var o = getObj('graphic', fdata.parent),
					    f = getObj('graphic', fdata.id),
					    dx, dy, dr;

			        if (!o) {
			            clearFlicker(fdata.id);
			        } else {
			            if (!f) {
			                delete state.Torch.flickers[fdata.id];
			            } else {
			                dx = randomInteger(2 * flickerDeltaLocation) - flickerDeltaLocation;
			                dy = randomInteger(2 * flickerDeltaLocation) - flickerDeltaLocation;
			                dr = randomInteger(2 * (fdata.light_radius * flickerDeltaRadius)) - (fdata.light_radius * flickerDeltaRadius);
			                f.set({
			                    top: o.get('top') + dy,
			                    left: o.get('left') + dx,
			                    rotation: (o.get('rotation') + 180) % 360,
			                    light_radius: fdata.light_radius + dr
			                });
			            }
			        }
			    });

	    },

	    handleTokenDelete = function (obj) {
	        var found = _.findWhere(state.Torch.flickers, { parent: obj.id });

	        if (found) {
	            clearFlicker(found.id);
	        } else {
	            found = _.findWhere(state.Torch.flickers, { id: obj.id });
	            if (found) {
	                delete state.Torch.flickers[obj.id];
	            }
	        }
	    },

	    checkInstall = function () {
	        if (!_.has(state, 'Torch') || state.Torch.version !== schemaVersion) {
	            log('Torch: Resetting state');
	            /* Default Settings stored in the state. */
	            state.Torch = {
	                version: schemaVersion,
	                flickers: {}
	            };
	        }

	        flickerInterval = setInterval(animateFlicker, flickerPeriod);
	        for (var i = 0; i < commands.length; i++) {
	            Shell.registerCommand(commands[i].command, commands[i].command + " " + commands[i].usage, commands[i].description, handleInput);
	        }

	    },

	    registerEventHandlers = function () {
	        on('chat:message', handleInput);
	        on('destroy:graphic', handleTokenDelete);
	    };

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
}());

/*  ############################################################### */
/*  APIHeartbeat */
/*  ############################################################### */
// Github:   https://github.com/shdwjk/Roll20API/blob/master/APIHeartBeat/APIHeartBeat.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron

var APIHeartBeat = APIHeartBeat || (function () {
    'use strict';

    var version = 0.3,
        schemaVersion = 0.2,
        beatInterval = false,
        beatPeriod = 200,
        devScaleFactor = 5,
        beatCycle = 3000,

    scaleColorRange = function (scale, color1, color2) {
        return _.chain(
            _.zip(
                    _.rest(color1.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)),
                    _.rest(color2.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/))
                )
            )
            .map(function (d) {
                var b1 = parseInt(d[0], 16),
                    b2 = parseInt(d[1], 16);
                return Math.min(255, Math.max(0, ((b2 - b1) * scale + b1).toFixed(0))).toString(16);
            })
            .reduce(function (memo, d) {
                return memo + (1 === d.length ? '0' : '') + d;
            }, '#')
            .value();
    },

    animateHeartBeat = function () {
        var cycle = beatCycle * (state.APIHeartBeat.devMode ? 1 : devScaleFactor),
            x = ((Date.now() % cycle) / cycle) * Math.PI * 2,
            scale = (Math.sin(x) + 1) / 2;

        _.chain(state.APIHeartBeat.heartBeaters)
            .map(function (d) {
                return {
                    player: getObj('player', d.pid),
                    color1: d.color1,
                    color2: d.color2
                };
            })
            .reject(function (d) {
                return !d.player || !d.player.get('online');
            })
            .each(function (d) {
                d.player.set({
                    color: scaleColorRange(scale, d.color1, d.color2)
                });
            });
    },

    startStopBeat = function () {
        var userOnline = _.chain(
                    _.keys(state.APIHeartBeat.heartBeaters)
                )
                .map(function (pid) {
                    return getObj('player', pid);
                })
                .reject(_.isUndefined)
                .map(function (p) {
                    return p.get('online');
                })
                .reduce(function (memo, os) {
                    return memo || os;
                }, false)
                .value(),
            period = beatPeriod * (state.APIHeartBeat.devMode ? 1 : devScaleFactor);

        if (!beatInterval && _.keys(state.APIHeartBeat.heartBeaters).length && userOnline) {
            beatInterval = setInterval(animateHeartBeat, period);
        } else if (beatInterval && (!_.keys(state.APIHeartBeat.heartBeaters).length || !userOnline)) {
            clearInterval(beatInterval);
            beatInterval = false;
        }
    },

    ch = function (c) {
        var entities = {
            '<': 'lt',
            '>': 'gt',
            "'": '#39',
            '@': '#64',
            '{': '#123',
            '|': '#124',
            '}': '#125',
            '[': '#91',
            ']': '#93',
            '"': 'quot',
            '-': 'mdash',
            ' ': 'nbsp'
        };

        if (_.has(entities, c)) {
            return ('&' + entities[c] + ';');
        }
        return '';
    },

    showHelp = function (who) {
        sendChat('',
    		'/w ' + who + ' '
+ '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
	+ '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">'
		+ 'APIHeartBeat v' + version
	+ '</div>'
	+ '<div style="padding-left:10px;margin-bottom:3px;">'
		+ '<p>APIHeartBeat provides visual feedback that the API is running by changing a user' + ch("'") + 's color periodically.</p>'
	+ '</div>'
	+ '<b>Commands</b>'
	+ '<div style="padding-left:10px;">'
		+ '<b><span style="font-family: serif;">!api-heartbeat ' + ch('<') + '<i>--help</i>|<i>--off</i>|<i>--dev</i>' + ch('>') + ' ' + ch('[') + ch('<') + 'color' + ch('>') + ch(']') + ' ' + ch('[') + ch('<') + 'color' + ch('>') + ch(']') + '</span></b>'

		+ '<div style="padding-left: 10px;padding-right:20px">'
			+ '<p>This command allows you to turn off and on the monitor, as well as configure it.</p>'
			+ '<ul>'
				+ '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
					+ '<b><span style="font-family: serif;">' + ch('<') + '--help' + ch('>') + '</span></b> ' + ch('-') + ' Displays this help.'
				+ '</li> '
				+ '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
					+ '<b><span style="font-family: serif;">' + ch('<') + '--off' + ch('>') + '</span></b> ' + ch('-') + ' Turns off the heartbeat for the current player.'
				+ '</li> '
				+ '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
					+ '<b><span style="font-family: serif;">' + ch('<') + '--dev' + ch('>') + '</span></b> ' + ch('-') + ' Activates development mode. (<b>Warning:</b> This mode updates much more often and could contribute to performance issues, despite being great for script development.)'
				+ '</li> '
				+ '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
					+ '<b><span style="font-family: serif;">' + ch('<') + 'color' + ch('>') + '</span></b> ' + ch('-') + ' The script alternates between two colors.  If you specify 2 colors, it will use those.  If you specify 1 color, it will use that and your configured color. If you specify no colors, it will go between your configured color and black or red based on brightness.</b>'
				+ '</li> '
			+ '</ul>'
		+ '</div>'
	+ '</div>'
+ '</div>'
        );
    },

    counterColor = function (color) {
        if (parseInt(
            _.first(
                _.rest(
                    (_.isString(color) ? color : '').match(/^#([0-9a-fA-F]{2})/) || []
                )
            ) || '00',
            16) > 127
        ) {
            return '#000000';
        }
        return '#ff0000';
    },

    handleInput = function (msg) {
        var args, errors, player, who, color;

        if (msg.type !== "api" && !isGM(msg.playerid)) {
            return;
        }
        player = getObj('player', msg.playerid);
        who = player && player.get('_displayname').split(' ')[0];

        args = msg.content.split(/\s+/);
        switch (args.shift()) {
            case '!api-heartbeat':

                if (_.contains(args, '--help')) {
                    showHelp(who);
                    return;
                }

                if (_.contains(args, '--off')) {
                    // turn off
                    if (state.APIHeartBeat.heartBeaters[msg.playerid]) {
                        color = state.APIHeartBeat.heartBeaters[msg.playerid].origColor;
                        delete state.APIHeartBeat.heartBeaters[msg.playerid];
                        startStopBeat();
                        player.set({ color: color });
                    }
                    sendChat('APIHeartBeat', '/w ' + who + ' Off for ' + player.get('displayname') + '.');
                } else {
                    if (_.contains(args, '--dev')) {
                        state.APIHeartBeat.devMode = !state.APIHeartBeat.devMode;
                        clearInterval(beatInterval);
                        beatInterval = false;
                        sendChat('APIHeartBeat', '/w ' + who + ' Dev Mode is now ' + (state.APIHeartBeat.devMode ? 'ON' : 'OFF') + '.');
                        args = _.chain(args).without('--dev').first(2).value();
                        if (!args.length) {
                            startStopBeat();
                            return;
                        }
                    }

                    errors = _.reduce(args, function (memo, a) {
                        if (!a.match(/^(?:#?[0-9a-fA-F]{6})$/)) {
                            memo.push("Invalid color: " + a);
                        }
                        return memo;
                    }, []);

                    if (errors.length) {
                        sendChat('APIHeartBeat', '/w ' + who + ' Errors: ' + errors.join(' '));
                    } else {
                        switch (args.length) {
                            case 2:
                                state.APIHeartBeat.heartBeaters[msg.playerid] = {
                                    pid: msg.playerid,
                                    origColor: player.get('color'),
                                    color1: args[0],
                                    color2: args[1]
                                };
                                break;
                            case 1:
                                state.APIHeartBeat.heartBeaters[msg.playerid] = {
                                    pid: msg.playerid,
                                    origColor: player.get('color'),
                                    color1: player.get('color'),
                                    color2: args[0]
                                };
                                break;
                            default:
                                state.APIHeartBeat.heartBeaters[msg.playerid] = {
                                    pid: msg.playerid,
                                    origColor: player.get('color'),
                                    color1: player.get('color'),
                                    color2: counterColor(player.get('color'))
                                };
                        }
                        sendChat('APIHeartBeat', '/w ' + who + ' Configured on for ' + player.get('displayname') + '.');
                    }
                    startStopBeat();
                }
                break;
        }
    },

    checkInstall = function () {
        if (!_.has(state, 'APIHeartBeat') || state.APIHeartBeat.version !== schemaVersion) {
            log('APIHeartBeat: Resetting state');
            state.APIHeartBeat = {
                version: schemaVersion,
                devMode: false,
                heartBeaters: {}
            };
        }

        startStopBeat();
    },

    registerEventHandlers = function () {
        on('chat:message', handleInput);
        on('change:player:_online', startStopBeat);
    };

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };

}());


/*  ############################################################### */
/*  Vamyan-util */
/*  ############################################################### */
// My stuff

var Util = Util || {


    /*
    * Set various token markers based on bar cur/max ratios
	* 
	* The CONFIG array can have any number of configuration objects. These objects
	* are processed in order.
	* 
	* barId - The ID of the bar to look at the values for [1, 2, 3]
	* comparison - Type of comparison to make "[exact|below|between|enforcemax]"
	* value - The ratio [0 - 1] or value to use in the comparison
	* max - The max value to use in the comparison
	* status - The name of the status marker to toggle [redmarker, bluemarker, greenmarker, brownmarker, purplemarker, dead]
	* stateWhenTrue - The state of the marker when the comparison is true [true, false]
	* isRatio - Whether barRatio should be used as an exact bar value or a ratio [true, false]
	*/
    CONFIG: [
	{ barId: 3, comparison: "between", value: 0.5001, max: 0.9999, status: "brownmarker", stateWhenTrue: true, isRatio: true },
	{ barId: 3, comparison: "between", value: 0.001, max: 0.5, status: "redmarker", stateWhenTrue: true, isRatio: true },
	{ barId: 3, comparison: "exact", value: 0, status: "interdiction", stateWhenTrue: true, isRatio: true },
	{ barId: 3, comparison: "below", value: -1, status: "dead", stateWhenTrue: true, isRatio: false },
	{ barId: 1, comparison: "below", value: 0.001, status: "ninja-mask", stateWhenTrue: false, isRatio: false, numericOnly: true },
	{ barId: 3, comparison: "enforcemax" }
    ],


    version: 0.01,
    debug: true,
    active: true,
	sheets: {
		"HORNYCRICKET": [
			{
			    character_name: "Hornycricket (Arlyn R.)",
			    represents: '-K0EefaegFQ3aIKqwj5W',
			    name: 'Hornycricket',
                emote: "shifts back to normal.",
			    bar3_link: 'sheetattr_hp',
			    side: 0,
			    width: 70,
			    height: 70
		    },
		    {
		        character_name: "Hornycricket (Arlyn R.)",
		        form: "Brown Bear",
			    represents: '-K1gRdh-f5MnWX9bu7Z4',
			    name: 'Fluffy Butterscotch (Cricket)',
                emote: "shimmers slightly as her form bursts forth into the form of a great Brown Bear!",
                bar3_link: 'sheetattr_hp',
                side: 1,
			    width: 140,
			    height: 140
		    },
		    {
		        character_name: "Hornycricket (Arlyn R.)",
		        form: "Giant Spider",
			    represents: '-K1gIvWoFpQlyPSQ_xar',
			    name: 'Spidercricket',
                emote: "sprouts four more appendages and becomes a giant spider!",
                bar3_link: 'sheetattr_hp',
                side: 2,
			    width: 140,
			    height: 140
		    },
		    {
		        character_name: "Hornycricket (Arlyn R.)",
		        form: "Dire Wolf",
			    represents: '-K3GpxR7sFEnkadp4sdk',
			    name: 'Dire Holo (Cricket)',
                emote: "crouches down on all fours and shifts into a dire lupine.",
                bar3_link: 'sheetattr_hp',
                side: 3,
			    width: 140,
			    height: 140
		    }
		],
		"GA-BO": [
		    {
		        represents: '-',
		        name: 'Ga-Bo',
		        bar3_link: '-',
		        side: 0,
		        width: 70,
		        height: 70
		    }

		],
		"TREEHUMPER": [
           {
               character_name: "Treehumper",
               represents: '-K94m1RsdK0jN7o6YSsg',
               name: 'Treehumper',
               emote: 'shimmers as he returns to normal.',
               bar2_link: 'ac',
               bar3_link: 'HP',
               action: "Bonus Action",
               side: 0,
               width: 70,
               height: 70
           },
           {
               form: 'Wolf',
               character_name: "Treehumper",
               represents: '-K9nj42B6oCki8e13lJY',
               name: 'Treehumper',
               emote: "shimmers, his legs twist and tendons snap into a new angle, every pore on his body screams at the sudden penetration of fur through his epidermis, his skull shifts, breaks, and reforms as it elongates into a snarled furry face. The cheers of fleas rise up in a joyuous cocophany as they go into a ravenous feeding frenzy.",
               bar2_link: 'npc_AC',
               bar3_link: 'HP',
               action: "Action",
               side: 1,
               width: 70,
               height: 70
           },
           {
               form: 'Horse',
               character_name: "Treehumper",
               represents: '-K9nnZIOp09YdVgSTkT9',
               name: 'Treehumper',
               emote: "turns into a horse. Ride him.",
               bar2_link: 'npc_AC',
               bar3_link: 'HP',
               action: "Action",
               side: 2,
               width: 70,
               height: 210
           },
		]

	},
	echoenabled: true,
	commands: {
        roll: function (args, msg) {
            args.shift();
            Shell.write("Roll: " + Util.Roll(args[0]) || "Error","gm",undefined,"Util.Roll");
        },
        changetokenside: function (args, msg) {
            log(args);
            args.shift();
            var token = Util.GetSelectedTokens(msg)[0],
                side = args[0];
            log(token);
            log("changetokenside: token ^  Side: " + side);
            Util.ChangeTokenSide(token,side);
        },
	    dmecho: function (args, msg) {
	        var showHelp = function (who) {
	            sendChat('', '/w ' + who + ' ' +
                    '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">' +
                        '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">' +
                            'GM Echo v1' +
                        '</div>' +
                        '<div style="padding-left:10px;margin-bottom:3px;">' +
                            '<p>Shows players a filtered version of DM template rolls.</p>' +
                        '</div>' +
                        '<b>Commands</b>' +
                        '<div style="padding-left:10px;">' +
                            '<b><span style="font-family: serif;">!dmecho</span></b>' +
                            '<div style="padding-left: 10px;padding-right:20px">' +
                                '<p>Currently, this just displays the help, which is used for configuring.</p>' +
                                '<ul>' +
                                    '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">' +
                                        '<b><span style="font-family: serif;">--help</span></b> ' + ch('-') + ' Displays the help and configuration options.' +
                                    '</li> ' +
                                '</ul>' +
                            '</div>' +
                        '</div>' +
                        '<b>Config</b>' +
                        '<div>' +
                            //getAllConfigOptions() +
                        '</div>' +
                    '</div>'
                );
	        },
            getConfigOption_DMEcho = function () {
                var text = (Util.echoenabled
                        ? '<span style="color: green; font-weight:bold;">On</span>'
                        : '<span style="color: red; font-weight:bold;">Off</span>');

                return '<div>' +
                    'DM Echo is currently <b>' +
                        text +
                    '</b>.' +
                    '<a href="!dmecho">Toggle</a>' +
                '</div>';
            };



	        Util.echoenabled = !Util.echoenabled;
	        Shell.write(getConfigOption_DMEcho(), "gm", "", "DM Echo");

        },
        massinit: function (args, msg) {
            var tokens = Util.GetSelectedTokens(msg);
            var i = 0,
                max = tokens.length;
            if (max) {
                Shell.write("Rolling mass initiative.", "gm", "emote", "Utility");
                for (i = 0; i < max; i++) {
                    Shell.write("%{" + tokens[i].name + "|Initiative}");
                }
            }

        },
        dumptokens: function (args, msg) {
            var tokens = Util.GetSelectedTokens(msg);
            //log(tokens);
            var i = 0,
				max = tokens.length;
            if (max) {
                log("Selected tokens: ");
                for (i = 0; i < max; i++) {
                    log(tokens[i]);
                }
            }
        },
        dumpstate: function (args, msg) {
            Shell.writeAndLog(JSON.stringify(state));
        },
        wildshape: function (args, msg) {
            args.shift();
            var token = Util.GetSelectedTokens(msg)[0],
				form = args[1] || '', // type name
				newinfo = ''
				    ;
            newinfo = Util.sheets[token.get("gmnotes")][args[0]];
            if (!newinfo) {
                newinfo = Util.sheets[token.get("gmnotes")][0];
            }
            if (!token) {
                token = getObj('graphic', args[1]);
            }
            if (token && newinfo) {
                //var b2v = Util.Roll(getAttrByName(newinfo.represents, "passive_perception", "current"));
                //sendChat("Util Debug: roll result: " + b2v);
                token.set({
                    name: newinfo.name || "Not found",
                    represents: newinfo.represents || "",
                    bar2_link: "sheetattr_" + (newinfo.bar2_link ? newinfo.bar3_link : "ac"),
                    bar3_link: "sheetattr_" + (newinfo.bar2_link ? newinfo.bar3_link : "HP"),
                    width: newinfo.width || 70,
                    height: newinfo.height || 70
                });

                Util.SetTokenValue(getAttrByName(newinfo.represents, newinfo.bar2_link, "current"), token, "bar2_value");
                Util.SetTokenValue(getAttrByName(newinfo.represents, newinfo.bar2_link, "max"), token, "bar2_max");
                Util.SetTokenValue(getAttrByName(newinfo.represents, newinfo.bar2_link + "_armor_calc", "current"), token, "bar2_value");
                Util.SetTokenValue(getAttrByName(newinfo.represents, newinfo.bar2_link + "_armor_calc", "max"), token, "bar2_max");
                Util.SetTokenValue(getAttrByName(newinfo.represents, newinfo.bar3_link, "current"), token, "bar3_value");
                Util.SetTokenValue(getAttrByName(newinfo.represents,newinfo.bar3_link,"max"),token,"bar3_max");
                Util.ChangeTokenSide(token, newinfo.side);

                shaped_utility.initPlayerToken(token);
                
                var output = "";

                output += "@{" + newinfo.character_name + "|output_option} ";
                output += "&{template:5eDefault} ";
                output += "{{action=1}} ";
                output += "{{character_name=@{" + newinfo.character_name + "|character_name}}} ";
                output += "@{" + newinfo.character_name + "|show_character_name} ";
                output += "{{title=Wild Shape}} ";
                output += "{{subheader=" + newinfo.action + "}} ";
                output += "{{subheader2=" + ("undefined" === typeof(newinfo.form) ? "Revert" : newinfo.form) + "}} ";
                output += "{{emote=" + ("undefined" === typeof(newinfo.emote) ? "shimmers as she changes into another form." : newinfo.emote) + "}} ";
                if (newinfo.side != 0) { output += "{{effect=@{" + newinfo.character_name + "|classactionoutput1}}}"; }
                Shell.write(output, undefined, undefined, "" + newinfo.character_name + "");

            }
            else {
                Shell.writeErr("Invalid new info or token. Logging args and msg.");
                log(args);
                log(msg);
                if (token) { log(token); }
            }
        }
    },

	MonitorTokenSides: function(obj,prev) {
	    log(prev);
	    log("Side: " + obj.get("side"));
	    if ("undefined" !== typeof (prev)) {
	        if (obj.get("side") != prev["side"]) { // Side changed. Get info from Util.sheets
	            var newinfo = Util.sheets[obj.get("side")];
	            token.set({
	                name: newinfo.name || "Not found",
	                represents: newinfo.represents || "",
	                bar3_link: newinfo.bar3_link || "sheetattr_HP",
	                bar3_value: getAttrByName(newinfo.represents, "HP", "current"),
	                bar3_max: getAttrByName(newinfo.represents, "HP", "max"),
	                width: newinfo.width || 70,
	                height: newinfo.height || 70
	            });
                	            
	            var output = "";

	            output += "@{" + newinfo.character_name + "|output_option} ";
	            output += "&{template:5eDefault} ";
	            output += "{{action=1}} ";
	            output += "{{character_name=@{" + newinfo.character_name + "|character_name}}} ";
	            output += "@{" + newinfo.character_name + "|show_character_name} ";
	            output += "{{title=Wild Shape}} ";
	            output += "{{subheader=Bonus Action}} ";
	            output += "{{subheader2=" + newinfo.form || "Revert" + "}} ";
	            output += "{{emote=" + newinfo.emote || "shimmers as she changes into another form" + "}} ";
	            if (newinfo.side != 0) {
	                output += "{{effect=@{" + newinfo.character_name + "|classactionoutput1}}}";
	                token.set({ bar3_value: getAttrByName(newinfo.represents, "HP", "max") });
	            }
	            Shell.write(output, undefined, undefined, "" + newinfo.character_name + "");
	        }
	    }

	},
    MonitorToken: function (obj, prev) {
        Util.CONFIG.forEach(function (opts) {
            //log(opts);
            if (opts) {
                // barId, comparison, value, max, status, stateWhenTrue, isRatio
                var barValue = obj.get("bar" + opts.barId + "_value") || '',
					barMax = obj.get("bar" + opts.barId + "_max") || '',
					maxValue = parseInt(barMax, 10),
					curValue = parseInt(barValue, 10),
					markerName = "status_" + opts.status;
                //log("Opts: ");
                //log(opts);
                //log("barValue: "+barValue);
                //log("barMax: "+barMax);
                //log("curValue: "+curValue);
                //log("maxValue: "+maxValue);

                switch (opts.comparison) {
                    case "exact":
                        // uses: barId, value, status, stateWhenTrue, isRatio
                        if (
							(
								!opts.isRatio &&
								curValue == opts.value
							) || (
								opts.isRatio &&
								!isNaN(barValue) &&
								!isNaN(barMax) &&
								curValue == Math.floor(maxValue * opts.value)
							)
						) {
                            obj.set(markerName, opts.stateWhenTrue);
                        }
                        else {
                            obj.set(markerName, !opts.stateWhenTrue);
                        }
                        break;
                    case "below":
                        // uses: barId, value, status, stateWhenTrue, isRatio, numericOnly
                        if (opts.numericOnly && isNaN(curValue)) {
                            obj.set(markerName, false);
                            break;
                        }
                        if ((
								!opts.isRatio && ((
									!isNaN(curValue) &&
									curValue <= opts.value
								) || (
									isNaN(curValue) &&
									barValue === opts.max
								))
							) || (
								opts.isRatio &&
								!isNaN(curValue) &&
								!isNaN(maxValue) &&
								curValue <= (maxValue * opts.value)
							)
						) {
                            //log("Setting token marker: " + markerName + " State: " + opts.stateWhenTrue);
                            obj.set(markerName, opts.stateWhenTrue);
                        }
                        else {
                            //log("Setting token marker: " + markerName + " State: " + !opts.stateWhenTrue);
                            obj.set(markerName, !opts.stateWhenTrue);
                        }
                        break;
                    case "between":
                        // uses: barId, value, max, status, stateWhenTrue, isRatio
                        if (
							(
								!opts.isRatio &&
								curValue >= opts.value &&
								curValue <= opts.max
							) || (
								opts.isRatio &&
								!isNaN(curValue) &&
								!isNaN(maxValue) &&
								curValue >= (maxValue * opts.value) &&
								curValue <= (maxValue * opts.max)
							)
						) {
                            obj.set(markerName, opts.stateWhenTrue);
                        }
                        else {
                            obj.set(markerName, !opts.stateWhenTrue);
                        }

                        //log("(maxValue * opts.value): "+(maxValue * opts.value));
                        //log("(maxValue * opts.max): "+(maxValue * opts.max));

                        //log(obj);
                        break;
                    case "enforcemax":
                        if (
							!isNaN(curValue) &&
							!isNaN(maxValue) &&
							curValue > maxValue
						) {
                            obj.set("bar" + opts.barId + "_value", maxValue);
                            //log(obj.get("name") + ": Enforcing Max value on bar [" + maxValue + "]");
                        }
                        break;
                    default:
                        break;
                }
                /*                  if (opts.enforceRatio) {
										if (curValue > (maxValue * opts.barRatio)) {
											obj.set("bar" + opts.barId + "_value", (maxValue * opts.barRatio));
										}
									}
									else {
										if (opts.exactvalue && curValue == opts.barRatio) {
											obj.set(markerName, opts.whenLow);
										}
										else if (curValue <= (maxValue * opts.barRatio)) {
											obj.set(markerName, opts.whenLow);
										}
										else {
											obj.set(markerName, !opts.whenLow);
										}
									}
								}
				*/
            }
        });
        if (obj["side"] != prev["side"]) {
            Util.MonitorTokenSides(obj, prev);
            log("Side change: calling MonitorTokenSides");
        }
        else {
            //log("Side not changed. " + obj["side"] + " (" + obj.get("side") + ") -- Previous: " + prev["side"]);
        }
    },
    SetTokenValue: function (formula, token, barname) {
        if (formula) {
            sendChat('Util', '/roll ' + formula, function (ops) {
                var rollResult = JSON.parse(ops[0].content);
                if (_.has(rollResult, 'total')) {
                    token.set(barname, rollResult.total);
                    log("Rolled " + formula + " -- Result: " + rollResult.total);
                }
            });
        }
        else {
            log("Bad formula passed to SetTokenValue. Bar name: " + barname);
            return;
        }
    },
    Roll: function (expression, sheet_id) {
        var rollResult = '';
        //log("Attempting to roll: " + expression + " on Sheet " + sheet_id);
        sendChat("Util:Roll", "[[" + expression + "]]", function (ops) {
            // ops will be an ARRAY of command results
            log(ops[0].inlinerolls[0]);
            rollResult = ops[0].inlinerolls[0].results.total;
            //log("Util:Roll: Rolling " + expression + " --> " + rollResult);
            //Now do something with rollresult, just like you would during a chat:message event...
            if (_.has(rollResult, 'total')) {
                return rollResult.total;
            }
        });
    },

    CheckInstall: function () { return true; },

    ChangeTokenSide: function(token,newside) {
        var allsides = token.get("sides").split("|");
        log(allsides);
        Util.setImg(token,newside,allsides);
    },
    getCleanImgsrc: function (imgsrc) {
        // https://s3.amazonaws.com/files.d20.io/marketplace/5692/am-hjD0fricrGJ_OZt5mLw/max.png?1339820020"
        var parts = imgsrc.match(/(.*\/images\/.*)(thumb|med|max)(.*)$/);
        if(parts) {
            return parts[1]+'thumb'+parts[3];
        }
        return;
    },
    setImg: function (o, nextSide, allSides) {
        log("setImg: nextSide: " + nextSide + " allSides[nextSide]: " + allSides[nextSide]);
        var nextURL = decodeURIComponent(allSides[nextSide]);
        log("Next URL pre-clean: " + nextURL);
        nextURL = Util.getCleanImgsrc(nextURL);
        log("Next URL: " + nextURL);

        if (nextURL) {
            o.set({
                currentSide: nextSide,
                imgsrc: nextURL
            });
        }
        return nextURL;
    },
    setImgUrl: function (o, nextSide, nextURL) {
        if (nextURL) {
            o.set({
                currentSide: nextSide,
                imgsrc: nextURL
            });
        }
    },

    HandleGraphicChange: function (obj, prev) {
        /*      //if (prev.currentSide != obj.get("currentSide")) {
					//log('DEBUG: ' + prev.currentSide + " -> " + obj.get("currentSide"));
					log('Side change:');
					log('- Token name: ' + obj.get('name'));
					log('- Token ID: ' + obj.get('_id'));
					log('- Token side: ' + prev.currentSide + " -> " + obj.get('currentSide'));
					log('- Represents: ' + obj.get('represents'));
					log('- bar3 link: ' + obj.get('bar3_link'));
					log('- width: ' + obj.get('width'));
					log('- height: ' + obj.get('height'));
					log('- imgsrc: ' + obj.get('imgsrc'));
					log('- sides: ' + obj.get('sides'));
					log(obj);
				//}
		*/  },


    Stealth: function (msg, obj) {

        token = Util.FindActiveToken(msg, obj.sheet);
        // obj.sheet, .roll, .advroll, .name
        //log("Util: Stealth: " + obj.name + " ["+obj.roll+"] ["+obj.advroll+"]"+" " +sheet.id+obj.sheet.name);
        if (!token) {
            log("No token selected.");
            return;
        }
        token.set({
            "status_ninja-mask": true,
            bar1_value: obj.roll,
            bar1_max: 20
        });
        //log(token.get('bar1_value') + " / " + token.get('bar1_max'));
    },

    GetSelectedTokens: function (msg) {
        //log(msg.content + " -- " + msg.type + "--" + msg['selected'].length);
        var selectedtokens = [],
		numselected;
        //return selectedtokens;
        try {
            if (!msg.selected || !msg.selected.length) {
                //throw('No token selected');
                return selectedtokens;
            }
            numselected = msg.selected.length;
            //log("Selected: " + msg['selected'].length);
            for (var i = 0; i < numselected; i++) {
                if (msg['selected'][i]._type === 'graphic') {
                    var obj = getObj('graphic', msg['selected'][i]._id);
                    if (obj && obj.get('subtype') === 'token') {
                        selectedtokens.push(obj);
                    }
                }
            }
            return selectedtokens;
        } catch (e) {
            log('Exception: ' + e);
        }
    },
    getSelectedToken: function (msg, callback) {
        try {
            if (!msg.selected || !msg.selected.length) {
                throw ('No token selected');
            }

            for (var i = 0; i < msg.selected.length; i++) {
                if (msg.selected[i]._type === 'graphic') {
                    var obj = getObj('graphic', msg.selected[i]._id);
                    if (obj && obj.get('subtype') === 'token') {
                        callback(obj, arguments[2]);
                    }
                }
            }
        } catch (e) {
            Util.messageToChat('Exception: ' + e);
            log(msg);
        }
    },
    FindActiveToken: function (msg, sheet) {
        var token,
		pageid;
        //log(sheet);
        //log(Campaign().get('playerspecificpages')[msg.playerid]);
        if (Campaign().get('playerspecificpages')) {
            pageid = Campaign().get('playerspecificpages')[msg.playerid];
        }
        if (!pageid) {
            pageid = Campaign().get('playerpageid');
        }

        token = findObjs({
            _pageid: pageid,
            _type: 'graphic',
            represents: sheet.id
        })[0];
        //log(sheet._id);
        //log(pageid + " - " + sheet._id);
        if (!token) {
            log("No token on player's active page for this sheet.");
            return;
        }
        return token;
    },


    HandleMessages: function (msg) {
        //log(msg);
        var commandExecuter = msg.who;

        //log(commandExecuter + ": " + msg.content);
        /*
        attack_roll	1		green banner
        action	1		green banner
        spell	1		purple banner
        ability	1		teal banner
        save	1		red banner
        deathsave	1		black banner
        title	any		value as title in banner
        character_name	any	show_character_name	value in subheader
        subheader	any		value as subheader in banner
        subheaderright	any	subheader	value as right subheader
        subheader2	any		value as second subheader in banner
        subheaderright2	any	subheader2	value as right second subheader
        targetName	any		"vs." value in subheader of banner
        emote	any		framed value as emote at top of template
        */
        
        if (msg.rolltemplate === '5eDefault') {
            var attack_roll,
                action,
                spell,
                ability,
                save,
                deathsave,character_name,
			stealth,
			stealth_roll,
			stealth_roll_adv,
			title,
			rollmatch,
			match,
			rollregex = /\$\[\[(.*?)\]\]/i,
			regex = /\{\{(.*?)=(.*?)\}\}/gi;
            if (msg.content.indexOf("Stealth") > -1) {

                while (match = regex.exec(msg.content)) {
                    //log(match);
                    if (match[1]) {
                        //var splitAttr = match[1].split('=');
                        switch (match[1]) {
                            case 'character_name':
                                character_name = match[2];
                                break;
                            case 'roll':
                                rollmatch = rollregex.exec(match[2]);
                                //log("Roll Match: " + rollmatch + " from " + splitAttr[1]);
                                if (rollmatch) {
                                    stealth_roll = rollmatch[1];
                                }
                                break;
                            case 'rolladv':
                                rollmatch = rollregex.exec(match[2]);
                                if (rollmatch) {
                                    stealth_roll_adv = rollmatch[1];
                                }
                                break;
                            default:
                                //log("Unused option: " + splitAttr[0] + " = " + splitAttr[1]);
                                break;
                        }
                    }
                }
                //log(msg.inlinerolls);
                //log("Stealth roll ID: " + stealth_roll + " Advantage ID: " + stealth_roll_adv);
                //log("Roll: " + msg.inlinerolls[stealth_roll]);
                var obj = {
                    sheet: findObjs({
                        _type: 'character',
                        name: character_name
                    })[0],
                    roll: (msg.inlinerolls[stealth_roll] ? msg.inlinerolls[stealth_roll].results.total : 0),
                    advroll: (msg.inlinerolls[stealth_roll_adv] ? msg.inlinerolls[stealth_roll_adv].results.total : 0),
                    name: character_name
                };
                log(obj.sheet["_id"]);
                Util.Stealth(msg, obj);
            }
        }
        return;
    },
    messageToChat: function (message,commandExecuter) {
        log(message);
        sendChat('Vamyan Utility', '/w gm ' + message);
        if (commandExecuter && commandExecuter.indexOf('(GM)') === -1) {
            sendChat('Vamyan Utility', '/w \"' + commandExecuter + '\" ' + message);
        }
    },

    RelayTemplateHeaders: function (data, msg) {
        if (!Util.echoenabled) { return; }
        var headers = [
            "attack_roll",
            "action",
            "spell",
            "ability",
            "save",
            "deathsave",
            "title",
            "character_name",
            "subheader",
            "subheaderright",
            "subheader2",
            "targetName",
            "emote",
            "freetext",
            "freetextname",
            "rollname",
            "action_type",
            "reach",
            "range",
            "target",
            "save_condition",
            "save_dc",
            "action_save_stat",
            "save_success",
            "save_failure",
            "spellfriendlylevel",
            "spell_cast_as_level",
            "spellschool",
            "spell_components_verbal",
            "spell_components_somatic",
            "spell_components_material",
            "spell_casting_time",
            "spellduration",
            "spellsource",
            "spellconcentration",
            "spellritual",
            "spelldescription",
            "aoe",
            "effects",
            "spellhigherlevel",
            "roll",
            "rolladv"
        ];
        var rollregexp = /\$\[\[.*?\]\]/g;
        var headertype = "grey";
        var output = "&{template:5eDefault} ";
        if ("gm" === msg.target && isGM(msg.playerid)) { // This should catch any GM-to-GM headers. Probably a better way to do this.
            if (data && data.length) {
                for (var i = 0; i < data.length; i++) {
                    switch (data[i][0]) {
                        case "attack_roll":
                        case "action":
                            headertype = "green";
                            break;
                        case "spell":
                            headertype = "purple";
                            break;
                        case "ability":
                            headertype = "teal";
                            break;
                        case "save":
                            headertype = "red";
                            break;
                        case "deathsave":
                            headertype = "black";
                            break;
                        default:
                    }
                    output += data[i][2] + " ";
                }
            }
            switch (headertype) {
                case "green":
                case "purple":
                case "red":
                case "black":
                    break;
                case "grey":
                case "teal":
                    return;
            }
            output = output.replace(rollregexp, "?");
            Shell.write(output, undefined, undefined, "GM-Roll");
            log(output);
            log("target: " + msg.target + " isGM: " + isGM(msg.playerid));
        }
    },

    RegisterEventHandlers: function () {
        on('chat:message', Util.HandleMessages); // NO API HANDLING. API handled by Shell.
        //on('change:graphic', Util.HandleGraphicChange);

        on("change:token", Util.MonitorToken);
        //on("change:token:side", Util.MonitorTokenSides);

    },

    init: function () {
        'use strict';
        Shell.registerCommand("!wildshape", "!wildshape <args>",
                            "Description here", Util.commands.wildshape);
        Shell.registerCommand("!dmecho", "!dmecho",
                            "Description here", Util.commands.dmecho);
        Shell.registerCommand("!roll", "!roll <args>",
                            "Description here", Util.commands.roll);
        Shell.registerCommand("!dumptokens", "!dumptokens",
                            "Description here", Util.commands.dumptokens);
        Shell.registerCommand("!dumpstate", "!dumpstate",
                            "Description here", Util.commands.dumpstate);
        Shell.registerCommand("!cts", "!cts <side>",
                            "Description here", Util.commands.changetokenside);

        Util.CheckInstall();
        Util.RegisterEventHandlers();
        log("Util initiated.");
    }

    /*    return {
            RegisterEventHandlers: Util.RegisterEventHandlers,
            CheckInstall: CheckInstall,
            rollCommand: Util.commands.roll,
            wildshapeCommand: Util.commands.wildshape,
            dumptokensCommand: Util.commands.dumptokens
        };*/

};



/*  ############################################################### */
/*  Shell */
/*  ############################################################### */
var Shell = Shell || {
    commands: {},
    actions: {},

    // I/O functions

    rawWrite: function (s, to, style, from) {
        s = s.replace(/\n/g, "<br>");
        s = "<div style=\"white-space: pre-wrap; padding: 0px; margin: 0px" + (style ? "; " + style : "") + "\">" + s + "</div>";
        if (to) {
            s = "/w " + to.split(" ", 1)[0] + " " + s;
        }
        sendChat((typeof (from) == typeof ("") ? from : "Shell"), s);
    },

    write: function (s, to, style, from) {
        Shell.rawWrite(s.replace(/</g, "<").replace(/>/g, ">"), to, style, from);
    },

    writeAndLog: function (s, to) {
        Shell.write(s, to);
        _.each(s.split("\n"), log);
    },

    writeErr: function (s) {
        Shell.writeAndLog(s, "gm");
    },

    sendChat: function (speakingAs, input) {
        if ((input.length <= 0) || (input.charAt(0) != '!')) {
            return sendChat(speakingAs, input);
        }
        var playerId = null;
        if (speakingAs.indexOf("player|") == 0) {
            playerId = speakingAs.substring(7);
        }
        function processCommand(msgs) {
            var doSend = true;
            for (var i = 0; i < msgs.length; i++) {
                var msg = _.clone(msgs[i]);
                if (playerId) {
                    msg.playerid = playerId;
                }
                if (Shell.handleApiMessage(msg)) {
                    doSend = false;
                }
            }
            if (doSend) { sendChat(speakingAs, input); }
        }
        sendChat(speakingAs, input, processCommand);
    },


    // command registration

    registerCommand: function (cmd, sig, desc, fn) {
        // error checking
        if (!cmd) {
            var errMsg = "Error: Cannot register empty command";
            if (sig) {
                errMsg += " (signature: " + sig + ")";
            }
            Shell.writeErr(errMsg);
            return;
        }
        if (!fn) {
            Shell.writeErr("Error: Cannot register command \"" + cmd + "\" without a callback");
            return;
        }

        // fix up the arguments if necessary
        if (cmd.charAt(0) != '!') {
            cmd = "!" + cmd;
        }
        if (!sig) {
            sig = cmd;
        }

        // check for already-registered command of the same name
        if (Shell.commands[cmd]) {
            if ((Shell.commands[cmd].signature != sig) || (Shell.commands[cmd].description != desc) || (Shell.commands[cmd].callback != fn)) {
                Shell.writeErr("Error: Command with name \"" + cmd + "\" already registered");
            }
            return;
        }

        // register command
        Shell.commands[cmd] = {
            signature: sig,
            description: desc,
            callback: fn
        };
        log("Shell: Command registered -- " + sig);
    },

    unregisterCommand: function (cmd) {
        // error checking
        if (!cmd) {
            Shell.writeErr("Error: Cannot unregister empty command");
            return;
        }

        // fix up argument if necessary
        if (cmd.charAt(0) != '!') {
            cmd = "!" + cmd;
        }

        // verify command exists
        if (!Shell.commands[cmd]) {
            Shell.writeErr("Error: Command \"" + cmd + "\" not registered");
            return;
        }

        // unregister command
        delete Shell.commands[cmd];
        if (state.Shell.userPermissions[cmd]) {
            delete state.Shell.userPermissions[cmd];
        }
    },

    // command registration

    registerTemplateAction: function (name, action, desc, fn) {
        // name, action, description, function
        // error checking
        if (!name) {
            var errMsg = "Error: Cannot register empty action";
            if (action) {
                errMsg += " (action: " + action + ")";
            }
            Shell.writeErr(errMsg);
            return;
        }
        if (!fn) {
            Shell.writeErr("Error: Cannot register action \"" + name + "\" without a callback");
            return;
        }

        if (!action) {
            action = name;
        }

        // check for already-registered action of the same name
        if (Shell.actions[name]) {
            if ((Shell.actions[name].action != action) || (Shell.actions[name].description != desc) || (Shell.actions[name].callback != fn)) {
                Shell.writeErr("Error: Ac with name \"" + name + "\" already registered");
            }
            return;
        }

        // register command
        Shell.actions[name] = {
            action: action,
            description: desc,
            callback: fn
        };
    },

    unregisterTemplateAction: function (name) {
        // error checking
        if (!name) {
            Shell.writeErr("Error: Cannot unregister empty command");
            return;
        }

        // fix up argument if necessary
        if (name.charAt(0) != '!') {
            name = "!" + name;
        }

        // verify command exists
        if (!Shell.actions[name]) {
            Shell.writeErr("Error: Command \"" + action + "\" not registered");
            return;
        }

        // unregister command
        delete Shell.actions[name];
        if (state.Shell.userPermissions[name]) {
            delete state.Shell.userPermissions[name];
        }
    },


    // utility functions

    tokenize: function (s) {
        var retval = [];
        var curTok = "";
        var quote = false;
        while (s.length > 0) {
            if (quote) {
                // in quoted string; look for terminating quote
                var idx = s.indexOf(quote);
                if (idx < 0) {
                    return "Error: Unmatched " + quote;
                }
                curTok += s.substr(0, idx);
                s = s.substr(idx + 1);
                quote = "";
                continue;
            }
            var idx = s.search(/[\s'"]/);
            if (idx < 0) {
                // no more quotes or whitespace, just add the rest of the string to the current token and terminate
                curTok += s;
                break;
            }
            curTok += s.substr(0, idx);
            var c = s.charAt(idx);
            s = s.substr(idx + 1);
            if ((c == "'") || (c == '"')) {
                // got a quote; start quoted string
                quote = c;
            }
            else {
                // got whitespace; push current token and start looking for a new token
                if (curTok) {
                    retval.push(curTok);
                }
                curTok = "";
            }
        }
        if (curTok) {
            retval.push(curTok);
        }
        return retval;
    },

    
    isRegisteredAction: function(action, data) {
        // iterate data searching for action, return true if found.
        for (var i = 0; i < data.length; i++) {
            if (action === data.action) {
                return true;
            }
        }
        return false;
    },

    // built-in commands

    helpCommand: function (args, msg) {
        var commandKeys = [];
        for (var cmd in Shell.commands) {
            if (Shell.hasPermission(msg, cmd)) {
                commandKeys.push(cmd);
            }
        }
        commandKeys.sort();
        var helpMsg = "";
        for (var i = 0; i < commandKeys.length; i++) {
            helpMsg += (i > 0 ? "\n" : "") + Shell.commands[commandKeys[i]].signature;
            if (Shell.commands[commandKeys[i]].description) {
                helpMsg += "\n\t" + Shell.commands[commandKeys[i]].description;
            }
        }
        if (helpMsg) {
            Shell.write("Shell Commands:", msg.who);
            Shell.write(helpMsg.replace(/\//g, "/"), msg.who, "font-size: small");
        }
    },

    permissionCommand: function (args, msg) {
        function showHelp() {
            Shell.write(args[0] + " add <command> [player]", msg.who);
            Shell.write("\tAdd permission for specified player to execute specified command.", msg.who);
            Shell.write("\tIf no player is specified, adds world-execute permission.", msg.who);
            Shell.write(args[0] + " remove <command> [player]", msg.who);
            Shell.write("\tRemove permission for specified player to execute specified command.", msg.who);
            Shell.write("\tIf no player is specified, removes world-execute permission.", msg.who);
        }

        if ((args.length > 1) && ((args[1] == "-h") || (args[1] == "--help") || (args[1] == "help"))) {
            showHelp();
            return;
        }
        if (args.length < 3) {
            Shell.write(args[0] + " requires at least two arguments: add|remove and a command", msg.who);
            showHelp();
            return;
        }
        if (!args[2]) {
            Shell.write("Unrecognized command: \"\"", msg.who);
            showHelp();
            return;
        }
        var cmd = args[2];
        if (cmd.charAt(0) != '!') {
            cmd = "!" + cmd;
        }
        if (!Shell.commands[cmd]) {
            Shell.write("Unrecognized command: " + cmd, msg.who);
            return;
        }

        var playerId = (args.length > 3 ? args[3] : "");
        if (playerId) {
            var players = _.union(findObjs({ _type: "player", _displayname: playerId }), findObjs({ _type: "player", _d20userid: playerId }));
            if (players.length > 1) {
                Shell.write("Found more than one user matching " + playerId, msg.who);
            }
            if (players.length < 1) {
                Shell.write("Unable to find user matching " + playerId, msg.who);
                players = findObjs({ _type: "player" });
            }
            if (players.length != 1) {
                Shell.write("Please try again using one of: " + (_.map(players, function (p) { return p.get('_d20userid') + "(" + p.get("_displayname") + ")"; })).join(", "), msg.who);
                return;
            }
            playerId = players[0].id;
        }

        switch (args[1]) {
            case "add":
                // add userId to state.Shell.userPermissions[cmd] (if not already present), making sure to keep the list sorted
                if (!state.Shell.userPermissions[cmd]) {
                    state.Shell.userPermissions[cmd] = [];
                }
                if (_.contains(state.Shell.userPermissions[cmd], playerId)) { return; }
                state.Shell.userPermissions[cmd].splice(_.sortedIndex(state.Shell.userPermissions[cmd], playerId), 0, playerId);
                break;
            case "remove":
                // remove playerId from state.Shell.userPermissions[cmd] (if present)
                if (!state.Shell.userPermissions[cmd]) { return; }
                var idx = state.Shell.userPermissions[cmd].indexOf(playerId);
                if (idx < 0) { return; }
                state.Shell.userPermissions[cmd].splice(idx, 1);
                break;
            default:
                Shell.write("Unrecognized operation: " + args[1], msg.who);
                showHelp();
                return;
        }
    },


    // internal functions

    isFromGM: function (msg) {
        // try to determine if message sender is GM; use builtin playerIsGM function if available
        if (typeof (playerIsGM) == typeof (Shell.isFromGM)) {
            return playerIsGM(msg.playerid);
        }

        // playerIsGM not available; try to determine from msg.who
        var player = getObj("player", msg.playerid);
        if ((player.get('speakingas') == "") || (player.get('speakingas') == "player|" + msg.playerid)) {
            return msg.who != player.get('_displayname');
        }

        // couldn't figure it out from msg; try to use isGM if it exists
        // we'd try this first if there were a way to tell the difference between "player not GM" and "player GM status unknown"
        if ((typeof (isGM) != "undefined") && (isGM) && (_.isFunction(isGM))) {
            return isGM(msg.playerid);
        }
    },

    hasPermission: function (msg, cmd) {
        if (Shell.isFromGM(msg)) { return true; }
        if (state.Shell.userPermissions[cmd]) {
            if (_.contains(state.Shell.userPermissions[cmd], msg.playerid, true)) { return true; }
            if (_.contains(state.Shell.userPermissions[cmd], "", true)) { return true; }
        }
        /////
        //
        //maybe add handling for groups
        //
        /////
        return false;
    },

    handleTemplateMessage: function (data, msg) {
        var callbacks = [],
            registeredAction,
            i;
        if ("undefined" === typeof (data) || data.length == 0) {
            log("handleTemplateMessage: Message receved with no data.");
            return false;
        }
        for (i = 0; i < data.length; i++) {
            log("Scanning actions:")
            registeredAction = Shell.actions.find(function (e, idx, a) { log(e); return (e.action === "all" || e.action === data[i][0]); });
            log("Done.")
            if (registeredAction) {
                if (callbacks.indexOf(registeredAction.name) == -1) {
                    callbacks.push(registeredAction.name);
                    // execute command callbacks
                    log("handleTemplateMessage: Calling callback for the following object:"); log(registeredAction);
                    registeredAction.callback(_.clone(data), _.clone(msg));
                }
            }
            else {
                log("No registered action found for " + data[i].name);
            }
        }

        return true;
    },

    handleApiMessage: function (msg) {
        // tokenize command string
        var tokens = Shell.tokenize(msg.content);
        if (typeof (tokens) == typeof ("")) {
            Shell.writeAndLog(tokens, msg.who);
            return;
        }
        if (tokens.length <= 0) { return; }

        if (!Shell.commands[tokens[0]]) {
            // ignore unregistered command
            return;
        }

        if (!Shell.hasPermission(msg, tokens[0])) {
            Shell.write("Error: You do not have permission to execute command " + tokens[0]);
            return;
        }

        // execute command callback
        Shell.commands[tokens[0]].callback(tokens, _.clone(msg));
        return true;
    },

    handleChatMessage: function (msg) {
        if (msg.type != "api") {
            if (msg.rolltemplate === "5eDefault") {
                var templatevalues = [],
                    regex = /\{\{(.*?)=(.*?)\}\}/gi;
                while (match = regex.exec(msg.content)) {
                    var name=match[1],
                        value=match[2],
                        template=match[0];

                    templatevalues.push([name,value,template]);

                }
            }
            //Shell.writeAndLog("5eTemplate values:");
            //log(templatevalues);
            Util.RelayTemplateHeaders(templatevalues, msg);
            //Shell.write(templatevalues);
            return;
        }
        Shell.handleApiMessage(msg);
    },

    init: function () {
        // initialize stored state
        state.Shell = state.Shell || {};
        state.Shell.userPermissions = state.Shell.userPermissions || {};

        // register built-in commands
        Shell.registerCommand("!help", "!help", "Show this help message", Shell.helpCommand);
        state.Shell.userPermissions["!help"] = [""];
        Shell.registerCommand("!shell-permission", "!shell-permission add|remove <command> [player]",
                    "Add or remove permission for specified command", Shell.permissionCommand);

        // register chat event handler
        on("chat:message", Shell.handleChatMessage);
    }
};


/*  ############################################################### */
/*  TokenNamNumber */
/*  ############################################################### */

// Github:   https://github.com/shdwjk/Roll20API/blob/master/TokenNameNumber/TokenNameNumber.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron

var TokenNameNumber = TokenNameNumber || (function () {
    'use strict';

    var version = '0.5.4',
        lastUpdate = 1442959498,
        schemaVersion = 0.3,
        statuses = [
            'red', 'blue', 'green', 'brown', 'purple', 'pink', 'yellow', // 0-6
            'skull', 'sleepy', 'half-heart', 'half-haze', 'interdiction',
            'snail', 'lightning-helix', 'spanner', 'chained-heart',
            'chemical-bolt', 'death-zone', 'drink-me', 'edge-crack',
            'ninja-mask', 'stopwatch', 'fishing-net', 'overdrive', 'strong',
            'fist', 'padlock', 'three-leaves', 'fluffy-wing', 'pummeled',
            'tread', 'arrowed', 'aura', 'back-pain', 'black-flag',
            'bleeding-eye', 'bolt-shield', 'broken-heart', 'cobweb',
            'broken-shield', 'flying-flag', 'radioactive', 'trophy',
            'broken-skull', 'frozen-orb', 'rolling-bomb', 'white-tower',
            'grab', 'screaming', 'grenade', 'sentry-gun', 'all-for-one',
            'angel-outfit', 'archery-target'
        ],
        statusColormap = ['#C91010', '#1076c9', '#2fc910', '#c97310', '#9510c9', '#eb75e1', '#e5eb75'],
        regex = {
            escape: /(\\|\/|\[|\]|\(|\)|\{|\}|\?|\+|\*|\||\.|\^|\$)/g
        },
        commands = [
            { command: '!tnn', usage: "!tnn", description: "" },
            { command: '!tnn-config', usage: "!tnn-config", description: "" }
        ],


    checkInstall = function () {
        log('-=> TokenNameNumber v' + version + ' <=-  [' + (new Date(lastUpdate * 1000)) + ']');

        if (!_.has(state, 'TokenNameNumber') || state.TokenNameNumber.version !== schemaVersion) {
            log('  > Updating Schema to v' + schemaVersion + ' <');
            switch (state.TokenNameNumber && state.TokenNameNumber.version) {
                case 0.2:
                    state.TokenNameNumber = _.defaults({
                        version: schemaVersion,
                        config: {
                            randomSpace: 0,
                            useDots: false,
                            dots: ['red', 'brown', 'yellow', 'green', 'blue', 'purple']
                        }
                    }, state.TokenNameNumber);
                    break;
                default:
                    state.TokenNameNumber = {
                        version: schemaVersion,
                        config: {
                            useDots: false,
                            dots: ['red', 'brown', 'yellow', 'green', 'blue', 'purple']
                        },
                        registry: {
                        }
                    };
                    break;
            }
        }
    },
    esRE = function (s) {
        return s.replace(regex.escape, "\\$1");
    },

    ch = function (c) {
        var entities = {
            '<': 'lt',
            '>': 'gt',
            "'": '#39',
            '@': '#64',
            '{': '#123',
            '|': '#124',
            '}': '#125',
            '[': '#91',
            ']': '#93',
            '"': 'quot',
            '-': 'mdash',
            ' ': 'nbsp'
        };

        if (_.has(entities, c)) {
            return ('&' + entities[c] + ';');
        }
        return '';
    },

    getConfigOption_RandomSpace = function () {
        var text = (state.TokenNameNumber.config.randomSpace > 0
                ? '<span style="color: green; font-weight:bold;">' + state.TokenNameNumber.config.randomSpace + '</span>'
                : '<span style="color: red; font-weight:bold;">Off</span>');
        return '<div>' +
            'Random Space of numbers between each consecutively generated token number:' +
                text + '. ' +
                '<a href="!tnn-config --random-space|?{size of the random gap between token numbers (0 for off, any number for a range from 1 to that number)?|' + state.TokenNameNumber.config.randomSpace + '}">' +
                    'Set Random Space' +
                '</a>' +
            '</div>';
    },

    getConfigOption_UseDots = function () {
        var text = (state.TokenNameNumber.config.useDots
                ? '<span style="color: green; font-weight:bold;">On</span>'
                : '<span style="color: red; font-weight:bold;">Off</span>');

        return '<div>' +
            'Use Dots is currently <b>' +
                text +
            '</b>.' +
            '<a href="!tnn-config --toggle-use-dots">Toggle</a>' +
        '</div>';
    },

    getStatusButton = function (status) {
        var i = _.indexOf(statuses, status);
        if (i < 7) {
            return '<a style="background-color: transparent; padding: 0;" href="!tnn-config --toggle-dot|' + status + '"><div style="width: 22px; height: 22px; border-radius:20px; display:inline-block; margin: 0; border:0; cursor: pointer;background-color: ' + statusColormap[i] + '"></div></a>';
        }
        return '<a style="background-color: transparent; padding: 0;" href="!tnn-config --toggle-dot|' + status + '"><div style="width: 24px; height: 24px; display:inline-block; margin: 0; border:0; cursor: pointer;padding:0;background-image: url(\'https://app.roll20.net/images/statussheet.png\');background-repeat:no-repeat;background-position: ' + ((-34) * (i - 7)) + 'px 0px;"></div></a>';
    },

// https://app.roll20.net/images/statussheet.png
    getConfigOption_Dots = function () {
        return '<div>' +
            '<div>' +
                '<div style="font-weight: bold;">Dots (Click to move between pools).</div>' +
                '<div style="border: 1px solid #999999;border-radius: 10px; background-color: #eeffee;">' +
                    _.map(state.TokenNameNumber.config.dots, function (s) {
                        return getStatusButton(s);
                    }).join('') +
                '</div>' +
            '</div>' +
            '<div>' +
                '<div style="font-weight: bold;">Available Statuses</div>' +
                '<div style="border: 1px solid #999999;border-radius: 10px; background-color: #ffeeee;">' +
                    _.map(_.difference(statuses, state.TokenNameNumber.config.dots), function (s) {
                        return getStatusButton(s);
                    }).join('') +
                '</div>' +
            '</div>' +
        '</div>';
    },

    getAllConfigOptions = function () {
        return '<ul>' + _.map([
                getConfigOption_RandomSpace(),
                getConfigOption_UseDots(),
                getConfigOption_Dots()
        ], function (c) {
            return '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">' + c + '</li>';
        }).join('') + '</ul>';
    },

    showHelp = function (who) {
        sendChat('', '/w ' + who + ' ' +
            '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">' +
                '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">' +
                    'TokenNameNumber v' + version +
                '</div>' +
                '<div style="padding-left:10px;margin-bottom:3px;">' +
                    '<p>Provides automatic numbering of tokens dragged into onto the tabletop.  Token names need to have the special word <b>%%NUMBERED%%</b> somewhere in them.</p>' +
                '</div>' +
                '<b>Commands</b>' +
                '<div style="padding-left:10px;">' +
                    '<b><span style="font-family: serif;">!tnn [--help]</span></b>' +
                    '<div style="padding-left: 10px;padding-right:20px">' +
                        '<p>Currently, this just displays the help, which is used for configuring.</p>' +
                        '<ul>' +
                            '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">' +
                                '<b><span style="font-family: serif;">--help</span></b> ' + ch('-') + ' Displays the help and configuration options.' +
                            '</li> ' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
                '<b>Config</b>' +
                '<div>' +
                    getAllConfigOptions() +
                '</div>' +
            '</div>'
        );
    },

    handleInput = function (args, msg) {
        var who;

        if (msg.type !== "api" || !playerIsGM(msg.playerid)) {
            return;
        }
        who = getObj('player', msg.playerid).get('_displayname').split(' ')[0];

        switch (args[0]) {
            case '!tnn':
                showHelp(who);
                break;

            case '!tnn-config':
                if (_.contains(args, 'help')) {
                    showHelp(who);
                    return;
                }
                if (!args.length) {
                    sendChat('', '/w ' + who + ' '
+ '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
	+ '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">'
		+ 'TokenNameNumber v' + version
	+ '</div>'
    + getAllConfigOptions()
+ '</div>'
                    );
                    return;
                }
                _.each(args, function (a) {
                    var opt = a.split(/\|/);
                    switch (opt.shift()) {
                        case '--toggle-use-dots':
                            state.TokenNameNumber.config.useDots = !state.TokenNameNumber.config.useDots;
                            sendChat('', '/w ' + who + ' '
                                + '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                    + getConfigOption_UseDots()
                                + '</div>'
                            );
                            break;

                        case '--toggle-dot':
                            if (_.contains(state.TokenNameNumber.config.dots, opt[0])) {
                                state.TokenNameNumber.config.dots = _.without(state.TokenNameNumber.config.dots, opt[0]);
                            } else {
                                state.TokenNameNumber.config.dots.push(opt[0]);
                            }
                            sendChat('', '/w ' + who + ' '
                                + '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                    + getConfigOption_Dots()
                                + '</div>'
                            );
                            break;


                        case '--random-space':
                            state.TokenNameNumber.config.randomSpace = parseInt(opt[0], 10);
                            sendChat('', '/w ' + who + ' '
                                + '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                    + getConfigOption_RandomSpace()
                                + '</div>'
                            );
                            break;

                        default:
                            sendChat('', '/w ' + who + ' '
                                + '<div><b>Unsupported Option:</div> ' + a + '</div>'
                            );
                    }

                });

                break;
        }
    },



	getMatchers = function (pageid, represents) {
	    var matchers = [];
	    if (_.has(state.TokenNameNumber.registry, pageid)
			&& _.has(state.TokenNameNumber.registry[pageid], represents)) {
	        _.each(state.TokenNameNumber.registry[pageid][represents], function (regstr) {
	            matchers.push(new RegExp(regstr));
	        });
	    }
	    return matchers;
	},
	addMatcher = function (pageid, represents, matcherRegExpStr) {
	    if (!_.has(state.TokenNameNumber.registry, pageid)) {
	        state.TokenNameNumber.registry[pageid] = {};
	    }
	    if (!_.has(state.TokenNameNumber.registry[pageid], represents)) {
	        state.TokenNameNumber.registry[pageid][represents] = [matcherRegExpStr];
	    } else {
	        state.TokenNameNumber.registry[pageid][represents].push(matcherRegExpStr);
	    }
	},

    getDotNumber = function (num) {
        var base = (function (b) {
            var radix = b;
            return (b && function base_dot(number, digits) {
                digits = digits || [];
                digits.push(number % radix);
                if (number < radix) {
                    return digits;
                }
                return base_dot(Math.floor(number / radix), digits);
            }) || function () { return []; };
        }(state.TokenNameNumber.config.dots.length));

        return base(num);
    },


	setNumberOnToken = function (obj) {
	    var matchers,
			tokenName,
			matcher,
			renamer,
			parts,
			num,
            statuspart = '';

	    if ('graphic' === obj.get('type')
            && 'token' === obj.get('subtype')) {

	        matchers = (getMatchers(obj.get('pageid'), obj.get('represents'))) || [];
	        tokenName = (obj.get('name'));



	        if (tokenName.match(/%%NUMBERED%%/) || _.some(matchers, function (m) { return m.test(tokenName); })) {
	            if (0 === matchers.length || !_.some(matchers, function (m) { return m.test(tokenName); })) {
	                matcher = '^(' + esRE(tokenName).replace(/%%NUMBERED%%/, ')(\\d+)(') + ')$';
	                addMatcher(obj.get('pageid'), obj.get('represents'), matcher);
	            }
	            if (!_.some(matchers, function (m) {
					if (m.test(tokenName)) {
						matcher = m;
						return true;
	            }
					return false;
	            })) {
	                matcher = new RegExp('^(' + esRE(tokenName).replace(/%%NUMBERED%%/, ')(\\d+)(') + ')$');
	                renamer = new RegExp('^(' + esRE(tokenName).replace(/%%NUMBERED%%/, ')(%%NUMBERED%%)(') + ')$');
	            }
	            renamer = renamer || matcher;

	            num = (_.chain(findObjs({
	                type: 'graphic',
	                subtype: 'token',
	                represents: obj.get('represents'),
	                pageid: obj.get('pageid')
	            }))
				.filter(function (t) {
				    return matcher.test(t.get('name'));
				})
				.reduce(function (memo, t) {
				    var c = parseInt(matcher.exec(t.get('name'))[2], 10);
				    return Math.max(memo, c);
				}, 0)
				.value());

	            num += (state.TokenNameNumber.config.randomSpace ? (randomInteger(state.TokenNameNumber.config.randomSpace) - 1) : 0);

	            if (state.TokenNameNumber.config.useDots) {
	                statuspart = _.map(getDotNumber(num), function (n) {
	                    return state.TokenNameNumber.config.dots[n];
	                }).join(',');
	                if (statuspart) {
	                    obj.set({
	                        statusmarkers: statuspart
	                    });
	                }
	            }

	            parts = renamer.exec(tokenName);
	            obj.set({
	                name: parts[1] + (++num) + parts[3]
	            });
	        }
	    }
	},

	registerEventHandlers = function () {
	    for (var i = 0; i < commands.length; i++) {
	        Shell.registerCommand(commands[i].command, commands[i].usage, commands[i].description, handleInput);
	    }
	    on('add:graphic', setNumberOnToken);
	};

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
}());


var shaped_utility = shaped_utility || {
    commands: [
        { command: '!shaped-rollhp', usage: '!shaped-rollhp', description: '' },
        { command: '!init-player-token', usage: '!init-player-token', description: '' },
        { command: '!shaped-token-vision', usage: '!shaped-token-vision', description: '' },
    ],
    settings: {
        useAmmoAutomatically: true,
        rollMonsterHpOnDrop: true, // will roll HP when character are dropped on map
        monsterHpFormula: 'average+', // average+ gives above average rolls with avg as min.
        bar: [
          /* Setting these to a sheet value will set the token bar value. If they are set to '' or not set then it will use whatever you already have set on the token
           Do not use npc_HP, use HP instead
           */
          {
              name: '', // BLACK bar -- always stealth.
              max: false,
              link: false,
              show: false
          }, {
              name: 'npc_AC', // YELLOW bar 'speed'
              max: false,
              link: true,
              show: false
          }, {
              name: 'HP', // GREEN bar
              max: true,
              link: false,
              show: false
          }
        ],
    },
    statblock: {
        version: 'Sep 19th',
        addTokenCache: [],
        RegisterHandlers: function () {
            for (var i = 0; i < shaped_utility.commands.length; i++) {
                Shell.registerCommand(shaped_utility.commands[i].command, shaped_utility.commands[i].usage, shaped_utility.commands[i].description, shaped_utility.HandleCommands);
            }
            if (shaped_utility.settings.rollMonsterHpOnDrop) {
                on('add:graphic', function (obj) {
                    shaped_utility.statblock.addTokenCache.push(obj.id);
                });
                on('change:graphic', function (obj) {
                    shaped_utility.rollTokenHpOnDrop(obj);
                });
            }
            on('chat:message', shaped_utility.HandleInput); // Used for a 5eDefault parse (ammo) should be moved to a general or 5e parse script.

            log('Shaped Scripts ready');
        }
    },

    status: '',
    errors: [],
    obj: null,
    characterId: null,
    characterName: null,
    commandExecuter: null,

    HandleCommands: function (args, msg) {
        if (msg.type !== 'api') {
            return;
        }
        //log('ShapedImport Debug Log: msg.content: ' + msg.content);
        //shaped.logObject(args);

        switch (args[0]) {
            case '!shaped-rollhp':
                Util.getSelectedToken(msg, shaped_utility.rollTokenHp);
                break;
            case '!init-player-token':
                Util.getSelectedToken(msg, shaped_utility.initPlayerToken);
                break;
            case '!shaped-token-vision':
                Util.getSelectedToken(msg, shaped_utility.setTokenVision);
                break;
        }
    },

    setTokenVision: function (token) {
        //log("setTokenVision: Attempting to reset vision on " + ( "undefined" === typeof(token) ? "undefined" : token.id ));
        //log(token);
        var id = token.get('represents'),
            character = findObjs({
                _type: 'character',
                id: id
            })[0],
            characterName = getAttrByName(id, 'character_name', 'current');
        var blindsight = parseInt(getAttrByName(id, 'blindsight'), 10) || 0,
            darkvision = parseInt(getAttrByName(id, 'darkvision'), 10) || 0,
            tremorsense = parseInt(getAttrByName(id, 'tremorsense'), 10) || 0,
            truesight = parseInt(getAttrByName(id, 'truesight'), 10) || 0,
            longestVisionRange = Math.max(blindsight, darkvision, tremorsense, truesight),
            longestVisionRangeForSecondaryDarkvision = Math.max(blindsight, tremorsense, truesight),
            lightRadius,
            dimRadius;

        if (longestVisionRange === blindsight) {
            lightRadius = blindsight;
            dimRadius = blindsight;
        } else if (longestVisionRange === tremorsense) {
            lightRadius = tremorsense;
            dimRadius = tremorsense;
        } else if (longestVisionRange === truesight) {
            lightRadius = truesight;
            dimRadius = truesight;
        } else if (longestVisionRange === darkvision) {
            lightRadius = Math.ceil(darkvision * 1.1666666);
            if (longestVisionRangeForSecondaryDarkvision > 0) {
                dimRadius = longestVisionRangeForSecondaryDarkvision;
            } else {
                dimRadius = -5;
            }
        }

        token.set('light_radius', lightRadius);
        token.set('light_dimradius', dimRadius);
        token.set('light_hassight', true);
        token.set('light_angle', 360);
        token.set('light_losangle', 360);
        token.set('light_otherplayers', false);
    },
    initPlayerToken: function (token) {
        token.set({
            layer: 'objects',
            showname: true,
            isdrawing: false,
            showplayers_name: true,
            showplayers_bar1: false,
            showplayers_bar2: false,
            showplayers_bar3: true,
            showplayers_aura1: false,
            showplayers_aura2: false,
            playersedit_aura1: false,
            playersedit_aura2: false,
            playersedit_name: false,
            playersedit_bar1: true,
            playersedit_bar2: false,
            playersedit_bar3: true,
            statusmarkers: '',
            light_multiplier: 1
        });
        token.set('bar3_link', "sheetattr_HP");
        token.set('bar2_link', "sheetattr_ac");

        shaped_utility.setTokenVision(token);
        //log(token);
    },


    // Auto-Ammo stuff

    // **************************************************
    HandleInput: function (msg) {
        shaped_utility.commandExecuter = msg.who;
        if (shaped_utility.settings.useAmmoAutomatically && msg.rolltemplate === '5eDefault' && msg.content.indexOf('{{ammo_auto=1}}') !== -1) {
            var character_name,
              attribute,
              match,
              regex = /\{\{(.*?)\}\}/gi;

            while (match = regex.exec(msg.content)) {
                if (match[1]) {
                    var splitAttr = match[1].split('=');
                    if (splitAttr[0] === 'character_name') {
                        character_name = splitAttr[1];
                    }
                    if (splitAttr[0] === 'ammo_field') {
                        attribute = splitAttr[1];
                    }
                }
            }
            shaped_utility.decrementAmmo(character_name, attribute);
        }
    },

    decrementAmmo: function (characterName, attributeName) {
        var obj = findObjs({
            _type: 'character',
            name: characterName
        })[0];
        var attr = findObjs({
            _type: 'attribute',
            _characterid: obj.id,
            name: attributeName
        })[0];
        log('TODO: Fix decrement ammo. attributeName: ' + attributeName);
        var val = parseInt(attr.get('current'), 10) || 0;

        attr.set({ current: val - 1 });
    },
    // **************************************************

    rollTokenHpOnDrop: function (obj) {
        if (_.contains(shaped_utility.statblock.addTokenCache, obj.id) && 'graphic' === obj.get('type') && 'token' === obj.get('subtype')) {
            shaped_utility.statblock.addTokenCache = _.without(shaped_utility.statblock.addTokenCache, obj.id);
            shaped_utility.rollTokenHp(obj);
        }
    },

    rollTokenHp: function (token) {
        var barOfHP;
        for (var i = 0; i < 3; i++) {
            if (shaped_utility.settings.bar[i].name === 'HP') {
                barOfHP = i + 1;
                break;
            }
        }
        if (!barOfHP) {
            shaped_utility.messageToChat('One of the bar names has to be set to "HP" for random HP roll');
            return;
        }

        var barTokenName = 'bar' + (barOfHP),
          represent = token.get('represents');

        if (represent === '') {
            //shaped_utility.messageToChat('Token does not represent a character');
        } else if (token.get(barTokenName + '_link') !== '') {
            //shaped_utility.messageToChat('Token ' + barTokenName + ' is linked');
        } else {
            var isNPC = getAttrByName(represent, 'is_npc', 'current');
            if (isNPC === 1 || isNPC === '1') {

                var hdArray = [4, 6, 8, 10, 12, 20],
                  hdFormula = '',
                  hdFormulaChat = '',
                  hdAverage = 0,
                  totalLevels = 0,
                  conScore = parseInt(getAttrByName(represent, 'constitution', 'current'), 10),
                  conMod = Math.floor((conScore - 10) / 2);

                for (i = 0; i < hdArray.length; i++) {
                    var numOfHDRow = parseInt(getAttrByName(represent, 'hd_d' + hdArray[i], 'current'), 10);
                    if (numOfHDRow) {
                        if (hdFormulaChat !== '') {
                            hdFormulaChat += ' + ';
                        }
                        totalLevels += numOfHDRow;
                        hdFormulaChat += numOfHDRow + 'd' + hdArray[i];
                        for (var j = 0; j < numOfHDRow; j++) {
                            if (hdFormula !== '') {
                                hdFormula += ' + ';
                            }
                            hdAverage += (hdArray[i] / 2 + 1) + conMod;
                            hdFormula += '{d' + hdArray[i] + ' + ' + conMod + ', 0d0+1';
                            if (shaped_utility.settings.monsterHpFormula === 'average+') {
                                hdFormula += ', 0d0+' + (hdArray[i] / 2 + 1 + conMod);
                            }
                            hdFormula += '}kh1';

                        }
                    }
                }

                hdFormulaChat += ' + ' + conMod * totalLevels;
                //shaped_utility.messageToChat("Rolling HP: hdFormula: " + hdFormula);

                sendChat('Shaped', '/roll ' + hdFormula, function (ops) {
                    var rollResult = JSON.parse(ops[0].content);
                    if (_.has(rollResult, 'total')) {
                        token.set(barTokenName + '_value', rollResult.total);
                        token.set(barTokenName + '_max', rollResult.total);

                        shaped_utility.messageToChat('HP (' + hdFormulaChat + ') | average: ' + Math.floor(hdAverage) + ' | rolled: ' + rollResult.total);
                    }
                });
            }
        }
        //log('Still working after trying to roll hp');
    },

    messageToChat: function (message) {
        log(message);
        sendChat('Shaped Utility', '/w gm ' + message);
        if (shaped_utility.commandExecuter && shaped_utility.commandExecuter.indexOf('(GM)') === -1) {
            sendChat('Shaped Utility', '/w \"' + shaped_utility.commandExecuter + '\" ' + message);
        }
    },



}



/*  ############################################################### */
/*  ISGMModule */
/*  ############################################################### */
// IsGMModule

// GIST: https://gist.github.com/shdwjk/8d5bb062abab18463625

var IsGMModule = IsGMModule || {
    version: 0.6,
    active: true,
    reset_password: "swordfish",

    CheckInstall: function () {
        var players = findObjs({ _type: "player" });

        if (!_.has(state, 'IsGM') || !_.has(state.IsGM, 'version') || state.IsGM.version != IsGMModule.version) {
            state.IsGM = {
                version: IsGMModule.version,
                gms: [],
                players: [],
                unknown: []
            };
        }
        state.IsGM.unknown = _.difference(
            _.pluck(players, 'id'),
            state.IsGM.gms,
            state.IsGM.players
        );
        IsGMModule.active = (state.IsGM.unknown.length > 0);
    },
    IsGM: function (id) {
        return _.contains(state.IsGM.gms, id);
    },
    HandleMessages: function (msg) {
        if (msg.type != "api") {
            if (IsGMModule.active && msg.playerid != 'API') {
                if (_.contains(state.IsGM.unknown, msg.playerid)) {
                    var player = getObj('player', msg.playerid);
                    if ("" === player.get('speakingas') || 'player|' + msg.playerid === player.get('speakingas')) {
                        if (msg.who == player.get('_displayname')) {
                            state.IsGM.players.push(msg.playerid);
                        }
                        else {
                            state.IsGM.gms.push(msg.playerid);
                            sendChat('IsGM', '/w gm ' + player.get('_displayname') + ' is now flagged as a GM.');
                        }
                        state.IsGM.unknown = _.without(state.IsGM.unknown, msg.playerid);
                        IsGMModule.active = (state.IsGM.unknown.length > 0);
                    }
                }
            }
        }
    },

    resetGMCommand: function (args, msg) {
        if (isGM(msg.playerid) || (args.length > 1 && args[1] == IsGMModule.reset_password)) {
            delete state.IsGM;
            IsGMModule.CheckInstall();
            sendChat('IsGM', '/w gm IsGM data reset.');
        }
        else {
            var who = getObj('player', msg.playerid).get('_displayname').split(' ')[0];
            sendChat('IsGM', '/w ' + who + ' (' + who + ')Only GMs may reset the IsGM data.'
            + 'If you are a GM you can reset by specifying the reset password from'
            + 'the top of the IsGM script as an argument to !reset-isgm')
        }
    },

    RegisterEventHandlers: function () {
        on('chat:message', IsGMModule.HandleMessages); // ONLY for Non-API (Scanning for isGM)
    },

    init: function () {
        IsGMModule.CheckInstall();
        IsGMModule.RegisterEventHandlers();
        Shell.registerCommand("!reset-isgm", "!reset-isgm password",
                            "Reset the saved GM status of the IsGM module.", IsGMModule.resetGMCommand);

    }
};

var isGM = isGM || function (id) {
    return IsGMModule.IsGM(id);
};




on("ready", function () {
    Shell.init();
    Util.init();
    IsGMModule.init();

    'use strict';

    TokenNameNumber.CheckInstall();
    TokenNameNumber.RegisterEventHandlers();
    shaped_utility.statblock.RegisterHandlers();

    if ("undefined" !== typeof isGM && _.isFunction(isGM)) {
        Torch.CheckInstall();
        Torch.RegisterEventHandlers();
        APIHeartBeat.CheckInstall();
        APIHeartBeat.RegisterEventHandlers();
    } else {
        log('--------------------------------------------------------------');
        log('Torch requires the isGM module to work.');
        log('APIHeartBeat requires the isGM module to work.');
        log('isGM GIST: https://gist.github.com/shdwjk/8d5bb062abab18463625');
        log('--------------------------------------------------------------');
    }
});

