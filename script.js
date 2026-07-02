"use strict";

console.log("Hi");

// Global (to this file) defines
let glcanvas = document.getElementById("gl_canvas");
let ldswitchpict = document.getElementById("ldswitchpict");
let back_to_top = document.getElementById("back_to_top_btn");
let start_emulator = document.getElementById("start_emulator");
let reset_emulator = document.getElementById("reset_emulator");
let embedded_website = document.getElementById("embedded_website");

// Firefox prevents recursive iframes from getting out of control by stopping the
// embedded website from loading the recursive iframe again.

// I can't guarantee (nor have I tested) if this is the case for Safari, Chromium,
// or others like Ladybird, so it's best to do it manually so someone's computer
// doesn't lock up.
var query = window.location.search;
var params = query.slice(1);
var params_array = params.split('&');
var url_params = {};
params_array.forEach(param => {
  const [key, val] = param.split('=');
  url_params[key] = decodeURIComponent(val);
});

if (url_params["disable_iframe"] == "true") {
  embedded_website.src = "";
}

// Utility functions
function is_visible(element) {
  const rect = element.getBoundingClientRect();
  return ((rect.top >= 0 && rect.left >= 0) &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth));
}

// Fancy WebGL background
function init_webgl() {
  const webgl_temp = glcanvas.getContext("webgl");
  if (webgl_temp === null) {
    alert("WebGL couldn't be initialised. The drivers may not be working, or your browser/machine doesn't support it.");
    console.error("WebGL couldn't be initialised. The drivers may not be working, or your browser/machine doesn't support it.");
    glcanvas.classList += " hidden";
    return null;
  } else {
    return webgl_temp;
  }
}

glcanvas.width = glcanvas.clientWidth;
glcanvas.height = glcanvas.clientHeight;

const webgl = init_webgl();

async function run_texture() {
  let x = 0;
  let y = 0;

  webgl.viewport(
    x,
    y,
    glcanvas.width,
    glcanvas.height
  );

  const frag_shader_src = await fetch("assets/background.frag").then(r => r.text());
  const vert_shader_src = await fetch("assets/background.vert").then(r => r.text());

  const frag_shader = webgl.createShader(webgl.FRAGMENT_SHADER);
  webgl.shaderSource(frag_shader, frag_shader_src);
  webgl.compileShader(frag_shader);

  if (!webgl.getShaderParameter(frag_shader, webgl.COMPILE_STATUS)) {
    const info = webgl.getShaderInfoLog(frag_shader);
    alert(`Failed to compile fragment shader:\n\n${info}`);
    console.error(`Failed to compile fragment shader:\n\n${info}`);
    return;
  }

  const vert_shader = webgl.createShader(webgl.VERTEX_SHADER);
  webgl.shaderSource(vert_shader, vert_shader_src);
  webgl.compileShader(vert_shader);

  if (!webgl.getShaderParameter(vert_shader, webgl.COMPILE_STATUS)) {
    const info = webgl.getShaderInfoLog(vert_shader);
    alert(`Failed to compile vertex shader:\n\n${info}`);
    console.error(`Failed to compile vertex shader:\n\n${info}`);
    return;
  }

  const vertices = new Float32Array([
    -1, -1,
    3, -1,
    -1, 3
  ]);

  const vbo = webgl.createBuffer();
  webgl.bindBuffer(webgl.ARRAY_BUFFER, vbo);
  webgl.bufferData(webgl.ARRAY_BUFFER, vertices, webgl.STATIC_DRAW);

  const program = webgl.createProgram();
  webgl.attachShader(program, frag_shader);
  webgl.attachShader(program, vert_shader);
  webgl.linkProgram(program);

  if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
    console.error(`Failed to finalize program: ${webgl.getProgramInfoLog(program)}`)
    return;
  }

  const position_location = webgl.getAttribLocation(program, "position");
  if (position_location === -1) {
    alert("Failed to find \"position\" attribute. webgl.getAttribLocation() returned -1");
    console.error("Failed to find \"position\" attribute. webgl.getAttribLocation() returned -1");
    return;
  }

  webgl.enableVertexAttribArray(position_location);

  let index = position_location;
  let size = 2;
  let vert_type = webgl.FLOAT;
  let normalized = false;
  let stride = 0;
  let offset = 0;

  webgl.vertexAttribPointer(
    index,
    size,
    vert_type,
    normalized,
    stride,
    offset
  );

  webgl.useProgram(program);

  const timeLoc = webgl.getUniformLocation(program, "iTime");
  const resolutionLoc = webgl.getUniformLocation(program, "iResolution");

  function render(timeMs) {
    webgl.viewport(
      x,
      y,
      glcanvas.width,
      glcanvas.height
    );

    webgl.uniform1f(
      timeLoc,
      timeMs / 1000.
    );

    webgl.uniform3f(
      resolutionLoc,
      glcanvas.width,
      glcanvas.height,
      1.
    );

    webgl.clear(webgl.COLOR_BUFFER_BIT);
    webgl.drawArrays(webgl.TRIANGLES, 0, 3);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

document.addEventListener("DOMContentLoaded", async function() {
  console.log(glcanvas.width, glcanvas.height);
  console.log(glcanvas.clientWidth, glcanvas.clientHeight);
  if (webgl !== null) {
    await run_texture();
  }
});

// dark/light switch
let colour_mode = undefined;

function colour_mode_info() {
  if (colour_mode === true) {
    return ["moon", "light"];
  } else {
    return ["sun", "dark"];
  }
}

const dark_mode_mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

if (dark_mode_mql && dark_mode_mql.matches) {
  colour_mode = false;
} else {
  colour_mode = true;
}

function update_colours() {
  const [pict, name] = colour_mode_info();
  document.documentElement.dataset.theme = name;
  ldswitchpict.src = `assets/${pict}.png`;
}

// Having this outside the DOMContentLoaded callback stops the flashbang
update_colours();

// Prevent potential flashbang by changing to
// transition type after accounting for preferred
// colour scheme.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("*").forEach(element => {
    if (!element.classList.contains("dont_apply_did_load")) {
      element.classList += " did_load";
    }
  });
});

ldswitchpict.addEventListener("click", function() {
  colour_mode = !colour_mode;
  update_colours();
});

document.querySelectorAll(".top_nav ul li a").forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    const targetSelection = document.querySelector(targetId);
    const rect = targetSelection.getBoundingClientRect();

    window.scrollTo({
      top: rect.top,
      left: rect.left,
      behavior: "smooth"
    });
  });
});

back_to_top.addEventListener("click", () => {
  const doc_rect = document.documentElement.getBoundingClientRect();

  window.scrollTo({
      top: doc_rect.top,
      left: doc_rect.left,
      behavior: "smooth"
    });
});

window.addEventListener("scroll", () => {
  if (document.documentElement.scrollTop == 0) {
    back_to_top.classList.add("hidden");
  } else {
    back_to_top.classList.remove("hidden");
  }
});

start_emulator.addEventListener("click", () => {
  var emulator = window.emulator = new V86({
    wasm_path: "lib/emu/v86.wasm",
    memory_size: 64 * 1024 * 1024,
    vga_memory_size: 8 * 1024 * 1024, // // 8 MB
    screen_container: document.getElementById("screen_container"),
    bios: {
      url: "lib/emu/seabios.bin"
    },
    vga_bios: {
      url: "lib/emu/vgabios.bin"
    },
    hda: {
      url: "https://pub-9bff1f86c2d243f28d679354342add9e.r2.dev/windows95.bin",
      async: true
    },
    autostart: true,
  });
});

reset_emulator.addEventListener("click", () => {
  window.emulator.restart();
});
