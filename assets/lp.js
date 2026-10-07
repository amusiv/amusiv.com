(function () {
  // ?shot を付けると確認用の撮影モード（アニメーションと固定ボタンを止める）
  if (/[?&]shot/.test(location.search)) {
    document.documentElement.classList.add('shot');
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
  }
  var hd = document.getElementById('hd');
  var spbar = document.querySelector('.spbar');
  var fvCta = document.querySelector('.kv__cta');
  var contact = document.getElementById('contact');
  var contactVisible = false, fvVisible = true;

  function onScroll() { hd.classList.toggle('is-scrolled', window.scrollY > 20); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function updateBar() { spbar.classList.toggle('is-on', !fvVisible && !contactVisible); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { fvVisible = es[0].isIntersecting; updateBar(); }).observe(fvCta);
    new IntersectionObserver(function (es) { contactVisible = es[0].isIntersecting; updateBar(); }).observe(contact);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // 申し込みフォーム：Google Apps Script のウェブアプリ（_src/form.gs）へ送る
  var rq = document.getElementById('rq');
  if (rq) {
    var t0 = Date.now();
    var msg = rq.querySelector('.rq__msg');
    var btn = rq.querySelector('.rq__submit');
    var label = btn.innerHTML;
    var field = function (name) { return rq.elements.namedItem(name); };
    var showMsg = function (text) { msg.textContent = text; msg.hidden = false; };
    // ご用件（見本の依頼／相談・質問）と「URLがない」に合わせて、出す欄と必須の欄を切り替える
    var sync = function () {
      var sample = rq.querySelector('input[name="type"]:checked').value === 'sample';
      var noUrl = field('noUrl').checked;
      rq.dataset.type = sample ? 'sample' : 'contact';
      rq.toggleAttribute('data-nourl', noUrl);
      var set = function (name, on, required) { var f = field(name); f.disabled = !on; f.required = required; };
      set('shop', true, sample);
      set('url', sample && !noUrl, sample && !noUrl);
      set('noUrl', sample, false);
      set('area', sample && noUrl, sample && noUrl);
      set('note', true, !sample);
      var note = field('note');
      note.placeholder = sample ? note.dataset.phSample : note.dataset.phContact;
    };
    rq.addEventListener('change', function (ev) {
      if (ev.target.name === 'type' || ev.target.name === 'noUrl') { sync(); msg.hidden = true; }
    });
    sync();
    // KVの「相談したい」などから来たときは、ご用件を切り替えておく
    document.querySelectorAll('[data-form-type]').forEach(function (a) {
      a.addEventListener('click', function () {
        var radio = rq.querySelector('input[name="type"][value="' + a.dataset.formType + '"]');
        if (radio) { radio.checked = true; sync(); }
      });
    });
    rq.addEventListener('submit', function (ev) {
      ev.preventDefault();
      msg.hidden = true;
      rq.classList.add('was-validated');
      var bad = rq.querySelector(':invalid');
      if (bad) {
        showMsg(bad.type === 'email' && bad.value ? 'メールアドレスをご確認ください。' : '必須の欄をご入力ください。');
        bad.focus();
        return;
      }
      var data = new URLSearchParams(new FormData(rq));
      data.append('elapsed', String(Date.now() - t0));
      btn.disabled = true;
      btn.textContent = '送信しています…';
      fetch(rq.action, { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.error || 'error');
          var type = rq.dataset.type;
          var cases = [type, type === 'sample' ? (rq.hasAttribute('data-nourl') ? 'sample-nourl' : 'sample-url') : ''];
          var done = document.getElementById('rq-done');
          done.querySelectorAll('[data-case]').forEach(function (p) { p.hidden = cases.indexOf(p.dataset.case) < 0; });
          rq.hidden = true;
          done.hidden = false;
          done.focus();
        })
        .catch(function () {
          showMsg('送信できませんでした。時間をおいてもう一度お試しいただくか、下のメールアドレスまでご連絡ください。');
          btn.disabled = false;
          btn.innerHTML = label;
        });
    });
  }
})();
