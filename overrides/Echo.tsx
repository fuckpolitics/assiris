import { useMemo, useState } from "react";
import { ArrowUpRight, Link2, X } from "lucide-react";
import { Work, norm, urlOf } from "../lib/archive/reader";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

export default function Echo({
  phrase,
  works,
  currentId,
  onClose,
}: {
  phrase: string;
  works: Work[];
  currentId: string;
  onClose: () => void;
}) {
  const results = useMemo(() => {
    const needle = norm(phrase.trim()).replace(/\s+/gu, " ");
    if (!needle) return [];
    const isPhrase = /\s/u.test(needle);
    const source = escapeRegExp(needle).replaceAll("е", "[её]").replaceAll(" ", "\\s+");
    const pattern = isPhrase
      ? new RegExp(source, "giu")
      : new RegExp(`(^|[^\\p{L}\\p{N}_])(${source})(?=$|[^\\p{L}\\p{N}_])`, "giu");
    return works
      .filter((work) => work.id !== currentId)
      .map((work) => {
        const lines = work.text.split("\n");
        const allMatches = [...norm(work.text).matchAll(new RegExp(pattern.source, "giu"))];
        const matches: { line: string; index: number; count: number }[] = [];
        let offset = 0;
        lines.forEach((line, index) => {
          const found = allMatches.filter((match) => (match.index ?? -1) >= offset && (match.index ?? -1) < offset + Math.max(1, line.length)).length;
          if (found) matches.push({ line, index, count: found });
          offset += line.length + 1;
        });
        return { work, matches, count: matches.reduce((sum, item) => sum + item.count, 0) };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.work.order - b.work.order);
  }, [phrase, works, currentId]);

  const [yearFilter, setYearFilter] = useState("");
  const years = useMemo(() => {
    const counts = new Map<string, number>();
    results.forEach(({ work, count }) => {
      const year = work.published?.slice(0, 4);
      if (year) counts.set(year, (counts.get(year) || 0) + count);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [results]);
  const total = results.reduce((sum, item) => sum + item.count, 0);
  const visibleResults = yearFilter ? results.filter(({ work }) => work.published?.startsWith(yearFilter)) : results;
  const maxYearCount = Math.max(1, ...years.map(([, count]) => count));
  return (
    <div className="echo-veil" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="echo-panel" role="dialog" aria-modal="true" aria-label="Текстовые переклички">
        <div className="echo-topline"><span><Link2 size={15}/> ТЕКСТОВЫЕ ПЕРЕКЛИЧКИ</span><button className="iconbtn" onClick={onClose} aria-label="Закрыть"><X/></button></div>
        <div className="echo-heading"><span className="echo-kicker">НАЙДЕНО В АРХИВЕ</span><h2>«{phrase}»</h2><p>{total ? (yearFilter ? `${visibleResults.length} произведений · ${yearFilter} год` : `${total} ${total === 1 ? "совпадение" : "совпадений"} в ${results.length} ${results.length === 1 ? "произведении" : "произведениях"}`) : "Других точных совпадений не найдено"}</p></div>
        {years.length > 1 && <div className="echo-years">
          <div className="echo-years-head"><span>ГОДЫ ПУБЛИКАЦИИ</span><button onClick={() => setYearFilter("")} className={!yearFilter ? "active" : ""}>Все годы</button></div>
          <div className="echo-year-list">{years.map(([year, count]) => <button key={year} className={yearFilter === year ? "active" : ""} onClick={() => setYearFilter(yearFilter === year ? "" : year)}><span>{year}</span><i style={{ height: `${Math.max(5, count / maxYearCount * 34)}px` }}/><small>{count}</small></button>)}</div>
        </div>}
        <div className="echo-results">
          {visibleResults.map(({ work, matches, count }) => (
            <a className="echo-result" href={urlOf(work)} key={work.id}>
              <div className="echo-result-meta"><span>{work.isProse ? "ПРОЗА" : work.isMiniature ? "МИНИАТЮРА" : "СТИХОТВОРЕНИЕ"}</span><span>{count} {count === 1 ? "раз" : "раза"}</span></div>
              <h3>{work.title}</h3>
              {matches.slice(0, 3).map((match) => <p className="echo-line" key={match.index}>{match.line.trim() || "…"}</p>)}
              {matches.length > 3 && <small>И ещё {matches.length - 3} строк</small>}
              <span className="echo-open">Открыть произведение <ArrowUpRight size={14}/></span>
            </a>
          ))}
          {!results.length && <div className="echo-empty">В других произведениях эта последовательность слов не встретилась. Можно попробовать выделить одно слово или другую строку.</div>}
        </div>
        <p className="echo-note">Здесь собраны только буквальные совпадения в текстах. Их смысл каждый читатель определяет сам.</p>
      </section>
    </div>
  );
}
