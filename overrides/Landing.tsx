import { useMemo, useState } from "react";
import { Search, Shuffle, ArrowDownRight, ArrowUpRight, MoveUpRight, X, Sparkles, ZoomIn, ZoomOut, Maximize2, BookOpen, Network, AudioLines, Compass, ArrowLeft, ArrowRight } from "lucide-react";
import { Work, Settings, byNew, date, tags, norm } from "../lib/archive/reader";

type View = "archive" | "echo" | "lexicon" | "journey";
const STOP = new Set(("и в во не на я мы вы он она оно они ты вы это этот эта эти тот та те а но или да же ли бы из к по от до за под над при для без как что где когда если то так уже ещё еще был была были быть есть нет мне меня тебе тебя его ее её их нас вам с со у о об обо про приже".split(/\\s+/u)));
function cleanText(value: string) { return norm(value).toLocaleLowerCase("ru").replace(/ё/gu, "е"); }
function wordsOf(value: string) { return cleanText(value).match(/[\p{L}\p{N}]+/gu) || []; }
function excerptOf(value: string, limit = 190) { const clean = value.replace(/\s+/gu, " ").trim(); return clean.length > limit ? clean.slice(0, limit).replace(/\\s+\\S*$/u, "") + "…" : clean; }
function hash(value: string) { let h = 0; for (let i=0;i<value.length;i++) h = (h*31 + value.charCodeAt(i))|0; return Math.abs(h); }
function similarity(a: Set<string>, b: Set<string>) { let common=0; a.forEach(x=>{if(b.has(x))common++}); return common / Math.max(1, Math.sqrt(a.size*b.size)); }

