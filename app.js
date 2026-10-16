const $=id=>document.getElementById(id);
const defaultCatalogs={
 "Equipos":[],
 "Protecciones":[],
 "Eventos / disparos":[],
 "Causas":[],
 "Subestaciones":[],
 "Condición operativa":["normales de operación","condiciones anormales de operación"],
 "Afectación de carga":["Sin afectación","Con afectación"]
};
// Al usar claves nuevas, la app inicia vacía aunque el navegador conserve datos de versiones anteriores.
let catalogs=load("catalogs_v19",defaultCatalogs);
Object.keys(defaultCatalogs).forEach(k=>{if(!Array.isArray(catalogs[k]))catalogs[k]=[...(defaultCatalogs[k]||[])];});
if(!catalogs["Afectación de carga"].length)catalogs["Afectación de carga"]=["Sin afectación","Con afectación"];
if(!catalogs["Condición operativa"].length)catalogs["Condición operativa"]=["normales de operación","condiciones anormales de operación"];
let selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"],afectacion:["Sin afectación"],condicion:["normales de operación"]};
const configs=[
 {key:"evento",input:"searchEvento",results:"resultsEvento",tags:"tagsEvento",catalog:"Eventos / disparos",multi:false},
 {key:"equipo",input:"searchEquipo",results:"resultsEquipo",tags:"tagsEquipo",catalog:"Equipos",multi:true},
 {key:"proteccion",input:"searchProteccion",results:"resultsProteccion",tags:"tagsProteccion",catalog:"Protecciones",multi:true},
 {key:"causa",input:"searchCausa",results:"resultsCausa",tags:"tagsCausa",catalog:"Causas",multi:false},
 {key:"afectacion",input:"searchAfectacion",results:"resultsAfectacion",tags:"tagsAfectacion",catalog:"Afectación de carga",multi:false},
 {key:"condicion",input:"searchCondicion",results:"resultsCondicion",tags:"tagsCondicion",catalog:"Condición operativa",multi:false}
];
function load(k,def){try{return JSON.parse(localStorage.getItem(k))||def}catch{return def}}
function save(){localStorage.setItem("catalogs_v19",JSON.stringify(catalogs));localStorage.setItem("selected_v19",JSON.stringify(selected))}
function norm(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim().toLowerCase()}
function isTemplateInstruction(value){
 const v=norm(value);
 return !v || v.includes("capture un registro por fila") ||
   v.includes("no modifique los encabezados") ||
   v.startsWith("catalogo:") || v.startsWith("catálogo:");
}
function cleanCatalogs(){
 const headers={
   "Equipos":["equipo","equipos"],
   "Protecciones":["proteccion","protecciones","protección"],
   "Eventos / disparos":["evento","eventos","evento / disparo","eventos / disparos"],
   "Causas":["causa","causas"],
   "Subestaciones":["acronimo","acrónimo","descripcion","descripción","subestacion","subestación"],
   "Condición operativa":["condicion operativa","condición operativa"],
   "Afectación de carga":["afectacion de carga","afectación de carga"]
 };
 let changed=false;
 Object.keys(catalogs).forEach(cat=>{
   const before=catalogs[cat]||[];
   const after=before.filter(value=>!isTemplateInstruction(value) && !(headers[cat]||[]).includes(norm(value)));
   if(after.length!==before.length){catalogs[cat]=after;changed=true;}
 });
 if(changed)save();
}
cleanCatalogs();
function render(c){
 const q=norm($(c.input).value), list=(catalogs[c.catalog]||[]).filter(x=>!q||norm(x).includes(q)).filter(x=>!selected[c.key].includes(x));
 const box=$(c.results);box.innerHTML="";
 if(!list.length){if(q){const d=document.createElement("div");d.className="subtle";d.textContent="No se encontraron opciones.";box.append(d)}}
 list.slice(0,80).forEach(item=>{const b=document.createElement("button");b.className="result";b.textContent="+  "+item;b.onclick=()=>{if(c.multi){selected[c.key].push(item)}else{selected[c.key]=[item]}$(c.input).value="";renderAll();save()};box.append(b)});
 const tags=$(c.tags);tags.innerHTML="";
 selected[c.key].forEach(item=>{const t=document.createElement("span");t.className="tag selected-tag selected-"+c.key;
   const presetValues={evento:["Disparo"],causa:["Se investiga"],afectacion:["Sin afectación"],condicion:["normales de operación"]};
   if((presetValues[c.key]||[]).some(v=>norm(v)===norm(item)))t.classList.add("preset-value");const s=document.createElement("span");s.textContent=item;const b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Quitar "+item);b.textContent="×";b.onclick=()=>{selected[c.key]=selected[c.key].filter(x=>x!==item);renderAll();save()};t.append(s,b);tags.append(t)});
 if(c.key==="afectacion"||c.key==="condicion"){const hidden=$(c.key);hidden.value=selected[c.key][0]||"";hidden.classList.toggle("preset-value",(selected[c.key][0]||"")=== (c.key==="afectacion"?"Sin afectación":"normales de operación"));}
 if(c.key==="afectacion"){$("mw").disabled=selected.afectacion[0]!=="Con afectación";if($("mw").disabled)$("mw").value="";}
}
function renderCondiciones(){}
function renderAll(){configs.forEach(render);renderCondiciones()}
configs.forEach(c=>$(c.input).addEventListener("input",()=>render(c)));
$("clearEquipos").onclick=()=>{selected.equipo=[];renderAll();save()};
$("mw").disabled=true;
$("condicion").addEventListener("change",()=>{$("condicion").classList.toggle("preset-value",norm($("condicion").value)==="normales de operacion")});

function renderCatalogList(){
 const category=get("catalogType"), query=norm(get("catalogSearch"));
 let items=[...(catalogs[category]||[])];
 if(query)items=items.filter(x=>norm(x).includes(query));
 items.sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}));
 if(get("catalogSort")==="desc")items.reverse();
 $("catalogCount").textContent=`${items.length} elemento${items.length===1?"":"s"}${query?" encontrados":""}`;
 const box=$("catalogList");box.innerHTML="";
 if(!items.length){const empty=document.createElement("div");empty.className="catalog-empty";empty.textContent=query?"No hay elementos que coincidan con la búsqueda.":"Este catálogo todavía no tiene elementos.";box.append(empty);return;}
 items.forEach(item=>{
   const row=document.createElement("div");row.className="catalog-item";
   const label=document.createElement("span");label.className="catalog-item-label";label.textContent=item;
   const actions=document.createElement("div");actions.className="catalog-item-actions";
   const edit=document.createElement("button");edit.type="button";edit.className="catalog-edit";edit.textContent="✎ Modificar";edit.title="Modificar este elemento del catálogo";
   edit.onclick=()=>{
     const revised=prompt(`Modificar elemento de ${category}:`,item);
     if(revised===null)return;
     const value=revised.trim();
     if(!value){alert("El elemento no puede quedar vacío.");return;}
     const duplicate=(catalogs[category]||[]).some(x=>x!==item&&norm(x)===norm(value));
     if(duplicate){alert("Ya existe otro elemento con ese nombre en este catálogo.");return;}
     catalogs[category]=(catalogs[category]||[]).map(x=>x===item?value:x);
     configs.forEach(c=>{if(c.catalog===category&&selected[c.key].includes(item))selected[c.key]=selected[c.key].map(x=>x===item?value:x)});
     save();renderAll();renderCatalogList();$("catalogStatus").textContent=`Elemento modificado en ${category}.`;
   };
   const del=document.createElement("button");del.type="button";del.className="catalog-delete";del.textContent="× Eliminar";del.title="Eliminar este elemento del catálogo";
   del.onclick=()=>{if(!confirm(`¿Eliminar "${item}" del catálogo ${category}?`))return;catalogs[category]=(catalogs[category]||[]).filter(x=>x!==item);configs.forEach(c=>{if(c.catalog===category)selected[c.key]=selected[c.key].filter(x=>x!==item)});save();renderAll();renderCatalogList();$("catalogStatus").textContent=`Elemento eliminado de ${category}.`;};
   actions.append(edit,del);row.append(label,actions);box.append(row)
 });
}
$("catalogType").addEventListener("change",renderCatalogList);
$("catalogSearch").addEventListener("input",renderCatalogList);
$("catalogSort").addEventListener("change",renderCatalogList);

