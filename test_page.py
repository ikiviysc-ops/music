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
    
    page.screenshot(path='/workspace/test_final.png')
    
    result = page.evaluate('''() => {
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return { error: "no canvas" };
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!gl) return { error: "no webgl context" };
        const d = new Uint8Array(4);
        gl.readPixels(195, 400, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, d);
        const d2 = new Uint8Array(4);
        gl.readPixels(195, 700, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, d2);
        return {
            canvasSize: { w: canvas.width, h: canvas.height },
            centerPixel: Array.from(d),
            bottomPixel: Array.from(d2),
            rendererInfo: gl.getParameter(gl.RENDERER),
            sceneChildren: window.app ? window.app.scene.children.length : -1
        };
    }''')
    print(f"WebGL result: {result}")
    
    all_errors = [m for m in console_msgs if '[error]' in m or '[PAGE_ERROR]' in m]
    non_cors = [e for e in all_errors if 'CORS' not in e and 'ERR_FAILED' not in e and 'mchost.guru' not in e]
    print(f"\nNon-CORS errors ({len(non_cors)}):")
    for e in non_cors[:10]:
        print(f"  {e}")
    
    all_logs = [m for m in console_msgs if '[log]' in m]
    print(f"\nAll logs ({len(all_logs)}):")
    for l in all_logs[:15]:
        print(f"  {l}")
    
    browser.close()
