/* Space styling for /quick-code (scoped by pa-* / qc-* classes). */
export const ARENA_CSS = `
  .pa-btn {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: var(--tap-min); padding: 10px 20px;
    border: 1px solid var(--starlight); border-radius: var(--radius-xs);
    background: transparent; color: var(--starlight);
    font-family: var(--font-mono);
    font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
    text-decoration: none; cursor: pointer; touch-action: manipulation;
    transition: background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-press) ease;
  }
  .pa-btn:hover { background: var(--hull-700); border-color: var(--dim-300); }
  .pa-btn:active { transform: translateY(1px); }
  .pa-btn-primary { background: var(--signal); border-color: var(--signal); color: var(--void-950); font-weight: 700; }
  .pa-btn-primary:hover { background: var(--lit); border-color: var(--lit); color: var(--void-950); }
  .pa-btn[disabled] { opacity: .45; pointer-events: none; cursor: not-allowed; }
  .pa-btn::after {
    content: ''; position: absolute; inset: -1px; border: 1px solid var(--dim-300);
    border-radius: inherit; opacity: 0; pointer-events: none;
  }
  .pa-btn:hover::after { animation: pa-ring 1s var(--ease-out) 1 both; }
  @keyframes pa-ring {
    0% { transform: scale(1); opacity: .7; }
    100% { transform: scale(1.12, 1.7); opacity: 0; }
  }

  .pa-panel {
    position: relative;
    background: color-mix(in srgb, var(--void-950) 82%, transparent);
    border: 1px solid var(--outline-variant); border-radius: var(--radius-md);
    transition: border-color var(--dur-base) var(--ease-out);
  }
  .pa-panel:hover { border-color: var(--dim-300); }

  @media (prefers-reduced-motion: reduce) {
    .pa-btn::after { display: none; }
    .pa-btn, .pa-panel { transition: none; }
  }
`;

