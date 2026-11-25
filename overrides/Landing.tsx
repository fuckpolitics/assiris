import { useState } from "react";
import { Search, Shuffle } from "lucide-react";
import { Work, Settings, byNew, date, plural, randomWork, tags, urlOf } from "../lib/archive/reader";

export default function Landing({ works, settings }: { works: Work[]; settings: Settings }) {
  const [searchText, setSearchText] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const sorted = [...works].sort(byNew);
  const featuredPool = sorted.slice(0, Math.min(12, sorted.length));
  const featured = featuredPool[featuredIndex % Math.max(1, featuredPool.length)] || works[0];
  const excerpt = featured?.text.split("\n").filter(Boolean).slice(0, 4).join("\n") || "";
  const categoryCounts = new Map<string, number>();
  works.forEach((work) => tags(work, settings).forEach((tag) => categoryCounts.set(tag, (categoryCounts.get(tag) || 0) + 1)));
  const categories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <>
      <section className="opening-scene">
        <div className="opening-image" aria-hidden="true" />
        <div className="opening-grain" aria-hidden="true" />
        <div className="opening-content wrap">
          <div className="opening-overline"><span /> АЛЕКСАНДР АНДРИАНОВ <span>·</span> ASSIRIS</div>
          <h1><span>Слово</span><br/><em>остаётся.</em></h1>
          <p className="opening-subtitle">Стихотворения и проза</p>
          <div className="opening-actions">
            <a className="opening-primary" href="/library">Исследовать произведения <span>↗</span></a>
            <button className="opening-secondary" onClick={() => randomWork(works)}><Shuffle size={15}/> Случайная встреча</button>
          </div>
          <div className="opening-index"><span>АРХИВ</span><strong>{works.length.toString().padStart(3, "0")}</strong><span>ПРОИЗВЕДЕНИЙ</span></div>
        </div>
        <div className="opening-caption">01 — {works.length.toString().padStart(3, "0")} <span>·</span> ТЕКСТЫ АВТОРА</div>
      </section>

      <section className="home-search wrap">
        <div className="home-search-copy"><span className="micro">ЕСЛИ ВЫ ЗНАЕТЕ, ЧТО ИЩЕТЕ</span><h2>Найдите слово.<br/><em>Или целую историю.</em></h2></div>
        <form className="home-search-form" onSubmit={(event) => { event.preventDefault(); location.href = "/search?q=" + encodeURIComponent(searchText); }}>
          <input aria-label="Поиск по произведениям" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Название, слово или строка…"/>
          <button type="submit" aria-label="Искать"><Search size={19}/></button>
        </form>
        <a className="home-search-link" href="/search">Все параметры поиска <span>↗</span></a>
      </section>

      {featured && <section className="encounter wrap">
        <div className="encounter-heading"><div><span className="micro">НЕОЖИДАННОЕ ЗНАКОМСТВО</span><h2>С чего начнётся<br/><em>ваша встреча?</em></h2></div><button className="encounter-refresh" onClick={() => setFeaturedIndex((value) => (value + 1) % Math.max(1, featuredPool.length))}><Shuffle size={15}/> Другой текст</button></div>
        <a className="encounter-card" href={urlOf(featured)}>
          <div className="encounter-art"><span>ASSIRIS</span><i>✳</i></div>
          <div className="encounter-copy"><div className="micro">{featured.isProse ? "ПРОЗА" : featured.isMiniature ? "МИНИАТЮРА" : "СТИХОТВОРЕНИЕ"} <span>·</span> {date(featured.published, true)}</div><h3>{featured.title}</h3><p>{excerpt}</p><span className="encounter-open">Открыть произведение <span>↗</span></span></div>
        </a>
      </section>}

      <section className="directions wrap">
        <div className="section-intro"><span className="micro">РАЗНЫЕ ВХОДЫ В АРХИВ</span><h2>Выберите направление</h2><p>Или позвольте текстам привести вас туда, куда вы не собирались.</p></div>
        <div className="direction-grid">
          {categories.map(([category, count], index) => <a className={`direction direction-${index + 1}`} href={`/library?theme=${encodeURIComponent(category)}`} key={category}><span className="direction-number">0{index + 1}</span><span className="direction-name">{category}</span><span className="direction-count">{count} {plural(count)}</span><span className="direction-arrow">↗</span></a>)}
        </div>
      </section>

      <section className="latest-strip">
        <div className="wrap latest-strip-inner"><div><span className="micro">ПОСЛЕДНИЕ ПУБЛИКАЦИИ</span><h2>Недавно добавлено</h2></div><div className="latest-strip-list">{sorted.slice(0, 4).map((work, index) => <a href={urlOf(work)} key={work.id}><span>0{index + 1}</span><strong>{work.title}</strong><time>{date(work.published, true)}</time><i>↗</i></a>)}</div><a className="all-works-link" href="/library">Весь архив <span>↗</span></a></div>
      </section>
    </>
  );
}
