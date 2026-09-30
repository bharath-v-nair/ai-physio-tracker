import json
import os
import re
import time


class LandmarkRecorder:
    """
    Saves the landmarks of each live session to a JSON Lines file, for tuning the
    exercise analysers on real movement. Only active when RECORD_LANDMARKS_DIR is set.
    """
    def __init__(self, label: str):
        folder = os.environ.get("RECORD_LANDMARKS_DIR")
        self.file = None
        if folder:
            os.makedirs(folder, exist_ok=True)
            safe_label = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
            path = os.path.join(folder, f"{time.strftime('%Y%m%d-%H%M%S')}_{safe_label}.jsonl")
            self.file = open(path, "a")

    def record(self, landmarks, result=None):
        if self.file and landmarks:
            self.file.write(json.dumps({"t": time.time(), "landmarks": landmarks, "result": result}) + "\n")
            self.file.flush()

    def close(self):
        if self.file:
            self.file.close()
            self.file = None
