const toggle=document.querySelector('.nav-toggle');
const links=document.querySelector('.nav-links');

if(toggle&&links){
  const closeMenu=()=>{
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  };

  toggle.addEventListener('click',()=>{
    const open=links.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });

  links.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&links.classList.contains('open')){
      closeMenu();
      toggle.focus();
    }
  });
}
