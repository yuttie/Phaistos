"use strict";

var VERSION_STRING = "0.4+";

var STROKE_WIDTH = 8;         // px
var OUTPUT_DISC_SIZE = 100;   // diameter in mm
var OUTPUT_DPI = 600;         // dpi
var DISC_CANVAS_MARGIN = 30;  // px

var is_touching = false;
var disc_angle = 0;
var angular_velocity = 0;
var start_disc_angle;
var start_grab_angle;
var current_grab_angle;
var grab_angle_history = [];

function StrokeManager() {
    var strokes_ = [];
    var is_stroking_ = false;
    var current_stroke_ = [];

    // stroke management
    this.clear = function() {
        strokes_ = [];
    };

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
    ctx.lineWidth = STROKE_WIDTH;
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
        ctx.lineWidth = STROKE_WIDTH;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        sm.draw_current_stroke(ctx);
    }
}

function draw_disc(canvas, margin, angle) {
    var NUM_DIRECTIONS = 8;

    var ctx = canvas.getContext('2d');
    ctx.save();

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // construct the transformation
    ctx.translate(canvas.width / 2,
                  canvas.height / 2);
    ctx.scale(canvas.width / 2 - margin,
              canvas.height / 2 - margin);
    ctx.rotate(angle);

    // disc's background
    ctx.save();

    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // cross-hair
    var CROSS_HAIR_LENGTH = 0.1;
    var CROSS_HAIR_WIDTH = 0.01;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = CROSS_HAIR_WIDTH;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-CROSS_HAIR_LENGTH / 2, 0);
    ctx.lineTo(CROSS_HAIR_LENGTH / 2, 0);
    ctx.moveTo(0, -CROSS_HAIR_LENGTH / 2);
    ctx.lineTo(0, CROSS_HAIR_LENGTH / 2);
    ctx.stroke();

    ctx.restore();

    // slits
    var SLIT_LENGTH = 0.2;
    var SLIT_WIDTH = 0.03;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = SLIT_WIDTH;
    ctx.lineCap = "butt";

    var i;
    for (i = 0; i < NUM_DIRECTIONS; ++i) {
        ctx.save();

        ctx.rotate(2 * Math.PI * i / NUM_DIRECTIONS);

        ctx.beginPath();
        ctx.moveTo(0, -1 + SLIT_LENGTH);
        ctx.lineTo(0, -1);
        ctx.stroke();

        ctx.restore();
    }
    ctx.restore();

    // white circle
    var CIRCLE_LINE_WIDTH = 0.01;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = CIRCLE_LINE_WIDTH;

    ctx.beginPath();
    ctx.arc(0, 0, 1 - SLIT_LENGTH, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    // strokes
    var STROKE_WIDTH = 0.01;
    var REGION_SIZE = 0.1;
    var LOCATIONS = [0, 4];
    var TOP_MARGIN = 0.03;
    var HSPACE = 0.03;
    var VSPACE = 0.03;
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.lineWidth = STROKE_WIDTH;
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
            for (k = 0; k < LOCATIONS.length; ++k) {
                ctx.save();

                // a stroke region for this stroke
                var base_x = -(REGION_SIZE + HSPACE / 2);
                var base_y = -1 + SLIT_LENGTH + TOP_MARGIN;
                var region_x = base_x + (i % 2) * (REGION_SIZE + HSPACE);
                var region_y = base_y + Math.floor(i / 2) * (REGION_SIZE + VSPACE);

                ctx.rotate(2 * Math.PI * (LOCATIONS[k] + j) / NUM_DIRECTIONS);
                ctx.translate(region_x, region_y);
                ctx.scale(REGION_SIZE / char_canvas.width,
                          REGION_SIZE / char_canvas.height);

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
        draw_disc(disc_canvas, DISC_CANVAS_MARGIN, disc_angle);
    }
}

