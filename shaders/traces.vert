// One instance = one straight trace segment from aA to aB on the chip plane (xz).
// The unit quad is stretched along the segment and widened for the glow falloff.
attribute vec2 aA;
attribute vec2 aB;
attribute float aDist;   // path distance at aA
attribute float aWidth;
attribute float aSeed;
attribute float aY;      // package or die height

varying vec2 vLocal;     // x: distance from aA along the segment, y: offset across it
varying float vLen;
varying float vPathDist;
varying vec2 vPos;
varying float vSeed;
varying float vWidth;

void main() {
  vec2 d = aB - aA;
  float len = length(d);
  vec2 dir = d / max(len, 1e-5);
  vec2 nrm = vec2(-dir.y, dir.x);

  float along = position.x * (len + aWidth);
  float across = position.y * aWidth * 4.0;
  vec2 p = (aA + aB) * 0.5 + dir * along + nrm * across;

  vLocal = vec2(along + len * 0.5, across);
  vLen = len;
  vPathDist = aDist + vLocal.x;
  vPos = p;
  vSeed = aSeed;
  vWidth = aWidth;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x, aY, p.y, 1.0);
}