function get(id){return $(id).value.trim()}
function fmtDate(v){if(!v)return "";const [y,m,d]=v.split("-");return `${d}/${m}/${y}`}
function acronyms(){
 const found=[];
 const all=[...selected.equipo];
 all.forEach(e=>{
   const tokens=e.match(/\b[A-ZÁÉÍÓÚÑ]{2,5}\b/g)||[];
   tokens.forEach(tok=>{const desc=(catalogs["Subestaciones"]||[]).find(x=>x.split(/\s*[|–-]\s*/)[0].toUpperCase()===tok);if(desc&&!found.some(y=>y.code===tok))found.push({code:tok,name:desc.split(/\s*[|–-]\s*/).slice(1).join(" - ")})});
 });
 return found.map(x=>`*${x.code}* ${x.name}`).join("\n");
}
function equipmentDisplay(raw){
 const sub=(catalogs["Subestaciones"]||[]).map(x=>{const parts=x.split(/\s*[|–-]\s*/);return {code:(parts[0]||"").trim(),name:parts.slice(1).join(" - ").trim()}}).filter(x=>x.code&&x.name);
 let out=raw;
 sub.sort((a,b)=>b.code.length-a.code.length).forEach(x=>{
   const re=new RegExp(`\\b${x.code.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}\\b(?!\\s*\\()`,"g");
   out=out.replace(re,`${x.code} (${x.name})`);
 });
 return out;
}

