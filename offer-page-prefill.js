/* ==========================================================================
   BotBuilders — carry the offer page's form into the checkout page
   --------------------------------------------------------------------------
   Paste this into the LIMITED TIME OFFER page and the OTO page (GHL: a
   Custom Code / HTML element, anywhere on the page). payment.html reads
   what it saves, so First name / Last name / Email address / Phone number
   arrive already filled and nobody types them twice.

   It finds the fields without you naming them: by name attribute, then
   autocomplete, then placeholder — so it works with GHL's own form markup
   and with the placeholder-only fields on the offer pages.

   Two routes, both handled:
     • SAME DOMAIN (offer pages and checkout on one domain) — sessionStorage
       carries it, nothing goes in the URL. Leave APPEND_TO_LINK false.
     • DIFFERENT DOMAINS — sessionStorage cannot cross, so set
       APPEND_TO_LINK true and the fields are appended to any link pointing
       at the checkout page. The checkout page strips them back out of the
       address bar once read (its CLEAN_URL setting), but they do travel in
       the URL, so prefer the same-domain route where you have the choice.
   ========================================================================== */
(function(){
  'use strict';

  var CONFIG = {
    /* where the checkout page lives — matched against link hrefs */
    LINK_MATCH     : ['/payment', 'payment.html', 'checkout'],

    /* true only when the checkout page is on ANOTHER domain */
    APPEND_TO_LINK : false,

    KEY            : 'bb_lead'
  };

  var FIELDS = {
    first : ['[name="first_name"]','[name*="first" i]','[autocomplete="given-name"]','input[placeholder*="first" i]'],
    last  : ['[name="last_name"]','[name*="last" i]','[autocomplete="family-name"]','input[placeholder*="last" i]'],
    email : ['[name="email"]','input[type="email"]','[name*="email" i]','[autocomplete="email"]','input[placeholder*="email" i]'],
    phone : ['[name="phone"]','input[type="tel"]','[name*="phone" i]','[autocomplete="tel"]','input[placeholder*="phone" i]']
  };

  function grab(list){
    for(var i=0; i<list.length; i++){
      var el;
      try{ el = document.querySelector(list[i]); }catch(e){ el = null; }   /* older browsers: no "i" flag */
      if(el && el.value && el.value.trim()) return el.value.trim();
    }
    return '';
  }

  function read(){
    return {
      first : grab(FIELDS.first),
      last  : grab(FIELDS.last),
      email : grab(FIELDS.email),
      phone : grab(FIELDS.phone)
    };
  }

  function save(){
    var lead = read();
    if(!lead.first && !lead.last && !lead.email && !lead.phone) return;   /* nothing typed yet */
    try{ window.sessionStorage.setItem(CONFIG.KEY, JSON.stringify(lead)); }catch(e){}
  }

  /* save as they type, on change, and on the way out — GHL forms submit in
     several different ways, so listen for all of them, on capture so a
     handler that stops propagation cannot skip us.                        */
  document.addEventListener('input',  save, true);
  document.addEventListener('change', save, true);
  document.addEventListener('submit', save, true);
  window.addEventListener('beforeunload', save);

  /* cross-domain only: put the fields on the checkout link as it is clicked */
  document.addEventListener('click', function(e){
    if(!CONFIG.APPEND_TO_LINK) return;

    var el = e.target;
    while(el && el !== document.body && !(el.tagName === 'A' && el.getAttribute('href'))) el = el.parentNode;
    if(!el || el.tagName !== 'A') return;

    var href = el.getAttribute('href') || '';
    var hit  = false;
    for(var i=0; i<CONFIG.LINK_MATCH.length; i++){
      if(href.indexOf(CONFIG.LINK_MATCH[i]) > -1){ hit = true; break; }
    }
    if(!hit) return;

    var lead = read();
    var mine = ['first_name','last_name','email','phone'];
    var base = href.split('#')[0];
    var hash = href.indexOf('#') > -1 ? href.slice(href.indexOf('#')) : '';
    var cut  = base.indexOf('?');
    var path = cut > -1 ? base.slice(0, cut) : base;

    /* keep whatever was already on the link (?offer= …), drop any previous
       copy of our own fields so a second click cannot double them up      */
    var keep = [];
    if(cut > -1){
      base.slice(cut + 1).split('&').forEach(function(pair){
        if(!pair) return;
        var k = decodeURIComponent(pair.split('=')[0]).toLowerCase();
        if(mine.indexOf(k) < 0) keep.push(pair);
      });
    }
    if(lead.first) keep.push('first_name=' + encodeURIComponent(lead.first));
    if(lead.last)  keep.push('last_name='  + encodeURIComponent(lead.last));
    if(lead.email) keep.push('email='      + encodeURIComponent(lead.email));
    if(lead.phone) keep.push('phone='      + encodeURIComponent(lead.phone));

    el.setAttribute('href', path + (keep.length ? '?' + keep.join('&') : '') + hash);
  }, true);

})();
