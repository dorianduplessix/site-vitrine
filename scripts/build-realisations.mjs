import {readFile,readdir,mkdir,writeFile,unlink} from 'node:fs/promises';
import {basename,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const contentDir=join(root,'content','realisations');
const outputDir=join(root,'dist','realisations');
const distDir=join(root,'dist');

const services={
  'renovation-salle-deau':{label:'Rénovation de salle d’eau',url:'/services/renovation-salle-deau.html',file:'renovation-salle-deau.html',seoTitle:'Rénovation de salle d’eau à Guidel et Lorient | Duplessix',seoDescription:'Création ou rénovation de salle d’eau autour de Guidel : réseaux, douche, WC, vasque, étanchéité, peinture et finitions. Devis gratuit.'},
  'enduit-peinture-placo':{label:'Enduit, peinture & placo',url:'/services/enduit-peinture-placo.html',file:'enduit-peinture-placo.html',seoTitle:'Peinture, enduit et placo à Guidel et Lorient | Duplessix',seoDescription:'Préparation des supports, enduit, bandes, placo et peinture intérieure à Guidel, Lorient et Quimperlé. Travaux soignés et devis gratuit.'},
  'petits-travaux':{label:'Dépannage & petits travaux',url:'/services/petits-travaux.html',file:'petits-travaux.html',seoTitle:'Petits travaux et dépannage sanitaire à Guidel | Duplessix',seoDescription:'Robinetterie, WC, ballon d’eau chaude, joints, réparations et finitions autour de Guidel et Lorient. Regroupez plusieurs petits travaux.'},
  'exterieurs':{label:'Extérieurs & menuiseries',url:'/services/exterieurs.html',file:'exterieurs.html',seoTitle:'Menuiseries, abris et travaux bois à Guidel | Duplessix',seoDescription:'Fabrication de volets, abris, structures bois, ponçage et lasure autour de Guidel, Lorient et Quimperlé. Découvrez les réalisations.'},
  'maintenance-immobiliere':{label:'Maintenance immobilière',url:'/services/maintenance-immobiliere.html',file:'maintenance-immobiliere.html',seoTitle:'Maintenance immobilière à Guidel et Lorient | Duplessix',seoDescription:'Remise en état et réparations de logements pour propriétaires, bailleurs et agences autour de Guidel et Lorient. Suivi direct par Dorian.'}
};

const serviceEvidence={
  'renovation-salle-deau':{
    intro:'Les chantiers publiés à Lorient et Caudan montrent deux niveaux d’intervention : la création complète d’une salle d’eau et la rénovation d’une pièce existante.',
    points:[
      'Création des évacuations d’eaux usées et des alimentations EFS et ECS',
      'Pose et préparation des plaques de plâtre hydrofuges, étanchéité et peinture',
      'Installation de la douche, du WC, du meuble vasque et des équipements',
      'Coordination avec un artisan partenaire lorsque le carrelage lui est confié'
    ]
  },
  'enduit-peinture-placo':{
    intro:'Les réalisations de Lorient et Quimperlé illustrent aussi bien la mise en peinture d’un appartement complet que la reprise d’un support très dégradé.',
    points:[
      'Préparation des murs et des plafonds avant mise en peinture',
      'Application d’une couche d’apprêt puis de deux couches de peinture',
      'Grattage, reprise d’enduit, ponçage et contrôle d’un mur ancien',
      'Finitions propres dans plusieurs pièces et avec différentes teintes'
    ]
  },
  'exterieurs':{
    intro:'Les chantiers publiés à Kernascléden, Guidel, Pont-Scorff et Inzinzac-Lochrist montrent des interventions de construction, de fabrication et de remise en état du bois.',
    points:[
      'Construction d’un abri pour bois avec couverture en bac acier imitation tuiles',
      'Création d’un local de stockage en ossature bois et panneaux OSB',
      'Ponçage complet et application d’une lasure sur un cabanon',
      'Fabrication de volets en bois exotique reproduits à l’identique'
    ]
  }
};

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));

