import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// CONFIG
// ============================================================
const API = "https://innofy-backend-production.up.railway.app"; // ← cambia por tu URL de Railway
const WOMPI_REDIRECT = "https://innofy.josepolo.co/pago-exitoso"; // ← cambia por tu dominio

const PACKAGES = [
  { id: 1, name: "Starter", projects: 1,  priceCOP: "175.000", tag: null },
  { id: 2, name: "Growth",  projects: 5,  priceCOP: "545.000", tag: "MÁS POPULAR" },
  { id: 3, name: "Scale",   projects: 10, priceCOP: "990.000", tag: null },
];

const MODULES = [
  { id:0,  code:"M0",  name:"Brief del negocio",    short:"Brief",       free:true  },
  { id:1,  code:"M1",  name:"Radiografía",           short:"Radiografía", free:true  },
  { id:2,  code:"M2",  name:"Segmentación",          short:"Segmento",    free:false },
  { id:3,  code:"M3",  name:"Propuesta de valor",    short:"Propuesta",   free:false },
  { id:4,  code:"M4",  name:"Canales",               short:"Canales",     free:false },
  { id:5,  code:"M5",  name:"Relación con clientes", short:"Relación",    free:false },
  { id:6,  code:"M6",  name:"Fuentes de ingresos",   short:"Ingresos",    free:false },
  { id:7,  code:"M7",  name:"Recursos clave",        short:"Recursos",    free:false },
  { id:8,  code:"M8",  name:"Actividades clave",     short:"Actividades", free:false },
  { id:9,  code:"M9",  name:"Socios clave",          short:"Socios",      free:false },
  { id:10, code:"M10", name:"Costos y coherencia",   short:"Costos",      free:false },
  { id:11, code:"M11", name:"Pitch",                 short:"Pitch",       free:false },
];

const BMC = ["Segmentos","Propuesta de valor","Canales","Relación","Ingresos","Recursos","Actividades","Socios","Costos"];

const SYS = `Eres INNOFY, mentor de modelo de negocio. Arquetipo: VC experimentado que también ha fundado. Tono: directo, preciso, sin porrismo. Siempre en español. 12 módulos (M0–M11). REGLA: máximo 2 preguntas por turno. M2–M10: 4 entregables por módulo (Ficha + Diagnóstico + Decálogo + Canvas Maestro). NUNCA celebres sin validación. SIEMPRE terminas con acción concreta.`;

// ============================================================
// API HELPERS
// ============================================================
async function apiFetch(path, opts = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error de servidor");
  return data;
}

// ============================================================
// MARKDOWN
// ============================================================
function md(t) {
  if (!t) return "";
  let h = t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g,"<em>$1</em>")
    .replace(/`([^`]+)`/g,"<code>$1</code>");
  const rx = /(\|[^\n]+\|\n)(\|[-| :]+\|\n)((?:\|[^\n]+\|\n)*)/g;
  h = h.replace(rx,(_,hd,sp,bd)=>{
    const pr = r=>r.trim().split("|").filter((_,i,a)=>i>0&&i<a.length-1).map(c=>c.trim());
    const ths = pr(hd).map(h=>`<th>${h}</th>`).join("");
    const trs = bd.trim().split("\n").filter(Boolean).map(r=>`<tr>${pr(r).map(c=>`<td>${c}</td>`).join("")}</tr>`).join("");
    return `<div class="tw"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  });
  return `<p>${h.replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^---$/gm,"<hr>").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>")}</p>`;
}

// ============================================================
// SCREENS
// ============================================================

// AUTH SCREEN — login / register
// Google icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}>
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
  );
}

function AuthScreen({ onAuth }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lee error de URL si Google redirigió con error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("auth_error");
    if (err) setError("Error al iniciar sesión con Google. Intenta de nuevo.");
  }, []);

  const handleGoogle = () => {
    setLoading(true);
    window.location.href = `${API}/api/auth/google`;
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#080808",padding:"2rem",fontFamily:"'DM Mono',monospace"}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{marginBottom:"3rem"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:80,letterSpacing:5,color:"#e8ffe8",lineHeight:.9,textShadow:"0 0 30px rgba(200,255,200,0.35)"}}>INNOFY</div>
          <div style={{fontSize:10,color:"#888",letterSpacing:2,textTransform:"uppercase",marginTop:6}}>Innofy — Mentor de modelo de negocio</div>
        </div>

        <div style={{borderLeft:"2px solid #e8ffe8",paddingLeft:"1.5rem",boxShadow:"-3px 0 15px rgba(200,255,200,0.05)"}}>
          <div style={{marginBottom:"1.5rem"}}>
            <div style={{fontSize:10,color:"#aaa",marginBottom:"1rem",lineHeight:1.8}}>
              Programa de <strong style={{color:"#e8ffe8"}}>12 módulos</strong> para construir,
              validar y pitchear tu modelo de negocio.
            </div>
            <div style={{borderLeft:"1px solid #1e1e1e",paddingLeft:"1rem"}}>
              {[
                ["M0","Brief del negocio — contexto e industria"],
                ["M1","Radiografía — Canvas + SWOT + Decálogo"],
                ["M2","Segmentación — ICP + TAM/SAM/SOM"],
                ["M3","Propuesta de valor — Jobs, Pains, Gains"],
                ["M4","Canales — arquitectura de llegada al cliente"],
                ["M5","Relación con clientes — vínculo y retención"],
                ["M6","Fuentes de ingresos — monetización"],
                ["M7","Recursos clave — infraestructura del modelo"],
                ["M8","Actividades clave — ejecución"],
                ["M9","Socios clave — alianzas estratégicas"],
                ["M10","Costos y coherencia — BMC completo"],
                ["M11","Pitch — inversionistas, clientes y equipo"],
              ].map(([code, desc], i) => (
                <div key={code} style={{display:"flex",gap:10,marginBottom:5,alignItems:"flex-start"}}>
                  <div style={{fontSize:8,color:i<2?"#e8ffe8":"#555",letterSpacing:1,fontWeight:500,
                    minWidth:28,paddingTop:1,textShadow:i<2?"0 0 6px rgba(200,255,200,0.4)":"none"}}>
                    {code}
                  </div>
                  <div style={{fontSize:9,color:i<2?"#aaa":"#666",lineHeight:1.5}}>{desc}</div>
                  {i<2 && <div style={{fontSize:7,color:"#e8ffe8",letterSpacing:1,paddingTop:2,textShadow:"0 0 5px rgba(200,255,200,0.3)",flexShrink:0}}>GRATIS</div>}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleGoogle} disabled={loading}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,
              width:"100%",background:"#fff",border:"none",color:"#666",
              fontSize:11,fontWeight:500,letterSpacing:1,padding:"14px 20px",
              fontFamily:"'DM Mono',monospace",cursor:loading?"not-allowed":"pointer",
              opacity:loading?.6:1,transition:"opacity .2s",
              boxShadow:"0 0 0 1px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.3)"}}>
            <GoogleIcon />
            {loading ? "Redirigiendo..." : "Continuar con Google"}
          </button>

          {error && (
            <div style={{marginTop:"1rem",fontSize:9,color:"#aa5050",letterSpacing:.5,lineHeight:1.5}}>{error}</div>
          )}
        </div>

        <div style={{marginTop:"2rem",fontSize:8,color:"#444",letterSpacing:2,lineHeight:2}}>
          ACCESO SEGURO VÍA GOOGLE<br/>
          NO GUARDAMOS CONTRASEÑAS
        </div>
      </div>
    </div>
  );
}

