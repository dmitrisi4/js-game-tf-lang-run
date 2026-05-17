import { execFileSync } from 'node:child_process';

const run = (command, args) => {
	console.info(`\n> ${command} ${args.join(' ')}`);
	execFileSync(command, args, { stdio: 'inherit' });
};

run('node', ['scripts/geo/build_puerto_city_layers.mjs']);
run('node', ['scripts/geo/prepare_puerto_dem.mjs']);
run('node', ['scripts/geo/build_puerto_city_texture.mjs']);
run('blender', ['-b', '--python', 'scripts/blender/create_puerto_city_terrain.py']);
