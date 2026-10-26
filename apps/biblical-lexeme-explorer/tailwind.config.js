import aspectRatio from '@tailwindcss/aspect-ratio';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import daisyui from 'daisyui';
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	
	theme: {
		extend: {},
		container: {
			center: true,
		  },
	},

	plugins: [typography, forms, containerQueries, aspectRatio, daisyui],
	daisyui: {
		themes: true
	}
};
