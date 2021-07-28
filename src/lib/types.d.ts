/**
 * Can be made globally available by placing this
 * inside `global.d.ts` and removing `export` keyword
 */
export interface Locals {
	userid: string;
}

export const enum AvatarEnum	{
	woman,
	woman_1,
	woman_2,
	woman_3,
	woman_4,
	woman_5,
	boy,
	boy_1,
	boy_2,
	boy_3,
	boy_4,
	boy_5,
	man,
	boy_6,
	man_1,
	man_2,
	boy_7,
	boy_8,
	boy_9,
	knight,
	wizard,
	dwarf,
	elf,
	giant,
	gnome,
	little_red_riding_hood,
	wolf,
	king,
	robin_hood,
	pirate,
	elf_1,
	pig,
	prince,
	tin_man,
	scarecrow,
	cowardly_lion,
	pinocchio,
	puss_in_boots,
	mad_hatter,
	cyclops,
	vampire,
	unicorn,
	dragon,
	gamer,
	character,
	knight_1,
	ghost,
	character_1,
	character_2,
	elf_2,
	unicorn_1,
	little_red_riding_hood_1,
	gamer_1,
	thief,
	lab_technician,
	judge,
	detective,
	courier,
	priest,
	soldier,
	builder,
	welder,
	swat,
}

export const enum EmojiEnum {
	person = 'Person',
	vote = 'Vote',
	size = 'Size',
	risk = 'Risk',
	status = 'Status',
	scared = 'Scared',
	unsure = 'Unsure',
	loading = 'Loading',
	communications = 'Communications',
	doable = 'Doable',
	learn = 'Learn',
	newbie = 'Newbie',
	refactoring = 'Refactoring',
	copypaste = 'Copypaste',
	legacy = 'Legacy',
	coffee_break = 'Coffee break',
}

export const enum OnlineEnum {
	online = 'Online',
	busy = 'Busy',
	offline = 'Offline',
}

export const enum StoryPointEnum {
	unknown = '?',
	value_0 = '0',
	value_0_5 = '0.5',
	value_1 = '1',
	value_2 = '2',
	value_3 = '3',
	value_5 = '5',
	value_8 = '8',
	value_13 = '13',
	value_20 = '20',
	value_40 = '40',
	value_100 = '100',
}

export const enum SizeEnum {
	XS = 'XS',
	S = 'S',
	M = 'M',
	L = 'L',
	XXL = 'XXL',
}

export const enum RiskEnum {
	Safe = 'Safe',
	Risky50 = '50ml Wrisky',
	Risky = 'Risky',
}

export const enum StatusEnum {
	Ready = 'Ready',
	NeedsClarification = 'Needs clarification',
	NeedsResearch = 'Needs research',
}
