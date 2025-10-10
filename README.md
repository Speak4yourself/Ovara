# Ovara — The Writing Tool (Fixed for Vercel)

This project adds the missing devDependency: **@vitejs/plugin-react**.

## Fix for your Vercel error
If you saw:
```
Error: Cannot find package '@vitejs/plugin-react' imported from vite.config.js
```
Make sure your package.json has:
```json
"devDependencies": {
  "@vitejs/plugin-react": "^4.3.2"
}
```

Then redeploy.

## Quick start
npm i
npm run dev

## Deploy on Vercel
Just push to GitHub and import. Build: `vite build`, Output: `dist/`.