function get_mouse_coordinates(e) {
    // get the coordinates where the event occurred
    var page_x, page_y;
    if (e.pageX || e.pageY) {
        page_x = e.pageX;
        page_y = e.pageY;
    }
    else {  // for IE
        page_x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        page_y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    // get the target's coordinates relative to the page
    var offset_left = 0;
    var offset_top = 0;
    var element = e.target;
    do {
        offset_left += element.offsetLeft;
        offset_top  += element.offsetTop;
    } while (element = element.offsetParent);

    return [page_x - offset_left,
            page_y - offset_top];
}

function get_touch_coordinates(e) {
    // get the coordinates where the event occurred
    var page_x = e.touches[0].pageX;
    var page_y = e.touches[0].pageY;

    // get the target's coordinates relative to the page
    var offset_left = 0;
    var offset_top = 0;
    var element = e.target;
    do {
        offset_left += element.offsetLeft;
        offset_top  += element.offsetTop;
    } while (element = element.offsetParent);

    return [page_x - offset_left,
            page_y - offset_top];
}

function on_char_canvas_mousedown(e) {
    var c = get_mouse_coordinates(e);
    var x = c[0], y = c[1];
    begin_stroke_on(e.target, x, y);
}

function on_char_canvas_mousemove(e) {
    var c = get_mouse_coordinates(e);
    var x = c[0], y = c[1];
    update_stroke_on(e.target, x, y);
}

function on_char_canvas_mouseup(e) {
    end_stroke_on(e.target);
}

function on_char_canvas_touchstart(e) {
    if (e.touches.length === 1) {
        var c = get_touch_coordinates(e);
        var x = c[0], y = c[1];
        begin_stroke_on(e.target, x, y);

        e.preventDefault();
    }
}

function on_char_canvas_touchmove(e) {
    if (e.touches.length === 1) {
        var c = get_touch_coordinates(e);
        var x = c[0], y = c[1];
        update_stroke_on(e.target, x, y);

        e.preventDefault();
    }
}

function on_char_canvas_touchend(e) {
    end_stroke_on(e.target);

    e.preventDefault();
}

function calc_angle(canvas, x, y) {
    return Math.atan2(y - canvas.height / 2,
                      x - canvas.width / 2);
}

function calc_angular_velocity(angle_history) {
    if (angle_history.length >= 2) {
        // calculate an average angular velocity
        var sum_velocity = 0;
        var i;
        for (i = 1; i < grab_angle_history.length; ++i) {
            sum_velocity += grab_angle_history[i] - grab_angle_history[i - 1];
        }

        return sum_velocity / (grab_angle_history.length - 1);
    }
    else {
        return 0;
    }
}

function on_disc_canvas_mousedown(e) {
    is_touching = true;

    // stop the rotation of the disc
    start_disc_angle = disc_angle;
    angular_velocity = 0;

    // record the current disc's angle needed later
    var c = get_mouse_coordinates(e);
    var x = c[0], y = c[1];
    var a = calc_angle(e.target, x, y);
    start_grab_angle = a;
    current_grab_angle = a;
}

function on_disc_canvas_mousemove(e) {
    if (is_touching) {
        var c = get_mouse_coordinates(e);
        var x = c[0], y = c[1];
        current_grab_angle = calc_angle(e.target, x, y);

        disc_angle = start_disc_angle + (current_grab_angle - start_grab_angle);
    }
}

function on_disc_canvas_mouseup(e) {
    if (is_touching) {
        is_touching = false;
        angular_velocity = calc_angular_velocity(grab_angle_history);
    }
}

function on_disc_canvas_touchstart(e) {
    if (e.touches.length === 1) {
        is_touching = true;

        // stop the rotation of the disc
        start_disc_angle = disc_angle;
        angular_velocity = 0;

        // record the current disc's angle needed later
        var c = get_touch_coordinates(e);
        var x = c[0], y = c[1];
        var a = calc_angle(e.target, x, y);
        start_grab_angle = a;
        current_grab_angle = a;

        e.preventDefault();
    }
}

function on_disc_canvas_touchmove(e) {
    if (e.touches.length === 1) {
        if (is_touching) {
            var c = get_touch_coordinates(e);
            var x = c[0], y = c[1];
            current_grab_angle = calc_angle(e.target, x, y);

            disc_angle = start_disc_angle + (current_grab_angle - start_grab_angle);
        }

        e.preventDefault();
    }
}

function on_disc_canvas_touchend(e) {
    if (is_touching) {
        is_touching = false;
        angular_velocity = calc_angular_velocity(grab_angle_history);
    }

    e.preventDefault();
}

function on_reset_button_clicked(e) {
    var button = e.target;
    var n = button.id.substr(-1, 1);
    var canvas_id = "char_canvas" + n;
    var canvas = document.getElementById(canvas_id);

    var sm = stroke_managers[canvas_id];
    sm.clear();

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var disc_canvas = document.getElementById("disc_canvas");
    draw_disc(disc_canvas, DISC_CANVAS_MARGIN, disc_angle);
}

function on_reset_all_button_clicked(e) {
    var char_canvases = document.getElementsByClassName("char_canvas");
    var i;
    for (i = 0; i < char_canvases.length; ++i) {
        var c = char_canvases[i];
        var sm = stroke_managers[c.id];
        sm.clear();

        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
    }

    var disc_canvas = document.getElementById("disc_canvas");
    draw_disc(disc_canvas, DISC_CANVAS_MARGIN, disc_angle);
}

function create_disc_image(size_in_mm, dpi) {
    // 1 inch := 25.4 mm
    var size = size_in_mm * dpi / 25.4;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    draw_disc(canvas, 0, 0);
    return canvas.toDataURL("image/png");
}

function on_view_button_clicked(e) {
    var dataUrl = create_disc_image(OUTPUT_DISC_SIZE, OUTPUT_DPI);
    window.location = dataUrl;
}

function on_save_button_clicked(e) {
    var dataUrl = create_disc_image(OUTPUT_DISC_SIZE, OUTPUT_DPI);
    window.location = dataUrl.replace("image/png", "image/octet-stream");
}

function is_platform_mobile() {
    return Boolean(navigator.userAgent.match(/Android|iPhone|iPad/));
}

function on_window_loaded(e) {
    // set title header
    var platform = is_platform_mobile() ? "MOBILE" : "DESKTOP";

    var title_header = document.getElementById("title_header");
    title_header.innerHTML += ' <span style="font-size: small">'
                            + "(Ver. " + VERSION_STRING + ";"
                            + " " + platform + " mode)"
                            + "</span>";

    // install stroke handlers
    var char_canvases = document.getElementsByClassName("char_canvas");
    var i;
    for (i = 0; i < char_canvases.length; ++i) {
        var c = char_canvases[i];
        stroke_managers[c.id] = new StrokeManager();
        if (is_platform_mobile()) {
            c.addEventListener("touchstart", on_char_canvas_touchstart, false);
            c.addEventListener("touchmove",  on_char_canvas_touchmove, false);
            c.addEventListener("touchend",   on_char_canvas_touchend, false);
        } else {
            c.addEventListener("mousedown", on_char_canvas_mousedown, false);
            c.addEventListener("mousemove", on_char_canvas_mousemove, false);
            c.addEventListener("mouseup",   on_char_canvas_mouseup, false);
        }
    }

    var disc_canvas = document.getElementById("disc_canvas");
    if (is_platform_mobile()) {
        disc_canvas.addEventListener("touchstart", on_disc_canvas_touchstart, false);
        disc_canvas.addEventListener("touchmove",  on_disc_canvas_touchmove, false);
        disc_canvas.addEventListener("touchend",   on_disc_canvas_touchend, false);
    } else {
        disc_canvas.addEventListener("mousedown", on_disc_canvas_mousedown, false);
        disc_canvas.addEventListener("mousemove", on_disc_canvas_mousemove, false);
        disc_canvas.addEventListener("mouseup",   on_disc_canvas_mouseup, false);
    }

    // reset buttons
    var reset_buttons = document.getElementsByClassName("reset_button");
    for (i = 0; i < reset_buttons.length; ++i) {
        var b = reset_buttons[i];
        b.addEventListener("click", on_reset_button_clicked, false);
    }
    var reset_all_button = document.getElementById("reset_all_button");
    reset_all_button.addEventListener("click", on_reset_all_button_clicked, false);

    // view button
    var view_button = document.getElementById("view_button");
    view_button.addEventListener("click", on_view_button_clicked, false);

    // save button
    var save_button = document.getElementById("save_button");
    save_button.addEventListener("click", on_save_button_clicked, false);

    // draw a disc
    draw_disc(disc_canvas, DISC_CANVAS_MARGIN, disc_angle);
}

// Register event handlers
window.addEventListener("load", on_window_loaded, false);

// for interactive animation
window.setInterval(function() {
    if (is_touching) {
        grab_angle_history.push(current_grab_angle);
        // keep the only last history of 100 ms
        grab_angle_history = grab_angle_history.slice(-10);
    }
    else {
        disc_angle += angular_velocity;
    }
}, 1000 / 100);

window.setInterval(function() {
    var disc_canvas = document.getElementById("disc_canvas");
    draw_disc(disc_canvas, DISC_CANVAS_MARGIN, disc_angle);
}, 1000 / 60);
