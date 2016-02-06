// Github:   https://github.com/shdwjk/Roll20API/blob/master/TurnMarker1/TurnMarker1.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron

/*  ############################################################### */
/*  TurnMarker */
/*  ############################################################### */

var TurnMarker = TurnMarker || (function () {
    "use strict";

    var version = '1.3.1',
        lastUpdate = 1444742266,
        schemaVersion = 1.16,
        active = false,
        threadSync = 1;


    return {

        CheckInstall: function () {
            log('-=> TurnMarker v' + version + ' <=-  [' + (new Date(lastUpdate * 1000)) + ']');

            if (!state.hasOwnProperty('TurnMarker') || state.TurnMarker.version !== TurnMarker.schemaVersion) {
                /* Default Settings stored in the state. */
                state.TurnMarker = {
                    version: TurnMarker.version,
                    announceRounds: true,
                    announceTurnChange: true,
                    announcePlayerInTurnAnnounce: true,
                    announcePlayerInTurnAnnounceSize: '100%',
                    autoskipHidden: true,
                    tokenName: 'Round',
                    tokenURL: 'https://s3.amazonaws.com/files.d20.io/images/4095816/086YSl3v0Kz3SlDAu245Vg/thumb.png?1400535580',
                    playAnimations: false,
                    rotation: false,
                    animationSpeed: 5,
                    scale: 1.7,
                    aura1: {
                        pulse: false,
                        size: 5,
                        color: '#ff00ff'
                    },
                    aura2: {
                        pulse: false,
                        size: 5,
                        color: '#00ff00'
                    }
                };
            }
            if (Campaign().get('turnorder') === '') {
                Campaign().set('turnorder', '[]');
            }
        },

        GetMarker: function () {
            var marker = findObjs({
                imgsrc: state.TurnMarker.tokenURL,
                pageid: Campaign().get("playerpageid")
            })[0];

            if (marker === undefined) {
                marker = createObj('graphic', {
                    name: state.TurnMarker.tokenName + ' 0',
                    pageid: Campaign().get("playerpageid"),
                    layer: 'gmlayer',
                    imgsrc: state.TurnMarker.tokenURL,
                    left: 0,
                    top: 0,
                    height: 70,
                    width: 70,
                    bar2_value: 0,
                    showplayers_name: true,
                    showplayers_aura1: true,
                    showplayers_aura2: true
                });
            }
            if (!TurnOrder.HasTurn(marker.id)) {
                TurnOrder.AddTurn({
                    id: marker.id,
                    pr: -1,
                    custom: "",
                    pageid: marker.get('pageid')
                });
            }
            return marker;
        },

        Step: function (sync) {
            if (!state.TurnMarker.playAnimations || sync !== TurnMarker.threadSync) {
                return;
            }
            var marker = TurnMarker.GetMarker();
            if (TurnMarker.active === true) {
                var rotation = (marker.get('bar1_value') + state.TurnMarker.animationSpeed) % 360;
                marker.set('bar1_value', rotation);
                if (state.TurnMarker.rotation) {
                    marker.set('rotation', rotation);
                }
                if (state.TurnMarker.aura1.pulse) {
                    marker.set('aura1_radius', Math.abs(Math.sin(rotation * (Math.PI / 180))) * state.TurnMarker.aura1.size);
                }
                else {
                    marker.set('aura1_radius', '');
                }
                if (state.TurnMarker.aura2.pulse) {
                    marker.set('aura2_radius', Math.abs(Math.cos(rotation * (Math.PI / 180))) * state.TurnMarker.aura2.size);
                }
                else {
                    marker.set('aura2_radius', '');
                }
                setTimeout(_.bind(TurnMarker.Step, this, sync), 100);
            }
        },

        Reset: function () {
            TurnMarker.active = false;
            TurnMarker.threadSync++;

            var marker = TurnMarker.GetMarker();

            marker.set({
                layer: "gmlayer",
                aura1_radius: '',
                aura2_radius: '',
                left: 35,
                top: 35,
                height: 70,
                width: 70,
                rotation: 0,
                bar1_value: 0
            });
        },

        Start: function () {
            var marker = TurnMarker.GetMarker();


            if (state.TurnMarker.playAnimations && state.TurnMarker.aura1.pulse) {
                marker.set({
                    aura1_radius: state.TurnMarker.aura1.size,
                    aura1_color: state.TurnMarker.aura1.color
                });
            }
            if (state.TurnMarker.playAnimations && state.TurnMarker.aura2.pulse) {
                marker.set({
                    aura2_radius: state.TurnMarker.aura2.size,
                    aura2_color: state.TurnMarker.aura2.color
                });
            }
            TurnMarker.active = true;
            TurnMarker.Step(TurnMarker.threadSync);
            TurnMarker.TurnOrderChange(false);
        },

        HandleInput: function (tokens, who) {
            switch (tokens[0]) {
                case 'reset':
                    var marker = TurnMarker.GetMarker();
                    marker.set({
                        name: state.TurnMarker.tokenName + ' 0',
                        bar2_value: 0
                    });
                    sendChat('', '/w ' + who + ' <b>Round</b> count is reset to <b>0</b>.');
                    break;

                case 'toggle-announce':
                    state.TurnMarker.announceRounds = !state.TurnMarker.announceRounds;
                    sendChat('', '/w ' + who + ' <b>Announce Rounds</b> is now <b>' + (state.TurnMarker.announceRounds ? 'ON' : 'OFF') + '</b>.');
                    break;

                case 'toggle-announce-turn':
                    state.TurnMarker.announceTurnChange = !state.TurnMarker.announceTurnChange;
                    sendChat('', '/w ' + who + ' <b>Announce Turn Changes</b> is now <b>' + (state.TurnMarker.announceTurnChange ? 'ON' : 'OFF') + '</b>.');
                    break;

                case 'toggle-announce-player':
                    state.TurnMarker.announcePlayerInTurnAnnounce = !state.TurnMarker.announcePlayerInTurnAnnounce;
                    sendChat('', '/w ' + who + ' <b>Player Name in Announce</b> is now <b>' + (state.TurnMarker.announcePlayerInTurnAnnounce ? 'ON' : 'OFF') + '</b>.');
                    break;

                case 'toggle-skip-hidden':
                    state.TurnMarker.autoskipHidden = !state.TurnMarker.autoskipHidden;
                    sendChat('', '/w ' + who + ' <b>Auto-skip Hidden</b> is now <b>' + (state.TurnMarker.autoskipHidden ? 'ON' : 'OFF') + '</b>.');
                    break;

                case 'toggle-animations':
                    state.TurnMarker.playAnimations = !state.TurnMarker.playAnimations;
                    if (state.TurnMarker.playAnimations) {
                        TurnMarker.Step(TurnMarker.threadSync);
                    }
                    else {
                        marker = TurnMarker.GetMarker();
                        marker.set({
                            aura1_radius: '',
                            aura2_radius: ''
                        });
                    }

                    sendChat('', '/w ' + who + ' <b>Animations</b> are now <b>' + (state.TurnMarker.playAnimations ? 'ON' : 'OFF') + '</b>.');
                    break;

                case 'toggle-rotate':
                    state.TurnMarker.rotation = !state.TurnMarker.rotation;
                    sendChat('', '/w ' + who + ' <b>Rotation</b> is now <b>' + (state.TurnMarker.rotation ? 'ON' : 'OFF') + '</b>.');
                    break;

                case 'toggle-aura-1':
                    state.TurnMarker.aura1.pulse = !state.TurnMarker.aura1.pulse;
                    sendChat('', '/w ' + who + ' <b>Aura 1</b> is now <b>' + (state.TurnMarker.aura1.pulse ? 'ON' : 'OFF') + '</b>.');
                    break;

                case 'toggle-aura-2':
                    state.TurnMarker.aura2.pulse = !state.TurnMarker.aura2.pulse;
                    sendChat('', '/w ' + who + ' <b>Aura 2</b> is now <b>' + (state.TurnMarker.aura2.pulse ? 'ON' : 'OFF') + '</b>.');
                    break;


                case 'help':
                default:
                    TurnMarker.Help(who);
                    break;

            }
        },

        Help: function (who) {
            var marker = TurnMarker.GetMarker();
            var rounds = parseInt(marker.get('bar2_value'), 10);
            sendChat('',
                '/w ' + who + ' ' +
                '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">' +
                '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">' +
                'TurnMarker v' + TurnMarker.version +
                '</div>' +
                '<b>Commands</b>' +
                '<div style="padding-left:10px;"><b><span style="font-family: serif;">!tm</span></b>' +
                '<div style="padding-left: 10px;padding-right:20px">' +
                'The following arguments may be supplied in order to change the configuration.  All changes are persisted between script restarts.' +
                '<ul>' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;"><span style="color: blue; font-weight:bold; padding: 0px 4px;">' + rounds + '</span></div>' +
                '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">reset</span></b> -- Sets the round counter back to 0.</li> ' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.announceRounds ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-announce</span></b> -- When on, each round will be announced to chat.</li>' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.announceTurnChange ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-announce-turn</span></b> -- When on, the transition between visible turns will be announced.</li> ' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.announcePlayerInTurnAnnounce ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-announce-player</span></b> -- When on, the player(s) controlling the current turn are included in the turn announcement.</li> ' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.autoskipHidden ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-skip-hidden</span></b> -- When on, turn order will automatically be advanced past any hidden turns.</li> ' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.playAnimations ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-animations</span></b> -- Turns on turn marker animations. [Experimental!]</li> ' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.rotation ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-rotate</span></b> -- When on, the turn marker will rotate slowly clockwise. [Animation]</li> ' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.aura1.pulse ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-aura-1</span></b> -- When on, aura 2 will pulse in and out. [Animation]</li> ' +
                '<div style="float:right;width:40px;border:1px solid black;background-color:#ffc;text-align:center;">' + (state.TurnMarker.aura2.pulse ? '<span style="color: red; font-weight:bold; padding: 0px 4px;">ON</span>' : '<span style="color: #999999; font-weight:bold; padding: 0px 4px;">OFF</span>') + '</div>' +
                '<li style="border-bottom: 1px solid #ccc;"><b><span style="font-family: serif;">toggle-aura-2</span></b> -- When on, aura 2 will pulse in and out. [Animation]</li> ' +
                '</ul>' +
                '</div>' +
                '</div>' +
                '<div style="padding-left:10px;"><b><span style="font-family: serif;">!eot</span></b>' +
                '<div style="padding-left: 10px;padding-right:20px;">' +
                'Players may execute this command to advance the initiative to the next turn.  This only succeeds if the current token is one that the caller controls or if it is executed by a GM.' +
                '</div>' +
                '</div>' +
                '</div>'
                );
        },

        CheckForTokenMove: function (obj) {
            if (TurnMarker.active) {
                var turnOrder = TurnOrder.Get();
                var current = _.first(turnOrder);
                if (obj && current && current.id === obj.id) {
                    TurnMarker.threadSync++;

                    var marker = TurnMarker.GetMarker();
                    marker.set({
                        "top": obj.get("top"),
                        "left": obj.get("left")
                    });

                    setTimeout(_.bind(TurnMarker.Step, this, TurnMarker.threadSync), 300);
                }
            }
        },

        RequestTurnAdvancement: function (playerid) {
            if (TurnMarker.active) {
                var turnOrder = TurnOrder.Get(),
                    current = getObj('graphic', _.first(turnOrder).id),
                    character = getObj('character', (current && current.get('represents')));
                if (playerIsGM(playerid)
                    || (current &&
                           (_.contains(current.get('controlledby').split(','), playerid)
                           || _.contains(current.get('controlledby').split(','), 'all'))
                        )
                    || (character &&
                           (_.contains(character.get('controlledby').split(','), playerid)
                           || _.contains(character.get('controlledby').split(','), 'all'))
                        )
                    ) {
                    TurnOrder.Next();
                    TurnMarker.TurnOrderChange(true);
                }
            }
        },

        _AnnounceRound: function (round) {
            if (state.TurnMarker.announceRounds) {
                sendChat(
                    '',
                    "/direct "
                    + "<div style='"
                        + 'background-color: #4B0082;'
                        + 'border: 3px solid #808080;'
                        + 'font-size: 20px;'
                        + 'text-align:center;'
                        + 'vertical-align: top;'
                        + 'color: white;'
                        + 'font-weight:bold;'
                        + 'padding: 5px 5px;'
                    + "'>"
                        + "<img src='" + state.TurnMarker.tokenURL + "' style='width:20px; height:20px; padding: 0px 5px;' />"
                        + "Round " + round
                        + "<img src='" + state.TurnMarker.tokenURL + "' style='width:20px; height:20px; padding: 0px 5px;' />"
                    + "</div>"
                );
            }
        },
        HandleTurnOrderChange: function () {
            var marker = TurnMarker.GetMarker(),
                turnorder = Campaign().get('turnorder'),
                markerTurn;

            turnorder = ('' === turnorder) ? [] : JSON.parse(turnorder);
            markerTurn = _.filter(turnorder, function (i) {
                return marker.id === i.id;
            })[0];

            if (markerTurn.pr !== -1) {
                markerTurn.pr = -1;
                turnorder = _.union([markerTurn], _.reject(turnorder, function (i) {
                    return marker.id === i.id;
                }));
                Campaign().set('turnorder', JSON.stringify(turnorder));
            }
        },
        _HandleMarkerTurn: function () {
            var marker = TurnMarker.GetMarker();
            var turnOrder = TurnOrder.Get();


            if (turnOrder[0].id === marker.id) {
                var round = parseInt(marker.get('bar2_value', 10)) + 1;
                marker.set({
                    name: state.TurnMarker.tokenName + ' ' + round,
                    bar2_value: round
                });
                TurnMarker._AnnounceRound(round);
                TurnOrder.Next();
            }
        },
        _HandleAnnounceTurnChange: function () {

            if (state.TurnMarker.announceTurnChange) {
                var marker = TurnMarker.GetMarker();
                var turnOrder = TurnOrder.Get();
                var currentToken = getObj("graphic", turnOrder[0].id);
                if ('gmlayer' === currentToken.get('layer')) {
                    return;
                }
                var previousTurn = _.last(_.filter(turnOrder, function (element) {
                    var token = getObj("graphic", element.id);
                    return ((undefined !== token)
                        && (token.get('layer') !== 'gmlayer')
                        && (element.id !== marker.id));
                }));

                /* find previous token. */
                var previousToken = getObj("graphic", previousTurn.id);
                var pImage = previousToken.get('imgsrc');
                var cImage = currentToken.get('imgsrc');
                var pRatio = previousToken.get('width') / previousToken.get('height');
                var cRatio = currentToken.get('width') / currentToken.get('height');

                var pNameString = "The Previous turn is done.";
                if (previousToken && previousToken.get('showplayers_name')) {
                    pNameString = '<span style=\''
                            + 'font-family: Baskerville, "Baskerville Old Face", "Goudy Old Style", Garamond, "Times New Roman", serif;'
                            + 'text-decoration: underline;'
                            + 'font-size: 130%;'
                        + '\'>'
                            + previousToken.get('name')
                        + '</span>\'s turn is done.';
                }

                var cNameString = 'The next turn has begun!';
                if (currentToken && currentToken.get('showplayers_name')) {
                    cNameString = '<span style=\''
                        + 'font-family: Baskerville, "Baskerville Old Face", "Goudy Old Style", Garamond, "Times New Roman", serif;'
                        + 'text-decoration: underline;'
                        + 'font-size: 130%;'
                    + '\'>'
                        + currentToken.get('name')
                    + '</span>, it\'s now your turn!';
                }


                var PlayerAnnounceExtra = '';
                if (state.TurnMarker.announcePlayerInTurnAnnounce) {
                    var Char = currentToken.get('represents');
                    if ('' !== Char) {
                        Char = getObj('character', Char);
                        if (Char && _.isFunction(Char.get)) {
                            var Controllers = Char.get('controlledby').split(',');
                            _.each(Controllers, function (c) {
                                switch (c) {
                                    case 'all':
                                        PlayerAnnounceExtra += '<div style="'
                                                + 'padding: 0px 5px;'
                                                + 'font-weight: bold;'
                                                + 'text-align: center;'
                                                + 'font-size: ' + state.TurnMarker.announcePlayerInTurnAnnounceSize + ';'
                                                + 'border: 5px solid black;'
                                                + 'background-color: white;'
                                                + 'color: black;'
                                                + 'letter-spacing: 3px;'
                                                + 'line-height: 130%;'
                                            + '">'
                                                + 'All'
                                            + '</div>';
                                        break;

                                    default:
                                        var player = getObj('player', c);
                                        if (player) {
                                            var PlayerColor = player.get('color');
                                            var PlayerName = player.get('displayname');
                                            PlayerAnnounceExtra += '<div style="'
                                                    + 'padding: 5px;'
                                                    + 'text-align: center;'
                                                    + 'font-size: ' + state.TurnMarker.announcePlayerInTurnAnnounceSize + ';'
                                                    + 'background-color: ' + PlayerColor + ';'
                                                    + 'text-shadow: '
                                                        + '-1px -1px 1px #000,'
                                                        + ' 1px -1px 1px #000,'
                                                        + '-1px  1px 1px #000,'
                                                        + ' 1px  1px 1px #000;'
                                                    + 'letter-spacing: 3px;'
                                                    + 'line-height: 130%;'
                                                + '">'
                                                    + PlayerName
                                                + '</div>';
                                        }
                                        break;
                                }
                            });
                        }
                    }
                }

                var tokenSize = 70;
                sendChat(
                    '',
                    "/direct "
                    + "<div style='border: 3px solid #808080; background-color: #4B0082; color: white; padding: 1px 1px;'>"
                        + '<div style="text-align: left;  margin: 5px 5px;">'
                            + "<img src='" + pImage + "' style='float:left; width:" + Math.round(tokenSize * pRatio) + "px; height:" + tokenSize + "px; padding: 0px 2px;' />"
                            + pNameString
                        + '</div>'
                        + '<div style="text-align: right; margin: 5px 5px; position: relative; vertical-align: text-bottom;">'
                            + "<img src='" + cImage + "' style='float:right; width:" + Math.round(tokenSize * cRatio) + "px; height:" + tokenSize + "px; padding: 0px 2px;' />"
                            + '<span style="position:absolute; bottom: 0;right:' + Math.round((tokenSize * cRatio) + 6) + 'px;">'
                                + cNameString
                            + '</span>'
                            + '<div style="clear:both;"></div>'
                        + '</div>'
                         + PlayerAnnounceExtra
                    + "</div>"
                );
            }
        },

        TurnOrderChange: function (FirstTurnChanged) {
            var marker = TurnMarker.GetMarker();

            if (Campaign().get('initiativepage') === false) {
                return;
            }

            var turnOrder = TurnOrder.Get();

            if (!turnOrder.length) {
                return;
            }

            var current = _.first(turnOrder);

            if (state.TurnMarker.playAnimations) {
                TurnMarker.threadSync++;
                setTimeout(_.bind(TurnMarker.Step, this, TurnMarker.threadSync), 300);
            }

            if (current.id === "-1") {
                return;
            }

            TurnMarker._HandleMarkerTurn();

            if (state.TurnMarker.autoskipHidden) {
                TurnOrder.NextVisible();
                TurnMarker._HandleMarkerTurn();
            }

            turnOrder = TurnOrder.Get();

            if (turnOrder[0].id === marker.id) {
                return;
            }

            current = _.first(TurnOrder.Get());

            var currentToken = getObj("graphic", turnOrder[0].id);
            if (undefined !== currentToken) {

                if (FirstTurnChanged) {
                    TurnMarker._HandleAnnounceTurnChange();
                }

                var size = Math.max(currentToken.get("height"), currentToken.get("width")) * state.TurnMarker.scale;

                if (marker.get("layer") === "gmlayer" && currentToken.get("layer") !== "gmlayer") {
                    marker.set({
                        "top": currentToken.get("top"),
                        "left": currentToken.get("left"),
                        "height": size,
                        "width": size
                    });
                    setTimeout(function () {
                        marker.set({
                            "layer": currentToken.get("layer")
                        });
                    }, 500);
                } else {
                    marker.set({
                        "layer": currentToken.get("layer"),
                        "top": currentToken.get("top"),
                        "left": currentToken.get("left"),
                        "height": size,
                        "width": size
                    });
                }
                toFront(currentToken);
            }
        },

        DispatchInitiativePage: function () {
            if (Campaign().get('initiativepage') === false) {
                this.Reset();
            }
            else {
                this.Start();
            }
        },

        RegisterEventHandlers: function () {
            on("change:campaign:initiativepage", function (obj, prev) {
                TurnMarker.DispatchInitiativePage();
            });

            on("change:campaign:turnorder", function (obj, prev) {
                var prevOrder = JSON.parse(prev.turnorder);
                var objOrder = JSON.parse(obj.get('turnorder'));

                if (undefined !== prevOrder
                 && undefined !== objOrder
                   && _.isArray(prevOrder)
                   && _.isArray(objOrder)
                   && 0 !== prevOrder.length
                   && 0 !== objOrder.length
                 && objOrder[0].id !== prevOrder[0].id
                  ) {
                    TurnMarker.TurnOrderChange(true);
                }
            });

            on("change:graphic", function (obj, prev) {
                TurnMarker.CheckForTokenMove(obj);
            });

            on("chat:message", function (msg) {
                /* Exit if not an api command */
                if (msg.type !== "api") {
                    return;
                }

                /* clean up message bits. */
                msg.who = msg.who.replace(" (GM)", "");
                msg.content = msg.content.replace("(GM) ", "");

                // get minimal player name (hopefully unique!)
                var who = getObj('player', msg.playerid).get('_displayname').split(' ')[0];

                var tokenized = msg.content.split(" ");
                var command = tokenized[0];

                switch (command) {
                    case "!tm":
                    case "!turnmarker":
                        {
                            TurnMarker.HandleInput(_.rest(tokenized), who);
                        }
                        break;

                    case "!eot":
                        {
                            TurnMarker.RequestTurnAdvancement(msg.playerid);
                        }
                        break;
                }
            });

            if ('undefined' !== typeof GroupInitiative && GroupInitiative.ObserveTurnOrderChange) {
                GroupInitiative.ObserveTurnOrderChange(TurnMarker.HandleTurnOrderChange);
            }
        }

    };
}());

