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
    
    page.screenshot(path='/workspace/debug2.png')
    
    debug = page.evaluate('''() => {
        const result = {};
        if (window.app) {
            result.cameraPos = {
                x: window.app.camera.position.x.toFixed(2),
                y: window.app.camera.position.y.toFixed(2),
                z: window.app.camera.position.z.toFixed(2)
            };
            result.cameraFov = window.app.camera.fov;
            result.earthGroup = !!window.app.earthGroup;
            result.particleData = !!window.app.particleData;
            result.arcData = !!window.app.arcData;
            if (window.app.earthGroup && window.app.earthGroup.userData.earth) {
                const earth = window.app.earthGroup.userData.earth;
                result.earthVisible = earth.visible;
                result.uMode = earth.material.uniforms.uMode.value;
                result.uNightTexture = !!earth.material.uniforms.uNightTexture.value;
            }
        }
        
        const filter = document.getElementById('gooeyFilter');
        if (filter) {
            const s = getComputedStyle(filter);
            result.filterMixBlend = s.mixBlendMode;
            result.filterPointerEvents = s.pointerEvents;
        }
        
        return result;
    }''')
    
    print(json.dumps(debug, indent=2))
    
    nav_test = page.evaluate('''() => {
        const lis = document.querySelectorAll('.gooey-nav-container li');
        const results = [];
        lis.forEach((li, i) => {
            results.push({ index: i, active: li.classList.contains('active') });
        });
        
        const secondLink = lis[1] ? lis[1].querySelector('a') : null;
        if (secondLink) {
            secondLink.click();
        }
        
        const afterClick = [];
        lis.forEach((li, i) => {
            afterClick.push({ index: i, active: li.classList.contains('active') });
        });
        
        return { before: results, after: afterClick };
    }''')
    print("\nNav test:")
    print(json.dumps(nav_test, indent=2))
    
    errors = [m for m in all_msgs if '[error]' in m or '[PAGE_ERROR]' in m]
    non_cors = [e for e in errors if 'CORS' not in e and 'ERR_FAILED' not in e and 'mchost.guru' not in e and 'net::' not in e]
    print(f"\nNon-CORS errors: {len(non_cors)}")
    for e in non_cors[:5]:
        print(f"  {e}")
    
    browser.close()
