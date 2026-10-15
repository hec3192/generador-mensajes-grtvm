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
 const equipo=selected.equipo.join(", "), evento=selected.evento[0]||"Evento", causa=selected.causa[0]||"Se investiga", prot=selected.proteccion.join(", ");
 const he=get("horaEvento")||"00:00:00", fe=fmtDate(get("fechaEvento")), fn=fmtDate(get("fechaNorm")), hn=get("horaNorm");
 const affected=get("afectacion")==="Con afectación", mw=get("mw");
 const carga=affected?`El evento provocó afectación de carga${mw?` por ${mw} MW`:" (MW por especificar)"}.`:"El evento no provocó afectación de carga.";
 const protec=prot?`\nProtecciones operadas: ${prot}.`:"";
 const obs=get("observaciones")?`\nObservaciones: ${get("observaciones")}.`:"";
 const eventLine=`${he} hrs. ${evento} en ${equipo||"[equipo pendiente]"}${protec}.`;
 const normLine=(fn&&hn)?`\n${fn} ${hn} hrs. Normalizado: ${equipo}.`:`\nPendiente de normalizar: ${equipo}.`;
 const antecedentes=get("antecedentes")||"Las Gerencia Regional de Transmisión Valle de México se encontraba en condiciones";
 const tipo="";
 const causaTexto=causa?` Causa del evento: ${causa}.`:"";
 const cargaTexto=affected?(mw?`, con afectación de ${mw} MW`: ", con afectación de carga (MW por especificar)"):", sin afectación de carga";
 const proteccionesTexto=prot?` Protecciones operadas: ${prot}.`:"";
 const observacionesTexto=get("observaciones")?` Observaciones: ${get("observaciones")}.`:"";
 const grtvm=`NOTA INFORMATIVA DEL EVENTO EN EL ${equipo||"[equipo pendiente]"}${tipo}\n\n${antecedentes||"Las Gerencia Regional de Transmisión Valle de México se encontraba en condiciones"}, ${get("condicion")||"normales de operación"}. El ${fe||"[fecha pendiente]"} a las ${he} se presentó ${evento.toLowerCase()} en ${equipo||"[equipo pendiente]"}${causaTexto}${cargaTexto}.${proteccionesTexto}${observacionesTexto}`;
 const acr=acronyms();
 const zotp=`*${get("zona")||"ZOT PACHUCA"}*\n\n*Secuencia de Evento:*\n\n${eventLine}${normLine}\n\n${carga}${acronyms()?"\n\n"+acronyms():""}`;
 $("msgGrtvm").value=grtvm;$("msgZotp").value=zotp;$("status").textContent="Mensajes generados. Verifica la información antes de distribuirlos.";
}
$("generate").onclick=generate;
$("newEvent").onclick=()=>{["fechaNorm","horaNorm","observaciones","mw"].forEach(id=>$(id).value="");$("horaEvento").value="00:00:00";$("fechaEvento").value=new Date().toISOString().slice(0,10);$("afectacion").value="Sin afectación";$("afectacion").dispatchEvent(new Event("change"));selected={evento:[],equipo:[],proteccion:[],causa:["Se investiga"]};configs.forEach(c=>$(c.input).value="");$("msgGrtvm").value="";$("msgZotp").value="";renderAll();save();$("status").textContent="Formulario limpio."};
document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=async()=>{const value=$(b.dataset.copy).value;if(!value)return;try{await navigator.clipboard.writeText(value);$("status").textContent="Mensaje copiado."}catch{$(b.dataset.copy).select();document.execCommand("copy");$("status").textContent="Mensaje copiado."}});
document.querySelectorAll("[data-msg]").forEach(b=>b.onclick=async()=>{const value=$(b.dataset.msg).value;if(!value){$("status").textContent="Primero genera el mensaje.";return}try{await navigator.clipboard.writeText(value)}catch{}window.open("https://web.whatsapp.com/","_blank");$("status").textContent="Mensaje copiado. Abre WhatsApp y pega el texto en el chat deseado."});

$("addCatalogEntry").onclick=()=>{
 const category=get("catalogType"), value=get("catalogEntry");
 if(!value){$("catalogStatus").textContent="Escribe un elemento antes de agregarlo.";return}
 if(!catalogs[category])catalogs[category]=[];
 if(catalogs[category].some(x=>norm(x)===norm(value))){$("catalogStatus").textContent="Ese elemento ya existe en el catálogo.";return}
 catalogs[category].push(value);catalogs[category].sort((a,b)=>a.localeCompare(b,"es"));
 $("catalogEntry").value="";save();renderAll();
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
   save();renderAll();$("catalogStatus").textContent=`Excel cargado. ${imported} registros importados. Los datos quedan guardados en este iPhone.`;
 }catch(err){$("catalogStatus").textContent="No se pudo importar: "+err.message}
 e.target.value="";
};
$("templateBtn").onclick=()=>alert("El Excel debe tener hojas llamadas: Equipos, Protecciones, Eventos o Eventos / disparos, Causas y Subestaciones. Usa una fila de encabezados. En Subestaciones usa columnas Acrónimo y Descripción. Ejemplo: AAN | ACTOPAN.");
$("clearData").onclick=()=>{if(confirm("¿Borrar catálogos importados y restaurar los ejemplos?")){catalogs=structuredClone(defaultCatalogs);selected={evento:["Disparo"],equipo:[],proteccion:[],causa:["Se investiga"]};save();renderAll();$("catalogStatus").textContent="Catálogos de ejemplo restaurados."}};
$("fechaEvento").value=new Date().toISOString().slice(0,10);
renderAll();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
