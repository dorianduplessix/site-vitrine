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

document.querySelectorAll('[data-review-carousel]').forEach(carousel=>{
  const track=carousel.querySelector('[data-review-track]');
  const previous=document.querySelector('[data-review-prev]');
  const next=document.querySelector('[data-review-next]');
  if(!track||!previous||!next)return;

  const cardStep=()=>{
    const card=track.querySelector('.review');
    if(!card)return track.clientWidth;
    const gap=parseFloat(getComputedStyle(track).columnGap)||0;
    return card.getBoundingClientRect().width+gap;
  };

  const updateControls=()=>{
    previous.disabled=track.scrollLeft<=2;
    next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;
  };

  previous.addEventListener('click',()=>track.scrollBy({left:-cardStep(),behavior:'smooth'}));
  next.addEventListener('click',()=>track.scrollBy({left:cardStep(),behavior:'smooth'}));
  track.addEventListener('scroll',updateControls,{passive:true});
  window.addEventListener('resize',updateControls);
  updateControls();
});

const analyticsId='G-32WC2V2WYV';
const consentKey='duplessix-analytics-consent';
const leadMarkerKey='duplessix-valid-form-submission';

const consumeLeadMarker=()=>{
  if(!/^\/merci(?:\.html)?\/?$/.test(location.pathname))return null;

  const raw=sessionStorage.getItem(leadMarkerKey);
  sessionStorage.removeItem(leadMarkerKey);
  if(!raw)return null;

  try{
    const marker=JSON.parse(raw);
    const submittedAt=Number(marker.submittedAt);
    if(!Number.isFinite(submittedAt)||Date.now()-submittedAt>30*60*1000)return null;
    return marker;
  }catch{
    return null;
  }
};

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

  const leadMarker=consumeLeadMarker();
  if(leadMarker){
    window.gtag('event','generate_lead',{
      method:'contact_form',
      service:leadMarker.service||'non_precise'
    });
  }
};

const closeConsentBanner=()=>document.querySelector('.cookie-banner')?.remove();

const trackAnalyticsEvent=(eventName,parameters={})=>{
  if(!window.duplessixAnalyticsLoaded||typeof window.gtag!=='function')return;
  window.gtag('event',eventName,parameters);
};

const contactForm=document.querySelector('form[name="demande-devis"]');
if(contactForm){
  contactForm.addEventListener('submit',()=>{
    const service=contactForm.elements.service?.value||'';
    sessionStorage.setItem(leadMarkerKey,JSON.stringify({
      submittedAt:Date.now(),
      service
    }));
  });
}

document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link)return;

  const href=link.getAttribute('href')||'';
  const eventDetails={
    link_url:link.href,
    link_text:link.textContent.trim().replace(/\s+/g,' ').slice(0,100),
    page_path:location.pathname,
    placement:link.closest('.mobile-contact-bar')?'mobile_sticky_bar':'page_content'
  };

  if(href.startsWith('tel:')){
    trackAnalyticsEvent('phone_click',eventDetails);
    return;
  }

  if(href.startsWith('mailto:')){
    trackAnalyticsEvent('email_click',eventDetails);
    return;
  }

  if(link.matches('a.btn[href="/contact"],a.btn[href$="/contact"],.mobile-contact-bar__quote')){
    trackAnalyticsEvent('quote_request_click',eventDetails);
    return;
  }

  if(link.matches('[data-google-review]')){
    trackAnalyticsEvent('google_review_click',eventDetails);
  }
});

const saveConsent=value=>{
  localStorage.setItem(consentKey,value);
  document.body.classList.remove('has-cookie-banner');
  closeConsentBanner();
  if(value==='granted')startAnalytics();
};

const showConsentBanner=()=>{
  if(document.querySelector('.cookie-banner'))return;
  document.body.classList.add('has-cookie-banner');
  const banner=document.createElement('section');
  banner.className='cookie-banner';
  banner.setAttribute('role','dialog');
  banner.setAttribute('aria-labelledby','cookie-title');
  banner.innerHTML=`<div class="cookie-banner__content"><div><h2 id="cookie-title">Mesure d’audience</h2><p>Ce site utilise Google Analytics uniquement avec votre accord pour comprendre sa fréquentation. Vous pouvez accepter ou refuser sans conséquence sur votre navigation. <a href="/mentions#cookies">En savoir plus</a>.</p></div><div class="cookie-banner__actions"><button class="btn secondary" type="button" data-consent="denied">Refuser</button><button class="btn" type="button" data-consent="granted">Accepter</button></div></div>`;
  banner.querySelectorAll('[data-consent]').forEach(button=>{
    button.addEventListener('click',()=>saveConsent(button.dataset.consent));
  });
  document.body.appendChild(banner);
};

const addMobileContactBar=()=>{
  if(/^\/(?:contact|merci)(?:\.html)?\/?$/.test(location.pathname))return;
  const bar=document.createElement('nav');
  bar.className='mobile-contact-bar';
  bar.setAttribute('aria-label','Contact rapide');
  bar.innerHTML='<a class="mobile-contact-bar__call" href="tel:+33659735020">Appeler</a><a class="mobile-contact-bar__quote" href="/contact">Demander un devis</a>';
  document.body.appendChild(bar);
  document.body.classList.add('has-mobile-contact-bar');
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

addMobileContactBar();
addConsentSettingsLink();
const storedConsent=localStorage.getItem(consentKey);
if(storedConsent==='granted')startAnalytics();
else if(storedConsent!=='denied')showConsentBanner();