// PACKAGES SCREEN — selección de paquete
function PackagesScreen({ token, user, onPurchased, onSkip }) {
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wompiRef, setWompiRef] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  const handleBuy = async () => {
    if (!selected) return;
    setLoading(true); setCodeMsg(null); setVerifyError(null);
    try {
      const data = await apiFetch("/api/payments/init", {
        method:"POST", body: JSON.stringify({ packageId: selected, discountCode: code||undefined })
      }, token);

      if (data.free) {
        onPurchased({ packageId: data.packageId, projectsMax: data.projectsMax });
        return;
      }
      if (data.error) { setCodeMsg(data.error); setLoading(false); return; }

      setWompiRef(data.reference);

      // Inyectar widget Wompi
      const old = document.getElementById("wompi-s");
      if (old) old.remove();
      const script = document.createElement("script");
      script.id = "wompi-s";
      script.src = "https://checkout.wompi.co/widget.js";
      script.setAttribute("data-render","button");
      script.setAttribute("data-public-key", data.publicKey);
      script.setAttribute("data-currency", data.currency);
      script.setAttribute("data-amount-in-cents", String(data.amountCents));
      script.setAttribute("data-reference", data.reference);
      script.setAttribute("data-signature:integrity", data.integrityHash);
      script.setAttribute("data-redirect-url", WOMPI_REDIRECT);
      document.getElementById("wompi-container").appendChild(script);
      setTimeout(()=>{ document.getElementById("wompi-container")?.querySelector("button")?.click(); setLoading(false); }, 1500);
    } catch(e) { setCodeMsg(e.message); setLoading(false); }
  };

  const handleVerify = async () => {
    if (!wompiRef) return;
    setVerifying(true); setVerifyError(null);
    try {
      const data = await apiFetch("/api/payments/verify", {
        method:"POST", body: JSON.stringify({ reference: wompiRef })
      }, token);
      onPurchased({ packageId: data.packageId, projectsMax: data.projectsMax });
    } catch(e) { setVerifyError(e.message); }
    setVerifying(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#080808",padding:"3rem 1.5rem",fontFamily:"'DM Mono',monospace"}}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <div style={{marginBottom:"2.5rem"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,letterSpacing:4,color:"#e8ffe8",textShadow:"0 0 25px rgba(200,255,200,0.3)"}}>ELIGE TU PAQUETE</div>
          <div style={{fontSize:10,color:"#444",letterSpacing:2,marginTop:4}}>M0 Y M1 SIEMPRE GRATIS · ACCESO DE POR VIDA</div>
        </div>

        {/* Paquetes */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:"2rem"}}>
          {PACKAGES.map(pkg=>{
            const sel = selected===pkg.id;
            return (
              <div key={pkg.id} onClick={()=>setSelected(pkg.id)}
                style={{position:"relative",border:`1px solid ${sel?"#e8ffe8":"#1e1e1e"}`,
                  padding:"1.25rem",cursor:"pointer",background:sel?"rgba(232,255,232,0.04)":"#0a0a0a",
                  transition:"all .2s",boxShadow:sel?"0 0 20px rgba(200,255,200,0.08)":"none"}}>
                {pkg.tag && (
                  <div style={{position:"absolute",top:-1,left:0,right:0,textAlign:"center",
                    background:"#e8ffe8",color:"#080808",fontSize:7,letterSpacing:2,padding:"3px 0",fontWeight:500}}>
                    {pkg.tag}
                  </div>
                )}
                <div style={{paddingTop:pkg.tag?"12px":"0"}}>
                  <div style={{fontSize:9,color:"#444",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>{pkg.name}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:2,color:sel?"#e8ffe8":"#888",
                    textShadow:sel?"0 0 15px rgba(200,255,200,0.3)":"none",lineHeight:1,marginBottom:8}}>
                    ${pkg.priceCOP}
                  </div>
                  <div style={{fontSize:9,color:"#999",letterSpacing:1}}>COP · pago único</div>
                  <div style={{marginTop:"1rem",paddingTop:"1rem",borderTop:"1px solid #1a1a1a"}}>
                    <div style={{fontSize:11,color:sel?"#c0c0b0":"#444",marginBottom:4}}>
                      <span style={{color:sel?"#e8ffe8":"#555",textShadow:sel?"0 0 6px rgba(200,255,200,0.3)":"none"}}>
                        {pkg.projects === 1 ? "1 proyecto" : `Hasta ${pkg.projects} proyectos`}
                      </span>
                    </div>
                    {["12 módulos completos","Canvas Maestro en vivo","Entregables exportables"].map((f,i)=>(
                      <div key={i} style={{fontSize:9,color:"#888",marginBottom:3}}>→ {f}</div>
                    ))}
                  </div>
                </div>
                {sel && (
                  <div style={{position:"absolute",top:8,right:10,width:14,height:14,borderRadius:"50%",
                    background:"#e8ffe8",display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:8,color:"#080808",boxShadow:"0 0 8px rgba(200,255,200,0.4)"}}>✓</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Código de descuento — solo P1 */}
        {selected === 1 && (
          <div style={{marginBottom:"1rem"}}>
            <div style={{fontSize:9,color:"#999",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Código de descuento</div>
            <div style={{display:"flex",gap:8}}>
              <input value={code} onChange={e=>{ setCode(e.target.value.toUpperCase()); setCodeMsg(null); }}
                placeholder="CÓDIGO"
                style={{flex:1,background:"#0e0e0e",border:"1px solid #1e1e1e",color:"#c0c0b8",
                  fontSize:12,padding:"9px 12px",outline:"none",fontFamily:"'DM Mono',monospace",
                  letterSpacing:3,textTransform:"uppercase"}}/>
            </div>
            {codeMsg && <div style={{marginTop:6,fontSize:9,color:codeMsg.includes("OFF")?"#e8ffe8":"#aa5050",letterSpacing:.5}}>{codeMsg}</div>}
            {selected !== 1 && code && <div style={{marginTop:6,fontSize:9,color:"#aa5050"}}>Los códigos solo aplican al Paquete 1 (Starter)</div>}
          </div>
        )}

        <div id="wompi-container" style={{marginBottom:"0.75rem"}} />

        <button onClick={handleBuy} disabled={!selected||loading}
          style={{width:"100%",background:"#e8ffe8",border:"none",color:"#080808",
            fontSize:11,fontWeight:500,letterSpacing:3,textTransform:"uppercase",padding:"15px",
            fontFamily:"'DM Mono',monospace",boxShadow:"0 0 20px rgba(200,255,200,0.2)",
            opacity:(!selected||loading)?.4:1,cursor:(!selected||loading)?"not-allowed":"pointer",
            marginBottom:"0.75rem",transition:"opacity .2s"}}>
          {loading?"Preparando pago...":selected?`Comprar ${PACKAGES.find(p=>p.id===selected)?.name} →`:"Selecciona un paquete"}
        </button>

        {wompiRef && (
          <button onClick={handleVerify} disabled={verifying}
            style={{width:"100%",background:"transparent",border:"1px solid #1e1e1e",color:"#444",
              fontSize:9,letterSpacing:2,textTransform:"uppercase",padding:"11px",
              fontFamily:"'DM Mono',monospace",cursor:"pointer",opacity:verifying?.4:1,marginBottom:"0.5rem"}}>
            {verifying?"Verificando...":"Ya pagué — verificar acceso"}
          </button>
        )}
        {verifyError && <div style={{fontSize:9,color:"#aa5050",letterSpacing:.5}}>{verifyError}</div>}

        <button onClick={onSkip}
          style={{width:"100%",background:"transparent",border:"none",color:"#888",
            fontSize:8,letterSpacing:2,textTransform:"uppercase",padding:"10px",
            fontFamily:"'DM Mono',monospace",cursor:"pointer",marginTop:4}}>
          Continuar con M0 y M1 gratis →
        </button>
      </div>
    </div>
  );
}

// PROJECTS DASHBOARD
function ProjectsDashboard({ token, user, quota, onOpenProject, onNewProject, onUpgrade }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:"", business:"" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/projects", {}, token)
      .then(d => { setProjects(d.projects); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const createProject = async () => {
    if (!form.name || !form.business) return;
    setCreating(true); setError(null);
    try {
      const data = await apiFetch("/api/projects", {
        method:"POST", body: JSON.stringify({ name: form.name, business: form.business })
      }, token);
      onOpenProject(data.project);
    } catch(e) {
      if (e.message.includes("límite")) {
        setShowForm(false);
        onUpgrade();
      } else setError(e.message);
    }
    setCreating(false);
  };

  const canCreate = quota.remaining > 0;
  const pkg = PACKAGES.find(p=>p.id===quota.packageId);

  return (
    <div style={{minHeight:"100vh",background:"#080808",padding:"2.5rem 1.5rem",fontFamily:"'DM Mono',monospace"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"2rem",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:3,color:"#e8ffe8",textShadow:"0 0 20px rgba(200,255,200,0.25)"}}>MIS PROYECTOS</div>
            <div style={{fontSize:9,color:"#999",letterSpacing:2,marginTop:2}}>{user.name} · {user.email}</div>
          </div>
          <div style={{textAlign:"right"}}>
            {pkg ? (
              <>
                <div style={{fontSize:9,color:"#e8ffe8",letterSpacing:2,textShadow:"0 0 6px rgba(200,255,200,0.3)"}}>{pkg.name}</div>
                <div style={{fontSize:9,color:"#444",letterSpacing:1,marginTop:2}}>
                  {quota.used}/{quota.max} proyectos usados
                </div>
                {quota.remaining <= 1 && quota.max > 0 && (
                  <button onClick={onUpgrade}
                    style={{marginTop:6,background:"transparent",border:"1px solid #e8ffe8",color:"#e8ffe8",
                      fontSize:8,letterSpacing:2,padding:"5px 10px",fontFamily:"'DM Mono',monospace",cursor:"pointer",
                      textShadow:"0 0 6px rgba(200,255,200,0.3)"}}>
                    Hacer upgrade →
                  </button>
                )}
              </>
            ) : (
              <button onClick={onUpgrade}
                style={{background:"#e8ffe8",border:"none",color:"#080808",fontSize:8,letterSpacing:2,
                  textTransform:"uppercase",padding:"8px 14px",fontFamily:"'DM Mono',monospace",cursor:"pointer",
                  boxShadow:"0 0 12px rgba(200,255,200,0.2)"}}>
                Comprar paquete →
              </button>
            )}
          </div>
        </div>

        {/* Quota bar */}
        {quota.max > 0 && (
          <div style={{marginBottom:"1.5rem"}}>
            <div style={{height:2,background:"#1a1a1a",borderRadius:1}}>
              <div style={{height:"100%",width:`${Math.min(100,(quota.used/quota.max)*100)}%`,
                background:"#e8ffe8",borderRadius:1,boxShadow:"0 0 6px rgba(200,255,200,0.4)",transition:"width .5s"}}/>
            </div>
            <div style={{fontSize:8,color:"#888",marginTop:4,letterSpacing:1}}>
              {quota.remaining} PROYECTO{quota.remaining!==1?"S":""} DISPONIBLE{quota.remaining!==1?"S":""}
            </div>
          </div>
        )}

        {/* Projects list */}
        {loading ? (
          <div style={{fontSize:11,color:"#888",letterSpacing:1}}>Cargando...</div>
        ) : projects.length === 0 ? (
          <div style={{border:"1px dashed #1a1a1a",padding:"2.5rem",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888",marginBottom:8}}>Sin proyectos aún</div>
            <div style={{fontSize:9,color:"#666"}}>Crea tu primer proyecto para comenzar</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1rem"}}>
            {projects.map(p=>(
              <div key={p.id} onClick={()=>onOpenProject(p)}
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",
                  background:"#0a0a0a",border:"1px solid #1a1a1a",cursor:"pointer",
                  transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#e8ffe8"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#1a1a1a"}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:"#c0c0b0",marginBottom:3,fontWeight:500}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#3a3a3a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.business}</div>
                </div>
                <div style={{flexShrink:0,textAlign:"right"}}>
                  <div style={{fontSize:9,color:"#e8ffe8",letterSpacing:1,textShadow:"0 0 6px rgba(200,255,200,0.3)"}}>
                    M{p.curMod} · {p.doneMods?.length||0}/12
                  </div>
                  <div style={{height:2,width:60,background:"#1a1a1a",marginTop:4,borderRadius:1}}>
                    <div style={{height:"100%",width:`${Math.round(((p.doneMods?.length||0)/12)*100)}%`,
                      background:"#e8ffe8",borderRadius:1,boxShadow:"0 0 4px rgba(200,255,200,0.3)"}}/>
                  </div>
                </div>
                <div style={{fontSize:16,color:"#888"}}>›</div>
              </div>
            ))}
          </div>
        )}

        {/* New project form */}
        {showForm ? (
          <div style={{border:"1px solid #1e2a1e",padding:"1.25rem",background:"rgba(232,255,232,0.02)",marginTop:"1rem"}}>
            <div style={{fontSize:9,color:"#e8ffe8",letterSpacing:2,textTransform:"uppercase",marginBottom:"1rem",textShadow:"0 0 6px rgba(200,255,200,0.3)"}}>Nuevo proyecto</div>
            <div style={{marginBottom:"0.75rem"}}>
              <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:5}}>NOMBRE DEL PROYECTO</div>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                placeholder="Ej. FoodTech Caribe"
                style={{background:"transparent",border:"none",borderBottom:"1px solid #222",color:"#d0d0c0",
                  fontSize:13,padding:"6px 0",width:"100%",outline:"none",fontFamily:"'DM Mono',monospace"}}/>
            </div>
            <div style={{marginBottom:"1rem"}}>
              <div style={{fontSize:8,color:"#444",letterSpacing:2,marginBottom:5}}>DESCRIPCIÓN DEL NEGOCIO</div>
              <input value={form.business} onChange={e=>setForm(f=>({...f,business:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&createProject()}
                placeholder="Ej. Plataforma de delivery local"
                style={{background:"transparent",border:"none",borderBottom:"1px solid #222",color:"#d0d0c0",
                  fontSize:13,padding:"6px 0",width:"100%",outline:"none",fontFamily:"'DM Mono',monospace"}}/>
            </div>
            {error && <div style={{fontSize:9,color:"#aa5050",marginBottom:"0.75rem"}}>{error}</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={createProject} disabled={!form.name||!form.business||creating}
                style={{background:"#e8ffe8",border:"none",color:"#080808",fontSize:9,letterSpacing:2,
                  padding:"10px 18px",fontFamily:"'DM Mono',monospace",cursor:"pointer",
                  opacity:(!form.name||!form.business||creating)?.4:1}}>
                {creating?"Creando...":"Crear →"}
              </button>
              <button onClick={()=>{setShowForm(false);setError(null);setForm({name:"",business:""});}}
                style={{background:"transparent",border:"1px solid #1e1e1e",color:"#999",fontSize:9,
                  letterSpacing:2,padding:"10px 16px",fontFamily:"'DM Mono',monospace",cursor:"pointer"}}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={()=>canCreate?setShowForm(true):onUpgrade()}
            style={{width:"100%",background:"transparent",border:`1px solid ${canCreate?"#1e2a1e":"#1a1a1a"}`,
              color:canCreate?"#e8ffe8":"#2a2a2a",fontSize:9,letterSpacing:2,textTransform:"uppercase",
              padding:"13px",fontFamily:"'DM Mono',monospace",cursor:"pointer",
              textShadow:canCreate?"0 0 6px rgba(200,255,200,0.3)":"none",transition:"all .2s",marginTop:"0.5rem"}}>
            {canCreate?"+ Nuevo proyecto":"Límite alcanzado — hacer upgrade →"}
          </button>
        )}
      </div>
    </div>
  );
}

// UPGRADE SCREEN
function UpgradeScreen({ token, user, currentPackageId, onUpgraded, onBack }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wompiRef, setWompiRef] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const eligible = PACKAGES.filter(p=>p.id > currentPackageId);

  const handleUpgrade = async () => {
    if (!selected) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch("/api/payments/upgrade/init", {
        method:"POST", body: JSON.stringify({ toPackageId: selected })
      }, token);
      setWompiRef(data.reference);
      const old = document.getElementById("wompi-up");
      if (old) old.remove();
      const script = document.createElement("script");
      script.id = "wompi-up";
      script.src = "https://checkout.wompi.co/widget.js";
      script.setAttribute("data-render","button");
      script.setAttribute("data-public-key", data.publicKey);
      script.setAttribute("data-currency", data.currency);
      script.setAttribute("data-amount-in-cents", String(data.amountCents));
      script.setAttribute("data-reference", data.reference);
      script.setAttribute("data-signature:integrity", data.integrityHash);
      script.setAttribute("data-redirect-url", WOMPI_REDIRECT);
      document.getElementById("wompi-up-container").appendChild(script);
      setTimeout(()=>{ document.getElementById("wompi-up-container")?.querySelector("button")?.click(); setLoading(false); }, 1500);
    } catch(e) { setError(e.message); setLoading(false); }
  };

  const handleVerify = async () => {
    if (!wompiRef) return;
    setVerifying(true); setError(null);
    try {
      const data = await apiFetch("/api/payments/verify", {
        method:"POST", body: JSON.stringify({ reference: wompiRef })
      }, token);
      onUpgraded({ packageId: data.packageId, projectsMax: data.projectsMax });
    } catch(e) { setError(e.message); }
    setVerifying(false);
  };

  const selPkg = PACKAGES.find(p=>p.id===selected);
  const curPkg = PACKAGES.find(p=>p.id===currentPackageId);
  const diffCents = selPkg && curPkg
    ? (parseInt(selPkg.priceCOP.replace(".","")) - parseInt(curPkg.priceCOP.replace(".",""))) * 100
    : null;

  return (
    <div style={{minHeight:"100vh",background:"#080808",padding:"2.5rem 1.5rem",fontFamily:"'DM Mono',monospace"}}>
      <div style={{maxWidth:560,margin:"0 auto"}}>
        <button onClick={onBack} style={{background:"transparent",border:"none",color:"#999",fontSize:9,letterSpacing:2,fontFamily:"'DM Mono',monospace",cursor:"pointer",marginBottom:"1.5rem"}}>← Volver</button>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,letterSpacing:3,color:"#e8ffe8",textShadow:"0 0 20px rgba(200,255,200,0.25)",marginBottom:"0.5rem"}}>UPGRADE</div>
        <div style={{fontSize:9,color:"#444",letterSpacing:2,marginBottom:"2rem"}}>
          PLAN ACTUAL: {curPkg?.name||"Sin paquete"} · PAGAS SOLO LA DIFERENCIA
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1.5rem"}}>
          {eligible.map(pkg=>{
            const sel = selected===pkg.id;
            const curCents = curPkg ? parseInt(curPkg.priceCOP.replace(".",""))*100 : 0;
            const pkgCents = parseInt(pkg.priceCOP.replace(".",""))*100;
            const diff = pkgCents - curCents;
            return (
              <div key={pkg.id} onClick={()=>setSelected(pkg.id)}
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",
                  border:`1px solid ${sel?"#e8ffe8":"#1e1e1e"}`,cursor:"pointer",background:sel?"rgba(232,255,232,0.04)":"#0a0a0a",
                  boxShadow:sel?"0 0 15px rgba(200,255,200,0.06)":"none",transition:"all .2s"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:sel?"#e8ffe8":"#888",letterSpacing:1}}>{pkg.name}</div>
                  <div style={{fontSize:9,color:"#999",marginTop:3}}>Hasta {pkg.projects} proyectos</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:sel?"#e8ffe8":"#555",letterSpacing:1}}>
                    +${(diff/100).toLocaleString("es-CO")}
                  </div>
                  <div style={{fontSize:8,color:"#888",letterSpacing:1}}>COP diferencia</div>
                </div>
                {sel && <div style={{width:14,height:14,borderRadius:"50%",background:"#e8ffe8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#080808",flexShrink:0}}>✓</div>}
              </div>
            );
          })}
        </div>

        <div id="wompi-up-container" style={{marginBottom:"0.75rem"}}/>
        <button onClick={handleUpgrade} disabled={!selected||loading}
          style={{width:"100%",background:"#e8ffe8",border:"none",color:"#080808",fontSize:11,fontWeight:500,
            letterSpacing:3,textTransform:"uppercase",padding:"15px",fontFamily:"'DM Mono',monospace",
            boxShadow:"0 0 20px rgba(200,255,200,0.2)",opacity:(!selected||loading)?.4:1,
            cursor:(!selected||loading)?"not-allowed":"pointer",marginBottom:"0.75rem"}}>
          {loading?"Preparando...":selected?`Upgrade a ${selPkg?.name} →`:"Selecciona un paquete"}
        </button>
        {wompiRef && (
          <button onClick={handleVerify} disabled={verifying}
            style={{width:"100%",background:"transparent",border:"1px solid #1e1e1e",color:"#444",fontSize:9,
              letterSpacing:2,textTransform:"uppercase",padding:"11px",fontFamily:"'DM Mono',monospace",cursor:"pointer",opacity:verifying?.4:1}}>
            {verifying?"Verificando...":"Ya pagué — verificar"}
          </button>
        )}
        {error && <div style={{marginTop:8,fontSize:9,color:"#aa5050"}}>{error}</div>}
      </div>
    </div>
  );
}

// CHAT / PROJECT SCREEN
function ProjectScreen({ token, user, project, hasPaid, onBack, onSave }) {
  const [messages, setMessages] = useState(project.messages || []);
  const [curMod, setCurMod] = useState(project.curMod || 0);
  const [done, setDone] = useState(project.doneMods || []);
  const [dels, setDels] = useState(project.deliverables || {});
  const [canvas, setCanvas] = useState(project.canvasData || {});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [panel, setPanel] = useState("chat");
  const [openDel, setOpenDel] = useState({});
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, loading]);

  const save = useCallback(async (msgs, cur, comp, d, c) => {
    try {
      await apiFetch(`/api/projects/${project.id}`, {
        method:"PUT", body: JSON.stringify({ curMod:cur, doneMods:comp, messages:msgs, deliverables:d, canvasData:c })
      }, token);
    } catch(e) {}
  }, [project.id, token]);

  const detectProgress = useCallback((text, modId) => {
    if (text.includes("Evaluación INNOFY") && text.includes("|")) {
      setDels(prev => {
        const updated = {...prev, [modId]: [...(prev[modId]||[]), text]};
        return updated;
      });
      if (!done.includes(modId)) {
        const newDone = [...done, modId];
        setDone(newDone);
        if (modId < 11) setCurMod(modId + 1);
      }
    }
  }, [done]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const mod = MODULES[curMod];
    if (!mod.free && !hasPaid) { alert("Este módulo requiere paquete activo."); return; }

    const userMsg = {role:"user", content:input.trim()};
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setLoading(true);

    const compStr = done.length > 0 ? `Completados: ${done.map(i=>MODULES[i].code).join(", ")}.` : "Ninguno.";
    const sys = `${SYS}\n\nCONTEXTO: Participante: ${user.name}. Negocio: ${project.business}. Módulo: ${mod.code} — ${mod.name}. ${compStr}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys,
          messages: newMsgs.map(m=>({role:m.role,content:m.content})) })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Error.";
      const finalMsgs = [...newMsgs, {role:"assistant",content:reply}];
      setMessages(finalMsgs);
      detectProgress(reply, curMod);
      await save(finalMsgs, curMod, done, dels, canvas);
    } catch(e) { setMessages([...newMsgs, {role:"assistant",content:"Error de conexión."}]); }
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(), 50);
  }, [input, loading, messages, curMod, done, dels, canvas, user, project, hasPaid, detectProgress, save]);

  const prog = Math.round((done.length/12)*100);
  const allDels = Object.entries(dels).flatMap(([mi,items])=>(items||[]).map((t,i)=>({mi:parseInt(mi),t,i})));
  const mod = MODULES[curMod];

  return (
    <div style={{display:"flex",height:"100vh",background:"#080808",overflow:"hidden",fontFamily:"'DM Mono',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#080808;}::-webkit-scrollbar-thumb{background:#222;}
        table{width:100%;border-collapse:collapse;font-size:11px;}
        th{padding:6px 8px;text-align:left;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#e8ffe8;border-bottom:1px solid #222;font-weight:400;text-shadow:0 0 6px rgba(200,255,200,0.3);}
        td{padding:6px 8px;border-bottom:1px solid #161616;color:#888;vertical-align:top;line-height:1.5;}
        .tw{overflow-x:auto;margin:10px 0;border:1px solid #1a1a1a;}
        h2{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:2px;color:#e8ffe8;margin:12px 0 5px;text-shadow:0 0 10px rgba(200,255,200,0.3);}
        strong{color:#d8d8d0;font-weight:500;}code{background:#141410;padding:1px 5px;font-size:10px;color:#e8ffe8;}
        hr{border:none;border-top:1px solid #1a1a1a;margin:10px 0;}p{margin:4px 0;line-height:1.65;}
        .blink span{display:inline-block;width:4px;height:4px;background:#e8ffe8;border-radius:50%;margin:0 2px;animation:bl 1s infinite;box-shadow:0 0 5px rgba(200,255,200,0.6);}
        .blink span:nth-child(2){animation-delay:.2s;}.blink span:nth-child(3){animation-delay:.4s;}
        @keyframes bl{0%,80%,100%{opacity:.15}40%{opacity:1}}
        .tab{height:100%;padding:0 12px;background:transparent;border:none;border-left:1px solid #1a1a1a;font-size:8px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:#2a2a2a;font-family:'DM Mono',monospace;transition:all .15s;}
        .tab.on{background:#0e0e0e;color:#e8ffe8;text-shadow:0 0 6px rgba(200,255,200,0.35);}
      `}</style>

      {sidebar && (
        <div style={{width:185,flexShrink:0,background:"#0a0a0a",borderRight:"1px solid #161616",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"12px 12px 8px",borderBottom:"1px solid #161616"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3,color:"#e8ffe8",textShadow:"0 0 12px rgba(200,255,200,0.3)"}}>INNOFY</div>
          </div>
          <div style={{padding:"8px 12px",borderBottom:"1px solid #161616"}}>
            <div style={{fontSize:11,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{project.name}</div>
            <div style={{fontSize:9,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{project.business}</div>
            <div style={{height:1,background:"#161616",marginTop:7}}>
              <div style={{height:"100%",width:`${prog}%`,background:"#e8ffe8",boxShadow:"0 0 5px rgba(200,255,200,0.4)",transition:"width .5s"}}/>
            </div>
            <div style={{fontSize:7,color:"#888",marginTop:3}}>{done.length}/12 · {prog}%</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"5px 0"}}>
            {MODULES.map(m=>{
              const isDone=done.includes(m.id); const isCur=m.id===curMod;
              const locked=!m.free&&!hasPaid&&!isDone;
              return (
                <div key={m.id} onClick={()=>!locked&&setCurMod(m.id)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",cursor:locked?"not-allowed":"pointer",
                    borderLeft:`2px solid ${isCur?"#e8ffe8":"transparent"}`,
                    background:isCur?"rgba(232,255,232,0.05)":"transparent",opacity:locked?.25:1,marginBottom:1}}>
                  <div style={{width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:7,flexShrink:0,background:isDone?"#e8ffe8":"transparent",
                    color:isDone?"#080808":isCur?"#e8ffe8":"#2a2a2a",
                    border:`1px solid ${isDone?"#e8ffe8":isCur?"#e8ffe8":"#1e1e1e"}`,
                    boxShadow:isCur?"0 0 6px rgba(200,255,200,0.25)":"none"}}>
                    {isDone?"✓":m.code.replace("M","")}
                  </div>
                  <div style={{fontSize:9,color:isCur?"#e8ffe8":isDone?"#777":"#2a2a2a",
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                    textShadow:isCur?"0 0 6px rgba(200,255,200,0.3)":"none"}}>
                    {m.short}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{padding:"8px 12px",borderTop:"1px solid #161616"}}>
            <button onClick={onBack} style={{width:"100%",background:"transparent",border:"1px solid #1a1a1a",color:"#888",fontSize:7,letterSpacing:2,textTransform:"uppercase",padding:"6px",fontFamily:"'DM Mono',monospace",cursor:"pointer"}}>
              ← Proyectos
            </button>
          </div>
        </div>
      )}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <div style={{height:42,background:"#0a0a0a",borderBottom:"1px solid #161616",display:"flex",alignItems:"center",flexShrink:0}}>
          <button onClick={()=>setSidebar(v=>!v)} style={{width:42,height:42,background:"transparent",border:"none",borderRight:"1px solid #161616",color:"#888",fontSize:13,cursor:"pointer"}}>{sidebar?"◂":"▸"}</button>
          <div style={{padding:"0 14px",borderRight:"1px solid #161616",height:"100%",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:10,color:"#e8ffe8",letterSpacing:2,textShadow:"0 0 6px rgba(200,255,200,0.3)"}}>{mod.code}</span>
            <span style={{fontSize:10,color:"#888"}}>{mod.name}</span>
          </div>
          <div style={{display:"flex",height:"100%",marginLeft:"auto"}}>
            {["chat","canvas","entregas"].map(p=>(
              <button key={p} className={`tab${panel===p?" on":""}`} onClick={()=>setPanel(p)}>
                {p}{p==="entregas"&&allDels.length>0?` (${allDels.length})`:""}
              </button>
            ))}
          </div>
        </div>

        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {panel==="chat" && (
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{flex:1,overflowY:"auto",padding:"1.25rem 1rem"}}>
                {messages.map((msg,i)=>{
                  const isU=msg.role==="user";
                  return (
                    <div key={i} style={{display:"flex",justifyContent:isU?"flex-end":"flex-start",marginBottom:"1.25rem"}}>
                      {!isU&&<div style={{width:24,height:24,flexShrink:0,marginRight:9,marginTop:2,background:"#e8ffe8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:500,color:"#080808",boxShadow:"0 0 10px rgba(200,255,200,0.2)"}}>M</div>}
                      <div style={{maxWidth:"78%",background:isU?"#141414":"#0e0e0e",border:`1px solid ${isU?"#222":"#161616"}`,padding:"10px 13px",fontSize:12,lineHeight:1.7,color:isU?"#909090":"#b0b0a8"}}>
                        {isU?msg.content:<div dangerouslySetInnerHTML={{__html:md(msg.content)}}/>}
                      </div>
                    </div>
                  );
                })}
                {loading&&(
                  <div style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:"1.25rem"}}>
                    <div style={{width:24,height:24,flexShrink:0,background:"#e8ffe8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#080808",boxShadow:"0 0 10px rgba(200,255,200,0.2)"}}>M</div>
                    <div style={{background:"#0e0e0e",border:"1px solid #161616",padding:"10px 13px"}}><div className="blink"><span/><span/><span/></div></div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>
              <div style={{padding:"10px 12px",background:"#0a0a0a",borderTop:"1px solid #161616"}}>
                {!mod.free && !hasPaid ? (
                  <div style={{padding:"12px 14px",border:"1px solid #1e2a1e",background:"rgba(232,255,232,0.02)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:10,color:"#999"}}>Requiere paquete activo</div>
                    <button onClick={onBack} style={{background:"#e8ffe8",border:"none",color:"#080808",fontSize:8,letterSpacing:2,padding:"7px 14px",fontFamily:"'DM Mono',monospace",cursor:"pointer"}}>Comprar →</button>
                  </div>
                ) : (
                  <>
                    <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                      <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                        rows={2} placeholder="Responde a INNOFY..."
                        style={{flex:1,resize:"none",background:"#0e0e0e",border:"1px solid #1e1e1e",color:"#b0b0a8",fontSize:11,padding:"9px 11px",lineHeight:1.5,outline:"none",fontFamily:"'DM Mono',monospace"}}/>
                      <button onClick={sendMessage} disabled={!input.trim()||loading}
                        style={{background:"#e8ffe8",border:"none",color:"#080808",fontSize:11,padding:"9px 16px",alignSelf:"stretch",boxShadow:"0 0 14px rgba(200,255,200,0.18)",opacity:(!input.trim()||loading)?.4:1,cursor:(!input.trim()||loading)?"not-allowed":"pointer",transition:"opacity .2s"}}>→</button>
                    </div>
                    <div style={{fontSize:7,color:"#161616",letterSpacing:1,marginTop:4}}>SHIFT+ENTER NUEVA LÍNEA · MÁX 2 PREGUNTAS POR TURNO</div>
                  </>
                )}
              </div>
            </div>
          )}

          {panel==="canvas" && (
            <div style={{flex:1,overflowY:"auto",padding:"1.25rem"}}>
              <div style={{fontSize:8,color:"#e8ffe8",letterSpacing:3,textTransform:"uppercase",marginBottom:14,textShadow:"0 0 6px rgba(200,255,200,0.3)"}}>Canvas Maestro</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {BMC.map((b,i)=>{const v=canvas[i]||null;return(
                  <div key={i} style={{background:"#0e0e0e",border:`1px solid ${v?"#1a2a1a":"#1a1a1a"}`,padding:"7px 9px"}}>
                    <div style={{fontSize:7,color:"#e8ffe8",letterSpacing:2,textTransform:"uppercase",marginBottom:4,opacity:.5}}>{b}</div>
                    <div style={{fontSize:9,color:v?"#888":"#1e1e1e",lineHeight:1.5}}>{v||"—"}</div>
                  </div>
                );})}
              </div>
            </div>
          )}

          {panel==="entregas" && (
            <div style={{flex:1,overflowY:"auto",padding:"1.25rem"}}>
              <div style={{fontSize:8,color:"#e8ffe8",letterSpacing:3,textTransform:"uppercase",marginBottom:14,textShadow:"0 0 6px rgba(200,255,200,0.3)"}}>
                Entregables · {allDels.length} generados
              </div>
              {allDels.length===0
                ?<div style={{fontSize:10,color:"#1e1e1e",lineHeight:2}}>Los entregables aparecen al completar cada módulo.</div>
                :allDels.map((d,i)=>(
                  <div key={i} style={{borderLeft:`2px solid ${openDel[i]?"#e8ffe8":"#1a1a1a"}`,marginBottom:3,boxShadow:openDel[i]?"-2px 0 8px rgba(200,255,200,0.07)":"none"}}>
                    <div onClick={()=>setOpenDel(p=>({...p,[i]:!p[i]}))}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",cursor:"pointer"}}>
                      <div style={{fontSize:8,color:"#e8ffe8",letterSpacing:2,textShadow:"0 0 5px rgba(200,255,200,0.3)"}}>{MODULES[d.mi]?.code}</div>
                      <div style={{flex:1,fontSize:9,color:"#888",letterSpacing:1}}>Entregable {d.i+1} — {MODULES[d.mi]?.name}</div>
                      <div style={{fontSize:10,color:"#222",transform:openDel[i]?"rotate(90deg)":"none",transition:"transform .2s"}}>›</div>
                    </div>
                    {openDel[i]&&<div style={{padding:"10px 14px",background:"#0d0d0d",borderTop:"1px solid #161616",fontSize:11,color:"#888",lineHeight:1.7}} dangerouslySetInnerHTML={{__html:md(d.t)}}/>}
                  </div>
                ))
              }
              {allDels.length>0&&(
                <button onClick={()=>{
                  const txt=allDels.map(d=>`\n\n=== ${MODULES[d.mi]?.code} ${MODULES[d.mi]?.name} — Entregable ${d.i+1} ===\n${d.t}`).join("");
                  const a=document.createElement("a");
                  a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain"}));
                  a.download=`INNOFY_${project.business}_entregables.txt`;a.click();
                }} style={{marginTop:14,background:"transparent",border:"1px solid #1e2a1e",color:"#e8ffe8",fontSize:8,letterSpacing:2,textTransform:"uppercase",padding:"10px 14px",width:"100%",fontFamily:"'DM Mono',monospace",cursor:"pointer",textShadow:"0 0 5px rgba(200,255,200,0.25)"}}>
                  Exportar entregables →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP — orquesta todas las pantallas
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [quota, setQuota] = useState({ used:0, max:0, packageId:0, remaining:0 });
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    // Handle Google OAuth callback — lee token de la URL
    if (window.location.pathname === "/auth/callback") {
      const params = new URLSearchParams(window.location.search);
      const tok = params.get("token");
      const userStr = params.get("user");
      if (tok && userStr) {
        try {
          const u = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem("innofy_token", tok);
          localStorage.setItem("innofy_user", JSON.stringify(u));
          window.history.replaceState({}, "", "/");
          setToken(tok); setUser(u);
          setScreen(u.projectsMax > 0 ? "projects" : "packages");
          return;
        } catch(e) {}
      }
    }
    // Sesión guardada
    const t = localStorage.getItem("innofy_token");
    const u = localStorage.getItem("innofy_user");
    if (t && u) {
      setToken(t); setUser(JSON.parse(u));
      setScreen("projects");
    }
  }, []);

  useEffect(() => {
    if (token) loadQuota();
  }, [token]);

  const loadQuota = async () => {
    try {
      const data = await apiFetch("/api/projects", {}, token);
      setQuota(data.quota);
    } catch(e) {}
  };

  const handleAuth = (tok, u) => {
    localStorage.setItem("innofy_token", tok);
    localStorage.setItem("innofy_user", JSON.stringify(u));
    setToken(tok); setUser(u);
    setScreen(u.projects_max > 0 ? "projects" : "packages");
  };

  const handlePurchased = (data) => {
    setQuota(q => ({ ...q, max: data.projectsMax, packageId: data.packageId, remaining: data.projectsMax - q.used }));
    setScreen("projects");
    loadQuota();
  };

  const handleOpenProject = async (proj) => {
    // Cargar proyecto completo si solo tenemos el resumen
    try {
      const full = await apiFetch(`/api/projects/${proj.id}`, {}, token);
      setActiveProject(full);
    } catch(e) { setActiveProject(proj); }
    setScreen("chat");
  };

  const logout = () => {
    localStorage.removeItem("innofy_token");
    localStorage.removeItem("innofy_user");
    setToken(null); setUser(null); setScreen("auth");
  };

  if (screen === "auth") return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <AuthScreen onAuth={handleAuth} />
    </>
  );

  if (screen === "packages") return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <PackagesScreen token={token} user={user} onPurchased={handlePurchased} onSkip={()=>setScreen("projects")} />
    </>
  );

  if (screen === "upgrade") return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <UpgradeScreen token={token} user={user} currentPackageId={quota.packageId}
        onUpgraded={handlePurchased} onBack={()=>setScreen("projects")} />
    </>
  );

  if (screen === "chat" && activeProject) return (
    <ProjectScreen token={token} user={user} project={activeProject}
      hasPaid={quota.max > 0}
      onBack={()=>{ setScreen("projects"); loadQuota(); }}
      onSave={()=>{}} />
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <ProjectsDashboard token={token} user={user} quota={quota}
        onOpenProject={handleOpenProject}
        onNewProject={()=>{}}
        onUpgrade={()=>setScreen(quota.packageId > 0 ? "upgrade" : "packages")} />
    </>
  );
}
