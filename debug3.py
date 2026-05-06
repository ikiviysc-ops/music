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
    
    page.screenshot(path='/workspace/debug3.png')
    
    debug = page.evaluate('''() => {
        const r = {};
        if (window.app) {
            r.cameraZ = window.app.camera.position.z.toFixed(2);
            r.earthGroup = !!window.app.earthGroup;
            r.particleData = !!window.app.particleData;
            r.arcData = !!window.app.arcData;
            if (window.app.earthGroup) {
                const earth = window.app.earthGroup.userData.earth;
                if (earth && earth.material && earth.material.uniforms) {
                    r.uHasNightTexture = earth.material.uniforms.uHasNightTexture.value;
                    r.uHasDayTexture = earth.material.uniforms.uHasDayTexture.value;
                    r.uMode = earth.material.uniforms.uMode.value;
                    r.programOk = earth.material.program !== null;
                }
            }
        }
        
        // Nav test
        const lis = document.querySelectorAll('.gooey-nav-container li');
        r.navCount = lis.length;
        r.navBefore = [lis[0].classList.contains('active'), lis[1].classList.contains('active')];
        
        const link = lis[1] ? lis[1].querySelector('a') : null;
        if (link) link.click();
        r.navAfter = [lis[0].classList.contains('active'), lis[1].classList.contains('active')];
        
        return r;
    }''')
    
    print(json.dumps(debug, indent=2))
    
    errors = [m for m in all_msgs if ('[error]' in m or '[PAGE_ERROR]' in m) and 'CORS' not in m and 'mchost.guru' not in m and 'net::' not in m]
    print(f"\nNon-CORS errors: {len(errors)}")
    for e in errors[:5]:
        print(f"  {e}")
    
    browser.close()
