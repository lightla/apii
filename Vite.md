
# Môi trường dev
npm run build

# Môi trường build
npm run build


package.json
"scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:production": "set NODE_ENV=production && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit"
},