(function(){
  const root = document.querySelector('.pc-testimonials');
  if (!root) return;
  const container = root.querySelector('.pc-tslides');
  const cards = Array.from(container.querySelectorAll('.pc-tcard'));
  const dotsWrap = root.querySelector('.pc-tdots');
  const interval = Math.max(3000, parseInt(root.getAttribute('data-interval'), 10) || 6000);
  let idx = 0; let timer = null;

  function render() {
    cards.forEach((c,i)=> c.classList.toggle('active', i===idx));
    dotsWrap.querySelectorAll('button').forEach((b,i)=> b.classList.toggle('active', i===idx));
  }
  function go(n) { idx = (n + cards.length) % cards.length; render(); restart(); }
  function start(){ stop(); timer = setInterval(()=> go(idx+1), interval); }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }
  function restart(){ start(); }

  cards.forEach((_,i)=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', ()=> go(i));
    dotsWrap.appendChild(b);
  });

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  render(); start();
})();