const normalizePath=value=>String(value??'').startsWith('/')?String(value):`/${value}`;
const slugFromFile=file=>basename(file,'.json');
const pageUrl=slug=>`/realisations/${slug}.html`;
const absoluteUrl=value=>`https://renovation-guidel.fr${normalizePath(value)}`;
const businessId='https://renovation-guidel.fr/#business';

function breadcrumbSchema(items){
  return {
    '@type':'BreadcrumbList',
    itemListElement:items.map((item,index)=>({
      '@type':'ListItem',
      position:index+1,
      name:item.name,
      item:absoluteUrl(item.url)
    }))
  };
}

function header(){
  return `<a class="skip-link" href="#contenu">Aller au contenu</a>
  <header class="site-header"><nav class="nav wrap"><a class="brand" href="/"><span class="brand-mark">D</span><span>Duplessix Multi-Services<small>Rénovation & maintenance</small></span></a><button class="nav-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="navigation-principale">☰</button><div class="nav-links" id="navigation-principale"><a href="/#services">Services</a><a href="/realisations.html">Réalisations</a><a href="/a-propos.html">Dorian</a><a href="/contact.html">Contact</a></div><a class="btn" href="tel:+33659735020">Appeler</a></nav></header>`;
}

function footer(){
  return `<footer class="footer footer-compact"><div class="footer-bottom wrap"><span>© 2026 Duplessix Multi-Services</span><div class="footer-links"><a href="/mentions.html">Mentions légales</a><a href="tel:+33659735020">06 59 73 50 20</a><a href="mailto:contact@renovation-guidel.fr">contact@renovation-guidel.fr</a></div></div></footer><script src="/assets/site.js?v=ga4-leads-1"></script>`;
}

