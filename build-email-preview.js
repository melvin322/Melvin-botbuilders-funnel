/* ==========================================================================
   Builds email-preview.html from order-confirmation-email.html.
   --------------------------------------------------------------------------
   Run:  node build-email-preview.js
   Then: open email-preview.html in a browser.

   The preview embeds the live template, so re-run this after editing the
   email and the harness picks the change up. Never edit email-preview.html
   by hand — it is generated.
   ========================================================================== */
'use strict';

var fs = require('fs');

var TEMPLATE = 'order-confirmation-email.html';
var OUT      = 'email-preview.html';

var email = fs.readFileSync(TEMPLATE, 'utf8');

/* the harness substitutes these; everything else in the template is left
   exactly as GHL will see it                                              */
var CONTACT = {
  first_name : 'Dana',
  email      : 'dana@company.com'
};

var page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Order confirmation — field preview</title>
<style>
  :root{
    --ground:#EEF4F1; --surface:#fff; --ink:#0B1320; --body:#4A5A6B;
    --muted:#7B8AA3; --line:#DCE7E4; --blue:#2563EB; --green:#16A34A;
    --mono:ui-monospace,'SF Mono',Menlo,Consolas,monospace;
  }
  *{ box-sizing:border-box; }
  body{
    margin:0; background:var(--ground); color:var(--body);
    font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  }
  .bar{
    position:sticky; top:0; z-index:5; background:var(--surface);
    border-bottom:1px solid var(--line); padding:16px 22px;
    box-shadow:0 6px 18px -12px rgba(11,19,32,.25);
  }
  .bar-in{ max-width:1080px; margin:0 auto; display:flex; flex-wrap:wrap; gap:18px 26px; align-items:center; }
  h1{ margin:0; font-size:16px; color:var(--ink); font-weight:700; letter-spacing:-.2px; }
  h1 span{ display:block; font-size:12.5px; font-weight:400; color:var(--muted); letter-spacing:0; }

  .toggles{ display:flex; gap:10px; flex-wrap:wrap; }
  .tg{
    display:inline-flex; align-items:center; gap:9px; cursor:pointer;
    border:1.5px solid var(--line); border-radius:10px; padding:9px 14px;
    background:#FBFDFC; font-size:14px; font-weight:600; color:var(--ink);
    user-select:none;
  }
  .tg input{ width:16px; height:16px; accent-color:var(--blue); margin:0; cursor:pointer; }
  .tg.is-on{ border-color:var(--blue); background:rgba(37,99,235,.07); }
  .tg:focus-within{ outline:2.5px solid rgba(37,99,235,.4); outline-offset:2px; }

  .presets{ display:flex; gap:8px; flex-wrap:wrap; }
  .presets button{
    font:inherit; font-size:13px; font-weight:600; cursor:pointer;
    border:1px solid var(--line); background:#fff; color:var(--body);
    border-radius:8px; padding:8px 12px;
  }
  .presets button:hover{ border-color:var(--blue); color:var(--blue); }

  .fields{
    max-width:1080px; margin:0 auto; padding:18px 22px 0;
    display:flex; flex-wrap:wrap; gap:10px; align-items:center;
  }
  .fld{
    font-family:var(--mono); font-size:12.5px; color:var(--ink);
    background:var(--surface); border:1px solid var(--line);
    border-radius:8px; padding:7px 11px;
  }
  .fld b{ color:var(--blue); font-weight:500; }
  .fld.is-false b{ color:var(--muted); }
  .fld.is-empty b{ color:#B4520C; }
  .hint{ font-size:13px; color:var(--muted); }

  .stage{ max-width:1080px; margin:0 auto; padding:18px 22px 60px; }
  iframe{
    width:100%; height:1500px; border:1px solid var(--line);
    border-radius:14px; background:#fff; display:block;
  }
  .verdict{
    margin:0 0 14px; font-size:14px; color:var(--ink);
    background:var(--surface); border:1px solid var(--line);
    border-left:3px solid var(--green); border-radius:0 10px 10px 0;
    padding:12px 16px;
  }
  .verdict b{ font-weight:700; }
</style>
</head>
<body>

<div class="bar"><div class="bar-in">
  <h1>Order confirmation<span>Flip the fields, watch the email follow</span></h1>

  <div class="toggles">
    <label class="tg" id="tg-vip">
      <input type="checkbox" id="vip"> VIP Launch Intensive
    </label>
    <label class="tg" id="tg-pack">
      <input type="checkbox" id="pack"> AI Script Pack
    </label>
  </div>

  <div class="presets">
    <button data-p="97">Plan only</button>
    <button data-p="294">+ VIP</button>
    <button data-p="194">+ Pack</button>
    <button data-p="391">Both</button>
    <button data-p="empty">Empty fields</button>
  </div>
</div></div>

<div class="fields" id="fields"></div>

<div class="stage">
  <p class="verdict" id="verdict"></p>
  <iframe id="out" title="Email preview"></iframe>
</div>

<script>
/* the live template, embedded at build time */
var TEMPLATE = ${JSON.stringify(email)};
var CONTACT  = ${JSON.stringify(CONTACT)};

var vip = document.getElementById('vip');
var pack = document.getElementById('pack');
var out = document.getElementById('out');
var fieldsEl = document.getElementById('fields');
var verdictEl = document.getElementById('verdict');
var emptyMode = false;

function values(){
  if(emptyMode) return { addon_vip:'', addon_pack:'', order_total:'97' };
  return {
    addon_vip  : vip.checked  ? 'true' : 'false',
    addon_pack : pack.checked ? 'true' : 'false',
    order_total: String(97 + (vip.checked ? 197 : 0) + (pack.checked ? 97 : 0))
  };
}

function render(){
  var v = values();
  var html = TEMPLATE
    .replace(/\\{\\{contact\\.first_name\\}\\}/g, CONTACT.first_name)
    .replace(/\\{\\{contact\\.email\\}\\}/g, CONTACT.email)
    .replace(/\\{\\{contact\\.addon_vip\\}\\}/g, v.addon_vip)
    .replace(/\\{\\{contact\\.addon_pack\\}\\}/g, v.addon_pack)
    .replace(/\\{\\{contact\\.order_total\\}\\}/g, v.order_total);

  out.srcdoc = html;

  /* what GHL must hold on the contact for this render */
  function chip(name, val){
    var cls = val === '' ? 'fld is-empty' : (val === 'false' ? 'fld is-false' : 'fld');
    return '<span class="' + cls + '">' + name + ' = <b>' + (val === '' ? '(blank)' : val) + '</b></span>';
  }
  fieldsEl.innerHTML =
    chip('addon_vip',  v.addon_vip) +
    chip('addon_pack', v.addon_pack) +
    chip('order_total', v.order_total) +
    '<span class="hint">the class each row resolves to: <code>bb-vip-' +
      (v.addon_vip || '') + '</code> · <code>bb-pack-' + (v.addon_pack || '') + '</code></span>';

  document.getElementById('tg-vip').classList.toggle('is-on', vip.checked && !emptyMode);
  document.getElementById('tg-pack').classList.toggle('is-on', pack.checked && !emptyMode);

  /* say what should be on screen, so a wrong render is obvious */
  var lines = ['Growth Plan'];
  if(!emptyMode && vip.checked)  lines.push('VIP Launch Intensive');
  if(!emptyMode && pack.checked) lines.push('AI Script Pack');
  verdictEl.innerHTML = emptyMode
    ? '<b>Fail-safe check.</b> Both fields are blank, so the classes match nothing and both '
      + 'add-on rows must stay hidden — the email should show the plan alone.'
    : '<b>Expect ' + lines.length + ' line' + (lines.length > 1 ? 's' : '') + ':</b> '
      + lines.join(' · ') + ' — charged today $' + values().order_total + '.';
}

vip.addEventListener('change', function(){ emptyMode = false; render(); });
pack.addEventListener('change', function(){ emptyMode = false; render(); });

document.querySelectorAll('.presets button').forEach(function(btn){
  btn.addEventListener('click', function(){
    var p = btn.getAttribute('data-p');
    emptyMode = (p === 'empty');
    vip.checked  = (p === '294' || p === '391');
    pack.checked = (p === '194' || p === '391');
    render();
  });
});

render();
</script>

</body>
</html>
`;

fs.writeFileSync(OUT, page);
console.log('wrote ' + OUT + ' (' + Math.round(page.length / 1024) + 'kB) from ' + TEMPLATE);
