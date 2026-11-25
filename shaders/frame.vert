// Browser frame: a segmented plane bent into a shallow cylinder (edges toward the viewer).
uniform float uBend;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  p.z += uBend * p.x * p.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
