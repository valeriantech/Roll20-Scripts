// Gametime.js
// Helper scripts for running the game.


/*  ############################################################### */
/*  TurnMarker */
/*  ############################################################### */
// Github:   https://github.com/shdwjk/Roll20API/blob/master/TurnMarker1/TurnMarker1.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron


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


