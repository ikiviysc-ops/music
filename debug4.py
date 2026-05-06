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
    
    page.screenshot(path='/workspace/debug4.png')
    
    debug = page.evaluate('''() => {
        const r = {};
        if (window.app) {
            r.cameraZ = window.app.camera.position.z.toFixed(2);
            r.earthGroup = !!window.app.earthGroup;
            r.earthGroupChildren = window.app.earthGroup ? window.app.earthGroup.children.length : 0;
            
            if (window.app.earthGroup) {
                const ud = window.app.earthGroup.userData;
                r.earthVisible = ud.earth ? ud.earth.visible : false;
                r.earthMaterialType = ud.earth ? ud.earth.material.type : 'none';
                r.earthHasMap = ud.earth && ud.earth.material.map ? true : false;
                r.dayMeshVisible = ud.dayMesh ? ud.dayMesh.visible : false;
            }
        }
        
        // Nav test
        const lis = document.querySelectorAll('.gooey-nav-container li');
        r.navCount = lis.length;
        if (lis.length > 1) {
            const link = lis[1].querySelector('a');
            if (link) link.click();
            r.navAfterClick = [lis[0].classList.contains('active'), lis[1].classList.contains('active')];
        }
        
        return r;
    }''')
    
    print(json.dumps(debug, indent=2))
    
    errors = [m for m in all_msgs if ('[error]' in m or '[PAGE_ERROR]' in m) and 'CORS' not in m and 'mchost.guru' not in m and 'net::' not in m]
    print(f"\nNon-CORS errors: {len(errors)}")
    for e in errors[:5]:
        print(f"  {e}")
    
    browser.close()
