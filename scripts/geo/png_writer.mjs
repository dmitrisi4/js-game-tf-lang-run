import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { ensureParentDirectory } from './puerto_city_common.mjs';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
	let value = index;

	for (let bit = 0; bit < 8; bit += 1) {
		value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
	}

	return value >>> 0;
});

const getCrc32 = (buffer) => {
	let crc = 0xffffffff;

	for (const byte of buffer) {
		crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
	}

	return (crc ^ 0xffffffff) >>> 0;
};

const createChunk = (type, data) => {
	const typeBuffer = Buffer.from(type, 'ascii');
	const lengthBuffer = Buffer.alloc(4);
	const crcBuffer = Buffer.alloc(4);
	lengthBuffer.writeUInt32BE(data.length, 0);
	crcBuffer.writeUInt32BE(getCrc32(Buffer.concat([typeBuffer, data])), 0);

	return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
};

export const writePng = async (filePath, width, height, rgba) => {
	if (rgba.length !== width * height * 4) {
		throw new Error(`PNG buffer length mismatch: ${rgba.length} for ${width}x${height}`);
	}

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	const stride = width * 4;
	const raw = Buffer.alloc((stride + 1) * height);

	for (let row = 0; row < height; row += 1) {
		const rowStart = row * (stride + 1);
		raw[rowStart] = 0;
		Buffer.from(rgba.buffer, rgba.byteOffset + row * stride, stride).copy(raw, rowStart + 1);
	}

	const png = Buffer.concat([
		PNG_SIGNATURE,
		createChunk('IHDR', ihdr),
		createChunk('IDAT', deflateSync(raw, { level: 9 })),
		createChunk('IEND', Buffer.alloc(0)),
	]);

	await ensureParentDirectory(filePath);
	await writeFile(filePath, png);
};
