const list = document.getElementById('block-list');
if (list) {
  let dragged = null;
  list.querySelectorAll('.block').forEach(el => {
    el.addEventListener('dragstart', () => dragged = el);
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', async e => {
      e.preventDefault();
      if (!dragged || dragged === el) return;
      const rect = el.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) el.before(dragged);
      else el.after(dragged);
      await fetch('/admin/blocks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...list.querySelectorAll('.block')].map(x => x.dataset.id) })
      });
    });
  });
}

function deleteItem(type, id) {
  if (!confirm('Удалить элемент?')) return;
  const f = document.createElement('form');
  f.method = 'post';
  f.action = `/admin/${type}/${id}/delete`;
  document.body.appendChild(f);
  f.submit();
}

async function uploadImage(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 6 * 1024 * 1024) {
    alert('Файл больше 6 МБ');
    input.value = '';
    return;
  }
  const originalText = input.nextElementSibling ? input.nextElementSibling.innerText : '';
  input.disabled = true;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const r = await fetch('/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: reader.result })
      });
      const j = await r.json();
      if (j.url) {
        const field = input.parentElement.querySelector('.image-url');
        if (field) field.value = j.url;
        let preview = input.parentElement.querySelector('.upload-preview');
        if (!preview) {
          preview = document.createElement('img');
          preview.className = 'upload-preview';
          preview.alt = 'Предпросмотр';
          input.parentElement.appendChild(preview);
        }
        preview.src = j.url;
        preview.style.display = 'block';
      } else {
        alert(j.error || 'Ошибка загрузки');
      }
    } catch (e) {
      alert('Ошибка при отправке файла: ' + e.message);
    } finally {
      input.disabled = false;
    }
  };
  reader.readAsDataURL(file);
}

// Automatically open block details if navigated via hash #block-{id}
window.addEventListener('DOMContentLoaded', () => {
  if (location.hash && location.hash.startsWith('#block-')) {
    const el = document.querySelector(location.hash);
    if (el && el.tagName === 'DETAILS') {
      el.open = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});
