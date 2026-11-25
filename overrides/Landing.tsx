import { useMemo, useState } from "react";
import { Search, Shuffle, ArrowDownRight, ArrowUpRight, MoveUpRight, X, Sparkles } from "lucide-react";
import { Work, Settings, byNew, date, tags, urlOf, norm } from "../lib/archive/reader";

function excerptOf(text: string, limit = 150) {
  const clean = text.replace(/\s+/gu, " ").trim();
  return clean.length > limit ? clean.slice(0, limit).replace(/\s+\S*$/u, "") + "…" : clean;
}

export default function Landing({ works, settings }: { works: Work[]; settings: Settings }) {
  const sorted = useMemo(() => [...works].sort(byNew), [works]);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [showAll, setShowAll] = useState(false);
  const featured = sorted.find((work) => work.id === featuredId) || sorted[0];
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    works.forEach((work) => tags(work, settings).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [works, settings]);
  const filtered = useMemo(() => {
    const needle = norm(query.trim());
    return sorted.filter((work) => {
      const hasTag = !activeTag || tags(work, settings).includes(activeTag);
      const haystack = norm([work.title, work.text, ...(tags(work, settings) || [])].join(" "));
      return hasTag && (!needle || haystack.includes(needle));
    });
  }, [sorted, query, activeTag, settings]);
  const visible = showAll ? filtered : filtered.slice(0, 72);
  const pickRandom = () => {
    if (!sorted.length) return;
    const pool = sorted.filter((work) => work.id !== featured?.id);
    const next = pool[Math.floor(Math.random() * Math.max(1, pool.length))] || sorted[0];
    setFeaturedId(next.id);
  };
  const clearFilters = () => { setQuery(""); setActiveTag(""); setShowAll(false); };
  return (
    <main className="assiris-world">
      <section className="nocturne" aria-label="ASSIRIS">
        <div className="nocturne-photo" />
        <div className="nocturne-vignette" />
        <div className="nocturne-grain" />
        <div className="nocturne-center">
          <div className="nocturne-kicker"><span className="live-dot" /> ПОЭЗИЯ И ПРОЗА · {works.length} ПРОИЗВЕДЕНИЙ</div>
          <h1>Александр<br /><em>Андрианов</em></h1>
          <div className="nocturne-rule"><span>ASSIRIS</span><i /><span>ТЕКСТЫ ДЛЯ ЧТЕНИЯ И ОТКРЫТИЙ</span></div>
          <a className="nocturne-enter" href="#atlas"><span>Войти в пространство текстов</span><b><ArrowDownRight size={19} /></b></a>
        </div>
        <div className="nocturne-edge"><span>СЛОВО ЗА СЛОВОМ</span><i /><span>АРХИВ / {String(works.length).padStart(3, "0")}</span></div>
        <div className="nocturne-bottom"><span>НЕ ЛИНЕЙНОЕ ЧТЕНИЕ</span><span>ПРОКРУТИТЕ ВНИЗ ↓</span></div>
      </section>

      {featured && <section className="encounter-stage">
        <div className="encounter-stage-label"><span>СЛУЧАЙНАЯ ВСТРЕЧА</span><span>{date(featured.published, true)}</span></div>
        <div className="encounter-stage-content">
          <div className="encounter-stage-index"><span>ТЕКСТ</span><strong>{String(sorted.findIndex((w) => w.id === featured.id) + 1).padStart(3, "0")}</strong><i> / {String(works.length).padStart(3, "0")}</i></div>
          <div className="encounter-stage-poem">
            <span className="micro">СЕЙЧАС МОЖНО НАЧАТЬ ОТСЮДА</span>
            <h2>{featured.title}</h2>
            <p>{excerptOf(featured.text, 280)}</p>
            <div className="encounter-stage-actions"><a href={urlOf(featured)}>Читать целиком <MoveUpRight size={15} /></a><button onClick={pickRandom}><Shuffle size={15} /> Другая встреча</button></div>
          </div>
        </div>
      </section>}

      <section className="atlas-section" id="atlas">
        <div className="atlas-heading">
          <div><span className="micro">КОРПУС ПРОИЗВЕДЕНИЙ</span><h2>Не полки.<br /><em>Поле текстов.</em></h2><p>Каждое название — отдельный вход. Ищи по словам, выбирай тему или просто блуждай.</p></div>
          <div className="atlas-count"><strong>{filtered.length}</strong><span>ИЗ {works.length} ТЕКСТОВ</span></div>
        </div>
        <div className="atlas-tools">
          <label className="atlas-search"><Search size={18} /><input value={query} onChange={(e) => { setQuery(e.target.value); setShowAll(false); }} placeholder="Слово, строка или название…" aria-label="Поиск по архиву" />{query && <button onClick={() => setQuery("")} aria-label="Очистить поиск"><X size={16} /></button>}</label>
          <button className="atlas-random" onClick={pickRandom}><Sparkles size={15} /> Случайный текст</button>
        </div>
        <div className="atlas-tags">
          <button className={!activeTag ? "active" : ""} onClick={() => setActiveTag("")}>Все темы <small>{works.length}</small></button>
          {tagCounts.slice(0, 12).map(([tag, count]) => <button key={tag} className={activeTag === tag ? "active" : ""} onClick={() => setActiveTag(activeTag === tag ? "" : tag)}>{tag}<small>{count}</small></button>)}
        </div>
        {(query || activeTag) && <div className="atlas-filter-state"><span>{query ? <>Поиск: «{query}»</> : activeTag}</span><button onClick={clearFilters}>Сбросить <X size={13} /></button></div>}
        <div className="atlas-field" aria-label="Произведения">
          {visible.map((work, index) => {
            const workTags = tags(work, settings);
            const year = work.published?.slice(0, 4) || "";
            const tone = index % 7;
            return <a key={work.id} href={urlOf(work)} className={`atlas-node atlas-node-${tone}`} style={{ "--node-order": index } as React.CSSProperties} title={excerptOf(work.text, 180)}>
              <span className="atlas-node-meta">{year} <i>·</i> {work.isProse ? "ПРОЗА" : work.isMiniature ? "МИНИАТЮРА" : "СТИХИ"}</span>
              <strong>{work.title}</strong>
              <span className="atlas-node-excerpt">{excerptOf(work.text, 105)}</span>
              {workTags[0] && <small>{workTags[0]}</small>}
            </a>;
          })}
          {!visible.length && <div className="atlas-empty">Ничего не нашлось. Попробуй другое слово или сними фильтр.</div>}
        </div>
        {filtered.length > visible.length && <button className="atlas-more" onClick={() => setShowAll(true)}>Показать остальные {filtered.length - visible.length} произведений <ArrowDownRight size={16} /></button>}
        {filtered.length > 0 && filtered.length <= 72 && <div className="atlas-endnote">КОНЕЦ ЭТОГО ФРАГМЕНТА АРХИВА <span>·</span> {filtered.length} ПРОИЗВЕДЕНИЙ</div>}
      </section>

      <section className="echo-invitation">
        <div><span className="micro">ЧТЕНИЕ МОЖЕТ ПРОДОЛЖАТЬСЯ</span><h2>Одно слово<br /><em>ведёт к другому.</em></h2></div>
        <p>Выдели слово или фразу внутри произведения — и посмотри, где они встречаются ещё. Только буквальные совпадения в текстах, без навязанных трактовок.</p>
        <a href={featured ? urlOf(featured) : "#atlas"}>Начать читать <MoveUpRight size={15} /></a>
      </section>
    </main>
  );
}
