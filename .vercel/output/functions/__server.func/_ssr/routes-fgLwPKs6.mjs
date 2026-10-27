import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SkipForward, c as Pause, l as FolderOpen, n as VolumeX, o as SkipBack, r as Volume2, s as Play, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-fgLwPKs6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PlayerDock({ dockRef, title, detail, timeLabel, seekValue, seekMax, seekable, playing, busy, demo, volume, tracks, currentId, meters, error, showIntro, onAdd, onDemo, onToggle, onPrev, onNext, onSeek, onVolume, onMute, onPick, onRemove }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		ref: dockRef,
		className: "safe-bottom absolute inset-x-0 bottom-0 z-20 border-t border-border bg-bg-elev px-4 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "track-title min-w-0 truncate text-fg",
					children: title
				}), timeLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shrink-0 text-sm tabular-nums text-muted",
					children: timeLabel
				}) : null]
			}),
			showIntro ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 max-w-prose text-sm text-muted",
				children: "Add MP3s and other audio from this device. They stay in the browser — nothing is sent anywhere."
			}) : null,
			detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-sm text-muted",
				children: detail
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-sm text-fg",
				role: "alert",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mb-4 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "Seek"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "seek",
					type: "range",
					min: 0,
					max: seekMax || 0,
					step: .01,
					value: Number.isFinite(seekValue) ? seekValue : 0,
					disabled: !seekable,
					"aria-valuetext": timeLabel ?? void 0,
					onChange: (event) => onSeek(Number(event.target.value))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid grid-cols-3 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Bass",
						value: meters.bass
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Mid",
						value: meters.mid
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Air",
						value: meters.air
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ctrl icon-btn",
						onClick: onPrev,
						disabled: tracks.length === 0,
						"aria-label": "Previous track",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipBack, { "aria-hidden": "true" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ctrl play-btn",
						onClick: onToggle,
						disabled: busy,
						"aria-label": playing ? "Pause" : "Play",
						children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { "aria-hidden": "true" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
							"aria-hidden": "true",
							className: "translate-x-px"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ctrl icon-btn",
						onClick: onNext,
						disabled: tracks.length === 0,
						"aria-label": "Next track",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { "aria-hidden": "true" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ctrl icon-btn",
						onClick: onMute,
						"aria-label": volume === 0 ? "Unmute" : "Mute",
						children: volume === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { "aria-hidden": "true" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { "aria-hidden": "true" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "min-w-16 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sr-only",
							children: "Volume"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "seek",
							type: "range",
							min: 0,
							max: 1,
							step: .01,
							value: volume,
							onChange: (event) => onVolume(Number(event.target.value))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ctrl icon-btn",
						onClick: onAdd,
						"aria-label": "Add audio from this device",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { "aria-hidden": "true" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-2 overflow-x-auto pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `ctrl chip ${demo ? "chip-active" : ""}`,
					onClick: onDemo,
					"aria-pressed": demo,
					children: "Preview tone"
				}), tracks.map((track) => {
					const active = track.id === currentId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `chip-wrap ${active ? "chip-active" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ctrl chip-main",
							onClick: () => onPick(track.id),
							"aria-pressed": active,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: track.name
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ctrl chip-remove",
							onClick: () => onRemove(track.id),
							"aria-label": `Remove ${track.name}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { "aria-hidden": "true" })
						})]
					}, track.id);
				})]
			})
		]
	});
}
function Meter({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-1 text-xs text-subtle",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-1 overflow-hidden rounded-full bg-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "meter-fill h-full w-full bg-accent",
			style: { transform: `scaleX(${Math.max(0, Math.min(1, value))})` }
		})
	})] });
}
var bodyHits = [];
function hitBody(x, y) {
	for (let i = bodyHits.length - 1; i >= 0; i--) {
		const body = bodyHits[i];
		if (!body) continue;
		const dx = x - body.x;
		const dy = y - body.y;
		if (dx * dx + dy * dy <= (body.r + 8) * (body.r + 8)) return body;
	}
	return null;
}
var TAU = Math.PI * 2;
var tilt = .4;
var PLANETS = [
	{
		name: "Mercury",
		orbit: .18,
		size: .02,
		period: 9,
		color: "#c9bfb2",
		band: "high",
		phase: .4,
		kind: "plain"
	},
	{
		name: "Venus",
		orbit: .27,
		size: .03,
		period: 15,
		color: "#e7d3a4",
		band: "mid",
		phase: 1.7,
		kind: "plain"
	},
	{
		name: "Earth",
		orbit: .36,
		size: .032,
		period: 22,
		color: "#6e97a6",
		band: "mid",
		phase: 2.5,
		kind: "earth",
		moons: 1
	},
	{
		name: "Mars",
		orbit: .45,
		size: .024,
		period: 30,
		color: "#c56a3c",
		band: "low",
		phase: .9,
		kind: "plain"
	},
	{
		name: "Jupiter",
		orbit: .62,
		size: .062,
		period: 46,
		color: "#d7b07a",
		band: "bass",
		phase: 3.4,
		kind: "jupiter",
		moons: 2
	},
	{
		name: "Saturn",
		orbit: .76,
		size: .05,
		period: 58,
		color: "#e6d2a2",
		band: "low",
		phase: 4.8,
		kind: "saturn"
	},
	{
		name: "Uranus",
		orbit: .88,
		size: .034,
		period: 74,
		color: "#c5ddd6",
		band: "air",
		phase: 5.5,
		kind: "plain"
	},
	{
		name: "Neptune",
		orbit: .98,
		size: .032,
		period: 88,
		color: "#7d8fa3",
		band: "high",
		phase: 1.15,
		kind: "plain"
	}
];
var stars = makeStars();
var rocks = makeRocks();
var shocks = [];
var seenBeats = 0;
function drawSolar(ctx, w, h, time, bottomInset, audio, reduced) {
	const levels = audio.levels;
	const playing = audio.playing;
	const top = 64;
	const usableH = Math.max(180, h - bottomInset - top);
	const cx = w * .5;
	const cy = top + usableH * .5;
	tilt = h > w ? .68 : .4;
	const maxR = Math.min(w * .44, usableH * .46 / tilt);
	const energy = levels.energy;
	const motion = reduced ? .22 : 1;
	if (playing && levels.beatCount !== seenBeats) {
		seenBeats = levels.beatCount;
		shocks.push(time);
	}
	while (shocks.length > 5) shocks.shift();
	paintSky(ctx, w, h, cx, cy, time, levels, playing);
	paintStars(ctx, w, h, time, levels, playing, reduced);
	const sunR = Math.max(16, maxR * .085) * (1 + levels.bass * .28 + levels.beat * .08);
	for (const planet of PLANETS) {
		const orbitR = planet.orbit * maxR;
		const hot = levels[planet.band];
		ctx.beginPath();
		ctx.ellipse(cx, cy, orbitR, orbitR * tilt, 0, 0, TAU);
		ctx.strokeStyle = `rgba(243, 238, 230, ${.1 + hot * .22})`;
		ctx.lineWidth = 1;
		ctx.stroke();
	}
	const placed = PLANETS.map((planet) => {
		const ang = planet.phase + time * motion * (TAU / planet.period) * (.55 + energy * .9);
		const orbitR = planet.orbit * maxR;
		const hot = levels[planet.band];
		const radius = Math.max(3.5, planet.size * maxR) * (1 + hot * .42 + (planet.band === "bass" ? levels.beat * .12 : 0));
		return {
			planet,
			ang,
			x: cx + Math.cos(ang) * orbitR,
			y: cy + Math.sin(ang) * orbitR * tilt,
			radius,
			hot,
			depth: Math.sin(ang)
		};
	});
	bodyHits.length = 0;
	const back = placed.filter((p) => p.depth <= 0).sort((a, b) => a.depth - b.depth);
	const front = placed.filter((p) => p.depth > 0).sort((a, b) => a.depth - b.depth);
	paintRocks(ctx, cx, cy, maxR, time, motion, levels, playing, false);
	for (const body of back) paintPlanet(ctx, body.x, body.y, body.radius, body.planet, body.hot, time, audio);
	paintEclipticWave(ctx, cx, cy, maxR * .5, time, audio, playing);
	paintSun(ctx, cx, cy, sunR, time, audio, playing);
	paintShocks(ctx, cx, cy, maxR, time, reduced);
	paintRocks(ctx, cx, cy, maxR, time, motion, levels, playing, true);
	for (const body of front) paintPlanet(ctx, body.x, body.y, body.radius, body.planet, body.hot, time, audio);
	paintComet(ctx, cx, cy, maxR, time, motion, energy, playing);
	for (const body of placed) bodyHits.push({
		name: body.planet.name,
		x: body.x,
		y: body.y,
		r: body.radius
	});
	const vignette = ctx.createRadialGradient(cx, cy, maxR * .2, cx, cy * .9, Math.max(w, h) * .72);
	vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
	vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, w, h);
}
function paintSky(ctx, w, h, cx, cy, time, levels, playing) {
	const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .75);
	const warm = playing ? 18 + levels.bass * 28 : 14;
	g.addColorStop(0, `rgb(${28 + warm}, ${18 + warm * .45}, ${12 + levels.mid * 10})`);
	g.addColorStop(.38, "#0c0e13");
	g.addColorStop(1, "#05060a");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
	ctx.save();
	ctx.translate(w * .5, h * .42);
	ctx.rotate(-.55 + Math.sin(time * .05) * .02);
	ctx.scale(1, .16);
	const band = ctx.createRadialGradient(0, 0, 0, 0, 0, w * .62);
	band.addColorStop(0, "rgba(243, 230, 210, 0.075)");
	band.addColorStop(.55, "rgba(224, 161, 90, 0.03)");
	band.addColorStop(1, "rgba(243, 230, 210, 0)");
	ctx.fillStyle = band;
	ctx.beginPath();
	ctx.arc(0, 0, w * .62, 0, TAU);
	ctx.fill();
	ctx.restore();
}
function paintStars(ctx, w, h, time, levels, playing, reduced) {
	for (const star of stars) {
		const tw = reduced ? 1 : .65 + .35 * Math.sin(time * star.tw + star.a * 6);
		const audioLift = playing ? (star.band ? levels.air : levels.high) * .55 : 0;
		ctx.fillStyle = `rgba(243, 238, 230, ${Math.min(1, star.a * tw + audioLift)})`;
		ctx.beginPath();
		ctx.arc(star.x * w, star.y * h, star.r, 0, TAU);
		ctx.fill();
	}
}
function paintSun(ctx, cx, cy, sunR, time, audio, playing) {
	const { freq, time: wave, levels } = audio;
	const glowR = sunR * (3.1 + levels.bass * 1.6);
	const glow = ctx.createRadialGradient(cx, cy, sunR * .2, cx, cy, glowR);
	glow.addColorStop(0, `rgba(255, 214, 150, ${.45 + levels.bass * .35})`);
	glow.addColorStop(.35, `rgba(224, 140, 64, ${.16 + levels.mid * .12})`);
	glow.addColorStop(1, "rgba(224, 120, 40, 0)");
	ctx.fillStyle = glow;
	ctx.beginPath();
	ctx.arc(cx, cy, glowR, 0, TAU);
	ctx.fill();
	const rays = 72;
	for (let i = 0; i < rays; i++) {
		const ang = i / rays * TAU + time * .12;
		const idx = Math.floor(i / rays * 420);
		const v = playing ? (freq[idx] ?? 0) / 255 : .08 + .05 * Math.sin(time * .7 + i * .4);
		const len = sunR * (.25 + v * 1.7);
		const x1 = cx + Math.cos(ang) * sunR * .86;
		const y1 = cy + Math.sin(ang) * sunR * .86;
		const x2 = cx + Math.cos(ang) * (sunR + len);
		const y2 = cy + Math.sin(ang) * (sunR + len);
		ctx.strokeStyle = `rgba(255, ${190 + Math.floor(v * 50)}, 120, ${.12 + v * .62})`;
		ctx.lineWidth = 1 + v * 2.4;
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}
	const samples = 180;
	ctx.beginPath();
	for (let i = 0; i <= samples; i++) {
		const ang = i / samples * TAU - Math.PI / 2;
		const idx = Math.floor(i / samples * (wave.length - 1));
		const raw = playing ? ((wave[idx] ?? 128) - 128) / 128 : Math.sin(ang * 5 + time * 1.4) * .06;
		const rad = sunR * 1.45 + raw * (12 + levels.energy * 54) + levels.mid * 6;
		const x = cx + Math.cos(ang) * rad;
		const y = cy + Math.sin(ang) * rad;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.save();
	ctx.shadowColor = "rgba(255, 196, 120, 0.85)";
	ctx.shadowBlur = 18;
	ctx.strokeStyle = `rgba(255, 232, 204, ${.55 + levels.energy * .4})`;
	ctx.lineWidth = 1.6;
	ctx.stroke();
	ctx.restore();
	const core = ctx.createRadialGradient(cx - sunR * .28, cy - sunR * .32, sunR * .08, cx, cy, sunR);
	core.addColorStop(0, "#fff8ee");
	core.addColorStop(.28, "#ffe0a8");
	core.addColorStop(.62, "#f0a04a");
	core.addColorStop(1, "#b55222");
	ctx.beginPath();
	ctx.arc(cx, cy, sunR, 0, TAU);
	ctx.fillStyle = core;
	ctx.fill();
	ctx.beginPath();
	ctx.arc(cx - sunR * .22, cy - sunR * .26, sunR * .28, 0, TAU);
	ctx.fillStyle = "rgba(255, 250, 240, 0.55)";
	ctx.fill();
}
function paintEclipticWave(ctx, cx, cy, radius, time, audio, playing) {
	const wave = audio.time;
	const samples = 160;
	ctx.beginPath();
	for (let i = 0; i <= samples; i++) {
		const u = i / samples;
		const ang = u * TAU + time * .05;
		const idx = Math.floor(u * (wave.length - 1));
		const rad = radius + (playing ? ((wave[idx] ?? 128) - 128) / 128 : Math.sin(ang * 3 + time) * .04) * (8 + audio.levels.mid * 28);
		const x = cx + Math.cos(ang) * rad;
		const y = cy + Math.sin(ang) * rad * tilt;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.strokeStyle = `rgba(224, 176, 110, ${.28 + audio.levels.mid * .45})`;
	ctx.lineWidth = 1.4;
	ctx.stroke();
}
function paintShocks(ctx, cx, cy, maxR, time, reduced) {
	if (reduced) return;
	for (let i = shocks.length - 1; i >= 0; i--) {
		const age = time - (shocks[i] ?? time);
		if (age > 1.35) {
			shocks.splice(i, 1);
			continue;
		}
		const p = age / 1.35;
		const rad = maxR * (.12 + p * .95);
		ctx.beginPath();
		ctx.ellipse(cx, cy, rad, rad * tilt, 0, 0, TAU);
		ctx.strokeStyle = `rgba(224, 161, 90, ${(1 - p) * .4})`;
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}
}
function paintRocks(ctx, cx, cy, maxR, time, motion, levels, playing, front) {
	for (const rock of rocks) {
		const ang = rock.phase + time * rock.speed * motion * (.7 + levels.high * .8);
		const isFront = Math.sin(ang) > 0;
		if (isFront !== front) continue;
		const orbit = rock.orbit * maxR;
		const x = cx + Math.cos(ang) * orbit;
		const y = cy + Math.sin(ang) * orbit * tilt + rock.lift * maxR;
		ctx.fillStyle = `rgba(196, 176, 146, ${(.25 + (playing ? levels.high * .7 : 0)) * (isFront ? 1 : .45)})`;
		ctx.beginPath();
		ctx.arc(x, y, rock.size, 0, TAU);
		ctx.fill();
	}
}
function paintPlanet(ctx, x, y, radius, planet, hot, time, audio) {
	if (hot > .08) {
		ctx.beginPath();
		ctx.arc(x, y, radius * (1.7 + hot), 0, TAU);
		ctx.fillStyle = `rgba(224, 176, 120, ${hot * .18})`;
		ctx.fill();
	}
	if (planet.kind === "saturn") paintSaturnRings(ctx, x, y, radius, false, audio, time);
	if (planet.kind === "jupiter") paintJupiter(ctx, x, y, radius);
	else if (planet.kind === "earth") paintEarth(ctx, x, y, radius, time);
	else paintSphere(ctx, x, y, radius, planet.color);
	if (planet.kind === "saturn") paintSaturnRings(ctx, x, y, radius, true, audio, time);
	if (planet.name === "Venus") {
		ctx.beginPath();
		ctx.arc(x, y, radius * 1.18, 0, TAU);
		ctx.strokeStyle = "rgba(231, 211, 164, 0.35)";
		ctx.lineWidth = 2;
		ctx.stroke();
	}
	if (planet.moons) for (let m = 0; m < planet.moons; m++) {
		const spin = time * (1.4 + m * .6) + m * 2;
		const dist = radius * (2.3 + m * .85);
		paintSphere(ctx, x + Math.cos(spin) * dist, y + Math.sin(spin) * dist * .55, Math.max(1.4, radius * .16), m === 0 ? "#d9d3c8" : "#c4bfb4");
	}
}
function paintSphere(ctx, x, y, radius, color) {
	const g = ctx.createRadialGradient(x - radius * .38, y - radius * .42, radius * .1, x, y, radius);
	g.addColorStop(0, mix(color, "#fff6ea", .62));
	g.addColorStop(.55, color);
	g.addColorStop(1, mix(color, "#120c09", .55));
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, TAU);
	ctx.fillStyle = g;
	ctx.fill();
}
function paintEarth(ctx, x, y, radius, time) {
	paintSphere(ctx, x, y, radius, "#3f7590");
	ctx.save();
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, TAU);
	ctx.clip();
	ctx.fillStyle = "#8d9a62";
	ctx.beginPath();
	ctx.ellipse(x - radius * .15 + Math.sin(time * .15) * radius * .05, y - radius * .1, radius * .42, radius * .28, .4, 0, TAU);
	ctx.fill();
	ctx.fillStyle = "#c4a574";
	ctx.beginPath();
	ctx.ellipse(x + radius * .28, y + radius * .22, radius * .22, radius * .16, -.4, 0, TAU);
	ctx.fill();
	ctx.restore();
	const gloss = ctx.createRadialGradient(x - radius * .35, y - radius * .4, radius * .05, x, y, radius);
	gloss.addColorStop(0, "rgba(255, 250, 240, 0.35)");
	gloss.addColorStop(.5, "rgba(255, 250, 240, 0)");
	gloss.addColorStop(1, "rgba(8, 12, 16, 0.35)");
	ctx.fillStyle = gloss;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, TAU);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(x, y, radius + 1.5, 0, TAU);
	ctx.strokeStyle = "rgba(170, 210, 214, 0.45)";
	ctx.lineWidth = 1.5;
	ctx.stroke();
}
function paintJupiter(ctx, x, y, radius) {
	const stripes = [
		"#edd9b0",
		"#d09a58",
		"#f0e2c4",
		"#c47a42",
		"#e7c892",
		"#b86a38"
	];
	ctx.save();
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, TAU);
	ctx.clip();
	for (let i = 0; i < stripes.length; i++) {
		ctx.fillStyle = stripes[i] ?? "#d7b07a";
		const slice = radius * 2 / stripes.length;
		ctx.fillRect(x - radius, y - radius + i * slice, radius * 2, slice + .6);
	}
	ctx.beginPath();
	ctx.ellipse(x + radius * .22, y + radius * .12, radius * .28, radius * .16, .3, 0, TAU);
	ctx.fillStyle = "#a84832";
	ctx.fill();
	ctx.restore();
	const gloss = ctx.createRadialGradient(x - radius * .36, y - radius * .4, radius * .08, x + radius * .2, y + radius * .2, radius);
	gloss.addColorStop(0, "rgba(255, 248, 236, 0.38)");
	gloss.addColorStop(.55, "rgba(255, 248, 236, 0)");
	gloss.addColorStop(1, "rgba(40, 18, 8, 0.38)");
	ctx.fillStyle = gloss;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, TAU);
	ctx.fill();
}
function paintSaturnRings(ctx, x, y, radius, front, audio, time) {
	const rx = radius * 2.15;
	const ry = radius * .72;
	const rot = -.45;
	const wobble = ((audio.time[40] ?? 128) - 128) / 128;
	const width = Math.max(2, radius * (.28 + (audio.playing ? Math.abs(wobble) * .2 + audio.levels.mid * .12 : .04)));
	ctx.beginPath();
	ctx.ellipse(x, y, rx, ry, rot, front ? 0 : Math.PI, front ? Math.PI : TAU);
	ctx.strokeStyle = front ? "rgba(236, 220, 180, 0.85)" : "rgba(196, 170, 120, 0.4)";
	ctx.lineWidth = width;
	ctx.stroke();
	ctx.beginPath();
	ctx.ellipse(x, y, rx * .78, ry * .78, rot, front ? 0 : Math.PI, front ? Math.PI : TAU);
	ctx.strokeStyle = "rgba(7, 8, 12, 0.75)";
	ctx.lineWidth = Math.max(1, radius * .07);
	ctx.stroke();
}
function paintComet(ctx, cx, cy, maxR, time, motion, energy, playing) {
	const ang = time * .42 * motion + .6;
	const orbit = maxR * .7;
	const x = cx + Math.cos(ang) * orbit;
	const y = cy + Math.sin(ang) * orbit * tilt;
	const tail = 14 + (playing ? energy * 36 : 6);
	for (let i = 12; i >= 1; i--) {
		const a = ang - i * .07;
		const px = cx + Math.cos(a) * orbit;
		const py = cy + Math.sin(a) * orbit * tilt;
		ctx.fillStyle = `rgba(243, 230, 210, ${(13 - i) / 13 * .28})`;
		ctx.beginPath();
		ctx.arc(px, py, Math.max(.6, tail / 18 * (1 - i / 14)), 0, TAU);
		ctx.fill();
	}
	paintSphere(ctx, x, y, 2.4 + energy * 1.6, "#f3eee6");
}
function makeStars() {
	const out = [];
	let seed = 42;
	const rnd = () => {
		seed = seed * 16807 % 2147483647;
		return (seed - 1) / 2147483646;
	};
	for (let i = 0; i < 140; i++) out.push({
		x: rnd(),
		y: rnd(),
		r: rnd() * 1.15 + .25,
		a: .2 + rnd() * .65,
		tw: .6 + rnd() * 2.2,
		band: false
	});
	for (let i = 0; i < 90; i++) {
		const x = rnd();
		const y = .42 + (x - .5) * .22 + (rnd() - .5) * .08;
		out.push({
			x,
			y: Math.min(.96, Math.max(.04, y)),
			r: rnd() * .9 + .2,
			a: .15 + rnd() * .4,
			tw: .8 + rnd() * 1.5,
			band: true
		});
	}
	return out;
}
function makeRocks() {
	const out = [];
	let seed = 99;
	const rnd = () => {
		seed = seed * 48271 % 2147483647;
		return (seed - 1) / 2147483646;
	};
	for (let i = 0; i < 100; i++) out.push({
		orbit: .5 + rnd() * .055,
		phase: rnd() * TAU,
		speed: .18 + rnd() * .28,
		size: rnd() * 1.35 + .45,
		lift: (rnd() - .5) * .03
	});
	return out;
}
function mix(hex, target, t) {
	const a = hexToRgb(hex);
	const b = hexToRgb(target);
	return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}
