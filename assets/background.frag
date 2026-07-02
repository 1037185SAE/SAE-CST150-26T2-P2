precision mediump float;

uniform float iTime;
uniform vec3 iResolution;

#define t (iTime / 8.0)
#define r (iResolution.xy * vec2(2., 2.))

void main() {
	vec3 c;
	float l, z = t;
	for(int i = 0; i < 3; i++) {
		vec2 uv, p = gl_FragCoord.xy / r;
		uv = p;
		p -= .501;
		p.x *= r.x / r.y;
		z += .07;
		l = length(p);
		uv += p / l * (sin(z) + 1.) * abs(sin(l * 9. - z - z));
		c[i] = .01 / length(mod(uv, 1.) - .5);
	}
	gl_FragColor = vec4(c / l, t);
}
