#!/usr/bin/env python3
import time
import struct
import threading
from PIL import Image, ImageDraw

try:
    import numpy as np
    def write_fb(img):
        arr = np.array(img.convert('RGB'), dtype=np.uint16)
        r, g, b = arr[:,:,0]>>3, arr[:,:,1]>>2, arr[:,:,2]>>3
        with open(FB, 'wb') as f:
            f.write(((r<<11)|(g<<5)|b).astype('<u2').tobytes())
except ImportError:
    def write_fb(img):
        pixels = img.convert('RGB').tobytes()
        n = WIDTH * HEIGHT
        buf = bytearray(n * 2)
        for i in range(n):
            r, g, b = pixels[i*3], pixels[i*3+1], pixels[i*3+2]
            c = ((r>>3)<<11) | ((g>>2)<<5) | (b>>3)
            buf[i*2] = c & 0xFF
            buf[i*2+1] = c >> 8
        with open(FB, 'wb') as f:
            f.write(buf)

FB = '/dev/fb0'
TOUCH = '/dev/input/event5'
WIDTH, HEIGHT = 480, 320
X_MIN, X_MAX = 200, 3900
Y_MIN, Y_MAX = 200, 3900

def map_touch(raw_x, raw_y):
    x = int((raw_x - X_MIN) / (X_MAX - X_MIN) * WIDTH)
    y = int((raw_y - Y_MIN) / (Y_MAX - Y_MIN) * HEIGHT)
    return max(0, min(WIDTH-1, x)), max(0, min(HEIGHT-1, y))

def draw_clock():
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.text((120, 100), time.strftime('%H:%M:%S'), fill=(0, 255, 0))
    draw.text((80, 160), time.strftime('%A %d/%m/%Y'), fill=(255, 255, 255))
    draw.text((100, 230), "Toca para continuar", fill=(100, 100, 100))
    return img

def draw_menu():
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(0, 0, 20))
    draw = ImageDraw.Draw(img)
    draw.text((150, 30), "Hola Ale!", fill=(0, 200, 255))
    draw.rectangle([40, 100, 200, 160], fill=(0, 80, 160), outline=(0, 150, 255), width=2)
    draw.text((85, 120), "App 1", fill=(255, 255, 255))
    draw.rectangle([190, 100, 350, 160], fill=(0, 80, 160), outline=(0, 150, 255), width=2)
    draw.text((235, 120), "App 2", fill=(255, 255, 255))
    draw.rectangle([360, 100, 440, 160], fill=(0, 80, 160), outline=(0, 150, 255), width=2)
    draw.text((375, 120), "App 3", fill=(255, 255, 255))
    draw.text((130, 260), "Toca aqui para volver", fill=(80, 80, 80))
    draw.rectangle([100, 250, 380, 290], outline=(60, 60, 60), width=1)
    return img

def launch_app(app_name):
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.text((100, 140), f"Iniciando {app_name}...", fill=(0, 255, 100))
    write_fb(img)
    time.sleep(2)
    # import subprocess
    # subprocess.Popen(['python3', f'/home/aleia/{app_name}.py'])

# Grab the script start time once, before opening the touch device
SCRIPT_START = time.time()

def read_touch():
    """Yields one touch per physical finger press, with 2-second lockout to absorb bounce."""
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
            # Filter events that were buffered before this script started
            if tv_sec + tv_usec / 1_000_000 < SCRIPT_START:
                continue
            if ev_type == 3:
                if ev_code == 0:
                    raw_x = ev_value
                elif ev_code == 1:
                    raw_y = ev_value
            elif ev_type == 1 and ev_code == 330 and ev_value == 0:
                # BTN_TOUCH released — accept only if lockout has passed
                now = time.monotonic()
                if now - last_yield >= LOCKOUT and raw_x > 0:
                    last_yield = now
                    yield map_touch(raw_x, raw_y)

state = 'clock'

def main():
    global state
    touch_gen = read_touch()
    touch_event = threading.Event()
    touch_pos = [0, 0]

    def touch_reader():
        for x, y in touch_gen:
            touch_pos[0] = x
            touch_pos[1] = y
            touch_event.set()

    threading.Thread(target=touch_reader, daemon=True).start()

    while True:
        if state == 'clock':
            write_fb(draw_clock())
            if touch_event.wait(timeout=1):
                touch_event.clear()
                state = 'menu'

        elif state == 'menu':
            write_fb(draw_menu())
            if touch_event.wait(timeout=60):
                touch_event.clear()
                x, y = touch_pos
                if 40 <= x <= 200 and 100 <= y <= 160:
                    launch_app("App 1")
                    state = 'menu'
                elif 190 <= x <= 350 and 100 <= y <= 160:
                    launch_app("App 2")
                    state = 'menu'
                elif 360 <= x <= 440 and 100 <= y <= 160:
                    launch_app("App 3")
                    state = 'menu'
                elif 100 <= x <= 380 and 250 <= y <= 290:
                    state = 'clock'
            else:
                state = 'clock'

if __name__ == '__main__':
    main()
