### Who is this for?

For more historical stats and more in depth tables baseball reference and fangraphs are better resources. Baseball Savant is a lot better for statcast data specifically. Headwar is a good in between resource to see overall performances with a nicer UI to get a good idea of player and team performances very fast, with graphical UX improvements. Or if you just want to use a website that looks more modern.

### Disclaimer

This website is a non-commercial, open-source educational project built for fun. It is not affiliated with, endorsed by, or sponsored by Major League Baseball (MLB) or any of its constituent clubs. All player statistics and biographical data are retrieved via public endpoints and used for informational purposes only. All team names, logos, and brands are property of their respective owners.

### Technologies used

- Webawesome components + lots of custom components
- Sveltekit for front-end
- Parquet & DuckDB for backend database files and queries
- anime.js for number animations

- Baseball Reference war_daily_bat & war_daily_pitch for WAR, OPS+ and ERA+ values
- Official public MLB api for non statcast data
- Baseball Savant public CSV files for some statcast data

### Running Locally

- npm install
- npm run dev
