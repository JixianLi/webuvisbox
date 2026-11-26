"""Writes src/Helpers/DataHelper.fixture.json: typed arrays base64-encoded the way a Python data server (UVisBox) sends
them -- the array's little-endian bytes (numpy's tobytes() on x86 and ARM), then base64 -- so the TypeScript test of
decode64 checks the actual cross-language contract. Standard library only; run: python3 scripts/make_decode64_fixture.py
"""
import base64
import json
import pathlib
import struct

ARRAYS = {
    "float32": ("<f", [0.0, 1.5, -2.25, 3.0e-7, 1.0e30, -0.0]),
    "float64": ("<d", [0.1, -1.0e-300, 12345.6789]),
    "int32": ("<i", [0, -1, 2147483647, -2147483648]),
    "uint16": ("<H", [0, 1, 65535]),
    "uint8": ("<B", [0, 127, 255]),
}

fixture = {}
for data_type, (code, values) in ARRAYS.items():
    packed = struct.pack("<" + code[1] * len(values), *values)
    # The values as the typed array holds them (float32 rounds), for the test to compare against.
    stored = list(struct.unpack("<" + code[1] * len(values), packed))
    fixture[data_type] = {"base64": base64.b64encode(packed).decode("ascii"), "values": stored}

path = pathlib.Path(__file__).resolve().parent.parent / "src" / "Helpers" / "DataHelper.fixture.json"
path.write_text(json.dumps(fixture, indent=2) + "\n")
print(f"wrote {path}")
