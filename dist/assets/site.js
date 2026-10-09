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

const analyticsId='G-32WC2V2WYV';
const consentKey='duplessix-analytics-consent';

const startAnalytics=()=>{
  if(window.duplessixAnalyticsLoaded)return;
  window.duplessixAnalyticsLoaded=true;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  window.gtag('consent','default',{
    analytics_storage:'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    wait_for_update:500
  });
  window.gtag('consent','update',{
    analytics_storage:'granted',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied'
  });
  window.gtag('js',new Date());
  window.gtag('config',analyticsId,{
    allow_google_signals:false,
    allow_ad_personalization_signals:false,
    cookie_expires:34128000
  });

  const script=document.createElement('script');
  script.async=true;
  script.src=`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.appendChild(script);

  if(location.pathname==='/merci'||location.pathname==='/merci.html'){
    window.gtag('event','generate_lead');
  }
};

const closeConsentBanner=()=>document.querySelector('.cookie-banner')?.remove();

const saveConsent=value=>{
  localStorage.setItem(consentKey,value);
  closeConsentBanner();
  if(value==='granted')startAnalytics();
};

const showConsentBanner=()=>{
  if(document.querySelector('.cookie-banner'))return;
  const banner=document.createElement('section');
  banner.className='cookie-banner';
  banner.setAttribute('role','dialog');
  banner.setAttribute('aria-labelledby','cookie-title');
  banner.innerHTML=`<div class="cookie-banner__content"><div><h2 id="cookie-title">Mesure d’audience</h2><p>Ce site utilise Google Analytics uniquement avec votre accord pour comprendre sa fréquentation. Vous pouvez accepter ou refuser sans conséquence sur votre navigation. <a href="/mentions.html#cookies">En savoir plus</a>.</p></div><div class="cookie-banner__actions"><button class="btn secondary" type="button" data-consent="denied">Refuser</button><button class="btn" type="button" data-consent="granted">Accepter</button></div></div>`;
  banner.querySelectorAll('[data-consent]').forEach(button=>{
    button.addEventListener('click',()=>saveConsent(button.dataset.consent));
  });
  document.body.appendChild(banner);
};

const addConsentSettingsLink=()=>{
  const footerLinks=document.querySelector('.footer-links');
  if(!footerLinks||footerLinks.querySelector('[data-manage-consent]'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='footer-cookie-link';
  button.dataset.manageConsent='';
  button.textContent='Gérer les cookies';
  button.addEventListener('click',()=>{
    localStorage.removeItem(consentKey);
    location.reload();
  });
  footerLinks.appendChild(button);
};

addConsentSettingsLink();
const storedConsent=localStorage.getItem(consentKey);
if(storedConsent==='granted')startAnalytics();
else if(storedConsent!=='denied')showConsentBanner();