// Selectores de hora compatibles con iPhone: hora, minuto y segundo por separado.
function setupTimePicker(hiddenId, defaultValue=""){
 const wrap=$(hiddenId==="horaEvento"?"pickerHoraEvento":"pickerHoraNorm");
 const parts=[{key:"hh",label:"HH",max:23},{key:"mm",label:"mm",max:59},{key:"ss",label:"ss",max:59}];
 wrap.innerHTML="";
 parts.forEach(part=>{
   const box=document.createElement("div");box.className="time-part";
   const label=document.createElement("span");label.textContent=part.label;
   const sel=document.createElement("select");sel.setAttribute("aria-label",part.label);
   if(hiddenId==="horaNorm") {const blank=document.createElement("option");blank.value="";blank.textContent="--";sel.append(blank)}
   for(let i=0;i<=part.max;i++){const opt=document.createElement("option");opt.value=String(i).padStart(2,"0");opt.textContent=opt.value;sel.append(opt)}
   sel.dataset.part=part.key;box.append(label,sel);wrap.append(box);
   sel.addEventListener("change",()=>syncTimePicker(hiddenId));
 });
 if(defaultValue) setTimePickerValue(hiddenId,defaultValue); else syncTimePicker(hiddenId);
}
function setTimePickerValue(hiddenId,value){
 const wrap=$(hiddenId==="horaEvento"?"pickerHoraEvento":"pickerHoraNorm");
 const m=String(value||"").match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
 const vals=(hiddenId==="horaNorm"&&!value)?["",""," ".trim()]:m?[m[1].padStart(2,"0"),m[2],(m[3]||"00")]:["00","00","00"];
 [...wrap.querySelectorAll("select")].forEach((sel,i)=>{sel.value=vals[i];});
 syncTimePicker(hiddenId);
}
function syncTimePicker(hiddenId){
 const wrap=$(hiddenId==="horaEvento"?"pickerHoraEvento":"pickerHoraNorm");
 const vals=[...wrap.querySelectorAll("select")].map(s=>s.value);
 $(hiddenId).value=(hiddenId==="horaNorm"&&vals.some(v=>v===""))?"":vals.join(":");
}
setupTimePicker("horaEvento","00:00:00");
setupTimePicker("horaNorm","");

function normalizeTimeValue(id, required=false){
 const el=$(id); let v=(el.value||"").trim();
 if(!v){if(required){el.value="00:00:00";return "00:00:00"}return ""}
 // Accept HH:mm, HH:mm:ss, and digits such as 140000 or 1400.
 if(/^\d{1,2}:\d{2}$/.test(v)) v += ":00";
 else if(/^\d{1,2}:\d{2}:\d{2}$/.test(v)) {}
 else if(/^\d{4}$/.test(v)) v=v.slice(0,2)+":"+v.slice(2)+":00";
 else if(/^\d{6}$/.test(v)) v=v.slice(0,2)+":"+v.slice(2,4)+":"+v.slice(4,6);
 else {$("status").textContent="Selecciona una hora válida usando HH, mm y ss.";return null}
 const m=v.match(/^(\d{2}):(\d{2}):(\d{2})$/);
 if(!m||+m[1]>23||+m[2]>59||+m[3]>59){$("status").textContent="Hora no válida. Selecciona valores entre 00:00:00 y 23:59:59.";return null}
 el.value=v;return v;
}
["horaEvento","horaNorm"].forEach(id=>{
 const el=$(id);

});
function generate(){
 const equipoRaw=selected.equipo.join(", "), equipo=equipmentDisplay(equipoRaw), evento=selected.evento[0]||"evento", causa=selected.causa[0]||"Desconocida", prot=selected.proteccion.join(", ");
 const he=normalizeTimeValue("horaEvento",true), fe=fmtDate(get("fechaEvento")), fn=fmtDate(get("fechaNorm")), hn=normalizeTimeValue("horaNorm",false);
 if(he===null||hn===null)return;
 const affected=get("afectacion")==="Con afectación", mw=get("mw"), condicion=get("condicion")||"normales de operación";
 if(!equipoRaw){$("status").textContent="Selecciona al menos un equipo antes de generar los mensajes.";return}
 const estado=affected?"CON AFECTACIÓN":"SIN AFECTACIÓN";
 const objetivo=`Objetivo: Informar sobre el evento ${affected?"con":"sin"} afectación por ${evento.toLowerCase()} en ${equipo}.`;
 const antecedente=`Las Gerencia Regional de Transmisión Valle de México se encontraba en condiciones ${condicion}.`;
 const hora24=he;
 const protectionLine=prot?` opera ${prot}.`:".";
 const sequence=`${hora24} hrs. ${evento} en ${equipoRaw}${protectionLine}`;
 const normLine=(fn&&hn)?`Normalizado el ${fn} a las ${hn.length===5?hn+":00":hn} hrs.`:`Pendiente de normalizar: ${equipoRaw}.`;
 const cargaGRTVM=affected?(mw?`El evento provocó afectación de carga por ${mw} MW.`:"El evento provocó afectación de carga (MW por especificar).") : "El evento no provocó afectación de carga.";
 const causaTexto=causa||"Desconocida";
 const grtvm=`*NOTA INFORMATIVA DEL EVENTO ${estado} EN EL ${equipo}*\n\n${objetivo}\n\n*Antecedentes*\n\n${antecedente}\n\n*Secuencia de Evento:*\n\n${sequence}\n${normLine}\n\n${cargaGRTVM}\n\n*Causa de Evento:*\n\n${causaTexto}.`;
 const cargaZotp=affected?`El evento provocó afectación de carga${mw?` por ${mw} MW`:" (MW por especificar)"}.` : "El evento no provocó afectación de carga.";
 const acr=acronyms();
 const zotp=`*NOTA OPERATIVA ZOTP*\n\n*Secuencia de Evento:*\n\n${sequence}\n${normLine}\n\n${cargaZotp}${acr?"\n\n"+acr:""}`;
 $("msgGrtvm").value=grtvm;$("msgZotp").value=zotp;$("status").textContent="Mensajes generados con la estructura institucional. Verifica equipo, hora, protecciones, causa y afectación antes de distribuirlos.";
}
$("generate").onclick=generate;

