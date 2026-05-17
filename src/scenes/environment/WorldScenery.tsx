import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import { useRef } from 'react';
import { useBeforeRender } from 'react-babylonjs';
import { getTerrainHeightAt } from './terrainData';
import WorldBuildings from './WorldBuildings';
import {
	WORLD_BUILDINGS,
	WORLD_CREATURES,
	WORLD_HALF_EXTENT,
	WORLD_NPCS,
	WORLD_PROPS,
	WORLD_ROCKS,
	WORLD_SIZE,
	WORLD_TREES,
	type WorldCreature,
	type WorldNpc,
	type WorldProp,
	type WorldRock,
	type WorldTree,
} from './worldData';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onBuildingsReadyChange?: (isReady: boolean) => void;
};

const STATIC_PHYSICS_OPTIONS = { mass: 0, restitution: 0.02, friction: 0.12 };
const BOUNDARY_PHYSICS_OPTIONS = { mass: 0, restitution: 0.05, friction: 0.04 };

const makePosition = (x: number, y: number, z: number) =>
	new Vector3(x, y + getTerrainHeightAt({ x, z }), z);

const TreeObstacle: React.FC<{ tree: WorldTree; havokPlugin: HavokPlugin | null }> = ({
	tree,
	havokPlugin,
}) => {
	const trunkY = tree.trunkHeight / 2;
	const canopyY = tree.trunkHeight + tree.canopyDiameter * 0.34;

	return (
		<>
			<cylinder
				name={`${tree.id}-trunk`}
				height={tree.trunkHeight}
				diameter={tree.trunkDiameter}
				position={makePosition(tree.position.x, trunkY, tree.position.z)}
			>
				<standardMaterial
					name={`${tree.id}-trunk-material`}
					diffuseColor={Color3.FromHexString('#6d4a2f')}
					specularColor={Color3.FromHexString('#1d130d')}
				/>
				{havokPlugin && (
					<physicsAggregate type={PhysicsShapeType.CYLINDER} _options={STATIC_PHYSICS_OPTIONS} />
				)}
			</cylinder>
			<sphere
				name={`${tree.id}-canopy`}
				diameter={tree.canopyDiameter}
				position={makePosition(tree.position.x, canopyY, tree.position.z)}
				onCreated={(mesh) => {
					mesh.isPickable = false;
				}}
			>
				<standardMaterial
					name={`${tree.id}-canopy-material`}
					diffuseColor={Color3.FromHexString(tree.canopyColor)}
					specularColor={Color3.FromHexString('#132516')}
				/>
			</sphere>
		</>
	);
};

const RockObstacle: React.FC<{ rock: WorldRock; havokPlugin: HavokPlugin | null }> = ({
	rock,
	havokPlugin,
}) => (
	<sphere
		name={rock.id}
		diameter={1}
		position={makePosition(rock.position.x, rock.scale.y * 0.5, rock.position.z)}
		scaling={new Vector3(rock.scale.x, rock.scale.y, rock.scale.z)}
	>
		<standardMaterial
			name={`${rock.id}-material`}
			diffuseColor={Color3.FromHexString(rock.color)}
			specularColor={Color3.FromHexString('#252423')}
		/>
		{havokPlugin && (
			<physicsAggregate type={PhysicsShapeType.SPHERE} _options={STATIC_PHYSICS_OPTIONS} />
		)}
	</sphere>
);

