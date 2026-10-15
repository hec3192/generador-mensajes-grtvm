const $=id=>document.getElementById(id);
const defaultCatalogs={
 "Equipos":["AAN CP 1","AAN CP 2","AAN CP 3"],
 "Protecciones":["21","50/51","diferencial"],
 "Eventos / disparos":["Disparo","Alarma","Apertura de línea","Cierra"],
 "Causas":["Se investiga","Desconocida"],
 "Subestaciones":["AAN | ACTOPAN","TCM | TECAMAC","AFM | AEROPUERTO FELIPE ANGELES MANIOBRAS"]
};
let catalogs=load("catalogs",defaultCatalogs);
let selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]};
const configs=[
 {key:"evento",input:"searchEvento",results:"resultsEvento",tags:"tagsEvento",catalog:"Eventos / disparos",multi:false},
 {key:"equipo",input:"searchEquipo",results:"resultsEquipo",tags:"tagsEquipo",catalog:"Equipos",multi:true},
 {key:"proteccion",input:"searchProteccion",results:"resultsProteccion",tags:"tagsProteccion",catalog:"Protecciones",multi:true},
 {key:"causa",input:"searchCausa",results:"resultsCausa",tags:"tagsCausa",catalog:"Causas",multi:false}
];
function load(k,def){try{return JSON.parse(localStorage.getItem(k))||def}catch{return def}}
function save(){localStorage.setItem("catalogs",JSON.stringify(catalogs));localStorage.setItem("selected",JSON.stringify(selected))}
function norm(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function render(c){
 const q=norm($(c.input).value), list=(catalogs[c.catalog]||[]).filter(x=>!q||norm(x).includes(q)).filter(x=>!selected[c.key].includes(x));
 const box=$(c.results);box.innerHTML="";
 if(!list.length){if(q){const d=document.createElement("div");d.className="subtle";d.textContent="No se encontraron opciones.";box.append(d)}}
 list.slice(0,80).forEach(item=>{const b=document.createElement("button");b.className="result";b.textContent="+  "+item;b.onclick=()=>{if(c.multi){selected[c.key].push(item)}else{selected[c.key]=[item]}$(c.input).value="";renderAll();save()};box.append(b)});
 const tags=$(c.tags);tags.innerHTML="";
 selected[c.key].forEach(item=>{const t=document.createElement("span");t.className="tag";const s=document.createElement("span");s.textContent=item;const b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Quitar "+item);b.textContent="×";b.onclick=()=>{selected[c.key]=selected[c.key].filter(x=>x!==item);renderAll();save()};t.append(s,b);tags.append(t)});
}
function renderAll(){configs.forEach(render)}
configs.forEach(c=>$(c.input).addEventListener("input",()=>render(c)));
$("clearEquipos").onclick=()=>{selected.equipo=[];renderAll();save()};
$("afectacion").onchange=()=>{$("mw").disabled=$("afectacion").value!=="Con afectación";if($("mw").disabled)$("mw").value=""};
$("mw").disabled=true;

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
 const zotp=`*${get("zona")||"ZOT PACHUCA"}*\n\n*Secuencia de Evento:*\n\n${sequence}\n${normLine}\n\n${cargaZotp}${acr?"\n\n"+acr:""}`;
 $("msgGrtvm").value=grtvm;$("msgZotp").value=zotp;$("status").textContent="Mensajes generados con la estructura institucional. Verifica equipo, hora, protecciones, causa y afectación antes de distribuirlos.";
}
$("generate").onclick=generate;
$("newEvent").onclick=()=>{["fechaNorm","horaNorm","mw"].forEach(id=>$(id).value="");setTimePickerValue("horaEvento","00:00:00");setTimePickerValue("horaNorm","");$("fechaEvento").value=new Date().toISOString().slice(0,10);$("afectacion").value="Sin afectación";$("afectacion").dispatchEvent(new Event("change"));selected={evento:[],equipo:[],proteccion:[],causa:["Se investiga"]};configs.forEach(c=>$(c.input).value="");$("msgGrtvm").value="";$("msgZotp").value="";renderAll();save();$("status").textContent="Formulario limpio."};
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
   else {if(!window.XLSX)throw new Error("No se pudo cargar el lector Excel. Conéctate a internet y vuelve a intentarlo.");const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:"array"});sheets={};wb.SheetNames.forEach(n=>{const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:""});const vals=rows.slice(1).map(r=>r.filter(v=>v!=="").map(String));const arr=vals.map(r=>r.length>1?`${r[0]} | ${r[1]}`:r[0]).filter(Boolean);sheets[n]=arr})}
   const aliases={"Equipos":["Equipos","Equipo","Equipment"],"Protecciones":["Protecciones","Protecciones operadas"],"Eventos / disparos":["Eventos / disparos","Evento / disparo","Eventos","Eventos y disparos"],"Causas":["Causas","Causa del evento","Causa"],"Subestaciones":["Subestaciones","Subestación","Subestacion"]};
   let imported=0;
   Object.entries(aliases).forEach(([cat,names])=>{const key=Object.keys(sheets).find(n=>names.some(a=>norm(a)===norm(n)));if(key){catalogs[cat]=[...new Map([...(catalogs[cat]||[]),...sheets[key].map(x=>String(x).trim()).filter(Boolean)].map(x=>[norm(x),x])).values()];imported+=sheets[key].length}});
   if(!imported){const first=Object.keys(sheets)[0];if(first){catalogs.Equipos=[...new Map([...(catalogs.Equipos||[]),...sheets[first].map(String).filter(Boolean)].map(x=>[norm(x),x])).values()];imported=sheets[first].length}}
   save();renderAll();renderCatalogList();$("catalogStatus").textContent=`Excel cargado. ${imported} registros importados. Los datos quedan guardados en este iPhone.`;
 }catch(err){$("catalogStatus").textContent="No se pudo importar: "+err.message}
 e.target.value="";
};
$("templateBtn").onclick=()=>alert("El Excel debe tener hojas llamadas: Equipos, Protecciones, Eventos o Eventos / disparos, Causas y Subestaciones. Usa una fila de encabezados. En Subestaciones usa columnas Acrónimo y Descripción. Ejemplo: AAN | ACTOPAN.");
$("clearData").onclick=()=>{if(confirm("¿Borrar catálogos importados y restaurar los ejemplos?")){catalogs=structuredClone(defaultCatalogs);selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]};save();renderAll();renderCatalogList();$("catalogStatus").textContent="Catálogos de ejemplo restaurados."}};
$("fechaEvento").value=new Date().toISOString().slice(0,10);
renderAll();
renderCatalogList();

// Mostrar u ocultar la sección de catálogos sin borrar la información guardada.
(()=>{
 const btn=$("toggleCatalogs"), content=$("catalogContent");
 if(!btn||!content)return;
 const key="grtvm_catalogos_ocultos_v1";
 const apply=hidden=>{content.hidden=hidden;btn.textContent=hidden?"Mostrar catálogos ▼":"Ocultar catálogos ▲";btn.setAttribute("aria-expanded",String(!hidden));};
 let hidden=false;try{hidden=localStorage.getItem(key)==="1"}catch(e){}
 apply(hidden);
 btn.addEventListener("click",()=>{hidden=!hidden;apply(hidden);try{localStorage.setItem(key,hidden?"1":"0")}catch(e){}});
})();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
