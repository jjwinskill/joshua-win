# Turns a phone's HEIC into a JPEG that's safe for this public repo: browsers and agents can read it,
# and it carries none of the phone's metadata (model, time, place).
#   python convert-photo.py IN.HEIC ../photos/NAME.jpg
# macOS only, for sips. Re-encoding through OpenCV is what drops the metadata: sips alone keeps it.
import subprocess, sys, tempfile, os
import cv2

source, target = sys.argv[1], sys.argv[2]
with tempfile.TemporaryDirectory() as folder:
    middle = os.path.join(folder, "middle.jpg")
    subprocess.run(["sips", "-s", "format", "jpeg", source, "--out", middle], check=True, capture_output=True)
    # imread applies the photo's rotation, so it comes out the right way up.
    image = cv2.imread(middle)
cv2.imwrite(target, image, [cv2.IMWRITE_JPEG_QUALITY, 85, cv2.IMWRITE_JPEG_OPTIMIZE, 1])

data = open(target, "rb").read()
for marker in (b"Exif", b"xpacket", b"Apple", b"iPhone", b"GPS"):
    if marker in data:
        os.remove(target)
        sys.exit(f"{marker!r} is still in the file, so it was deleted")
print(f"{target}: {image.shape[1]}x{image.shape[0]}, {len(data) // 1024} KB, no metadata")