on("ready", function () {
    'use strict';

    TurnMarker.CheckInstall();
    TurnMarker.RegisterEventHandlers();
    TurnMarker.DispatchInitiativePage();
});

var TurnOrder = TurnOrder || {
    Get: function () {
        var to = Campaign().get("turnorder");
        to = ('' === to ? '[]' : to);
        return JSON.parse(to);
    },
    Set: function (turnOrder) {
        Campaign().set({ turnorder: JSON.stringify(turnOrder) });
    },
    Next: function () {
        this.Set(TurnOrder.Get().rotate(1));
        if ("undefined" !== typeof Mark && _.has(Mark, 'Reset') && _.isFunction(Mark.Reset)) {
            Mark.Reset();
        }
    },
    NextVisible: function () {
        var turns = this.Get();
        var context = { skip: 0 };
        var found = _.find(turns, function (element) {
            var token = getObj("graphic", element.id);
            if (
                (undefined !== token)
                && (token.get('layer') !== 'gmlayer')
            ) {
                return true;
            }
            else {
                this.skip++;
            }
        }, context);
        if (undefined !== found && context.skip > 0) {
            this.Set(turns.rotate(context.skip));
        }
    },
    HasTurn: function (id) {
        return (_.filter(this.Get(), function (turn) {
            return id === turn.id;
        }).length !== 0);
    },
    AddTurn: function (entry) {
        var turnorder = this.Get();
        turnorder.push(entry);
        this.Set(turnorder);
    }
};

Object.defineProperty(Array.prototype, 'rotate', {
    enumerable: false,
    writable: true
});

Array.prototype.rotate = (function () {
    var unshift = Array.prototype.unshift,
        splice = Array.prototype.splice;

    return function (count) {
        var len = this.length >>> 0;
        count = count >> 0;

        unshift.apply(this, splice.call(this, count % len, len));
        return this;
    };
}());

/*  ############################################################### */
/*  ShapedImport  */
/*  ############################################################### */
// ShapedImport

