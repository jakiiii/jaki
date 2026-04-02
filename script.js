document.getElementById('year').textContent=new Date().getFullYear();
const navToggle=document.querySelector('.nav-toggle');
const navLinks=document.querySelector('.nav-links');
navToggle?.addEventListener('click',()=>{
 navLinks.classList.toggle('active');
});