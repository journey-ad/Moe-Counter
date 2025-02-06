(function () {
  const generate_btn = document.getElementById('get');
  const changePw_btn = document.getElementById('changePw');
  const reset_btn = document.getElementById('reset');
  const img = document.getElementById('result');
  const code = document.getElementById('code');

  const elements = {
    name: document.getElementById('name'),
    theme: document.getElementById('theme'),
    padding: document.getElementById('padding'),
    offset: document.getElementById('offset'),
    align: document.getElementById('align'),
    scale: document.getElementById('scale'),
    pixelated: document.getElementById('pixelated'),
    darkmode: document.getElementById('darkmode'),
    num: document.getElementById('num'),
    prefix: document.getElementById('prefix'),
    old_password: document.getElementById('old_password'),
    new_password: document.getElementById('new_password')
  };

  generate_btn.addEventListener('click', throttle(handleGenerateButtonClick, 500));
  reset_btn.addEventListener('click', throttle(handleResetButtonClick, 500));
  changePw_btn.addEventListener('click', throttle(handleChangePwButtonClick, 500));
  code.addEventListener('click', selectCodeText);

  const mainTitle = document.querySelector('#main_title i');
  const themes = document.querySelector('#themes');
  const moreTheme = document.querySelector('#more_theme');

  mainTitle.addEventListener('click', throttle(() => party.sparkles(document.documentElement, { count: party.variation.range(40, 100) }), 1000));
  moreTheme.addEventListener('click', scrollToThemes);

  // When the botton 'Generate' clicked
  function handleGenerateButtonClick() {
    const { name, theme, padding, offset, scale, pixelated, darkmode, num } = elements;
    const nameValue = name.value.trim();

    if (!nameValue) {
      alert('Please input counter name.');
      return;
    }

    const params = {
      name: nameValue,
      theme: theme.value || 'moebooru',
      padding: padding.value || '7',
      offset: offset.value || '0',
      align: align.value || 'top',
      scale: scale.value || '1',
      pixelated: pixelated.checked ? '1' : '0',
      darkmode: darkmode.value || 'auto'
    };

    if (num.value > 0) {
      params.num = num.value;
    }
    if (prefix.value !== '') {
      params.prefix = prefix.value;
    }

    const query = new URLSearchParams(params).toString();
    const imgSrc = `${__global_data.site}/@${nameValue}?${query}`;

    img.src = `${imgSrc}&_=${Math.random()}`;
    generate_btn.setAttribute('disabled', '');

    img.onload = () => {
      img.scrollIntoView({ block: 'start', behavior: 'smooth' });
      code.textContent = imgSrc;
      code.style.visibility = 'visible';
      party.confetti(generate_btn, { count: party.variation.range(20, 40) });
      generate_btn.removeAttribute('disabled');
    };

    img.onerror = async () => {
      try {
        const res = await fetch(img.src);
        if (!res.ok) {
          const { message } = await res.json();
          alert(message);
        }
      } finally {
        generate_btn.removeAttribute('disabled');
      }
    };
  }

  // When the botton 'Change Password' clicked
  function handleChangePwButtonClick() {
    const { name, old_password, new_password } = elements;
    const nameValue = name.value.trim();
    const oldPwValue = old_password.value.trim();
    const newPwValue = new_password.value.trim();
    if (!nameValue) {
      alert('Please input counter name.');
      return;
    }
    const postData = {
      name: nameValue,
      old_password: oldPwValue,
      new_password: newPwValue
    };
    const postUrl = `${__global_data.site}/change_password`;
    fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            const errorMessage = errorData.message;
            throw new Error(errorMessage);
          })
        } else
          return response.json();
      })
      .then(data => {
        alert(data.message || "Password changed successfully.");
        location.reload();
      })
      .catch(error => {
        console.log('Error:', error)
        alert('Failed to reset the password: ' + (error.message || 'unknown error'));
      });
  }

  // When the botton 'Reset' clicked
  function handleResetButtonClick() {
    const { name, old_password } = elements;
    const nameValue = name.value.trim();
    const oldPwValue = old_password.value.trim();
    if (!nameValue) {
      alert('Please input counter name.');
      return;
    }
    const postData = {
      name: nameValue,
      password: oldPwValue
    };
    const postUrl = `${__global_data.site}/reset`;
    fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            const errorMessage = errorData.message;
            throw new Error(errorMessage);
          })
        } else
          return response.json();
      })
      .then(data => {
        alert(data.message || "Counter reset successfully.");
      })
      .catch(error => {
        console.log('Error:', error)
        alert('Failed to reset the counter: ' + (error.message || 'unknown error'));
      });
  }

  function selectCodeText(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function scrollToThemes() {
    if (!themes.hasAttribute('open')) {
      party.sparkles(moreTheme.querySelector('h3'), { count: party.variation.range(20, 40) });
      themes.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  function throttle(fn, threshold = 250) {
    let last, deferTimer;
    return function (...args) {
      const now = Date.now();
      if (last && now < last + threshold) {
        clearTimeout(deferTimer);
        deferTimer = setTimeout(() => {
          last = now;
          fn.apply(this, args);
        }, threshold);
      } else {
        last = now;
        fn.apply(this, args);
      }
    };
  }
})();

// Lazy Load
(() => {
  function lazyLoad(options = {}) {
    const { selector = 'img[data-src]:not([src])', loading = '', failed = '', rootMargin = '200px', threshold = 0.01 } = options;

    const images = document.querySelectorAll(selector);

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          observer.unobserve(img);

          img.onerror = failed ? () => { img.src = failed; img.setAttribute('data-failed', ''); } : null;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-loading');
        }
      });
    }, { rootMargin, threshold });

    images.forEach(img => {
      if (loading) {
        img.src = loading;
        img.setAttribute('data-loading', '');
      }
      observer.observe(img);
    });
  }

  const lazyLoadOptions = {
    selector: 'img[data-src]:not([src])',
    loading: `${__global_data.site}/img/loading.svg`,
    failed: `${__global_data.site}/img/failed.svg`,
    rootMargin: '200px',
    threshold: 0.01
  };

  document.readyState === 'loading'
    ? document.addEventListener("DOMContentLoaded", () => lazyLoad(lazyLoadOptions))
    : lazyLoad(lazyLoadOptions);
})();

// Back to top
(() => {
  let isShow = false, lock = false;
  const btn = document.querySelector('.back-to-top');

  const handleScroll = () => {
    if (lock) return;
    if (document.body.scrollTop >= 1000) {
      if (!isShow) {
        btn.classList.add('load');
        isShow = true;
      }
    } else if (isShow) {
      btn.classList.remove('load');
      isShow = false;
    }
  };

  const handleClick = () => {
    lock = true;
    btn.classList.add('ani-leave');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      btn.classList.remove('ani-leave');
      btn.classList.add('leaved');
    }, 390);

    setTimeout(() => btn.classList.add('ending'), 120);
    setTimeout(() => btn.classList.remove('load'), 1500);

    setTimeout(() => {
      lock = false;
      isShow = false;
      btn.classList.remove('leaved', 'ending');
    }, 2000);
  };

  window.addEventListener('scroll', handleScroll);
  btn.addEventListener('click', handleClick);
})();

// Prevent safari gesture
(() => {
  document.addEventListener('gesturestart', e => e.preventDefault());
})();
