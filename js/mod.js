const PW_KEY = 'bakesale:modpw';
const LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
let pw = sessionStorage.getItem(PW_KEY) || '';

const modApi = (body) => api('/api/mod', { ...body, password: pw });

function render(s) {
  $('#date').value = s.date || '';
  $('#lockbox').value = s.lockbox || '';
  $('#goal').value = s.goal;
  $('#curTotal').textContent = money(s.total);
  $('#total').value = Number(s.total).toFixed(2);
  $('#calcTotal').textContent = money(s.items.reduce((sum, it) => sum + it.sold * it.price, 0));

  $('#items').innerHTML = s.items.length
    ? s.items.map((it) => `<tr data-id="${esc(it.id)}">
        <td><input type="text" name="name" maxlength="60" value="${esc(it.name)}"></td>
        <td><div class="money-in"><input type="number" name="price" min="0" step="0.01" value="${it.price}"></div></td>
        <td><input type="number" name="stock" min="0" step="1" value="${it.stock}"></td>
        <td><input type="number" name="sold" min="0" step="1" value="${it.sold}"></td>
        <td class="btns"><button class="btn small" data-do="save">Save</button> <button class="btn small danger" data-do="delete">Delete</button></td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="empty">No items yet.</td></tr>';

  $('#vols').innerHTML = s.periods.map((list, i) => `
    <div class="period" style="grid-template-columns:150px 1fr">
      <div class="pname"><div class="pnum">${i + 1}</div><b>${LABELS[i]} Period</b></div>
      <div class="chips">${list.length
        ? list.map((v) => `<span class="chip">${esc(v.name)}<button data-p="${i}" data-id="${esc(v.id)}" aria-label="Remove ${esc(v.name)}">×</button></span>`).join('')
        : '<span class="nobody">No volunteers yet</span>'}</div>
    </div>`).join('');
}

function showPanel(s) {
  $('#loginCard').hidden = true;
  $('#panel').hidden = false;
  render(s);
}

async function login(password) {
  pw = password;
  const j = await modApi({ action: 'login' });
  sessionStorage.setItem(PW_KEY, pw);
  showPanel(j.state);
}

async function run(body, okMsg) {
  try {
    const j = await modApi(body);
    render(j.state);
    if (okMsg) toast(okMsg);
  } catch (err) { toast(err.message, true); }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await login($('#pw').value); }
  catch (err) { toast(err.message, true); $('#pw').select(); }
});

$('#infoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  run({ action: 'setInfo', date: $('#date').value, lockbox: $('#lockbox').value, goal: $('#goal').value }, 'Details saved');
});

$('#totalForm').addEventListener('submit', (e) => {
  e.preventDefault();
  run({ action: 'setTotal', total: $('#total').value }, 'Total updated');
});

$('#recalc').addEventListener('click', () => run({ action: 'recalcTotal' }, 'Total recalculated from sales'));
$('#reload').addEventListener('click', () => run({ action: 'login' }, 'Refreshed'));

$('#items').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-do]');
  if (!b) return;
  const row = b.closest('tr');
  const id = row.dataset.id;
  if (b.dataset.do === 'delete') {
    const name = row.querySelector('[name=name]').value;
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    return run({ action: 'deleteItem', id }, 'Item deleted');
  }
  const v = (n) => row.querySelector(`[name=${n}]`).value;
  run({ action: 'setItem', id, name: v('name'), price: v('price'), stock: v('stock'), sold: v('sold') }, 'Item saved');
});

$('#vols').addEventListener('click', (e) => {
  const b = e.target.closest('.chip button');
  if (b) run({ action: 'removeVolunteer', period: Number(b.dataset.p), id: b.dataset.id }, 'Removed');
});

$('#logout').addEventListener('click', () => {
  sessionStorage.removeItem(PW_KEY);
  location.reload();
});

if (pw) login(pw).catch(() => sessionStorage.removeItem(PW_KEY));
