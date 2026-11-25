// Auth packets. Each loops along its lane toward −z. Authorized packets (aReject < 0)
// pass every gate; rejected ones stop at gate aReject, flash and spread into a flat
// shockwave on the gate plane. uGather pulls the rejected set into the teaser cluster.
attribute vec2 aLane;
attribute float aSpeed;
attribute float aPhase;
attribute float aSeed;
attribute float aReject;

uniform float uTime;
uniform float uReveal;
uniform float uGather;
uniform float uVelocity;
uniform vec3 uOrigin;     // lane centre x/y and spawn z
uniform float uLength;    // travel distance
uniform vec3 uGates;      // gate z positions
uniform vec3 uCluster;

varying float vState;     // 0 unchecked, 1 authorized, 2 rejected
varying float vAlpha;
varying float vFlash;

void main() {
  float t = fract(uTime * aSpeed + aPhase);
  float z = uOrigin.z - t * uLength;
  vec3 c = vec3(uOrigin.x + aLane.x, uOrigin.y + aLane.y, z);
  vec3 s = vec3(0.045, 0.045, 0.2 * (1.0 + abs(uVelocity) * 2.0));
  float state = z < uGates.x ? 1.0 : 0.0;
  float dissolve = 0.0;

  if (aReject >= 0.0) {
    float gz = aReject < 0.5 ? uGates.x : (aReject < 1.5 ? uGates.y : uGates.z);
    if (z < gz) {
      dissolve = clamp((gz - z) / 1.6, 0.0, 1.0);
      c.z = gz + 0.01;
      state = 2.0;
      s = mix(vec3(0.06, 0.06, 0.2), vec3(0.55, 0.55, 0.004), sqrt(dissolve));
    }
    // Teaser: rejected packets gather and orbit.
    float a = uTime * (0.4 + aSeed * 0.5) + aSeed * 40.0;
    vec3 orbit = uCluster + vec3(cos(a), sin(a * 1.3) * 0.7, sin(a)) * (0.18 + aSeed * 0.42);
    c = mix(c, orbit, uGather);
    s = mix(s, vec3(0.04), uGather);
    dissolve *= 1.0 - uGather;
    state = mix(state, 2.0, step(0.01, uGather));
  }

  vec3 p = position * s + c;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);

  float life = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.9, 1.0, t));
  float alpha = life * (1.0 - dissolve);
  if (aReject >= 0.0) alpha = mix(alpha, 1.0, uGather);
  else alpha *= 1.0 - uGather * 0.6;
  vAlpha = alpha * uReveal;
  vState = state;
  vFlash = (1.0 - dissolve) * step(0.001, dissolve);
}
