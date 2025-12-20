function log(msg, isError = false) { if(isError) console.error(msg); else console.log(msg); }

        let scene, camera, renderer, composer, controls, clock;
        let bolonGroup, confettiSystem, flagSystem;
        let mode = 'LOADING'; 
        
        // --- variables pa el baile ---
        let danceTimer = 0;
        let currentMove = 0; // ahora tenemos mas movimientos 
        // ---------------------------------

        const speech = "Hola me llamo el señor Bolon y sé que soy una de tus comidas favoritas y este regalo es para que nunca te olvides de mi, ya que soy una de las cosas más conmemorables del Ecuador, aparte de ser delicioso te lleno de mucha vitalidad.  El Sr bolon te quiere mucho. Habiendo dicho todo esto, disfruta de este espectáculo.";

        init();

        function init() {
            try {
                log("Creando escena...");
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0x050510);
                clock = new THREE.Clock();

                camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
                camera.position.set(0, 3, 12);

                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.outputEncoding = THREE.sRGBEncoding;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.0;
                document.body.appendChild(renderer.domElement);

                controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;

                const ambient = new THREE.AmbientLight(0xffffff, 0.7);
                scene.add(ambient);
                const spot = new THREE.SpotLight(0xffffff, 1.2);
                spot.position.set(5, 10, 5);
                scene.add(spot);

                try {
                    const renderPass = new THREE.RenderPass(scene, camera);
                    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
                    bloomPass.strength = 0.35; bloomPass.threshold = 0.8; bloomPass.radius = 0.4;
                    composer = new THREE.EffectComposer(renderer);
                    composer.addPass(renderPass);
                    composer.addPass(bloomPass);
                } catch(e) { composer = null; }

                loadModel();

            } catch (e) { log(e.message, true); }
        }

        function loadModel() {
            const loader = new THREE.GLTFLoader();
            bolonGroup = new THREE.Group();
            scene.add(bolonGroup);

            loader.load('bolon.glb', 
                (gltf) => {
                    const model = gltf.scene;
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3()).y;
                    const scale = 3.5 / size;
                    model.scale.set(scale, scale, scale);
                    const center = new THREE.Vector3(); box.getCenter(center);
                    model.position.sub(center.multiplyScalar(scale));
                    model.position.y += (size * scale) / 2;
                    model.traverse(c => { 
                        if(c.isMesh) { c.castShadow = true; if(c.material) c.material.envMapIntensity = 0.4; }
                    });
                    bolonGroup.add(model);
                    readyToStart();
                },
                (xhr) => {
                    const percent = Math.round(xhr.loaded/xhr.total * 100);
                    const statusEl = document.getElementById('status-text');
                    if(statusEl) statusEl.innerText = `Descargando Sr. Bolón... ${percent}%`;
                },
                (error) => {
                    createFallbackBolon();
                    readyToStart();
                }
            );
        }

        function createFallbackBolon() {
            const geo = new THREE.DodecahedronGeometry(1.5);
            const mat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 1.5;
            bolonGroup.add(mesh);
        }

        function readyToStart() {
            createConfetti();
            createFlags();
            document.getElementById('status-text').innerText = "Todo listo para la fiesta.";
            
            const btn = document.getElementById('start-btn');
            const btnLoader = document.getElementById('btn-loader');
            const btnText = document.getElementById('btn-text');
            
            btn.disabled = false;
            btnLoader.style.display = 'none';
            btnText.innerText = "ABRIR REGALO 🎁";
            
            window.addEventListener('resize', onResize);
            animate();
        }

        function startExperience() {
            const overlay = document.getElementById('overlay');
            overlay.style.opacity = 0;
            overlay.style.transform = "scale(1.2)";
            setTimeout(() => overlay.style.display = 'none', 1000);
            
            mode = 'TALKING';
            document.getElementById('dialogue-box').style.display = 'block';
            typeWriter(speech, 0);
        }

        function typeWriter(text, i) {
            if (i < text.length) {
                document.getElementById('type-text').innerHTML += text.charAt(i);
                setTimeout(() => typeWriter(text, i+1), 75); 
            } else {
                setTimeout(startParty, 2000);
            }
        }

        function startParty() {
            mode = 'PARTY';
            document.getElementById('dialogue-box').style.display = 'none';
            document.getElementById('party-ui').style.display = 'block';
            
            const audio = document.getElementById('bg-music');
            audio.volume = 1.0; audio.play();

            try {
                const video = document.getElementById('bg-video');
                video.play().then(() => {
                    const texture = new THREE.VideoTexture(video);
                    texture.encoding = THREE.sRGBEncoding;
                    scene.background = texture;
                }).catch(e => {
                    scene.background = new THREE.Color(0x111122);
                });
            } catch(e) { }

            confettiSystem.material.opacity = 1;
            flagSystem.material.opacity = 1;
        }

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();
            controls.update();

            if (!bolonGroup) return;

            if (mode === 'TALKING') {
                bolonGroup.rotation.y = Math.sin(time) * 0.2;
                bolonGroup.position.y = Math.sin(time * 3) * 0.05;
                bolonGroup.scale.set(1, 1, 1);
            } 
            else if (mode === 'PARTY') {
                // definimos dos ritmos uno rapido y otro lento pa los saltos
                const fastBeat = time * 15; 
                const slowBeat = time * 6; // ritmo mas lento y pesado

                // logica del coreografo (cambia de paso cada 3.5 seg)
                danceTimer += delta;
                if(danceTimer > 3.5) {
                    danceTimer = 0;
                    currentMove = Math.floor(Math.random() * 6); // ahora son 6 movimientos (del 0 al 5)
                    
                    // reseteo posiciones suaves al cambiar
                    bolonGroup.rotation.set(0,0,0);
                    bolonGroup.position.set(0,0,0);
                    bolonGroup.scale.set(1,1,1);
                }

                // --- switch de pasos de baile mejorado ---
                switch(currentMove) {
                    case 0: // salto lento y pesado (squash & stretch)
                        // usamos slowBeat para q no sea tan rapido
                        bolonGroup.position.y = Math.abs(Math.sin(slowBeat)) * 2; 
                        
                        // calculo el aplastamiento basado en el ritmo lento
                        const squashV2 = Math.max(0, Math.cos(slowBeat)); 
                        // se estira al subir y se aplasta al bajar
                        bolonGroup.scale.y = 1 + (squashV2 * 0.3) - 0.1;
                        bolonGroup.scale.x = 1 - (squashV2 * 0.1);
                        bolonGroup.scale.z = 1 - (squashV2 * 0.1);
                        break;

                    case 1: // el tornado (giro rapido con leve mov vertical)
                        bolonGroup.position.y = 1 + Math.sin(slowBeat)*0.3; 
                        bolonGroup.rotation.y -= 0.2; 
                        bolonGroup.rotation.z = Math.sin(time * 4) * 0.15;
                        bolonGroup.scale.set(1,1,1);
                        break;

                    case 2: // el tembleque (vibracion energetica)
                        bolonGroup.position.y = 0.8 + Math.sin(fastBeat)*0.1; // vibra arriba y abajo
                        bolonGroup.position.x = (Math.random() - 0.5) * 0.2;
                        bolonGroup.rotation.z = (Math.random() - 0.5) * 0.1;
                        const pulse = 1 + Math.sin(fastBeat * 2) * 0.05;
                        bolonGroup.scale.set(pulse, pulse, pulse);
                        break;

                    case 3: // pendulo (de lado a lado mas amplio)
                        bolonGroup.position.x = Math.sin(slowBeat) * 2.5; 
                        bolonGroup.position.y = Math.abs(Math.cos(slowBeat)) * 1.2; 
                        bolonGroup.rotation.z = -Math.sin(slowBeat) * 0.6; 
                        bolonGroup.rotation.y = Math.sin(time) * 0.3; 
                        bolonGroup.scale.set(1,1,1);
                        break;
                    
                    case 4: // (nuevo) la orbita hula-hoop
                        bolonGroup.position.x = Math.sin(time * 3) * 2; // circulo en x
                        bolonGroup.position.z = Math.cos(time * 3) * 2; // circulo en z
                        bolonGroup.position.y = 1 + Math.sin(fastBeat) * 0.2; // pequeno rebote mientras orbita
                        bolonGroup.rotation.y = -time * 3; // mira hacia donde va
                        bolonGroup.scale.set(1,1,1);
                        break;

                    case 5: // (nuevo) mortal hacia atras (backflip lento)
                        bolonGroup.position.y = 1.5 + Math.sin(slowBeat)*1; // flota y baja
                        bolonGroup.rotation.x = -time * 3; // giro constante hacia atras
                        bolonGroup.scale.set(1,1,1);
                        break;
                }

                updateParticles();
            }

            if(composer) composer.render();
            else renderer.render(scene, camera);
        }

        function createConfetti() {
            const cnt = 800; const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(cnt*3); const col = new Float32Array(cnt*3);
            const colors = [[1,0.8,0], [0,0.2,0.6], [0.8,0,0]];
            for(let i=0; i<cnt; i++) {
                pos[i*3] = (Math.random()-0.5)*30; 
                pos[i*3+1] = Math.random()*20+10; 
                pos[i*3+2] = (Math.random()-0.5)*30;
                const c = colors[Math.floor(Math.random()*3)]; col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            const mat = new THREE.PointsMaterial({size:0.2, vertexColors:true, transparent:true, opacity:0});
            confettiSystem = new THREE.Points(geo, mat);
            scene.add(confettiSystem);
        }

        function createFlags() {
            const cvs = document.createElement('canvas'); cvs.width=64; cvs.height=64;
            const ctx = cvs.getContext('2d'); ctx.font='50px serif'; 
            ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🇪🇨', 32,32);
            const tex = new THREE.CanvasTexture(cvs);
            const geo = new THREE.PlaneGeometry(1,1);
            const mat = new THREE.MeshBasicMaterial({map:tex, transparent:true, opacity:0, side:THREE.DoubleSide});
            flagSystem = new THREE.InstancedMesh(geo, mat, 150);
            const dummy = new THREE.Object3D();
            for(let i=0; i<150; i++) {
                dummy.position.set((Math.random()-0.5)*20, Math.random()*20+10, (Math.random()-0.5)*20);
                dummy.updateMatrix(); flagSystem.setMatrixAt(i, dummy.matrix);
                flagSystem.userData[i] = Math.random()*0.05 + 0.05;
            }
            scene.add(flagSystem);
        }

        function updateParticles() {
            const pos = confettiSystem.geometry.attributes.position.array;
            for(let i=0; i<pos.length/3; i++) {
                pos[i*3+1] -= 0.1; if(pos[i*3+1] < -5) pos[i*3+1] = 20;
            }
            confettiSystem.geometry.attributes.position.needsUpdate = true;
            const dummy = new THREE.Object3D();
            for(let i=0; i<150; i++) {
                flagSystem.getMatrixAt(i, dummy.matrix);
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                dummy.position.y -= flagSystem.userData[i]; dummy.rotation.x += 0.05;
                if(dummy.position.y < -5) dummy.position.y = 20;
                dummy.updateMatrix(); flagSystem.setMatrixAt(i, dummy.matrix);
            }
            flagSystem.instanceMatrix.needsUpdate = true;
        }

        function onResize() {
            camera.aspect = window.innerWidth/window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            if(composer) composer.setSize(window.innerWidth, window.innerHeight);
        }