// Historial local: registrar, consultar, editar y eliminar eventos.
let historyItems=load("eventHistory_v23",[]);
let editingHistoryId=null;
function saveHistory(){localStorage.setItem("eventHistory_v23",JSON.stringify(historyItems));}
function currentRecord(){
 return {
  id: editingHistoryId || ("evt-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)),
  updatedAt:new Date().toISOString(),
  fechaEvento:get("fechaEvento"),horaEvento:get("horaEvento"),fechaNorm:get("fechaNorm"),horaNorm:get("horaNorm"),
  afectacion:get("afectacion"),mw:get("mw"),condicion:get("condicion"),
  selected:JSON.parse(JSON.stringify(selected)),
  msgGrtvm:get("msgGrtvm"),msgZotp:get("msgZotp")
 };
}
function historySummary(r){
 const eq=(r.selected?.equipo||[]).join(", ")||"Sin equipo seleccionado";
 const ev=(r.selected?.evento||[])[0]||"Disparo";
 const cause=(r.selected?.causa||[])[0]||"Se investiga";
 return {title:`${ev} — ${eq}`,meta:`${fmtDate(r.fechaEvento)||"Sin fecha"} · Causa: ${cause} · ${r.afectacion||"Sin afectación"}`};
}
function renderHistory(){
 const query=norm(get("historySearch"));
 const list=$("historyList");list.innerHTML="";
 const filtered=[...historyItems].sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||"")).filter(r=>{
  const s=historySummary(r);return !query||norm([s.title,s.meta,r.msgGrtvm,r.msgZotp].join(" ")).includes(query);
 });
 $("historyCount").textContent=`${filtered.length} evento${filtered.length===1?"":"s"}${query?" encontrados":""}`;
 if(!filtered.length){const empty=document.createElement("div");empty.className="catalog-empty";empty.textContent=query?"No hay eventos que coincidan con la búsqueda.":"Todavía no hay eventos registrados.";list.append(empty);return;}
 filtered.forEach(r=>{
  const item=document.createElement("article");item.className="history-item";
  const head=document.createElement("div");head.className="history-item-head";
  const text=document.createElement("div");const title=document.createElement("div");title.className="history-item-title";const summary=historySummary(r);title.textContent=summary.title;
  const meta=document.createElement("div");meta.className="history-item-meta";meta.textContent=summary.meta;text.append(title,meta);head.append(text);item.append(head);
  const actions=document.createElement("div");actions.className="history-item-actions";
  const edit=document.createElement("button");edit.className="primary";edit.textContent="Editar";edit.onclick=()=>loadHistoryRecord(r.id);
  const view=document.createElement("button");view.className="outline";view.textContent="Ver mensajes";view.onclick=()=>{$("msgGrtvm").value=r.msgGrtvm||"";$("msgZotp").value=r.msgZotp||"";$("status").textContent="Mensajes del historial cargados para consulta.";document.getElementById("msgGrtvm").scrollIntoView({behavior:"smooth",block:"center"});};
  const del=document.createElement("button");del.className="danger";del.textContent="Eliminar";del.onclick=()=>{if(!confirm("¿Eliminar este evento del historial?"))return;historyItems=historyItems.filter(x=>x.id!==r.id);saveHistory();renderHistory();};
  actions.append(edit,view,del);item.append(actions);list.append(item);
 });
}
function loadHistoryRecord(id){
 const r=historyItems.find(x=>x.id===id);if(!r)return;
 editingHistoryId=r.id;
 $("fechaEvento").value=r.fechaEvento||"";setTimePickerValue("horaEvento",r.horaEvento||"00:00:00");
 $("fechaNorm").value=r.fechaNorm||"";setTimePickerValue("horaNorm",r.horaNorm||"");
 $("mw").value=r.mw||"";
 selected=JSON.parse(JSON.stringify(r.selected||{evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"],afectacion:[r.afectacion||"Sin afectación"],condicion:[r.condicion||"normales de operación"]}));
 selected.afectacion=selected.afectacion||[r.afectacion||"Sin afectación"];selected.condicion=selected.condicion||[r.condicion||"normales de operación"];
 configs.forEach(c=>$(c.input).value="");renderAll();save();
 $("msgGrtvm").value=r.msgGrtvm||"";$("msgZotp").value=r.msgZotp||"";
 $("registerEvent").textContent="Guardar cambios";$("status").textContent="Evento cargado. Modifica los datos y pulsa «Guardar cambios».";
 $("historyPanel").hidden=true;$("toggleHistoryTop").setAttribute("aria-expanded","false");
 document.getElementById("fechaEvento").scrollIntoView({behavior:"smooth",block:"start"});
}
$("newEvent").onclick=()=>{
 editingHistoryId=null;
 $("registerEvent").textContent="Registrar evento";
 $("fechaEvento").value=new Date().toISOString().slice(0,10);
 ["fechaNorm","mw"].forEach(id=>$(id).value="");
 setTimePickerValue("horaEvento","00:00:00");setTimePickerValue("horaNorm","");
 selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"],afectacion:["Sin afectación"],condicion:["normales de operación"]};
 configs.forEach(c=>$(c.input).value="");renderAll();save();
 $("msgGrtvm").value="";$("msgZotp").value="";
 $("historyPanel").hidden=true;$("toggleHistoryTop").textContent="Consultar / editar historial";$("toggleHistoryTop").setAttribute("aria-expanded","false");
 $("status").textContent="Formulario limpio. Puedes capturar un nuevo evento.";
 document.getElementById("fechaEvento").scrollIntoView({behavior:"smooth",block:"start"});
};
$("registerEvent").onclick=()=>{
 if(!$("msgGrtvm").value.trim()||!$("msgZotp").value.trim())generate();
 if(!$("msgGrtvm").value.trim()||!$("msgZotp").value.trim())return;
 const record=currentRecord();
 if(editingHistoryId){
  const index=historyItems.findIndex(r=>r.id===editingHistoryId);
  if(index>=0)historyItems[index]={...record,id:editingHistoryId};else historyItems.unshift(record);
  $("status").textContent="Cambios del evento guardados en el historial.";
 }else{
  historyItems.unshift(record);
  $("status").textContent="Evento registrado correctamente en el historial.";
 }
 const savedMessage=$("status").textContent;editingHistoryId=null;saveHistory();renderHistory();$("registerEvent").textContent="Registrar evento";$("newEvent").click();$("status").textContent=savedMessage+" Formulario limpio y listo para el siguiente evento.";
};
$("toggleHistoryTop").onclick=()=>{
 const panel=$("historyPanel");panel.hidden=!panel.hidden;
 $("toggleHistoryTop").textContent=panel.hidden?"Consultar / editar historial":"Ocultar historial";
 $("toggleHistoryTop").setAttribute("aria-expanded",String(!panel.hidden));
 if(!panel.hidden)renderHistory();
};
$("historySearch").addEventListener("input",renderHistory);

$("fechaEvento").value=new Date().toISOString().slice(0,10);
selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"],afectacion:["Sin afectación"],condicion:["normales de operación"]};
configs.forEach(c=>$(c.input).value="");$("msgGrtvm").value="";$("msgZotp").value="";
renderAll();save();$("status").textContent="Listo para capturar un evento.";
document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=async()=>{const value=$(b.dataset.copy).value;if(!value)return;try{await navigator.clipboard.writeText(value);$("status").textContent="Mensaje copiado."}catch{$(b.dataset.copy).select();document.execCommand("copy");$("status").textContent="Mensaje copiado."}});
document.querySelectorAll("[data-msg]").forEach(b=>b.onclick=async()=>{
 const value=$(b.dataset.msg).value;
 if(!value){$("status").textContent="Primero genera el mensaje.";return}
 // Invocar directamente la app instalada evita la redirección a web.whatsapp.com
 // que puede ocurrir con wa.me dentro de navegadores integrados de iOS.
 try{await navigator.clipboard.writeText(value)}catch{}
 const appUrl=`whatsapp://send?text=${encodeURIComponent(value)}`;
 $("status").textContent="Intentando abrir la aplicación WhatsApp. Si no se abre, el mensaje quedó copiado para pegarlo manualmente.";
 window.location.href=appUrl;
});

$("addCatalogEntry").onclick=()=>{
 const category=get("catalogType"), value=get("catalogEntry");
 if(!value){$("catalogStatus").textContent="Escribe un elemento antes de agregarlo.";return}
 if(!catalogs[category])catalogs[category]=[];
 if(catalogs[category].some(x=>norm(x)===norm(value))){$("catalogStatus").textContent="Ese elemento ya existe en el catálogo.";return}
 catalogs[category].push(value);catalogs[category].sort((a,b)=>a.localeCompare(b,"es"));
 $("catalogEntry").value="";save();renderAll();renderCatalogList();
 $("catalogStatus").textContent=`Elemento agregado a ${category}. Se guardó en este dispositivo.`;
};
$("catalogEntry").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("addCatalogEntry").click()}});