export default function Landing({ works, settings }: { works: Work[]; settings: Settings }) {
  const sorted = useMemo(() => [...works].sort(byNew), [works]);
  const [view,setView] = useState<View>("archive");
  const [query,setQuery] = useState("");
  const [activeTag,setActiveTag] = useState("");
  const [currentId,setCurrentId] = useState<string | null>(null);
  const [echoTerm,setEchoTerm] = useState("");
  const [zoom,setZoom] = useState(1);
  const [offset,setOffset] = useState({x:0,y:0});
  const [drag,setDrag] = useState<{x:number;y:number;ox:number;oy:number}|null>(null);
  const [journey,setJourney] = useState<string[]>([]);
  const [journeyStep,setJourneyStep] = useState(0);
  const [lexQuery,setLexQuery] = useState("");
  const [featuredId,setFeaturedId] = useState<string | null>(null);
  const current = sorted.find(w=>w.id===currentId) || null;
  const featured = sorted.find(w=>w.id===featuredId) || sorted[0];

  const tagCounts = useMemo(() => {
    const counts = new Map<string,number>();
    works.forEach(w=>tags(w,settings).forEach(t=>counts.set(t,(counts.get(t)||0)+1)));
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]);
  },[works,settings]);

  const filtered = useMemo(() => {
    const needle=cleanText(query.trim());
    return sorted.filter(w=>(!activeTag||tags(w,settings).includes(activeTag)) && (!needle||cleanText(w.title+" "+w.text+" "+tags(w,settings).join(" ")).includes(needle)));
  },[sorted,query,activeTag,settings]);

  const tokenData = useMemo(() => {
    const counts = new Map<string,number>();
    const docs = new Map<string,Set<string>>();
    works.forEach(w=>{
      const unique=new Set(wordsOf(w.text).filter(x=>x.length>2&&!STOP.has(x)));
      unique.forEach(x=>{counts.set(x,(counts.get(x)||0)+1);if(!docs.has(x))docs.set(x,new Set());docs.get(x)!.add(w.id);});
    });
    return [...counts.entries()].map(([word,count])=>({word,count,docs:docs.get(word)?.size||0})).sort((a,b)=>b.count-a.count);
  },[works]);
  const lexFiltered = tokenData.filter(x=>!lexQuery||x.word.includes(cleanText(lexQuery))).slice(0,80);

  const echoResults = useMemo(()=>{
    const term=cleanText(echoTerm.trim());
    if(!term)return [];
    return works.filter(w=>w.id!==currentId).map(w=>{
      const lines=w.text.split("\\n");
      const found=lines.map(line=>({line,count:cleanText(line).split(escaped).length-1})).filter(x=>x.count>0);
      return {work:w,found,count:found.reduce((s,x)=>s+x.count,0)};
    }).filter(x=>x.count).sort((a,b)=>b.count-a.count);
  },[works,echoTerm,currentId]);

  const workTokens = useMemo(()=>new Map(works.map(w=>[w.id,new Set(wordsOf(w.text).filter(x=>x.length>3&&!STOP.has(x)))])),[works]);
  const buildJourney = (start: Work) => {
    const chosen=[start.id]; let prev=start;
    for(let i=0;i<Math.min(5,works.length-1);i++){
      const a=workTokens.get(prev.id)||new Set<string>();
      const next=works.filter(w=>!chosen.includes(w.id)).map(w=>({w,score:similarity(a,workTokens.get(w.id)||new Set<string>())})).sort((x,y)=>y.score-x.score)[0];
      if(!next||next.score===0)break;
      chosen.push(next.w.id);prev=next.w;
    }
    setJourney(chosen);setJourneyStep(0);setView("journey");
  };
  const openWork=(id:string)=>{setCurrentId(id);setView("archive");};
  const pickRandom=()=>{const pool=sorted.filter(w=>w.id!==featured?.id);setFeaturedId((pool[Math.floor(Math.random()*Math.max(1,pool.length))]||sorted[0])?.id||null);};

  const nodePositions = useMemo(()=>filtered.map((w,i)=>{
    const angle=i*2.3999632297, radius=70+Math.sqrt(i+1)*42;
    const jitter=hash(w.id)%31;
    return {w,x:690+Math.cos(angle)*(radius+jitter),y:480+Math.sin(angle)*(radius+jitter)*.68};
  }),[filtered]);

  return <main className="assiris-shell">
    <section className="assiris-hero">
      <div className="assiris-hero-meta"><span>ASSIRIS / АРХИВ ТЕКСТОВ</span><span>ПОЭЗИЯ И ПРОЗА · {works.length} ПРОИЗВЕДЕНИЙ</span></div>
      <div className="assiris-hero-title"><h1>Александр<br/><em>Андрианов</em></h1><p>Не линейное чтение.<br/>Тексты, которые открывают друг друга.</p></div>
      <div className="assiris-hero-foot"><span>СЛОВО ЗА СЛОВОМ</span><button onClick={()=>document.getElementById("assiris-workspace")?.scrollIntoView({behavior:"smooth"})}>ВОЙТИ В АРХИВ <ArrowDownRight size={16}/></button></div>
    </section>

    <section className="assiris-workspace" id="assiris-workspace">
      <div className="assiris-workspace-head"><div><span className="assiris-eyebrow">ЕДИНОЕ ПРОСТРАНСТВО</span><h2>Поле текстов</h2></div><div className="assiris-total"><strong>{works.length}</strong><span>ПРОИЗВЕДЕНИЙ</span></div></div>
      <nav className="assiris-tabs" aria-label="Разделы архива">
        <button className={view==="archive"?"active":""} onClick={()=>setView("archive")}><Network size={16}/> Архив-карта</button>
        <button className={view==="echo"?"active":""} onClick={()=>setView("echo")}><AudioLines size={16}/> Эхо</button>
        <button className={view==="lexicon"?"active":""} onClick={()=>setView("lexicon")}><BookOpen size={16}/> Словарь</button>
        <button className={view==="journey"?"active":""} onClick={()=>setView("journey")}><Compass size={16}/> Путешествие</button>
      </nav>

      {view==="archive" && <div className="assiris-panel">
        <div className="assiris-tools"><label className="assiris-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Искать по словам, строкам и названиям…"/>{query&&<button onClick={()=>setQuery("")}><X size={16}/></button>}</label><div className="assiris-zoom"><button onClick={()=>setZoom(z=>Math.max(.55,z-.15))} aria-label="Уменьшить"><ZoomOut/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(1.8,z+.15))} aria-label="Увеличить"><ZoomIn/></button><button onClick={()=>{setZoom(1);setOffset({x:0,y:0})}} aria-label="Сбросить карту"><Maximize2/></button></div></div>
        <div className="assiris-filter-tags"><button className={!activeTag?"active":""} onClick={()=>setActiveTag("")}>Все темы</button>{tagCounts.slice(0,14).map(([t,n])=><button key={t} className={activeTag===t?"active":""} onClick={()=>setActiveTag(activeTag===t?"":t)}>{t}<small>{n}</small></button>)}</div>
        <div className="assiris-map-legend"><span>ПЕРЕМЕЩАЙ КАРТУ · ПРИБЛИЖАЙ И ИЗУЧАЙ</span><span>{filtered.length} / {works.length} ТЕКСТОВ</span></div>
        <div className="assiris-map-viewport" onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(.55,Math.min(1.8,z+(e.deltaY<0?.08:-.08))))}} onPointerDown={e=>{if((e.target as HTMLElement).closest("button"))return;setDrag({x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y});(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag)setOffset({x:drag.ox+e.clientX-drag.x,y:drag.oy+e.clientY-drag.y})}} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}>
          <div className="assiris-map-world" style={{transform:"translate("+offset.x+"px,"+offset.y+"px) scale("+zoom+")"}}>
            {nodePositions.map(({w,x,y},i)=><button key={w.id} className={"assiris-map-node tone-"+(hash(w.id)%5)} style={{left:x,top:y}} onClick={()=>openWork(w.id)}><span>{String(i+1).padStart(3,"0")}</span><strong>{w.title}</strong><small>{w.isProse?"ПРОЗА":w.isMiniature?"МИНИАТЮРА":"СТИХИ"}</small></button>)}
          </div>
          {!filtered.length&&<div className="assiris-map-empty">Ничего не найдено. Измени запрос или тему.</div>}
        </div>
        <div className="assiris-map-foot"><span>Каждая точка — отдельное произведение</span><button onClick={()=>{setQuery("");setActiveTag("");setZoom(1);setOffset({x:0,y:0})}}>Сбросить карту <X size={14}/></button></div>
      </div>}

      {view==="echo" && <div className="assiris-panel assiris-analysis">
        <div className="assiris-section-intro"><span className="assiris-eyebrow">БУКВАЛЬНЫЕ ПЕРЕКЛИЧКИ</span><h3>Одно слово<br/><em>встречается снова.</em></h3><p>Введи слово или короткое выражение. Мы покажем точные текстовые совпадения в других произведениях — без трактовок и догадок.</p></div>
        <label className="assiris-search assiris-wide-search"><Search/><input value={echoTerm} onChange={e=>setEchoTerm(e.target.value)} placeholder="Например: море, тишина, дорога…"/>{echoTerm&&<button onClick={()=>setEchoTerm("")}><X/></button>}</label>
        {echoTerm&&<div className="assiris-echo-summary"><strong>{echoResults.reduce((s,x)=>s+x.count,0)}</strong><span>СОВПАДЕНИЙ В {echoResults.length} ПРОИЗВЕДЕНИЯХ</span></div>}
        <div className="assiris-echo-visual">{echoResults.slice(0,24).map((item,i)=><button key={item.work.id} className="assiris-echo-node" onClick={()=>openWork(item.work.id)}><span className="assiris-echo-line" style={{width:Math.max(12,Math.min(100,item.count*18))+"%"}}/><small>{String(i+1).padStart(2,"0")} · {item.count}×</small><strong>{item.work.title}</strong><span>{excerptOf(item.found[0]?.line||"",130)}</span></button>)}{echoTerm&&!echoResults.length&&<p className="assiris-muted">Точных совпадений не найдено.</p>}</div>
      </div>}

      {view==="lexicon" && <div className="assiris-panel assiris-analysis">
        <div className="assiris-section-intro"><span className="assiris-eyebrow">ЛЕКСИЧЕСКИЙ СЛОЙ КОРПУСА</span><h3>Словарь<br/><em>внутри текстов.</em></h3><p>Частотность слов и распределение по произведениям. Служебные слова исключены; словоформы пока считаются отдельно.</p></div>
        <div className="assiris-lex-stats"><div><strong>{tokenData.length.toLocaleString("ru-RU")}</strong><span>РАЗНЫХ СЛОВ</span></div><div><strong>{tokenData.reduce((s,x)=>s+x.count,0).toLocaleString("ru-RU")}</strong><span>УПОТРЕБЛЕНИЙ</span></div><div><strong>{works.length}</strong><span>ТЕКСТОВ</span></div></div>
        <label className="assiris-search assiris-wide-search"><Search/><input value={lexQuery} onChange={e=>setLexQuery(e.target.value)} placeholder="Найти слово в словаре…"/>{lexQuery&&<button onClick={()=>setLexQuery("")}><X/></button>}</label>
        <div className="assiris-lex-grid">{lexFiltered.map((x,i)=><button key={x.word} onClick={()=>{setEchoTerm(x.word);setView("echo")}}><span>{String(i+1).padStart(2,"0")}</span><strong>{x.word}</strong><i style={{width:Math.max(3,x.count/(tokenData[0]?.count||1)*100)+"%"}}/><small>{x.count} · {x.docs} текстов</small></button>)}</div>
      </div>}

      {view==="journey" && <div className="assiris-panel assiris-analysis">
        <div className="assiris-section-intro"><span className="assiris-eyebrow">МАРШРУТ ПО ТЕКСТОВЫМ ПЕРЕКЛИЧКАМ</span><h3>Переходи<br/><em>по следам слов.</em></h3><p>Маршрут строится по общим значимым словам между произведениями. Это статистическое сходство, не утверждение об авторском замысле.</p></div>
        {!journey.length ? <div className="assiris-journey-start"><p>Выбери начальное произведение — и архив предложит цепочку текстовых соседств.</p><div>{sorted.slice(0,18).map(w=><button key={w.id} onClick={()=>buildJourney(w)}>{w.title}<ArrowUpRight size={14}/></button>)}</div></div> : <div className="assiris-journey-route"><div className="assiris-journey-track">{journey.map((id,i)=>{const w=sorted.find(x=>x.id===id);return w?<button key={id} className={i===journeyStep?"active":""} onClick={()=>setJourneyStep(i)}><span>{String(i+1).padStart(2,"0")}</span><strong>{w.title}</strong></button>:null})}</div><div className="assiris-journey-current"><span className="assiris-eyebrow">ОСТАНОВКА {journeyStep+1} / {journey.length}</span><h4>{sorted.find(w=>w.id===journey[journeyStep])?.title}</h4><p>{excerptOf(sorted.find(w=>w.id===journey[journeyStep])?.text||"",330)}</p><div><button onClick={()=>setJourneyStep(s=>Math.max(0,s-1))} disabled={journeyStep===0}><ArrowLeft/> Назад</button><button onClick={()=>setJourneyStep(s=>Math.min(journey.length-1,s+1))} disabled={journeyStep===journey.length-1}>Дальше <ArrowRight/></button><button onClick={()=>setJourney([])}>Новый маршрут <Shuffle/></button></div><button className="assiris-read-link" onClick={()=>openWork(journey[journeyStep])}>Открыть произведение целиком <MoveUpRight/></button></div></div>}
      </div>}
    </section>

    {featured&&<section className="assiris-random"><div><span className="assiris-eyebrow">СЛУЧАЙНАЯ ВСТРЕЧА</span><h2>{featured.title}</h2><p>{excerptOf(featured.text,260)}</p><button onClick={()=>openWork(featured.id)}>Открыть текст <MoveUpRight/></button></div><button className="assiris-randomize" onClick={pickRandom}><Shuffle/> Другая встреча</button></section>}

    {current&&<div className="assiris-reader-veil" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCurrentId(null)}}><article className="assiris-reader" role="dialog" aria-modal="true" aria-label={current.title}><div className="assiris-reader-top"><span>ASSIRIS · {current.isProse?"ПРОЗА":"ПОЭЗИЯ"}</span><button onClick={()=>setCurrentId(null)} aria-label="Закрыть"><X/></button></div><div className="assiris-reader-meta">{date(current.published,true)}</div><h2>{current.title}</h2><div className="assiris-reader-text">{current.text.split("\\n").map((line,i)=><p key={i}>{line||" "}</p>)}</div><div className="assiris-reader-actions"><button onClick={()=>{setEchoTerm(current.text.trim().split(/\\s+/u)[0]||"");setCurrentId(null);setView("echo")}}><AudioLines/> Найти эхо первого слова</button><button onClick={()=>buildJourney(current)}><Compass/> Путешествие от этого текста</button></div></article></div>}
  </main>;
}