export const QUICK_CODE_CSS = `
  /* archive: a console that plays the format */
  .qc-sec { background: transparent; padding: 8vh var(--pg-x); }
  .qc-wrap { max-width: 1100px; margin: 0 auto; display: grid; gap: 28px; }
  :where(.qc-wrap, .qc-block, .qc-about, .qc-player, .qc-stage, .qc-start, .qc-lb, .qc-tp) > * { min-width: 0; }
  .qc-h2 { font-family: var(--font-display); font-weight: 400; font-size: clamp(28px, 4.6vw, 54px); line-height: 1.1; color: var(--on-surface); margin: 0; }
  .qc-k { display: block; font-family: var(--font-mono); font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--outline); margin: 0 0 8px; }
  .qc-text { font-family: var(--font-mono); font-size: 15px; line-height: 1.7; color: var(--on-surface-variant); overflow-wrap: anywhere; }
  .qc-text p { margin: 0 0 12px; }
  .qc-text strong { color: var(--on-surface); font-weight: 500; }
  .qc-small { font-size: 13px; margin: 0; }
  .qc-block { display: grid; gap: 14px; }
  .qc-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .qc-about { display: grid; gap: clamp(22px, 4vw, 48px); align-items: start; }
  @media (min-width: 860px) { .qc-about { grid-template-columns: minmax(0, 380px) 1fr; } }
  .qc-img { display: block; width: 100%; height: auto; border-radius: var(--radius-sm); border: 1px solid var(--outline-variant); }
  .qc-yr[aria-pressed="true"] { background: var(--starlight); border-color: var(--starlight); color: var(--void-950); }

  /* the five weeks on one line */
  .qc-tl { position: relative; display: grid; grid-template-columns: repeat(5, 1fr); }
  .qc-tl::before { content: ""; position: absolute; left: 10%; right: 10%; top: 13px; height: 1px; background: linear-gradient(90deg, var(--outline-variant), var(--dim-300), var(--outline-variant)); }
  .qc-tl-w { position: relative; display: grid; justify-items: center; gap: 6px; padding: 0 0 8px; min-height: var(--tap-min); background: none; border: 0; cursor: pointer; color: var(--outline); font-family: var(--font-mono); touch-action: manipulation; }
  .qc-tl-dot { width: 11px; height: 11px; margin: 8px 0 2px; border-radius: 50%; background: var(--void-950); border: 1px solid var(--dim-300); transition: transform var(--dur-base) var(--ease-out), background-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out); }
  .qc-tl-n { font-family: var(--font-display); font-size: clamp(26px, 5vw, 52px); line-height: 1; color: transparent; -webkit-text-stroke: 1px var(--outline); transition: color var(--dur-base) var(--ease-out); }
  .qc-tl-l { font-size: 10px; letter-spacing: .24em; }
  .qc-tl-star { position: absolute; top: 0; left: calc(50% + 12px); font-size: 11px; color: var(--lit); }
  .qc-tl-w:hover .qc-tl-n { -webkit-text-stroke-color: var(--on-surface); }
  .qc-tl-w[aria-pressed="true"] { color: var(--on-surface); }
  .qc-tl-w[aria-pressed="true"] .qc-tl-n { color: var(--on-surface); -webkit-text-stroke-color: var(--on-surface); }
  .qc-tl-w[aria-pressed="true"] .qc-tl-dot { background: var(--signal); border-color: var(--signal); transform: scale(1.35); box-shadow: 0 0 0 5px color-mix(in srgb, var(--signal) 22%, transparent), 0 0 18px var(--signal); }
  .qc-tl-w:focus-visible { outline: 1px solid var(--lit); outline-offset: 2px; }

  /* the two tracks */
  .qc-tracks { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
  .qc-track { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 2px 12px; padding: 12px 16px; min-height: var(--tap-min); text-align: left; cursor: pointer; background: color-mix(in srgb, var(--void-950) 70%, transparent); border: 1px solid var(--outline-variant); border-radius: var(--radius-sm); color: var(--on-surface-variant); font-family: var(--font-mono); transition: border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out); }
  .qc-track:hover { border-color: var(--dim-300); }
  .qc-track[aria-pressed="true"] { border-color: var(--starlight); background: var(--hull-900); color: var(--on-surface); }
  .qc-track-dots { grid-row: span 2; display: flex; }
  .qc-track-dots i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--void-950); }
  .qc-track-dots i + i { margin-left: -5px; }
  .qc-track-name { font-size: 14px; font-weight: 500; }
  .qc-track-who { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--outline); }

  /* the player */
  .qc-player { overflow: hidden; outline: none; }
  .qc-bar { position: relative; display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 14px; padding: 14px clamp(14px, 3vw, 26px); border-bottom: 1px solid var(--outline-variant); font-family: var(--font-mono); }
  .qc-bar-id { font-size: 12px; letter-spacing: .16em; color: var(--outline); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .qc-segs { display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; }
  .qc-seg { display: block; width: clamp(18px, 4vw, 34px); height: 22px; padding: 0; border: 0; background: none; cursor: pointer; position: relative; }
  .qc-seg::before { content: ""; position: absolute; left: 0; right: 0; top: 8px; height: 6px; border-radius: 3px; background: var(--hull-700); transition: background-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out); }
  .qc-seg[disabled] { cursor: default; }
  .qc-seg[data-state="ok"]::before { background: var(--lit); }
  .qc-seg[data-state="bad"]::before { background: var(--red-600); }
  .qc-seg[data-state="seen"]::before { background: var(--dim-300); }
  .qc-seg[data-at]::before { box-shadow: 0 0 0 2px var(--void-950), 0 0 0 3px var(--starlight); }
  .qc-clock { font-size: clamp(18px, 2.4vw, 24px); font-weight: 500; color: var(--lit); letter-spacing: .04em; }
  .qc-clock[data-low] { color: var(--red-600); animation: qc-blink 1s steps(2) infinite; }
  @keyframes qc-blink { 50% { opacity: .45; } }
  .qc-fuse { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--lit); transform-origin: left; transition: transform .25s linear; }
  .qc-player:not([data-mode="run"]) .qc-fuse { opacity: 0; }
  @media (max-width: 560px) {
    .qc-bar { grid-template-columns: 1fr auto; }
    .qc-segs { grid-row: 2; grid-column: 1 / -1; }
    .qc-segs li { flex: 1; }
    .qc-seg { width: 100%; }
  }

  .qc-start, .qc-stage, .qc-done { padding: clamp(18px, 4vw, 40px); display: grid; gap: 20px; }
  .qc-stage { animation: qc-in .35s var(--ease-out) both; }
  @keyframes qc-in { from { opacity: 0; transform: translateX(14px); } }
  .qc-start-big { font-family: var(--font-display); font-size: clamp(56px, 12vw, 128px); line-height: 1; color: transparent; -webkit-text-stroke: 1px var(--lit); }
  .qc-go { padding: 14px 28px; }
  .qc-brief > summary { cursor: pointer; font-size: 12px; letter-spacing: .2em; color: var(--on-surface); min-height: var(--tap-min); display: flex; align-items: center; }
  .qc-brief > summary::-webkit-details-marker { display: none; }
  .qc-brief > summary::after { content: "+"; margin-left: 10px; color: var(--outline); }
  .qc-brief[open] > summary::after { content: "-"; }
  .qc-brief > div { margin-top: 10px; }

  .qc-qhead { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; }
  .qc-qno { font-family: var(--font-display); font-size: clamp(36px, 6vw, 64px); line-height: 1; color: var(--lit); }
  .qc-qtitle { font-family: var(--font-mono); font-size: 13px; letter-spacing: .18em; color: var(--on-surface); }
  .qc-lv { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--outline); border: 1px solid var(--outline-variant); border-radius: 99px; padding: 2px 10px; }
  .qc-prompt { color: var(--on-surface); }
  .qc-prompt p:last-child { margin-bottom: 0; }
  .qc-pre { margin: 0 0 12px; padding: 14px 16px; overflow-x: auto; font-family: var(--font-mono); font-size: 13px; line-height: 1.6; color: var(--on-surface); background: color-mix(in srgb, var(--void-950) 92%, transparent); border: 1px solid var(--outline-variant); border-left: 2px solid var(--signal); border-radius: var(--radius-xs); }
  .qc-opts { display: grid; gap: 10px; }
  @media (min-width: 860px) { .qc-opts { grid-template-columns: 1fr 1fr; } }
  .qc-opt { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 14px; padding: 12px 14px; min-height: var(--tap-min); text-align: left; cursor: pointer; background: color-mix(in srgb, var(--void-950) 75%, transparent); border: 1px solid var(--outline-variant); border-radius: var(--radius-sm); color: var(--on-surface); font-family: var(--font-mono); font-size: 14px; line-height: 1.55; touch-action: manipulation; transition: border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out), opacity var(--dur-base) var(--ease-out), transform var(--dur-press) ease; }
  .qc-opt:not([aria-disabled]):hover { border-color: var(--dim-300); background: var(--hull-900); }
  .qc-opt:not([aria-disabled]):active { transform: scale(.99); }
  .qc-opt[aria-disabled] { cursor: default; }
  .qc-opt:focus-visible { outline: 1px solid var(--lit); outline-offset: 2px; }
  .qc-opt-l { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid var(--dim-300); border-radius: var(--radius-xs); font-weight: 500; font-size: 13px; }
  .qc-opt-t { white-space: pre-line; overflow-wrap: anywhere; padding-top: 2px; }
  .qc-opt[data-state="ok"] { border-color: var(--lit); background: var(--lit-100); }
  .qc-opt[data-state="ok"] .qc-opt-l { background: var(--lit); border-color: var(--lit); color: var(--void-950); }
  .qc-opt[data-state="bad"] { border-color: var(--red-600); background: var(--red-100); animation: qc-shake .3s ease; }
  .qc-opt[data-state="bad"] .qc-opt-l { background: var(--red-600); border-color: var(--red-600); color: var(--void-950); }
  .qc-opt[data-state="dim"] { opacity: .45; }
  @keyframes qc-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
  .qc-why { border-left: 2px solid var(--lit); padding: 2px 0 2px 16px; animation: qc-up .35s var(--ease-out) both; }
  .qc-why p:last-child { margin-bottom: 0; }
  .qc-ans { color: var(--on-surface); }
  @keyframes qc-up { from { opacity: 0; transform: translateY(8px); } }
  .qc-nav { justify-content: space-between; border-top: 1px solid var(--outline-variant); padding-top: 18px; }
  .qc-nav > :first-child { margin-right: auto; }

  .qc-done-stats { display: flex; flex-wrap: wrap; gap: 20px 56px; }
  .qc-done-big { font-family: var(--font-display); font-size: clamp(44px, 9vw, 96px); line-height: 1; color: var(--on-surface); }

  /* results */
  .qc-lb { padding: clamp(16px, 3vw, 30px); display: grid; gap: 22px; }
  .qc-lb-sum { display: flex; flex-wrap: wrap; gap: 14px 40px; margin: 0; }
  .qc-lb-sum dd { margin: 0; font-family: var(--font-mono); font-size: clamp(18px, 2.4vw, 26px); color: var(--lit); }
  .qc-pod { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(6px, 1.4vw, 14px); align-items: end; }
  .qc-pod-c { display: grid; justify-items: center; gap: 6px; text-align: center; font-family: var(--font-mono); animation: qc-up .45s var(--ease-out) both; }
  .qc-pod-c:nth-child(1) { animation-delay: .08s; }
  .qc-pod-c:nth-child(3) { animation-delay: .16s; }
  .qc-pod-name { font-size: clamp(12px, 1.6vw, 16px); color: var(--on-surface); overflow-wrap: anywhere; }
  .qc-pod-meta { font-size: 11px; color: var(--outline); letter-spacing: .06em; }
  .qc-pod-step { width: 100%; display: grid; place-items: start center; padding-top: 10px; font-family: var(--font-display); font-size: clamp(16px, 2.4vw, 26px); color: var(--on-surface); border: 1px solid var(--outline-variant); border-bottom: 0; border-radius: var(--radius-xs) var(--radius-xs) 0 0; background: linear-gradient(to bottom, var(--hull-900), transparent); }
  .qc-pod-c[data-place="1st"] .qc-pod-step { border-color: var(--lit); color: var(--lit); background: linear-gradient(to bottom, var(--lit-100), transparent); }
  .qc-pod-c[data-place="1st"] .qc-pod-name { color: var(--lit); }
  .qc-rest { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-family: var(--font-mono); font-size: 14px; color: var(--on-surface-variant); }
  .qc-rest li { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; padding: 8px 4px; border-top: 1px solid color-mix(in srgb, var(--outline-variant) 60%, transparent); }
  .qc-rest-r { color: var(--outline); }

  /* top performers */
  .qc-tp { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
  .qc-tp-c { padding: 16px 18px; display: grid; gap: 8px; }
  .qc-tp-c > .qc-k { margin: 0; }
  .qc-tp-name { font-family: var(--font-mono); font-size: 16px; color: var(--on-surface); }
  .qc-tp-run { display: flex; align-items: end; gap: 14px; margin: 0; font-family: var(--font-mono); color: var(--outline); }
  .qc-tp-run .qc-k { font-size: 9px; letter-spacing: .14em; margin-bottom: 2px; }
  .qc-tp-run dd { margin: 0; font-size: 20px; color: var(--lit); }

  /* winners */
  .qc-wins { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
  .qc-win { display: block; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--outline-variant); transition: transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out); }
  .qc-win:hover { transform: translateY(-4px); border-color: var(--dim-300); }
  .qc-win img { display: block; width: 100%; height: auto; }

  @media (prefers-reduced-motion: reduce) {
    .qc-stage, .qc-why, .qc-pod-c, .qc-opt[data-state="bad"], .qc-clock[data-low] { animation: none; }
    .qc-fuse, .qc-win, .qc-tl-dot { transition: none; }
  }
`;
