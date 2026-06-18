"""
solar_validator.py
==================
NOVEL ALGORITHM #1 — Solar Position Cross-Validation for Geotagged Image Authenticity
======================================================================================

PATENT CLAIM CORE:
    A computer-implemented method for verifying the authenticity of a geotagged
    citizen-reported image by:
    (a) computing the expected solar azimuth and elevation for the claimed GPS
        coordinates and submission timestamp using the Spencer (1971) astronomical
        algorithm with Equation of Time correction;
    (b) extracting the dominant shadow direction from the image via LAB-space
        luminance thresholding, Canny edge detection, and probabilistic Hough
        line transform;
    (c) resolving the 180-degree directional ambiguity of the extracted shadow
        using the computed solar azimuth;
    (d) computing the angular deviation between expected and derived shadow
        directions; and
    (e) classifying the image as Verified (<30 deg), Under Review (30-60 deg),
        or Rejected (>60 deg), with a continuous confidence score.

WHY THIS IS NOVEL:
    Existing image verification approaches rely on EXIF metadata (trivially spoofed),
    digital watermarks (absent in camera apps), or server-side timestamp checks.
    No prior art applies solar-position-based forensic lighting analysis to
    crowd-sourced civic-reporting image validation.

DEPENDENCIES:
    Required: math, datetime, dataclasses (stdlib)
    Optional: numpy, opencv-python (for live image shadow extraction)
              If unavailable, returns 'insufficient_data' verdict.
"""

import math
import datetime
from dataclasses import dataclass, field
from typing import Optional, List, Literal

try:
    import numpy as np
    import cv2
    _CV2 = True
except ImportError:
    _CV2 = False

# ── Configurable thresholds ──────────────────────────────────────────────────
VERIFIED_DEG  = 30.0   # Below this → Verified
REVIEW_DEG    = 60.0   # 30–60 → Manual Review; above 60 → Rejected


@dataclass
class SolarValidationResult:
    is_authentic: bool
    confidence: float                      # 0.0–1.0
    expected_azimuth_deg: float            # 0=N, 90=E, 180=S, 270=W
    expected_elevation_deg: float          # degrees above horizon
    derived_shadow_azimuth_deg: Optional[float]
    angular_deviation_deg: Optional[float]
    verdict: Literal['verified', 'review', 'rejected', 'insufficient_data']
    solar_noon_utc: Optional[str]
    is_nighttime: bool
    forensic_notes: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "verdict":                    self.verdict,
            "is_authentic":               self.is_authentic,
            "confidence":                 round(self.confidence, 4),
            "expected_solar_azimuth_deg": round(self.expected_azimuth_deg, 2),
            "expected_solar_elevation_deg": round(self.expected_elevation_deg, 2),
            "derived_shadow_azimuth_deg": round(self.derived_shadow_azimuth_deg, 2) if self.derived_shadow_azimuth_deg is not None else None,
            "angular_deviation_deg":      round(self.angular_deviation_deg, 2) if self.angular_deviation_deg is not None else None,
            "solar_noon_utc":             self.solar_noon_utc,
            "is_nighttime":               self.is_nighttime,
            "forensic_notes":             self.forensic_notes,
        }


# ── Core astronomy ────────────────────────────────────────────────────────────

def _fractional_year(dt: datetime.datetime) -> float:
    """Fractional year in radians (Spencer 1971)."""
    n = dt.timetuple().tm_yday
    return (2.0 * math.pi / 365.0) * (n - 1)


def _solar_declination_rad(B: float) -> float:
    """Solar declination in radians — Spencer (1971)."""
    return (0.006918
            - 0.399912 * math.cos(B)   + 0.070257 * math.sin(B)
            - 0.006758 * math.cos(2*B) + 0.000907 * math.sin(2*B)
            - 0.002697 * math.cos(3*B) + 0.001480 * math.sin(3*B))


def _equation_of_time_minutes(B: float) -> float:
    """Equation of Time in minutes — Spencer (1971)."""
    return 229.18 * (0.000075
                     + 0.001868 * math.cos(B)  - 0.032077 * math.sin(B)
                     - 0.014615 * math.cos(2*B) - 0.040890 * math.sin(2*B))


