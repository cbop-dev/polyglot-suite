export interface SubBookItem {
	book: number;
	label: string;
	sections?: number;
	isSelected?: boolean;
}

export interface SectionListItem {
	value: number;
	label: string;
	badge?: string;
	isLatin?: boolean;
	isSelected?: boolean;
}

export interface CommandPaletteItem {
	id?: string | number;
	label?: string;
	title?: string;
	subLabel?: string;
	description?: string;
	badge?: string;
	href?: string;
	group?: string;
	keywords?: string[];
	action?: () => void;
	[key: string]: any;
}

export interface WorkPickerItem {
	code: string;
	titleEnglish: string;
	titleGreek?: string;
	titleLatin?: string;
	abbrev?: string;
	genre?: string;
	category?: string;
	sections?: number;
	totalChapters?: number;
	totalSections?: number;
	totalBooks?: number;
	tlgId?: string;
	badge?: string;
	[key: string]: any;
}

export interface WorkCategory {
	id: string;
	label: string;
}

export interface GenericPickerItem {
	id?: string | number;
	label?: string;
	subLabel?: string;
	badge?: string;
	[key: string]: any;
}

export interface CorpusPickerItem {
	id: string;
	title: string;
	subtitle?: string;
	badge?: string;
	totalWorks?: number;
	authors?: string;
	era?: string;
	languages?: string[];
	[key: string]: any;
}
