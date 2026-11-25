import { useMemo, useState } from "react";
import { Search, Shuffle, ArrowDownRight, ArrowUpRight, MoveUpRight } from "lucide-react";
import { Work, Settings, byNew, date, tags, urlOf } from "../lib/archive/reader";

export default function Landing({ works, settings }: { works: Work[]; settings: Settings }) {
  const sorted = useMemo(() => [...works].sort(byNew), [works]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const featured = sorted[featuredIndex % Math.max(1, sorted.length)] || works[0];
  const lineGroups = useMemo(() => {
    const groups: string[][] = [];
    let current: string[] = [];
    (featured?.text || "").split("\n").forEach((line) => {
      if (!line.trim()) { if (current.length) groups.push(current); current = []; }
      else current.push(line);
    });
    if (current.length) groups.push(current);
    return groups;
  }, [featured]);
  const excerpt = lineGroups[lineIndex % Math.max(1, lineGroups.length)] || [];
  const counts = new Map<string, number>();
  works.forEach((work) => tags(work, settings).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  const categories = [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,7);
  const nextWork = () => { setFeaturedIndex((v) => (v + 1) % sorted.length); setLineIndex(0); };
  const moveLight = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--px", ((event.clientX-rect.left)/rect.width*100)+"%");
    event.currentTarget.style.setProperty("--py", ((event.clientY-rect.top)/rect.height*100)+"%");
  };
  return <>
    <section className="nocturne" onPointerMove={moveLight}>
      <div className="nocturne-photo"/><div className="nocturne-vignette"/><div className="nocturne-grain"/>
      <div className="nocturne-top"><a href="/" className="nocturne-mark"><span>A</span><i>ASSIRIS</i></a><div className="nocturne-topright"><span>ПОЭЗИЯ · ПРОЗА</span><a href="/library">АРХИВ <ArrowUpRight size={13}/></a></div></div>
      <div className="nocturne-center">
        <div className="nocturne-kicker"><span className="live-dot"/> ТЕКСТЫ АЛЕКСАНДРА АНДРИАНОВА</div>
        <h1>Александр<br/><em>Андрианов</em></h1>
        <div className="nocturne-rule"><span>ASSIRIS</span><i/><span>{works.length.toString().padStart(3,"0")} ТЕКСТОВ</span></div>
        <a className="nocturne-enter" href="/library"><span>Войти в архив</span><b><ArrowDownRight size={19}/></b></a>
      </div>
      <div className="nocturne-edge"><span>01 / {works.length.toString().padStart(3,"0")}</span><i/><span>ЛИРИКА И ПРОЗА</span></div>
      <div className="nocturne-bottom"><span>СЛОВО ОСТАЁТСЯ ОТКРЫТЫМ</span><span>ПРОКРУТИТЕ ВНИЗ ↓</span></div>
    </section>
    {featured && <section className="first-encounter">
      <div className="first-encounter-aside"><span className="micro">01 — ПЕРВАЯ ВСТРЕЧА</span><span className="encounter-vertical">ASSIRIS / {date(featured.published,true)}</span><span className="encounter-index">{String(featuredIndex+1).padStart(2,"0")} <i>/</i> {String(sorted.length).padStart(2,"0")}</span></div>
      <div className="first-encounter-main">
        <div className="encounter-head"><div><span className="micro">СЛУЧАЙНО ВЫБРАННЫЙ ТЕКСТ</span><h2>{featured.title}</h2></div><button className="encounter-swap" onClick={nextWork} aria-label="Другое произведение"><Shuffle size={16}/><span>Другая встреча</span></button></div>
        <div className="encounter-poem" key={featured.id+lineIndex}>{excerpt.map((line,i)=><span key={i}>{line}</span>)}</div>
        <div className="encounter-foot"><button className="encounter-nextline" onClick={()=>setLineIndex((v)=>(v+1)%Math.max(1,lineGroups.length))}>Другие строки ↗</button><a href={urlOf(featured)} className="encounter-read">Читать целиком <MoveUpRight size={15}/></a></div>
      </div>
    </section>}
    <section className="motif-field">
      <div className="motif-intro"><span className="micro">НЕ ПО ПОЛКАМ — ПО ОЩУЩЕНИЯМ</span><h2>Куда приведёт<br/><em>одно слово?</em></h2><p>Выберите мотив — и начните с любого текста. У каждого свой вход.</p></div>
      <div className="motif-list">{categories.map(([category,count],i)=><a key={category} href={`/library?theme=${encodeURIComponent(category)}`} className="motif-link"><span className="motif-no">0{i+1}</span><span className="motif-title">{category}</span><span className="motif-count">{count}</span><ArrowUpRight className="motif-arrow" size={17}/></a>)}</div>
    </section>
    <section className="search-room">
      <div className="search-room-top"><span className="micro">ЕСЛИ В ПАМЯТИ ОСТАЛАСЬ СТРОКА</span><span>ПОИСК ПО ВСЕМ ТЕКСТАМ</span></div>
      <form className="search-room-form" onSubmit={(event)=>{event.preventDefault();location.href="/search?q="+encodeURIComponent(searchText);}}>
        <input aria-label="Поиск по произведениям" value={searchText} onChange={(event)=>setSearchText(event.target.value)} placeholder="Название, слово, фраза…"/>
        <button type="submit" aria-label="Искать"><Search size={21}/><span>Найти</span></button>
      </form>
      <div className="search-room-foot"><span>ПОИСК ПО НАЗВАНИЯМ И ПОЛНОМУ ТЕКСТУ</span><a href="/search">Расширенный поиск <ArrowUpRight size={14}/></a></div>
    </section>
    <section className="last-words">
      <div className="last-words-title"><span className="micro">ПОСЛЕДНИЕ ПУБЛИКАЦИИ</span><h2>Новые<br/><em>поступления</em></h2><a href="/library">Все произведения <ArrowUpRight size={14}/></a></div>
      <div className="last-words-list">{sorted.slice(0,5).map((work,i)=><a href={urlOf(work)} key={work.id}><span className="last-no">0{i+1}</span><strong>{work.title}</strong><time>{date(work.published,true)}</time><ArrowUpRight size={15}/></a>)}</div>
    </section>
  </>;
}