$("excelFile").onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
   let sheets;
   if(file.name.toLowerCase().endsWith(".csv")){
      const txt=await file.text();
      const parseCSV=text=>{
        const rows=[];let row=[],cell="",quoted=false;
        for(let i=0;i<text.length;i++){
          const ch=text[i];
          if(ch==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}
          else if(ch==='"'){quoted=!quoted;}
          else if(ch===","&&!quoted){row.push(cell);cell="";}
          else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell="";}
          else cell+=ch;
        }
        if(cell.length||row.length){row.push(cell);rows.push(row);}
        return rows;
      };
      const rows=parseCSV(txt.replace(/^\uFEFF/,""));
      sheets={};
      const map={"equipos":"Equipos","protecciones":"Protecciones","eventos / disparos":"Eventos / disparos","eventos":"Eventos / disparos","causas":"Causas","subestaciones":"Subestaciones","condición operativa":"Condición operativa","condicion operativa":"Condición operativa","afectación de carga":"Afectación de carga","afectacion de carga":"Afectación de carga"};
      if(rows.length&&norm(rows[0][0])==="catalogo"&&norm(rows[0][1])==="registro"){
        rows.slice(1).forEach(r=>{const cat=map[norm(r[0])];if(cat&&r[1]){if(!sheets[cat])sheets[cat]=[];sheets[cat].push(r[1].trim());}});
      }else{
        sheets={"Equipos":rows.map(r=>String(r[0]||"").trim()).filter(Boolean)};
      }
    }
   else {
     if(!window.XLSX)throw new Error("No se pudo cargar el lector Excel. Conéctate a internet y vuelve a intentarlo.");
     const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:"array"});sheets={};
     const headerNames=["equipo","proteccion","protección","evento / disparo","evento","causa","acronimo","acrónimo","descripcion","descripción","condicion operativa","condición operativa","afectacion de carga","afectación de carga"];
     wb.SheetNames.forEach(n=>{
       const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:""});
       // La plantilla tiene título y una instrucción antes de los encabezados.
       // Busca la fila de encabezados y toma únicamente las filas posteriores.
       const headerIndex=rows.findIndex(r=>r.some(v=>headerNames.includes(norm(v))));
       if(headerIndex<0){sheets[n]=[];return;}
       const headers=rows[headerIndex].map(v=>String(v??"").trim());
       const dataRows=rows.slice(headerIndex+1);
       const arr=dataRows.map(r=>{
         const cells=r.map(v=>String(v??"").trim());
         while(cells.length&&cells[cells.length-1]==="")cells.pop();
         if(!cells.some(v=>v!==""))return "";
         // Subestaciones conserva acrónimo y descripción en una sola opción.
         if(norm(n)==="subestaciones"){
           const code=cells[0]||"", desc=cells[1]||"";
           return code&&desc?`${code} | ${desc}`:(code||desc);
         }
         return cells[0]||"";
       }).filter(Boolean);
       sheets[n]=arr;
     });
   }
   const aliases={
     "Equipos":["equipos","equipo","equipment"],
     "Protecciones":["protecciones","proteccion","protecciones operadas"],
     "Eventos / disparos":["eventos","eventos / disparos","evento / disparo","eventos y disparos","evento","disparos"],
     "Causas":["causas","causa del evento","causa"],
     "Subestaciones":["subestaciones","subestacion"],
     "Condición operativa":["condicion operativa","condiciones operativas","condicion de operacion","condiciones de operacion"],
     "Afectación de carga":["afectación de carga","afectacion de carga"]
   };
   let imported=0, duplicates=0, recognized=0;
   const details=[];
   Object.entries(aliases).forEach(([cat,names])=>{
     const key=Object.keys(sheets).find(n=>names.some(a=>a===norm(n)) && (sheets[n]||[]).length>0);
     if(!key)return;
     recognized++;
     const current=catalogs[cat]||[];
     const seen=new Set(current.map(x=>norm(String(x).trim())));
     let added=0, dup=0;
     sheets[key].map(x=>String(x).trim()).filter(value=>Boolean(value)&&!isTemplateInstruction(value)&&!(["Equipos","Protecciones","Eventos / disparos","Causas","Subestaciones","Condición operativa"].includes(cat)&&( {"Equipos":["equipo","equipos"],"Protecciones":["proteccion","protecciones","protección"],"Eventos / disparos":["evento","eventos","evento / disparo","eventos / disparos"],"Causas":["causa","causas"],"Subestaciones":["acronimo","acrónimo","descripcion","descripción","subestacion","subestación"],"Condición operativa":["condicion operativa","condición operativa"],
   "Afectación de carga":["afectacion de carga","afectación de carga"]}[cat]||[]).includes(norm(value)))).forEach(value=>{
       const k=norm(value);
       if(seen.has(k)){dup++;duplicates++;}
       else{seen.add(k);current.push(value);added++;imported++;}
     });
     catalogs[cat]=current;
     details.push(`${cat}: ${added} cargados, ${dup} repetidos`);
   });
   if(!recognized){
     const first=Object.keys(sheets).find(n=>(sheets[n]||[]).length>0);
     if(first){
       const current=catalogs.Equipos||[];
       const seen=new Set(current.map(x=>norm(String(x).trim())));
       let added=0, dup=0;
       sheets[first].map(String).map(x=>x.trim()).filter(value=>Boolean(value)&&!isTemplateInstruction(value)&&!["equipo","equipos"].includes(norm(value))).forEach(value=>{
         const k=norm(value);
         if(seen.has(k)){dup++;duplicates++;}
         else{seen.add(k);current.push(value);added++;imported++;}
       });
       catalogs.Equipos=current;
       details.push(`Equipos: ${added} cargados, ${dup} repetidos`);
     }
   }
   if(!recognized && imported===0)throw new Error("No se encontraron registros importables. Usa la plantilla oficial y escribe los datos debajo de los encabezados.");
   save();renderAll();renderCatalogList();
   const summary=`Importación terminada. Registros nuevos cargados: ${imported}. Repetidos omitidos: ${duplicates}.`;
   $("catalogStatus").textContent=summary+(details.length?" "+details.join(" · "):" No se reconocieron hojas de catálogo.");
   alert(summary+(details.length?"\n\n"+details.join("\n"):""));
 }catch(err){$("catalogStatus").textContent="No se pudo importar: "+err.message;alert("No se pudo importar el archivo. "+err.message)}
 e.target.value="";
};
$("templateBtn").onclick=()=>{
 const link=document.createElement("a");
 link.href="./Plantilla_Catalogos_GRTVM_ZOTP.xlsx";
 link.setAttribute("download","Plantilla_Catalogos_GRTVM_ZOTP.xlsx");
 link.target="_self";
 document.body.appendChild(link);
 link.click();
 link.remove();
 $("catalogStatus").textContent="Se solicitó la descarga de la plantilla. Si no inicia, verifica que Plantilla_Catalogos_GRTVM_ZOTP.xlsx esté publicado junto a index.html.";
};

