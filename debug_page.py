from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--use-gl=angle'])
    page = browser.new_page(viewport={"width": 390, "height": 844})
    
    all_msgs = []
    page.on("console", lambda msg: all_msgs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_msgs.append(f"[PAGE_ERROR] {err}"))
    
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(8000)
    
    page.screenshot(path='/workspace/debug_screenshot.png')
    
    debug = page.evaluate('''() => {
        const result = {};
        
        // 1. Check canvas
        const canvas = document.querySelector("#canvas-container canvas");
        result.canvasExists = !!canvas;
        if (canvas) {
            result.canvasSize = { w: canvas.width, h: canvas.height };
            const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
            result.glExists = !!gl;
            if (gl) {
                // Check if earth renders anything
                const d = new Uint8Array(4);
                // Sample multiple points
                const samples = {};
                const points = [[195, 400], [195, 300], [195, 500], [100, 400], [300, 400]];
                for (const [x, y] of points) {
                    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, d);
                    samples[`${x},${y}`] = Array.from(d);
                }
                result.pixelSamples = samples;
                result.renderer = gl.getParameter(gl.RENDERER);
                result.glError = gl.getError();
            }
        }
        
        // 2. Check app state
        if (window.app) {
            result.appExists = true;
            result.sceneChildren = window.app.scene.children.length;
            result.earthGroup = !!window.app.earthGroup;
            result.beams = !!window.app.beams;
            result.particleData = !!window.app.particleData;
            result.arcData = !!window.app.arcData;
            
            // Check earth group children
            if (window.app.earthGroup) {
                result.earthGroupChildren = window.app.earthGroup.children.length;
                const earthMesh = window.app.earthGroup.userData.earth;
                if (earthMesh) {
                    result.earthMeshVisible = earthMesh.visible;
                    result.earthMeshMaterial = !!earthMesh.material;
                    if (earthMesh.material && earthMesh.material.uniforms) {
                        result.uMode = earthMesh.material.uniforms.uMode.value;
                        result.uNightTexture = !!earthMesh.material.uniforms.uNightTexture.value;
                        result.uDayTexture = !!earthMesh.material.uniforms.uDayTexture.value;
                        result.uEmissiveIntensity = earthMesh.material.uniforms.uEmissiveIntensity.value;
                    }
                }
            }
            
            // Check camera
            result.cameraPos = window.app.camera ? {
                x: window.app.camera.position.x.toFixed(2),
                y: window.app.camera.position.y.toFixed(2),
                z: window.app.camera.position.z.toFixed(2)
            } : null;
        } else {
            result.appExists = false;
        }
        
        // 3. Check nav
        const navContainer = document.getElementById('gooeyNav');
        result.navExists = !!navContainer;
        if (navContainer) {
            const lis = navContainer.querySelectorAll('li');
            result.navItemCount = lis.length;
            result.navItems = [];
            lis.forEach((li, i) => {
                const a = li.querySelector('a');
                result.navItems.push({
                    index: i,
                    active: li.classList.contains('active'),
                    text: a ? a.textContent.trim() : '',
                    rect: li.getBoundingClientRect()
                });
            });
            
            const filter = document.getElementById('gooeyFilter');
            if (filter) {
                const filterRect = filter.getBoundingClientRect();
                const filterStyle = getComputedStyle(filter);
                result.filterRect = filterRect;
                result.filterPointerEvents = filterStyle.pointerEvents;
                result.filterZIndex = filterStyle.zIndex;
                
                const beforeStyle = getComputedStyle(filter, '::before');
                result.filterBeforeBg = beforeStyle.background;
                result.filterBeforeInset = beforeStyle.inset;
            }
        }
        
        return result;
    }''')
    
    print(json.dumps(debug, indent=2, default=str))
    
    print("\n\n=== ALL CONSOLE MESSAGES ===")
    for msg in all_msgs:
        print(msg)
    
    browser.close()
