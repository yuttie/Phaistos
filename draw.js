"use strict";

var VERSION_STRING = "0.1+";

function StrokeManager() {
    var strokes_ = [];
    var is_stroking_ = false;
    var current_stroke_ = [];

    // stroke management
    this.is_stroking = function() {
        return is_stroking_;
    };

    this.get_strokes = function() {
        return strokes_.slice(0);
    };

    this.begin = function(x, y) {
        current_stroke_ = [[x, y]];
        is_stroking_ = true;
    };

    this.update = function(x, y) {
        if (is_stroking_) {
            current_stroke_.push([x, y]);
        }
    };

    this.end = function() {
        if (is_stroking_) {
            strokes_.push(current_stroke_);
            is_stroking_ = false;
        }
    };

    // drawing strokes
    function draw_strokes_(ctx, strokes) {
        ctx.beginPath();
        var i, j;
        for (i = 0; i < strokes.length; ++i) {
            var s = strokes[i];
            ctx.moveTo(s[0][0], s[0][1]);
            for (j = 1; j < s.length; ++j) {
                ctx.lineTo(s[j][0], s[j][1]);
            }
        }
        ctx.stroke();
    }

    this.draw_existing_strokes = function(ctx) {
        draw_strokes_(ctx, strokes_);
    };

    this.draw_current_stroke = function(ctx) {
        draw_strokes_(ctx, [current_stroke_]);
    };
}

var stroke_managers = {};

function begin_stroke_on(canvas, x, y) {
    var sm = stroke_managers[canvas.id];
    sm.begin(x, y);

    // clear the canvas and draw the past strokes with black color
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = "black";
    ctx.lineWidth = 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sm.draw_existing_strokes(ctx);
}

function update_stroke_on(canvas, x, y) {
    var sm = stroke_managers[canvas.id];
    if (sm.is_stroking()) {
        sm.update(x, y);

        var ctx = canvas.getContext('2d');
        ctx.strokeStyle = "red";
        ctx.lineWidth = 8;
        sm.draw_current_stroke(ctx);
    }
}

function end_stroke_on(canvas) {
    var sm = stroke_managers[canvas.id];
    if (sm.is_stroking()) {
        sm.end();
    }
}

function on_char_canvas_mousedown(event) {
    begin_stroke_on(event.target, event.offsetX, event.offsetY);
}

function on_char_canvas_mousemove(event) {
    update_stroke_on(event.target, event.offsetX, event.offsetY);
}

function on_char_canvas_mouseup(event) {
    end_stroke_on(event.target);
}

function on_char_canvas_touchstart(event) {
    if (event.touches.length == 1) {
        var x = event.touches[0].clientX - event.target.offsetLeft;
        var y = event.touches[0].clientY - event.target.offsetTop;
        begin_stroke_on(event.target, x, y);

        event.preventDefault();
    }
}

function on_char_canvas_touchmove(event) {
    if (event.touches.length == 1) {
        var x = event.touches[0].clientX - event.target.offsetLeft;
        var y = event.touches[0].clientY - event.target.offsetTop;
        update_stroke_on(event.target, x, y);

        event.preventDefault();
    }
}

function on_char_canvas_touchend(event) {
    end_stroke_on(event.target);

    event.preventDefault();
}

function is_platform_mobile() {
    return Boolean(navigator.userAgent.match(/Android|iPhone|iPad/));
}

function set_title_header(event) {
    var platform = is_platform_mobile() ? "MOBILE" : "DESKTOP";

    var title_header = document.getElementById("title_header")
    title_header.innerHTML += ' <span style="font-size: small">'
                            + "(Ver. " + VERSION_STRING + ";"
                            + " " + platform + " mode)"
                            + "</span>";
}

function install_drawing_handlers(event) {
    var char_canvases = document.getElementsByClassName("char_canvas");
    var i;
    for (i = 0; i < char_canvases.length; ++i) {
        var e = char_canvases[i];
        stroke_managers[e.id] = new StrokeManager();
        if (is_platform_mobile()) {
            e.addEventListener("touchstart", on_char_canvas_touchstart, false);
            e.addEventListener("touchmove",  on_char_canvas_touchmove, false);
            e.addEventListener("touchend",   on_char_canvas_touchend, false);
        } else {
            e.addEventListener("mousedown", on_char_canvas_mousedown, false);
            e.addEventListener("mousemove", on_char_canvas_mousemove, false);
            e.addEventListener("mouseup",   on_char_canvas_mouseup, false);
        }
    }
}

// Register event handlers
window.addEventListener("load", set_title_header, false);
window.addEventListener("load", install_drawing_handlers, false);