$("exportCatalogs").onclick=async()=>{
 try{
   const stamp=new Date().toISOString().slice(0,10);
   const exportMap=[
     {category:"Equipos",sheet:"Equipos",header:["Equipo"]},
     {category:"Protecciones",sheet:"Protecciones",header:["Protección"]},
     {category:"Eventos / disparos",sheet:"Eventos",header:["Evento / disparo"]},
     {category:"Causas",sheet:"Causas",header:["Causa"]},
     {category:"Subestaciones",sheet:"Subestaciones",header:["Acrónimo","Descripción"]},
     {category:"Condición operativa",sheet:"Condición operativa",header:["Condición operativa"]},
     {category:"Afectación de carga",sheet:"Afectación de carga",header:["Afectación de carga"]}
   ];
   const csvFallback=()=>{
     const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
     const lines=["Catálogo,Registro"];
     exportMap.forEach(({category})=>(catalogs[category]||[]).forEach(value=>lines.push(quote(category)+","+quote(value))));
     const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8;"});
     const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`Catalogos_GRTVM_ZOTP_${stamp}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
   };
   if(!window.XLSX){csvFallback();$("catalogStatus").textContent="La biblioteca XLSX no está disponible; se descargó un CSV compatible con Excel con los datos actuales.";return;}
   // Partir de la plantilla oficial para conservar hojas, títulos, encabezados, anchos y estilos.
   let wb;
   try{
     const response=await fetch("./Plantilla_Catalogos_GRTVM_ZOTP.xlsx",{cache:"no-store"});
     if(!response.ok)throw new Error("No se pudo cargar la plantilla publicada");
     wb=XLSX.read(await response.arrayBuffer(),{type:"array",cellStyles:true});
   }catch(templateErr){
     // Si no se puede recuperar la plantilla, generar un libro con las mismas hojas y encabezados.
     wb=XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["PLANTILLA DE CATÁLOGOS | GRTVM – ZOTP"],["Formato de exportación de los catálogos actuales"]]),"Instrucciones");
     exportMap.forEach(({sheet,header})=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([[`CATÁLOGO: ${sheet.toUpperCase()}`],["Capture un registro por fila. No modifique los encabezados."],header]),sheet));
   }
   exportMap.forEach(({category,sheet,header})=>{
     let ws=wb.Sheets[sheet];
     if(!ws){
       ws=XLSX.utils.aoa_to_sheet([[`CATÁLOGO: ${sheet.toUpperCase()}`],["Capture un registro por fila. No modifique los encabezados."],header]);
       wb.Sheets[sheet]=ws;wb.SheetNames.push(sheet);
     }
     // La plantilla tiene títulos en filas 1-2 y encabezados en fila 3; se conservan y se reemplazan los datos.
     const range=XLSX.utils.decode_range(ws["!ref"]||"A1:A3");
     // Guardar estilos de las primeras filas de datos de la plantilla para aplicarlos a las nuevas filas.
     const styleSamples=[];
     for(let sampleRow=3;sampleRow<=Math.min(range.e.r,4);sampleRow++){
       const sample=[];
       for(let c=0;c<header.length;c++){
         const cell=ws[XLSX.utils.encode_cell({r:sampleRow,c})];
         sample.push(cell&&cell.s?JSON.parse(JSON.stringify(cell.s)):null);
       }
       styleSamples.push(sample);
     }
     for(let r=3;r<=range.e.r;r++)for(let c=0;c<Math.max(range.e.c+1,header.length);c++){
       const addr=XLSX.utils.encode_cell({r,c});
       if(ws[addr])delete ws[addr];
     }
     const values=(catalogs[category]||[]).map(value=>{
       const txt=String(value??"").trim();
       if(category==="Subestaciones"){
         const parts=txt.split(/\s*[|–-]\s*/);return [parts[0]||"",parts.slice(1).join(" - ")||""];
       }
       return [txt];
     }).filter(row=>row.some(cell=>String(cell).trim()!==""));
     // Aplicar formato explícito para que los colores se conserven al escribir el archivo.
     // Se usa xlsx-js-style porque SheetJS Community Edition no garantiza la escritura de estilos.
     const titleStyle={font:{bold:true,color:{rgb:"FFFFFFFF"},sz:14},fill:{patternType:"solid",fgColor:{rgb:"FF17365D"}},alignment:{vertical:"center"}};
     const noteStyle={font:{italic:true,color:{rgb:"FF667085"},sz:10},fill:{patternType:"solid",fgColor:{rgb:"FFF3F6FB"}},alignment:{vertical:"center",wrapText:true}};
     const headerStyle={font:{bold:true,color:{rgb:"FFFFFFFF"}},fill:{patternType:"solid",fgColor:{rgb:"FF2F5597"}},alignment:{horizontal:"center",vertical:"center",wrapText:true},border:{bottom:{style:"medium",color:{rgb:"FF17365D"}},top:{style:"thin",color:{rgb:"FF17365D"}},left:{style:"thin",color:{rgb:"FFD9E2F3"}},right:{style:"thin",color:{rgb:"FFD9E2F3"}}}};
     const dataBorder={top:{style:"thin",color:{rgb:"FFD9E2F3"}},bottom:{style:"thin",color:{rgb:"FFD9E2F3"}},left:{style:"thin",color:{rgb:"FFD9E2F3"}},right:{style:"thin",color:{rgb:"FFD9E2F3"}}};
     for(let c=0;c<header.length;c++){
       const titleAddr=XLSX.utils.encode_cell({r:0,c});
       const noteAddr=XLSX.utils.encode_cell({r:1,c});
       const headAddr=XLSX.utils.encode_cell({r:2,c});
       if(!ws[titleAddr])ws[titleAddr]={t:"s",v:c===0?`CATÁLOGO: ${sheet.toUpperCase()}`:""};
       if(!ws[noteAddr])ws[noteAddr]={t:"s",v:c===0?"Capture un registro por fila. No modifique los encabezados.":""};
       ws[titleAddr].s=titleStyle;ws[noteAddr].s=noteStyle;
       ws[headAddr]={t:"s",v:header[c],s:headerStyle};
     }
     values.forEach((row,i)=>row.forEach((value,c)=>{
       const addr=XLSX.utils.encode_cell({r:i+3,c});
       const baseFill=(i%2===0)?"FFF7FAFF":"FFFFFFFF";
       ws[addr]={t:"s",v:value,s:{font:{color:{rgb:"FF344054"}},fill:{patternType:"solid",fgColor:{rgb:baseFill}},alignment:{vertical:"center",wrapText:true},border:dataBorder}};
     }));
     const lastRow=Math.max(2,values.length+2);
     ws["!ref"]=`A1:${XLSX.utils.encode_col(Math.max(header.length-1,0))}${lastRow+1}`;
     if(category==="Subestaciones")ws["!cols"]=[{wch:30},{wch:42}];
     else ws["!cols"]=[{wch:42}];
     ws["!rows"]=[{hpt:26},{hpt:30},{hpt:24},...values.map(()=>({hpt:21}))];
     // Actualizar referencias de tablas de Excel para que incluyan todos los registros exportados.
     if(Array.isArray(ws["!tables"]))ws["!tables"].forEach(t=>{if(t.ref)t.ref=`A3:${XLSX.utils.encode_col(header.length-1)}${lastRow+1}`;});
   });
   // Agregar la hoja de afectación de carga si la plantilla publicada aún no la incluye.
   const stampName=`Catalogos_GRTVM_ZOTP_${stamp}.xlsx`;
   try{
     XLSX.writeFile(wb,stampName,{cellStyles:true});
     $("catalogStatus").textContent="Exportación completada con colores, encabezados azules, títulos oscuros y filas alternadas, usando la estructura de la plantilla.";
   }catch(writeErr){csvFallback();$("catalogStatus").textContent="No se pudo generar XLSX; se descargó un CSV compatible con Excel.";}
 }catch(err){$("catalogStatus").textContent="No se pudo exportar: "+err.message;alert("No se pudo exportar el Excel. "+err.message)}
};
$("clearData").onclick=()=>{if(confirm("¿Eliminar todos los datos de TODOS los catálogos de este dispositivo? Esta acción no se puede deshacer.")){catalogs={ "Equipos":[], "Protecciones":[], "Eventos / disparos":[], "Causas":[], "Subestaciones":[], "Condición operativa":[], "Afectación de carga":[] };selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"],afectacion:["Sin afectación"],condicion:["normales de operación"]};save();renderAll();renderCatalogList();$("catalogStatus").textContent="Todos los catálogos quedaron vacíos. Los valores predeterminados del formulario se conservan.";}};
