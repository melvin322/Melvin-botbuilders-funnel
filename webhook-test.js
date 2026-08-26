/* ==========================================================================
   BotBuilders — send a REFERENCE PAYLOAD to the GHL inbound webhook
   --------------------------------------------------------------------------
   WHY: GHL's Inbound Webhook trigger only learns your field names after it
   has actually received a payload. Fire this once and every field below
   appears in the workflow's mapping dropdowns, so you can wire
   Create/Update Contact without submitting the live form.

   HOW: open any page in Chrome, DevTools ▸ Console, paste this whole file,
   press Enter. It fires the richest payload (VIP + OTO, so no field is
   missing) and logs what it sent.

   Then in GHL: Workflows ▸ your workflow ▸ the Inbound Webhook trigger ▸
   "Fetch sample request" — the payload lands there.

   NOTE ON THE RESPONSE: GHL sends no CORS headers, so the browser will not
   let a page read the reply. The request is still delivered — that is how
   the payment page posts too. The promise rejecting with "TypeError: Failed
   to fetch" AFTER the request leaves is normal and does not mean it failed.
   If you want to see a real 200, use the curl at the bottom of this file
   from a terminal instead.

   CLEAN UP AFTER: this creates a contact called Test Lead. Delete it before
   you go live, or it sits in your automations.
   ========================================================================== */
(function () {
  'use strict';

  var WEBHOOK = 'https://services.leadconnectorhq.com/hooks/sz4sVbBhLW7cX7keIHT6/webhook-trigger/8a86e9cd-b0c0-4937-98f5-72f5d2b06a98';

  /* the same prices the payment page's CONFIG.PRICING holds */
  var PRICE = { plan: 97, vip: 197, oto: 97 };

  /* the contact GHL will create */
  var CONTACT = {
    firstName : 'Test',
    lastName  : 'Lead',
    email     : 'testlead@example.com',
    phone     : '+15551234567'
  };

  /* Build exactly what payment.html posts for a given variant.
     variant: 'base' | 'vip' | 'oto' | 'vip_oto'                            */
  function buildPayload(variant) {
    var vip = (variant === 'vip' || variant === 'vip_oto');
    var oto = (variant === 'oto' || variant === 'vip_oto');
    var total = PRICE.plan + (vip ? PRICE.vip : 0) + (oto ? PRICE.oto : 0);
    var label = vip && oto ? 'VIP + AI Script Pack'
              : vip        ? 'VIP Launch Intensive'
              : oto        ? 'Done-For-You AI Script Pack' : '';

    return {
      /* contact */
      firstName    : CONTACT.firstName,
      lastName     : CONTACT.lastName,
      email        : CONTACT.email,
      phone        : CONTACT.phone,

      /* what they bought */
      order_bump   : vip ? 'true' : 'false',
      quoted_total : String(total),
      choice       : oto ? 'accepted' : 'declined',
      oto_accepted : oto,
      offer        : variant,
      offer_name   : label,
      product      : 'Growth Plan',
      amount       : total,
      currency     : 'USD',

      /* also sent, for a mapping built on the offer page's payload */
      name         : CONTACT.firstName + ' ' + CONTACT.lastName,
      first_name   : CONTACT.firstName,
      last_name    : CONTACT.lastName,
      source       : location.href,
      page         : location.href,
      referrer     : document.referrer || '',

      /* card metadata — never the card number itself */
      card_brand   : 'visa',
      card_last4   : '4242',
      exp_month    : '12',
      exp_year     : '2030',
      zip          : '90210'
    };
  }

  function encodeForm(obj) {
    var parts = [];
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]));
      }
    }
    return parts.join('&');
  }

  /* form-encoded, the same content type the payment page uses — a "simple"
     request, so no preflight for GHL to fail to answer                      */
  function sendTest(variant) {
    var data = buildPayload(variant || 'vip_oto');
    var body = encodeForm(data);

    console.log('[bb] sending reference payload →', WEBHOOK);
    console.table(data);

    return fetch(WEBHOOK, {
      method  : 'POST',
      mode    : 'no-cors',                       /* delivery, unreadable reply */
      headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
      body    : body
    }).then(function () {
      console.log('[bb] sent. Now click "Fetch sample request" on the ' +
                  'Inbound Webhook trigger in GHL.');
      return data;
    }).catch(function (e) {
      console.log('[bb] the reply was unreadable (' + e.message + '). ' +
                  'The request still left the browser — check GHL.');
      return data;
    });
  }

  /* expose them so you can fire the other three states from the console */
  window.bbSendTest    = sendTest;
  window.bbBuildPayload = buildPayload;

  /* fire the richest one, so every field is present in the sample */
  sendTest('vip_oto');

  console.log('[bb] to send the others: bbSendTest("base") · ' +
              'bbSendTest("vip") · bbSendTest("oto")');
})();

/* ==========================================================================
   TERMINAL VERSION — shows the real status code, no CORS in the way.
   Paste into a terminal. -i prints the response headers so you see the 200.

curl -i -X POST \
  'https://services.leadconnectorhq.com/hooks/sz4sVbBhLW7cX7keIHT6/webhook-trigger/8a86e9cd-b0c0-4937-98f5-72f5d2b06a98' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'firstName=Test' \
  --data-urlencode 'lastName=Lead' \
  --data-urlencode 'email=testlead@example.com' \
  --data-urlencode 'phone=+15551234567' \
  --data-urlencode 'order_bump=true' \
  --data-urlencode 'quoted_total=391' \
  --data-urlencode 'choice=accepted' \
  --data-urlencode 'oto_accepted=true' \
  --data-urlencode 'offer=vip_oto' \
  --data-urlencode 'offer_name=VIP + AI Script Pack' \
  --data-urlencode 'product=Growth Plan' \
  --data-urlencode 'amount=391' \
  --data-urlencode 'currency=USD' \
  --data-urlencode 'name=Test Lead' \
  --data-urlencode 'first_name=Test' \
  --data-urlencode 'last_name=Lead' \
  --data-urlencode 'source=https://lead.automatordemo.com/payment' \
  --data-urlencode 'card_brand=visa' \
  --data-urlencode 'card_last4=4242' \
  --data-urlencode 'exp_month=12' \
  --data-urlencode 'exp_year=2030' \
  --data-urlencode 'zip=90210'

   JSON instead of form-encoded (only if you switch the page's SUBMIT_MODE
   to 'api' and post to your own endpoint — GHL's hook wants the form shape):

curl -i -X POST 'YOUR_ENDPOINT' -H 'Content-Type: application/json' \
  -d '{"firstName":"Test","lastName":"Lead","email":"testlead@example.com","phone":"+15551234567","order_bump":"true","quoted_total":"391","choice":"accepted","oto_accepted":true,"offer":"vip_oto","offer_name":"VIP + AI Script Pack","product":"Growth Plan","amount":391,"currency":"USD"}'
   ========================================================================== */
