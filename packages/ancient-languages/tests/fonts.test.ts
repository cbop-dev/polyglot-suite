import { describe, it, expect } from 'vitest';
import { getLanguageFontClass, getLanguageDirection, isRtlLanguage } from '../src/fonts.js';

describe('ancient-languages fonts and direction utilities', () => {
    it('returns Hebrew font classes and RTL direction for Hebrew', () => {
        expect(getLanguageFontClass('hebrew')).toBe('font-hebrew hebrew');
        expect(getLanguageFontClass('Hebrew')).toBe('font-hebrew hebrew');
        expect(getLanguageFontClass(undefined, 'bhs')).toBe('font-hebrew hebrew');
        expect(getLanguageFontClass(undefined, 'WLC')).toBe('font-hebrew hebrew');
        expect(isRtlLanguage('hebrew')).toBe(true);
        expect(isRtlLanguage(undefined, 'bhs')).toBe(true);
        expect(getLanguageDirection('hebrew')).toBe('rtl');
        expect(getLanguageDirection(undefined, 'bhs')).toBe('rtl');
    });

    it('returns Syriac font classes and RTL direction for Syriac', () => {
        expect(getLanguageFontClass('syriac')).toBe('font-syriac syriac');
        expect(getLanguageFontClass(undefined, 'peshitta')).toBe('font-syriac syriac');
        expect(isRtlLanguage('syriac')).toBe(true);
        expect(isRtlLanguage(undefined, 'peshitta')).toBe(true);
        expect(getLanguageDirection('syriac')).toBe('rtl');
    });

    it('returns Greek font classes and LTR direction for Greek', () => {
        expect(getLanguageFontClass('greek')).toBe('font-greek greek');
        expect(getLanguageFontClass(undefined, 'lxx')).toBe('font-greek greek');
        expect(getLanguageFontClass(undefined, 'sblgnt')).toBe('font-greek greek');
        expect(isRtlLanguage('greek')).toBe(false);
        expect(getLanguageDirection('greek')).toBe('ltr');
    });

    it('defaults gracefully for Latin and English', () => {
        expect(getLanguageFontClass('latin')).toBe('font-latin latin');
        expect(getLanguageFontClass(undefined, 'vulgate')).toBe('font-latin latin');
        expect(getLanguageFontClass('english')).toBe('font-english');
        expect(getLanguageFontClass(undefined, 'kjv')).toBe('font-english');
    });
});
