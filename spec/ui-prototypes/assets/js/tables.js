/* ============================================================
   tables.js — one renderer for the source tables.

   Used by the reference page (all fifteen) and by each topic page
   (just that topic's). One implementation, so a fix to the Tamil
   tagging or the column widening lands in both places at once.

   In React this becomes common/components/SourceTable.
   ============================================================ */
(function () {
  'use strict';

  /* Tag by script, not by position. Tamil appears both as its own column and
     as a second line inside an English cell; either way it needs lang="ta" or
     it loses the Tamil font stack and is announced as English. */
  var TAMIL = /[஀-௿]/;

  function cell(v, stack) {
    var lines = String(v == null ? '' : v).split('\n').filter(function (l) { return l.trim(); });
    if (!lines.length) return '';

    /* A column of verb forms is a list, not a sentence: "am, is, are" is
       three answers to the same question. Set one per line so they can be
       read down and compared with the row below, rather than scanned past
       as a run of commas. Each is a sibling, so none is styled as a
       second-line gloss the way a Tamil line under an English one is. */
    if (stack) {
      return lines.reduce(function (out, l) {
        return out.concat(l.split(/\s*,\s*/));
      }, []).filter(function (l) { return l.trim(); })
        .map(function (l) {
          return '<span class="form"' + (TAMIL.test(l) ? ' lang="ta"' : '') + '>' +
            l + '</span>';
        }).join('');
    }

    return lines.map(function (l, i) {
      if (TAMIL.test(l)) return '<span' + (i ? ' class="ta"' : '') + ' lang="ta">' + l + '</span>';
      return i ? '<span class="ta">' + l + '</span>' : l;
    }).join('');
  }

  /* Some source tables have rows wider than their header row — the Tamil
     example column often has no heading. Widen to the widest row so no cell is
     silently dropped; a missing Tamil example is a content error, not a layout
     detail. */
  function columns(t) {
    var width = t.cols.length;
    t.rows.forEach(function (r) { if (r.length > width) width = r.length; });
    var cols = [];
    for (var c = 0; c < width; c++) {
      cols.push(t.cols[c] !== undefined ? t.cols[c]
              : (c === width - 1 ? 'Tamil example' : ''));
    }
    return cols;
  }

  /* ---- short rows -------------------------------------------
     The source omits a leading label when it would repeat the row above: the
     prepositions table writes "in / Place" then just "Time", and the pronouns
     table writes "First Person / singular / I" then just "Plural / We".

     Those cells are missing from the FRONT of the row, not the back. Padding
     at the end — which is what happened before — slid every value one column
     left, so "Time" appeared under "Preposition" and "singular" under
     "Numbers" was really the subject pronoun. The row has to be aligned to the
     right and the leading gaps filled from the last row that had them.

     Carrying down is only correct if the source anchors a repeated label to
     the FIRST row of its group. Where it does not, that is a content error and
     is fixed in content.js — the renderer cannot guess it. */
  function normalise(t) {
    var width = columns(t).length, carried = [], out = [];
    t.rows.forEach(function (r) {
      if (isGroup(r)) { out.push(r); return; }
      var gap = width - r.length;
      var row = [];
      for (var c = 0; c < gap; c++) row.push(carried[c] == null ? '' : carried[c]);
      for (var i = 0; i < r.length; i++) row.push(r[i]);
      carried = row.slice(0, Math.max(gap, 1) + 1);
      out.push(row);
    });
    return out;
  }

  /* The source shouts its group headings — "PRESENT TENSE". Set them in
     sentence case so they match the other column headings ("Auxiliary verb",
     "Usage example") rather than Title Casing Every Word. Strings that are
     already mixed case are left alone. */
  function titleCase(v) {
    var t = String(v == null ? '' : v).trim();
    if (t !== t.toUpperCase()) return t;
    t = t.toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function isGroup(r) {
    if (!r.length || !String(r[0] || '').trim()) return false;
    for (var i = 1; i < r.length; i++) {
      if (String(r[i] == null ? '' : r[i]).trim()) return false;
    }
    return true;
  }

  /* Rows split on the source's group headings. A heading row inside a table
     never reads as a title however it is styled, so each group becomes its
     own table with its own name and its own header row. */
  function split(t) {
    var groups = [], cur = { title: null, rows: [] };
    normalise(t).forEach(function (r) {
      if (isGroup(r)) {
        if (cur.rows.length) groups.push(cur);
        cur = { title: titleCase(r[0]), rows: [] };
      } else {
        cur.rows.push(r);
      }
    });
    if (cur.rows.length) groups.push(cur);
    return groups;
  }

  /* ---- the row's picture ------------------------------------
     A word's drawing belongs beside the word. The lookup walks the row's
     cells rather than assuming the first one holds the word: the source's
     pronouns table is ragged — some rows drop the "Persons" cell — so the
     pronoun is found by looking for it. Returns '' when nothing in the row
     has a drawing, and the cell is then left empty; a letter tile in its
     place would be decoration pretending to be a picture. */
  function art(row) {
    if (!window.GV_Art) return '';
    for (var i = 0; i < row.length; i++) {
      var a = GV_Art.forWord(row[i], 40);
      if (a) return a;
    }
    return '';
  }

  /* Only three topics put a drawing in the Visualization column: the ones
     whose rows are single words a drawing can actually be of. Elsewhere the
     row is a form, a tense name or a verb in a sentence, and a picture
     beside it is decoration — or worse, wrong: "like" is a verb in the
     main-verbs table and a preposition in the art lookup, and a loose rule
     put the wrong drawing on the row.

     Every other table fills the column with the formation button alone. */
  var ART_TOPICS = { nouns: 1, articles: 1, prepositions: 1 };

  function artUseful(t, rows) {
    if (!ART_TOPICS[t.topic]) return false;
    return rows.some(function (r) { return !!art(r); });
  }

  /* The button's arrow, after the label: right when the formation is closed,
     down when it is open. It sits at the end because that is where the eye
     leaves the button, and the panel it points to opens just below.

     Drawn rather than typed — the \u25B8 that was here renders as a dot
     at the button's 11px, and a reader cannot see which way a dot points.
     currentColor so it follows the label through the open state. */
  var CARET =
    '<span class="fm-caret" aria-hidden="true">' +
      '<svg viewBox="0 0 10 14">' +
        '<path d="M3 2 L8 7 L3 12" fill="none" stroke="currentColor" stroke-width="2" ' +
          'stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
    '</span>';

  function table(t, rows, offset, source, title) {
    var cols = columns(t);
    var hasArt = artUseful(t, rows);
    var hasFm  = !!window.GV_Formation && rows.some(function (r, n) {
      return !!GV_Formation.forRow(t.id, offset + n, r);
    });
    /* The column appears wherever there is something to put in it — a
       drawing, a formation button, or both. A table with neither gets no
       column: a heading over four empty cells names nothing. That is
       main-verbs and auxiliary, whose rows are verb forms rather than
       sentences, so there is nothing to draw and nothing to align. */
    var vizCols = (hasArt ? 1 : 0) + (hasFm ? 1 : 0);
    var span = cols.length + vizCols;

    /* Which columns hold a list of verb forms rather than prose: the tense
       table's auxiliaries, and every tense column of the auxiliary table
       itself. Those get one form per line. */
    var stack = cols.map(function (c, i) {
      return /auxiliary/i.test(String(c || '')) || (t.id === 'auxiliary' && i > 0);
    });

    /* The first column is the one the source repeats: "First Person" twice,
       "Third Person" four times, once per pronoun. Printing it on every row
       makes four rows look like four kinds of third person. A run of equal
       values becomes one cell spanning them, so the column reads as the
       grouping it actually is.

       Only the first column, and only runs that are already adjacent —
       nothing is reordered, and an empty cell never starts a run, or the
       ragged rows (the source drops "Persons" on some) would merge into one
       tall blank. spanAt[n] is how many rows that row's cell covers; 0 means
       the cell above already covers it and this row prints none. */
    var spanAt = [];
    for (var a = 0; a < rows.length;) {
      var v = String(rows[a][0] == null ? '' : rows[a][0]).trim();
      var b = a + 1;
      if (v) { while (b < rows.length &&
                      String(rows[b][0] == null ? '' : rows[b][0]).trim() === v) b++; }
      spanAt[a] = b - a;
      for (var c2 = a + 1; c2 < b; c2++) spanAt[c2] = 0;
      a = b;
    }

    /* When a table is split by group, the group name replaces the first
       column heading — "Present tense" rather than a "Present Tense" title
       sitting above a column called "Tense", which says the same thing twice. */
    return '<div class="table-wrap"><table class="table" data-table="' + t.id + '"><thead><tr>' +
      cols.map(function (c, i) {
        var label = (i === 0 && title) ? title : (cell(c) || '&nbsp;');
        return '<th>' + label + '</th>';
      }).join('') +
      /* The picture and the formation button are one idea — the row, shown
         rather than written — so they sit under one heading instead of two
         blank cells. It was two sr-only labels; a sighted reader got no
         name for either column at all. */
      (vizCols
        ? '<th class="th-viz"' + (vizCols > 1 ? ' colspan="' + vizCols + '"' : '') +
          '>Visualization</th>'
        : '') +
      '</tr></thead><tbody>' +
      rows.map(function (r, n) {
        var idx = offset + n;
        var fm = hasFm && GV_Formation.forRow(t.id, idx, r);
        return '<tr data-drow="' + idx + '" data-dsource="' + source + '">' +
          cols.map(function (_, i) {
            if (i > 0) return '<td>' + cell(r[i], stack[i]) + '</td>';
            if (!spanAt[n]) return '';                 /* covered from above */
            return '<td class="td-group"' +
              (spanAt[n] > 1 ? ' rowspan="' + spanAt[n] + '"' : '') + '>' +
              cell(r[0]) + '</td>';
          }).join('') +
          (hasArt ? '<td class="td-art">' + art(r) + '</td>' : '') +
          (hasFm ? '<td class="td-fm">' + (fm
            ? '<button type="button" class="fm-btn" aria-expanded="false"' +
              ' data-fm="' + t.id + '#' + idx + '" data-span="' + span + '">' +
              'formation' + CARET + '</button>'
            : '') + '</td>' : '') +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  /* The merged first column, and a row inserted into the middle of it.

     A rowspan covers N *consecutive* rows from wherever it sits. Insert the
     formation row inside that run and the cell keeps covering N rows — the
     new one included, the last one dropped. That is what pushed "Plural" up
     into the Persons column and left the panel indented by a stray cell.

     So: if the group cell reaches past the clicked row, grow it by one to
     take the panel in, and let the panel span the remaining columns. The
     label then runs down the left of its own explanation, which is where it
     belongs. If the clicked row is the last of its group, the panel falls
     outside and spans the table whole. */
  function groupCellFor(tr) {
    var rows = [].slice.call(tr.parentNode.rows);
    var i = rows.indexOf(tr);
    for (var k = i; k >= 0; k--) {
      var c = rows[k].cells[0];
      if (c && c.className.indexOf('td-group') > -1) {
        return { cell: c, reachesPast: k + (c.rowSpan || 1) - 1 > i };
      }
    }
    return null;
  }

  /* One listener for the whole document: the formation opens as a row of its
     own directly under the row it explains, so the sentence and its picture
     stay together instead of the picture appearing somewhere else on screen. */
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest && ev.target.closest('.fm-btn');
    if (!btn) return;
    var tr = btn.closest('tr');
    var open = btn.getAttribute('aria-expanded') === 'true';
    var next = tr.nextElementSibling;
    var full = +btn.dataset.span;

    if (open) {
      if (next && next.classList.contains('fm-row')) {
        var g = groupCellFor(tr);
        /* a narrower panel is the one that was taken into a group */
        if (g && next.cells[0] && next.cells[0].colSpan < full) {
          g.cell.rowSpan = Math.max(1, (g.cell.rowSpan || 1) - 1);
        }
        next.remove();
      }
      btn.setAttribute('aria-expanded', 'false');
      return;
    }
    var key = btn.dataset.fm.split('#');
    var spec = GV_Formation.forRow(key[0], Number(key[1]),
      [].slice.call(tr.children).map(function (td) { return td.innerText; }));
    if (!spec) return;

    var grp = groupCellFor(tr);
    var cspan = full;
    if (grp && grp.reachesPast) {
      grp.cell.rowSpan = (grp.cell.rowSpan || 1) + 1;
      cspan = full - 1;
    }
    tr.insertAdjacentHTML('afterend',
      '<tr class="fm-row"><td colspan="' + cspan + '">' +
      GV_Formation.card(spec) + '</td></tr>');
    btn.setAttribute('aria-expanded', 'true');
  });

  function section(t, opts) {
    opts = opts || {};
    var groups = split(t);
    var total = groups.reduce(function (n, g) { return n + g.rows.length; }, 0);
    var offset = 0;

    var body = groups.map(function (g) {
      var html = table(t, g.rows, offset,
                       t.en + (g.title ? ' · ' + g.title : ''), g.title);
      offset += g.rows.length;
      return '<div class="subtable">' + html + '</div>';
    }).join('');

    return '<section id="' + t.id + '" style="margin-bottom:var(--s-6)">' +
      (opts.heading === false ? '' :
        '<div class="section-head"><h2>' + t.en + '</h2>' +
        '<span class="spacer"></span><span class="badge">' + total + ' rows</span></div>') +
      body + '</section>';
  }

  function forTopic(topicId) {
    return (window.GV_CONTENT.tables || []).filter(function (t) { return t.topic === topicId; });
  }

  window.GV_Table = { cell: cell, columns: columns, normalise: normalise,
                      table: table, section: section, forTopic: forTopic, art: art };
})();
