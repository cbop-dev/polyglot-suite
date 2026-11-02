export interface AcademicCitationStyle {
	id: string;
	name: string;
	description: string;
	citationText: string;
}

export interface CanonicalWorkCitationInfo {
	code: string;
	titleEnglish: string;
	titleGreek?: string;
	titleLatin?: string;
	abbrev: string;
	totalBooks?: number;
}
