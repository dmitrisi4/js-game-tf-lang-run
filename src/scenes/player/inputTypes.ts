export type InputAxis2d = {
	x: number;
	y: number;
};

export type PlayerInputCommands = {
	move: InputAxis2d;
	look: InputAxis2d;
	jump: boolean;
	sprint: boolean;
	interact: boolean;
	openInventory: boolean;
	openTalents: boolean;
};
