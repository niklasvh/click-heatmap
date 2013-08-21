var heatmap = require("./lib/heatmap"),
    Bacon = require("baconjs").Bacon,
    fs = require("fs"),
    express = require('express'),
    app = express();


var hosts = ["hertzen.com", "html2canvas.hertzen.com"];
var from = "2012-05-01";
var to = "2013-08-20";
var cachePath = "./cache/";
var queue = [];
var port = process.env.PORT || 8080;

function order(arrA, arrB) {
    return parseInt(arrB[1], 10) - parseInt(arrA[1], 10) ;
}

function write(filename, response) {
    fs.writeFileSync(filename, JSON.stringify(response));
    console.log(filename + ' - written with', response.length, 'rows');
}

function top50(response) {
    return response.sort(order).slice(0, 50);
}

function requestOptions(host) {
    return {
        host: host,
        path: "/",
        startDate: from,
        endDate: to
    };
}

function requestOptionsWithResolution(host, resolution) {
    var opts = requestOptions(host);
    opts.resolution = resolution[0];
    return opts;
}

function each(arr) {
    return Bacon.fromArray(arr);
}

function writeResolutions(response, host) {
    write(cachePath + host + '-resolutions.json', response);
    return response;
}

function resolutionRequestsForHosts(host) {
    return Bacon.combineWith(
        requestOptionsWithResolution, host,
        Bacon.combineWith(
            writeResolutions,
            Bacon.constant(host).map(requestOptions).flatMap(heatmap.getResolutions).map(top50),
            host
        ).flatMap(each)
    );
}

function addQueue(item) {
    queue.push(item);
}

function asInt(arg) {
    return parseInt(arg, 10);
}

function writeResponse(response, item) {
    write(cachePath + item.host + '-' + item.resolution + '.json', response);
}

function formatRows(rows) {
    return rows.map(function(row) {
        var clickPosition = row[0].split("x").map(asInt);
        return [clickPosition[0], clickPosition[1], row[1], row[2]];
    });
}

function runQueue() {
    var item = queue.pop();
    if (item) {
        Bacon.combineWith(writeResponse, heatmap.request(item).map(formatRows), item).onValue(runQueue);
    } else {
        combineResolutions("hertzen.com");
    }
}

function combineResolutions(host) {
    var targetWidth = 1366;
    var center = targetWidth / 2;
    var results = [];

    JSON.parse(fs.readFileSync(cachePath + host + "-resolutions.json")).forEach(function(resolution) {
        var parts = resolution[0].split("x").map(asInt);
        var info = JSON.parse(fs.readFileSync(cachePath + host + "-" + resolution[0] + ".json"));
        results = results.concat(info.map(function(entry) {
            var positionalCenter = (parts[0]/2) - entry[0];
            return [(center - positionalCenter), entry[1], entry[2], entry[3]];
        }));
    });

    write(cachePath + host + "-all.json", results);
}

Bacon.fromArray(hosts).flatMap(resolutionRequestsForHosts).doAction(addQueue).onEnd(runQueue);

app.use('/data', express.static(__dirname + '/cache'));
app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function(req, res) {
    res.sendfile("index.html");
});
app.get('/html2canvas.html', function(req, res) {
    res.sendfile("html2canvas.html");
});
app.listen(port);
console.log("Server opened on port", port);