function head({title,description,canonical,image,type='website',structuredData=[]}){
  const absolute=`https://renovation-guidel.fr${canonical}`;
  const imageMeta=image?`<meta property="og:image" content="https://renovation-guidel.fr${esc(normalizePath(image))}">`:'';
  const jsonLd=structuredData.length?`  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':structuredData}).replace(/</g,'\\u003c')}</script>\n`:'';
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${absolute}">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/styles.css?v=realisations-communes-1">
  <meta name="theme-color" content="#102a34">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="Duplessix Multi-Services">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${absolute}">
${imageMeta?`  ${imageMeta}\n`:''}  <meta name="twitter:card" content="summary_large_image">
${jsonLd}
</head>`;
}

function serviceLinks(entry){
  return entry.services.map(key=>services[key]).filter(Boolean);
}

function card(entry,{compact=false}={}){
  const linked=serviceLinks(entry);
  const location=entry.city?`<p class="realisation-place">${esc(entry.city)}</p>`:'';
  return `<article class="realisation-card${compact?' compact':''}"><a href="${pageUrl(entry.slug)}"><div class="realisation-card-image"><img src="${esc(normalizePath(entry.cover))}" alt="${esc(entry.cover_alt||entry.title)}" loading="lazy" decoding="async"></div><div class="realisation-card-copy"><p class="eyebrow">${esc(linked.map(item=>item.label).join(' · '))}</p><h${compact?'3':'2'}>${esc(entry.title)}</h${compact?'3':'2'}>${location}<p>${esc(entry.summary)}</p><span class="text-link">Voir le chantier →</span></div></a></article>`;
}

function renderListing(entries){
  const cards=entries.map(entry=>card(entry)).join('');
  const title='Réalisations à Guidel, Lorient et alentours | Duplessix';
  const description='Découvrez les chantiers réalisés par Dorian Duplessix : salles d’eau, peinture, enduit, volets, abris et travaux bois autour de Guidel.';
  const collectionSchema={
    '@type':'CollectionPage',
    '@id':'https://renovation-guidel.fr/realisations.html#page',
    name:title,
    description,
    url:'https://renovation-guidel.fr/realisations.html',
    inLanguage:'fr-FR',
    mainEntity:{
      '@type':'ItemList',
      itemListElement:entries.map((entry,index)=>({
        '@type':'ListItem',
        position:index+1,
        name:entry.title,
        url:absoluteUrl(pageUrl(entry.slug))
      }))
    }
  };
  const breadcrumbs=breadcrumbSchema([{name:'Accueil',url:'/'},{name:'Réalisations',url:'/realisations.html'}]);
  return `${head({title,description,canonical:'/realisations.html',structuredData:[collectionSchema,breadcrumbs]})}
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
  const location=entry.city?`<span>Commune : ${esc(entry.city)}</span>`:'';
  const published=entry.date?new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date(entry.date)):'';
  const date=published?`<span>Publié le ${esc(published)}</span>`:'';
  const sections=(entry.sections||[]).map(section=>`<section class="realisation-section"><h2>${esc(section.title)}</h2>${(section.paragraphs||[]).map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</section>`).join('');
  const steps=(entry.steps||[]).length?`<section class="realisation-section"><h2>Travaux réalisés</h2><ul>${entry.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ul></section>`:'';
  const gallery=(entry.gallery||[]).length?`<section class="realisation-section"><h2>Photos du chantier</h2><div class="realisation-gallery">${entry.gallery.map(photo=>`<figure><img src="${esc(normalizePath(photo.image))}" alt="${esc(photo.alt||entry.title)}" loading="lazy" decoding="async">${photo.caption?`<figcaption>${esc(photo.caption)}</figcaption>`:''}</figure>`).join('')}</div></section>`:'';
  const serviceBlock=`<section class="realisation-services"><h2>Services associés</h2><div class="realisation-service-links">${linked.map(item=>`<a class="btn secondary" href="${item.url}">${esc(item.label)}</a>`).join('')}</div></section>`;
  const seoTitle=entry.seo_title||`${entry.title}${entry.city?` à ${entry.city}`:''} | Duplessix`;
  const seoDescription=entry.seo_description||`${entry.summary}${entry.city?` Chantier réalisé à ${entry.city}.`:''}`;
  const articleSchema={
    '@type':'Article',
    '@id':`${absoluteUrl(pageUrl(entry.slug))}#article`,
    headline:entry.title,
    description:seoDescription,
    image:absoluteUrl(entry.cover),
    datePublished:entry.date,
    dateModified:entry.modified||entry.date,
    inLanguage:'fr-FR',
    ...(entry.city?{contentLocation:{'@type':'Place',name:entry.city}}:{}),
    about:linked.map(item=>({'@type':'Service',name:item.label,url:absoluteUrl(item.url)})),
    author:{'@type':'Person',name:'Dorian Duplessix',url:'https://renovation-guidel.fr/a-propos.html'},
    publisher:{'@type':'Organization','@id':businessId,name:'Duplessix Multi-Services',url:'https://renovation-guidel.fr/'},
    mainEntityOfPage:{'@type':'WebPage','@id':absoluteUrl(pageUrl(entry.slug))}
  };
  const breadcrumbs=breadcrumbSchema([
    {name:'Accueil',url:'/'},
    {name:'Réalisations',url:'/realisations.html'},
    {name:entry.title,url:pageUrl(entry.slug)}
  ]);
  return `${head({title:seoTitle,description:seoDescription,canonical:pageUrl(entry.slug),image:entry.cover,type:'article',structuredData:[articleSchema,breadcrumbs]})}
<body>
  ${header()}
  <main id="contenu">
    <section class="page-hero realisation-hero"><div class="wrap"><div class="breadcrumbs"><a href="/">Accueil</a> / <a href="/realisations.html">Réalisations</a> / ${esc(entry.title)}</div><p class="eyebrow">${esc(linked.map(item=>item.label).join(' · '))}</p><h1>${esc(entry.title)}</h1><p class="lead">${esc(entry.summary)}</p><div class="realisation-meta">${location}${date}</div></div></section>
    <div class="page-layout wrap"><article class="page-copy realisation-detail"><img class="feature-image realisation-cover" src="${esc(normalizePath(entry.cover))}" alt="${esc(entry.cover_alt||entry.title)}" loading="eager" decoding="async">${sections}${steps}${gallery}${serviceBlock}</article><aside class="aside"><h3>Un projet similaire ?</h3><p>Expliquez votre besoin et joignez vos photos après le premier échange.</p><a class="btn" href="/contact.html">Demander un devis</a><a class="btn secondary" href="/realisations.html">Toutes les réalisations</a></aside></div>
  </main>
  ${footer()}
</body>
</html>`;
}

