const MY_SIGNUPS = 'bakesale:mySignups';
const LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
let busy = false;

// Build the six rows once so typing in an input is never interrupted by a refresh.
$('#periods').innerHTML = LABELS.map((l, i) => `
  <div class="period">
    <div class="pname"><div class="pnum">${i + 1}</div><b>${l} Period</b></div>
    <div class="chips" id="chips-${i}"></div>
    <form class="signup" data-p="${i}" autocomplete="off">
      <input type="text" maxlength="40" placeholder="Your name" aria-label="Your name for ${l} period" required>
      <button class="btn gold" type="submit">Sign up</button>
    </form>
  </div>`).join('');

function render(s) {
  const my = new Set(mine(MY_SIGNUPS));
  s.periods.forEach((list, i) => {
    $('#chips-' + i).innerHTML = list.length
      ? list.map((v) => `<span class="chip${my.has(v.id) ? ' mine' : ''}">${esc(v.name)}${
          my.has(v.id) ? `<button data-p="${i}" data-id="${esc(v.id)}" title="Remove my name" aria-label="Remove ${esc(v.name)}">×</button>` : ''
        }</span>`).join('')
      : '<span class="nobody">No volunteers yet</span>';
  });
  $('#dateLine').textContent = `Bake sale: ${fmtDate(s.date)}. Put your name next to the period you can work the table.`;
}

async function refresh() {
  if (busy) return;
  const j = await api('/api/state');
  dbBanner(j.dbConnected);
  if (!busy) render(j.state);
}

$('#periods').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const input = form.querySelector('input');
  busy = true;
  try {
    const j = await act({ action: 'addVolunteer', period: Number(form.dataset.p), name: input.value });
    setMine(MY_SIGNUPS, [...mine(MY_SIGNUPS), j.id]);
    render(j.state);
    input.value = '';
    toast(`Signed up for ${LABELS[form.dataset.p]} period!`);
  } catch (err) { toast(err.message, true); }
  busy = false;
});

$('#periods').addEventListener('click', async (e) => {
  const b = e.target.closest('.chip button');
  if (!b) return;
  busy = true;
  try {
    const j = await act({ action: 'removeVolunteer', period: Number(b.dataset.p), id: b.dataset.id });
    setMine(MY_SIGNUPS, mine(MY_SIGNUPS).filter((x) => x !== b.dataset.id));
    render(j.state);
  } catch (err) { toast(err.message, true); }
  busy = false;
});

poll(refresh);
