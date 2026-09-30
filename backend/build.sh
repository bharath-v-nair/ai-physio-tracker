#!/usr/bin/env bash
# Build script for the Render server (Linux).
set -o errexit

pip install -r requirements.txt

# mediapipe installs the desktop build of OpenCV, which needs screen/graphics
# libraries (libGL) that cloud servers don't have. Swap it for the "headless"
# build: same features, no graphics libraries needed.
pip uninstall -y opencv-contrib-python
pip install opencv-contrib-python-headless==4.11.0.86
