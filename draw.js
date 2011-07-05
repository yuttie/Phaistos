"use strict";

var VERSION_STRING = "0.2+";

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
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        sm.draw_current_stroke(ctx);
    }
}

function draw_disc(canvas, margin) {
    var num_directions = 8;

    var ctx = canvas.getContext('2d');
    ctx.save();

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // construct the transformation
    ctx.translate(canvas.width / 2,
                  canvas.height / 2);
    ctx.scale(canvas.width / 2 - margin,
              canvas.height / 2 - margin);

    // disc's background
    ctx.save();

    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // cross-hair
    var cross_hair_length = 0.1;
    var cross_hair_width = 0.01;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = cross_hair_width;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-cross_hair_length / 2, 0);
    ctx.lineTo(cross_hair_length / 2, 0);
    ctx.moveTo(0, -cross_hair_length / 2);
    ctx.lineTo(0, cross_hair_length / 2);
    ctx.stroke();

    ctx.restore();

    // slits
    var slit_length = 0.2;
    var slit_width = 0.03;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = slit_width;
    ctx.lineCap = "butt";

    var i;
    for (i = 0; i < num_directions; ++i) {
        ctx.save();

        ctx.rotate(2 * Math.PI * i / num_directions);

        ctx.beginPath();
        ctx.moveTo(0, -1 + slit_length);
        ctx.lineTo(0, -1);
        ctx.stroke();

        ctx.restore();
    }
    ctx.restore();

    // white circle
    var circle_line_width = 0.01;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = circle_line_width;

    ctx.beginPath();
    ctx.arc(0, 0, 1 - slit_length, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    // strokes
    var stroke_width = 0.01;
    var region_size = 0.1;
    var locations = [0, 4];
    var top_margin = 0.05;
    var hspace = 0.05;
    var vspace = 0.05;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = stroke_width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    for (i = 0; i < 8; ++i) {
        var canvas_id = "char_canvas" + (i + 1).toString();
        var char_canvas = document.getElementById(canvas_id);
        var strokes = stroke_managers[canvas_id].get_strokes();

        var j;
        for (j = 0; j < strokes.length; ++j) {
            var s = strokes[j];

            var k;
            for (k = 0; k < locations.length; ++k) {
                ctx.save();

                // a stroke region for this stroke
                var base_x = -(region_size + hspace / 2);
                var base_y = -1 + slit_length + top_margin;
                var region_x = base_x + (i % 2) * (region_size + hspace);
                var region_y = base_y + Math.floor(i / 2) * (region_size + vspace);

                ctx.rotate(2 * Math.PI * (locations[k] + j) / num_directions);
                ctx.translate(region_x, region_y);
                ctx.scale(region_size / char_canvas.width,
                          region_size / char_canvas.height);

                // draw a stroke
                var l;
                ctx.moveTo(s[0][0], s[0][1]);
                for (l = 1; l < s.length; ++l) {
                    ctx.lineTo(s[l][0], s[l][1]);
                }

                ctx.restore();
            }
        }
    }
    ctx.stroke();

    ctx.restore();

    ctx.restore();
}

function end_stroke_on(canvas) {
    var sm = stroke_managers[canvas.id];
    if (sm.is_stroking()) {
        sm.end();

        // draw a disc
        var disc_canvas = document.getElementById("disc_canvas");
        draw_disc(disc_canvas, 30);
    }
}

function get_mouse_coordinates(event) {
    // get the coordinates where the event occurred
    var page_x, page_y;
    if (event.pageX || event.pageY) {
        page_x = event.pageX;
        page_y = event.pageY;
    }
    else {  // for IE
        page_x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        page_y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    // get the target's coordinates relative to the page
    var offset_left = 0;
    var offset_top = 0;
    var element = event.target;
    do {
        offset_left += element.offsetLeft;
        offset_top  += element.offsetTop;
    } while (element = element.offsetParent);

    return [page_x - offset_left,
            page_y - offset_top];
}

function get_touch_coordinates(event) {
    // get the coordinates where the event occurred
    var page_x = event.touches[0].pageX;
    var page_y = event.touches[0].pageY;

    // get the target's coordinates relative to the page
    var offset_left = 0;
    var offset_top = 0;
    var element = event.target;
    do {
        offset_left += element.offsetLeft;
        offset_top  += element.offsetTop;
    } while (element = element.offsetParent);

    return [page_x - offset_left,
            page_y - offset_top];
}

function on_char_canvas_mousedown(event) {
    var c = get_mouse_coordinates(event);
    var x = c[0], y = c[1];
    begin_stroke_on(event.target, x, y);
}

function on_char_canvas_mousemove(event) {
    var c = get_mouse_coordinates(event);
    var x = c[0], y = c[1];
    update_stroke_on(event.target, x, y);
}

function on_char_canvas_mouseup(event) {
    end_stroke_on(event.target);
}

function on_char_canvas_touchstart(event) {
    if (event.touches.length === 1) {
        var c = get_touch_coordinates(event);
        var x = c[0], y = c[1];
        begin_stroke_on(event.target, x, y);

        event.preventDefault();
    }
}

function on_char_canvas_touchmove(event) {
    if (event.touches.length === 1) {
        var c = get_touch_coordinates(event);
        var x = c[0], y = c[1];
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

    var title_header = document.getElementById("title_header");
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

    // draw a disc
    var disc_canvas = document.getElementById("disc_canvas");
    draw_disc(disc_canvas, 30);

    // view button
    var view_button = document.getElementById("view_button");
    view_button.addEventListener("click", function(event) {
        var disc_canvas = document.getElementById("disc_canvas");
        var dataUrl = disc_canvas.toDataURL("image/png");
        window.location = dataUrl;
    }, false);

    // save button
    var save_button = document.getElementById("save_button");
    save_button.addEventListener("click", function(event) {
        var disc_canvas = document.getElementById("disc_canvas");
        var dataUrl = disc_canvas.toDataURL("image/png");
        dataUrl = dataUrl.replace("image/png", "image/octet-stream");
        window.location = dataUrl;
    }, false);
}

// Register event handlers
window.addEventListener("load", set_title_header, false);
window.addEventListener("load", install_drawing_handlers, false);
