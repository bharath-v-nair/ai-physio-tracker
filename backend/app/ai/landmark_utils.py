import math
from typing import Tuple

def calculate_angle(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
    """
    Calculate the angle between three points.
    Returns angle in degrees between 0 and 180.
    """
    ang = math.degrees(math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(a[1] - b[1], a[0] - b[0]))
    ang = abs(ang)
    if ang > 180:
        ang = 360 - ang
    return ang

def calculate_slope_angle(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """
    Calculate the angle of the line segment ab relative to the horizontal axis.
    Returns angle in degrees.
    """
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    return math.degrees(math.atan2(dy, dx))

def calculate_distance(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """
    Calculate euclidean distance between two points.
    """
    return math.sqrt((b[0] - a[0])**2 + (b[1] - a[1])**2)
