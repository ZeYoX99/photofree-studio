
(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function setMode(mode){
  document.body.classList.toggle('mode-pdf',mode==='pdf');
  document.body.classList.toggle('mode-image',mode==='image');
  $('#pdfMode').classList.toggle('hidden',mode!=='pdf');
  $('#imageMode').classList.toggle('hidden',mode!=='image');
  $$('.suite-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  if(mode==='video'){document.body.classList.remove('mode-pdf','mode-image');}
}
$$('.suite-mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
/* PDF.js viewer and local annotation export */
let pdfDoc=null,pdfBytes=null,pdfPage=1,pdfScale=1,pdfText='',pdfAnnotations=[],pdfAddingText=false;
if(window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
async function openPdf(file){
 if(!file)return;
 try{
  pdfBytes=await file.arrayBuffer(); pdfDoc=await pdfjsLib.getDocument({data:pdfBytes.slice(0)}).promise;
  pdfPage=1;pdfAnnotations=[];$('#pdfEmpty').classList.add('hidden');$('#pdfCanvasWrap').classList.remove('hidden');
  $('#aiOutput').textContent='PDF chargé. Extraction du texte en cours…';
  await renderPdf(); await renderThumbs(); await extractPdfText();
 }catch(e){alert('Impossible d’ouvrir ce PDF. Il est peut-être protégé ou endommagé.');console.error(e);}
}
async function renderPdf(){
 if(!pdfDoc)return;
 const page=await pdfDoc.getPage(pdfPage),viewport=page.getViewport({scale:pdfScale}),canvas=$('#pdfCanvas'),ctx=canvas.getContext('2d');
 canvas.width=Math.floor(viewport.width);canvas.height=Math.floor(viewport.height);
 await page.render({canvasContext:ctx,viewport}).promise;
 $('#pdfPageLabel').textContent=`Page ${pdfPage} / ${pdfDoc.numPages}`;
 $('#pdfZoomLabel').textContent=Math.round(pdfScale*100)+'%';
 renderAnnotations();
}
async function renderThumbs(){
 const root=$('#pdfThumbs');root.innerHTML='';
 for(let n=1;n<=pdfDoc.numPages;n++){
  const b=document.createElement('button');b.className='pdf-thumb'+(n===pdfPage?' active':'');b.textContent=`Page ${n}`;
  const c=document.createElement('canvas');b.prepend(c);root.append(b);
  b.addEventListener('click',async()=>{pdfPage=n;$$('.pdf-thumb').forEach(x=>x.classList.toggle('active',x===b));await renderPdf()});
  try{const p=await pdfDoc.getPage(n),v=p.getViewport({scale:.22});c.width=v.width;c.height=v.height;await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise}catch(e){}
 }
}
async function extractPdfText(){
 const chunks=[];
 for(let n=1;n<=pdfDoc.numPages;n++){const p=await pdfDoc.getPage(n),c=await p.getTextContent();chunks.push(`--- PAGE ${n} ---\n`+c.items.map(i=>i.str).join(' '));}
 pdfText=chunks.join('\n\n');$('#aiOutput').textContent=`Texte extrait de ${pdfDoc.numPages} page(s), ${pdfText.length.toLocaleString()} caractères.\n\nL’assistant génératif n’est pas connecté. Tu peux utiliser les fonctions locales de recherche/extraction du texte; aucune réponse IA fictive ne sera affichée.`;
}
function renderAnnotations(){
 const root=$('#pdfAnnotations'),canvas=$('#pdfCanvas');root.innerHTML='';
 for(const a of pdfAnnotations.filter(x=>x.page===pdfPage)){const d=document.createElement('div');d.className='pdf-annotation';d.textContent=a.text;d.style.left=(a.x*canvas.width)+'px';d.style.top=(a.y*canvas.height)+'px';d.style.fontSize=(a.size*pdfScale)+'px';root.append(d)}
}
$('#pdfInput').addEventListener('change',e=>openPdf(e.target.files[0]));
$('#pdfInputEmpty').addEventListener('change',e=>openPdf(e.target.files[0]));
$('#pdfPrev').onclick=()=>{if(pdfDoc&&pdfPage>1){pdfPage--;renderPdf();renderThumbs()}};
$('#pdfNext').onclick=()=>{if(pdfDoc&&pdfPage<pdfDoc.numPages){pdfPage++;renderPdf();renderThumbs()}};
$('#pdfZoomIn').onclick=()=>{pdfScale=Math.min(3,pdfScale+.15);renderPdf()};
$('#pdfZoomOut').onclick=()=>{pdfScale=Math.max(.4,pdfScale-.15);renderPdf()};
$('#pdfPrint').onclick=()=>window.print();
$('#pdfAddText').onclick=()=>{if(!pdfDoc){alert('Ouvre d’abord un PDF.');return}pdfAddingText=true;alert('Clique sur la page à l’endroit où tu veux ajouter le texte.');};
$('#pdfCanvas').addEventListener('click',e=>{
 if(!pdfAddingText)return;
 const text=prompt('Texte à ajouter :');pdfAddingText=false;if(!text)return;
 const r=e.currentTarget.getBoundingClientRect();
 pdfAnnotations.push({page:pdfPage,x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,text,size:16});
 renderAnnotations();
});
$('#pdfExport').onclick=async()=>{
 if(!pdfDoc||!pdfBytes){alert('Ouvre d’abord un PDF.');return}
 try{
  const {PDFDocument, rgb, StandardFonts}=PDFLib;
  const doc=await PDFDocument.load(pdfBytes),font=await doc.embedFont(StandardFonts.Helvetica);
  for(const a of pdfAnnotations){const page=doc.getPage(a.page-1),size=page.getSize();page.drawText(a.text,{x:a.x*size.width,y:size.height-a.y*size.height-18,size:a.size,font,color:rgb(0.08,0.08,0.1),maxWidth:size.width*.85})}
  const bytes=await doc.save(),blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='photofree-pdf-modifie.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }catch(e){alert('Export impossible. Ce PDF peut être chiffré ou non compatible.');console.error(e)}
};
function localPdfAction(promptText){
 if(!pdfText){$('#aiOutput').textContent='Ouvre un PDF avec du texte sélectionnable. Les PDF scannés nécessitent un OCR, non inclus ici.';return}
 const q=promptText.toLowerCase();
 if(q.includes('résum')||q.includes('resume')){$('#aiOutput').textContent='Aperçu du texte extrait (ceci n’est pas un résumé IA) :\n\n'+pdfText.slice(0,3500)+(pdfText.length>3500?'…':'');return}
 if(q.includes('date')||q.includes('montant')){const matches=pdfText.match(/(?:\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b|\b\d+(?:[.,]\d{2})?\s?(?:€|EUR|USD|\$)\b)/gi)||[];$('#aiOutput').textContent=matches.length?'Occurrences repérées dans le texte extrait :\n• '+[...new Set(matches)].join('\n• '):'Aucune date ou somme reconnue par les règles locales.';return}
 if(q.includes('révision')||q.includes('revision')){$('#aiOutput').textContent='Fiche de travail (générée sans IA) :\n\nTitre : Document à réviser\nPoints à relever :\n• '+pdfText.slice(0,1600).split(/[.!?]\s+/).filter(Boolean).slice(0,8).join('\n• ');return}
 const term=prompt('Quel mot ou quelle expression rechercher dans le PDF ?');if(!term)return;
 const re=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig');const matches=[...pdfText.matchAll(re)].slice(0,30);
 $('#aiOutput').textContent=matches.length?`"${term}" trouvé ${matches.length} fois (maximum 30 affichées).\n`+matches.map(m=>pdfText.slice(Math.max(0,m.index-65),Math.min(pdfText.length,m.index+term.length+100)).replace(/\n/g,' ')).join('\n…\n'):`Aucune occurrence de "${term}".`;
}
$('#aiAsk').onclick=()=>localPdfAction($('#aiQuestion').value||'recherche');
$$('[data-ai]').forEach(b=>b.onclick=()=>{if(b.dataset.ai.includes('Résume'))localPdfAction('résume');else if(b.dataset.ai.includes('dates'))localPdfAction('dates montants');else localPdfAction('fiche de révision')});

/* Image canvas editor: non-destructive sliders, history, text, rotate/flip, export */
const ic=$('#imageCanvas'),ix=ic.getContext('2d');let sourceImage=null,sourceUrl='',baseImageData=null,flipX=false,rotation=0,imgHistory=[];
function drawImage(){
 if(!sourceImage)return;
 const w=sourceImage.naturalWidth||sourceImage.width,h=sourceImage.naturalHeight||sourceImage.height;
 const swap=Math.abs(rotation)%180===90;ic.width=swap?h:w;ic.height=swap?w:h;
 ix.save();ix.translate(ic.width/2,ic.height/2);ix.rotate(rotation*Math.PI/180);ix.scale(flipX?-1:1,1);
 ix.filter=`brightness(${$('#imgBrightness').value}%) contrast(${$('#imgContrast').value}%) saturate(${$('#imgSaturation').value}%) blur(${$('#imgBlur').value}px)`;
 ix.drawImage(sourceImage,-w/2,-h/2,w,h);ix.filter='none';
 const txt=$('#imgText').value;if(txt){ix.font=`${Math.max(8,Number($('#imgTextSize').value)||48)}px Arial`;ix.textBaseline='top';ix.lineWidth=3;ix.strokeStyle='#000a';ix.fillStyle=$('#imgTextColor').value;ix.strokeText(txt,-w/2+24,-h/2+24,Math.max(100,w-48));ix.fillText(txt,-w/2+24,-h/2+24,Math.max(100,w-48))}
 ix.restore();$('#imageEmpty').classList.add('hidden');ic.classList.remove('hidden');
 $('#imgBrightnessOut').value=$('#imgBrightness').value+'%';$('#imgContrastOut').value=$('#imgContrast').value+'%';$('#imgSaturationOut').value=$('#imgSaturation').value+'%';$('#imgBlurOut').value=$('#imgBlur').value+' px';
}
function openImage(file){if(!file)return;if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=URL.createObjectURL(file);sourceImage=new Image();sourceImage.onload=()=>{rotation=0;flipX=false;imgHistory=[];['imgBrightness','imgContrast','imgSaturation'].forEach(id=>$('#'+id).value=100);$('#imgBlur').value=0;$('#imgText').value='';drawImage()};sourceImage.onerror=()=>alert('Image non prise en charge.');sourceImage.src=sourceUrl;}
$('#imageInput').onchange=e=>openImage(e.target.files[0]);$('#imageInputEmpty').onchange=e=>openImage(e.target.files[0]);
['imgBrightness','imgContrast','imgSaturation','imgBlur','imgText','imgTextColor','imgTextSize'].forEach(id=>$('#'+id).addEventListener('input',drawImage));
$('#imgRotate').onclick=()=>{rotation=(rotation+90)%360;drawImage()};
$('#imgFlip').onclick=()=>{flipX=!flipX;drawImage()};
$('#imgAddText').onclick=()=>{$('#imgText').focus();$('#imgText').value=$('#imgText').value||'Votre texte';drawImage()};
$('#imgReset').onclick=()=>{if(!sourceImage)return;rotation=0;flipX=false;['imgBrightness','imgContrast','imgSaturation'].forEach(id=>$('#'+id).value=100);$('#imgBlur').value=0;$('#imgText').value='';drawImage()};
$('#imgUndo').onclick=()=>{alert('Les réglages sont non destructifs : utilise Réinitialiser pour revenir à l’image d’origine. L’historique complet sera ajouté dans une version ultérieure.')};
function exportImage(type){if(!sourceImage){alert('Ouvre d’abord une image.');return}const c=document.createElement('canvas');c.width=ic.width;c.height=ic.height;c.getContext('2d').drawImage(ic,0,0);c.toBlob(blob=>{if(!blob)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=type==='image/jpeg'?'photofree-edition.jpg':'photofree-edition.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)},type,type==='image/jpeg'?.92:undefined)}
$('#imgExportPng').onclick=()=>exportImage('image/png');$('#imgExportJpg').onclick=()=>exportImage('image/jpeg');
})();
