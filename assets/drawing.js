function createCanvas(width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function getContext(canvas) {
    return canvas.getContext("2d");
}

function GET(url) {
    return Bacon.fromCallback(function(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'text';
        xhr.onload = function() {
            if (this.status === 200) {
                callback(JSON.parse(this.response));
            }
        };
        xhr.send();
    })
}

function mapRequest(host, resolution) {
    return '/data/' + host + '-' + (resolution ? resolution : 'all')+ '.json';
}

function appendBody(canvas) {
    document.body.appendChild(canvas);
}

function drawClickData(size, ctx, clicks, circle) {
    var canvas = ctx.canvas;
    canvas.width = canvas.width; // reset canvas
    clicks.forEach(function(click) {
        var hits = click[3];
        while(hits--) {
            ctx.drawImage(circle, click[0] - size / 2, click[1] - size / 2);
        }
    });
    return ctx;
}

function drawCircle(ctx, size) {
    var gradient = ctx.createRadialGradient(size / 2, size / 2, size / 2, size / 2, size / 2 , 0);
    gradient.addColorStop(0, 'rgba(127, 127, 127, 0)');
    gradient.addColorStop(1, 'rgba(127, 127, 127, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return ctx.canvas;
}

function drawColorGradient(ctx) {
    var gradient = ctx.createLinearGradient(0, 0, 255, 1);
    gradient.addColorStop(0, "blue");
    gradient.addColorStop(0.25, "cyan");
    gradient.addColorStop(0.50, "green");
    gradient.addColorStop(0.75, "yellow");
    gradient.addColorStop(1.0, "red");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 255, 1);
    return ctx;
}

function getImageData(ctx) {
    return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function colorize(ctx, colors) {
    var color, pixels = getImageData(ctx);

    for (var pixel = 3, len = pixels.height*pixels.width*4; pixel < len; pixel+=4) {
        color = pixels.data[pixel] * 4;
        pixels.data[pixel - 3] = colors.data[color];
        pixels.data[pixel - 2] = colors.data[color + 1];
        pixels.data[pixel - 1] = colors.data[color + 2];
    }

    ctx.putImageData(pixels, 0, 0);
    return ctx;
}

function filterDate(data, startDate, endDate) {
    return data.filter(function(row) {
        return row[2] >= startDate && row[2] <= endDate;
    });
}

function formatDay(d) {
    return (d < 10) ? "0" + d : d;
}

function mapResolution(w, h) {
    return w + "x" + h;
}

function setLastYear(date) {
    date.setFullYear(date.getFullYear()-1);
    return date;
}

function formatDatePreviousMonth(date) {
    return [date.getFullYear(), formatDay(date.getMonth()), formatDay(date.getDate())].join("");
}

function formatDatePreviousWeek(date) {
    var newDate = new Date(date);
    newDate.setDate(date.getDate()-7);
    return [newDate.getFullYear(), formatDay(newDate.getMonth()+1), formatDay(newDate.getDate())].join("");
}

function formatDate(date) {
    return [date.getFullYear(), formatDay(date.getMonth()+1), formatDay(date.getDate())].join("");
}

function addOneDay(date) {
    date.setDate(date.getDate()+1);
    return date;
}

function reduceOneMonth(date) {
    date.setMonth(date.getMonth()-1);
    return date;
}

function setContentSize(width, height) {
    var preview = document.querySelector("#preview");
    var page = document.querySelector("#page");
    var canvas = document.querySelector("canvas");
    preview.style.width = page.style.width =  width + "px";
    preview.style.height = page.style.height = height + "px";
    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }
}

function setIframeSrc(src) {
    document.querySelector("#preview").src = "http://" + src;
}

function pastToday(date) {
    return date > Date.now();
}

var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;