# Currency Converter

A modern currency converter built with React and the free Frankfurter API. The design mirrors a clean fintech exchange card, includes a theme toggle, a 30‑day trend sparkline, and popular pair widgets.

## Features

- Manual conversion: updates only when you press “Get Started”.
- Supports many currencies; highlighted quick pairs: USD→INR, USD→EUR, USD→GBP.
- 30‑day trend sparkline for the currently selected pair.
- Light/Dark themes with persistence (localStorage).
- Accessible inputs, responsive layout, locale‑formatted numbers.

## Tech

- React (Create React App)
- Frankfurter API (`https://api.frankfurter.app`) – no API key required

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm start
   ```

   Open `http://localhost:3000`.

3. Build for production:

   ```bash
   npm run build
   ```

## Usage

1. Enter the amount in “You Send”.
2. Pick the source and target currencies.
3. Press “Get Started” to fetch the latest rate and see “Recipient Gets”.
4. Toggle the theme via the icon button in the header. Your choice is saved.

## Project Structure

```
src/
  App.js       # UI + logic, theme toggle, charts and popular pairs
  App.css      # Light/Dark themes and component styles
  index.js     # CRA entry
```

## API Notes

- Latest rate: `/latest?amount=1&from=USD&to=INR`
- Historical range: `/{start}..{end}?from=USD&to=INR` (used for the 30‑day sparkline)

## License

MIT
