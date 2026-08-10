/* ============================================================
   logo.js — the brand mark, in one place.

   The mark existed in three copies: inline in shell.js, inline
   again in index.html, and as assets/icons/brand-mark.svg. Three
   copies of a logo is three logos waiting to disagree.

   It is inlined rather than linked because it follows the theme —
   an <img> cannot read the page's custom properties, so a linked
   file would stay light while the page went dark. The .svg file is
   still the record, and is what the favicon points at.

   In React this becomes common/components/BrandMark.
   ============================================================ */
(function () {
  'use strict';

  /* A ball inside a box: the preposition "in", which is the idea every other
     lesson is built on. The gap in the top edge is the ball's own width, so
     it reads as the way in rather than as a missing line — and it is what
     keeps the silhouette from reading as a camera.

     Frame in ink so the mark survives on the green table header, ball in
     accent because the accent's one job here is to mark the thing that
     moved. */
  var PATH = 'M11 4 H7.5 A3.5 3.5 0 0 0 4 7.5 V24.5 A3.5 3.5 0 0 0 7.5 28 H24.5 ' +
             'A3.5 3.5 0 0 0 28 24.5 V7.5 A3.5 3.5 0 0 0 24.5 4 H21';

  /* opts.size   px, default 28
     opts.cls    class on the <svg>
     opts.frame  override the frame colour — the one place that needs this is
                 a dark banner, where ink is the background rather than the
                 foreground. */
  function mark(opts) {
    opts = opts || {};
    var s = opts.size || 28;
    var frame = opts.frame || 'var(--ink)';
    var ball = opts.ball || 'var(--accent)';
    return '<svg class="brand-mark' + (opts.cls ? ' ' + opts.cls : '') +
      '" viewBox="0 0 32 32" width="' + s + '" height="' + s + '" aria-hidden="true">' +
      '<path d="' + PATH + '" fill="none" stroke="' + frame +
        '" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="16" cy="19" r="6" fill="' + ball + '"/>' +
    '</svg>';
  }


  /* ---- the name in Tamil ------------------------------------
     கிராமர்-வெர்ஸ் — the brand written the way a Tamil reader would say it.
     It is the same transliteration bridge the lessons use: a learner who
     cannot read the Latin name can still pronounce it.

     Outlines, not live text. assets/fonts/README.md records that the
     prototype ships no Tamil webfont and that the system stack degrades to
     empty boxes where it is missing — a wordmark that can render as tofu is
     not a wordmark. Drawn from Tamil Sangam MN and converted to a path, so it
     renders identically everywhere and needs no font at all.
     Source glyphs: U+0B95 U+0BBF U+0BB0 U+0BBE U+0BAE U+0BB0 U+0BCD -
     U+0BB5 U+0BC6 U+0BB0 U+0BCD U+0BB8 U+0BCD  */
  var TA_W = 179.7, TA_H = 24.0;
  var TA_D =
    'M11.7 20.0C14.0 20.0 15.8 18.1 15.8 15.8C15.8 13.6 14.0 11.9 11.5 11.9H10.0V8.4H13.2' +
    'V6.9H3.5V11.9C1.7 11.9 0.0 13.2 0.0 15.5C0.0 18.1 2.2 20.0 5.0 20.0' +
    'C7.9 20.0 10.0 17.9 10.0 15.0V13.3H11.5C13.1 13.3 14.1 14.6 14.1 15.8' +
    'C14.1 17.2 13.1 18.5 11.7 18.5C10.9 18.5 10.4 18.1 9.9 17.7L9.0 18.8' +
    'C9.8 19.6 10.6 20.0 11.7 20.0ZM5.0 18.5C3.2 18.5 1.6 17.3 1.6 15.5' +
    'C1.6 14.0 2.6 13.3 3.7 13.3H8.4V15.0C8.4 16.8 7.2 18.5 5.0 18.5ZM5.1 11.9V8.4H8.4V11.9' +
    'ZM26.7 5.4V19.9H28.4V5.4C28.4 2.5 26.9 0.0 23.9 0.0C20.9 0.0 18.6 2.1 18.6 4.6' +
    'C18.6 6.8 20.3 8.4 22.7 8.4H23.6V6.9H22.7C21.4 6.9 20.3 6.1 20.3 4.6' +
    'C20.3 3.0 21.9 1.5 23.9 1.5C26.0 1.5 26.7 3.6 26.7 5.4ZM35.3 24.0 39.5 19.9V8.4H41.9' +
    'V6.9H31.7V19.9H33.4V8.4H37.8V19.3L34.2 22.9ZM45.0 19.9H46.6V8.4H51.0V19.9H52.6V8.4' +
    'H55.0V6.9H45.0ZM58.2 19.9H68.4C71.2 19.9 72.5 17.5 72.5 14.2' +
    'C72.5 10.8 70.1 6.9 66.9 6.9C65.0 6.9 63.9 8.1 63.9 9.9V18.4H59.8V6.9H58.2ZM68.4 18.4' +
    'H65.5V9.9C65.5 9.2 66.1 8.5 66.9 8.5C69.0 8.5 70.9 11.5 70.9 14.2' +
    'C70.9 16.8 70.1 18.4 68.4 18.4ZM79.3 24.0 83.4 19.9V8.4H85.8V6.9H75.7V19.9H77.3V8.4' +
    'H81.7V19.3L78.1 22.9ZM90.3 3.5C91.1 3.5 91.8 2.8 91.8 2.0C91.8 1.2 91.1 0.5 90.3 0.5' +
    'C89.5 0.5 88.8 1.2 88.8 2.0C88.8 2.8 89.5 3.5 90.3 3.5ZM88.9 13.4H95.4V11.7H88.9Z' +
    'M106.6 19.9H114.5V6.9H112.9V18.4H108.3C109.0 17.3 109.6 15.5 109.6 13.5' +
    'C109.6 9.7 107.6 6.8 104.3 6.8C100.8 6.8 98.5 10.1 98.5 14.5' +
    'C98.5 17.8 99.9 20.0 102.0 20.0C103.9 20.0 105.0 18.1 105.0 15.9' +
    'C105.0 13.7 103.8 11.9 102.1 11.9C101.5 11.9 100.7 12.3 100.2 12.9' +
    'C100.5 10.6 102.0 8.3 104.3 8.3C106.8 8.3 108.0 10.9 108.0 13.7' +
    'C108.0 15.4 107.6 17.1 106.4 18.4ZM101.9 18.5C100.9 18.5 100.2 17.0 100.2 15.8' +
    'C100.2 14.7 100.8 13.4 101.8 13.4C102.7 13.4 103.4 14.5 103.4 15.8' +
    'C103.4 17.0 102.9 18.5 101.9 18.5ZM124.4 20.0C127.1 20.0 129.1 17.9 129.1 15.0' +
    'C129.1 12.5 127.7 10.7 125.5 10.7C123.4 10.7 121.7 12.5 121.7 14.9' +
    'C121.7 16.0 122.1 17.3 122.7 18.3C120.5 16.9 119.3 13.2 119.3 10.3' +
    'C119.3 5.4 122.4 2.0 126.7 2.0C130.4 2.0 132.3 4.5 132.3 8.1V19.9H134.0V8.1' +
    'C134.0 3.7 131.4 0.5 126.8 0.5C121.5 0.5 117.6 4.5 117.6 10.3' +
    'C117.6 15.1 120.2 20.0 124.4 20.0ZM124.3 18.6C123.5 18.0 123.1 16.2 123.1 15.1' +
    'C123.1 13.6 123.9 12.3 125.4 12.3C126.8 12.3 127.5 13.6 127.5 15.0' +
    'C127.5 17.0 126.5 18.6 124.3 18.6ZM141.0 24.0 145.1 19.9V8.4H147.5V6.9H137.4V19.9' +
    'H139.0V8.4H143.5V19.3L139.8 22.9ZM152.0 3.5C152.9 3.5 153.5 2.8 153.5 2.0' +
    'C153.5 1.2 152.8 0.5 152.0 0.5C151.2 0.5 150.5 1.2 150.5 2.0' +
    'C150.5 2.8 151.2 3.5 152.0 3.5ZM153.9 20.0C155.8 20.0 156.9 18.1 156.9 15.9' +
    'C156.9 13.7 155.7 11.9 154.0 11.9C153.4 11.9 152.6 12.3 152.1 12.9' +
    'C152.4 10.6 153.9 8.3 156.2 8.3C158.3 8.3 159.4 10.0 159.4 12.3V19.9H161.0L161.1 11.8' +
    'C161.1 9.8 161.8 8.4 163.0 8.4C164.3 8.4 164.8 10.0 164.8 11.8L164.8 15.3' +
    'C164.8 18.2 166.2 20.0 168.9 20.0C171.8 20.0 173.7 17.3 173.7 13.8' +
    'C173.7 10.7 172.3 8.0 170.0 6.1L168.8 7.2C170.9 9.0 172.1 11.1 172.1 13.7' +
    'C172.1 16.0 171.0 18.5 168.9 18.5C166.9 18.5 166.5 17.1 166.5 15.1V11.8' +
    'C166.5 9.1 165.3 6.8 162.8 6.8C161.8 6.8 160.8 7.5 160.1 8.9' +
    'C159.3 7.5 157.9 6.8 156.3 6.8C152.8 6.8 150.4 10.1 150.4 14.4' +
    'C150.4 17.8 151.9 20.0 153.9 20.0ZM153.8 18.5C152.8 18.5 152.1 17.0 152.1 15.8' +
    'C152.1 14.6 152.7 13.4 153.7 13.4C154.7 13.4 155.3 14.5 155.3 15.9' +
    'C155.3 17.0 154.8 18.5 153.8 18.5ZM178.2 3.5C179.0 3.5 179.7 2.8 179.7 2.0' +
    'C179.7 1.2 179.0 0.5 178.2 0.5C177.4 0.5 176.7 1.2 176.7 2.0' +
    'C176.7 2.8 177.4 3.5 178.2 3.5Z';

  /* The Tamil name, at a given cap height. */
  function wordTa(height, fill) {
    var s = height / TA_H;
    return '<svg class="brand-ta" viewBox="0 0 ' + TA_W + ' ' + TA_H + '" width="' +
      (TA_W * s).toFixed(1) + '" height="' + height + '" role="img" ' +
      'aria-label="\u0b95\u0bbf\u0bb0\u0bbe\u0bae\u0bb0\u0bcd-\u0bb5\u0bc6\u0bb0\u0bcd\u0bb8\u0bcd">' +
      '<path d="' + TA_D + '" fill="' + (fill || 'var(--muted)') + '"/></svg>';
  }

  /* Mark plus wordmark. "Verse" takes the accent so the mark's ball and the
     word it belongs to are the same colour.

     Bilingual by default: this product is English taught in Tamil, and a
     logo that says so in one script only is telling half the story. The
     Latin line leads because the subject is English; the Tamil line is
     smaller and muted because it is the pronunciation, not a second name.
     Pass { ta: false } where the space genuinely cannot hold two lines. */
  function lockup(opts) {
    opts = opts || {};
    var size = opts.size || 28;
    var word = '<span class="brand-word">Grammer<em>-Verse</em></span>';
    if (opts.ta === false) return mark(opts) + word;
    return mark(opts) +
      '<span class="brand-stack">' + word +
        wordTa(opts.taSize || Math.max(8, Math.round(size * 0.33))) +
      '</span>';
  }

  window.GV_Logo = { mark: mark, lockup: lockup, wordTa: wordTa, PATH: PATH };
})();
