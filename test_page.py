from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    
    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: console_logs.append(f"[ERROR] {err}"))
    
    page.goto('http://localhost:3002/', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=15000)
    time.sleep(3)
    
    page.screenshot(path='/workspace/test_screenshot.png', full_page=True)
    
    print("=== Console Logs ===")
    for log in console_logs[-30:]:
        print(log)
    
    print("\n=== Audio Element ===")
    audio_info = page.evaluate("""() => {
        const audio = document.getElementById('musicPlayer');
        if (!audio) return 'Audio element NOT found';
        return {
            src: audio.currentSrc || 'no src',
            readyState: audio.readyState,
            paused: audio.paused,
            duration: audio.duration,
            error: audio.error ? audio.error.message : 'none',
            sourceCount: audio.querySelectorAll('source').length,
            sourceSrcs: Array.from(audio.querySelectorAll('source')).map(s => s.src)
        };
    }""")
    print(audio_info)
    
    print("\n=== Canvas Element ===")
    canvas_info = page.evaluate("""() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return 'Canvas NOT found';
        return { width: canvas.width, height: canvas.height };
    }""")
    print(canvas_info)
    
    print("\n=== Earth Group ===")
    earth_info = page.evaluate("""() => {
        if (!window.app || !window.app.earthGroup) return 'Earth group NOT found';
        return { children: window.app.earthGroup.children.length, visible: window.app.earthGroup.visible };
    }""")
    print(earth_info)
    
    print("\n=== Beam Group ===")
    beam_info = page.evaluate("""() => {
        if (!window.app || !window.app.beamGroup) return 'Beam group NOT found';
        return { children: window.app.beamGroup.children.length, visible: window.app.beamGroup.visible };
    }""")
    print(beam_info)
    
    browser.close()
