"""Keep selected clips and their required buffer data from a source character GLB.

No models are downloaded by this script or by the regular website build.
The input is a locally supplied, licensed glTF 2.0 binary with one embedded buffer.
"""
import argparse
import copy
import hashlib
import json
import struct
from pathlib import Path


def prepare(source, output, clips):
    raw = source.read_bytes()
    magic, version, length = struct.unpack_from('<4sII', raw)
    if magic != b'glTF' or version != 2 or length != len(raw):
        raise ValueError('Expected a complete glTF 2.0 binary')
    chunks = {}
    offset = 12
    while offset < length:
        size, kind = struct.unpack_from('<II', raw, offset)
        chunks[kind] = raw[offset + 8:offset + 8 + size]
        offset += size + 8
    original = json.loads(chunks[0x4E4F534A])
    document = copy.deepcopy(original)
    if len(document.get('buffers', [])) != 1 or document['buffers'][0].get('uri'):
        raise ValueError('Expected one embedded binary buffer')
    if any(primitive.get('extensions') for mesh in document['meshes'] for primitive in mesh['primitives']):
        raise ValueError('Compressed or extension-based mesh buffers are unsupported')
    if any(image.get('uri') for image in document.get('images', [])):
        raise ValueError('External textures must be handled explicitly')

    document['animations'] = [a for a in document.get('animations', []) if a['name'].split('|')[-1] in clips]
    found = {a['name'].split('|')[-1] for a in document['animations']}
    if found != set(clips):
        raise ValueError(f'Missing animation clips: {set(clips) - found}')
    references = []
    for mesh in document['meshes']:
        for primitive in mesh['primitives']:
            references.extend((primitive['attributes'], key) for key in primitive['attributes'])
            if 'indices' in primitive:
                references.append((primitive, 'indices'))
            for target in primitive.get('targets', []):
                references.extend((target, key) for key in target)
    for skin in document.get('skins', []):
        if 'inverseBindMatrices' in skin:
            references.append((skin, 'inverseBindMatrices'))
    for animation in document['animations']:
        for sampler in animation['samplers']:
            references.extend((sampler, key) for key in ['input', 'output'])
    accessor_ids = sorted({container[key] for container, key in references})
    accessor_map = {old: new for new, old in enumerate(accessor_ids)}
    document['accessors'] = [document['accessors'][index] for index in accessor_ids]
    for container, key in references:
        container[key] = accessor_map[container[key]]

    view_references = []
    for accessor in document['accessors']:
        if 'bufferView' in accessor:
            view_references.append((accessor, 'bufferView'))
        if 'sparse' in accessor:
            view_references.extend((accessor['sparse'][key], 'bufferView') for key in ['indices', 'values'])
    view_references.extend((image, 'bufferView') for image in document.get('images', []) if 'bufferView' in image)
    view_ids = sorted({container[key] for container, key in view_references})
    view_map = {old: new for new, old in enumerate(view_ids)}
    binary = bytearray()
    views = []
    for index in view_ids:
        view = copy.deepcopy(original['bufferViews'][index])
        while len(binary) % 4:
            binary.append(0)
        start = view.get('byteOffset', 0)
        fragment = chunks[0x004E4942][start:start + view['byteLength']]
        if len(fragment) != view['byteLength']:
            raise ValueError('Incomplete buffer view')
        view['buffer'] = 0
        view['byteOffset'] = len(binary)
        binary.extend(fragment)
        views.append(view)
    for container, key in view_references:
        container[key] = view_map[container[key]]
    document['bufferViews'] = views
    document['buffers'] = [{'byteLength': len(binary)}]
    encoded = json.dumps(document, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary += b'\0' * (-len(binary) % 4)
    result = struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(binary))
    result += struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
    result += struct.pack('<II', len(binary), 0x004E4942) + binary
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(result)
    return {'source': str(source), 'output': str(output), 'sourceBytes': len(raw), 'bytes': len(result),
            'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sha256': hashlib.sha256(result).hexdigest(),
            'clips': sorted(found)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--clip', action='append', required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(args.source, args.output, args.clip)))
