### Who is this for?

For more historical stats and more in depth tables baseball reference and fangraphs are better resources. Baseball Savant is a lot better for statcast data specifically. Headwar is a good in between resource to see overall performances with a nicer UI to get a good idea of player and team performances very fast, with graphical UX improvements. Or if you just want to use a website that looks more modern.

### Disclaimer

This website is a non-commercial, open-source educational project built for fun. It is not affiliated with, endorsed by, or sponsored by Major League Baseball (MLB) or any of its constituent clubs. All player statistics and biographical data are retrieved via public endpoints and used for informational purposes only. All team names, logos, and brands are property of their respective owners.

### Technologies used

- Webawesome components + lots of custom components
- Sveltekit for front-end
- Precomputed JSON data files served from /data (built by GitHub Actions using DuckDB for aggregation, then committed as static JSON)
- anime.js for number animations

- Baseball Reference war_daily_bat & war_daily_pitch for WAR, OPS+ and ERA+ values
- Official public MLB api for non statcast data
- Baseball Savant public CSV files for some statcast data

### Statcast career averages

Player pages hide Statcast in career mode because a single season is meaningless there. Instead, players who debuted in 2015 or later get a 162 game average built by `.github/scripts/build_savant_careers.py` into `static/data/savant_careers.json`, which is fetched only when career mode is selected.

Every metric carries its own games denominator, and a season only counts toward a metric that actually qualified there, so the 60-game 2020 season cannot distort a rate and a missing season cannot drag on another one's games. Rates are games-weighted but never scaled up, since playing more games does not make a batter faster; only totals are projected to 162 games. Pitching totals are the exception: they project to 30 pitching games, because a pitcher's `G` runs about 21 per season and scaling it to 162 would inflate them roughly eightfold.

### Running Locally

- npm install
- npm run dev
