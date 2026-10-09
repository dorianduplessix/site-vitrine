import {readFile,readdir,mkdir,writeFile,unlink} from 'node:fs/promises';
import {basename,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const contentDir=join(root,'content','realisations');
const outputDir=join(root,'dist','realisations');
const distDir=join(root,'dist');

const services={
  'renovation-salle-deau':{label:'Rénovation de salle d’eau',url:'/services/renovation-salle-deau.html',file:'renovation-salle-deau.html'},
  'enduit-peinture-placo':{label:'Enduit, peinture & placo',url:'/services/enduit-peinture-placo.html',file:'enduit-peinture-placo.html'},
  'petits-travaux':{label:'Dépannage & petits travaux',url:'/services/petits-travaux.html',file:'petits-travaux.html'},
  'exterieurs':{label:'Extérieurs & menuiseries',url:'/services/exterieurs.html',file:'exterieurs.html'},
  'maintenance-immobiliere':{label:'Maintenance immobilière',url:'/services/maintenance-immobiliere.html',file:'maintenance-immobiliere.html'}
};

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));

const normalizePath=value=>String(value??'').startsWith('/')?String(value):`/${value}`;
const slugFromFile=file=>basename(file,'.json');
const pageUrl=slug=>`/realisations/${slug}.html`;

function header(){
  return `<a class="skip-link" href="#contenu">Aller au contenu</a>
  <header class="site-header"><nav class="nav wrap"><a class="brand" href="/"><span class="brand-mark">D</span><span>Duplessix Multi-Services<small>Rénovation & maintenance</small></span></a><button class="nav-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="navigation-principale">☰</button><div class="nav-links" id="navigation-principale"><a href="/#services">Services</a><a href="/realisations.html">Réalisations</a><a href="/a-propos.html">Dorian</a><a href="/contact.html">Contact</a></div><a class="btn" href="tel:+33659735020">Appeler</a></nav></header>`;
}

function footer(){
  return `<footer class="footer footer-compact"><div class="footer-bottom wrap"><span>© 2026 Duplessix Multi-Services</span><div class="footer-links"><a href="/mentions.html">Mentions légales</a><a href="tel:+33659735020">06 59 73 50 20</a><a href="mailto:dorian.duplessix@gmail.com">dorian.duplessix@gmail.com</a></div></div></footer><script src="/assets/site.js?v=ga4-consent-1"></script>`;
}

function head({title,description,canonical,image,type='website'}){
  const absolute=`https://renovation-guidel.fr${canonical}`;
  const imageMeta=image?`<meta property="og:image" content="https://renovation-guidel.fr${esc(normalizePath(image))}">`:'';
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${absolute}">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/styles.css?v=realisations-ui-2">
  <meta name="theme-color" content="#102a34">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="Duplessix Multi-Services">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${absolute}">
${imageMeta?`  ${imageMeta}\n`:''}  <meta name="twitter:card" content="summary_large_image">
</head>`;
}

function serviceLinks(entry){
  return entry.services.map(key=>services[key]).filter(Boolean);
}

function card(entry,{compact=false}={}){
  const linked=serviceLinks(entry);
  return `<article class="realisation-card${compact?' compact':''}"><a href="${pageUrl(entry.slug)}"><div class="realisation-card-image"><img src="${esc(normalizePath(entry.cover))}" alt="${esc(entry.cover_alt||entry.title)}" loading="lazy" decoding="async"></div><div class="realisation-card-copy"><p class="eyebrow">${esc(linked.map(item=>item.label).join(' · '))}</p><h${compact?'3':'2'}>${esc(entry.title)}</h${compact?'3':'2'}><p>${esc(entry.summary)}</p><span class="text-link">Voir le chantier →</span></div></a></article>`;
}

function renderListing(entries){
  const cards=entries.map(entry=>card(entry)).join('');
  return `${head({title:'Réalisations — Duplessix Multi-Services',description:'Découvrez les rénovations, réparations et aménagements réalisés par Dorian Duplessix autour de Guidel.',canonical:'/realisations.html'})}
<body>
  ${header()}
  <main id="contenu">
    <section class="page-hero"><div class="wrap"><div class="breadcrumbs"><a href="/">Accueil</a> / Réalisations</div><p class="eyebrow">Carnet de chantiers</p><h1>Des réalisations expliquées en détail.</h1><p class="lead">Chaque fiche présente le besoin, les travaux effectués et les photos du chantier. De nouvelles réalisations seront ajoutées régulièrement.</p></div></section>
    <section class="section white"><div class="wrap"><div class="realisation-grid">${cards}</div></div></section>
    <section class="cta"><div class="cta-box wrap"><div><h2>Vous avez un projet similaire ?</h2><p>Présentez votre besoin directement à Dorian.</p></div><div class="cta-actions"><a class="btn" href="/contact.html">Demander un devis</a></div></div></section>
  </main>
  ${footer()}
</body>
</html>`;
}

function renderDetail(entry){
  const linked=serviceLinks(entry);
  const location=entry.city?`<span>${esc(entry.city)}</span>`:'';
  const published=entry.date?new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date(entry.date)):'';
  const date=published?`<span>Publié le ${esc(published)}</span>`:'';
  const sections=(entry.sections||[]).map(section=>`<section class="realisation-section"><h2>${esc(section.title)}</h2>${(section.paragraphs||[]).map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</section>`).join('');
  const steps=(entry.steps||[]).length?`<section class="realisation-section"><h2>Travaux réalisés</h2><ul>${entry.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ul></section>`:'';
  const gallery=(entry.gallery||[]).length?`<section class="realisation-section"><h2>Photos du chantier</h2><div class="realisation-gallery">${entry.gallery.map(photo=>`<figure><img src="${esc(normalizePath(photo.image))}" alt="${esc(photo.alt||entry.title)}" loading="lazy" decoding="async">${photo.caption?`<figcaption>${esc(photo.caption)}</figcaption>`:''}</figure>`).join('')}</div></section>`:'';
  const serviceBlock=`<section class="realisation-services"><h2>Services associés</h2><div class="realisation-service-links">${linked.map(item=>`<a class="btn secondary" href="${item.url}">${esc(item.label)}</a>`).join('')}</div></section>`;
  const articleSchema=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'Article',
    headline:entry.title,
    description:entry.summary,
    image:`https://renovation-guidel.fr${normalizePath(entry.cover)}`,
    datePublished:entry.date,
    author:{'@type':'Person',name:'Dorian Duplessix'},
    publisher:{'@type':'Organization',name:'Duplessix Multi-Services'},
    mainEntityOfPage:`https://renovation-guidel.fr${pageUrl(entry.slug)}`
  }).replace(/</g,'\\u003c');
  return `${head({title:`${entry.title} — Duplessix Multi-Services`,description:entry.summary,canonical:pageUrl(entry.slug),image:entry.cover,type:'article'})}
<body>
  ${header()}
  <main id="contenu">
    <section class="page-hero realisation-hero"><div class="wrap"><div class="breadcrumbs"><a href="/">Accueil</a> / <a href="/realisations.html">Réalisations</a> / ${esc(entry.title)}</div><p class="eyebrow">${esc(linked.map(item=>item.label).join(' · '))}</p><h1>${esc(entry.title)}</h1><p class="lead">${esc(entry.summary)}</p><div class="realisation-meta">${location}${date}</div></div></section>
    <div class="page-layout wrap"><article class="page-copy realisation-detail"><img class="feature-image realisation-cover" src="${esc(normalizePath(entry.cover))}" alt="${esc(entry.cover_alt||entry.title)}" loading="eager" decoding="async">${sections}${steps}${gallery}${serviceBlock}</article><aside class="aside"><h3>Un projet similaire ?</h3><p>Expliquez votre besoin et joignez vos photos après le premier échange.</p><a class="btn" href="/contact.html">Demander un devis</a><a class="btn secondary" href="/realisations.html">Toutes les réalisations</a></aside></div>
  </main>
  ${footer()}
  <script type="application/ld+json">${articleSchema}</script>
</body>
</html>`;
}

