/*
 * heatmap
 * https://github.com/niklasvh/click-heatmap
 *
 * Copyright (c) 2013 Niklas von Hertzen
 * Licensed under the MIT license.
 */

(function(exports) {
    'use strict';

    var googleapis = require('googleapis'),
        http = require('http'),
        jwt = require('jwt-sign'),
        Bacon = require("baconjs").Bacon,
        serviceAccount = process.env.SERVICE_ACCOUNT,
        gaAccount = "ga:35742991",
        maxResults = 10000,
        payload = {
            "iss": serviceAccount + '@developer.gserviceaccount.com',
            "scope": 'https://www.googleapis.com/auth/analytics.readonly',
            "aud":"https://accounts.google.com/o/oauth2/token",
            "exp": ~~(new Date().getTime() / 1000) + (30 * 60),
            "iat": ~~(new Date().getTime() / 1000 - 60)
        },
        key = require('fs').readFileSync('certificate.pem', 'utf8'),
        transporterTokenRequest = {
            method: 'POST',
            uri: 'https://accounts.google.com/o/oauth2/token',
            form: {
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt.sign(payload, key)
            },
            json: true
        };

    function discover(api, version, callback) {
        googleapis.discover(api, version).execute(function(err, client) {
            if (!err) {
                callback(client);
            }
        });
    }

    function createToken(account, callback) {
        var oauth2Client = new googleapis.OAuth2Client(account, "", "");
        oauth2Client.transporter.request(transporterTokenRequest, function(err, result) {
            if (!err) {
                oauth2Client.credentials = result;
                callback(oauth2Client);
            }
        });
    }

    function createRequest(client, authClient, options) {
        var params = {
            ids: gaAccount,
            dimensions: "ga:eventLabel,ga:date",
            metrics: "ga:uniqueEvents,ga:eventValue",
            filters: "ga:screenResolution==" + options.resolution + ";ga:eventCategory==Heatmaps;ga:hostname==" + options.host + ";ga:pagePath==" + options.path,
            "start-date": options.startDate,
            "end-date": options.endDate,
            "max-results": maxResults,
            sort: "ga:date",
            "start-index": options.startIndex || 1
        };

        return {
            client: client.analytics.data.ga.get(params).withAuthClient(authClient),
            callback: options.callback
        };
    }

    function executeRequest(request) {
        request.client.execute(function(err, response) {
            if (err) {
                console.log(err);
                return;
            }
            request.callback(response);
        });
    }

    function execute(request) {
        return Bacon.fromCallback(function(callback) {
            request.execute(function(err, response) {
                if (err) {
                    console.log(err);
                    return;
                }
                callback(response);
            });
        });
    }

    function requestPart(opts, start) {
        var options = {
            resolution: opts.resolution,
            host: opts.host,
            path: opts.path,
            startDate: opts.startDate,
            endDate: opts.endDate,
            startIndex: start
        };

        function requestNext(result) {
            if (start + maxResults < result.totalResults) {
                return requestPart(options, start + maxResults).map(function(rows) {
                    return rows.concat(result.rows);
                });
            } else {
                return Bacon.constant(result.rows);
            }
        }

        function createRequest(callback) {
            options.callback = callback;
            requests.push(options);
        }

        return Bacon.fromCallback(createRequest).flatMap(requestNext);
    }

    function requestResolutions(client, authClient, params) {
        return client.analytics.data.ga.get(params).withAuthClient(authClient);
    }

    function formatResponse(response) {
        return response.map(function(arr) {
            return [arr[0], parseInt(arr[1], 10), parseInt(arr[2], 10), arr[3]];
        });
    }

    var analytics = Bacon.fromCallback(discover, "analytics", "v3").toProperty();
    var auth = Bacon.fromCallback(createToken, serviceAccount + ".apps.googleusercontent.com").toProperty();
    var requests = new Bacon.Bus();
    Bacon.combineWith(createRequest, analytics, auth, requests).onValue(executeRequest);

    exports.request = function(options) {
        return requestPart(options, 1).map(formatResponse);
    };

    exports.getResolutions = function(options) {
        var params = {
            ids: gaAccount,
            dimensions: "ga:screenResolution",
            metrics: "ga:totalEvents",
            filters: "ga:eventCategory==Heatmaps;ga:hostname==" + options.host + ";ga:pagePath==" + options.path,
            "start-date": options.startDate,
            "end-date": options.endDate,
            "max-results": maxResults
        };
        return Bacon.combineWith(requestResolutions, analytics, auth, Bacon.constant(params)).flatMap(execute).map(".rows");
    };

}(typeof exports === 'object' && exports || this));