const CampfireProp: React.FC<{ prop: WorldProp; havokPlugin: HavokPlugin | null }> = ({
	prop,
	havokPlugin,
}) => (
	<>
		<cylinder
			name={`${prop.id}-stones`}
			height={0.24}
			diameter={1.4}
			position={makePosition(prop.position.x, 0.12, prop.position.z)}
			rotation={new Vector3(0, prop.yaw, 0)}
		>
			<standardMaterial
				name={`${prop.id}-stones-material`}
				diffuseColor={Color3.FromHexString('#5f5a51')}
				specularColor={Color3.FromHexString('#22201d')}
			/>
			{havokPlugin && (
				<physicsAggregate type={PhysicsShapeType.CYLINDER} _options={STATIC_PHYSICS_OPTIONS} />
			)}
		</cylinder>
		<sphere
			name={`${prop.id}-flame`}
			diameter={0.9}
			position={makePosition(prop.position.x, 0.78, prop.position.z)}
			scaling={new Vector3(0.75, 1.25, 0.75)}
			onCreated={(mesh) => {
				mesh.isPickable = false;
			}}
		>
			<standardMaterial
				name={`${prop.id}-flame-material`}
				diffuseColor={Color3.FromHexString('#ff8a3d')}
				emissiveColor={Color3.FromHexString('#f7a840')}
				specularColor={Color3.FromHexString('#3a1708')}
			/>
		</sphere>
		<pointLight
			name={`${prop.id}-light`}
			position={makePosition(prop.position.x, 1.8, prop.position.z)}
			intensity={0.35}
			range={9}
			diffuse={Color3.FromHexString('#f0a34b')}
		/>
	</>
);

const CrateProp: React.FC<{ prop: WorldProp; havokPlugin: HavokPlugin | null }> = ({
	prop,
	havokPlugin,
}) => (
	<box
		name={prop.id}
		size={1.4}
		position={makePosition(prop.position.x, 0.7, prop.position.z)}
		rotation={new Vector3(0, prop.yaw, 0)}
	>
		<standardMaterial
			name={`${prop.id}-material`}
			diffuseColor={Color3.FromHexString('#8c6542')}
			specularColor={Color3.FromHexString('#27190f')}
		/>
		{havokPlugin && (
			<physicsAggregate type={PhysicsShapeType.BOX} _options={STATIC_PHYSICS_OPTIONS} />
		)}
	</box>
);

const ObeliskProp: React.FC<{ prop: WorldProp; havokPlugin: HavokPlugin | null }> = ({
	prop,
	havokPlugin,
}) => (
	<cylinder
		name={prop.id}
		height={4.2}
		diameterTop={0.45}
		diameterBottom={1.2}
		tessellation={5}
		position={makePosition(prop.position.x, 2.1, prop.position.z)}
		rotation={new Vector3(0, prop.yaw, 0)}
	>
		<standardMaterial
			name={`${prop.id}-material`}
			diffuseColor={Color3.FromHexString('#4f5665')}
			emissiveColor={Color3.FromHexString('#16233a')}
			specularColor={Color3.FromHexString('#252a33')}
		/>
		{havokPlugin && (
			<physicsAggregate type={PhysicsShapeType.CYLINDER} _options={STATIC_PHYSICS_OPTIONS} />
		)}
	</cylinder>
);

const TotemProp: React.FC<{ prop: WorldProp; havokPlugin: HavokPlugin | null }> = ({
	prop,
	havokPlugin,
}) => (
	<cylinder
		name={prop.id}
		height={2.8}
		diameter={0.65}
		tessellation={6}
		position={makePosition(prop.position.x, 1.4, prop.position.z)}
		rotation={new Vector3(0, prop.yaw, 0)}
	>
		<standardMaterial
			name={`${prop.id}-material`}
			diffuseColor={Color3.FromHexString('#7b5034')}
			emissiveColor={Color3.FromHexString('#2b160d')}
			specularColor={Color3.FromHexString('#2c180e')}
		/>
		{havokPlugin && (
			<physicsAggregate type={PhysicsShapeType.CYLINDER} _options={STATIC_PHYSICS_OPTIONS} />
		)}
	</cylinder>
);

const WorldPropView: React.FC<{ prop: WorldProp; havokPlugin: HavokPlugin | null }> = ({
	prop,
	havokPlugin,
}) => {
	if (prop.kind === 'campfire') {
		return <CampfireProp havokPlugin={havokPlugin} prop={prop} />;
	}

	if (prop.kind === 'crate') {
		return <CrateProp havokPlugin={havokPlugin} prop={prop} />;
	}

	if (prop.kind === 'obelisk') {
		return <ObeliskProp havokPlugin={havokPlugin} prop={prop} />;
	}

	return <TotemProp havokPlugin={havokPlugin} prop={prop} />;
};

