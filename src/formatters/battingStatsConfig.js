export const battingStatConfig = [
  // ==========================================
  // COMPLETE CATEGORY (Has Raw Value + Percentile)
  // ==========================================
  {
    key: "exit_velocity",
    percentileKey: "exit_velocity",
    label: "Exit Velocity",
    category: "complete",
    decimals: 1,
    unit: "mph",
    description: "The average speed (in mph) of all batted balls off the bat.",
    getValue: (data) =>
      data?.exitVeloBarrels?.avg_hit_speed ?? data?.custom?.exit_velocity,
  },
  {
    key: "hard_hit_percent",
    percentileKey: "hard_hit_percent",
    label: "Hard Hit %",
    category: "complete",
    decimals: 1,
    unit: "%",
    description: "The percentage of batted balls struck at 95 mph or faster.",
    getValue: (data) =>
      data?.exitVeloBarrels?.ev95percent ?? data?.custom?.hard_hit_percent,
  },
  {
    key: "brl_percent",
    percentileKey: "brl_percent",
    label: "Barrel %",
    category: "complete",
    decimals: 1,
    unit: "%",
    description:
      "The percentage of total batted balls that are classified as Barrels.",
    getValue: (data) =>
      data?.exitVeloBarrels?.brl_percent ?? data?.custom?.barrel_batted_rate,
  },
  {
    key: "xwoba",
    percentileKey: "xwoba",
    label: "Expected wOBA",
    category: "expected",
    decimals: 3,
    description:
      "Expected Weighted On-Base Average based on hit exit velocity and launch angle.",
    getValue: (data) => data?.expectedStats?.est_woba ?? data?.custom?.xwoba,
  },
  {
    key: "xba",
    percentileKey: "xba",
    label: "Expected BA",
    category: "expected",
    decimals: 3,
    description:
      "Expected Batting Average based purely on quality of contact and launch angle.",
    getValue: (data) => data?.expectedStats?.est_ba,
  },
  {
    key: "xslg",
    percentileKey: "xslg",
    label: "Expected SLG",
    category: "expected",
    decimals: 3,
    description:
      "Expected Slugging Percentage measuring modeled extra-base power.",
    getValue: (data) => data?.expectedStats?.est_slg,
  },
  {
    key: "bb_percent",
    percentileKey: "bb_percent",
    label: "Walk %",
    category: "discipline",
    decimals: 1,
    unit: "%",
    invertColor: false,
    simple: true,
    description:
      "How often the hitter draws a walk as a percentage of overall plate appearances compared to the rest of the league.",
    getValue: (data) => data?.custom?.bb_percent,
  },
  {
    key: "k_percent",
    percentileKey: "k_percent",
    label: "Strikeout %",
    category: "discipline",
    decimals: 1,
    unit: "%",
    invertColor: false,
    simple: true,
    description:
      "How often the hitter strikes out compared to the rest of the league.",
    getValue: (data) => data?.custom?.k_percent,
  },
  {
    key: "chase_percent",
    percentileKey: "chase_percent",
    label: "Chase %",
    category: "discipline",
    decimals: 1,
    unit: "%",
    invertColor: false,
    simple: true,
    description:
      "How often the player swings and misses at a pitch outside the zone compared to the rest of the league.",
    getValue: (data) => data?.custom?.chase_percent,
  },
  {
    key: "whiff_percent",
    percentileKey: "whiff_percent",
    label: "Whiff %",
    category: "discipline",
    decimals: 1,
    unit: "%",
    simple: true,
    invertColor: false,
    description:
      "How often the player swings and misses at a pitch inside the zone compared to the rest of the league.",
    getValue: (data) => data?.custom?.pct_whiff,
  },

  // ==========================================
  // OTHER CATEGORIES (Missing raw values or percentile-only)
  // ==========================================
  {
    key: "sweet_spot_percent",
    percentileKey: "sweet_spot_percent",
    label: "Sweet Spot %",
    category: "profile",
    decimals: 1,
    unit: "%",
    description:
      "Percentage of batted balls produced with a launch angle between 8° and 32°.",
    getValue: (data) =>
      data?.exitVeloBarrels?.anglesweetspotpercent ??
      data?.custom?.sweet_spot_percent,
  },
  {
    key: "avg_hit_angle",
    percentileKey: "avg_hit_angle",
    label: "Launch Angle",
    category: "profile",
    decimals: 1,
    unit: "°",
    description:
      "The average launch angle (in degrees) of all hit balls off the bat.",
    getValue: (data) => data?.exitVeloBarrels?.avg_hit_angle,
  },
  {
    key: "avg_distance",
    percentileKey: "avg_distance",
    label: "Avg Hit Distance",
    category: "profile",
    decimals: 0,
    unit: "ft",
    description: "The average distance in feet traveled by all batted balls.",
    getValue: (data) => data?.exitVeloBarrels?.avg_distance,
  },
  {
    key: "avg_hr_distance",
    percentileKey: "avg_hr_distance",
    label: "Avg Home Run Distance",
    category: "power",
    decimals: 0,
    unit: "ft",
    description: "The average distance in feet of home runs hit by the player.",
    getValue: (data) => data?.exitVeloBarrels?.avg_hr_distance,
  },
  {
    key: "max_distance",
    percentileKey: "max_distance",
    label: "Max Distance",
    category: "power",
    decimals: 0,
    unit: "ft",
    description:
      "The longest distance in feet recorded on any single batted ball.",
    getValue: (data) => data?.exitVeloBarrels?.max_distance,
  },
  {
    key: "ev50",
    percentileKey: "ev50",
    label: "EV50",
    category: "power",
    decimals: 1,
    unit: "mph",
    description: "The average exit velocity of the top 50% hardest-hit balls.",
    getValue: (data) => data?.exitVeloBarrels?.ev50 ?? data?.custom?.ev50,
  },
  {
    key: "bat_speed",
    percentileKey: "bat_speed",
    label: "Bat Speed",
    category: "bat_tracking",
    decimals: 1,
    unit: "mph",
    description:
      "The average tracking speed of the sweet spot of the bat at contact.",
    getValue: (data) => data?.percentiles?.bat_speed_val,
  },
  {
    key: "squared_up_rate",
    percentileKey: "squared_up_rate",
    label: "Squared Up %",
    category: "bat_tracking",
    decimals: 1,
    unit: "%",
    description:
      "The percentage of maximum possible exit velocity achieved based on swing speed.",
    getValue: (data) => data?.percentiles?.squared_up_rate_val,
  },
  {
    key: "swing_length",
    percentileKey: "swing_length",
    label: "Swing Length",
    category: "bat_tracking",
    decimals: 1,
    unit: "ft",
    description: "The total length of the bat path in feet during a swing.",
    getValue: (data) => data?.percentiles?.swing_length_val,
  },
  {
    key: "sprint_speed",
    percentileKey: "sprint_speed",
    label: "Sprint Speed",
    category: "running",
    decimals: 1,
    unit: "ft/s",
    description:
      "Feet per second in a player’s top 1-second window on full sprint plays.",
    getValue: (data) => data?.percentiles?.pct_sprint_speed,
  },
  // {
  //   key: "runner_runs_tot",
  //   percentileKey: "base_run_val",
  //   label: "Baserunning Run Value",
  //   category: "running",
  //   decimals: 1,
  //   runValue: true,
  //   description:
  //     "Total runs added or lost on the basepaths relative to an average runner.",
  //   getValue: (data) => data?.baserunningRunValues?.runner_runs_tot,
  // },
  // {
  //   key: "runs_all",
  //   percentileKey: "bat_run_val",
  //   label: "Batting Run Value",
  //   category: "running",
  //   decimals: 1,
  //   runValue: true,
  //   description:
  //     "Total run value added by taking plate appearances based on the Swing-Take model.",
  //   getValue: (data) => data?.runValues?.runs_all,
  // },
];
