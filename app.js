const $=id=>document.getElementById(id);
const defaultCatalogs={
 "Equipos":[],
 "Protecciones":[],
 "Eventos / disparos":[],
 "Causas":[],
 "Subestaciones":[],
 "Condición operativa":["normales de operación","condiciones anormales de operación"]
};
// Al usar claves nuevas, la app inicia vacía aunque el navegador conserve datos de versiones anteriores.
let catalogs=load("catalogs_v19",defaultCatalogs);
let selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]};
const configs=[
 {key:"evento",input:"searchEvento",results:"resultsEvento",tags:"tagsEvento",catalog:"Eventos / disparos",multi:false},
 {key:"equipo",input:"searchEquipo",results:"resultsEquipo",tags:"tagsEquipo",catalog:"Equipos",multi:true},
 {key:"proteccion",input:"searchProteccion",results:"resultsProteccion",tags:"tagsProteccion",catalog:"Protecciones",multi:true},
 {key:"causa",input:"searchCausa",results:"resultsCausa",tags:"tagsCausa",catalog:"Causas",multi:false}
];
function load(k,def){try{return JSON.parse(localStorage.getItem(k))||def}catch{return def}}
function save(){localStorage.setItem("catalogs_v19",JSON.stringify(catalogs));localStorage.setItem("selected_v19",JSON.stringify(selected))}
function norm(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function render(c){
 const q=norm($(c.input).value), list=(catalogs[c.catalog]||[]).filter(x=>!q||norm(x).includes(q)).filter(x=>!selected[c.key].includes(x));
 const box=$(c.results);box.innerHTML="";
 if(!list.length){if(q){const d=document.createElement("div");d.className="subtle";d.textContent="No se encontraron opciones.";box.append(d)}}
 list.slice(0,80).forEach(item=>{const b=document.createElement("button");b.className="result";b.textContent="+  "+item;b.onclick=()=>{if(c.multi){selected[c.key].push(item)}else{selected[c.key]=[item]}$(c.input).value="";renderAll();save()};box.append(b)});
 const tags=$(c.tags);tags.innerHTML="";
 selected[c.key].forEach(item=>{const t=document.createElement("span");t.className="tag selected-tag selected-"+c.key;
   const presetValues={evento:["Disparo"],causa:["Se investiga"]};
   if((presetValues[c.key]||[]).some(v=>norm(v)===norm(item)))t.classList.add("preset-value");const s=document.createElement("span");s.textContent=item;const b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Quitar "+item);b.textContent="×";b.onclick=()=>{selected[c.key]=selected[c.key].filter(x=>x!==item);renderAll();save()};t.append(s,b);tags.append(t)});
}
function renderCondiciones(){
 const select=$("condicion");
 const current=select.value || "normales de operación";
 select.innerHTML="";
 (catalogs["Condición operativa"]||[]).forEach(item=>{
   const opt=document.createElement("option"); opt.value=item; opt.textContent=item; select.append(opt);
 });
 if((catalogs["Condición operativa"]||[]).includes(current)) select.value=current;
 else if((catalogs["Condición operativa"]||[]).length) select.selectedIndex=0;
 select.classList.toggle("preset-value",norm(select.value)==="normales de operacion");
}
function renderAll(){configs.forEach(render);renderCondiciones()}
configs.forEach(c=>$(c.input).addEventListener("input",()=>render(c)));
$("clearEquipos").onclick=()=>{selected.equipo=[];renderAll();save()};
$("afectacion").onchange=()=>{$("mw").disabled=$("afectacion").value!=="Con afectación";if($("mw").disabled)$("mw").value=""};
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
 items.forEach(item=>{const row=document.createElement("div");row.className="catalog-item";const label=document.createElement("span");label.textContent=item;const del=document.createElement("button");del.type="button";del.textContent="× Eliminar";del.title="Eliminar este elemento del catálogo";del.onclick=()=>{if(!confirm(`¿Eliminar "${item}" del catálogo ${category}?`))return;catalogs[category]=(catalogs[category]||[]).filter(x=>x!==item);configs.forEach(c=>{if(c.catalog===category)selected[c.key]=selected[c.key].filter(x=>x!==item)});save();renderAll();renderCatalogList();$("catalogStatus").textContent=`Elemento eliminado de ${category}.`;};row.append(label,del);box.append(row)});
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
 $("afectacion").value=r.afectacion||"Sin afectación";$("mw").value=r.mw||"";$("afectacion").dispatchEvent(new Event("change"));
 $("condicion").value=r.condicion||"normales de operación";
 selected=JSON.parse(JSON.stringify(r.selected||{evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]}));
 configs.forEach(c=>$(c.input).value="");renderAll();save();
 $("msgGrtvm").value=r.msgGrtvm||"";$("msgZotp").value=r.msgZotp||"";
 $("registerEvent").textContent="Guardar cambios";$("status").textContent="Evento cargado. Modifica los datos y pulsa «Guardar cambios».";
 $("historyPanel").hidden=true;$("toggleHistory").setAttribute("aria-expanded","false");
 document.getElementById("fechaEvento").scrollIntoView({behavior:"smooth",block:"start"});
}
$("newEvent").onclick=()=>{
 editingHistoryId=null;
 $("registerEvent").textContent="Registrar evento";
 $("fechaEvento").value=new Date().toISOString().slice(0,10);
 ["fechaNorm","mw"].forEach(id=>$(id).value="");
 setTimePickerValue("horaEvento","00:00:00");setTimePickerValue("horaNorm","");
 $("afectacion").value="Sin afectación";$("afectacion").dispatchEvent(new Event("change"));
 $("condicion").value="normales de operación";
 selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]};
 configs.forEach(c=>$(c.input).value="");renderAll();save();
 $("msgGrtvm").value="";$("msgZotp").value="";
 $("historyPanel").hidden=true;$("toggleHistory").textContent="Consultar / editar historial";$("toggleHistory").setAttribute("aria-expanded","false");
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
 editingHistoryId=null;saveHistory();renderHistory();$("registerEvent").textContent="Registrar evento";
};
$("toggleHistory").onclick=()=>{
 const panel=$("historyPanel");panel.hidden=!panel.hidden;
 $("toggleHistory").textContent=panel.hidden?"Consultar / editar historial":"Ocultar historial";
 $("toggleHistory").setAttribute("aria-expanded",String(!panel.hidden));
 if(!panel.hidden)renderHistory();
};
$("historySearch").addEventListener("input",renderHistory);

