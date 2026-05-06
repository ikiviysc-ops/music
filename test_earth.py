from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--use-gl=angle'])
    page = browser.new_page(viewport={"width": 390, "height": 844})
    
    all_msgs = []
    page.on("console", lambda msg: all_msgs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_msgs.append(f"[PAGE_ERROR] {err}"))
    
    page.goto('http://localhost:5174')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(10000)
    
    page.screenshot(path='/workspace/test_earth_visible.png')
    
    debug = page.evaluate('''() => {
        const r = {};
        if (window.app) {
            r.cameraPos = {
                x: window.app.camera.position.x.toFixed(2),
                y: window.app.camera.position.y.toFixed(2),
                z: window.app.camera.position.z.toFixed(2)
            };
            r.fov = window.app.camera.fov;
            r.sceneChildren = window.app.scene.children.length;
            r.earthGroup = !!window.app.earthGroup;
            
            if (window.app.earthGroup) {
                const ud = window.app.earthGroup.userData;
                r.earthVisible = ud.earth ? ud.earth.visible : false;
                r.earthPosition = {
                    x: window.app.earthGroup.position.x,
                    y: window.app.earthGroup.position.y,
                    z: window.app.earthGroup.position.z
                };
                r.atmosphereVisible = ud.atmosphere ? ud.atmosphere.visible : false;
                
                if (ud.earth) {
                    r.earthScale = {
                        x: ud.earth.scale.x,
                        y: ud.earth.scale.y,
                        z: ud.earth.scale.z
                    };
                    r.earthMaterial = ud.earth.material.type;
                    r.earthHasMap = !!ud.earth.material.map;
                    r.earthOpacity = ud.earth.material.opacity;
                }
            }
        }
        return r;
    }''')
    
    print(json.dumps(debug, indent=2))
    
    errors = [m for m in all_msgs if ('[error]' in m or '[PAGE_ERROR]' in m) and 'CORS' not in m and 'mchost.guru' not in m and 'net::' not in m]
    print(f"\nNon-CORS errors: {len(errors)}")
    for e in errors[:5]:
        print(f"  {e}")
    
    browser.close()