const NpcFigure: React.FC<{ npc: WorldNpc; havokPlugin: HavokPlugin | null }> = ({
	npc,
	havokPlugin,
}) => (
	<>
		<cylinder
			name={`${npc.id}-body`}
			height={1.45}
			diameter={0.78}
			position={makePosition(npc.position.x, 0.92, npc.position.z)}
			rotation={new Vector3(0, npc.yaw, 0)}
		>
			<standardMaterial
				name={`${npc.id}-body-material`}
				diffuseColor={Color3.FromHexString(npc.accentColor)}
				specularColor={Color3.FromHexString('#1b1d23')}
			/>
			{havokPlugin && (
				<physicsAggregate type={PhysicsShapeType.CYLINDER} _options={STATIC_PHYSICS_OPTIONS} />
			)}
		</cylinder>
		<sphere
			name={`${npc.id}-head`}
			diameter={0.48}
			position={makePosition(npc.position.x, 1.87, npc.position.z)}
			onCreated={(mesh) => {
				mesh.isPickable = false;
			}}
		>
			<standardMaterial
				name={`${npc.id}-head-material`}
				diffuseColor={Color3.FromHexString('#f0c7a4')}
				specularColor={Color3.FromHexString('#3a271b')}
			/>
		</sphere>
	</>
);

const AmbientCreature: React.FC<{ creature: WorldCreature }> = ({ creature }) => {
	const bodyRef = useRef<Mesh | null>(null);
	const headRef = useRef<Mesh | null>(null);
	const antennaRef = useRef<Mesh | null>(null);

	useBeforeRender(() => {
		const body = bodyRef.current;
		const head = headRef.current;
		const antenna = antennaRef.current;

		if (!body || !head || !antenna) {
			return;
		}

		const elapsed = performance.now() * 0.001 * creature.patrolSpeed;
		const x = creature.position.x + Math.cos(elapsed) * creature.patrolRadius;
		const z = creature.position.z + Math.sin(elapsed * 0.85) * creature.patrolRadius;
		const terrainY = getTerrainHeightAt({ x, z });
		const bob = Math.sin(elapsed * 3) * 0.1;
		const yaw = Math.atan2(-Math.sin(elapsed), Math.cos(elapsed));

		body.position.copyFromFloats(x, terrainY + 0.48 + bob, z);
		body.rotation.y = yaw;
		head.position.copyFromFloats(
			x + Math.sin(yaw) * 0.32,
			terrainY + 0.88 + bob,
			z + Math.cos(yaw) * 0.32,
		);
		antenna.position.copyFromFloats(
			x + Math.sin(yaw) * 0.46,
			terrainY + 1.14 + bob,
			z + Math.cos(yaw) * 0.46,
		);
	});

	return (
		<>
			<sphere
				name={`${creature.id}-body`}
				diameter={0.9}
				position={makePosition(creature.position.x, 0.48, creature.position.z)}
				scaling={new Vector3(1.15, 0.7, 0.9)}
				onCreated={(mesh) => {
					bodyRef.current = mesh;
					mesh.isPickable = false;
				}}
			>
				<standardMaterial
					name={`${creature.id}-body-material`}
					diffuseColor={Color3.FromHexString(creature.accentColor)}
					emissiveColor={Color3.FromHexString('#11250f')}
					specularColor={Color3.FromHexString('#172317')}
				/>
			</sphere>
			<sphere
				name={`${creature.id}-head`}
				diameter={0.45}
				position={makePosition(creature.position.x, 0.88, creature.position.z + 0.32)}
				onCreated={(mesh) => {
					headRef.current = mesh;
					mesh.isPickable = false;
				}}
			>
				<standardMaterial
					name={`${creature.id}-head-material`}
					diffuseColor={Color3.FromHexString(creature.accentColor)}
					emissiveColor={Color3.FromHexString('#182a16')}
					specularColor={Color3.FromHexString('#172317')}
				/>
			</sphere>
			<sphere
				name={`${creature.id}-antenna`}
				diameter={0.18}
				position={makePosition(creature.position.x, 1.14, creature.position.z + 0.46)}
				onCreated={(mesh) => {
					antennaRef.current = mesh;
					mesh.isPickable = false;
				}}
			>
				<standardMaterial
					name={`${creature.id}-antenna-material`}
					diffuseColor={Color3.FromHexString('#fff1a8')}
					emissiveColor={Color3.FromHexString('#ffe06a')}
					specularColor={Color3.FromHexString('#3b2f13')}
				/>
			</sphere>
		</>
	);
};

