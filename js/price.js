const MY_ITEMS = 'bakesale:myItems';
let state = null;
let busy = false;

function render(s) {
  state = s;
  // progress
  const pct = s.goal > 0 ? Math.min(100, (s.total / s.goal) * 100) : 0;
  $('#raised').firstChild.nodeValue = money(s.total) + ' ';
  $('#goalText').textContent = 'of ' + money(s.goal) + ' goal';
  $('#bar').style.width = pct + '%';
  $('#pct').textContent = Math.floor(pct) + '%';
  const left = s.goal - s.total;
  $('#toGo').textContent = left > 0 ? money(left) + ' to go' : 'Goal reached! 🎉';

  $('#date').textContent = fmtDate(s.date);
  $('#lockbox').textContent = s.lockbox || '—';

  // menu
  $('#menu').innerHTML = s.items.length
    ? s.items.map((it) => `<li><span class="name">${esc(it.name)}</span><span class="dots"></span><span class="price">${money(it.price)}</span></li>`).join('')
    : '<li class="empty">No items yet. Add the first one!</li>';

  // stock
  $('#stockList').innerHTML = s.items.length
    ? s.items.map((it) => {
        const totalQty = it.stock + it.sold;
        const pctLeft = totalQty ? (it.stock / totalQty) * 100 : 0;
        const out = it.stock <= 0;
        return `<div class="stock-item${out ? ' out' : ''}">
          <div class="row"><span class="nm">${esc(it.name)}</span><span class="pr">${money(it.price)}</span></div>
          <div class="row">
            <div><div class="left">${it.stock} <small>left</small></div>
              ${out ? '<div class="soldout">Sold out</div>' : `<div class="pr">${it.sold} sold</div>`}</div>
            <button class="minus" data-id="${esc(it.id)}" ${out ? 'disabled' : ''} aria-label="Sold one ${esc(it.name)}">−</button>
          </div>
          <div class="mini-bar"><div style="width:${pctLeft}%"></div></div>
        </div>`;
      }).join('')
    : '<div class="empty">Items you add will show up here with their stock.</div>';

  // undo availability
  const ids = new Set(s.items.map((i) => i.id));
  const myList = mine(MY_ITEMS).filter((id) => ids.has(id));
  setMine(MY_ITEMS, myList);
  $('#undo').disabled = myList.length === 0;
}

async function refresh() {
  if (busy) return;
  const j = await api('/api/state');
  dbBanner(j.dbConnected);
  if (!busy) render(j.state);
}

$('#addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  busy = true;
  try {
    const j = await act({ action: 'addItem', name: $('#name').value, price: $('#price').value, stock: $('#stock').value });
    setMine(MY_ITEMS, [...mine(MY_ITEMS), j.id]);
    render(j.state);
    e.target.reset();
    $('#name').focus();
    toast('Added!');
  } catch (err) { toast(err.message, true); }
  busy = false;
});

$('#undo').addEventListener('click', async () => {
  const list = mine(MY_ITEMS);
  const id = list[list.length - 1];
  if (!id) return;
  busy = true;
  try {
    const j = await act({ action: 'undoAdd', id });
    setMine(MY_ITEMS, list.slice(0, -1));
    render(j.state);
    toast(`Removed "${j.removed}"`);
  } catch (err) { toast(err.message, true); }
  busy = false;
});

$('#stockList').addEventListener('click', async (e) => {
  const b = e.target.closest('.minus');
  if (!b || b.disabled) return;
  b.disabled = true;
  busy = true;
  try {
    const j = await act({ action: 'sell', id: b.dataset.id });
    render(j.state);
  } catch (err) { toast(err.message, true); b.disabled = false; }
  busy = false;
});

poll(refresh);