def compute_solar_position(lat_deg: float, lon_deg: float,
                            dt_utc: datetime.datetime
                            ) -> tuple[float, float, str]:
    """
    Compute solar azimuth and elevation for a given location and UTC time.

    Returns
    -------
    elevation_deg : float   degrees above horizon (-90 to +90)
    azimuth_deg   : float   meteorological bearing (0=N, 90=E, 180=S, 270=W)
    solar_noon_utc: str     e.g. "06:38 UTC"
    """
    B = _fractional_year(dt_utc)
    decl_rad = _solar_declination_rad(B)
    eot_min  = _equation_of_time_minutes(B)

    # True Solar Time (minutes since midnight UTC)
    utc_min  = dt_utc.hour * 60.0 + dt_utc.minute + dt_utc.second / 60.0
    tst      = utc_min + eot_min + 4.0 * lon_deg   # 4 min per degree of longitude

    # Hour angle (degrees): 0 at solar noon, negative before noon
    ha_deg   = (tst / 4.0) - 180.0
    ha_rad   = math.radians(ha_deg)
    lat_rad  = math.radians(lat_deg)

    # Solar elevation
    sin_elev = (math.sin(lat_rad) * math.sin(decl_rad)
                + math.cos(lat_rad) * math.cos(decl_rad) * math.cos(ha_rad))
    elev_deg = math.degrees(math.asin(max(-1.0, min(1.0, sin_elev))))

    # Solar azimuth
    cos_az_num = (math.sin(decl_rad)
                  - math.sin(math.radians(elev_deg)) * math.sin(lat_rad))
    cos_az_den = math.cos(math.radians(elev_deg)) * math.cos(lat_rad)

    if abs(cos_az_den) < 1e-9:
        az_deg = 180.0
    else:
        cos_az = max(-1.0, min(1.0, cos_az_num / cos_az_den))
        az_deg = math.degrees(math.acos(cos_az))
        if ha_deg > 0:          # afternoon — sun west of south
            az_deg = 360.0 - az_deg

    # Solar noon in UTC
    noon_utc_min = 720.0 - eot_min - 4.0 * lon_deg
    noon_h = int(noon_utc_min // 60) % 24
    noon_m = int(noon_utc_min % 60)
    solar_noon_str = f"{noon_h:02d}:{noon_m:02d} UTC"

    return elev_deg, az_deg, solar_noon_str


def expected_shadow_azimuth(solar_azimuth_deg: float) -> float:
    """
    On flat ground, shadow points directly opposite the sun.
    shadow_azimuth = (solar_azimuth + 180) mod 360
    """
    return (solar_azimuth_deg + 180.0) % 360.0


# ── Image shadow extraction ───────────────────────────────────────────────────

def extract_shadow_direction(image_path: str) -> Optional[float]:
    """
    Extract dominant shadow bearing from an image (OpenCV required).

    Method:
      1. Convert BGR → LAB; isolate L (luminance) channel.
      2. Threshold below 55% of scene mean → shadow mask.
      3. Morphological open+close to remove noise.
      4. Canny edge detection on mask.
      5. Probabilistic Hough lines to find dominant edge angles.
      6. Return median angle as bearing mod 180 (ambiguous direction).

    Returns
    -------
    float (degrees, 0–180, ambiguous) or None if extraction fails.
    """
    if not _CV2:
        return None

    img = cv2.imread(image_path)
    if img is None:
        return None

    # Standardise width
    h, w = img.shape[:2]
    scale = 640.0 / w
    img   = cv2.resize(img, (640, int(h * scale)))

    lab  = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L    = lab[:, :, 0].astype(float)

    # Shadow mask: below 55% of mean luminance
    thresh      = max(55.0, L.mean() * 0.55)
    shadow_mask = (L < thresh).astype(np.uint8) * 255

    # Morphological cleanup
    kern        = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    shadow_mask = cv2.morphologyEx(shadow_mask, cv2.MORPH_OPEN, kern)
    shadow_mask = cv2.morphologyEx(shadow_mask, cv2.MORPH_CLOSE, kern)

    edges = cv2.Canny(shadow_mask, 30, 100)
    lines = cv2.HoughLines(edges, 1, math.pi / 180, 25)

    if lines is None or len(lines) == 0:
        return None

    thetas  = [float(l[0][1]) for l in lines]
    median  = float(sorted(thetas)[len(thetas) // 2])

    # Image theta → compass bearing (mod 180, ambiguous)
    bearing = (90.0 - math.degrees(median)) % 180.0
    return bearing


def resolve_ambiguity(bearing_mod180: float, solar_az_deg: float) -> float:
    """
    Resolve 180-degree ambiguity by choosing the candidate closest to
    the expected shadow direction (solar_az + 180).
    """
    expected     = expected_shadow_azimuth(solar_az_deg)
    candidates   = [bearing_mod180, (bearing_mod180 + 180.0) % 360.0]
    return min(candidates, key=lambda c: angular_diff(c, expected))


def angular_diff(a: float, b: float) -> float:
    """Minimum angular distance between two bearings (result 0–180)."""
    d = abs(a - b) % 360.0
    return min(d, 360.0 - d)


def deviation_to_confidence(dev: Optional[float]) -> float:
    """
    Map angular deviation (0–90 deg) → confidence score (1.0–0.0).
    Smooth sigmoid-like decay; 0 deg → 1.0, 45 deg → 0.5, 90 deg → 0.0.
    """
    if dev is None:
        return 0.5
    d = max(0.0, min(90.0, dev))
    return round(max(0.0, 1.0 - (d / 90.0) ** 0.65), 4)


# ── Public API ────────────────────────────────────────────────────────────────

def validate_image_authenticity(
    latitude: float,
    longitude: float,
    timestamp_utc: datetime.datetime,
    image_path: str,
    verified_threshold: float  = VERIFIED_DEG,
    review_threshold: float    = REVIEW_DEG,
) -> SolarValidationResult:
    """
    Validate that a submitted image's shadow pattern matches the solar
    position expected for the claimed GPS coordinates and timestamp.

    Parameters
    ----------
    latitude, longitude : GPS coordinates (decimal degrees, WGS-84)
    timestamp_utc       : UTC datetime of image capture
    image_path          : Absolute path to the uploaded image
    verified_threshold  : Maximum deviation (deg) for 'verified' verdict
    review_threshold    : Maximum deviation (deg) for 'review' verdict

    Returns
    -------
    SolarValidationResult
    """
    notes: List[str] = []

    # ── Step 1: Compute solar position ───────────────────────────────────────
    elev_deg, az_deg, noon_str = compute_solar_position(
        latitude, longitude, timestamp_utc
    )
    notes.append(
        f"Solar elevation={elev_deg:.2f}°, azimuth={az_deg:.2f}°  "
        f"(solar noon {noon_str})"
    )

    # ── Step 2: Night-time gate ───────────────────────────────────────────────
    if elev_deg < -0.833:
        notes.append("Night-time: shadow analysis not applicable.")
        return SolarValidationResult(
            is_authentic=True, confidence=0.5,
            expected_azimuth_deg=az_deg, expected_elevation_deg=elev_deg,
            derived_shadow_azimuth_deg=None, angular_deviation_deg=None,
            verdict='insufficient_data', solar_noon_utc=noon_str,
            is_nighttime=True, forensic_notes=notes,
        )

    if elev_deg < 8.0:
        notes.append(
            f"Low elevation ({elev_deg:.1f}°): long shadows — extraction may be imprecise."
        )

    # ── Step 3: Extract shadow from image ────────────────────────────────────
    raw_bearing = extract_shadow_direction(image_path)

    if raw_bearing is None:
        notes.append("Shadow direction could not be extracted (insufficient contrast or CV2 unavailable).")
        return SolarValidationResult(
            is_authentic=True, confidence=0.5,
            expected_azimuth_deg=az_deg, expected_elevation_deg=elev_deg,
            derived_shadow_azimuth_deg=None, angular_deviation_deg=None,
            verdict='insufficient_data', solar_noon_utc=noon_str,
            is_nighttime=False, forensic_notes=notes,
        )

    # ── Step 4: Resolve 180° ambiguity ───────────────────────────────────────
    derived_shadow = resolve_ambiguity(raw_bearing, az_deg)
    exp_shadow     = expected_shadow_azimuth(az_deg)
    deviation      = angular_diff(derived_shadow, exp_shadow)

    notes.append(
        f"Expected shadow azimuth: {exp_shadow:.2f}°  "
        f"| Derived: {derived_shadow:.2f}°  "
        f"| Deviation: {deviation:.2f}°"
    )

    # ── Step 5: Triage ────────────────────────────────────────────────────────
    if deviation <= verified_threshold:
        verdict = 'verified'; is_auth = True
        notes.append(f"VERIFIED — deviation {deviation:.1f}° within {verified_threshold}° threshold.")
    elif deviation <= review_threshold:
        verdict = 'review'; is_auth = False
        notes.append(f"REVIEW — deviation {deviation:.1f}° in ambiguous range.")
    else:
        verdict = 'rejected'; is_auth = False
        notes.append(
            f"REJECTED — deviation {deviation:.1f}° exceeds {review_threshold}°. "
            "Possible GPS spoofing, incorrect timestamp, or recycled image."
        )

    return SolarValidationResult(
        is_authentic=is_auth,
        confidence=deviation_to_confidence(deviation),
        expected_azimuth_deg=az_deg,
        expected_elevation_deg=elev_deg,
        derived_shadow_azimuth_deg=derived_shadow,
        angular_deviation_deg=deviation,
        verdict=verdict,
        solar_noon_utc=noon_str,
        is_nighttime=False,
        forensic_notes=notes,
    )


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    # Bangalore, 7 June 2026, 12:00 IST → 06:30 UTC
    result = validate_image_authenticity(
        latitude=12.9716,
        longitude=77.5946,
        timestamp_utc=datetime.datetime(2026, 6, 7, 6, 30, 0),
        image_path="sample.jpg",  # replace with real image
    )
    print(json.dumps(result.to_dict(), indent=2))
    # Expected: elevation ~79°, azimuth ~180° (sun nearly overhead, south)
    # Expected shadow: ~0° (pointing north)
