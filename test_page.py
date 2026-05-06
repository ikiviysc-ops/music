from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--use-gl=angle'])
    page = browser.new_page(viewport={"width": 390, "height": 844})
    
    console_msgs = []
    page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: console_msgs.append(f"[PAGE_ERROR] {err}"))
    
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(5000)
    
    page.screenshot(path='/workspace/test_final2.png')
    
    result = page.evaluate('''() => {
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return { error: "no canvas" };
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!gl) return { error: "no webgl context" };
        const d = new Uint8Array(4);
        gl.readPixels(195, 400, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, d);
        return {
            canvasSize: { w: canvas.width, h: canvas.height },
            centerPixel: Array.from(d),
            sceneChildren: window.app ? window.app.scene.children.length : -1,
            hasEarth: window.app && window.app.earthGroup ? true : false,
            hasParticles: window.app && window.app.particleData ? true : false,
            hasArcs: window.app && window.app.arcData ? true : false,
        };
    }''')
    print(f"WebGL result: {result}")
    
    nav_lis = page.query_selector_all('.gooey-nav-container li')
    print(f"\nNav items: {len(nav_lis)}")
    for i, li in enumerate(nav_lis):
        is_active = li.evaluate('el => el.classList.contains("active")')
        print(f"  li[{i}] active: {is_active}")
    
    second_li = nav_lis[1] if len(nav_lis) > 1 else None
    if second_li:
        link = second_li.query_selector('a')
        if link:
            print("\nClicking second nav item...")
            link.click(force=True)
            page.wait_for_timeout(500)
            
            for i, li in enumerate(nav_lis):
                is_active = li.evaluate('el => el.classList.contains("active")')
                print(f"  li[{i}] active: {is_active}")
    
    errors = [m for m in console_msgs if '[error]' in m or '[PAGE_ERROR]' in m]
    non_cors = [e for e in errors if 'CORS' not in e and 'ERR_FAILED' not in e and 'mchost.guru' not in e and 'net::' not in e]
    print(f"\nNon-CORS errors ({len(non_cors)}):")
    for e in non_cors[:10]:
        print(f"  {e}")
    
    browser.close()
