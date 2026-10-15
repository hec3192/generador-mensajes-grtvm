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
function generate(){
 const equipo=selected.equipo.join(", "), evento=selected.evento[0]||"evento", causa=selected.causa[0]||"Se investiga", prot=selected.proteccion.join(", ");
 const he=get("horaEvento")||"00:00:00", fe=fmtDate(get("fechaEvento")), fn=fmtDate(get("fechaNorm")), hn=get("horaNorm");
 const affected=get("afectacion")==="Con afectación", mw=get("mw"), condicion=get("condicion")||"normales de operación";
 if(!equipo){$("status").textContent="Selecciona al menos un equipo antes de generar los mensajes.";return}
 const cargaZotp=affected?`El evento provocó afectación de carga${mw?` por ${mw} MW`:" (MW por especificar)"}.`:"El evento no provocó afectación de carga.";
 const protecZotp=prot?`\nProtecciones operadas: ${prot}.`:"";
 const eventLine=`${he} hrs. ${evento} en ${equipo}.${protecZotp}`;
 const normLine=(fn&&hn)?`\nNormalizado el ${fn} a las ${hn} hrs.`:`\nPendiente de normalizar: ${equipo}.`;
 const antecedente=`Las Gerencia Regional de Transmisión Valle de México se encontraba en condiciones ${condicion}.`;
 const causaTexto=causa?` Causa del evento: ${causa}.`:"";
 const cargaGRTVM=affected?(mw?`El evento provocó afectación de carga por ${mw} MW.`:"El evento provocó afectación de carga (MW por especificar).") : "El evento no provocó afectación de carga.";
 const proteccionesGRTVM=prot?`\nProtecciones operadas: ${prot}.`:"";
 const encabezadoAfectacion=affected?"CON AFECTACIÓN":"SIN AFECTACIÓN";
 const causaGRTVM=`Causa del evento: ${causa}.`;
 const eventoGRTVM=`El ${fe||"[fecha pendiente]"} a las ${he} se presentó ${evento.toLowerCase()} en ${equipo}.`;
 const grtvm=`NOTA INFORMATIVA DEL EVENTO ${encabezadoAfectacion} EN EL ${equipo}\n\n${antecedente}\n\n${eventoGRTVM}\n${causaGRTVM}\n${cargaGRTVM}${proteccionesGRTVM}`;
 const acr=acronyms();
 const zotp=`*${get("zona")||"ZOT PACHUCA"}*\n\n*Secuencia de Evento:*\n\n${eventLine}${normLine}\n\n${cargaZotp}${ac?"\n\n"+ac:""}`;
 $("msgGrtvm").value=grtvm;$("msgZotp").value=zotp;$("status").textContent="Mensajes generados. Verifica fecha, hora, equipo, causa y afectación antes de distribuirlos.";
}
$("generate").onclick=generate;
$("newEvent").onclick=()=>{["fechaNorm","horaNorm","mw"].forEach(id=>$(id).value="");$("horaEvento").value="00:00:00";$("fechaEvento").value=new Date().toISOString().slice(0,10);$("afectacion").value="Sin afectación";$("afectacion").dispatchEvent(new Event("change"));selected={evento:[],equipo:[],proteccion:[],causa:["Se investiga"]};configs.forEach(c=>$(c.input).value="");$("msgGrtvm").value="";$("msgZotp").value="";renderAll();save();$("status").textContent="Formulario limpio."};
document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=async()=>{const value=$(b.dataset.copy).value;if(!value)return;try{await navigator.clipboard.writeText(value);$("status").textContent="Mensaje copiado."}catch{$(b.dataset.copy).select();document.execCommand("copy");$("status").textContent="Mensaje copiado."}});
document.querySelectorAll("[data-msg]").forEach(b=>b.onclick=async()=>{const value=$(b.dataset.msg).value;if(!value){$("status").textContent="Primero genera el mensaje.";return}try{await navigator.clipboard.writeText(value)}catch{}window.open("https://web.whatsapp.com/","_blank");$("status").textContent="Mensaje copiado. Abre WhatsApp y pega el texto en el chat deseado."});

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
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
