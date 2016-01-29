var nodes = {};
var SPEED = 20;

var spriteMaterial = new THREE.SpriteMaterial( 
{ 
	map: (new THREE.TextureLoader()).load('glow.png'),
	color: 0x00ff0f, transparent: false, blending: THREE.AdditiveBlending
});


function processEvent(e) {
	var srcEl, tgtEl;
	if ('type' in e) {
		// informational message
		// console.log(e);
	} else {
		var camera = AFRAME.aframeCore.AScene.scene.el.cameraEl.components.camera.camera;
		var sprite = new THREE.Sprite( spriteMaterial.clone() );
		sprite.scale.set(0.25, 0.25, 0.25);

		var p1 = $("#node-" + e.src).attr("position"),
			p2 = $("#node-" + e.tgt).attr("position"),
			geo = new THREE.SphereGeometry(.001, 4, 4),
			mat = new THREE.MeshPhongMaterial({ color: 0x2222aa }),
			mesh = new THREE.Mesh(geo, mat);

		mesh.add(sprite);
		AFRAME.aframeCore.AScene.scene.add(mesh);

		var tween = new TWEEN.Tween({ x: p1.x, y: p1.y, z: p1.z })
			.to({ x: p2.x, y: p2.y, z: p2.z }, 1000)
			.onStart(function() {
				mesh.position.set(p1.x, p1.y, p2.z);
			})
			.onUpdate(function() {
				mesh.position.x = this.x;
				mesh.position.y = this.y;
				mesh.position.z = this.z;
			})
			.onComplete(function() {
				AFRAME.aframeCore.AScene.scene.remove(mesh);
			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();
	}
}

function getNodeElement(nodeName) {
	return $("#node-"+nodeName);
}

window.onload = function() {
	$.ajax({
		url: "testNodes.json",
		dataType: "json",
		success: function(response) {
			$.each(response, function(i, item) {
				var x = Math.cos(i * (Math.PI / 3));
				var y = Math.sin(i * (Math.PI / 3)) + 2;
				var newEl = $("<a-sphere id='node-"+item.name+"'>")
					.attr("position", x+" "+y+" -1")
					.attr("radius", ".15")
					.attr("color", "#2233dd");
				$('#thescene').append(newEl);
			});

			var socket = new WebSocket('ws://127.0.0.1:8080/');
			socket.onmessage = function(event) {
				processEvent(JSON.parse(event.data));
			}
			socket.onopen = function() {
				socket.send(JSON.stringify({
					command: "play",
					start: "2016-01-01T00:00:00.000Z",
					end: "2016-01-01T00:00:30.000Z",
					loop: true,
					speed: SPEED
				}));
			}

		}});
}

requestAnimationFrame(animate);

function animate(time) {
    requestAnimationFrame(animate);
    TWEEN.update(time);
}