function serviceSection(entries,key){
  if(!entries.length)return '';
  const evidence=serviceEvidence[key];
  const proof=evidence?`<div class="service-realisation-proof"><p>${esc(evidence.intro)}</p><ul>${evidence.points.map(point=>`<li>${esc(point)}</li>`).join('')}</ul></div>`:'';
  return `<section class="service-realizations"><h2>Ce que montrent les chantiers réalisés</h2>${proof}<div class="service-realisation-grid">${entries.map(entry=>card(entry,{compact:true})).join('')}</div><a class="text-link service-realisation-all" href="/realisations.html">Voir toutes les réalisations →</a></section>`;
}

async function updateServicePages(entries){
  for(const [key,service] of Object.entries(services)){
    const path=join(distDir,'services',service.file);
    let html=await readFile(path,'utf8');
    html=html.replace(/\/assets\/styles\.css\?v=[^"]+/,'/assets/styles.css?v=services-evidence-1');
    html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(service.seoTitle)}</title>`);
    html=html.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(service.seoDescription)}">`);
    html=html.replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${esc(service.seoTitle)}">`);
    html=html.replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${esc(service.seoDescription)}">`);
    html=html.replace(/<meta name="twitter:title" content="[^"]*">/,`<meta name="twitter:title" content="${esc(service.seoTitle)}">`);
    html=html.replace(/<meta name="twitter:description" content="[^"]*">/,`<meta name="twitter:description" content="${esc(service.seoDescription)}">`);
    const pageAbsolute=absoluteUrl(service.url);
    const serviceSchema={
      '@context':'https://schema.org',
      '@graph':[
        {
          '@type':'Service',
          '@id':`${pageAbsolute}#service`,
          name:service.label,
          serviceType:service.label,
          description:service.seoDescription,
          url:pageAbsolute,
          areaServed:['Guidel','Lorient','Quimperlé','Quéven','Ploemeur','Hennebont'].map(name=>({'@type':'City',name})),
          provider:{'@type':'HomeAndConstructionBusiness','@id':businessId,name:'Duplessix Multi-Services',url:'https://renovation-guidel.fr/',telephone:'+33659735020'}
        },
        breadcrumbSchema([
          {name:'Accueil',url:'/'},
          {name:'Services',url:'/#services'},
          {name:service.label,url:service.url}
        ])
      ]
    };
    const seoStart='<!-- SEO_STRUCTURED_DATA_DEBUT -->';
    const seoEnd='<!-- SEO_STRUCTURED_DATA_FIN -->';
    const seoBlock=`${seoStart}<script type="application/ld+json">${JSON.stringify(serviceSchema).replace(/</g,'\\u003c')}</script>${seoEnd}`;
    const seoPattern=new RegExp(`${seoStart}[\\s\\S]*?${seoEnd}`);
    html=seoPattern.test(html)?html.replace(seoPattern,seoBlock):html.replace('</head>',`${seoBlock}</head>`);
    const start='<!-- REALISATIONS_LIEES_DEBUT -->';
    const end='<!-- REALISATIONS_LIEES_FIN -->';
    const block=`${start}${serviceSection(entries.filter(entry=>entry.services.includes(key)),key)}${end}`;
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