function hexToRgb(hex) {
	const h = hex.replace("#", "");
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16)
	];
}
var SILENT_FREQ = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(1024));
var SILENT_TIME = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(2048));
var SILENT_LEVELS = {
	bass: 0,
	low: 0,
	mid: 0,
	high: 0,
	air: 0,
	energy: 0,
	beat: 0,
	beatCount: 0
};
var SolarCanvas = (0, import_react.memo)(function SolarCanvas({ engine, bottomInset, onHover }) {
	const ref = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(engine);
	const insetRef = (0, import_react.useRef)(bottomInset);
	const hoverRef = (0, import_react.useRef)(onHover);
	engineRef.current = engine;
	insetRef.current = bottomInset;
	hoverRef.current = onHover;
	(0, import_react.useEffect)(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;
		let frame = 0;
		const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		let reduced = reducedQuery.matches;
		const onReduce = () => {
			reduced = reducedQuery.matches;
		};
		reducedQuery.addEventListener("change", onReduce);
		const draw = (now) => {
			frame = requestAnimationFrame(draw);
			const parent = canvas.parentElement;
			if (!parent) return;
			const w = parent.clientWidth;
			const h = parent.clientHeight;
			if (w < 2 || h < 2) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const pw = Math.floor(w * dpr);
			const ph = Math.floor(h * dpr);
			if (canvas.width !== pw || canvas.height !== ph) {
				canvas.width = pw;
				canvas.height = ph;
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const current = engineRef.current;
			current?.sample();
			drawSolar(ctx, w, h, now / 1e3, insetRef.current, {
				freq: current?.freq ?? SILENT_FREQ,
				time: current?.time ?? SILENT_TIME,
				levels: current?.levels ?? SILENT_LEVELS,
				playing: current?.playing ?? false
			}, reduced);
		};
		frame = requestAnimationFrame(draw);
		return () => {
			cancelAnimationFrame(frame);
			reducedQuery.removeEventListener("change", onReduce);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref,
		className: "absolute inset-0 h-full w-full touch-none",
		"aria-hidden": "true",
		onPointerMove: (event) => {
			const rect = event.currentTarget.getBoundingClientRect();
			const hit = hitBody(event.clientX - rect.left, event.clientY - rect.top);
			hoverRef.current(hit ? {
				name: hit.name,
				x: hit.x,
				y: hit.y
			} : null);
		},
		onPointerLeave: () => hoverRef.current(null)
	});
});
var ARP = [
	293.66,
	349.23,
	392,
	440,
	523.25,
	440,
	392,
	349.23
];
var BASS = [
	73.42,
	58.27,
	87.31,
	65.41
];
var BEAT = 60 / 100;
function clamp01(n) {
	return n < 0 ? 0 : n > 1 ? 1 : n;
}
var Engine = class {
	freq = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(1024));
	time = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(2048));
	levels = {
		bass: 0,
		low: 0,
		mid: 0,
		high: 0,
		air: 0,
		energy: 0,
		beat: 0,
		beatCount: 0
	};
	playing = false;
	mode = "idle";
	onEnded = null;
	ctx = null;
	analyser = null;
	master = null;
	mediaGain = null;
	demoGain = null;
	mediaNode = null;
	audio;
	objectUrl = null;
	volume = .85;
	pads = [];
	demoRunning = false;
	nextKick = 0;
	nextArp = 0;
	beatEnv = 0;
	bassFollow = 0;
	lastBeatAt = 0;
	smooth = {
		bass: 0,
		low: 0,
		mid: 0,
		high: 0,
		air: 0,
		energy: 0,
		beat: 0,
		beatCount: 0
	};
	disposed = false;
	constructor() {
		this.audio = new Audio();
		this.audio.preload = "auto";
		this.audio.playsInline = true;
		this.audio.crossOrigin = "anonymous";
		this.audio.addEventListener("ended", () => {
			if (this.mode === "file") this.onEnded?.();
		});
		document.addEventListener("visibilitychange", this.onVisible);
	}
	/** Call synchronously inside a click, tap, or key handler. */
	unlock() {
		if (this.disposed) return;
		const ctx = this.ensure();
		if (ctx.state === "suspended") ctx.resume();
	}
	setVolume(value) {
		this.volume = clamp01(value);
		const ctx = this.ctx;
		const master = this.master;
		if (!ctx || !master) return;
		const curved = this.volume * this.volume;
		master.gain.setTargetAtTime(curved, ctx.currentTime, .03);
	}
	getVolume() {
		return this.volume;
	}
	currentTime() {
		return this.mode === "file" ? this.audio.currentTime : 0;
	}
	duration() {
		if (this.mode !== "file") return 0;
		const d = this.audio.duration;
		return Number.isFinite(d) ? d : 0;
	}
	seek(time) {
		if (this.mode !== "file") return;
		const d = this.duration();
		const next = d > 0 ? Math.min(Math.max(0, time), Math.max(0, d - .05)) : Math.max(0, time);
		this.audio.currentTime = next;
	}
	async playBlob(blob) {
		this.unlock();
		this.stopDemo();
		if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
		this.objectUrl = URL.createObjectURL(blob);
		this.audio.src = this.objectUrl;
		this.mode = "file";
		this.audio.load();
		await this.audio.play();
		this.playing = true;
	}
	playDemo() {
		this.unlock();
		this.audio.pause();
		const ctx = this.ensure();
		this.stopPads();
		this.demoRunning = true;
		this.mode = "demo";
		this.playing = true;
		this.demoGain?.gain.setTargetAtTime(1, ctx.currentTime, .04);
		this.startPads(ctx);
		const now = ctx.currentTime + .05;
		this.nextKick = now;
		this.nextArp = now;
		this.scheduleDemo();
	}
	pause() {
		if (this.mode === "file") this.audio.pause();
		if (this.mode === "demo") {
			this.demoRunning = false;
			const ctx = this.ctx;
			if (ctx && this.demoGain) this.demoGain.gain.setTargetAtTime(0, ctx.currentTime, .03);
			this.stopPads();
		}
		this.playing = false;
	}
	async resume() {
		this.unlock();
		if (this.mode === "file") {
			await this.audio.play();
			this.playing = true;
			return;
		}
		if (this.mode === "demo") this.playDemo();
	}
	sample() {
		const analyser = this.analyser;
		if (!analyser || !this.playing) {
			this.decay();
			return;
		}
		if (this.demoRunning) this.scheduleDemo();
		analyser.getByteFrequencyData(this.freq);
		analyser.getByteTimeDomainData(this.time);
		const bass = this.avg(1, 5);
		const low = this.avg(5, 14);
		const mid = this.avg(14, 60);
		const high = this.avg(60, 160);
		const air = this.avg(160, 320);
		const energy = bass * .34 + low * .22 + mid * .22 + high * .14 + air * .08;
		this.smooth.bass = approach(this.smooth.bass, bass);
		this.smooth.low = approach(this.smooth.low, low);
		this.smooth.mid = approach(this.smooth.mid, mid);
		this.smooth.high = approach(this.smooth.high, high);
		this.smooth.air = approach(this.smooth.air, air);
		this.smooth.energy = approach(this.smooth.energy, energy);
		this.bassFollow = this.bassFollow * .97 + bass * .03;
		const now = performance.now();
		if (bass > .32 && bass > this.bassFollow * 1.42 && now - this.lastBeatAt > 220) {
			this.beatEnv = 1;
			this.lastBeatAt = now;
			this.smooth.beatCount += 1;
		}
		this.beatEnv *= .9;
		this.smooth.beat = this.beatEnv;
		this.levels = { ...this.smooth };
	}
	dispose() {
		this.disposed = true;
		document.removeEventListener("visibilitychange", this.onVisible);
		this.stopDemo();
		this.audio.pause();
		this.audio.src = "";
		if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
		this.ctx?.close();
		this.ctx = null;
	}
	onVisible = () => {
		if (document.visibilityState !== "visible" || !this.playing) return;
		if (this.ctx?.state === "suspended") this.ctx.resume();
		if (this.mode === "file" && this.audio.paused) this.audio.play().catch(() => void 0);
		if (this.mode === "demo" && this.ctx) {
			this.nextKick = this.ctx.currentTime + .05;
			this.nextArp = this.nextKick;
		}
	};
	ensure() {
		if (this.ctx) return this.ctx;
		const Ctor = window.AudioContext || window.webkitAudioContext;
		if (!Ctor) throw new Error("This browser cannot play audio");
		const ctx = new Ctor({ latencyHint: "interactive" });
		const master = ctx.createGain();
		master.gain.value = this.volume * this.volume;
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 2048;
		analyser.smoothingTimeConstant = .72;
		const mediaGain = ctx.createGain();
		const demoGain = ctx.createGain();
		demoGain.gain.value = 0;
		mediaGain.connect(analyser);
		demoGain.connect(analyser);
		analyser.connect(master);
		master.connect(ctx.destination);
		const mediaNode = ctx.createMediaElementSource(this.audio);
		mediaNode.connect(mediaGain);
		this.ctx = ctx;
		this.master = master;
		this.analyser = analyser;
		this.mediaGain = mediaGain;
		this.demoGain = demoGain;
		this.mediaNode = mediaNode;
		return ctx;
	}
	stopDemo() {
		this.demoRunning = false;
		const ctx = this.ctx;
		if (ctx && this.demoGain) this.demoGain.gain.setTargetAtTime(0, ctx.currentTime, .02);
		this.stopPads();
	}
	stopPads() {
		for (const osc of this.pads) {
			try {
				osc.stop();
			} catch {}
			osc.disconnect();
		}
		this.pads = [];
	}
	startPads(ctx) {
		const dest = this.demoGain;
		if (!dest) return;
		for (const [freq, gainValue, type] of [
			[
				73.42,
				.045,
				"sine"
			],
			[
				110,
				.03,
				"sine"
			],
			[
				146.83,
				.02,
				"triangle"
			],
			[
				220,
				.012,
				"sine"
			]
		]) {
			const osc = ctx.createOscillator();
			osc.type = type;
			osc.frequency.value = freq;
			const gain = ctx.createGain();
			gain.gain.value = gainValue;
			osc.connect(gain);
			gain.connect(dest);
			osc.start();
			this.pads.push(osc);
		}
	}
	scheduleDemo() {
		const ctx = this.ctx;
		const dest = this.demoGain;
		if (!ctx || !dest || !this.demoRunning) return;
		const horizon = ctx.currentTime + .25;
		if (this.nextKick < ctx.currentTime - .2) this.nextKick = ctx.currentTime + .02;
		if (this.nextArp < ctx.currentTime - .2) this.nextArp = ctx.currentTime + .02;
		while (this.nextKick < horizon) {
			const t = this.nextKick;
			const bar = Math.floor(t / (BEAT * 4));
			this.voiceKick(ctx, dest, t);
			const bassFreq = BASS[(bar % BASS.length + BASS.length) % BASS.length] ?? 73.42;
			this.voiceBass(ctx, dest, t, bassFreq);
			this.nextKick += BEAT;
		}
		while (this.nextArp < horizon) {
			const t = this.nextArp;
			const freq = ARP[(Math.floor(t / (BEAT / 2)) % ARP.length + ARP.length) % ARP.length] ?? 392;
			this.voiceArp(ctx, dest, t, freq);
			this.voiceHat(ctx, dest, t);
			this.nextArp += BEAT / 2;
		}
	}
	voiceKick(ctx, dest, time) {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(150, time);
		osc.frequency.exponentialRampToValueAtTime(46, time + .12);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(1e-4, time);
		gain.gain.exponentialRampToValueAtTime(.7, time + .012);
		gain.gain.exponentialRampToValueAtTime(1e-4, time + .28);
		osc.connect(gain);
		gain.connect(dest);
		osc.start(time);
		osc.stop(time + .3);
		osc.onended = () => {
			osc.disconnect();
			gain.disconnect();
		};
	}
	voiceBass(ctx, dest, time, freq) {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.value = freq;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(1e-4, time);
		gain.gain.exponentialRampToValueAtTime(.16, time + .03);
		gain.gain.exponentialRampToValueAtTime(1e-4, time + BEAT * .95);
		osc.connect(gain);
		gain.connect(dest);
		osc.start(time);
		osc.stop(time + BEAT);
		osc.onended = () => {
			osc.disconnect();
			gain.disconnect();
		};
	}
	voiceArp(ctx, dest, time, freq) {
		const osc = ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.value = freq;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(1e-4, time);
		gain.gain.exponentialRampToValueAtTime(.07, time + .012);
		gain.gain.exponentialRampToValueAtTime(1e-4, time + .2);
		osc.connect(gain);
		gain.connect(dest);
		osc.start(time);
		osc.stop(time + .22);
		osc.onended = () => {
			osc.disconnect();
			gain.disconnect();
		};
	}
	voiceHat(ctx, dest, time) {
		const osc = ctx.createOscillator();
		osc.type = "square";
		osc.frequency.value = 7200;
		const filter = ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.value = 6e3;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(.035, time);
		gain.gain.exponentialRampToValueAtTime(1e-4, time + .04);
		osc.connect(filter);
		filter.connect(gain);
		gain.connect(dest);
		osc.start(time);
		osc.stop(time + .05);
		osc.onended = () => {
			osc.disconnect();
			filter.disconnect();
			gain.disconnect();
		};
	}
	avg(from, to) {
		let sum = 0;
		const end = Math.min(to, this.freq.length);
		const start = Math.max(0, from);
		for (let i = start; i < end; i++) sum += this.freq[i] ?? 0;
		const n = Math.max(1, end - start);
		return sum / n / 255;
	}
	decay() {
		this.smooth.bass = approach(this.smooth.bass, 0, .08);
		this.smooth.low = approach(this.smooth.low, 0, .08);
		this.smooth.mid = approach(this.smooth.mid, 0, .08);
		this.smooth.high = approach(this.smooth.high, 0, .08);
		this.smooth.air = approach(this.smooth.air, 0, .08);
		this.smooth.energy = approach(this.smooth.energy, 0, .08);
		this.beatEnv *= .9;
		this.smooth.beat = this.beatEnv;
		this.levels = { ...this.smooth };
	}
};
function approach(current, target, release = .12) {
	const k = target > current ? .38 : release;
	return current + (target - current) * k;
}
var DB_NAME = "helios";
var DB_VERSION = 1;
var META = "meta";
var BLOBS = "blobs";
var memory = /* @__PURE__ */ new Map();
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "id" });
			if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS, { keyPath: "id" });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Could not open the library"));
	});
}
function txDone(tx) {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Library write failed"));
		tx.onabort = () => reject(tx.error ?? /* @__PURE__ */ new Error("Library write aborted"));
	});
}
function prettyName(filename) {
	return filename.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim() || "Untitled";
}
async function listTracks() {
	try {
		const db = await openDb();
		const rows = await new Promise((resolve, reject) => {
			const req = db.transaction(META, "readonly").objectStore(META).getAll();
			req.onsuccess = () => resolve(req.result ?? []);
			req.onerror = () => reject(req.error);
		});
		db.close();
		const savedIds = new Set(rows.map((row) => row.id));
		const sessionOnly = [...memory.values()].filter((track) => !savedIds.has(track.id) && track.blob);
		return [...rows, ...sessionOnly].sort((a, b) => b.addedAt - a.addedAt);
	} catch {
		return [...memory.values()].sort((a, b) => b.addedAt - a.addedAt);
	}
}
async function saveTrack(file) {
	const track = {
		id: crypto.randomUUID(),
		name: prettyName(file.name),
		type: file.type || "audio/*",
		addedAt: Date.now(),
		size: file.size
	};
	try {
		const db = await openDb();
		const tx = db.transaction([META, BLOBS], "readwrite");
		tx.objectStore(META).put(track);
		tx.objectStore(BLOBS).put({
			id: track.id,
			blob: file
		});
		await txDone(tx);
		db.close();
		return track;
	} catch {
		const session = {
			...track,
			blob: file
		};
		memory.set(session.id, session);
		return session;
	}
}
async function loadTrackBlob(track) {
	if (track.blob) return track.blob;
	const cached = memory.get(track.id);
	if (cached?.blob) return cached.blob;
	try {
		const db = await openDb();
		const blob = await new Promise((resolve, reject) => {
			const req = db.transaction(BLOBS, "readonly").objectStore(BLOBS).get(track.id);
			req.onsuccess = () => {
				const row = req.result;
				resolve(row?.blob ?? null);
			};
			req.onerror = () => reject(req.error);
		});
		db.close();
		return blob;
	} catch {
		return null;
	}
}
async function deleteTrack(id) {
	memory.delete(id);
	try {
		const db = await openDb();
		const tx = db.transaction([META, BLOBS], "readwrite");
		tx.objectStore(META).delete(id);
		tx.objectStore(BLOBS).delete(id);
		await txDone(tx);
		db.close();
	} catch {}
}
var AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|ogg|opus|webm|mp4|aiff|aif)$/i;
function isAudioFile(file) {
	if (file.type.startsWith("audio/")) return true;
	if (file.type === "video/mp4") return AUDIO_EXT.test(file.name);
	return AUDIO_EXT.test(file.name);
}
function Home() {
	const engineRef = (0, import_react.useRef)(null);
	const tracksRef = (0, import_react.useRef)([]);
	const currentIdRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const dockRef = (0, import_react.useRef)(null);
	const toggleRef = (0, import_react.useRef)(() => void 0);
	const lastVolume = (0, import_react.useRef)(.85);
	const [engine, setEngine] = (0, import_react.useState)(null);
	const [tracks, setTracks] = (0, import_react.useState)([]);
	const [currentId, setCurrentId] = (0, import_react.useState)(null);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [demo, setDemo] = (0, import_react.useState)(false);
	const [time, setTime] = (0, import_react.useState)(0);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [volume, setVolume] = (0, import_react.useState)(.85);
	const [meters, setMeters] = (0, import_react.useState)({
		bass: 0,
		mid: 0,
		air: 0
	});
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [bottomInset, setBottomInset] = (0, import_react.useState)(240);
	const [hover, setHover] = (0, import_react.useState)(null);
	const rememberTracks = (0, import_react.useCallback)((next) => {
		tracksRef.current = next;
		setTracks(next);
	}, []);
	const playId = (0, import_react.useCallback)(async (id) => {
		const current = engineRef.current;
		const track = tracksRef.current.find((item) => item.id === id);
		if (!current || !track) return;
		current.unlock();
		setBusy(true);
		setError(null);
		try {
			const blob = await loadTrackBlob(track);
			if (!blob) throw new Error("That file is no longer on this device.");
			await current.playBlob(blob);
			currentIdRef.current = id;
			setCurrentId(id);
			setDemo(false);
			setPlaying(true);
		} catch (err) {
			setPlaying(false);
			currentIdRef.current = id;
			setCurrentId(id);
			setDemo(false);
			setError(friendly(err));
		} finally {
			setBusy(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const current = new Engine();
		engineRef.current = current;
		setEngine(current);
		const stored = window.localStorage.getItem("helios-volume");
		if (stored) {
			const parsed = Number(stored);
			if (Number.isFinite(parsed)) {
				const next = Math.min(1, Math.max(0, parsed));
				current.setVolume(next);
				setVolume(next);
				if (next > 0) lastVolume.current = next;
			}
		}
		current.onEnded = () => {
			const list = tracksRef.current;
			if (list.length === 0) {
				setPlaying(false);
				return;
			}
			const following = list[(list.findIndex((track) => track.id === currentIdRef.current) + 1) % list.length];
			if (following) playId(following.id);
		};
		listTracks().then((rows) => rememberTracks(rows));
		const timer = window.setInterval(() => {
			const live = engineRef.current;
			if (!live) return;
			setTime(live.currentTime());
			setDuration(live.duration());
			setMeters({
				bass: live.levels.bass,
				mid: live.levels.mid,
				air: live.levels.air
			});
			setPlaying(live.playing);
		}, 200);
		return () => {
			window.clearInterval(timer);
			current.dispose();
			if (engineRef.current === current) engineRef.current = null;
		};
	}, [playId, rememberTracks]);
	(0, import_react.useEffect)(() => {
		const node = dockRef.current;
		if (!node) return;
		const measure = () => setBottomInset(node.offsetHeight + 12);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, [
		tracks.length,
		error,
		demo,
		busy,
		currentId,
		playing
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			if (target instanceof HTMLElement && target.closest("input, textarea, select")) return;
			const live = engineRef.current;
			if (!live) return;
			if (event.code === "Space") {
				event.preventDefault();
				toggleRef.current();
			} else if (event.code === "ArrowRight") live.seek(live.currentTime() + 5);
			else if (event.code === "ArrowLeft") live.seek(live.currentTime() - 5);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	function togglePlayback() {
		const live = engineRef.current;
		if (!live || busy) return;
		live.unlock();
		if (live.playing) {
			live.pause();
			setPlaying(false);
			return;
		}
		if (live.mode === "file" && currentIdRef.current) {
			live.resume().then(() => setPlaying(true)).catch((err) => setError(friendly(err)));
			return;
		}
		if (live.mode === "demo") {
			live.playDemo();
			setDemo(true);
			setPlaying(true);
			return;
		}
		if (currentIdRef.current) {
			playId(currentIdRef.current);
			return;
		}
		if (tracksRef.current[0]) {
			playId(tracksRef.current[0].id);
			return;
		}
		live.playDemo();
		setDemo(true);
		setPlaying(true);
		setError(null);
	}
	toggleRef.current = togglePlayback;
	async function addFiles(files) {
		const audio = files.filter(isAudioFile);
		if (audio.length === 0) {
			setError("Choose an audio file — MP3, M4A, WAV, FLAC, or OGG.");
			return;
		}
		engineRef.current?.unlock();
		setBusy(true);
		setError(null);
		try {
			const saved = [];
			for (const file of audio) saved.push(await saveTrack(file));
			const next = [...saved, ...tracksRef.current].sort((a, b) => b.addedAt - a.addedAt);
			rememberTracks(next);
			const first = saved[0];
			if (first) await playId(first.id);
		} catch (err) {
			setError(friendly(err));
		} finally {
			setBusy(false);
		}
	}
	function step(direction) {
		const list = tracksRef.current;
		if (list.length === 0) return;
		const index = list.findIndex((track) => track.id === currentIdRef.current);
		const following = list[((index < 0 ? 0 : index) + direction + list.length) % list.length];
		if (following) playId(following.id);
	}
	async function removeTrack(id) {
		await deleteTrack(id);
		const next = tracksRef.current.filter((track) => track.id !== id);
		rememberTracks(next);
		if (currentIdRef.current !== id) return;
		engineRef.current?.pause();
		setPlaying(false);
		currentIdRef.current = null;
		setCurrentId(null);
		const following = next[0];
		if (following) playId(following.id);
	}
	function changeVolume(value) {
		const next = Math.min(1, Math.max(0, value));
		setVolume(next);
		engineRef.current?.setVolume(next);
		if (next > 0) lastVolume.current = next;
		window.localStorage.setItem("helios-volume", String(next));
	}
	const current = tracks.find((track) => track.id === currentId) ?? null;
	const title = demo ? "Preview tone" : current?.name ?? "Nothing in orbit";
	const timeLabel = current ? `${formatTime(time)} / ${formatTime(duration)}` : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh overflow-hidden bg-bg text-fg",
		onDragEnter: (event) => {
			event.preventDefault();
			setDragging(true);
		},
		onDragOver: (event) => {
			event.preventDefault();
			setDragging(true);
		},
		onDragLeave: (event) => {
			if (event.currentTarget.contains(event.relatedTarget)) return;
			setDragging(false);
		},
		onDrop: (event) => {
			event.preventDefault();
			setDragging(false);
			addFiles([...event.dataTransfer.files]);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "sr-only",
				children: "Helios solar audio visualizer"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SolarCanvas, {
				engine,
				bottomInset,
				onHover: setHover
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "safe-top pointer-events-none absolute inset-x-0 top-0 z-10 px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "wordmark text-fg",
					children: "Helios"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Solar listening"
				})]
			}),
			hover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-bg-elev px-2 py-1 text-xs text-fg",
				style: {
					left: hover.x,
					top: hover.y - 10
				},
				children: hover.name
			}) : null,
			dragging ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg/80 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "wordmark text-fg",
					children: "Drop audio"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				className: "sr-only",
				type: "file",
				accept: "audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.webm",
				multiple: true,
				onChange: (event) => {
					const files = [...event.target.files ?? []];
					event.target.value = "";
					addFiles(files);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerDock, {
				dockRef,
				title,
				detail: busy ? "Reading audio…" : null,
				timeLabel,
				seekValue: time,
				seekMax: duration,
				seekable: Boolean(current) && !demo,
				playing,
				busy,
				demo,
				volume,
				tracks,
				currentId: demo ? null : currentId,
				meters,
				error,
				showIntro: !current && !demo && tracks.length === 0,
				onAdd: () => {
					engineRef.current?.unlock();
					fileRef.current?.click();
				},
				onDemo: () => {
					const live = engineRef.current;
					if (!live) return;
					live.unlock();
					live.playDemo();
					setDemo(true);
					setPlaying(true);
					setError(null);
				},
				onToggle: () => togglePlayback(),
				onPrev: () => step(-1),
				onNext: () => step(1),
				onSeek: (value) => {
					engineRef.current?.seek(value);
					setTime(value);
				},
				onVolume: changeVolume,
				onMute: () => changeVolume(volume === 0 ? lastVolume.current || .85 : 0),
				onPick: (id) => void playId(id),
				onRemove: (id) => void removeTrack(id)
			})
		]
	});
}
function formatTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const whole = Math.floor(seconds);
	return `${Math.floor(whole / 60)}:${(whole % 60).toString().padStart(2, "0")}`;
}
function friendly(err) {
	if (err instanceof DOMException && err.name === "NotAllowedError") return "Tap play to start the audio.";
	if (err instanceof DOMException && err.name === "NotSupportedError") return "This browser can't play that file.";
	if (err instanceof Error && err.message) return err.message;
	return "This file couldn't be played.";
}
//#endregion
export { Home as component };