$("fechaEvento").value=new Date().toISOString().slice(0,10);
$("afectacion").value="Sin afectación";$("afectacion").dispatchEvent(new Event("change"));
selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]};
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
   if(file.name.toLowerCase().endsWith(".csv")){const txt=await file.text();sheets={"Equipos":txt.split(/\r?\n/).map(x=>x.split(",")[0]).filter(Boolean)}}
   else {
     if(!window.XLSX)throw new Error("No se pudo cargar el lector Excel. Conéctate a internet y vuelve a intentarlo.");
     const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:"array"});sheets={};
     const headerNames=["equipo","proteccion","protección","evento / disparo","evento","causa","acronimo","acrónimo","descripcion","descripción","condicion operativa","condición operativa"];
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
   const aliases={"Equipos":["Equipos","Equipo","Equipment"],"Protecciones":["Protecciones","Protecciones operadas"],"Eventos / disparos":["Eventos / disparos","Evento / disparo","Eventos","Eventos y disparos"],"Causas":["Causas","Causa del evento","Causa"],"Subestaciones":["Subestaciones","Subestación","Subestacion"],"Condición operativa":["Condición operativa","Condicion operativa","Condiciones operativas","Condición de operación","Condiciones de operación"]};
   let imported=0, duplicates=0, recognized=0;
   const details=[];
   Object.entries(aliases).forEach(([cat,names])=>{
     const key=Object.keys(sheets).find(n=>names.some(a=>norm(a)===norm(n)));
     if(!key)return;
     recognized++;
     const current=catalogs[cat]||[];
     const seen=new Set(current.map(x=>norm(String(x).trim())));
     let added=0, dup=0;
     sheets[key].map(x=>String(x).trim()).filter(Boolean).forEach(value=>{
       const k=norm(value);
       if(seen.has(k)){dup++;duplicates++;}
       else{seen.add(k);current.push(value);added++;imported++;}
     });
     catalogs[cat]=current;
     details.push(`${cat}: ${added} cargados, ${dup} repetidos`);
   });
   if(!recognized){
     const first=Object.keys(sheets)[0];
     if(first){
       const current=catalogs.Equipos||[];
       const seen=new Set(current.map(x=>norm(String(x).trim())));
       let added=0, dup=0;
       sheets[first].map(String).map(x=>x.trim()).filter(Boolean).forEach(value=>{
         const k=norm(value);
         if(seen.has(k)){dup++;duplicates++;}
         else{seen.add(k);current.push(value);added++;imported++;}
       });
       catalogs.Equipos=current;
       details.push(`Equipos: ${added} cargados, ${dup} repetidos`);
     }
   }
   save();renderAll();renderCatalogList();
   const summary=`Importación terminada. Registros nuevos cargados: ${imported}. Repetidos omitidos: ${duplicates}.`;
   $("catalogStatus").textContent=summary+(details.length?" "+details.join(" · "):" No se reconocieron hojas de catálogo.");
   alert(summary+(details.length?"\\n\\n"+details.join("\\n"):""));
 }catch(err){$("catalogStatus").textContent="No se pudo importar: "+err.message}
 e.target.value="";
};
$("templateBtn").onclick=()=>{
 const link=document.createElement("a");
 link.href="./Plantilla_Catalogos_GRTVM_ZOTP.xlsx";
 link.download="Plantilla_Catalogos_GRTVM_ZOTP.xlsx";
 document.body.appendChild(link);link.click();link.remove();
 $("catalogStatus").textContent="Descargando plantilla Excel profesional. Llena las pestañas y vuelve a importar el archivo.";
};
$("clearData").onclick=()=>{if(confirm("¿Eliminar todos los datos de TODOS los catálogos de este dispositivo? Esta acción no se puede deshacer.")){catalogs={ "Equipos":[], "Protecciones":[], "Eventos / disparos":[], "Causas":[], "Subestaciones":[], "Condición operativa":[] };selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]};save();renderAll();renderCatalogList();$("catalogStatus").textContent="Todos los catálogos quedaron vacíos. Los valores predeterminados del formulario se conservan.";}};
