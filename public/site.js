const menu=document.querySelector('.menu');
const nav=document.querySelector('.topbar nav');
if(menu&&nav){
  menu.addEventListener('click',()=>nav.classList.toggle('mobile-open'));
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('mobile-open')));
}
