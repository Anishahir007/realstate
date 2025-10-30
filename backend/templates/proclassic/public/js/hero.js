(function(){
  const carousels = document.querySelectorAll('.pc-hero-carousel');
  carousels.forEach(root => {
    const slides = Array.from(root.querySelectorAll('.pc-hero-slide'));
    if (slides.length <= 1) return;
    const dotsWrap = root.querySelector('.pc-hero-dots');
    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => go(i));
      dotsWrap.appendChild(b);
      return b;
    });
    const prev = root.querySelector('.pc-hero-prev');
    const next = root.querySelector('.pc-hero-next');
    let idx = 0;
    let timer = null;
    const interval = Math.max(2500, parseInt(root.getAttribute('data-interval'), 10) || 5000);

    function render(){
      slides.forEach((s,i)=> s.classList.toggle('active', i===idx));
      dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
    }
    function go(n){ idx = (n + slides.length) % slides.length; render(); restart(); }
    function start(){ timer = setInterval(()=> go(idx+1), interval); }
    function stop(){ if (timer) { clearInterval(timer); timer = null; } }
    function restart(){ stop(); start(); }

    prev && prev.addEventListener('click', ()=> go(idx-1));
    next && next.addEventListener('click', ()=> go(idx+1));
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    render(); start();
  });
})();


