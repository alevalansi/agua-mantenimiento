#!/usr/bin/env python3
import time
import struct
import threading
from PIL import Image, ImageDraw

FB = '/dev/fb0'
TOUCH = '/dev/input/event5'
WIDTH, HEIGHT = 480, 320

# Each button is a full horizontal strip
BTN_H = HEIGHT // 3  # 106 px tall each

BUTTONS = [
    {'label': 'App 1', 'y0': 0,          'y1': BTN_H,       'color': (0, 80, 160),  'text': (255, 255, 255)},
    {'label': 'App 2', 'y0': BTN_H,      'y1': BTN_H * 2,   'color': (0, 120, 80),  'text': (255, 255, 255)},
    {'label': 'App 3', 'y0': BTN_H * 2,  'y1': HEIGHT,      'color': (100, 0, 140), 'text': (255, 255, 255)},
]

def write_fb(img):
    pixels = img.convert('RGB')
    with open(FB, 'wb') as f:
        for y in range(HEIGHT):
            for x in range(WIDTH):
                r, g, b = pixels.getpixel((x, y))
                color = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)
                f.write(struct.pack('H', color))

def draw_menu(active=None):
    img = Image.new('RGB', (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    for i, btn in enumerate(BUTTONS):
        bg = tuple(min(255, c + 40) for c in btn['color']) if active == i else btn['color']
        draw.rectangle([0, btn['y0'], WIDTH - 1, btn['y1'] - 1], fill=bg)
        # Divider line
        if btn['y0'] > 0:
            draw.line([(0, btn['y0']), (WIDTH - 1, btn['y0'])], fill=(0, 0, 0), width=3)
        # Label centered
        tx, ty = 200, btn['y0'] + BTN_H // 2 - 8
        draw.text((tx, ty), btn['label'], fill=btn['text'])
    return img

def launch_app(i):
    img = Image.new('RGB', (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.text((120, 140), f"Iniciando {BUTTONS[i]['label']}...", fill=(0, 255, 100))
    write_fb(img)
    time.sleep(2)
    # import subprocess
    # subprocess.Popen(['python3', f'/home/aleia/app{i+1}.py'])

SCRIPT_START = time.time()

def read_touch():
    EVENT_SIZE = 24
    raw_x, raw_y = 0, 0
    last_yield = 0.0
    LOCKOUT = 2.0
    with open(TOUCH, 'rb') as f:
        while True:
            data = f.read(EVENT_SIZE)
            if len(data) < EVENT_SIZE:
                continue
            tv_sec, tv_usec, ev_type, ev_code, ev_value = struct.unpack('llHHI', data)
            if ev_type == 3:
                if ev_code == 0:
                    raw_x = ev_value
                elif ev_code == 1:
                    raw_y = ev_value
            elif ev_type == 1 and ev_code == 330 and ev_value == 0:
                event_time = tv_sec + tv_usec / 1_000_000
                if event_time < SCRIPT_START:
                    continue
                now = time.monotonic()
                if now - last_yield >= LOCKOUT and raw_x > 0:
                    last_yield = now
                    # Map raw_y to a button index (0, 1 or 2)
                    y_pct = (raw_y - 200) / (2200 - 200)
                    btn = int(y_pct * 3)
                    btn = max(0, min(2, btn))
                    yield btn

def main():
    touch_gen = read_touch()
    touch_event = threading.Event()
    touch_btn = [0]

    def touch_reader():
        for btn in touch_gen:
            touch_btn[0] = btn
            touch_event.set()

    threading.Thread(target=touch_reader, daemon=True).start()

    write_fb(draw_menu())

    while True:
        if touch_event.wait(timeout=0.1):
            touch_event.clear()
            i = touch_btn[0]
            write_fb(draw_menu(active=i))
            launch_app(i)
            write_fb(draw_menu())

if __name__ == '__main__':
    main()
