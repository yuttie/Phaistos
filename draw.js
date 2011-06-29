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
    stroke_end();
}

// Register event handlers
window.addEventListener("load", registerEventListeners, false);
function registerEventListeners(event) {
    targetElements = document.getElementsByClassName("char_canvas");
    for (var i = 0; i < targetElements.length; ++i) {
        targetElements[i].addEventListener("mousedown", on_char_canvas_mousedown, false);
        targetElements[i].addEventListener("mouseup",   on_char_canvas_mouseup, false);
        targetElements[i].addEventListener("mousemove", on_char_canvas_mousemove, false);
    }
}
