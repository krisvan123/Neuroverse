"""Verify the published FAFB v783 proofread neuron ID archive (NumPy .npy).

This is a narrow standard-library reader for a 1-D 64-bit integer array;
it neither executes pickle data nor accepts arbitrary archive provenance.
Official checksum and expected neuron count are from Zenodo record 10676866.
"""

from __future__ import annotations

import ast
import hashlib
import json
import struct
from pathlib import Path

ARCHIVE_NAME = "proofread_root_ids_783.npy"
OFFICIAL_MD5 = "e0e6c19732fd8c7a4e39a2d170105421"
EXPECTED_NEURONS = 139255
ZENODO_REFERENCE = "https://doi.org/10.5281/zenodo.10676866"
MAX_ID = 2**63 - 1


class OfficialArchiveError(ValueError):
    """Unexpected archive contents or failed publisher checksum."""


def read_numpy_root_ids(path: Path) -> set[str]:
    """Read only safe uncompressed NumPy v1/v2 1-D (u)int64 NPY arrays."""
    with path.open("rb") as file:
        if file.read(6) != b"\x93NUMPY":
            raise OfficialArchiveError("Not a NumPy .npy file")
        version = file.read(2)
        if len(version) != 2 or version[0] not in (1, 2, 3):
            raise OfficialArchiveError("Unsupported NumPy header version")
        count = 2 if version[0] == 1 else 4
        size = file.read(count)
        if len(size) != count:
            raise OfficialArchiveError("Truncated header length")
        length = int.from_bytes(size, "little")
        if length < 20 or length > 65536:
            raise OfficialArchiveError("Unsafe NumPy header length")
        raw_header = file.read(length)
        if len(raw_header) != length:
            raise OfficialArchiveError("Truncated NumPy header")
        try:
            metadata = ast.literal_eval(raw_header.decode("latin1"))
        except (SyntaxError, ValueError, UnicodeDecodeError) as error:
            raise OfficialArchiveError("Malformed NumPy metadata") from error
        if not isinstance(metadata, dict):
            raise OfficialArchiveError("Invalid NumPy header object")
        if metadata.get("fortran_order") is not False:
            raise OfficialArchiveError("Only C-ordered arrays are supported")
        shape = metadata.get("shape")
        if (
            not isinstance(shape, tuple)
            or len(shape) != 1
            or not isinstance(shape[0], int)
            or not 1 <= shape[0] <= 200000
        ):
            raise OfficialArchiveError("Expected a bounded 1-D array of neuron IDs")
        desc = metadata.get("descr")
        formats = {
            "<i8": "<q", "<u8": "<Q",
            "=i8": "<q", "=u8": "<Q",
            ">i8": ">q", ">u8": ">Q",
        }
        if desc not in formats:
            raise OfficialArchiveError("Expected an integer64 array (never object or pickle)")
        payload = file.read()
        if len(payload) != shape[0] * 8:
            raise OfficialArchiveError("The array length does not match its header")
        ids: set[str] = set()
        for (value,) in struct.iter_unpack(formats[desc], payload):
            if not 0 < value <= MAX_ID:
                raise OfficialArchiveError("Neuron root ID is outside supported range")
            representation = str(value)
            if representation in ids:
                raise OfficialArchiveError("Duplicate neuron root ID found")
            ids.add(representation)
        return ids


def verify_fafb783_root_ids(path: Path) -> dict:
    """Verify official Zenodo MD5 before reporting the file as authentic."""
    if path.name != ARCHIVE_NAME:
        raise OfficialArchiveError("Unexpected filename for the FAFB v783 archive")
    digest = hashlib.md5(usedforsecurity=False)
    sha = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1048576), b""):
            digest.update(chunk)
            sha.update(chunk)
    if digest.hexdigest() != OFFICIAL_MD5:
        raise OfficialArchiveError("Archive MD5 does not match the official Zenodo record")
    ids = read_numpy_root_ids(path)
    if len(ids) != EXPECTED_NEURONS:
        raise OfficialArchiveError("Verified archive has an unexpected proofread neuron count")
    return {
        "official_root_ids_verified": True,
        "archive": ARCHIVE_NAME,
        "archive_sha256": sha.hexdigest(),
        "publisher_md5": OFFICIAL_MD5,
        "neuron_count": len(ids),
        "source_reference": ZENODO_REFERENCE,
    }


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description="Authenticate FAFB v783 proofread_root_ids_783.npy against Zenodo MD5"
    )
    parser.add_argument("path", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(verify_fafb783_root_ids(args.path), indent=2))
    except (OfficialArchiveError, OSError) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