const BoundaryWalls: React.FC<{ havokPlugin: HavokPlugin | null }> = ({ havokPlugin }) => {
	const wallOffset = WORLD_HALF_EXTENT + 0.5;

	return (
		<>
			<box
				name='world-boundary-north'
				size={1}
				scaling={new Vector3(WORLD_SIZE, 0.9, 1)}
				position={makePosition(0, 0.45, wallOffset)}
			>
				<standardMaterial
					name='world-boundary-north-material'
					diffuseColor={Color3.FromHexString('#3f3b35')}
					specularColor={Color3.FromHexString('#181614')}
				/>
				{havokPlugin && (
					<physicsAggregate type={PhysicsShapeType.BOX} _options={BOUNDARY_PHYSICS_OPTIONS} />
				)}
			</box>
			<box
				name='world-boundary-south'
				size={1}
				scaling={new Vector3(WORLD_SIZE, 0.9, 1)}
				position={makePosition(0, 0.45, -wallOffset)}
			>
				<standardMaterial
					name='world-boundary-south-material'
					diffuseColor={Color3.FromHexString('#3f3b35')}
					specularColor={Color3.FromHexString('#181614')}
				/>
				{havokPlugin && (
					<physicsAggregate type={PhysicsShapeType.BOX} _options={BOUNDARY_PHYSICS_OPTIONS} />
				)}
			</box>
			<box
				name='world-boundary-east'
				size={1}
				scaling={new Vector3(1, 0.9, WORLD_SIZE)}
				position={makePosition(wallOffset, 0.45, 0)}
			>
				<standardMaterial
					name='world-boundary-east-material'
					diffuseColor={Color3.FromHexString('#3f3b35')}
					specularColor={Color3.FromHexString('#181614')}
				/>
				{havokPlugin && (
					<physicsAggregate type={PhysicsShapeType.BOX} _options={BOUNDARY_PHYSICS_OPTIONS} />
				)}
			</box>
			<box
				name='world-boundary-west'
				size={1}
				scaling={new Vector3(1, 0.9, WORLD_SIZE)}
				position={makePosition(-wallOffset, 0.45, 0)}
			>
				<standardMaterial
					name='world-boundary-west-material'
					diffuseColor={Color3.FromHexString('#3f3b35')}
					specularColor={Color3.FromHexString('#181614')}
				/>
				{havokPlugin && (
					<physicsAggregate type={PhysicsShapeType.BOX} _options={BOUNDARY_PHYSICS_OPTIONS} />
				)}
			</box>
		</>
	);
};

const WorldScenery: React.FC<PropsType> = ({ havokPlugin, onBuildingsReadyChange }) => (
	<>
		<BoundaryWalls havokPlugin={havokPlugin} />
		{WORLD_TREES.map((tree) => (
			<TreeObstacle key={tree.id} havokPlugin={havokPlugin} tree={tree} />
		))}
		{WORLD_ROCKS.map((rock) => (
			<RockObstacle key={rock.id} havokPlugin={havokPlugin} rock={rock} />
		))}
		<WorldBuildings
			buildings={WORLD_BUILDINGS}
			havokPlugin={havokPlugin}
			onReadyChange={onBuildingsReadyChange}
		/>
		{WORLD_PROPS.map((prop) => (
			<WorldPropView key={prop.id} havokPlugin={havokPlugin} prop={prop} />
		))}
		{WORLD_NPCS.map((npc) => (
			<NpcFigure key={npc.id} havokPlugin={havokPlugin} npc={npc} />
		))}
		{WORLD_CREATURES.map((creature) => (
			<AmbientCreature key={creature.id} creature={creature} />
		))}
	</>
);

export default WorldScenery;
