// Barebones vertex shader that does nothing
attribute vec2 position;

void main() {
  gl_Position = vec4(position, .0, 1.);
}
