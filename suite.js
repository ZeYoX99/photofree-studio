
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

/* PhotoFree Photoshop: layered canvas editor, local-only */
const ic=$('#imageCanvas'), ictx=ic.getContext('2d'), overlay=$('#psOverlay'),octx=overlay.getContext('2d');
let psLayers=[],psActive=0,psTool='move',psZoom=1,psDrawing=false,psStart=null,psLast=null,psUndo=[],psRedo=[],psDocName='Document sans titre',psExtraFilter='',psDirty=false;
const psDefaults=()=>({brightness:100,contrast:100,saturation:100,blur:0});
function psLayer(name,type='pixel',canvas=null,extra={}){return {id:'l'+Date.now()+Math.random().toString(16).slice(2),name,type,canvas,visible:true,opacity:100,blend:'source-over',...extra};}
function activeLayer(){return psLayers[psActive]||null}
function psSnapshot(){try{psUndo.push(JSON.stringify({w:ic.width,h:ic.height,name:psDocName,layers:psLayers.map(l=>({...l,canvas:l.canvas?l.canvas.toDataURL('image/png'):null})),active:psActive,filter:psExtraFilter,adjust:{brightness:+$('#imgBrightness').value,contrast:+$('#imgContrast').value,saturation:+$('#imgSaturation').value,blur:+$('#imgBlur').value}}));if(psUndo.length>30)psUndo.shift();psRedo=[];}catch(e){console.warn('Historique indisponible',e)}}
function canvasFromData(data){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);resolve(c)};im.onerror=reject;im.src=data;});}
async function restoreSnapshot(str){const d=JSON.parse(str);ic.width=d.w;ic.height=d.h;overlay.width=d.w;overlay.height=d.h;psDocName=d.name;psLayers=[];for(const l of d.layers){const c=l.canvas?await canvasFromData(l.canvas):null;psLayers.push({...l,canvas:c})}psActive=Math.min(d.active,psLayers.length-1);psExtraFilter=d.filter||'';for(const [k,v] of Object.entries(d.adjust||psDefaults()))if($('#img'+k[0].toUpperCase()+k.slice(1)))$('#img'+k[0].toUpperCase()+k.slice(1)).value=v;psRender();psDirty=true;}
function psSetZoom(z){psZoom=Math.max(.1,Math.min(4,z));ic.style.width=(ic.width*psZoom)+'px';ic.style.height=(ic.height*psZoom)+'px';overlay.style.width=ic.style.width;overlay.style.height=ic.style.height;$('#psZoomLabel').textContent=Math.round(psZoom*100)+'%';}
function psRender(){
 if(!ic.width||!ic.height)return;
 ictx.clearRect(0,0,ic.width,ic.height);
 for(const l of psLayers){if(!l.visible||!l.canvas)continue;ictx.save();ictx.globalAlpha=(l.opacity??100)/100;ictx.globalCompositeOperation=l.blend||'source-over';ictx.drawImage(l.canvas,0,0);ictx.restore();}
 ic.style.filter=`brightness(${$('#imgBrightness').value}%) contrast(${$('#imgContrast').value}%) saturate(${$('#imgSaturation').value}%) blur(${$('#imgBlur').value}px) ${psExtraFilter}`;
 ic.classList.remove('hidden');overlay.classList.remove('hidden');$('#imageEmpty').classList.add('hidden');
 $('#psDocInfo').textContent=`${ic.width} × ${ic.height} px`;$('#psCanvasTitle').textContent=psDocName;$('#psDimensions').textContent=`${ic.width} × ${ic.height} px`;$('#psStatus').textContent=psDirty?'Modifications non enregistrées':'Prêt';
 psRenderLayers();psSetZoom(psZoom);
}
function psRenderLayers(){
 const root=$('#psLayerList');root.innerHTML='';
 [...psLayers].map((l,i)=>({l,i})).reverse().forEach(({l,i})=>{
  const row=document.createElement('div');row.className='ps-layer-item'+(i===psActive?' active':'');
  const vis=document.createElement('input');vis.type='checkbox';vis.checked=l.visible;vis.title='Visibilité';vis.onclick=e=>{e.stopPropagation();psSnapshot();l.visible=vis.checked;psRender()};
  const thumb=document.createElement('canvas');thumb.className='ps-layer-thumb';thumb.width=56;thumb.height=50;if(l.canvas)thumb.getContext('2d').drawImage(l.canvas,0,0,56,50);
  const name=document.createElement('span');name.textContent=l.name;name.style.flex='1';name.style.overflow='hidden';name.style.textOverflow='ellipsis';
  row.append(vis,thumb,name);row.onclick=()=>{psActive=i;psRenderLayers();$('#psLayerName').value=l.name;$('#psLayerOpacity').value=l.opacity;$('#psBlend').value=l.blend};
  root.append(row);
 });
 const l=activeLayer();$('#psLayerName').value=l?.name||'';$('#psLayerOpacity').value=l?.opacity??100;$('#psBlend').value=l?.blend||'source-over';
}
function psNewCanvas(w,h,name='Calque 1'){ic.width=overlay.width=w;ic.height=overlay.height=h;psLayers=[psLayer(name,'pixel',document.createElement('canvas'))];psLayers[0].canvas.width=w;psLayers[0].canvas.height=h;psActive=0;psDocName=name;psExtraFilter='';psDirty=true;psSnapshot();psRender();psSetZoom(Math.min(1,700/w,500/h));}
function psAddBlank(){if(!ic.width){psNewCanvas(1200,800);return}psSnapshot();const c=document.createElement('canvas');c.width=ic.width;c.height=ic.height;psLayers.push(psLayer('Calque '+(psLayers.length+1),'pixel',c));psActive=psLayers.length-1;psDirty=true;psRender();}
function psOpenImage(file,asLayer=false){if(!file)return;const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{if(!asLayer||!ic.width){psNewCanvas(im.naturalWidth,im.naturalHeight,file.name||'Image');const c=psLayers[0].canvas;c.getContext('2d').drawImage(im,0,0);psLayers[0].name=file.name||'Image';}else{psSnapshot();const c=document.createElement('canvas');c.width=ic.width;c.height=ic.height;c.getContext('2d').drawImage(im,0,0,ic.width,ic.height);psLayers.push(psLayer(file.name||'Image importée','pixel',c));psActive=psLayers.length-1;}psDocName=(file.name||'Document').replace(/\.[^.]+$/,'');psDirty=true;psRender();URL.revokeObjectURL(url);};im.onerror=()=>{alert('Image non prise en charge.');URL.revokeObjectURL(url)};im.src=url;}
$('#imageInput').onchange=e=>psOpenImage(e.target.files[0],false);$('#imageInputEmpty').onchange=e=>psOpenImage(e.target.files[0],false);$('#psAddImage').onclick=()=>$('#psAddImageInput').click();$('#psAddImageInput').onchange=e=>psOpenImage(e.target.files[0],true);
$('#psNewDoc').onclick=()=>{const w=Number(prompt('Largeur du document en pixels','1200'));if(!w)return;const h=Number(prompt('Hauteur du document en pixels','800'));if(!h)return;psNewCanvas(Math.min(8000,Math.max(1,w)),Math.min(8000,Math.max(1,h)),'Nouveau document');};
$$('[data-ps-tool]').forEach(b=>b.onclick=()=>{psTool=b.dataset.psTool;$$('[data-ps-tool]').forEach(x=>x.classList.toggle('active',x===b));$('#psToolLabel').textContent=b.querySelector('small').textContent;$('#psStatus').textContent='Outil : '+$('#psToolLabel').textContent});
function psPoint(e){const r=ic.getBoundingClientRect();return {x:(e.clientX-r.left)*ic.width/r.width,y:(e.clientY-r.top)*ic.height/r.height};}
function psDrawStroke(a,b,erase=false){const l=activeLayer();if(!l||!l.canvas)return;const c=l.canvas.getContext('2d');c.save();c.globalAlpha=Number($('#psOpacity').value)/100;c.globalCompositeOperation=erase?'destination-out':'source-over';c.strokeStyle=$('#psColor').value;c.fillStyle=$('#psColor').value;c.lineWidth=Math.max(1,Number($('#psBrushSize').value)||1);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore();}
ic.addEventListener('pointerdown',e=>{if(!ic.width)return;const p=psPoint(e);psStart=p;psLast=p;psDrawing=true;ic.setPointerCapture?.(e.pointerId);if(psTool==='eyedropper'){const d=ictx.getImageData(Math.max(0,Math.min(ic.width-1,p.x|0)),Math.max(0,Math.min(ic.height-1,p.y|0)),1,1).data;$('#psColor').value='#'+[...d.slice(0,3)].map(x=>x.toString(16).padStart(2,'0')).join('');psDrawing=false;return}if(['brush','eraser','rect','ellipse'].includes(psTool))psSnapshot();if(psTool==='text'){psDrawing=false;const t=prompt('Texte à ajouter :','Votre texte');if(t){psSnapshot();const c=document.createElement('canvas');c.width=ic.width;c.height=ic.height;const cx=c.getContext('2d');cx.globalAlpha=Number($('#psOpacity').value)/100;cx.fillStyle=$('#psColor').value;cx.font=`${Number($('#psTextSize').value)||48}px ${$('#psFont').value}`;cx.textBaseline='top';cx.fillText(t,p.x,p.y,ic.width-p.x);psLayers.push(psLayer(t,'text',c));psActive=psLayers.length-1;psDirty=true;psRender()}return}if(psTool==='crop'){octx.clearRect(0,0,overlay.width,overlay.height);return}});
ic.addEventListener('pointermove',e=>{if(!psDrawing||!psStart)return;const p=psPoint(e);if(psTool==='brush'||psTool==='eraser'){psDrawStroke(psLast,p,psTool==='eraser');psLast=p;psRender();}else if(psTool==='rect'||psTool==='ellipse'||psTool==='crop'){psRender();octx.clearRect(0,0,overlay.width,overlay.height);octx.save();octx.strokeStyle=psTool==='crop'?'#55aaff':'#ffffff';octx.lineWidth=2;octx.setLineDash([5,4]);const x=Math.min(psStart.x,p.x),y=Math.min(psStart.y,p.y),w=Math.abs(p.x-psStart.x),h=Math.abs(p.y-psStart.y);if(psTool==='ellipse'){octx.beginPath();octx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);octx.stroke()}else octx.strokeRect(x,y,w,h);octx.restore();}});
ic.addEventListener('pointerup',e=>{if(!psDrawing)return;const p=psPoint(e);psDrawing=false;if(psTool==='rect'||psTool==='ellipse'){const l=activeLayer();if(l?.canvas){const c=l.canvas.getContext('2d');c.save();c.globalAlpha=Number($('#psOpacity').value)/100;c.strokeStyle=$('#psColor').value;c.lineWidth=Math.max(1,Number($('#psBrushSize').value)||1);const x=Math.min(psStart.x,p.x),y=Math.min(psStart.y,p.y),w=Math.abs(p.x-psStart.x),h=Math.abs(p.y-psStart.y);if(psTool==='ellipse'){c.beginPath();c.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);c.stroke()}else c.strokeRect(x,y,w,h);c.restore();}}if(psTool==='crop'){const x=Math.max(0,Math.floor(Math.min(psStart.x,p.x))),y=Math.max(0,Math.floor(Math.min(psStart.y,p.y))),w=Math.floor(Math.abs(p.x-psStart.x)),h=Math.floor(Math.abs(p.y-psStart.y));if(w>5&&h>5){window.psCropRect={x,y,w,h};$('#psStatus').textContent=`Zone de recadrage : ${w} × ${h} px. Clique sur Appliquer recadrage.`}}octx.clearRect(0,0,overlay.width,overlay.height);psDirty=true;psRender();});
$('#psApplyCrop').onclick=()=>{const r=window.psCropRect;if(!r||!ic.width)return alert('Sélectionne d’abord une zone avec l’outil Recadrage.');psSnapshot();for(const l of psLayers){if(!l.canvas)continue;const c=document.createElement('canvas');c.width=r.w;c.height=r.h;c.getContext('2d').drawImage(l.canvas,r.x,r.y,r.w,r.h,0,0,r.w,r.h);l.canvas=c}ic.width=overlay.width=r.w;ic.height=overlay.height=r.h;window.psCropRect=null;psDirty=true;psRender();};
$('#psDeselect').onclick=()=>{window.psCropRect=null;octx.clearRect(0,0,overlay.width,overlay.height);$('#psStatus').textContent='Sélection désactivée'};
$('#psAddBlankLayer').onclick=psAddBlank;$('#psAddTextLayer').onclick=()=>{if(!ic.width)psNewCanvas(1200,800);psTool='text';$('#psToolLabel').textContent='Texte';alert('Clique sur le canevas pour placer un nouveau texte.');};
$('#psDuplicateLayer').onclick=()=>{const l=activeLayer();if(!l)return;psSnapshot();const c=document.createElement('canvas');c.width=ic.width;c.height=ic.height;if(l.canvas)c.getContext('2d').drawImage(l.canvas,0,0);psLayers.splice(psActive+1,0,psLayer(l.name+' copie',l.type,c,{visible:l.visible,opacity:l.opacity,blend:l.blend}));psActive++;psDirty=true;psRender()};
$('#psDeleteLayer').onclick=()=>{if(!activeLayer())return;if(psLayers.length===1&&!confirm('Supprimer le dernier calque ?'))return;psSnapshot();psLayers.splice(psActive,1);if(!psLayers.length){const c=document.createElement('canvas');c.width=ic.width;c.height=ic.height;psLayers=[psLayer('Calque vide','pixel',c)]}psActive=Math.max(0,psActive-1);psDirty=true;psRender()};
$('#psLayerName').onchange=()=>{const l=activeLayer();if(l){l.name=$('#psLayerName').value||'Calque';psDirty=true;psRenderLayers()}};
$('#psLayerOpacity').oninput=()=>{const l=activeLayer();if(l){l.opacity=Number($('#psLayerOpacity').value);psRender()}};
$('#psBlend').onchange=()=>{const l=activeLayer();if(l){l.blend=$('#psBlend').value;psRender()}};
['imgBrightness','imgContrast','imgSaturation','imgBlur'].forEach(id=>$('#'+id).addEventListener('input',()=>{const o=$('#'+id+'Out');if(o)o.value=$('#'+id).value+(id==='imgBlur'?' px':'%');psRender()}));
$('#psHistoryUndo')?.addEventListener('click',()=>$('#imgUndo').click());$('#psHistoryRedo')?.addEventListener('click',()=>$('#imgRedo').click());
$('#psResetAdjust').onclick=()=>{['imgBrightness','imgContrast','imgSaturation'].forEach(id=>$('#'+id).value=100);$('#imgBlur').value=0;psExtraFilter='';psRender()};
$('#psGrayscale').onclick=()=>{psSnapshot();psExtraFilter='grayscale(1)';psRender()};$('#psInvert').onclick=()=>{psSnapshot();psExtraFilter='invert(1)';psRender()};$('#psSepia').onclick=()=>{psSnapshot();psExtraFilter='sepia(1)';psRender()};
$$('[data-ps-filter]').forEach(b=>b.onclick=()=>{psSnapshot();psExtraFilter=b.dataset.psFilter;psRender()});
$$('[data-ps-tab]').forEach(b=>b.onclick=()=>{$$('[data-ps-tab]').forEach(x=>x.classList.toggle('active',x===b));$('#psLayersPanel').classList.toggle('hidden',b.dataset.psTab!=='layers');$('#psAdjustPanel').classList.toggle('hidden',b.dataset.psTab!=='adjust');$('#psFiltersPanel').classList.toggle('hidden',b.dataset.psTab!=='filters');$('#psHistoryPanel')?.classList.toggle('hidden',b.dataset.psTab!=='history')});
$('#psZoomIn').onclick=()=>psSetZoom(psZoom*1.2);$('#psZoomOut').onclick=()=>psSetZoom(psZoom/1.2);$('#psFit').onclick=()=>psSetZoom(Math.min(1,700/(ic.width||700),500/(ic.height||500)));
$('#imgUndo').onclick=async()=>{if(!psUndo.length)return;psRedo.push(JSON.stringify({w:ic.width,h:ic.height,name:psDocName,layers:psLayers.map(l=>({...l,canvas:l.canvas?l.canvas.toDataURL('image/png'):null})),active:psActive,filter:psExtraFilter,adjust:{brightness:+$('#imgBrightness').value,contrast:+$('#imgContrast').value,saturation:+$('#imgSaturation').value,blur:+$('#imgBlur').value}}));await restoreSnapshot(psUndo.pop())};
$('#imgRedo').onclick=async()=>{if(!psRedo.length)return;psUndo.push(JSON.stringify({w:ic.width,h:ic.height,name:psDocName,layers:psLayers.map(l=>({...l,canvas:l.canvas?l.canvas.toDataURL('image/png'):null})),active:psActive,filter:psExtraFilter,adjust:{brightness:+$('#imgBrightness').value,contrast:+$('#imgContrast').value,saturation:+$('#imgSaturation').value,blur:+$('#imgBlur').value}}));await restoreSnapshot(psRedo.pop())};
$('#imgReset').onclick=()=>{if(confirm('Réinitialiser le document et repartir de zéro ?')){psLayers=[];ic.width=overlay.width=0;ic.height=overlay.height=0;$('#imageEmpty').classList.remove('hidden');ic.classList.add('hidden');overlay.classList.add('hidden');psRenderLayers()}};
function psExport(type){if(!ic.width)return alert('Ouvre ou crée d’abord un document.');const c=document.createElement('canvas');c.width=ic.width;c.height=ic.height;const x=c.getContext('2d');x.filter=`brightness(${$('#imgBrightness').value}%) contrast(${$('#imgContrast').value}%) saturate(${$('#imgSaturation').value}%) blur(${$('#imgBlur').value}px) ${psExtraFilter}`;for(const l of psLayers){if(l.visible&&l.canvas){x.save();x.globalAlpha=l.opacity/100;x.globalCompositeOperation=l.blend;x.drawImage(l.canvas,0,0);x.restore()}}c.toBlob(blob=>{if(!blob)return alert('Export impossible.');const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=(psDocName||'photofree')+(type==='image/jpeg'?'.jpg':'.png');a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)},type,type==='image/jpeg'?.92:undefined)}
$('#imgExportPng').onclick=()=>psExport('image/png');$('#imgExportJpg').onclick=()=>psExport('image/jpeg');
$('#psSaveProject').onclick=()=>{if(!ic.width)return alert('Aucun document à enregistrer.');const d={format:'PhotoFreeProject',version:1,width:ic.width,height:ic.height,name:psDocName,active:psActive,filter:psExtraFilter,adjust:{brightness:+$('#imgBrightness').value,contrast:+$('#imgContrast').value,saturation:+$('#imgSaturation').value,blur:+$('#imgBlur').value},layers:psLayers.map(l=>({...l,canvas:l.canvas?l.canvas.toDataURL('image/png'):null}))};const blob=new Blob([JSON.stringify(d)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=(psDocName||'photofree')+'.photofree';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);psDirty=false;$('#psStatus').textContent='Projet enregistré'};
$('#psProjectInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(d.format!=='PhotoFreeProject')throw Error('Format inconnu');psUndo=[];psRedo=[];ic.width=overlay.width=d.width;ic.height=overlay.height=d.height;psDocName=d.name||'Projet PhotoFree';psLayers=[];for(const l of d.layers){psLayers.push({...l,canvas:l.canvas?await canvasFromData(l.canvas):null})}psActive=d.active||0;psExtraFilter=d.filter||'';for(const [k,v] of Object.entries(d.adjust||psDefaults()))$('#img'+k[0].toUpperCase()+k.slice(1)).value=v;psDirty=false;psRender()}catch(err){alert('Impossible d’ouvrir ce projet PhotoFree : '+err.message)}};
$$('[data-ps-menu]').forEach(b=>b.onclick=()=>{const m=b.dataset.psMenu;const actions={
'Fichier':[['Nouveau document','psNewDoc'],['Ouvrir une image','imageInput'],['Enregistrer le projet','psSaveProject'],['Exporter PNG','imgExportPng']],
'Édition':[['Annuler','imgUndo'],['Rétablir','imgRedo'],['Désélectionner','psDeselect']],
'Image':[['Noir et blanc','psGrayscale'],['Inverser les couleurs','psInvert'],['Sépia','psSepia'],['Réinitialiser les réglages','psResetAdjust']],
'Calque':[['Nouveau calque','psAddBlankLayer'],['Ajouter texte','psAddTextLayer'],['Dupliquer calque','psDuplicateLayer'],['Supprimer calque','psDeleteLayer']],
'Sélection':[['Désélectionner','psDeselect'],['Appliquer recadrage','psApplyCrop']],
'Filtre':[['Flou doux','psFilterBlur'],['Couleurs intenses','psFilterSat'],['Contraste +','psFilterContrast']],
'Affichage':[['Zoom avant','psZoomIn'],['Zoom arrière','psZoomOut'],['Ajuster à l’écran','psFit']],
'Texte':[['Ajouter un calque de texte','psAddTextLayer']],
'Fenêtre':[['Afficher Calques','psShowLayers'],['Afficher Réglages','psShowAdjust'],['Afficher Filtres','psShowFilters'],['Afficher Historique','psShowHistory']],
'Plus':[['Exporter PNG','imgExportPng'],['Exporter JPG','imgExportJpg'],['Enregistrer projet PhotoFree','psSaveProject']],
'Aide':[['Raccourcis clavier','psShortcuts'],['Limites des fonctions','psLimitations']]
};const list=actions[m]||[];const choice=prompt(m+'\\n'+list.map((x,i)=>`${i+1}. ${x[0]}`).join('\\n')+'\\n\\nEntre le numéro de commande :');const a=list[Number(choice)-1];if(!a)return;if(a[1]==='psShowLayers'||a[1]==='psShowAdjust'||a[1]==='psShowFilters'||a[1]==='psShowHistory'){const tab=a[1].replace('psShow','').toLowerCase();$(`[data-ps-tab=\"${tab}\"]`)?.click();return}else if(a[1]==='psShortcuts'){alert('Raccourcis : B pinceau · E gomme · T texte · V déplacement · C recadrage · I pipette · Ctrl/Cmd+Z annuler · Ctrl/Cmd+Y rétablir.');return}else if(a[1]==='psLimitations'){alert('PhotoFree prend actuellement en charge les calques raster, pinceau, gomme, formes simples, texte rasterisé, recadrage, réglages de base, filtres rapides et export PNG/JPEG. Les masques avancés, sélections intelligentes, tracés Bézier, Camera Raw, objets dynamiques et IA générative ne sont pas implémentés dans cette version.');return}else if(a[1]==='imageInput')$('#imageInput').click();else if(a[1]==='psFilterBlur'){psSnapshot();psExtraFilter='blur(2px)';psRender()}else if(a[1]==='psFilterSat'){psSnapshot();psExtraFilter='saturate(1.8)';psRender()}else if(a[1]==='psFilterContrast'){psSnapshot();psExtraFilter='contrast(1.35)';psRender()}else $('#'+a[1]).click()});
window.addEventListener('keydown',e=>{if(document.body.classList.contains('mode-image')&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();$('#imgUndo').click()}else if((e.ctrlKey||e.metaKey)&&k==='y'){e.preventDefault();$('#imgRedo').click()}else if(k==='b')$('[data-ps-tool="brush"]').click();else if(k==='e')$('[data-ps-tool="eraser"]').click();else if(k==='t')$('[data-ps-tool="text"]').click();else if(k==='v')$('[data-ps-tool="move"]').click();else if(k==='c')$('[data-ps-tool="crop"]').click();else if(k==='i')$('[data-ps-tool="eyedropper"]').click();}});
})();
