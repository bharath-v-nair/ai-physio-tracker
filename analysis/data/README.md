# Data: MultiPosture

`data.csv` is not stored in the repository. Download it with:

```bash
python analysis/download_data.py
```

The script downloads the file from Zenodo and checks its MD5 checksum (`7efbc94d653acf32eefecec3ff26d6c6`, 9,327,935 bytes).

| | |
|---|---|
| Name | MultiPosture: A dataset of body joints keypoints extracted using MediaPipe for multi-task sitting posture recognition with upper and lower body labels |
| Source | Zenodo, https://doi.org/10.5281/zenodo.14230872 |
| Licence | Creative Commons Attribution 4.0 (CC BY 4.0) |
| Size | 4,794 frames, 13 participants, 102 columns |
| Columns | `subject`, `upperbody_label`, `lowerbody_label`, then `x, y, z` for all 33 MediaPipe Pose landmarks (`nose_x` ... `right_foot_index_z`) |
| Coordinates | MediaPipe world landmarks: metres, origin at the hip midpoint; +x = person's left, +y = down, -z = towards the camera |
| Upper-body labels | TUP upright, TLF leaning forward, TLB leaning backward, TLL leaning left, TLR leaning right |
| Lower-body labels | LAP, LWA, LCS, LCR, LCL, LLR, LLL (not used in this analysis) |

Note: the Zenodo description mentions 11 joints and 4,800 frames; the actual file has all 33 landmarks and 4,794 frames.

## Citation

Carneros-Prado, D., Cabañero-Gómez, L., Fontecha, J., Hervás, R., González-Díaz, I., & Johnson, E. (2024).
*MultiPosture: A dataset of body joints keypoints extracted using MediaPipe for multi-task sitting posture recognition
with upper and lower body labels* [Data set]. Zenodo. https://doi.org/10.5281/zenodo.14230872

Paper describing the dataset:
Carneros-Prado, D., Cabañero-Gómez, L., Johnson, E., González, I., Fontecha, J., & Hervás, R. (2024). A comparison
between multilayer perceptrons and Kolmogorov-Arnold networks for multi-task classification in sitting posture
recognition. *IEEE Access, 12*, 180198-180209. https://doi.org/10.1109/ACCESS.2024.3510034