function serviceSection(entries){
  if(!entries.length)return '';
  return `<section class="service-realizations"><h2>Réalisations liées à ce service</h2><div class="service-realisation-grid">${entries.slice(0,3).map(entry=>card(entry,{compact:true})).join('')}</div><a class="text-link service-realisation-all" href="/realisations.html">Voir toutes les réalisations →</a></section>`;
}

async function updateServicePages(entries){
  for(const [key,service] of Object.entries(services)){
    const path=join(distDir,'services',service.file);
    let html=await readFile(path,'utf8');
    const start='<!-- REALISATIONS_LIEES_DEBUT -->';
    const end='<!-- REALISATIONS_LIEES_FIN -->';
    const block=`${start}${serviceSection(entries.filter(entry=>entry.services.includes(key)))}${end}`;
    const pattern=new RegExp(`${start}[\\s\\S]*?${end}`);
    html=pattern.test(html)?html.replace(pattern,block):html.replace('</article>',`${block}</article>`);
    await writeFile(path,html,'utf8');
  }
}

async function updateSitemap(entries){
  const staticPaths=[
    '/',
    '/a-propos.html',
    '/realisations.html',
    '/contact.html',
    '/services/renovation-salle-deau.html',
    '/services/enduit-peinture-placo.html',
    '/services/petits-travaux.html',
    '/services/exterieurs.html',
    '/services/maintenance-immobiliere.html'
  ];
  const urls=staticPaths.map(path=>`<url><loc>https://renovation-guidel.fr${path}</loc></url>`);
  for(const entry of entries){
    const lastmod=entry.date?`<lastmod>${esc(entry.date)}</lastmod>`:'';
    urls.push(`<url><loc>https://renovation-guidel.fr${pageUrl(entry.slug)}</loc>${lastmod}</url>`);
  }
  const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls.join('\n  ')}\n</urlset>\n`;
  await writeFile(join(distDir,'sitemap.xml'),sitemap,'utf8');
}

const files=(await readdir(contentDir)).filter(file=>file.endsWith('.json'));
const entries=[];
for(const file of files){
  const entry=JSON.parse(await readFile(join(contentDir,file),'utf8'));
  if(entry.published===false)continue;
  entry.slug=slugFromFile(file);
  entry.services=Array.isArray(entry.services)?entry.services:[entry.services].filter(Boolean);
  entries.push(entry);
}
entries.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));

await mkdir(outputDir,{recursive:true});
for(const file of await readdir(outputDir)){
  if(file.endsWith('.html'))await unlink(join(outputDir,file));
}
await writeFile(join(distDir,'realisations.html'),renderListing(entries),'utf8');
for(const entry of entries){
  await writeFile(join(outputDir,`${entry.slug}.html`),renderDetail(entry),'utf8');
}
await updateServicePages(entries);
await updateSitemap(entries);
console.log(`Réalisations générées : ${entries.length}`);
