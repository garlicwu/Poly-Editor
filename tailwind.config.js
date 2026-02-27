/** @type {import('tailwindcss').Config} */
import tailwindcssPrimeui from 'tailwindcss-primeui'

export const content = ['./index.html', './src/**/*.{vue,js,ts,html}']
export const plugins = [tailwindcssPrimeui]

export const theme = {
  extend: {
    colors: {},
  },
}
