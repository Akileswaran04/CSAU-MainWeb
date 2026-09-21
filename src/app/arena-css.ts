/* Shared space styling for /crackit and /quick-code (scoped by pa-* / qc-* classes). */
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
  .pa-btn::after, .pa-opt::after {
    content: ''; position: absolute; inset: -1px; border: 1px solid var(--dim-300);
    border-radius: inherit; opacity: 0; pointer-events: none;
  }
  .pa-btn:hover::after, .pa-opt:hover::after { animation: pa-ring 1s var(--ease-out) 1 both; }
  @keyframes pa-ring {
    0% { transform: scale(1); opacity: .7; }
    100% { transform: scale(1.12, 1.7); opacity: 0; }
  }

  .pa-opt {
    position: relative; display: flex; align-items: baseline; gap: 12px; width: 100%;
    min-height: 48px; padding: 12px 16px; text-align: left; cursor: pointer; touch-action: manipulation;
    color: var(--starlight); font-family: var(--font-mono); font-size: 14px; line-height: 1.4;
    background: color-mix(in srgb, var(--void-950) 70%, transparent);
    border: 1px solid var(--outline-variant); border-radius: var(--radius-xs);
    transition: background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
  }
  .pa-opt:hover { border-color: var(--dim-300); background: color-mix(in srgb, var(--hull-700) 45%, transparent); }
  .pa-opt[aria-pressed="true"] {
    border-color: var(--signal); background: var(--signal-soft); box-shadow: inset 3px 0 0 0 var(--signal);
  }
  .pa-opt-key {
    font-family: var(--font-mono); font-size: 12px; letter-spacing: .1em; color: var(--outline); flex: none;
  }
  .pa-opt[aria-pressed="true"] .pa-opt-key { color: var(--lit); }

  .pa-panel {
    position: relative;
    background: color-mix(in srgb, var(--void-950) 82%, transparent);
    border: 1px solid var(--outline-variant); border-radius: var(--radius-md);
    transition: border-color var(--dur-base) var(--ease-out);
  }
  .pa-panel:hover { border-color: var(--dim-300); }

  .pa-field { background: color-mix(in srgb, var(--void-950) 80%, transparent); }

  .pa-table-wrap {
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    border: 1px solid var(--outline-variant); border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--void-950) 82%, transparent);
  }
  .pa-table-wrap .data-table { min-width: 420px; }
  .pa-table-wrap .data-table th { border-bottom-color: var(--outline); color: var(--on-surface-variant); white-space: nowrap; }
  .pa-table-wrap .data-table td { border-bottom-color: color-mix(in srgb, var(--starlight) 14%, transparent); }
  .pa-table-wrap .data-table tbody tr:last-child td { border-bottom: 0; }
  .pa-table-wrap .data-table tbody tr:hover td { background: color-mix(in srgb, var(--hull-700) 40%, transparent); }
  .pa-table-wrap .data-table tbody tr[data-current="true"] td { background: color-mix(in srgb, var(--lit) 14%, var(--void-950)); }
  .pa-table-wrap .data-table tbody tr[data-current="true"] td:first-child { box-shadow: inset 3px 0 0 0 var(--lit); }
  .pa-you { margin-left: 8px; font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em; color: var(--lit); }

  .pa-sum { list-style: none; cursor: pointer; min-height: 44px; display: flex; align-items: center; gap: 14px; }
  .pa-sum::-webkit-details-marker { display: none; }
  .pa-sum .pa-pad { transition: transform var(--dur-base) var(--ease-out); }
  details[open] > .pa-sum .pa-pad { transform: rotate(90deg); }

  .pa-ok { color: var(--ok); }

  @media (prefers-reduced-motion: reduce) {
    .pa-btn::after, .pa-opt::after { display: none; }
    .pa-btn, .pa-opt, .pa-panel, .pa-sum .pa-pad { transition: none; }
  }
`;

export const QUICK_CODE_CSS = `
  .qc-field { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
  .qc-rings { position: absolute; left: 50%; bottom: 8%; width: min(1100px, 150vw); transform: translateX(-50%); opacity: .9; }
  .qc-rings ellipse { transform-box: fill-box; transform-origin: center; animation: qc-ring 9s ease-out infinite both; }
  .qc-rings ellipse:nth-child(2) { animation-delay: 3s; }
  .qc-rings ellipse:nth-child(3) { animation-delay: 6s; }
  @keyframes qc-ring {
    0% { transform: scale(.15); opacity: .6; }
    100% { transform: scale(1); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .qc-rings ellipse { animation: none; }
    .qc-rings ellipse { opacity: .25; }
  }
`;
