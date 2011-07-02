const VERSION_STRING = "0.1+";


var stroke_object = null;
var stroke_is_dragging = false;
var strokes = [];
var last_stroke = [];

function stroke_begin(obj) {
    stroke_object = obj;
    stroke_is_dragging = true;
    last_stroke = [];
}

function stroke_end() {
    stroke_object = null;
    stroke_is_dragging = false;
    strokes.push(last_stroke);
}

function draw_stroke(ctx, stroke, size) {
    ctx.save();

    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    for (var i = 1; i < stroke.length; ++i) {
        ctx.lineTo(stroke[i][0], stroke[i][1]);
    }
    ctx.stroke();

    ctx.restore();
}

function draw_point(ctx, x, y, size) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.restore();
}

function on_char_canvas_mousedown(event) {
    ctx = event.target.getContext('2d');

    if (strokes.length > 0) {
        ctx.strokeStyle = "black";
        draw_stroke(ctx, last_stroke, 8);
    }

    stroke_begin(event.target);
    x = event.offsetX
    y = event.offsetY
    last_stroke.push([x, y])
}

function on_char_canvas_mousemove(event) {
    if (stroke_is_dragging) {
        x = event.offsetX
        y = event.offsetY
        last_stroke.push([x, y])

        ctx = event.target.getContext('2d');
        ctx.strokeStyle = "red";
        draw_stroke(ctx, last_stroke, 8);
    }
}

function on_char_canvas_mouseup(event) {
    if (stroke_is_dragging) {
        stroke_end();
    }
}

function on_char_canvas_touchstart(event) {
    if (event.touches.length == 1) {
        canvas = event.target;
        ctx = canvas.getContext('2d');

        if (strokes.length > 0) {
            ctx.strokeStyle = "black";
            draw_stroke(ctx, last_stroke, 8);
        }

        stroke_begin(canvas);
        x = event.touches[0].clientX - canvas.offsetLeft;
        y = event.touches[0].clientY - canvas.offsetTop;
        last_stroke.push([x, y]);

        event.preventDefault();
    }
}

function on_char_canvas_touchmove(event) {
    if (event.touches.length == 1) {
        if (stroke_is_dragging) {
            x = event.touches[0].clientX - canvas.offsetLeft;
            y = event.touches[0].clientY - canvas.offsetTop;
            last_stroke.push([x, y]);

            canvas = event.target;
            ctx = canvas.getContext('2d');
            ctx.strokeStyle = "red";
            draw_stroke(ctx, last_stroke, 8);
        }

        event.preventDefault();
    }
}

function on_char_canvas_touchend(event) {
    if (stroke_is_dragging) {
        stroke_end();

        event.preventDefault();
    }
}

function is_platform_mobile() {
    return Boolean(navigator.userAgent.match(/Android|iPhone|iPad/));
}

function set_title_header(event) {
    const platform = is_platform_mobile() ? "MOBILE" : "DESKTOP";

    title_header = document.getElementById("title_header")
    title_header.innerHTML += ' <span style="font-size: small">'
                            + "(Ver. " + VERSION_STRING + ";"
                            + " " + platform + " mode)"
                            + "</span>";
}

function install_drawing_handlers(event) {
    var char_canvases = document.getElementsByClassName("char_canvas");
    for (var i = 0; i < char_canvases.length; ++i) {
        var e = char_canvases[i];
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