var shaped = shaped || {
    /****Import Options***/
    commands: [
        { command: '!build-monster', usage: "!build-monster [clean]", description: "" },
        { command: '!shaped-parse', usage: '!shaped-parse', description: '' },
        { command: '!shaped-import', usage: '!shaped-import', description: '' },
        { command: '!shaped-rollhp', usage: '!shaped-rollhp', description: '' },
        { command: '!shaped-settings', usage: '!shaped-settings', description: '' },
        { command: '!shaped-spell', usage: '!shaped-spell', description: '' },
        { command: '!spell-import', usage: '!spell-import', description: '' },
        { command: '!shaped-convert', usage: '!shaped-convert', description: '' },
        { command: '!init-player-token', usage: '!init-player-token', description: '' },
        { command: '!shaped-token-vision', usage: '!shaped-token-vision', description: '' },
        { command: '!shaped-token-macro', usage: '!shaped-token-macro', description: '' }
    ],
    settings: {
        // SEPARATE:
        // Pre-game, setup
        createAbilityAsToken: true,

        showName: true, //show the name on the map (not to players)
        showNameToPlayers: true, //show the name to players
        showCharacterNameOnRollTemplate: false, //show the character's name on their roll templates
        //useAaronsNumberedScript: true, //add numbers at the end if using his script

        defaultTab: 'all_npc', //core is default. uncomment if you want the actions page. Change to 'spellbook' if you want the spellbook page. Change to 'all_npc' if you want to "Show All" for the NPC pages.
        sheetOutput: 'hidden', //change to 'hidden' if you wish the sheet to whisper all commands to the GM
        whisperDeathSaves: true, //change to false if you wish NPC death saves to be rolled openly
        initiativeTieBreaker: true, //change to true if you want to add the initiative modifier as a tie breaker for initiatives. (I use it)
        whisperInitiative: true, //always whisper initiative
        initiativeAddsToTracker: true, //change to false if you do not want to add the initiative to the tracker (mainly for the app)
        addInitiativeTokenAbility: true, //change to false if you do not want a macro "Init" on every token

        attacksVsTargetAC: true, //show the target's AC when using attacks
        attacksVsTargetName: true, //show the target's Name when using attacks

        addSaveQueryMacroTokenAbility: true, //change to false if you do not want a macro "Save" on every token
        addCheckQueryMacroTokenAbility: true, //change to false if you do not want a macro "Check" on every token

        useAmmoAutomatically: true,
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

        // In-game, separate out to separate script.

        //hideGMInfo: true, //hide some roll template info from your players. This requires that the gm uses a browser extension
        rollMonsterHpOnDrop: true, // will roll HP when character are dropped on map
        monsterHpFormula: 'average+' // average+ gives above average rolls with avg as min.

    },

    statblock: {
        version: 'Sep 19th',
        addTokenCache: [],
        RegisterHandlers: function () {
            on('chat:message', shaped.HandleInput); // Used for a 5eDefault parse (ammo) should be moved to a general or 5e parse script.
            for (var i = 0; i < shaped.commands.length; i++) {
                Shell.registerCommand(shaped.commands[i].command, shaped.commands[i].usage, shaped.commands[i].description, shaped.HandleCommands);
            }
            if (shaped.settings.rollMonsterHpOnDrop) {
                on('add:graphic', function (obj) {
                    shaped.statblock.addTokenCache.push(obj.id);
                });
                on('change:graphic', function (obj) {
                    shaped.rollTokenHpOnDrop(obj);
                });
            }

            log('Shaped Scripts ready');
        }
    },

    status: '',
    errors: [],
    obj: null,
    characterId: null,
    characterName: null,
    commandExecuter: null,

    capitalizeFirstLetter: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    HandleInput: function (msg) {
        shaped.commandExecuter = msg.who;
        if (shaped.settings.useAmmoAutomatically && msg.rolltemplate === '5eDefault' && msg.content.indexOf('{{ammo_auto=1}}') !== -1) {
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
            shaped.decrementAmmo(character_name, attribute);
        }
    },

    HandleCommands: function (args, msg) {
        if (msg.type !== 'api') {
            return;
        }
        log('ShapedImport Debug Log: msg.content: ' + msg.content);
        shaped.logObject(args);

        switch (args[0]) {
            case '!build-monster':
            case '!shaped-parse':
            case '!shaped-import':
                if (args[1] && args[1] === 'clean') {
                    shaped.getSelectedToken(msg, shaped.deleteOldSheet);
                }
                shaped.getSelectedToken(msg, shaped.importStatblock);
                break;
            case '!shaped-rollhp':
                shaped.getSelectedToken(msg, shaped.rollTokenHp);
                break;
            case '!shaped-settings':
                shaped.changeSettings(args);
                break;
            case '!shaped-spell':
            case '!spell-import':
                log("-------------------BEGIN---------------");
                log("Calling shaped.getSelectedToken(msg, shaped.spellImport, args) with options:");
                shaped.logObject(msg);
                shaped.logObject(args);
                log("-------------------END-----------------");
                var tmp = args.shift();
                shaped.getSelectedToken(msg, shaped.spellImport, args);
                args.unshift(tmp);
                break;
            case '!shaped-convert':
                var tmp = args.shift();
                shaped.getSelectedToken(msg, shaped.parseOldToNew);
                break;
            case '!init-player-token':
                shaped.getSelectedToken(msg, shaped.initPlayerToken);
                break;
            case '!shaped-token-vision':
                shaped.getSelectedToken(msg, shaped.setTokenVision);
                break;
            case '!shaped-token-macro':
                shaped.getSelectedToken(msg, shaped.tokenMacros, args);
                break;
        }
    },

    setTokenVision: function (token) {
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
        token.set({
            bar3_link: "sheetattr_HP",
            bar3_value: getAttrByName(token.get("represents"), 'HP', 'current'),
            bar3_max: getAttrByName(token.get('represents'), 'HP', 'max')
        });
        shaped.setTokenVision(token);
        //log(token);
    },

    messageToChat: function (message) {
        log(message);
        sendChat('Shaped', '/w gm ' + message);
        if (shaped.commandExecuter && shaped.commandExecuter.indexOf('(GM)') === -1) {
            sendChat('Shaped', '/w \"' + shaped.commandExecuter + '\" ' + message);
        }
    },

    capitalizeEachWord: function (str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
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
            shaped.messageToChat('Exception: ' + e);
        }
    },

    deleteOldSheet: function (token) {
        var id = token.get('represents'),
          obj = findObjs({
              _type: 'character',
              id: id
          })[0];
        if (obj) {
            obj.remove();
            log('old sheet removed before importing');
        }
    },

    tokenMacros: function (token, args) {
        var id = token.get('represents'),
          character = findObjs({
              _type: 'character',
              id: id
          })[0],
          characterName = getAttrByName(id, 'character_name', 'current');

        if (typeof (character) === 'undefined') {
            shaped.messageToChat('Error: cannot find a character by the name of "' + characterName + '".');
            return;
        }
        shaped.characterId = character.id;

        if (args[1] === 'init') {
            shaped.createInitTokenAction(characterName);
            shaped.messageToChat('created init token macro for ' + characterName + '.');
        } else if (args[1] === 'query') {
            shaped.createSaveQueryTokenAction(characterName);
            shaped.createCheckQueryTokenAction(characterName);
            shaped.messageToChat('created query token macros for ' + characterName + '.');
        } else if (args[1] === 'bootstrap') {
            shaped.createInitTokenAction(characterName);
            shaped.createSaveQueryTokenAction(characterName);
            shaped.createCheckQueryTokenAction(characterName);
            shaped.messageToChat('bootstraped all token macros for ' + characterName + '.');
        }
    },

    createInitTokenAction: function (characterName) {
        shaped.setAbility('Init', '', '%{' + characterName + '|Initiative}', shaped.settings.createAbilityAsToken);
    },
    createSaveQueryTokenAction: function (characterName) {
        shaped.setAbility('Save', '', '%{' + characterName + '|save_query_macro}', shaped.settings.createAbilityAsToken);
    },
    createCheckQueryTokenAction: function (characterName) {
        shaped.setAbility('Check', '', '%{' + characterName + '|check_query_macro}', shaped.settings.createAbilityAsToken);
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

    rollTokenHpOnDrop: function (obj) {
        if (_.contains(shaped.statblock.addTokenCache, obj.id) && 'graphic' === obj.get('type') && 'token' === obj.get('subtype')) {
            shaped.statblock.addTokenCache = _.without(shaped.statblock.addTokenCache, obj.id);
            shaped.rollTokenHp(obj);
        }
    },

    rollTokenHp: function (token) {
        var barOfHP;
        for (var i = 0; i < 3; i++) {
            if (shaped.settings.bar[i].name === 'HP') {
                barOfHP = i + 1;
                break;
            }
        }
        if (!barOfHP) {
            shaped.messageToChat('One of the bar names has to be set to "HP" for random HP roll');
            return;
        }

        var barTokenName = 'bar' + (barOfHP),
          represent = token.get('represents');

        if (represent === '') {
            //shaped.messageToChat('Token does not represent a character');
        } else if (token.get(barTokenName + '_link') !== '') {
            //shaped.messageToChat('Token ' + barTokenName + ' is linked');
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
                            if (shaped.settings.monsterHpFormula === 'average+') {
                                hdFormula += ', 0d0+' + (hdArray[i] / 2 + 1 + conMod);
                            }
                            hdFormula += '}kh1';

                        }
                    }
                }

                hdFormulaChat += ' + ' + conMod * totalLevels;
                //messageToChat("Rolling HP: hdFormula: " + hdFormula);

                sendChat('Shaped', '/roll ' + hdFormula, function (ops) {
                    var rollResult = JSON.parse(ops[0].content);
                    if (_.has(rollResult, 'total')) {
                        token.set(barTokenName + '_value', rollResult.total);
                        token.set(barTokenName + '_max', rollResult.total);

                        shaped.messageToChat('HP (' + hdFormulaChat + ') | average: ' + Math.floor(hdAverage) + ' | rolled: ' + rollResult.total);
                    }
                });
            }
        }
        //log('Still working after trying to roll hp');
    },

    setCharacter: function (token, gmnotes) {
        if (!shaped.characterName) {
            throw ('Name require to get or create character');
        }

        var obj = findObjs({
            _type: 'character',
            name: shaped.characterName
        });

        if (obj.length === 0) {
            obj = createObj('character', {
                name: shaped.characterName,
                avatar: token.get('imgsrc')
            });

            shaped.status = shaped.characterName + ' created';
        } else {
            obj = getObj('character', obj[0].id);
            shaped.status = shaped.characterName + ' updated';
        }
        if (!obj) {
            throw ('Something prevent script to create or find character ' + shaped.characterName);
        }
        if (gmnotes) {
            obj.set({
                gmnotes: gmnotes
            });
        }

        shaped.characterId = obj.id;
        if (getAttrByName(shaped.characterId, 'is_npc') !== 1) {
            shaped.setAttribute('is_npc', 1);
        }

        return obj;
    },

    setUserDefinedScriptSettings: function () {
        if (shaped.settings.defaultTab) {
            shaped.setAttribute('tab', shaped.settings.defaultTab);
        }
        if (shaped.settings.sheetOutput === 'hidden') {
            shaped.setAttribute('output_option', '@{output_to_gm}');
        }
        if (shaped.settings.whisperDeathSaves) {
            shaped.setAttribute('death_save_output_option', '@{output_to_gm}');
        }
        if (shaped.settings.whisperInitiative) {
            shaped.setAttribute('initiative_output_option', '@{output_to_gm}');
        }
        if (shaped.settings.showCharacterNameOnRollTemplate) {
            shaped.setAttribute('show_character_name', '@{show_character_name_yes}');
        }
        if (shaped.settings.initiativeTieBreaker) {
            shaped.setAttribute('initiative_tie_breaker', '((@{initiative_overall}) / 100)');
        }
        if (shaped.settings.initiativeAddsToTracker) {
            shaped.setAttribute('initiative_to_tracker', '@{initiative_to_tracker_yes}');
        }
        if (shaped.settings.attacksVsTargetAC) {
            shaped.setAttribute('attacks_vs_target_ac', '@{attacks_vs_target_ac_yes}');
        }
        if (shaped.settings.attacksVsTargetName) {
            shaped.setAttribute('attacks_vs_target_name', '@{attacks_vs_target_name_yes}');
        }
        if (shaped.settings.hideGMInfo) {
            shaped.setAttribute('hide_save_dc', '@{hide_save_dc_var}');
            shaped.setAttribute('hide_save_failure', '@{hide_save_failure_var}');
            shaped.setAttribute('hide_save_success', '@{hide_save_success_var}');
            shaped.setAttribute('hide_effects', '@{hide_effects_var}');
            shaped.setAttribute('hide_recharge', '@{hide_recharge_var}');
        }
    },

    logObject: function (obj) {
        return;
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                shaped.logObject(obj[k]);
            } else {
                log('logObj: ' + k + '->' + obj[k]);
            }
        }
    },

    sortNumber: function (a, b) {
        return a - b;
    },

    importStatblock: function (token) {
        shaped.status = 'Nothing modified';
        errors = [];

        var statblock = token.get('gmnotes').trim();

        if (statblock === '') {
            throw ('Selected token GM Notes was empty.');
        }

        shaped.parseStatblock(token, statblock);
        if (shaped.characterId) {
            token.set('represents', shaped.characterId);
            var tokenName = shaped.characterName;
            if (shaped.settings.useAaronsNumberedScript && shaped.characterName.indexOf('%%NUMBERED%%') !== 1) {
                tokenName += ' %%NUMBERED%%';
            }
            token.set('name', tokenName);

            if (shaped.settings.showName) {
                token.set('showname', true);
            }
            if (shaped.settings.showNameToPlayers) {
                token.set('showplayers_name', true);
            }

            shaped.setUserDefinedScriptSettings();

            shaped.setBarValueAfterConvert(token);

            if (shaped.settings.bar[0].show) {
                token.set('showplayers_bar1', 'true');
            }
            if (shaped.settings.bar[1].show) {
                token.set('showplayers_bar2', 'true');
            }
            if (shaped.settings.bar[2].show) {
                token.set('showplayers_bar3', 'true');
            }

            shaped.setTokenVision(token);
        }
        shaped.messageToChat(shaped.status);

        if (errors.length > 0) {
            shaped.messageToChat('Error(s): ' + errors.join('\n/w GM '));
        }
    },

    setAttribute: function (name, currentVal, max) {
        if (!name) {
            throw ('Name required to set attribute');
        }

        max = max || '';

        if (!currentVal) {
            shaped.messageToChat('Error setting empty value: ' + name);
            return;
        }

        var attr = findObjs({
            _type: 'attribute',
            _characterid: shaped.characterId,
            name: name
        })[0];

        if (!attr) {
            //log('Creating attribute ' + name);
            createObj('attribute', {
                name: name,
                current: currentVal,
                max: max,
                characterid: shaped.characterId
            });
        } else if (!attr.get('current') || attr.get('current').toString() !== currentVal) {
            //log('Updating attribute ' + name);
            attr.set({
                current: currentVal,
                max: max
            });
        }
    },

    setAbility: function (name, description, action, istokenaction) {
        if (!name) {
            throw ('Name required to set ability');
        }

        var ability = findObjs({
            _type: 'ability',
            _characterid: shaped.characterId,
            name: name
        });

        if (!ability) {
            throw ('Something prevent script to create or find ability ' + name);
        }

        if (ability.length === 0) {
            ability = createObj('ability', {
                _characterid: shaped.characterId,
                name: name,
                description: description,
                action: action,
                istokenaction: istokenaction
            });
            //log('Ability ' + name + ' created');
        } else {
            ability = getObj('ability', ability[0].id);
            if (ability.get('description') != description || ability.get('action') !== action || ability.get('istokenaction') != istokenaction) {
                ability.set({
                    description: description,
                    action: action,
                    istokenaction: istokenaction
                });
                //log('Ability ' + name + ' updated');
            }
        }
    },

    parseStatblock: function (token, statblock) {
        log('---- Parsing statblock ----');

        var text = shaped.sanitizeText(shaped.clean(statblock)),
          keyword = shaped.findKeyword(text),
          section = shaped.splitStatblock(text, keyword);

        shaped.characterName = shaped.capitalizeEachWord(section.attr.name.toLowerCase());

        shaped.setCharacter(token, text.replace(/#/g, '<br>'));
        shaped.processSection(section);
    },

    clean: function (statblock) {
        return unescape(statblock)
          .replace(/\s\./g, '.')
          .replace(/–/g, '-')
          .replace(/<br[^>]*>/g, '#')
          .replace(/\s*#\s*/g, '#')
          .replace(/(<([^>]+)>)/gi, '')
          .replace(/#(?=[a-z]|DC)/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/#Hit:/gi, 'Hit:')
          .replace(/Hit:#/gi, 'Hit: ')
          .replace(/#Each /gi, 'Each ')
          .replace(/#On a successful save/gi, 'On a successful save')
          .replace(/DC#(\d+)/g, 'DC $1')
          .replace('LanguagesChallenge', 'Languages -#Challenge')
          .replace("' Speed", 'Speed')
          .replace(/#Medium or/gi, ' Medium or')
          .replace(/take#(\d+)/gi, 'take $1');
    },

    sanitizeText: function (text) {
        if (typeof text !== 'string') {
            text = text.toString();
        }

        text = text
          .replace(/\,\./gi, ',')
          .replace(/ft\s\./gi, 'ft.')
          .replace(/ft\.\s\,/gi, 'ft')
          .replace(/ft\./gi, 'ft')
          .replace(/(\d+) ft\/(\d+) ft/gi, '$1/$2 ft')
          .replace(/lOd/g, '10d')
          .replace(/dl0/gi, 'd10')
          .replace(/dlO/gi, 'd10')
          .replace(/dl2/gi, 'd12')
          .replace(/Sd(\d+)/gi, '5d$1')
          .replace(/ld(\d+)/gi, '1d$1')
          .replace(/ld\s+(\d+)/gi, '1d$1')
          .replace(/(\d+)d\s+(\d+)/gi, '$1d$2')
          .replace(/(\d+)\s+d(\d+)/gi, '$1d$2')
          .replace(/(\d+)\s+d(\d+)/gi, '$1d$2')
          .replace(/(\d+)d(\d)\s(\d)/gi, '$1d$2$3')
          .replace(/(\d+)j(?:Day|day)/gi, '$1/Day')
          .replace(/(\d+)f(?:Day|day)/gi, '$1/Day')
          .replace(/(\d+)j(\d+)/gi, '$1/$2')
          .replace(/(\d+)f(\d+)/gi, '$1/$2')
          .replace(/{/gi, '(')
          .replace(/}/gi, ')')
          .replace(/(\d+)\((\d+) ft/gi, '$1/$2 ft')
          .replace(/• /gi, '')
          .replace(/’/gi, '\'');
        text = text.replace(/(\d+)\s*?plus\s*?((?:\d+d\d+)|(?:\d+))/gi, '$2 + $1');
        var replaceObj = {
            'jday': '/day',
            'abol eth': 'aboleth',
            'ACT IONS': 'ACTIONS',
            'Afrightened': 'A frightened',
            'Alesser': 'A lesser',
            'Athl etics': 'Athletics',
            'Aundefinedr': 'After',
            'blindn ess': 'blindness',
            'blind sight': 'blindsight',
            'bofh': 'both',
            'brea stplate': 'breastplate',
            'choos in g': 'choosing',
            'com muni cate': 'communicate',
            'Constituti on': 'Constitution',
            'creatu re': 'creature',
            'darkvi sion': 'darkvision',
            'dea ls': 'deals',
            'di sease': 'disease',
            'di stance': 'distance',
            'fa lls': 'falls',
            'fe et': 'feet',
            'exha les': 'exhales',
            'ex istence': 'existence',
            'lfthe': 'If the',
            'Ifthe': 'If the',
            'lnt': 'Int',
            'magica lly': 'magically',
            'minlilte': 'minute',
            'natura l': 'natural',
            'ofeach': 'of each',
            'ofthe': 'of the',
            "on'e": 'one',
            '0n': 'on',
            'pass ive': 'passive',
            'Perce ption': 'Perception',
            'radi us': 'radius',
            'ra nge': 'range',
            'rega ins': 'regains',
            'rest.oration': 'restoration',
            'savin g': 'saving',
            'si lvery': 'silvery',
            's lashing': 'slashing',
            'slas hing': 'slashing',
            'slash in g': 'slashing',
            'slash ing': 'slashing',
            'Spel/casting': 'Spellcasting',
            'successfu l': 'successful',
            'ta rget': 'target',
            ' Th e ': ' The ',
            't_urns': 'turns',
            'unti l': 'until',
            'withi n': 'within'
        };
        var re = new RegExp(Object.keys(replaceObj).join('|'), 'gi');
        text = text.replace(re, function (matched) {
            return replaceObj[matched];
        });
        return text;
    },

    findKeyword: function (statblock) {
        var keyword = {
            attr: {},
            traits: {},
            actions: {},
            lair: {},
            legendary: {},
            reactions: {}
        };

        var indexAction = 0,
          indexLair = statblock.length,
          indexLegendary = statblock.length,
          indexReactions = statblock.length;

        // Standard keyword
        var regex = /#\s*(tiny|small|medium|large|huge|gargantuan|armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|lair actions|legendary actions|reactions)(?=\s|#)/gi;
        while (match = regex.exec(statblock)) {
            var key = match[1].toLowerCase();
            if (key === 'actions') {
                indexAction = match.index;
                keyword.actions.Actions = match.index;
            } else if (key === 'legendary actions') {
                indexLegendary = match.index;
                keyword.legendary.Legendary = match.index;
            } else if (key === 'reactions') {
                indexReactions = match.index;
                keyword.reactions.Reactions = match.index;
            } else if (key === 'lair actions') {
                indexLair = match.index;
                keyword.lair.Lair = match.index;
            } else {
                keyword.attr[key] = match.index;
            }
        }

        // Power
        regex = /(?:#)([A-Z][\w-\']+(?:\s(?:[A-Z][\w-\']+|[\(\)\/\d\-]|of|and|or|a)+)*)(?=\s*\.)/gi;
        log('parsed statblock: ' + statblock);
        while (match = regex.exec(statblock)) {
            if (!keyword.attr[match[1].toLowerCase()]) {
                if (match.index < indexAction) {
                    keyword.traits[match[1]] = match.index;
                } else if (match.index > indexAction && match.index < indexLegendary && match.index < indexReactions && match.index < indexLair) {
                    keyword.actions[match[1]] = match.index;
                } else if (match.index > indexLegendary && match.index < indexReactions && match.index < indexLair) {
                    keyword.legendary[match[1]] = match.index;
                } else if (match.index > indexReactions && match.index < indexLair) {
                    keyword.reactions[match[1]] = match.index;
                } else if (match.index > indexLair) {
                    keyword.lair[match[1]] = match.index;
                }
            }
        }

        var splitStatblock = statblock.split('#'),
          lastItem = '',
          actionsPosArray = [],
          i = 1;

        for (var actionsKey in keyword.actions) {
            if (keyword.actions.hasOwnProperty(actionsKey)) {
                actionsPosArray.push(keyword.actions[actionsKey]);
            }
        }
        for (var legendaryKey in keyword.legendary) {
            if (keyword.legendary.hasOwnProperty(legendaryKey)) {
                actionsPosArray.push(keyword.legendary[legendaryKey]);
            }
        }
        for (var lairKey in keyword.lair) {
            if (keyword.lair.hasOwnProperty(lairKey)) {
                actionsPosArray.push(keyword.lair[lairKey]);
            }
        }
        actionsPosArray.sort(shaped.sortNumber);

        var lastActionIndex = actionsPosArray[actionsPosArray.length - 1] + 1,
          lastItemIndex;

        while (i < 6) {
            lastItem = splitStatblock[splitStatblock.length - i];
            lastItemIndex = statblock.indexOf(lastItem);
            if (lastItemIndex > lastActionIndex) {
                keyword.traits.Description = lastItemIndex - 1; //-1 to include the #
            }
            i++;
        }

        return keyword;
    },

    splitStatblock: function (statblock, keyword) {
        var indexArray = [],
            section, obj, key;

        for (section in keyword) {
            if (keyword.hasOwnProperty(section)) {
                obj = keyword[section];
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        indexArray.push(obj[key]);
                    }
                }
            }
        }

        indexArray.sort(shaped.sortNumber);

        keyword.attr.name = shaped.extractSection(statblock.substring(0, indexArray[0]), 'name');

        for (section in keyword) {
            if (keyword.hasOwnProperty(section)) {
                obj = keyword[section];
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var start = obj[key],
                          nextPos = indexArray.indexOf(start) + 1,
                          end = indexArray[nextPos] || statblock.length;

                        keyword[section][key] = shaped.extractSection(statblock.substring(start, end), key);
                    }
                }
            }
        }

        delete keyword.actions.Actions;
        delete keyword.legendary.Legendary;
        delete keyword.reactions.Reactions;

        // Patch for multiline abilities
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for (var i = 0, len = abilitiesName.length; i < len; ++i) {
            if (keyword.attr.hasOwnProperty([abilitiesName[i]])) {
                abilities += keyword.attr[abilitiesName[i]] + ' ';
                delete keyword.attr[abilitiesName[i]];
            }
        }
        keyword.attr.abilities = abilities;

        // Size attribute:
        var sizes = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
        for (i = 0, len = sizes.length; i < len; ++i) {
            if (keyword.attr.hasOwnProperty([sizes[i]])) {
                keyword.attr.size = sizes[i] + ' ' + keyword.attr[sizes[i]];
                delete keyword.attr[sizes[i]];
                break;
            }
        }
        return keyword;
    },

    extractSection: function (text, title) {
        // Remove action name from action description and clean.
        return text.replace(new RegExp('^[\\s\\.#]*' + title.replace(/([-()\\/])/g, '\\$1') + '?[\\s\\.#]*', 'i'), '').replace(/#/g, ' ');
    },

    processSection: function (section) {
        // Process abilities first cause needed by other attribute.
        if (section.attr.abilities) shaped.parseAbilities(section.attr.abilities);
        if (section.attr.size) shaped.parseSize(section.attr.size);
        if (section.attr['armor class']) shaped.parseArmorClass(section.attr['armor class']);
        if (section.attr['hit points']) shaped.parseHp(section.attr['hit points']);
        if (section.attr.speed) shaped.parseSpeed(section.attr.speed);
        if (section.attr.challenge) shaped.parseChallenge(section.attr.challenge);
        if (section.attr['saving throws']) shaped.parseSavingThrow(section.attr['saving throws']);
        if (section.attr.skills) shaped.parseSkills(section.attr.skills);
        if (section.attr.senses) shaped.parseSenses(section.attr.senses);

        if (section.attr['damage immunities']) shaped.setAttribute('damage_immunity', section.attr['damage immunities']);
        if (section.attr['condition immunities']) shaped.setAttribute('condition_immunity', section.attr['condition immunities']);
        if (section.attr['damage vulnerabilities']) shaped.setAttribute('damage_vulnerability', section.attr['damage vulnerabilities']);
        if (section.attr['damage resistances']) shaped.setAttribute('damage_resistance', section.attr['damage resistances']);
        if (section.attr.languages) shaped.setAttribute('prolanguages', section.attr.languages);

        shaped.parseTraits(section.traits);
        shaped.parseReactions(section.reactions);
        shaped.parseActions(section.actions);
        shaped.parseActions(section.legendary, 'legendary_');
        shaped.parseActions(section.lair, 'lair_');
    },

    //Section parsing function
    parseAbilities: function (abilities) {
        var regex = /(\d+)\s*\(/g;
        var match = [],
            matches;

        while (matches = regex.exec(abilities)) {
            match.push(matches[1]);
        }

        shaped.setAttribute('strength', match[0]);
        shaped.setAttribute('dexterity', match[1]);
        shaped.setAttribute('constitution', match[2]);
        shaped.setAttribute('intelligence', match[3]);
        shaped.setAttribute('wisdom', match[4]);
        shaped.setAttribute('charisma', match[5]);
    },

    parseSize: function (size) {
        var match = size.match(/(.*?) (.*?), (.*)/i);
        if (!match || !match[1] || !match[2] || !match[3]) {
            throw 'Character doesn\'t have valid type/size/alignment format';
        }
        shaped.setAttribute('size', shaped.capitalizeEachWord(match[1]));
        shaped.setAttribute('npc_type', shaped.capitalizeEachWord(match[2]));
        shaped.setAttribute('alignment', shaped.capitalizeEachWord(match[3]));
    },

    parseArmorClass: function (ac) {
        var match = ac.match(/(\d+)\s?(.*)/);
        if (!match || !match[1]) {
            throw 'Character doesn\'t have valid AC format';
        }
        shaped.setAttribute('npc_AC', match[1]);
        if (match[2]) {
            shaped.setAttribute('npc_AC_note', match[2].replace(/\(|\)/g, ''));
        }
    },

    parseHD: function (hd) {
        var regex = (/(\d+)d(\d+)/gi),
          splitHD;

        while (splitHD = regex.exec(hd)) {
            if (!splitHD || !splitHD[1] || !splitHD[2]) {
                throw 'Character doesn\'t have valid hd format';
            }

            var numHD = splitHD[1],
              HDsize = 'd' + splitHD[2];

            shaped.setAttribute('hd_' + HDsize, numHD, numHD);
            shaped.setAttribute('hd_' + HDsize + '_toggle', 'on');
        }
    },

    parseHp: function (hp) {
        var match = hp.match(/(\d+)\s?\(([\dd\s\+\-]*)\)/i);
        if (!match || !match[1] || !match[2]) {
            throw 'Character doesn\'t have valid HP/HD format';
        }

        shaped.setAttribute('HP', match[1], match[1]);
        shaped.setAttribute('npc_HP_hit_dice', match[2]);
        shaped.parseHD(match[2]);
    },

    parseSpeed: function (speed) {
        var baseAttr = 'speed',
          regex = /(|burrow|climb|fly|swim|)\s*(\d+)\s*?(?:ft)?\s*(\(.*\))?/gi;

        while (match = regex.exec(speed)) {
            if (!match[2]) {
                throw 'Character doesn\'t have valid speed format';
            }
            var attrName = baseAttr + (match[1] !== '' ? '_' + match[1].toLowerCase() : ''),
              value = match[2];

            if (match[3]) {
                if (match[3].indexOf('hover')) {
                    shaped.setAttribute('speed_fly_hover', 'on');
                }
            }
            shaped.setAttribute(attrName, value);
        }
    },

    parseSenses: function (senses) {
        senses = senses.replace(/[,\s]*passive.*/i, '');
        var regex = /(|blindsight|darkvision|tremorsense|truesight|)\s*?(\d+)\s*?ft?\s*(\(.*\))?/gi;

        while (match = regex.exec(senses)) {
            if (!match || !match[1] || !match[2]) {
                throw 'Character doesn\'t have valid senses format';
            }

            var attrName = match[1].toLowerCase(),
              value = match[2];

            if (match[3]) {
                if (match[3].indexOf('blind beyond')) {
                    shaped.setAttribute('blindsight_blind_beyond', 'on');
                }
            }
            shaped.setAttribute(attrName, value);
        }
    },

    /*   setTokenVision: function (token) {
           var blindsight = parseInt(getAttrByName(shaped.characterId, 'blindsight'), 10) || 0,
             darkvision = parseInt(getAttrByName(shaped.characterId, 'darkvision'), 10) || 0,
             tremorsense = parseInt(getAttrByName(shaped.characterId, 'tremorsense'), 10) || 0,
             truesight = parseInt(getAttrByName(shaped.characterId, 'truesight'), 10) || 0,
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
   
           if (lightRadius > 0) {
               token.set('light_radius', lightRadius);
           }
           if (dimRadius) {
               token.set('light_dimradius', dimRadius);
           }
           token.set('light_hassight', true);
           token.set('light_angle', 360);
           token.set('light_losangle', 360);
       },*/ // SetTokenVision (original)

    parseChallenge: function (cr) {
        var input = cr.replace(/[, ]/g, '');
        var match = input.match(/([\d/]+).*?(\d+)/);
        shaped.setAttribute('challenge', match[1]);

        var xp = parseInt(match[2]);
        if (getAttrByName(shaped.characterId, 'xp') !== xp) {
            shaped.setAttribute('xp', xp);
        }
    },

    parseSavingThrow: function (save) {
        var regex = /(STR|DEX|CON|INT|WIS|CHA).*?(\d+)/gi,
          attr;
        while (match = regex.exec(save)) {
            // Substract ability modifier from this field since sheet computes it
            switch (match[1].toLowerCase()) {
                case 'str':
                    attr = 'strength';
                    break;
                case 'dex':
                    attr = 'dexterity';
                    break;
                case 'con':
                    attr = 'constitution';
                    break;
                case 'int':
                    attr = 'intelligence';
                    break;
                case 'wis':
                    attr = 'wisdom';
                    break;
                case 'cha':
                    attr = 'charisma';
                    break;
            }
            shaped.setAttribute(attr + '_save_prof', '@{PB}');

            var proficiencyBonus = (2 + Math.floor(Math.abs((eval(getAttrByName(shaped.characterId, 'challenge')) - 1) / 4))),
              totalSaveBonus = match[2] - proficiencyBonus - Math.floor((getAttrByName(shaped.characterId, attr) - 10) / 2);

            if (totalSaveBonus !== 0) {
                shaped.setAttribute(attr + '_save_bonus', totalSaveBonus);
            }
        }
    },

    parseSkills: function (skills) {
        // Need to substract ability modifier skills this field since sheet compute it
        var skillAbility = {
            'acrobatics': 'dexterity',
            'animal handling': 'wisdom',
            'arcana': 'intelligence',
            'athletics': 'strength',
            'deception': 'charisma',
            'history': 'intelligence',
            'insight': 'wisdom',
            'intimidation': 'charisma',
            'investigation': 'intelligence',
            'medicine': 'wisdom',
            'nature': 'intelligence',
            'perception': 'wisdom',
            'performance': 'charisma',
            'persuasion': 'charisma',
            'religion': 'intelligence',
            'sleight of hand': 'dexterity',
            'stealth': 'dexterity',
            'survival': 'wisdom'
        },
          extraSkillAbility = {
              "alchemist's supplies": "intelligence",
              "navigator's tools": "wisdom",
              "thieves' tools": "dexterity"
          };

        var regex = /([\w\s\']+).*?(\d+)/gi,
          customSkillNum = 0;
        while (match = regex.exec(skills.replace(/Skills\s+/i, ''))) {
            var skill = match[1].trim().toLowerCase(),
              proficiencyBonus = (2 + Math.floor(Math.abs((eval(getAttrByName(shaped.characterId, 'challenge')) - 1) / 4))),
              expertise = proficiencyBonus * 2;

            if (skill in skillAbility) {
                var abilitymod = skillAbility[skill],
                  attr = skill.replace(/\s/g, ''),
                  totalSkillBonus = match[2] - Math.floor((getAttrByName(shaped.characterId, abilitymod) - 10) / 2);

                if (totalSkillBonus >= expertise) {
                    shaped.setAttribute(attr + '_prof_exp', '@{exp}');
                    if (totalSkillBonus > expertise) {
                        shaped.setAttribute(attr + '_bonus', totalSkillBonus - expertise);
                    }
                } else if (totalSkillBonus >= proficiencyBonus) {
                    shaped.setAttribute(attr + '_prof_exp', '@{PB}');
                    if (totalSkillBonus > proficiencyBonus) {
                        shaped.setAttribute(attr + '_bonus', totalSkillBonus - proficiencyBonus);
                    }
                } else {
                    shaped.setAttribute(attr + '_prof_exp', '@{jack_of_all_trades}');
                    if (totalSkillBonus > 0) {
                        shaped.setAttribute(attr + '_bonus', totalSkillBonus);
                    }
                }
            } else if (skill in extraSkillAbility) {
                customSkillNum++;
                var abilitymod = extraSkillAbility[skill],
                  attr = 'custom_skill_' + customSkillNum,
                  totalSkillBonus = match[2] - Math.floor((getAttrByName(shaped.characterId, abilitymod) - 10) / 2);

                shaped.setAttribute(attr + '_name', shaped.capitalizeEachWord(skill));
                log('added ' + shaped.capitalizeEachWord(skill) + ' to custom skills');

                if (totalSkillBonus >= expertise) {
                    shaped.setAttribute(attr + '_prof_exp', '@{exp}');
                    if (totalSkillBonus > expertise) {
                        shaped.setAttribute(attr + '_bonus', totalSkillBonus - expertise);
                    }
                } else if (totalSkillBonus >= proficiencyBonus) {
                    shaped.setAttribute(attr + '_prof_exp', '@{PB}');
                    if (totalSkillBonus > proficiencyBonus) {
                        shaped.setAttribute(attr + '_bonus', totalSkillBonus - proficiencyBonus);
                    }
                } else {
                    shaped.setAttribute(attr + '_prof_exp', '@{jack_of_all_trades}');
                    if (totalSkillBonus > 0) {
                        shaped.setAttribute(attr + '_bonus', totalSkillBonus);
                    }
                }
            } else {
                errors.push('Skill ' + skill + ' is not a valid skill');
            }
            if (customSkillNum > 0) {
                shaped.setAttribute('custom_skills_toggle', 'on');
            }
        }
    },

    parseTraits: function (traits) {
        var traitsArray = [];
        _.each(traits, function (value, key) {
            traitsArray.push('**' + key + '**' + '. ' + value);
        });

        if (traitsArray.length > 0) {
            var traitsOutput = traitsArray.join('\n');
            shaped.setAttribute('npc_traits', traitsOutput);
        }
    },

    parseReactions: function (reactions) {
        var reactionsArray = [];
        _.each(reactions, function (value, key) {
            reactionsArray.push('**' + key + '**. ' + value);
        });
        if (reactionsArray.length > 0) {
            shaped.setAttribute('reactions', reactionsArray.join('\n'));
            shaped.setAttribute('toggle_reactions', 'on');
        }
    },

    parseActions: function (actions, actionType) {
        if (!actionType) {
            actionType = '';
        }
        var multiAttackText,
          actionPosition = []; // For use with multiattack.

        function processActions(actionList) {
            var actionNum = 0,
              legendaryActionsNotes = [];

            function setNPCActionAttribute(attribute, value, ifQuery) {
                if (typeof ifQuery === 'undefined') {
                    ifQuery = value;
                }
                if (ifQuery) {
                    shaped.setAttribute('repeating_' + actionType + 'actions_' + actionNum + '_' + attribute, value.trim());
                }
            }
            function setNPCActionToggle(attribute, toggle) {
                if (typeof toggle === 'undefined' || toggle) {
                    shaped.setAttribute('repeating_' + actionType + 'actions_' + actionNum + '_toggle_' + attribute, '@{repeating_' + actionType + 'actions_' + actionNum + '_var_' + attribute + '}');
                }
            }
            function parseCritDamage(damage) {
                return damage.replace(/\s?[\+\-]\s?\d+/g, '');
            }

            function setName(name) {
                setNPCActionAttribute('name', name);
            }
            function setType(type) {
                setNPCActionAttribute('type', type);
            }
            function setTarget(target) {
                setNPCActionAttribute('target', target);
                setNPCActionToggle('target');
            }
            function setRange(type) {
                setNPCActionAttribute('range', type);
                setNPCActionToggle('range');
            }

            function setDamage(damage, altSecondary) {
                setNPCActionAttribute(altSecondary + 'dmg', damage);
            }
            function toggleDamage(altSecondary) {
                setNPCActionToggle(altSecondary + 'damage');
            }
            function setDamageType(type, altSecondary) {
                setNPCActionAttribute(altSecondary + 'dmg_type', type);
            }
            function setCritDamage(critDamage, altSecondary) {
                setNPCActionAttribute(altSecondary + 'crit_dmg', critDamage);
            }
            function setAltDamageReason(damageReason) {
                setNPCActionAttribute('alt_' + 'dmg_reason', damageReason);
            }
            function setEffect(effect) {
                if (effect) {
                    setNPCActionAttribute('effect', effect.replace(/(\s*?Hit:\s?)/gi, '').replace(/(\d+)d(\d+)/g, '[[$1d$2]]').replace(/\s(\d+)\s/g, ' [[$1]] '));
                }
                setNPCActionToggle('effects', effect);
            }

            function setSaveDC(saveDC) {
                setNPCActionAttribute('save_dc', saveDC);
            }
            function setSaveStat(saveStat) {
                if (saveStat) {
                    setNPCActionAttribute('save_stat', saveStat.substring(0, 3));
                }
            }
            function toggleSave(toggle) {
                setNPCActionToggle('save', toggle);
            }
            function toggleSaveDamage(toggle) {
                setNPCActionToggle('save_damage', toggle);
            }
            function setSaveDamage(saveDamage) {
                setNPCActionAttribute('save_dmg', saveDamage);
            }
            function setSaveDamageType(saveDamageType) {
                setNPCActionAttribute('save_dmg_type', saveDamageType);
            }
            function setSaveSuccess(saveSuccess) {
                setNPCActionAttribute('save_success', saveSuccess);
            }
            function setSaveEffect(saveEffect) {
                setEffect(saveEffect);
            }

            var commaPeriodSpace = /\,?\.?\s*?/,
              commaPeriodDefinitiveSpace = /\,?\.?\s*/,
              commaPeriodOneSpace = /\,?\.?\s?/,
              hit = /Hit:.*?/,
              each = /(?: Each).*?/,
              damageType = /((?:[\w]+|[\w]+\s(?:or|and)\s[\w]+)(?:\s*?\([\w\s]+\))?)\s*?damage\s?(\([\w\'\s]+\))?/,
              damageSyntax = /(?:(\d+)|.*?\(([\dd\s\+\-]*)\).*?)\s*?/,
              altDamageSyntax = /(?:\,\s*?or\s*?)/,
              altDamageReasonSyntax = /((?:if|in)[\w\s]+)/,
              altDamageExtraSyntax = /(The.*|If the.*)?/,
              plus = /\s*?plus\s*?/,
              savingThrow = /(?:DC)\s*?(\d+)\s*?([a-zA-Z]*)\s*?(?:saving throw)/,
              takeOrTaking = /\,?\s*?(?:taking|or take)/,
              againstDisease = /(?: against disease)?/,
              saveSuccess = /(?:.*or\s(.*)?\son a successful one.)?/,
              saveSuccessTwo = /(?:On a successful save,)?(.*)?/,
              saveFailure = /(?:On a (?:failure|failed save))\,\s(?:(.*). On a success,\s(.*)?)?(.*)?/,
              andAnythingElse = /(\s?and.*)?/,
              orAnythingElseNoTake = /(or\s(?!take).*)/,
              anythingElse = /(.*)?/,
              damageRegex = new RegExp(hit.source + damageSyntax.source + damageType.source + commaPeriodSpace.source + andAnythingElse.source, 'i'),
              damagePlusRegex = new RegExp(plus.source + damageSyntax.source + damageType.source + commaPeriodSpace.source + anythingElse.source, 'i'),
              altDamageRegex = new RegExp(altDamageSyntax.source + damageSyntax.source + damageType.source + commaPeriodSpace.source + altDamageReasonSyntax.source + commaPeriodOneSpace.source + altDamageExtraSyntax.source, 'i'),
              hitEffectRegex = new RegExp(hit.source + anythingElse.source, 'i'),
              saveDamageRegex = new RegExp(savingThrow.source + takeOrTaking.source + damageSyntax.source + damageType.source + saveSuccess.source + commaPeriodSpace.source + anythingElse.source + saveSuccessTwo.source, 'i'),
              saveOrRegex = new RegExp(savingThrow.source + againstDisease.source + commaPeriodDefinitiveSpace.source + orAnythingElseNoTake.source, 'i'),
              saveFailedSaveRegex = new RegExp(savingThrow.source + commaPeriodSpace.source + saveFailure.source, 'i');

            function parseDamage(damage, altSecondary) {
                //log('parseDamage: ' + damage);
                if (damage) {
                    //1 is damage without dice. Example "1"
                    //2 is damage with dice. Example "2d6+4"
                    //3 is damage type. Example "slashing" or "lightning or thunder"
                    //4 is damage type explanation. Example "(djinni's choice)"
                    //5 is effects
                    if (damage[1]) {
                        damage[2] = damage[1];
                    }
                    if (damage[2]) {
                        setDamage(damage[2], altSecondary);
                        setCritDamage(parseCritDamage(damage[2]), altSecondary);
                    }
                    if (damage[4]) {
                        damage[3] += ' ' + damage[4];
                    }
                    if (damage[3]) {
                        setDamageType(damage[3], altSecondary);
                    }
                    if (damage[2] || damage[3]) {
                        toggleDamage(altSecondary);
                    }
                    if (damage[5]) {
                        setEffect(damage[5].trim());
                    }
                    if (damage[6]) {
                        setAltDamageReason(damage[6]);
                    }
                }
            }

            _.each(actionList, function (value, key) {
                var parsedAttack = false,
                  parsedSave = false,
                  parsedDamage = false,
                  parsed,
                  pos = key.indexOf('(');

                if (pos > 1) {
                    actionPosition[actionNum] = key.substring(0, pos - 1).toLowerCase();
                } else {
                    actionPosition[actionNum] = key.toLowerCase();
                }

                var keyRegex = /\s*?\((?:Recharge\s*?(\d+\-\d+|\d+)|Recharges\safter\sa\s(.*))\)/gi;
                while (keyResult = keyRegex.exec(key)) {
                    var recharge = keyResult[1] || keyResult[2];
                    setNPCActionAttribute('recharge', recharge);
                    setNPCActionToggle('recharge');
                    if (recharge) {
                        key = key.replace(keyRegex, '');
                    }
                }
                var rechargeDayRegex = /\s*?\((\d+\/Day)\)/gi;
                while (rechargeDayResult = rechargeDayRegex.exec(key)) {
                    var recharge = rechargeDayResult[1] || rechargeDayResult[2];
                    setNPCActionAttribute('recharge', recharge);
                    setNPCActionToggle('recharge');
                    if (recharge) {
                        key = key.replace(rechargeDayRegex, '');
                    }
                }

                setName(key);

                var splitAction = value.split(/\.(.+)?/),
                  attackInfo = splitAction[0],
                  splitAttack = attackInfo.split(',');

                var typeRegex = /(melee|ranged|melee or ranged)\s*(spell|weapon)\s*/gi;
                while (type = typeRegex.exec(splitAttack[0])) {
                    if (type[1]) {
                        var meleeOrRanged = 'Melee or Ranged';
                        if (type[1].toLowerCase() === meleeOrRanged.toLowerCase()) {
                            type[1] = 'Thrown';
                        }
                        setType(shaped.capitalizeEachWord(type[1]));
                    }
                    if (type[2]) {
                        var attackWeaponOrSpell = shaped.capitalizeEachWord(type[2]);
                    }
                    parsedAttack = true;
                }
                var toHitRegex = /\+\s?(\d+)\s*(?:to hit)/gi;
                while (toHit = toHitRegex.exec(splitAttack[0])) {
                    if (toHit[1]) {
                        setNPCActionAttribute('tohit', toHit[1]);
                        setNPCActionToggle('attack');
                        setNPCActionToggle('crit');
                    }
                    if (splitAttack[2]) {
                        setTarget(splitAttack[2].trim().toLowerCase());
                    }
                    parsedAttack = true;
                }
                var reachRegex = /(?:reach)\s?(\d+)\s?(?:ft)/gi;
                while (reach = reachRegex.exec(splitAttack[1])) {
                    if (reach[1]) {
                        setNPCActionAttribute('reach', reach[1] + ' ft', reach[1]);
                        setNPCActionToggle('reach');
                    }
                    parsedAttack = true;
                }
                var rangeRegex = /(?:range)\s?(\d+)\/(\d+)\s?(ft)/gi;
                while (range = rangeRegex.exec(splitAttack[1])) {
                    if (range[1] && range[2]) {
                        setRange(range[1] + '/' + range[2] + ' ft');
                    }
                    parsedAttack = true;
                }


                var damage = damageRegex.exec(value);
                if (damage) {
                    parseDamage(damage, '');
                } else {
                    var hitEffect = hitEffectRegex.exec(value);
                    if (hitEffect) {
                        if (hitEffect[1]) {
                            setEffect(hitEffect[1].trim());
                        }
                    }
                }

                var damagePlus = damagePlusRegex.exec(value);
                if (damagePlus) {
                    parseDamage(damagePlus, 'second_');
                }
                var altDamage = altDamageRegex.exec(value);
                if (altDamage) {
                    altDamage[6] = [altDamage[5], altDamage[5] = altDamage[6]][0]; //swap 5 and 6
                    parseDamage(altDamage, 'alt_');
                }

                var damage = damageRegex.exec(value);
                if (saveDmg) {
                    parseDamage(damage, '');
                }

                var saveDmg = saveDamageRegex.exec(value);
                if (saveDmg) {
                    //1 is save DC. Example "13"
                    //2 is save stat. Example "Dexterity"
                    //3 is damage without dice. Example "1"
                    //4 is damage with dice. Example "2d6+4"
                    //5 is damage type. Example "slashing" or "lightning or thunder"
                    //6 is damage type explanation. Example "(djinni's choice)"
                    //7 is save success. Example "half as much damage"
                    //8 is effects
                    //9 is the other form of save success

                    if (saveDmg[1]) {
                        setSaveDC(saveDmg[1]);
                    }
                    if (saveDmg[2]) {
                        setSaveStat(saveDmg[2]);
                    }
                    if (saveDmg[3]) {
                        saveDmg[4] = saveDmg[3];
                    }
                    if (saveDmg[4]) {
                        setSaveDamage(saveDmg[4]);
                    }
                    if (saveDmg[6]) {
                        saveDmg[5] += ' ' + saveDmg[6];
                    }
                    if (saveDmg[5]) {
                        setSaveDamageType(saveDmg[5]);
                    }
                    if (saveDmg[9]) {
                        saveDmg[7] = saveDmg[9];
                    }
                    if (saveDmg[7]) {
                        setSaveSuccess(saveDmg[7]);
                    }
                    if (saveDmg[8]) {
                        setSaveEffect(saveDmg[8]);
                    }
                    if (saveDmg[1] || saveDmg[2] || saveDmg[8]) {
                        toggleSave();
                    }
                    if (saveDmg[4] || saveDmg[5] || saveDmg[7]) {
                        toggleSaveDamage();
                    }
                    parsedSave = true;
                }

                var saveOr = saveOrRegex.exec(value);
                if (saveOr) {
                    //1 is save DC. Example "13"
                    //2 is save stat. Example "Dexterity"
                    //3 is effects

                    //log('saveOr: ' + saveOr);
                    if (saveOr[1]) {
                        setSaveDC(saveOr[1]);
                    }
                    if (saveOr[2]) {
                        setSaveStat(saveOr[2]);
                    }
                    if (saveOr[3]) {
                        setSaveEffect(saveOr[3]);
                    }
                    if (saveOr[1] || saveOr[2] || saveOr[3]) {
                        toggleSave();
                    }
                    parsedSave = true;
                }

                var saveFailed = saveFailedSaveRegex.exec(value);
                if (saveFailed) {
                    //1 is save DC. Example "13"
                    //2 is save stat. Example "Dexterity"
                    //3 is failure state (effects)
                    //4 is success state
                    //5 is failure state w/o success sate.

                    //log('saveFailed: ' + saveFailed);
                    if (saveFailed[1]) {
                        setSaveDC(saveFailed[1]);
                    }
                    if (saveFailed[2]) {
                        setSaveStat(saveFailed[2]);
                    }
                    if (saveFailed[5]) {
                        saveFailed[3] = saveFailed[5];
                    }
                    if (saveFailed[3]) {
                        setSaveEffect(saveFailed[3]);
                    }
                    if (saveFailed[4]) {
                        setSaveSuccess(saveFailed[4]);
                    }
                    if (saveFailed[1] || saveFailed[2] || saveFailed[3] || saveFailed[4]) {
                        toggleSave();
                    }
                    parsedSave = true;
                }

                var saveRangeRegex = /((?:Each | a | an | one ).*(?:creature|target).*)\s(?:within|in)\s*?a?\s*?(\d+)\s*?(?:feet|ft)/gi;
                while (saveRange = saveRangeRegex.exec(value)) {
                    if (saveRange[1]) {
                        setTarget(saveRange[1].trim());
                    }
                    if (saveRange[2]) {
                        setRange(saveRange[2] + ' ft', saveRange[2]);
                    }
                }

                var lineRangeFootRegex = /(\d+)\-foot line\s*?that is (\d+) feet wide/gi,
                  lineRangeFoot = lineRangeFootRegex.exec(value),
                  lineRangeFeetRegex = /line that is (\d+)\sfeet long\s*?and (\d+) feet wide/gi,
                  lineRangeFeet = lineRangeFeetRegex.exec(value),
                  lineRange = lineRangeFoot || lineRangeFeet;
                if (lineRange) {
                    setType('Line');
                    if (lineRange[1] && lineRange[2]) {
                        setRange(lineRange[1] + '-foot line that is ' + lineRange[2] + ' feet wide');
                    } else if (lineRange[1]) {
                        setRange(lineRange[1]);
                    }
                }

                var lineTargetRegex = /\.\s*(.*in that line)/gi;
                while (lineTarget = lineTargetRegex.exec(value)) {
                    setTarget(lineTarget[1]);
                }


                function createTokenAction() {
                    // Create token action
                    shaped.setAbility(key, '', '%{' + shaped.characterName + '|repeating_' + actionType + 'actions_' + actionNum + '_action}', shaped.settings.createAbilityAsToken);
                }
                parsed = parsedAttack || parsedDamage || parsedSave;
                if (!parsed) {
                    if (actionType === 'legendary_') {
                        legendaryActionsNotes.push(key + '. ' + value);
                    } else {
                        setEffect(value);
                        createTokenAction();
                        actionNum++;
                    }
                } else {
                    if (actionType === 'legendary_') {
                        legendaryActionsNotes.push(key + '. See below');
                    }
                    if (key.indexOf('Costs ') > 0) {
                        key = key.replace(/\s*\(Costs\s*\d+\s*Actions\)/gi, '');
                        setName(key);
                    }
                    createTokenAction();
                    actionNum++;
                }
            });

            if (legendaryActionsNotes.length > 0) {
                shaped.setAttribute('legendary_action_notes', legendaryActionsNotes.join('\n'));
            }
        }

        if (shaped.settings.addInitiativeTokenAbility) {
            shaped.createInitTokenAction(shaped.characterName);
        }
        if (shaped.settings.addSaveQueryMacroTokenAbility) {
            shaped.createSaveQueryTokenAction(shaped.characterName);
        }
        if (shaped.settings.addCheckQueryMacroTokenAbility) {
            shaped.createCheckQueryTokenAction(shaped.characterName);
        }

        for (var key in actions) {
            var multiattackRegex = /Multiattack(?:\s*(\(.*\)))?/gi,
              multi = multiattackRegex.exec(key),
              multiAttackText = '';
            if (multi) {
                if (multi[1]) {
                    multiAttackText = multi[1] + ': ';
                }
                multiAttackText += actions[key];
                shaped.setAttribute('multiattack', multiAttackText);
                delete actions[key];

                shaped.setAttribute('toggle_multiattack', 'on');

                shaped.setAbility('MultiAtk', '', '%{' + shaped.characterName + '|multiattack}', shaped.settings.createAbilityAsToken);
                break;
            }
        }

        processActions(actions);

        if (actionType === 'lair_' && Object.keys(actions).length > 0) {
            shaped.setAttribute('toggle_lair_actions', 'on');
        }
        if (actionType === 'legendary_' && Object.keys(actions).length > 0) {
            shaped.setAttribute('toggle_legendary_actions', 'on');
        }

        function addActionToMultiattack(actionNumber) {
            if (multiattackScript !== '') {
                multiattackScript += '\n';
            }
            multiattackScript += '%{' + shaped.characterName + '|repeating_actions_' + actionNumber + '_action}';
        }

        if (multiAttackText) {
            var actionList = actionPosition.join('|'),
              multiattackRegex = new RegExp('(one|two|three)? (?:with its )?(' + actionList + ')( or)?', 'gi'),
              multiattackScript = '',
              actionNumber;

            while (match = multiattackRegex.exec(multiAttackText)) {
                var action = match[2],
                  nb = match[1] || 'one';

                actionNumber = actionPosition.indexOf(action.toLowerCase());

                if (actionNumber !== -1) {
                    addActionToMultiattack(actionNumber);
                    if (nb == 'two') {
                        addActionToMultiattack(actionNumber);
                    }
                    if (nb == 'three') {
                        addActionToMultiattack(actionNumber);
                    }
                    if (match[3]) {
                        multiattackScript += 'or\n';
                    }

                    delete actionPosition[actionNumber]; // Remove
                }
            }

            shaped.setAttribute('multiattack_script', multiattackScript);

        }
    },

    parseActionsForConvert: function () {
        var actions = {},
          lairActions = {},
          legendaryActions = {},
          reactions = [];

        for (var i = 1; i <= 20; i++) {
            var name = getAttrByName(shaped.characterId, 'npc_action_name' + i, 'current'),
              type = getAttrByName(shaped.characterId, 'npc_action_type' + i, 'current'),
              description = getAttrByName(shaped.characterId, 'npc_action_description' + i, 'current'),
              effect = getAttrByName(shaped.characterId, 'npc_action_effect' + i, 'current'),
              combinedText = description + ' ' + effect;

            if (name) {
                combinedText = combinedText.replace(/\s*?\:\s*?\[\[(\d+d\d+[\d\s+|\-]*)\]\]\s*?\|\s*?\[\[(\d+d\d+[\d\s+|\-]*)\]\]/gi, '').replace(/\[\[(\d*d\d+[\d\s+|\-]*)\]\]/gi, '$1');

                if (type.indexOf('Bonus Action') === 1) {
                    log('Bonus Action ' + name + ' changed to a normal action');
                    actions[name] = combinedText;
                } else if (type.indexOf('Legendary Action') === 1) {
                    log('Legendary Action ' + name);
                    legendaryActions[name] = (combinedText);
                } else if (type.indexOf('Reaction') === 1) {
                    log('Reaction ' + name);
                    reactions.push(combinedText);
                } else if (type.indexOf('Lair Action') === 1) {
                    log('Lair Action ' + name);
                    lairActions[name] = (combinedText);
                } else if (type.indexOf('Special Action') === 1) {
                    log('Special Action ' + name + ' changed to a normal action');
                    actions[name] = combinedText;
                } else {
                    log('Action ' + name);
                    actions[name] = combinedText;
                }
            }
        }
        if (Object.keys(actions).length > 0) {
            shaped.parseActions(actions);
        }
        if (Object.keys(legendaryActions).length > 0) {
            shaped.parseActions(legendaryActions, 'legendary_');
        }
        if (reactions.length > 0) {
            shaped.setAttribute('reactions', reactions.join('\n'));
            shaped.setAttribute('toggle_reactions', 'on');
        }
        if (Object.keys(lairActions).length > 0) {
            shaped.parseActions(lairActions, 'lair_');
        }


    },

    convertAttrFromNPCtoPC: function (npc_attr_name, attr_name) {
        var npc_attr = getAttrByName(shaped.characterId, npc_attr_name),
          attr = getAttrByName(shaped.characterId, attr_name);

        if (npc_attr && !attr) {
            log('convert from ' + npc_attr_name + ' to ' + attr_name);
            npc_attr = shaped.sanitizeText(npc_attr);
            shaped.setAttribute(attr_name, npc_attr);
        }
    },

    parseOldToNew: function (token) {
        log('---- Parsing old attributes to new ----');

        shaped.characterId = token.attributes.represents;


        shaped.convertAttrFromNPCtoPC('npc_initiative', 'initiative');
        shaped.convertAttrFromNPCtoPC('npc_initiative_overall', 'initiative_overall');


        shaped.convertAttrFromNPCtoPC('npc_strength', 'strength');
        shaped.convertAttrFromNPCtoPC('npc_strength_save_bonus', 'strength_save_bonus');
        shaped.convertAttrFromNPCtoPC('npc_basic_strength_bonus', 'basic_strength_bonus');
        shaped.convertAttrFromNPCtoPC('npc_dexterity', 'dexterity');
        shaped.convertAttrFromNPCtoPC('npc_dexterity_save_bonus', 'dexterity_save_bonus');
        shaped.convertAttrFromNPCtoPC('npc_basic_dexterity_bonus', 'basic_dexterity_bonus');
        shaped.convertAttrFromNPCtoPC('npc_constitution', 'constitution');
        shaped.convertAttrFromNPCtoPC('npc_constitution_save_bonus', 'constitution_save_bonus');
        shaped.convertAttrFromNPCtoPC('npc_basic_constitution_bonus', 'basic_constitution_bonus');
        shaped.convertAttrFromNPCtoPC('npc_intelligence', 'intelligence');
        shaped.convertAttrFromNPCtoPC('npc_intelligence_save_bonus', 'intelligence_save_bonus');
        shaped.convertAttrFromNPCtoPC('npc_basic_intelligence_bonus', 'basic_intelligence_bonus');
        shaped.convertAttrFromNPCtoPC('npc_wisdom', 'wisdom');
        shaped.convertAttrFromNPCtoPC('npc_wisdom_save_bonus', 'wisdom_save_bonus');
        shaped.convertAttrFromNPCtoPC('npc_basic_wisdom_bonus', 'basic_wisdom_bonus');
        shaped.convertAttrFromNPCtoPC('npc_charisma', 'charisma');
        shaped.convertAttrFromNPCtoPC('npc_charisma_save_bonus', 'charisma_save_bonus');
        shaped.convertAttrFromNPCtoPC('npc_basic_charisma_bonus', 'basic_charisma_bonus');


        shaped.convertAttrFromNPCtoPC('npc_alignment', 'alignment');


        var npc_HP = getAttrByName(shaped.characterId, 'npc_HP'),
          HP = getAttrByName(shaped.characterId, 'HP'),
          npc_HP_max = getAttrByName(shaped.characterId, 'npc_HP', 'max'),
          HP_max = getAttrByName(shaped.characterId, 'HP', 'max');
        if (npc_HP && !HP && npc_HP_max && !HP_max) {
            shaped.setAttribute('HP', npc_HP, npc_HP_max);
        } else if (npc_HP && !HP) {
            shaped.setAttribute('HP', npc_HP);
        } else if (npc_HP_max && !HP_max) {
            shaped.setAttribute('HP', 0, npc_HP_max);
        }
        shaped.convertAttrFromNPCtoPC('npc_temp_HP', 'temp_HP');

        var npc_hd = getAttrByName(shaped.characterId, 'npc_HP_hit_dice');
        if (npc_hd) {
            shaped.parseHD(npc_hd);
        }

        var speedConvertToOrig = [],
          speed = getAttrByName(shaped.characterId, 'npc_speed'),
          speed_fly = getAttrByName(shaped.characterId, 'npc_speed_fly'),
          speed_climb = getAttrByName(shaped.characterId, 'npc_speed_climb'),
          speed_swim = getAttrByName(shaped.characterId, 'npc_speed_swim');

        if (speed) {
            if (speed.indexOf('ft') !== 1) {
                speed += ' ft';
            }
            speedConvertToOrig.push(speed);
        }
        if (speed_fly) {
            if (speed_fly.indexOf('ft') !== 1) {
                speed_fly += ' ft';
            }
            speedConvertToOrig.push('fly ' + speed_fly);
        }
        if (speed_climb) {
            if (speed_climb.indexOf('ft') !== 1) {
                speed_climb += ' ft';
            }
            speedConvertToOrig.push('climb' + speed_climb);
        }
        if (speed_swim) {
            if (speed_swim.indexOf('ft') !== 1) {
                speed_swim += ' ft';
            }
            speedConvertToOrig.push('swim' + speed_swim);
        }
        shaped.parseSpeed(speedConvertToOrig.join(', '));

        shaped.convertAttrFromNPCtoPC('npc_xp', 'xp');
        shaped.convertAttrFromNPCtoPC('npc_challenge', 'challenge');
        convertAttrFromNPCtoPC('npc_size', 'size');
        shaped.parseSenses(shaped.sanitizeText(getAttrByName(shaped.characterId, 'npc_senses')));
        shaped.convertAttrFromNPCtoPC('npc_languages', 'prolanguages');


        shaped.convertAttrFromNPCtoPC('npc_damage_resistance', 'damage_resistance');
        shaped.convertAttrFromNPCtoPC('npc_damage_vulnerability', 'damage_vulnerability');
        shaped.convertAttrFromNPCtoPC('npc_damage_immunity', 'damage_immunity');
        shaped.convertAttrFromNPCtoPC('npc_condition_immunity', 'condition_immunity');


        shaped.convertAttrFromNPCtoPC('npc_acrobatics_bonus', 'acrobatics_bonus');
        shaped.convertAttrFromNPCtoPC('npc_animalhandling_bonus', 'animalhandling_bonus');
        shaped.convertAttrFromNPCtoPC('npc_arcana_bonus', 'arcana_bonus');
        shaped.convertAttrFromNPCtoPC('npc_athletics_bonus', 'athletics_bonus');
        shaped.convertAttrFromNPCtoPC('npc_deception_bonus', 'deception_bonus');
        shaped.convertAttrFromNPCtoPC('npc_history_bonus', 'history_bonus');
        shaped.convertAttrFromNPCtoPC('npc_insight_bonus', 'insight_bonus');
        shaped.convertAttrFromNPCtoPC('npc_intimidation_bonus', 'intimidation_bonus');
        shaped.convertAttrFromNPCtoPC('npc_investigation_bonus', 'investigation_bonus');
        shaped.convertAttrFromNPCtoPC('npc_medicine_bonus', 'medicine_bonus');
        shaped.convertAttrFromNPCtoPC('npc_nature_bonus', 'nature_bonus');
        shaped.convertAttrFromNPCtoPC('npc_perception_bonus', 'perception_bonus');
        shaped.convertAttrFromNPCtoPC('npc_performance_bonus', 'performance_bonus');
        shaped.convertAttrFromNPCtoPC('npc_persuasion_bonus', 'persuasion_bonus');
        shaped.convertAttrFromNPCtoPC('npc_religion_bonus', 'religion_bonus');
        shaped.convertAttrFromNPCtoPC('npc_sleightofhand_bonus', 'sleightofhand_bonus');
        shaped.convertAttrFromNPCtoPC('npc_stealth_bonus', 'stealth_bonus');
        shaped.convertAttrFromNPCtoPC('npc_survival_bonus', 'survival_bonus');

        shaped.setUserDefinedScriptSettings();

        shaped.parseActionsForConvert();

        shaped.setBars(token);

        shaped.setTokenVision(token);

        if (shaped.settings.showName) {
            token.set('showname', true);
        }

        shaped.messageToChat('Character ' + token.attributes.name + ' converted');
    },

    clearBar: function (token, bar) {
        token.set(bar + '_link', '');
        token.set(bar + '_value', '');
        token.set(bar + '_max', '');
    },

    setBarValueAfterConvert: function (token) {
        for (var i = 0; i < 3; i++) {
            var barName = shaped.settings.bar[i].name,
              barTokenName = 'bar' + (i + 1);

            if (barName !== '') {
                var objOfBar = findObjs({
                    name: barName,
                    _type: 'attribute',
                    _characterid: shaped.characterId
                }, { caseInsensitive: true })[0],
                  barLink, barCurrent, barMax;

                if (objOfBar) {
                    barLink = objOfBar.id;
                    barCurrent = objOfBar.attributes.current;
                    barMax = objOfBar.attributes.max;
                } else {
                    barLink = 'sheetattr_' + barName;
                    /*
                    barCurrent = parseValuesViaSendChat(barName);
                    barMax = parseValuesViaSendChat(barName);
                    */
                }

                if (shaped.settings.bar[i].link) {
                    //log(barTokenName + ': setting link to: ' + barLink);
                    token.set(barTokenName + '_link', barLink);
                } else {
                    if (token.get(barTokenName + '_link')) {
                        log(barTokenName + ': link isn\'t set in the bar settings, clearing link');
                        token.set(barTokenName + '_link', '');
                    }
                }
                if (barName) {
                    //log(barTokenName + ': setting current to: ' + barCurrent);
                    token.set(barTokenName + '_value', barCurrent);
                } else {
                    if (token.get(barTokenName + '_value')) {
                        log(barTokenName + ': current isn\'t set in the bar settings, clearing current');
                        token.set(barTokenName + '_value', '');
                    }
                }
                if (shaped.settings.bar[i].max) {
                    //log(barTokenName + ': setting max to: ' + barMax);
                    token.set(barTokenName + '_max', barMax);
                } else {
                    if (token.get(barTokenName + '_max')) {
                        log(barTokenName + ': max isn\'t set in the bar settings, clearing max');
                        token.set(barTokenName + '_max', '');
                    }
                }
            } else {
                log(barTokenName + ': no defined bar setting in shaped-scripts (at the top of the page), clearing ' + barTokenName + '.');
                shaped.clearBar(token, barTokenName);
            }
        }
    },

    setBars: function (token) {
        setBarValueAfterConvert(token);
    },

    changeSettings: function (args) {
        log(args);
        var changeNPCs = false,
          changePCs = false,
          attributesToChange = {},
          attributeName;

        if (args[0] === 'npcs') {
            changeNPCs = true;
        } else if (args[0] === 'pcs') {
            changePCs = true;
        } else if (args[0] === 'all') {
            changeNPCs = true;
            changePCs = true;
        } else {
            shaped.messageToChat('invalid target. Please send "npcs", "pcs", or "all"');
        }

        var validAttributeName = ['output_option', 'death_save_output_option', 'initiative_output_option', 'show_character_name', 'initiative_tie_breaker', 'initiative_to_tracker', 'attacks_vs_target_ac', 'attacks_vs_target_name', 'gm_info', 'save_dc', 'save_failure', 'save_success', 'effects', 'recharge'];
        if (validAttributeName.indexOf(args[1]) !== -1) {
            attributeName = args[1];
        } else {
            shaped.messageToChat('invalid attribute. Please use one of the following: ' + validAttributeName.join(', '));
        }

        function showHide(field, prefix, show, hide) {
            if (attributeName === field) {
                attributeName = prefix + '_' + field;
                if (args[2] === 'show') {
                    attributesToChange[attributeName] = show;
                } else if (args[2] === 'hide') {
                    attributesToChange[attributeName] = hide;
                }
            }
        }
        function yesNo(field, yes, no) {
            if (attributeName === field) {
                if (args[2] === 'yes') {
                    attributesToChange[attributeName] = yes;
                } else if (args[2] === 'no') {
                    attributesToChange[attributeName] = no;
                }
            }
        }

        var validAttributeValue = ['hide', 'show', 'yes', 'no'];
        if (validAttributeValue.indexOf(args[2]) !== -1) {
            if (attributeName === 'output_option' || attributeName === 'death_save_output_option' || attributeName === 'initiative_output_option') {
                if (args[2] === 'show') {
                    attributesToChange[attributeName] = '@{output_to_all}';
                } else if (args[2] === 'hide') {
                    attributesToChange[attributeName] = '@{output_to_gm}';
                }
            }

            showHide('character_name', 'show', '@{show_character_name_yes}', '@{show_character_name_no}');

            yesNo('initiative_tie_breaker', '((@{initiative_overall}) / 100)', '');
            yesNo('initiative_to_tracker', '@{initiative_to_tracker_yes}', '@{initiative_to_tracker_no}');
            yesNo('attacks_vs_target_ac', '@{attacks_vs_target_ac_yes}', '@{attacks_vs_target_ac_no}');
            yesNo('attacks_vs_target_name', '@{attacks_vs_target_name_yes}', '@{attacks_vs_target_name_no}');

            showHide('save_dc', 'hide', '', '@{hide_save_dc_var}');
            showHide('save_failure', 'hide', '', '@{hide_save_failure_var}');
            showHide('save_success', 'hide', '', '@{hide_save_success_var}');
            showHide('effects', 'hide', '', '@{hide_effects_var}');
            showHide('recharge', 'hide', '', '@{hide_recharge_var}');

            if (attributeName === 'gm_info') {
                if (args[2] === 'show') {
                    attributesToChange['hide_save_dc'] = '';
                    attributesToChange['hide_save_failure'] = '';
                    attributesToChange['hide_save_success'] = '';
                    attributesToChange['hide_effects'] = '';
                    attributesToChange['hide_recharge'] = '';
                } else if (args[2] === 'hide') {
                    attributesToChange['hide_save_dc'] = '@{hide_save_dc_var}';
                    attributesToChange['hide_save_failure'] = '@{hide_save_failure_var}';
                    attributesToChange['hide_save_success'] = '@{hide_save_success_var}';
                    attributesToChange['hide_effects'] = '@{hide_effects_var}';
                    attributesToChange['hide_recharge'] = '@{hide_recharge_var}';
                }
            }
        } else {
            shaped.messageToChat('invalid value. Please use one of the following: ' + validAttributeValue.join(', '));
            return;
        }

        var creaturesToChange = filterObjs(function (obj) {
            if (obj.get('type') === 'character') {
                var is_npc = parseInt(getAttrByName(obj.id, 'is_npc'), 10);

                return changeNPCs && is_npc === 1 || changePCs && is_npc === 0;
            }
            return null;
        });

        for (var attribute in attributesToChange) {
            if (attributesToChange.hasOwnProperty(attribute)) {
                creaturesToChange.forEach(function (obj) {
                    var attr = findObjs({
                        _type: 'attribute',
                        _characterid: obj.id,
                        name: attribute
                    })[0];

                    if (!attr) {
                        createObj('attribute', {
                            name: attribute,
                            current: attributesToChange[attribute],
                            characterid: obj.id
                        });
                    } else if (!attr.get('current') || attr.get('current').toString() !== attributesToChange[attribute]) {
                        attr.set({
                            current: attributesToChange[attribute]
                        });
                    }
                });
                if (creaturesToChange.length > 0) {
                    shaped.messageToChat('changed ' + attribute + ' to ' + attributesToChange[attribute].replace('@', '@') + ' for ' + creaturesToChange.length + ' creatures');
                } else {
                    shaped.messageToChat('no creatures match those parameters');
                }
            }
        }
    },

    importSpell: function (character, characterName, spellName, options) {
        var spell = fifthSpells.spellsData.filter(function (obj) {
            return obj.name.toLowerCase() === spellName.toLowerCase();
        })[0],
          spellBase = 'repeating_spellbook',
          spellIndex;

        if (!spell) {
            shaped.messageToChat('Error: cannot find a spell by the name of "' + spellName + '".');
            return;
        }
        if (typeof (character) === 'undefined') {
            shaped.messageToChat('Error: cannot find a character by the name of "' + characterName + '".');
            return;
        }
        shaped.characterId = character.id;

        if (spell.level === 0) {
            spellBase += 'cantrip_';
        } else {
            spellBase += 'level' + spell.level + '_';
        }

        for (var i = 0; i < 100; i++) {
            var attr = findObjs({
                _type: 'attribute',
                _characterid: shaped.characterId,
                name: spellBase + i + '_' + 'spellname'
            })[0];

            if (!attr) {
                spellIndex = i;
                spellBase += spellIndex + '_';
                break;
            }
        }

        shaped.setAttribute(spellBase + 'spellname', spell.name);
        if (options[0] && options[0] === 'prepared') {
            shaped.setAttribute(spellBase + 'spellisprepared', 'on');
        }
        if (spell.ritual) {
            shaped.setAttribute(spellBase + 'spellritual', '{{spellritual=1}}');
        }
        if (spell.concentration) {
            shaped.setAttribute(spellBase + 'spellconcentration', '{{spellconcentration=1}}');
        }
        if (spell.school) {
            shaped.setAttribute(spellBase + 'spellschool', spell.school);
        }
        if (spell.castingTime) {
            if (spell.castingTime === 'reaction') {
                shaped.setAttribute(spellBase + 'spell_casting_time', '@{spell_casting_time_reaction_var}');
            } else if (spell.castingTime === 'bonus') {
                shaped.setAttribute(spellBase + 'spell_casting_time', '@{spell_casting_time_bonus_var}');
            } else if (spell.castingTime === 'action') {
                shaped.setAttribute(spellBase + 'spell_casting_time', '@{spell_casting_time_action_var}');
            } else if (spell.castingTime === 'minute') {
                shaped.setAttribute(spellBase + 'spell_casting_time', '@{spell_casting_time_minute_var}');
            } else {
                shaped.setAttribute(spellBase + 'spell_casting_time', '@{spell_casting_time_longer_var}');
                shaped.setAttribute(spellBase + 'spellcasttime', spell.castingTime);
            }
        }
        if (spell.range) {
            shaped.setAttribute(spellBase + 'spellrange', spell.range);
        }
        if (spell.target) {
            shaped.setAttribute(spellBase + 'spelltarget', spell.target);
        }
        if (spell.aoe) {
            shaped.setAttribute(spellBase + 'spellaoe', spell.aoe);
        }
        if (spell.components) {
            if (spell.components.verbal) {
                shaped.setAttribute(spellBase + 'spellcomponents_verbal', '@{spellcomponents_verbal_var}');
            }
            if (spell.components.somatic) {
                shaped.setAttribute(spellBase + 'spellcomponents_somatic', '@{spellcomponents_somatic_var}');
            }
            if (spell.components.material) {
                shaped.setAttribute(spellBase + 'spellcomponents_material', '@{spellcomponents_material_var}');
            }
            if (spell.components.materialMaterial) {
                shaped.setAttribute(spellBase + 'spellcomponents', spell.components.materialMaterial);
            }
        }
        if (spell.duration) {
            shaped.setAttribute(spellBase + 'spellduration', spell.duration);
        }
        if (spell.source) {
            shaped.setAttribute(spellBase + 'spellsource', spell.source);
            //shaped.setAttribute(spellBase + 'spellshowsource', '@{spellshowsource_var}');
        }

        if (spell.description) {
            shaped.setAttribute(spellBase + 'spelldescription', spell.description);
            //shaped.setAttribute(spellBase + 'spell_toggle_description', '@{spell_var_description}');
        }
        if (spell.higherLevel) {
            shaped.setAttribute(spellBase + 'spellhighersloteffect', spell.higherLevel);
            var noHigherLevelDice = true;

            if ((spell.attack && spell.attack.higherLevelDice) || (spell.damage && spell.damage.higherLevelDice) || (spell.save && spell.save.higherLevelDice) || (spell.heal && (spell.heal.higherLevelDice || spell.heal.higherLevelAmount))) {
                noHigherLevelDice = false;
            }
            if (spell.level > 0 && noHigherLevelDice) {
                shaped.setAttribute(spellBase + 'spell_toggle_higher_lvl', '@{spell_var_higher_lvl}');
            }
        }
        if (spell.emote) {
            var gender = getAttrByName(shaped.characterId, 'gender', 'current'),
              heShe, himHer, hisHer, himselfHerself;

            if (!gender || !gender.match(/f|female|girl|woman|feminine/gi)) {
                heShe = 'he';
                himHer = 'him';
                hisHer = 'his';
                himselfHerself = 'himself';
            } else {
                heShe = 'she';
                himHer = 'her';
                hisHer = 'her';
                himselfHerself = 'herself';
            }

            spell.emote = spell.emote
              .replace('{{GENDER_PRONOUN_HE_SHE}}', heShe)
              .replace('{{GENDER_PRONOUN_HIM_HER}}', himHer)
              .replace('{{GENDER_PRONOUN_HIS_HER}}', hisHer)
              .replace('{{GENDER_PRONOUN_HIMSELF_HERSELF}}', himselfHerself);

            shaped.setAttribute(spellBase + 'spellemote', spell.emote);
            shaped.setAttribute(spellBase + 'spell_toggle_emote', '@{spell_var_emote}');
        }

        function processDamage(param, type) {
            if (param.damage) {
                shaped.setAttribute(spellBase + 'spell_toggle_' + type + '_damage', '@{spell_var_' + type + '_damage}');
                shaped.setAttribute(spellBase + 'spell_' + type + '_dmg', param.damage);
            }
            if (param.damageBonus) {
                shaped.setAttribute(spellBase + 'spell_toggle_bonuses', '@{spell_var_bonuses}');
                shaped.setAttribute(spellBase + 'spell_' + type + '_dmg_bonus', param.damageBonus);
            }
            if (param.castingStat) {
                shaped.setAttribute(spellBase + 'spell_' + type + '_dmg_stat', '@{casting_stat}');
            }
            if (param.damageType) {
                shaped.setAttribute(spellBase + 'spell_' + type + '_dmg_type', param.damageType);
            }
            if (param.secondaryDamage) {
                shaped.setAttribute(spellBase + 'spell_toggle_' + type + '_second_damage', '@{spell_var_' + type + '_second_damage}');
                shaped.setAttribute(spellBase + 'spell_' + type + '_second_dmg', param.secondaryDamage);
            }
            if (param.secondaryDamageType) {
                shaped.setAttribute(spellBase + 'spell_' + type + '_second_dmg_type', param.secondaryDamageType);
            }
            if (param.higherLevelDice) {
                shaped.setAttribute(spellBase + 'spell_toggle_higher_lvl_query', '@{higher_level_query}');
                shaped.setAttribute(spellBase + 'spell_toggle_output_higher_lvl_query', '@{spell_var_output_higher_lvl_query}');
                shaped.setAttribute(spellBase + 'spell_' + type + '_higher_level_dmg_dice', param.higherLevelDice);
            }
            if (param.higherLevelDie) {
                shaped.setAttribute(spellBase + 'spell_' + type + '_higher_level_dmg_die', param.higherLevelDie);
            }
            if (param.higherLevelSecondaryDice) {
                shaped.setAttribute(spellBase + 'spell_' + type + '_second_higher_level_dmg_dice', param.higherLevelSecondaryDice);
            }
            if (param.higherLevelSecondaryDie) {
                shaped.setAttribute(spellBase + 'spell_' + type + '_second_higher_level_dmg_die', param.higherLevelSecondaryDie);
            }
        }


        if (spell.attack) {
            shaped.setAttribute(spellBase + 'attackstat', '@{casting_stat}');
            shaped.setAttribute(spellBase + 'spell_toggle_attack', '@{spell_var_attack}');
            processDamage(spell.attack, 'attack');
            if (spell.attack.damage) {
                shaped.setAttribute(spellBase + 'spell_toggle_attack_crit', '@{spell_var_attack_crit}');
            }
        }
        if (spell.damage) {
            processDamage(spell.damage, 'attack');
        }

        if (spell.save) {
            shaped.setAttribute(spellBase + 'spell_toggle_save', '@{spell_var_save}');
            if (spell.save.condition) {
                shaped.setAttribute(spellBase + 'savecondition', spell.save.condition);
            }
            if (spell.save.ability) {
                shaped.setAttribute(spellBase + 'savestat', shaped.capitalizeFirstLetter(spell.save.ability.substring(0, 3)));
                shaped.setAttribute(spellBase + 'spellsavedc', '@{casting_stat_dc}');
            }
            if (spell.save.saveFailure) {
                shaped.setAttribute(spellBase + 'savefailure', spell.save.saveFailure);
            }
            if (spell.save.saveSuccess) {
                shaped.setAttribute(spellBase + 'savesuccess', spell.save.saveSuccess);
            }
            processDamage(spell.save, 'save');
        }

        if (spell.heal) {
            shaped.setAttribute(spellBase + 'spell_toggle_healing', '@{spell_var_healing}');
            shaped.setAttribute(spellBase + 'spellhealamount', spell.heal.amount);
            if (spell.heal.bonus) {
                shaped.setAttribute(spellBase + 'healbonus', spell.heal.bonus);
            }
            if (spell.heal.castingStat) {
                shaped.setAttribute(spellBase + 'healstatbonus', '@{casting_stat}');
            }
            if (spell.heal.higherLevelDice || spell.heal.higherLevelAmount) {
                shaped.setAttribute(spellBase + 'spell_toggle_higher_lvl_query', '@{spell_var_higher_lvl_query}');
            }
            if (spell.heal.higherLevelDice) {
                shaped.setAttribute(spellBase + 'spell_heal_higher_level_dmg_dice', spell.heal.higherLevelDice);
            }
            if (spell.heal.higherLevelDie) {
                shaped.setAttribute(spellBase + 'spell_heal_higher_level_dmg_die', spell.heal.higherLevelDie);
            }
            if (spell.heal.higherLevelAmount) {
                shaped.setAttribute(spellBase + 'spell_heal_higher_level_amount', spell.heal.higherLevelAmount);
            }
        }

        if (spell.effects) {
            shaped.setAttribute(spellBase + 'spelleffect', spell.effects);
            shaped.setAttribute(spellBase + 'spell_toggle_effects', '@{spell_var_effects}');
        }

        shaped.messageToChat(spell.name + ' imported for ' + characterName + ' on spell level ' + spell.level + ' at index ' + spellIndex);
    },

    spellImport: function (token, args) {
        log("shaped.spellImport");
        log(args);
        log(token);
        try {
            var spells = args[0].split(', '),
                id = token.get('represents'),
                character = findObjs({
                    _type: 'character',
                    id: id
                })[0],
                characterName = getAttrByName(id, 'character_name', 'current'),
                options = [];
            log(spells);
            if (args[1] && args[1] === 'prepared') {
                options.push('prepared');
            }

            for (var i = 0; i < spells.length; i++) {

                log(characterName + ": Importing spell: " + spells[i]);
                shaped.importSpell(character, characterName, spells[i], options);
            }
        } catch (e) {
            shaped.messageToChat('Exception: ' + e);
        }
    }


    // ALWAYS ON EXPORTS:

};

on('ready', function () {
    'use strict';
    shaped.statblock.RegisterHandlers();
});

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
        schemaVersion = 0.2,
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

on("ready", function () {
    'use strict';

    if ("undefined" !== typeof isGM && _.isFunction(isGM)) {
        Torch.CheckInstall();
        Torch.RegisterEventHandlers();
    } else {
        log('--------------------------------------------------------------');
        log('Torch requires the isGM module to work.');
        log('isGM GIST: https://gist.github.com/shdwjk/8d5bb062abab18463625');
        log('--------------------------------------------------------------');
    }
});

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

on('ready', IsGMModule.init);

var isGM = isGM || function (id) {
    return IsGMModule.IsGM(id);
};


// StealthMod
var StealthMod = StealthMod || function () {
    "use strict";

    var version = "1.0",
        SetTokenStealth = function (token, stealthroll) {
            if (token && stealthroll.isNumber) {
                token.set("bar1_value", stealthroll);
            }
        },
        init = function () {
            Shell
        };
    return
};




/*  ############################################################### */
/*  TokenLock */
/*  ############################################################### */
// TokenLock

// Github:   https://github.com/shdwjk/Roll20API/blob/master/TokenLock/TokenLock.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron

var TokenLock = TokenLock || (function () {
    'use strict';

    var version = '0.2.2',
        lastUpdate = 1428859122,
        schemaVersion = 0.2,

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

        getCommandOption_ToggleLock = function () {
            var text = (state.TokenLock.locked ? '<span style="color: #990000;">Locked</span>' : '<span style="color: #009900;">Unlocked</span>');
            return '<div>'
                + 'Tokens are now <b>'
                    + text
                + '</b>. '
                + '<a href="!tl --toggle-lock">'
                    + 'Toggle'
                + '</a>'
            + '</div>';

        },

        getConfigOption_AllowMoveOnTurn = function () {
            var text = (state.TokenLock.config.allowMoveOnTurn ? 'On' : 'Off');
            return '<div>'
                + 'Allow Move on Turn is currently <b>'
                    + text
                + '</b> '
                + '<a href="!tl-config --toggle-allowmoveonturn">'
                    + 'Toggle'
                + '</a>'
            + '</div>';

        },
        tlConfigCommand = function (args, msg) {
            if (_.contains(args, '--help')) {
                showHelp(who);
                return;
            }
            if (!args.length) {
                sendChat('', '/w ' + who + ' '
                + '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                    + '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">'
                        + 'TokenLock v' + version
                    + '</div>'
                    + getConfigOption_AllowMoveOnTurn()
                + '</div>'
                );
                return;
            }
            _.each(args, function (a) {
                var opt = a.split(/\|/);

                switch (opt.shift()) {
                    case '--toggle-allowmoveonturn':
                        state.TokenLock.config.allowMoveOnTurn = !state.TokenLock.config.allowMoveOnTurn;
                        sendChat('', '/w ' + who + ' '
                            + '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
                                + getConfigOption_AllowMoveOnTurn()
                            + '</div>'
                        );
                        break;

                    default:
                        sendChat('', '/w ' + who + ' '
                            + '<div><b>Unsupported Option:</div> ' + a + '</div>'
                        );
                }
            });

        },
        tlCommand = function (args, msg) {
            if (_.contains(args, '--help')) {
                showHelp(who);
                return;
            }
            switch (args.shift()) {
                case 'lock':
                    state.TokenLock.locked = true;
                    sendChat('TokenLock', '/w gm '
                        + getCommandOption_ToggleLock()
                    );

                    break;

                case 'unlock':
                    state.TokenLock.locked = false;
                    sendChat('TokenLock', '/w gm '
                        + getCommandOption_ToggleLock()
                    );
                    break;

                case '--toggle-lock':
                    state.TokenLock.locked = !state.TokenLock.locked;
                    sendChat('TokenLock', '/w gm '
                        + getCommandOption_ToggleLock()
                    );
                    break;

                default:
                    showHelp(who);
                    break;
            }

        },
        showHelp = function (who) {
            var stateColor = (state.TokenLock.locked) ? ('#990000') : ('#009900'),
                stateName = (state.TokenLock.locked) ? ('Locked') : ('Unlocked');

            sendChat('',
                '/w ' + who + ' '
    + '<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">'
        + '<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">'
            + '<div style="float:right;width:90px;border:1px solid black;background-color:#ffc;text-align:center;font-size: 70%;"><span style="color: ' + stateColor + '; font-weight:bold; padding: 0px 4px;">' + stateName + '</span></div>'
            + 'TokenLock v' + version
            + '<div style="clear: both"></div>'
        + '</div>'
        + '<div style="padding-left:10px;margin-bottom:3px;">'
            + '<p>TokenLock allows the GM to selectively prevent players from moving their tokens. '
            + 'Since <i><u>change:graphic</u></i> events to not specify who changed the '
            + 'graphic, determination of player tokens is based on whether that token '
            + 'has an entry in the <b>controlled by</b> field of either the token or '
            + 'the character it represents.  If <b>controlled by</b> is empty, the '
            + 'GM can freely move the token at any point.  If there is any entry in '
            + '<b>controlled by</b>, the token can only be moved when TokenLock is '
            + 'unlocked. </p>'
            + '<p>Moving of player controlled cards is still permissible. </p>'
        + '</div>'
        + '<b>Commands</b>'
        + '<div style="padding-left:10px;"><b><span style="font-family: serif;">!tl</span></b>'
            + '<div style="padding-left: 10px;padding-right:20px">'
                + 'Executing the command with no arguments prints this help.  The following arguments may be supplied in order to change the configuration.  All changes are persisted between script restarts.'
                + '<ul>'
                    + '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
                        + '<b><span style="font-family: serif;">lock</span></b> -- Locks the player tokens to prevent moving them.'
                    + '</li> '
                    + '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
                        + '<b><span style="font-family: serif;">unlock</span></b> -- Unlocks the player tokens allowing them to be moved.'
                    + '</li> '
                + '</ul>'
            + '</div>'
        + '</div>'
        + getCommandOption_ToggleLock()
        + '<div style="padding-left:10px;">'
            + '<b><span style="font-family: serif;">!tl-config [' + ch('<') + 'Options' + ch('>') + '|--help]</span></b>'
            + '<div style="padding-left: 10px;padding-right:20px">'
                + '<p>Swaps the selected Tokens for their counterparts on the other layer.</p>'
                + '<ul>'
                    + '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
                        + '<b><span style="font-family: serif;">--help</span></b> ' + ch('-') + ' Shows the Help screen'
                    + '</li> '
                    + '<li style="border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;">'
                        + '<b><span style="font-family: serif;">--toggle-allowmoveonturn</span></b> ' + ch('-') + ' Sets whether tokens can be moved if they are at the top of the turn order.'
                    + '</li> '
                + '</ul>'
            + '</div>'
        + '</div>'
        + getConfigOption_AllowMoveOnTurn()
    + '</div>'
                );
        },
        handleMove = function (obj, prev) {
            if (state.TokenLock.locked
                && 'token' === obj.get('subtype')
                && (!state.TokenLock.config.allowMoveOnTurn || (((JSON.parse(Campaign().get('turnorder')) || [{ id: false }])[0].id) !== obj.id))
                && (obj.get('left') !== prev.left || obj.get('top') !== prev.top || obj.get('rotation') !== prev.rotation)
            ) {
                if ('' !== obj.get('controlledby')) {
                    obj.set({ left: prev.left, top: prev.top, rotation: prev.rotation });
                } else if ('' !== obj.get('represents')) {
                    var character = getObj('character', obj.get('represents'));
                    if (character && character.get('controlledby')) {
                        obj.set({ left: prev.left, top: prev.top, rotation: prev.rotation });
                    }
                }
            }
        },

        checkInstall = function () {
            log('-=> TokenLock v' + version + ' <=-  [' + (new Date(lastUpdate * 1000)) + ']');

            if (!_.has(state, 'TokenLock') || state.TokenLock.version !== schemaVersion) {
                log('  > Updating Schema to v' + schemaVersion + ' <');
                switch (state.TokenLock && state.TokenLock.version) {
                    case 0.1:
                        state.TokenLock.config = {
                            allowMoveOnTurn: false
                        };
                        state.TokenLock.version = schemaVersion;
                        break;

                    default:
                        state.TokenLock = {
                            version: schemaVersion,
                            config: {
                                allowMoveOnTurn: false
                            },
                            locked: false
                        };
                        break;
                }
            }
        },

        registerEventHandlers = function () {
        //on('chat:message', handleInput);
        on('change:graphic', handleMove);
    };

    return {
        RegisterEventHandlers: registerEventHandlers,
        CheckInstall: checkInstall,
        tlConfigCommand: tlConfigCommand,
        tlCommand: tlCommand
    };
}());

on("ready", function () {
    'use strict';
    Shell.registerCommand("!tl", "!tl <args>",
                        "Description here", TokenLock.tlCommand);
    Shell.registerCommand("!tlconfig", "!tlconfig <args>",
                        "Description here", TokenLock.tlCommand);
    TokenLock.CheckInstall();
    TokenLock.RegisterEventHandlers();
});




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

on('ready', function () {
    'use strict';

    if ("undefined" !== typeof isGM && _.isFunction(isGM)) {
        APIHeartBeat.CheckInstall();
        APIHeartBeat.RegisterEventHandlers();
    } else {
        log('--------------------------------------------------------------');
        log('APIHeartBeat requires the isGM module to work.');
        log('isGM GIST: https://gist.github.com/shdwjk/8d5bb062abab18463625');
        log('--------------------------------------------------------------');
    }
});


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
               bar2_link: 'sheetattr_AC',
               bar3_link: 'sheetattr_HP',
               side: 0,
               width: 70,
               height: 70
           },
           {
               form: 'Wolf',
               character_name: "Treehumper",
               represents: '-K9nj42B6oCki8e13lJY',
               name: 'Treehumper',
               bar2_link: 'sheetattr_npc_AC',
               bar3_link: 'sheetattr_HP',
               side: 1,
               width: 70,
               height: 70
           },
           {
               form: 'Horse',
               character_name: "Treehumper",
               represents: '-K9nnZIOp09YdVgSTkT9',
               name: 'Treehumper',
               bar2_link: 'sheetattr_npc_AC',
               bar3_link: 'sheetattr_HP',
               side: 1,
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
            log(tokens);
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
                    bar3_link: newinfo.bar3_link || "sheetattr_HP",
                    bar3_value: getAttrByName(newinfo.represents, "HP", "current"),
                    bar3_max: getAttrByName(newinfo.represents, "HP", "max"),
                    width: newinfo.width || 70,
                    height: newinfo.height || 70
                });
                //sendChat("Util: " + Util.Roll(getAttrByName(newinfo.represents, "passive_perception", "current")));
                shaped.initPlayerToken(token);
                
                var output = "";

                output += "@{" + newinfo.character_name + "|output_option} ";
                output += "&{template:5eDefault} ";
                output += "{{action=1}} ";
                output += "{{character_name=@{" + newinfo.character_name + "|character_name}}} ";
                output += "@{" + newinfo.character_name + "|show_character_name} ";
                output += "{{title=Wild Shape}} ";
                output += "{{subheader=Bonus Action}} ";
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
                    log(match);
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


on('ready', Util.init);


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
            log(templatevalues);
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

on("ready", Shell.init);

/*  ############################################################### */
/*  Inspect.js -- Token descriptions */
/*  ############################################################### */
var Inspect = Inspect || (function () {
    'use strict';

    var help = '!inspect - Manage player visible descriptions of tokens. ' +
          'Requires CommandShell. See script for more options and useful macros.';

    /*
    Requires the following other scripts to be installed:
      - CommandShell (https://wiki.roll20.net/Script:Command_Shell)

    Useful Macros:
    Players
        inspect = !inspect @{target|token_id}
    GMs
        inspect-add = !inspect @{selected|token_id} add "?{Description}"
        inspect-remove = !inspect @{selected|token_id} remove
  */

    // ---CONFIG START ---
    // Chat sender for responses.
    var sender = "Inspector";
    // Custom CSS for chat message.
    var styles = '';
    // Response when a description hasn't been set up.
    var defaultDescription = 'Nothing appears out of the ordinary.';
    // ---CONFIG END ---

    // Module Setup
    var name = '!inspect';
    var moduleState = state[name] = state[name] || {};

    // Register the command and associated event handlers
    on('ready', function () {
        // Validate dependencies
        if (!Shell) {
            throw new Error(formatOutput('Missing dependency. CommandShell is required: https://wiki.roll20.net/Script:Command_Shell'));
        }

        // Register with CommandShell
        Shell.registerCommand(name, name + ' <tokenId> [-b | --broadcast]\n' +
            name + ' <tokenId> add <description>\n' +
            name + ' <tokenId> remove',
            help, processCommand);

        // Set command permissions to be globally accesible.
        // Add, update and delete actions are restricted to GMs internally.
        //Shell.write('!shell-permission add ' + name);

        // Clean up descriptions if associated token is destroyed.
        on('destroy:graphic', function (obj) {
            moduleState = delete moduleState[obj.id];
        });
    });

    // Interpret and validate command, execute and respond
    function processCommand(input, msg) {
        if (input.length < 1) {
            Shell.write(
                formatOutput('Command usage incorrect. Please check !help.'),
                msg.who, styles, sender);
        }
        // HACK: Trim leading - from id to not trip up args parser
        input[1] = input[1].replace('-', '');

        // Preprocess input
        var argv = parseArgs(input.slice(1));
        var arity = argv._.length;
        var tokenId = '-' + argv._[0];
        var to = msg.who;
        var isGM = playerIsGM(msg.playerid);
        var output = '';

        // Interpret command
        if (!getObj('graphic', tokenId)) { // validate tokenId
            output = formatOutput('Could not find token with id ' + tokenId);
        } else if (arity === 1) { // get
            output = get(tokenId);
            to = argv.b || argv.broadcast ? undefined : to;
        } else if (arity === 2 && argv._[1] === 'remove') { // remove
            output = isGM ? remove(tokenId) :
                formatOutput('Only GMs can remove descriptions.');
        } else if (arity === 3 && argv._[1] === 'add') { // add
            output = isGM ? add(tokenId, argv._[2]) :
                formatOutput('Only GMs can add descriptions.');
        } else { // error
            output = formatOutput('Command usage incorrect. Please check !help.');
        }

        // Write output
        Shell.rawWrite(output, to, styles, sender);
    };

    // Actions
    function get(tokenId) {
        return moduleState[tokenId] ? moduleState[tokenId] : defaultDescription;
    }

    function add(tokenId, description) {
        moduleState[tokenId] = description;
        return formatOutput('Description added for token.');
    }

    function remove(tokenId) {
        delete moduleState[tokenId];
        return formatOutput('Deleted description for token.');
    }

    // Helpers
    function formatOutput(output) {
        return name + ': ' + output;
    }

    // Libraries
    /*
    Project: minimist  https://github.com/substack/minimist
    Copyright (c) 2013 James Halliday (substack@gmail.com)
    License (MIT) https://github.com/substack/minimist/blob/master/LICENSE
    */
    function parseArgs(args, opts) {
        if (!opts) opts = {};

        var flags = { bools: {}, strings: {}, unknownFn: null };

        if (typeof opts['unknown'] === 'function') {
            flags.unknownFn = opts['unknown'];
        }

        if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
            flags.allBools = true;
        } else {
            [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
                flags.bools[key] = true;
            });
        }

        var aliases = {};
        Object.keys(opts.alias || {}).forEach(function (key) {
            aliases[key] = [].concat(opts.alias[key]);
            aliases[key].forEach(function (x) {
                aliases[x] = [key].concat(aliases[key].filter(function (y) {
                    return x !== y;
                }));
            });
        });

        [].concat(opts.string).filter(Boolean).forEach(function (key) {
            flags.strings[key] = true;
            if (aliases[key]) {
                flags.strings[aliases[key]] = true;
            }
        });

        var defaults = opts['default'] || {};

        var argv = { _: [] };
        Object.keys(flags.bools).forEach(function (key) {
            setArg(key, defaults[key] === undefined ? false : defaults[key]);
        });

        var notFlags = [];

        if (args.indexOf('--') !== -1) {
            notFlags = args.slice(args.indexOf('--') + 1);
            args = args.slice(0, args.indexOf('--'));
        }

        function argDefined(key, arg) {
            return (flags.allBools && /^--[^=]+$/.test(arg)) ||
                flags.strings[key] || flags.bools[key] || aliases[key];
        }

        function setArg(key, val, arg) {
            if (arg && flags.unknownFn && !argDefined(key, arg)) {
                if (flags.unknownFn(arg) === false) return;
            }

            var value = !flags.strings[key] && isNumber(val)
                ? Number(val) : val
            ;
            setKey(argv, key.split('.'), value);

            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), value);
            });
        }

        function setKey(obj, keys, value) {
            var o = obj;
            keys.slice(0, -1).forEach(function (key) {
                if (o[key] === undefined) o[key] = {};
                o = o[key];
            });

            var key = keys[keys.length - 1];
            if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
                o[key] = value;
            }
            else if (Array.isArray(o[key])) {
                o[key].push(value);
            }
            else {
                o[key] = [o[key], value];
            }
        }

        function aliasIsBoolean(key) {
            return aliases[key].some(function (x) {
                return flags.bools[x];
            });
        }

        for (var i = 0; i < args.length; i++) {
            var arg = args[i];

            if (/^--.+=/.test(arg)) {
                // Using [\s\S] instead of . because js doesn't support the
                // 'dotall' regex modifier. See:
                // http://stackoverflow.com/a/1068308/13216
                var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
                var key = m[1];
                var value = m[2];
                if (flags.bools[key]) {
                    value = value !== 'false';
                }
                setArg(key, value, arg);
            }
            else if (/^--no-.+/.test(arg)) {
                var key = arg.match(/^--no-(.+)/)[1];
                setArg(key, false, arg);
            }
            else if (/^--.+/.test(arg)) {
                var key = arg.match(/^--(.+)/)[1];
                var next = args[i + 1];
                if (next !== undefined && !/^-/.test(next)
                && !flags.bools[key]
                && !flags.allBools
                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                    setArg(key, next, arg);
                    i++;
                }
                else if (/^(true|false)$/.test(next)) {
                    setArg(key, next === 'true', arg);
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true, arg);
                }
            }
            else if (/^-[^-]+/.test(arg)) {
                var letters = arg.slice(1, -1).split('');

                var broken = false;
                for (var j = 0; j < letters.length; j++) {
                    var next = arg.slice(j + 2);

                    if (next === '-') {
                        setArg(letters[j], next, arg);
                        continue;
                    }

                    if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                        setArg(letters[j], next.split('=')[1], arg);
                        broken = true;
                        break;
                    }

                    if (/[A-Za-z]/.test(letters[j])
                    && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                        setArg(letters[j], next, arg);
                        broken = true;
                        break;
                    }

                    if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                        setArg(letters[j], arg.slice(j + 2), arg);
                        broken = true;
                        break;
                    }
                    else {
                        setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
                    }
                }

                var key = arg.slice(-1)[0];
                if (!broken && key !== '-') {
                    if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1])
                    && !flags.bools[key]
                    && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                        setArg(key, args[i + 1], arg);
                        i++;
                    }
                    else if (args[i + 1] && /true|false/.test(args[i + 1])) {
                        setArg(key, args[i + 1] === 'true', arg);
                        i++;
                    }
                    else {
                        setArg(key, flags.strings[key] ? '' : true, arg);
                    }
                }
            }
            else {
                if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                    argv._.push(
                        flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
                    );
                }
                if (opts.stopEarly) {
                    argv._.push.apply(argv._, args.slice(i + 1));
                    break;
                }
            }
        }

        Object.keys(defaults).forEach(function (key) {
            if (!hasKey(argv, key.split('.'))) {
                setKey(argv, key.split('.'), defaults[key]);

                (aliases[key] || []).forEach(function (x) {
                    setKey(argv, x.split('.'), defaults[key]);
                });
            }
        });

        if (opts['--']) {
            argv['--'] = new Array();
            notFlags.forEach(function (key) {
                argv['--'].push(key);
            });
        }
        else {
            notFlags.forEach(function (key) {
                argv._.push(key);
            });
        }

        return argv;
    }

    function hasKey(obj, keys) {
        var o = obj;
        keys.slice(0, -1).forEach(function (key) {
            o = (o[key] || {});
        });

        var key = keys[keys.length - 1];
        return key in o;
    }

    function isNumber(x) {
        if (typeof x === 'number') return true;
        if (/^0x[0-9a-f]+$/i.test(x)) return true;
        return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
    }

})();

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

on("ready", function () {
    'use strict';

    TokenNameNumber.CheckInstall();
    TokenNameNumber.RegisterEventHandlers();
});
